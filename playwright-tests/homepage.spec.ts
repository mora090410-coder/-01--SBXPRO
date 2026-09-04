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

/**
 * Walk the page to the bottom in viewport-sized steps, giving the scroll-driven
 * work (reveals, parallax) two animation frames to apply at each stop. Two
 * frames rather than a fixed sleep, so the walk is as fast as the browser and
 * never papers over a slow condition with a guessed delay.
 */
const scrollThroughPage = async (page: import('@playwright/test').Page) => {
  const settleFrames = () => page.evaluate(() => new Promise<void>((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
  }));
  const height = await page.evaluate(() => document.body.scrollHeight);
  const step = await page.evaluate(() => window.innerHeight);
  for (let offset = 0; offset < height; offset += step) {
    await page.evaluate((y) => window.scrollTo(0, y), offset);
    await settleFrames();
  }
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await settleFrames();
};

/** Computed opacity of the first match, read straight from the rendered style. */
const opacityOf = (locator: Locator) => locator.evaluate((element) => getComputedStyle(element).opacity);

/**
 * One heading per homepage section. Every one of these must be present and
 * fully opaque for a reduced-motion reader who never scrolls.
 */
const SECTION_HEADINGS: Array<[string, RegExp]> = [
  ['hero', /^Build it once\.\s*Share one link\.$/],
  ['score', /^Scores update themselves\.$/],
  ['parent moments', /^Three answers, no scrolling\.$/],
  ['organizer', /^One screen\. No wizard\.$/],
  ['pricing', /^Free to start\. Pay when you publish another\.$/],
  ['close', /^Ready to build the board\?$/],
];

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
  // Wait for the lazy homepage chunk before measuring: the Suspense fallback is
  // a fraction of the real page's height, so scrolling it proves nothing.
  await expect(page.getByTestId('homepage-first-viewport')).toBeVisible();
  await scrollThroughPage(page);
  expect(await overflow(page)).toBe(0);
});

test('page has no horizontal overflow after full scroll on desktop', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto('/');
  // The lazy homepage chunk, not the Suspense fallback — the fallback has its
  // own h1 and its own (much shorter) scroll height.
  await expect(page.getByTestId('homepage-first-viewport')).toBeVisible();
  await scrollThroughPage(page);
  expect(await overflow(page)).toBe(0);
  await page.evaluate(() => window.scrollTo(0, 0));
  expect(await overflow(page)).toBe(0);
});

test('reduced motion shows every section finished, without scrolling', async ({ browser }) => {
  const context = await browser.newContext({ reducedMotion: 'reduce', viewport: { width: 1280, height: 720 } });
  const page = await context.newPage();
  await page.goto('/');

  // No scrolling anywhere in this test. A reduced-motion reader must never be
  // handed a page whose content is waiting on an intersection that only a
  // scroll would produce.
  for (const [section, name] of SECTION_HEADINGS) {
    const heading = page.getByRole('heading', { name }).first();
    await expect(heading, section).toBeVisible();
    // toBeVisible() passes on an opacity-0 element, so read the opacity too:
    // that is the exact way a reveal would strand this content.
    expect(await opacityOf(heading), section).toBe('1');
  }

  expect(await page.locator('[data-reveal="pending"]').count(), 'pending reveals').toBe(0);
  // The contract is stronger than "not pending": under reduced motion Reveal
  // carries no data-reveal attribute at all, so it has no transition either.
  expect(await page.locator('[data-reveal]').count(), 'reveal attributes').toBe(0);

  await context.close();
});

test('a below-fold section reveals to full opacity once scrolled into view', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto('/');
  await expect(page.getByTestId('homepage-first-viewport')).toBeVisible();

  const organizer = page.getByRole('heading', { name: /^One screen\. No wizard\.$/ });
  const revealed = organizer.locator('xpath=ancestor-or-self::*[@data-reveal][1]');

  // Below the fold and never intersected: the reveal is still holding it back.
  // State and opacity are read in one evaluate so the observer cannot fire
  // between the two reads and make the pair disagree.
  await expect.poll(
    () => revealed.evaluate((element) => `${element.getAttribute('data-reveal')}|${getComputedStyle(element).opacity}`),
    { timeout: 5_000 },
  ).toBe('pending|0');

  await organizer.scrollIntoViewIfNeeded();

  // Poll the real computed opacity until the transition finishes. No fixed
  // wait: if the observer never fires, this fails on the timeout instead of
  // being papered over by a sleep that happened to be long enough.
  await expect.poll(() => opacityOf(revealed), { timeout: 5_000 }).toBe('1');
  await expect(organizer).toBeVisible();
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
