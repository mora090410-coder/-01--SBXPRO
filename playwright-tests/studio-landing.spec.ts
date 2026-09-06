import { expect, test } from '@playwright/test';

test('viewer questions work with the keyboard without moving the next desktop chapter', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/');
  const controls = page.getByRole('group', { name: 'Explore the viewer' });
  await controls.scrollIntoViewIfNeeded();
  const organizer = page.locator('.studio-organizer');
  const documentTop = () => organizer.evaluate(el => el.getBoundingClientRect().top + window.scrollY);
  const start = await documentTop();
  for (const question of ['Who wins right now?', 'What score wins next?', 'Where are my squares?']) {
    const button = controls.getByRole('button', { name: question });
    await button.focus();
    await button.press('Enter');
    await expect(button).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByRole('heading', { name: question, exact: true })).toBeVisible();
    expect(Math.abs(await documentTop() - start)).toBeLessThan(2);
  }
});

for (const width of [390, 768, 1024, 1101, 1440]) {
  test(`organizer picture contains all 100 squares at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto('/');
    const frame = page.locator('.studio-organizer-preview');
    await frame.scrollIntoViewIfNeeded();
    const squares = frame.locator('button[aria-label^="Square "]');
    await expect(squares).toHaveCount(100);
    await expect.poll(async () => frame.evaluate(el => {
      const frameBox = el.getBoundingClientRect();
      return [...el.querySelectorAll('button[aria-label^="Square "]')].filter(square => {
        const box = square.getBoundingClientRect();
        return box.left >= frameBox.left && box.right <= frameBox.right + 1
          && box.top >= frameBox.top && box.bottom <= frameBox.bottom + 1;
      }).length;
    })).toBe(100);
  });
}
