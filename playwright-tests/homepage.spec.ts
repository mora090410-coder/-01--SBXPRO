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

/** Two animation frames, so a scroll-driven write has actually landed in style. */
const settleFrames = (page: import('@playwright/test').Page) => page.evaluate(() => new Promise<void>((resolve) => {
  requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
}));

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

/**
 * The three fact lines beside the filling board, copied verbatim from
 * `BoardFillSection`. Duplicated on purpose: these are the product claims the
 * section exists to make, so a silent edit to them should fail here.
 */
const FILL_FACTS = [
  '100 squares. Your group fills them.',
  'OPEN stays visible, so nobody argues about who had what.',
  'Numbers are drawn only once the board is full.',
] as const;

/** A name that is really on the demo board, so "filled" means readable, not just present. */
const FILL_NAME = 'Taylor M.';

const fillSection = (page: import('@playwright/test').Page) => page.getByTestId('board-fill-section');

/**
 * How much of the board has actually landed, read from computed style rather
 * than from markup: a square's opacity and an axis digit's roll are both
 * resolved in CSS from `--fill-progress`, so the DOM looks identical at 0% and
 * at 100% and only the computed values can tell them apart.
 */
const boardState = (page: import('@playwright/test').Page) => page.evaluate(() => {
  const opaque = (selector: string) => Array.from(document.querySelectorAll(selector))
    .filter((element) => getComputedStyle(element).opacity === '1').length;
  const root = document.querySelector('[data-fill]');
  return {
    named: opaque('.board-fill-in'),
    digits: opaque('.board-fill-axis'),
    driven: root !== null,
    progress: root ? Number(getComputedStyle(root).getPropertyValue('--fill-progress')) : null,
  };
});

/**
 * Scroll down in small steps until `--fill-progress` lands inside [lo, hi].
 *
 * Stepped rather than computed: working out the exact offset for a given
 * progress would mean re-implementing `useScrollProgress`'s ramp in the test,
 * and a test that mirrors the code under test agrees with it even when both
 * are wrong. This only walks, and reads what the page reports.
 */
const scrollUntilProgress = async (page: import('@playwright/test').Page, lo: number, hi: number) => {
  for (let step = 0; step < 200; step += 1) {
    const state = await boardState(page);
    if (state.progress !== null && state.progress >= lo && state.progress <= hi) return state;
    if (state.progress !== null && state.progress > hi) {
      throw new Error(`--fill-progress jumped past [${lo}, ${hi}] to ${state.progress}`);
    }
    await page.evaluate(() => window.scrollBy(0, 40));
    await settleFrames(page);
  }
  throw new Error(`--fill-progress never reached [${lo}, ${hi}]`);
};

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

  // A phone has neither the height to pin a 10x10 board usefully nor the
  // patience for a section that holds the scroll, so below `md` the board is
  // never driven and never sticky — it is simply finished. Checked here rather
  // than in its own test because "the board is done" and "the page did not
  // grow sideways" are the same phone scroll.
  const state = await boardState(page);
  expect(state.driven, 'no scroll driver on a phone').toBe(false);
  expect(state.named, 'every square named on a phone').toBe(100);
  const board = fillSection(page).locator('[role="img"]').first();
  expect(
    await board.evaluate((element) => getComputedStyle(element.parentElement!).position),
    'the board is not pinned on a phone',
  ).toBe('static');
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

test('reduced motion hands over a finished board and all three facts, unscrolled', async ({ browser }) => {
  const context = await browser.newContext({ reducedMotion: 'reduce', viewport: { width: 1280, height: 720 } });
  const page = await context.newPage();
  await page.goto('/');
  const section = fillSection(page);
  await expect(section).toBeVisible();

  // Prove the preference actually reached the page before believing a single
  // assertion below it. `test.use({ reducedMotion: 'reduce' })` does NOT apply
  // it in this repo — matchMedia came back false and the whole test quietly
  // measured the animated path instead. A context-level preference plus this
  // line is the only combination that cannot lie.
  expect(
    await page.evaluate(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches),
    'the reduced-motion preference reached the page',
  ).toBe(true);

  // Nothing in this test scrolls. A reader who asked for less motion is handed
  // the finished board on arrival or the section has failed them.
  const state = await boardState(page);
  expect(state.driven, 'no scroll driver is armed').toBe(false);
  expect(state.named, 'every square named').toBe(100);
  expect(state.digits, 'both axis rows drawn').toBe(20);

  // A real name, legible, not merely present in the markup.
  const named = section.locator('.board-fill-in', { hasText: FILL_NAME }).first();
  await expect(named).toBeVisible();
  expect(await opacityOf(named), FILL_NAME).toBe('1');

  for (const fact of FILL_FACTS) {
    const line = section.getByText(fact, { exact: true }).first();
    await expect(line, fact).toBeVisible();
    expect(await opacityOf(line), fact).toBe('1');
  }

  // Pinning a board that is already finished would hold ~1.8 viewports of
  // layout and return nothing, so the sticky class is not applied at all.
  expect(await section.locator('.md\\:sticky').count(), 'sticky wrapper').toBe(0);

  expect(await overflow(page)).toBe(0);
  await context.close();
});

test('scrolling the fill section drives the board from empty to finished', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto('/');
  await expect(page.getByTestId('homepage-first-viewport')).toBeVisible();
  await expect(fillSection(page)).toBeVisible();

  // Armed and waiting: the driver is attached and the board is holding at the
  // start of its own timeline, not already finished.
  const start = await boardState(page);
  expect(start.driven, 'scroll driver armed').toBe(true);
  expect(start.progress, 'progress starts at zero').toBe(0);
  expect(start.named, 'board starts empty').toBe(0);

  // Scrolling — not a timer — is what moves it.
  const midway = await scrollUntilProgress(page, 0.3, 0.8);
  expect(midway.progress, 'scrolling drives progress above zero').toBeGreaterThan(0);
  expect(midway.named, 'squares are landing').toBeGreaterThan(0);

  await scrollThroughPage(page);

  // Poll rather than sleep: if the last frame never lands this fails on the
  // timeout instead of being papered over by a wait that happened to be long
  // enough on this machine.
  await expect.poll(() => boardState(page), { timeout: 5_000 }).toMatchObject({ named: 100, digits: 20 });

  // 1280px, after a full scroll, with a sticky board in the middle of the page.
  expect(await overflow(page)).toBe(0);
});

test('the board fills its squares before a single axis digit is drawn', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto('/');
  await expect(page.getByTestId('homepage-first-viewport')).toBeVisible();
  await expect(fillSection(page)).toBeVisible();

  // The rule the section exists to teach: names go on, numbers come last. Catch
  // the board mid-fill and the squares must be visibly under way while the
  // axes are still blank. An implementation that ramped both together would
  // still end at 100/20 and pass every other test here.
  const midway = await scrollUntilProgress(page, 0.3, 0.8);
  expect(midway.named, `squares partly filled at ${midway.progress}`).toBeGreaterThan(0);
  expect(midway.named, `squares not yet finished at ${midway.progress}`).toBeLessThan(100);
  expect(midway.digits, `no axis digit drawn at ${midway.progress}`).toBe(0);
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
