import { expect, test, type Page } from '@playwright/test';

const authStorageKey = 'sb-illqymckwqiawdwxhwcy-auth-token';
const ownerId = '11111111-1111-4111-8111-111111111111';
const boardId = '22222222-2222-4222-8222-222222222222';

const sessionValue = () => JSON.stringify({
  access_token: 'test-access-token',
  refresh_token: 'test-refresh-token',
  expires_at: Math.floor(Date.now() / 1000) + 60 * 60,
  expires_in: 60 * 60,
  token_type: 'bearer',
  user: {
    id: ownerId,
    aud: 'authenticated',
    role: 'authenticated',
    email: 'organizer@example.test',
    app_metadata: {},
    user_metadata: {},
    created_at: '2026-08-22T00:00:00.000Z',
  },
});

const installOwnerFixture = async (page: Page) => {
  await page.addInitScript(({ key, value }) => {
    window.localStorage.setItem(key, value);
    window.localStorage.setItem('gridone_preview_mode', 'false');
  }, { key: authStorageKey, value: sessionValue() });

  const squares = Array.from({ length: 100 }, (_, index) => index === 0 ? ['Ava'] : ([] as string[]));
  const board = {
    leftAxis: Array(10).fill(null),
    topAxis: Array(10).fill(null),
    squares,
    isDynamic: false,
    allowOpenSquares: true,
    participants: [{ id: 'p1', displayName: 'Ava', publicLabel: 'Ava' }],
  };

  await page.route(`**/api/pools/${boardId}/score`, (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ score: null, winnerHistory: [] }),
  }));
  await page.route(`**/api/pools/${boardId}`, (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({
      id: boardId,
      share_code: 'SHARE123',
      owner_id: ownerId,
      title: 'Organizer V2 Browser Board',
      revision: 1,
      meta: 'Parkside fundraiser',
      gameExternalId: '401772510',
      kickoffAt: '2026-09-13T17:00:00.000Z',
      dates: '2026-09-13',
      leftAbbr: 'DAL',
      leftName: 'Dallas Cowboys',
      topAbbr: 'WAS',
      topName: 'Washington Commanders',
      payoutDescriptions: {},
      board,
      is_activated: false,
      locked: true,
      published_at: null,
      winner_history: [],
      pending_milestones: [],
      notification_delivery_issues: [],
    }),
  }));
  await page.route('**/rest/v1/contest_entries*', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: '[]',
  }));
};

test.describe('organizer_v2 Slice 10 shell', () => {
  test('query cannot enable owner mutation organizer shell', async ({ page }) => {
    await page.goto('/create?organizer_v2=true');
    await expect(page).toHaveURL(/\/login/);
    await expect(page.locator('[data-feature-flag="organizer_v2"]')).toHaveCount(0);
  });

  test('owner shell is enabled only by explicit VITE_GRIDONE_ORGANIZER_V2 process env and contains phone overflow', async ({ page }) => {
    expect(process.env.VITE_GRIDONE_ORGANIZER_V2).toBe('true');
    await page.setViewportSize({ width: 390, height: 844 });
    await installOwnerFixture(page);
    await page.goto(`/boards/${boardId}`);
    const shell = page.locator('[data-feature-flag="organizer_v2"]');
    await expect(shell).toBeVisible();
    await expect(page.getByRole('banner', { name: /organizer task header/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Preview draw/i })).toBeVisible();
    const overflow = await page.evaluate(() => {
      const width = document.documentElement.clientWidth;
      const offenders = Array.from(document.body.querySelectorAll<HTMLElement>('*'))
        .filter((element) => !element.closest('[data-testid="contained-board-overflow"]'))
        .filter((element) => element.getBoundingClientRect().right > width + 1)
        .map((element) => ({ tag: element.tagName, className: element.className, right: element.getBoundingClientRect().right }));
      const boardViewport = document.querySelector<HTMLElement>('[data-testid="contained-board-overflow"]');
      window.scrollTo(999, 0);
      return {
        amount: document.documentElement.scrollWidth - width,
        windowScrollX: window.scrollX,
        bodyScrollWidth: document.body.scrollWidth,
        shellWidth: document.querySelector<HTMLElement>('[data-feature-flag="organizer_v2"]')?.getBoundingClientRect().width,
        boardClientWidth: boardViewport?.clientWidth,
        boardScrollWidth: boardViewport?.scrollWidth,
        offenders,
      };
    });
    expect(overflow.amount, JSON.stringify(overflow)).toBe(0);
    expect(overflow.windowScrollX).toBe(0);
    expect(overflow.offenders).toEqual([]);
    expect(overflow.boardScrollWidth).toBeGreaterThan(overflow.boardClientWidth || 0);
  });
});
