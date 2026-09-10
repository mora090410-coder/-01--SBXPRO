import { expect, test, type Locator } from '@playwright/test';

const essentialScore = async (region: Locator) => {
  for (const text of ['17', '14', '7', '4', 'Taylor M.']) {
    const item = region.getByText(text, { exact: true }).filter({ visible: true }).first();
    await expect(item).toBeVisible();
    expect(await item.evaluate(element => getComputedStyle(element).opacity)).toBe('1');
  }
  await expect(region.getByText(/Currently matching/i).filter({ visible: true }).first()).toBeVisible();
};

for (const width of [320, 390, 768, 1024, 1440]) {
  test(`organizer excerpt stays readable and contained at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto('/');
    const region = page.getByRole('region', { name: 'Sample organizer workspace' });
    await expect(region).toBeVisible();
    await region.scrollIntoViewIfNeeded();
    for (const text of ['Taylor M.', 'OPEN', 'Numbers not drawn']) {
      const label = region.getByText(text, { exact: true }).filter({ visible: true }).first();
      await expect(label).toBeVisible();
      expect(await label.evaluate(element => parseFloat(getComputedStyle(element).fontSize))).toBeGreaterThanOrEqual(14);
    }
    expect(await region.locator('a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])').count()).toBe(0);
    const bounds = await region.boundingBox();
    expect(bounds!.x).toBeGreaterThanOrEqual(0);
    expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(width + 1);
    expect(await region.evaluate(element => element.scrollWidth - element.clientWidth)).toBeLessThanOrEqual(1);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBe(0);
  });
}

test('score explanation loads on intersection and plays only once', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  const imports: string[] = [];
  page.on('request', request => { if (/\/gsap(?:\.js|[-/])/.test(request.url())) imports.push(request.url()); });
  await page.goto('/');
  const explanation = page.locator('[data-score-explanation]');
  await expect(explanation).toHaveAttribute('data-animation', 'idle');
  expect(imports).toHaveLength(0);
  await explanation.evaluate(element => {
    (window as Window & { scoreStates?: string[] }).scoreStates = [];
    new MutationObserver(records => {
      for (const record of records) {
        if (record.attributeName === 'data-animation') {
          (window as Window & { scoreStates?: string[] }).scoreStates!.push(element.getAttribute('data-animation')!);
        }
      }
    }).observe(element, { attributes: true, attributeFilter: ['data-animation'] });
  });
  await explanation.scrollIntoViewIfNeeded();
  await expect(explanation).toHaveAttribute('data-animation', 'complete', { timeout: 10000 });
  expect(imports.length).toBeGreaterThan(0);
  await essentialScore(page.getByRole('region', { name: 'How the score matches a square' }));
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.getByRole('heading', { level: 1 }).scrollIntoViewIfNeeded();
  await explanation.scrollIntoViewIfNeeded();
  await expect(explanation).toHaveAttribute('data-animation', 'complete');
  expect(await page.evaluate(() => (window as Window & { scoreStates?: string[] }).scoreStates!.filter(state => state === 'playing').length)).toBe(1);
});

test('reduced motion keeps the explanation static and never requests GSAP', async ({ browser }) => {
  const context = await browser.newContext({ reducedMotion: 'reduce', viewport: { width: 1280, height: 720 } });
  const page = await context.newPage();
  const imports: string[] = [];
  page.on('request', request => { if (/\/gsap(?:\.js|[-/])/.test(request.url())) imports.push(request.url()); });
  await page.goto('/');
  const explanation = page.locator('[data-score-explanation]');
  await expect(explanation).toHaveAttribute('data-animation', 'static');
  await explanation.scrollIntoViewIfNeeded();
  await essentialScore(page.getByRole('region', { name: 'How the score matches a square' }));
  expect(imports).toHaveLength(0);
  expect(await explanation.evaluate(element => element.getAnimations({ subtree: true }).length)).toBe(0);
  await context.close();
});

test('a failed GSAP download leaves the score explanation complete and readable', async ({ page }) => {
  let blocked = 0;
  await page.route(/\/gsap(?:\.js|[-/])/, route => { blocked += 1; return route.abort(); });
  await page.goto('/');
  const explanation = page.locator('[data-score-explanation]');
  await expect(explanation).toBeVisible();
  await explanation.scrollIntoViewIfNeeded();
  await expect.poll(() => blocked).toBeGreaterThan(0);
  await expect(explanation).toHaveAttribute('data-animation', 'static');
  await essentialScore(page.getByRole('region', { name: 'How the score matches a square' }));
});

test('FAQ answers can be opened and closed with the keyboard', async ({ page }) => {
  await page.goto('/');
  const summary = page.locator('summary').filter({ hasText: 'Do viewers need an account?' });
  await summary.scrollIntoViewIfNeeded();
  await summary.focus();
  await summary.press('Enter');
  await expect(page.getByText(/Viewers open the link without creating an account\. Only the organizer signs in\./)).toBeVisible();
  await summary.press('Enter');
  await expect(page.getByText(/Viewers open the link without creating an account\. Only the organizer signs in\./)).toBeHidden();
});


test('enlarged phone text shows a readable matching square instead of tiny grid cells', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 844 });
  await page.goto('/');
  await page.addStyleTag({ content: 'html { font-size: 200% !important; }' });
  const square = page.getByRole('group', { name: 'Current matching square', exact: true });
  await square.scrollIntoViewIfNeeded();
  await expect(square).toBeVisible();
  await expect(square.getByText('Taylor M.', { exact: true })).toBeVisible();
  await expect(square.getByText('KC 7 × PHI 4', { exact: true })).toBeVisible();
  expect(await square.evaluate(el => el.scrollWidth - el.clientWidth)).toBeLessThanOrEqual(1);
});
