import { test, expect } from '@playwright/test';

const CORS = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'POST, GET, OPTIONS',
  'access-control-allow-headers': 'authorization, content-type, apikey, x-client-info',
};

// Deterministic mocks so tests never hit real Supabase (flaky, rate-limited,
// and a real write would inflate production counts). `state.rows` feeds the
// command-views read; `state.opens` collects the command_ids written.
async function mockBackends(page, { offline = false } = {}) {
  const state = { rows: [], opens: [] };

  await page.route('**/js/meta.json**', (route) =>
    route.fulfill({
      status: 200,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ lastUpdated: '2025-12-25' }),
    })
  );

  // Visitor counter (unrelated) — stubbed so it never reaches production.
  await page.route('**/rest/v1/visits**', (route) =>
    route.fulfill({
      status: 200,
      headers: { ...CORS, 'content-type': 'application/json' },
      body: JSON.stringify([{ total_count: 0 }]),
    })
  );
  await page.route('**/functions/v1/increment-visitor', (route) =>
    route.fulfill({
      status: 200,
      headers: { ...CORS, 'content-type': 'application/json' },
      body: '{"success":true}',
    })
  );

  if (offline) {
    await page.route('**/rest/v1/command_views**', (route) => route.abort());
    await page.route('**/functions/v1/increment-command-view', (route) => route.abort());
    return state;
  }

  // Read path: all command view counts (served from the mutable state.rows)
  await page.route('**/rest/v1/command_views**', (route) =>
    route.fulfill({
      status: 200,
      headers: { ...CORS, 'content-type': 'application/json' },
      body: JSON.stringify(state.rows),
    })
  );

  // Write path: record an open — capture command_id from real POSTs only
  await page.route('**/functions/v1/increment-command-view', (route) => {
    const req = route.request();
    if (req.method() === 'POST') {
      state.opens.push(JSON.parse(req.postData() || '{}').command_id);
    }
    route.fulfill({
      status: 200,
      headers: { ...CORS, 'content-type': 'application/json' },
      body: '{"success":true}',
    });
  });

  return state;
}

// The recorder skips automated browsers (navigator.webdriver === true under
// Playwright). Tests that assert an open is recorded must pose as a real
// visitor first (same helper idea as meta-bar.spec.js).
async function poseAsRealVisitor(page) {
  await page.addInitScript(() =>
    Object.defineProperty(navigator, 'webdriver', { get: () => false })
  );
}

test.describe('Popular commands — record opens', () => {
  test('does NOT record opens in automated browsers (CI / bots)', async ({ page }) => {
    const state = await mockBackends(page);
    await page.goto('/'); // navigator.webdriver is true under Playwright
    await page.locator('.tile').first().click();
    await expect(page.locator('#modal')).toBeVisible();
    await page.waitForTimeout(500);

    expect(state.opens.length).toBe(0);
  });

  test('records one open with the command_id (real visitor)', async ({ page }) => {
    await poseAsRealVisitor(page);
    const state = await mockBackends(page);
    await page.goto('/');

    const tile = page.locator('.tile').first();
    const name = await tile.locator('.tile-name').innerText();
    await tile.click();
    await expect(page.locator('#modal')).toBeVisible();
    await page.waitForTimeout(500);

    expect(state.opens.length).toBe(1);
    // command_id is `${cls}:${name}` — it must contain the command name
    expect(state.opens[0]).toMatch(/^[^:]+:.+/); // `${cls}:${name}` shape
    expect(state.opens[0]).toContain(name);
  });

  test('records each command at most once per session', async ({ page }) => {
    await poseAsRealVisitor(page);
    const state = await mockBackends(page);
    await page.goto('/');

    const tile = page.locator('.tile').first();
    await tile.click();
    await page.locator('#btn-close').click();
    await tile.click(); // second open of the same command
    await page.waitForTimeout(500);

    expect(state.opens.length).toBe(1);
  });
});
