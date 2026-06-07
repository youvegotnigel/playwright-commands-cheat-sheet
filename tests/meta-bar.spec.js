import { test, expect } from '@playwright/test';

// Fixed values returned by the mocked backends
const MOCK_DATE = '2025-12-25';
const MOCK_COUNT = 12345;

const CORS = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'POST, GET, OPTIONS',
  'access-control-allow-headers':
    'authorization, content-type, apikey, x-client-info',
};

// Install deterministic network mocks so tests never hit the real Supabase /
// GitHub backends (flaky, rate-limited, and a real backend hit would increment
// the production visitor count). Returns a live counter of increment POSTs.
async function mockBackends(page, { count = MOCK_COUNT, offline = false } = {}) {
  const state = { posts: 0 };

  // The "last updated" badge reads from the stamped js/meta.json (same-origin)
  await page.route('**/js/meta.json**', (route) =>
    route.fulfill({
      status: 200,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ lastUpdated: MOCK_DATE }),
    })
  );

  if (offline) {
    // Simulate the backend being unreachable
    await page.route('**tilbhgcncnwibnfgebkg.supabase.co/**', (route) =>
      route.abort()
    );
    return state;
  }

  // Read path: live visitor count
  await page.route('**/rest/v1/visits**', (route) =>
    route.fulfill({
      status: 200,
      headers: { ...CORS, 'content-type': 'application/json' },
      body: JSON.stringify([{ total_count: count }]),
    })
  );

  // Write path: increment — count only real POSTs (ignore CORS preflight)
  await page.route('**/functions/v1/increment-visitor', (route) => {
    if (route.request().method() === 'POST') state.posts += 1;
    route.fulfill({
      status: 200,
      headers: { ...CORS, 'content-type': 'application/json' },
      body: '{"success":true}',
    });
  });

  return state;
}

/* ── META BAR ──────────────────────────────────────────────────── */
test.describe('Meta bar', () => {
  test('renders all four badges with their labels', async ({ page }) => {
    await mockBackends(page);
    await page.goto('/');

    await expect(page.locator('.meta-badge')).toHaveCount(4);
    const labels = await page.locator('.meta-badge .k').allInnerTexts();
    expect(labels).toEqual([
      'playwright',
      'last updated',
      'commands',
      'visitors',
    ]);
  });

  test('command count badge matches the data', async ({ page }) => {
    await mockBackends(page);
    await page.goto('/');

    const dataCount = await page.evaluate(() =>
      categories.reduce((sum, cat) => sum + cat.items.length, 0)
    );
    await expect(page.locator('#cmd-count')).toHaveText(String(dataCount));
  });

  test('version badge is populated from package.json', async ({ page }) => {
    await mockBackends(page);
    await page.goto('/');

    // Derive the expected version the same way app.js does (strip range prefix),
    // so this stays correct whenever the dependency is bumped.
    const expected = await page.evaluate(async () => {
      const pkg = await (await fetch('./package.json')).json();
      const dep =
        pkg.devDependencies?.['@playwright/test'] ??
        pkg.dependencies?.['@playwright/test'];
      return 'v' + dep.replace(/^[\^~>=<\s]+/, '');
    });
    await expect(page.locator('#pw-version')).toHaveText(expected);
  });

  test('last-updated badge reflects the stamped meta.json date', async ({
    page,
  }) => {
    await mockBackends(page);
    await page.goto('/');

    await expect(page.locator('#last-updated')).toHaveText('2025-12-25');
  });

  test('keeps fallback values if version/date lookups fail', async ({
    page,
  }) => {
    // Fail every dynamic source: meta.json, package.json, and Supabase
    await page.route('**/js/meta.json**', (route) => route.abort());
    await page.route('**/package.json**', (route) => route.abort());
    await page.route('**tilbhgcncnwibnfgebkg.supabase.co/**', (route) =>
      route.abort()
    );
    await page.goto('/');

    // Hardcoded fallbacks in the HTML must still be shown (never blank)
    await expect(page.locator('#pw-version')).not.toBeEmpty();
    await expect(page.locator('#last-updated')).not.toBeEmpty();
  });
});

/* ── VISITOR COUNTER: DISPLAY ──────────────────────────────────── */
test.describe('Visitor counter — display', () => {
  test('shows the live count, formatted with separators', async ({ page }) => {
    await mockBackends(page, { count: 12345 });
    await page.goto('/');

    await expect(page.locator('#visitor-count-number')).toHaveText('12,345');
  });

  test('falls back to the cached value (dimmed) when offline', async ({
    page,
  }) => {
    await page.addInitScript(() =>
      localStorage.setItem('visitor-count-cache', '9876')
    );
    await mockBackends(page, { offline: true });
    await page.goto('/');

    const number = page.locator('#visitor-count-number');
    await expect(number).toHaveText('9,876');
    await expect(number).toHaveCSS('opacity', '0.6');
    await expect(number).toHaveAttribute('title', /Last known count/);
  });

  test('does not break the page when the backend is down', async ({ page }) => {
    await mockBackends(page, { offline: true });
    await page.goto('/');

    // Core content still renders regardless of the counter
    expect(await page.locator('.tile').count()).toBeGreaterThan(10);
  });
});

/* ── VISITOR COUNTER: INCREMENT ────────────────────────────────── */
test.describe('Visitor counter — increment', () => {
  test('increments exactly once on first load', async ({ page }) => {
    const state = await mockBackends(page);
    await page.goto('/');
    await page.waitForTimeout(500);

    expect(state.posts).toBe(1);
  });

  test('does not increment again on refresh (once per session)', async ({
    page,
  }) => {
    const state = await mockBackends(page);
    await page.goto('/');
    await page.waitForTimeout(500);
    expect(state.posts).toBe(1);

    await page.reload();
    await page.waitForTimeout(500);
    expect(state.posts).toBe(1); // sessionStorage guard prevents a second hit
  });

  test('counts again in a fresh session', async ({ browser }) => {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    const state = await mockBackends(page);

    await page.goto('/');
    await page.waitForTimeout(500);
    expect(state.posts).toBe(1);

    await ctx.close();
  });
});
