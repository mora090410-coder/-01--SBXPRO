import { expect, test, type Locator } from '@playwright/test';

const firstViewport = async (page: import('@playwright/test').Page, height: number) => {
  const hero = page.getByTestId('homepage-first-viewport');
  await expect(hero).toBeVisible();
  const required: Array<[string, Locator]> = [
    ['heading', hero.getByRole('heading', { level: 1 })],
    ['create', hero.getByRole('link', { name: 'Create your free board' })],
    ['demo', hero.getByRole('link', { name: 'See a live board' })],
    ['free', hero.getByText('First published board free')],
    ['boundary', hero.getByText(/does not collect square money, hold funds, adjudicate off-platform payment, or pay winners/i)],
  ];
  for (const [label, locator] of required) {
    const box = await locator.boundingBox();
    expect(box?.y, label).toBeGreaterThanOrEqual(0);
    expect((box?.y || 0) + (box?.height || 0), label).toBeLessThanOrEqual(height);
  }
};

const overflow = (page: import('@playwright/test').Page) => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);

test('phone first viewport holds identity, actions, and the money boundary', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await firstViewport(page, 844);
  expect(await overflow(page)).toBe(0);
});

test('desktop first viewport holds the same and the demo card', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto('/');
  await firstViewport(page, 720);
  await expect(page.getByTestId('homepage-first-viewport').getByText('Demo board — sample names and scores')).toBeVisible();
  expect(await overflow(page)).toBe(0);
});

test('page has no horizontal overflow after full scroll on phone', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  expect(await overflow(page)).toBe(0);
});

test('demo handoff still leads to signup with create intent', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'See a live board' }).first().click();
  await expect(page.getByText('This is a sample board. Ready to run yours?')).toBeVisible();
  await page.getByRole('button', { name: 'Create your free board' }).click();
  await expect(page).toHaveURL(/\/login\?mode=signup&returnTo=%2Fcreate/);
});

test('no-JS fallback keeps the promise, the actions, and the boundary', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Build it once. Share one link.');
  await expect(page.getByRole('link', { name: /Create your free board/i })).toBeVisible();
  await expect(page.getByText(/does not collect square money/i)).toBeVisible();
  await context.close();
});
