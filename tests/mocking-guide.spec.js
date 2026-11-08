import { test, expect } from '@playwright/test';
import { MOCK_DATE, mockBackends, fallbacks } from './helpers/guide.js';

test.beforeEach(async ({ page }) => {
  await mockBackends(page);
});

const SPECTRUM = [
  'Real backend',
  'Seed via API',
  'Modify response',
  'Replay HAR',
  'Fake response',
  'Block',
];

/* ── PAGE SHELL ────────────────────────────────────────────────── */
test.describe('Mocking guide: page shell', () => {
  for (const path of ['/mocking.html', '/mocking']) {
    test(`loads at ${path} with title, h1, logos and the dashboard stylesheet`, async ({
      page,
    }) => {
      await page.goto(path);

      await expect(page).toHaveTitle(/Playwright Mocking Guide/);
      await expect(page.locator('h1')).toHaveCount(1);
      await expect(page.locator('h1')).toHaveText('Playwright Network Mocking Cheat Sheet');
      await expect(page.locator('header img.header-logo')).toHaveCount(2);
      const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
      expect(bg).toBe('rgb(15, 23, 42)');
    });
  }

  test('meta-bar shows only the playwright and last-updated badges', async ({ page }) => {
    await page.goto('/mocking.html');

    await expect(page.locator('.meta-badge .k')).toHaveText(['playwright', 'last updated']);
    await expect(page.locator('#last-updated')).toHaveText(MOCK_DATE);
  });

  test('failed fetches leave the exact fallback values in place', async ({ page }) => {
    const expected = await fallbacks(page, '/mocking.html');
    await page.route('**/js/meta.json**', (route) => route.abort());
    await page.route('**/package.json**', (route) => route.abort());
    await page.goto('/mocking.html');

    await expect(page.locator('#pw-version')).toHaveText(expected.version);
    await expect(page.locator('#last-updated')).toHaveText(expected.date);
  });

  test('the pills read the mocking spectrum, most real first', async ({ page }) => {
    await page.goto('/mocking.html');

    await expect(page.locator('.guide .pill')).toHaveText(SPECTRUM);
    await expect(page.locator('.guide .pill.warn')).toHaveCount(0);
  });

  test('counts one visit per session from the guide', async ({ page }) => {
    // The counter skips navigator.webdriver, so pose as a real visitor
    await page.addInitScript(() =>
      Object.defineProperty(navigator, 'webdriver', { get: () => false })
    );
    const state = await mockBackends(page);
    await page.goto('/mocking.html');
    await expect.poll(() => state.posts).toBe(1);

    await page.reload();
    await expect(page.locator('h1')).toBeVisible();
    await expect.poll(() => state.posts).toBe(1);
  });
});
