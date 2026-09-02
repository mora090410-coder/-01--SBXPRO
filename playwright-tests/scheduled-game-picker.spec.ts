import { expect, test, type Page } from '@playwright/test';

const authStorageKey = 'sb-illqymckwqiawdwxhwcy-auth-token';

const installOrganizerSession = async (page: Page) => {
  await page.addInitScript(({ key }) => {
    window.localStorage.setItem(key, JSON.stringify({
      access_token: 'test-access-token',
      refresh_token: 'test-refresh-token',
      expires_at: Math.floor(Date.now() / 1000) + 60 * 60,
      expires_in: 60 * 60,
      token_type: 'bearer',
      user: {
        id: '11111111-1111-4111-8111-111111111111',
        aud: 'authenticated',
        role: 'authenticated',
        email: 'organizer@example.test',
        app_metadata: {},
        user_metadata: {},
        created_at: '2026-07-28T00:00:00.000Z',
      },
    }));
  }, { key: authStorageKey });
};

const upcomingGames = [{
  id: '401772510',
  kickoffAt: '2026-09-13T17:00:00.000Z',
  state: 'pre',
  season: 2026,
  week: 1,
  awayTeam: { abbr: 'DAL', name: 'Dallas Cowboys' },
  homeTeam: { abbr: 'WAS', name: 'Washington Commanders' },
}];

test('board creation is one screen: name, matchup, and no independent date input', async ({ page }) => {
  await installOrganizerSession(page);
  await page.route('**/api/nfl/games?**', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ games: upcomingGames }),
  }));

  await page.goto('/create');

  await expect(page.getByRole('heading', { name: 'Pick the game' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Continue' })).toHaveCount(0);
  await expect(page.getByText('Game date (optional)')).toHaveCount(0);
  await expect(page.getByRole('radio', { name: /DAL.*at.*WAS/i })).not.toBeChecked();

  await page.getByLabel('Board name').fill('Week 1 fundraiser');
  await expect(page.getByRole('button', { name: 'Create board' })).toBeDisabled();

  await page.getByRole('radio', { name: /DAL.*at.*WAS/i }).check();
  await expect(page.getByRole('button', { name: 'Create board' })).toBeEnabled();
});

test('Create board stays disabled until both the name and the matchup are set', async ({ page }) => {
  await installOrganizerSession(page);
  await page.route('**/api/nfl/games?**', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ games: upcomingGames }),
  }));

  await page.goto('/create');
  const create = page.getByRole('button', { name: 'Create board' });
  await expect(create).toBeDisabled();

  await page.getByRole('radio', { name: /DAL.*at.*WAS/i }).check();
  await expect(create).toBeDisabled();

  await page.getByLabel('Board name').fill('Week 1 fundraiser');
  await expect(create).toBeEnabled();
});

test('hidden score-test mode requests at most five completed games', async ({ page }) => {
  await installOrganizerSession(page);
  const scheduleRequest = page.waitForRequest((request) =>
    request.url().includes('/api/nfl/games?')
    && request.url().includes('scope=completed')
    && request.url().includes('limit=5'));
  await page.route('**/api/nfl/games?**', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({
      games: upcomingGames.map((game) => ({ ...game, state: 'post' })),
      scoreTestMode: true,
    }),
  }));

  await page.goto('/create?scoreTest=1');

  await scheduleRequest;
  await expect(page.getByText('Completed-game score test')).toBeVisible();
  await expect(page.getByText(/five most recent final games/i)).toBeVisible();
});

test('score-test query stays on ordinary upcoming UX without server capability', async ({ page }) => {
  await installOrganizerSession(page);
  await page.route('**/api/nfl/games?**', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ games: upcomingGames }),
  }));

  await page.goto('/create?scoreTest=1');

  await expect(page.getByRole('radio', { name: /DAL.*at.*WAS/i })).toBeVisible();
  await expect(page.getByText('Completed-game score test')).toHaveCount(0);
});

test('matchup selection works by keyboard on a phone-sized viewport', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await installOrganizerSession(page);
  await page.route('**/api/nfl/games?**', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ games: upcomingGames }),
  }));

  await page.goto('/create');
  await page.getByLabel('Board name').fill('Keyboard board');

  const matchup = page.getByRole('radio', { name: /DAL.*at.*WAS/i });
  await matchup.focus();
  await page.keyboard.press('Space');

  await expect(matchup).toBeChecked();
  await expect(page.getByRole('button', { name: 'Create board' })).toBeEnabled();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
});
