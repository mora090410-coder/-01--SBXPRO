import { expect, test, type Locator } from '@playwright/test';

test.describe('HomepageV2 Slice12 A1 browser surface', () => {
  test('query cannot enable production root homepage_v2', async ({ page }) => {
    await page.goto('/?homepage_v2=true');
    await expect(page.locator('[data-testid="homepage-v2"]')).toHaveCount(0);
  });

  test('flagged homepage satisfies phone first viewport and has no page overflow', async ({ page }) => {
    expect(process.env.VITE_GRIDONE_HOMEPAGE_V2).toBe('true');
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');

    const hero = page.getByTestId('homepage-v2-first-viewport');
    await expect(hero).toBeVisible();
    await expect(hero.getByRole('heading', { name: /Football-squares fundraiser boards/i })).toBeVisible();
    await expect(hero.getByText(/Build the board, share one link, and let GridOne track game day/i)).toBeVisible();
    await expect(hero.getByRole('link', { name: 'Create your free board' })).toBeVisible();
    await expect(hero.getByRole('link', { name: 'See a live board' })).toBeVisible();
    await expect(hero.getByText('First published board free')).toBeVisible();
    await expect(hero.getByText(/does not collect square money, hold funds, or pay winners/i)).toBeVisible();
    await expect(hero.getByText('Demo board — sample names and scores')).toBeVisible();

    for (const locator of [
      hero.getByRole('heading', { name: /Football-squares fundraiser boards/i }),
      hero.getByText(/Build the board, share one link, and let GridOne track game day/i),
      hero.getByRole('link', { name: 'Create your free board' }),
      hero.getByRole('link', { name: 'See a live board' }),
      hero.getByText('First published board free'),
      hero.getByText(/does not collect square money, hold funds, or pay winners/i),
      hero.getByText('Demo board — sample names and scores'),
    ]) {
      const box = await locator.boundingBox();
      expect(box?.y).toBeGreaterThanOrEqual(0);
      expect((box?.y || 0) + (box?.height || 0)).toBeLessThanOrEqual(844);
    }

    const overflow = await page.evaluate(() => {
      const width = document.documentElement.clientWidth;
      const offenders = Array.from(document.body.querySelectorAll<HTMLElement>('*'))
        .filter((element) => element.getBoundingClientRect().right > width + 1)
        .map((element) => ({ tag: element.tagName, className: String(element.className), right: element.getBoundingClientRect().right }));
      window.scrollTo(999, 0);
      return {
        amount: document.documentElement.scrollWidth - width,
        windowScrollX: window.scrollX,
        offenders,
      };
    });
    expect(overflow.amount, JSON.stringify(overflow)).toBe(0);
    expect(overflow.windowScrollX).toBe(0);
    expect(overflow.offenders).toEqual([]);

    await hero.getByRole('button', { name: 'Game day view' }).click();
    await expect(hero.getByRole('heading', { name: 'Follow on game day' })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBe(0);
  });

  test('desktop first viewport keeps required product truth and proof within 1280 by 720', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/');
    const hero = page.getByTestId('homepage-v2-first-viewport');
    const required: Array<[string, Locator]> = [
      ['heading', hero.getByRole('heading', { name: /Football-squares fundraiser boards/i })],
      ['outcome', hero.getByText(/Build the board, share one link, and let GridOne track game day/i)],
      ['create', hero.getByRole('link', { name: 'Create your free board' })],
      ['demo', hero.getByRole('link', { name: 'See a live board' })],
      ['free', hero.getByText('First published board free')],
      ['boundary', hero.getByText(/does not collect square money, hold funds, or pay winners/i)],
      ['demo', hero.getByText('Demo board — sample names and scores')],
    ];
    for (const [label, locator] of required) {
      const box = await locator.boundingBox();
      expect(box?.y, label).toBeGreaterThanOrEqual(0);
      expect((box?.y || 0) + (box?.height || 0), label).toBeLessThanOrEqual(720);
    }
  });

  test('desktop can switch organizer proof to viewer proof in place', async ({ page }) => {
    await page.goto('/');
    const proof = page.getByTestId('homepage-proof-artifact');
    await expect(proof.getByRole('heading', { name: /Set up the board/i })).toBeVisible();
    await proof.getByRole('button', { name: 'Game day view' }).click();
    await expect(proof.getByRole('heading', { name: /Follow on game day/i })).toBeVisible();
    await expect(proof.getByText(/Your squares · Taylor M\. · 3/i)).toBeVisible();
    await expect(proof.getByText(/What makes Taylor M\. win next\?/i)).toBeVisible();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBe(0);
  });

  test('live-board CTA reaches the existing demo route', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: 'See a live board' }).click();
    await expect(page).toHaveURL(/\/demo$/);
    await expect(page.getByTestId('viewer-first-viewport').getByRole('heading', { name: /Demo: Super Bowl LIX/i })).toBeVisible();
  });

  test('no-JavaScript fallback preserves product truth and actions', async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Football-squares fundraiser boards' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Create your free board' })).toHaveAttribute('href', '/create');
    await expect(page.getByRole('link', { name: 'See a live board' })).toHaveAttribute('href', '/demo');
    await expect(page.getByText(/does not collect square money, hold funds, or pay winners/i)).toBeVisible();
    await context.close();
  });
});
