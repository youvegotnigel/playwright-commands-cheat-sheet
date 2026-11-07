import { test, expect } from '@playwright/test';
import { MOCK_DATE, mockBackends, contrastOf } from './helpers/guide.js';

test.beforeEach(async ({ page }) => {
  await mockBackends(page);
});

// The meta-bar fallback values a page ships in its HTML
async function fallbacks(page, path) {
  const html = await (await page.request.get(path)).text();
  const value = (id) => html.match(new RegExp(`id="${id}">([^<]+)<`))[1];
  return { version: value('pw-version'), date: value('last-updated') };
}

const PAGES = ['/', '/waiting.html', '/locators.html'];
const LADDER = [
  'Role',
  'Label',
  'Placeholder',
  'Text',
  'Alt text',
  'Title',
  'Test ID',
  'CSS / XPath',
];

/* ── PAGE SHELL ────────────────────────────────────────────────── */
test.describe('Locator guide: page shell', () => {
  for (const path of ['/locators.html', '/locators']) {
    test(`loads at ${path} with title, h1, logos and the dashboard stylesheet`, async ({
      page,
    }) => {
      await page.goto(path);

      await expect(page).toHaveTitle(/Playwright Locator Guide/);
      await expect(page.locator('h1')).toHaveCount(1);
      await expect(page.locator('h1')).toHaveText('Playwright Locator Cheat Sheet');
      await expect(page.locator('header img.header-logo')).toHaveCount(2);
      const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
      expect(bg).toBe('rgb(15, 23, 42)');
    });
  }

  test('meta-bar shows only the playwright and last-updated badges', async ({ page }) => {
    await page.goto('/locators.html');

    await expect(page.locator('.meta-badge .k')).toHaveText(['playwright', 'last updated']);
    await expect(page.locator('#last-updated')).toHaveText(MOCK_DATE);
  });

  test('failed fetches leave the exact fallback values in place', async ({ page }) => {
    const expected = await fallbacks(page, '/locators.html');
    await page.route('**/js/meta.json**', (route) => route.abort());
    await page.route('**/package.json**', (route) => route.abort());
    await page.goto('/locators.html');

    await expect(page.locator('#pw-version')).toHaveText(expected.version);
    await expect(page.locator('#last-updated')).toHaveText(expected.date);
  });

  test('the pills read the locator ladder, with the last rung as a warning', async ({ page }) => {
    await page.goto('/locators.html');

    const pills = page.locator('.guide .pill');
    await expect(pills).toHaveText(LADDER);
    await expect(page.locator('.guide .pill.warn')).toHaveText(['CSS / XPath']);
    const warn = page.locator('.guide .pill.warn');
    await expect(warn).toHaveCSS('color', 'rgb(251, 146, 60)');
    await expect(warn).toHaveCSS('background-color', 'rgba(234, 88, 12, 0.2)');
    expect(await contrastOf(page, '.guide .pill.warn')).toBeGreaterThanOrEqual(4.5);
  });

  test('counts one visit per session from the guide', async ({ page }) => {
    // The counter skips navigator.webdriver, so pose as a real visitor
    await page.addInitScript(() =>
      Object.defineProperty(navigator, 'webdriver', { get: () => false })
    );
    const state = await mockBackends(page);
    await page.goto('/locators.html');
    await expect.poll(() => state.posts).toBe(1);

    await page.reload();
    await expect(page.locator('h1')).toBeVisible();
    await expect.poll(() => state.posts).toBe(1);
  });
});

/* ── PAGE SWITCH ───────────────────────────────────────────────── */
test.describe('Locator guide: page switch', () => {
  test('keyboard focus shows the white focus ring on every tab', async ({ page, browserName }) => {
    test.skip(browserName === 'webkit', 'WebKit does not move Tab focus to links by default');
    await page.goto('/locators.html');
    const focused = () =>
      page.evaluate(() => {
        const el = document.activeElement;
        const cs = getComputedStyle(el);
        return {
          cls: el.className,
          name: el.textContent.trim(),
          ring: `${cs.outlineStyle} ${cs.outlineWidth} ${cs.outlineColor}`,
        };
      });
    const ring = 'solid 3px rgb(248, 250, 252)';
    await page.keyboard.press('Tab');
    expect(await focused()).toEqual({ cls: 'page-tab', name: '⌨️Commands', ring });
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    expect(await focused()).toEqual({ cls: 'page-tab', name: '🎯Locators', ring });
  });

  test('the Locators tab opens the guide from the other two pages', async ({ page }) => {
    for (const path of ['/', '/waiting.html']) {
      await page.goto(path);
      await page.getByRole('navigation', { name: 'Pages' }).getByText('Locators').click();
      await expect(page).toHaveURL(/locators/);
      await expect(page.locator('h1')).toHaveText('Playwright Locator Cheat Sheet');
    }
  });
});

/* ── CROSS-PAGE ────────────────────────────────────────────────── */
test.describe('Locator guide: cross-page', () => {
  test('all three pages share an identical header', async ({ page }) => {
    const headers = [];
    for (const path of PAGES) {
      await page.goto(path);
      headers.push(await page.locator('header').evaluate((el) => el.outerHTML));
    }
    expect(headers[1]).toBe(headers[0]);
    expect(headers[2]).toBe(headers[0]);
  });

  test('the meta-bar fallbacks match on all three pages', async ({ page }) => {
    const [dashboard, ...guides] = await Promise.all(PAGES.map((p) => fallbacks(page, p)));
    for (const guide of guides) expect(guide).toEqual(dashboard);
  });

  test('on a 360px phone the three tabs share one row without overflow', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 740 });
    for (const path of PAGES) {
      await page.goto(path);
      const boxes = await page.locator('.page-tab').evaluateAll((els) =>
        els.map((el) => ({
          top: el.getBoundingClientRect().top,
          width: el.getBoundingClientRect().width,
          clipped: el.scrollWidth > el.clientWidth,
        }))
      );
      expect(boxes, path).toHaveLength(3);
      for (const box of boxes) {
        expect(box.top, path).toBe(boxes[0].top);
        expect(Math.abs(box.width - boxes[0].width), path).toBeLessThanOrEqual(1);
        expect(box.clipped, path).toBe(false);
      }
      const noSideScroll = await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth
      );
      expect(noSideScroll, path).toBe(true);
    }
  });
});
