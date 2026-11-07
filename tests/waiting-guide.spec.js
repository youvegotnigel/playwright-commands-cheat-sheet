import { test, expect } from '@playwright/test';

const MOCK_DATE = '2025-12-25';

// Same convention as the other specs: never hit the real Supabase backend, and
// pin the stamped date so the last-updated badge is deterministic.
async function mockBackends(page) {
  const state = { posts: 0 };
  await page.route('**/js/meta.json**', (route) =>
    route.fulfill({ json: { lastUpdated: MOCK_DATE } })
  );
  await page.route('**/rest/v1/**', (route) => route.fulfill({ json: [] }));
  await page.route('**/functions/v1/**', (route) => {
    if (route.request().method() === 'POST') state.posts += 1;
    route.fulfill({ status: 200, body: '' });
  });
  return state;
}

test.beforeEach(async ({ page }) => {
  await mockBackends(page);
});

/* ── PAGE SHELL ────────────────────────────────────────────────── */
test.describe('Waiting guide: page shell', () => {
  for (const path of ['/waiting.html', '/waiting']) {
    test(`loads at ${path} with title, h1, logos and the dashboard stylesheet`, async ({
      page,
    }) => {
      await page.goto(path);

      await expect(page).toHaveTitle(/Playwright Waiting Guide/);
      await expect(page.locator('h1')).toHaveCount(1);
      await expect(page.locator('h1')).toHaveText('Playwright Waiting Cheat Sheet');
      await expect(page.locator('header img.header-logo')).toHaveCount(2);
      const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
      expect(bg).toBe('rgb(15, 23, 42)');
    });
  }

  test('meta-bar shows only the playwright and last-updated badges', async ({ page }) => {
    await page.goto('/waiting.html');

    await expect(page.locator('.meta-badge .k')).toHaveText(['playwright', 'last updated']);
    await expect(page.locator('#last-updated')).toHaveText(MOCK_DATE);
  });

  test('keeps fallback badge values when package.json and meta.json fail', async ({ page }) => {
    await page.route('**/js/meta.json**', (route) => route.abort());
    await page.route('**/package.json**', (route) => route.abort());
    await page.goto('/waiting.html');

    await expect(page.locator('#pw-version')).not.toBeEmpty();
    await expect(page.locator('#last-updated')).not.toBeEmpty();
  });

  test('shows the five actionability pills', async ({ page }) => {
    await page.goto('/waiting.html');

    await expect(page.locator('.guide .pill')).toHaveText([
      'Visible',
      'Stable',
      'Receives Events',
      'Enabled',
      'Editable',
    ]);
  });
});

/* ── PAGE SWITCH ───────────────────────────────────────────────── */
test.describe('Waiting guide: page switch', () => {
  test('is on both pages with aria-current on the current one', async ({ page }) => {
    await page.goto('/waiting.html');
    const nav = page.getByRole('navigation', { name: 'Pages' });
    await expect(nav.getByRole('link')).toHaveText(['Commands', '⏱ Waiting guide']);
    await expect(nav.locator('[aria-current="page"]')).toHaveText('⏱ Waiting guide');

    await page.goto('/');
    await expect(nav.getByRole('link')).toHaveText(['Commands', '⏱ Waiting guide']);
    await expect(nav.locator('[aria-current="page"]')).toHaveText('Commands');
  });

  test('navigates both ways', async ({ page }) => {
    await page.goto('/waiting.html');
    await page.getByRole('navigation', { name: 'Pages' }).getByText('Commands').click();
    await expect(page).toHaveURL(/\/(index\.html)?$/);
    await expect(page.locator('#grid')).toBeVisible();

    await page.getByRole('navigation', { name: 'Pages' }).getByText('Waiting guide').click();
    await expect(page).toHaveURL(/waiting/);
    await expect(page.locator('h1')).toHaveText('Playwright Waiting Cheat Sheet');
  });

  test('does not add filter buttons to the dashboard', async ({ page }) => {
    await page.goto('/');
    const expected = await page.evaluate(() => categories.length + 3);
    await expect(page.locator('.filter-btn')).toHaveCount(expected);
  });
});

/* ── VISITOR COUNTER ───────────────────────────────────────────── */
test.describe('Waiting guide: visitor counter', () => {
  test('counts one visit per session from the guide', async ({ page }) => {
    // The counter skips navigator.webdriver, so pose as a real visitor
    await page.addInitScript(() =>
      Object.defineProperty(navigator, 'webdriver', { get: () => false })
    );
    const state = await mockBackends(page);
    await page.goto('/waiting.html');
    await expect.poll(() => state.posts).toBe(1);

    await page.reload();
    await expect(page.locator('h1')).toBeVisible();
    await expect.poll(() => state.posts).toBe(1);
  });
});

/* ── SECTIONS ──────────────────────────────────────────────────── */
const SECTION_IDS = [
  'actions',
  'assertions',
  'navigation',
  'explicit',
  'not-waits',
  'timeouts',
  'tips',
  'summary',
];
const ROW_COUNTS = [9, 9, 2, 15, 4, 5, 7, 4];

test.describe('Waiting guide: sections', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/waiting.html');
  });

  test('renders the eight sections in order', async ({ page }) => {
    const sections = page.locator('.guide section');
    await expect(sections).toHaveCount(8);
    const ids = await sections.evaluateAll((els) => els.map((el) => el.id));
    expect(ids).toEqual(SECTION_IDS);

    const titles = await page.evaluate(() => window.waitingSections.map((s) => s.title));
    for (const [i, id] of SECTION_IDS.entries()) {
      const h2 = page.locator(`#${id} h2`);
      await expect(h2).toContainText(titles[i]);
      await expect(h2.locator('.num')).toHaveText(String(i + 1).padStart(2, '0'));
    }
  });

  test('section index has eight working anchors', async ({ page }) => {
    const links = page.locator('#toc a');
    await expect(links).toHaveCount(8);
    await expect(links.first()).toHaveText('01 Auto-waiting: actions');

    await links.last().click();
    await expect(page.locator('#summary h2')).toBeInViewport();
  });

  test('row counts match the data', async ({ page }) => {
    for (const [i, id] of SECTION_IDS.entries()) {
      await expect(page.locator(`#${id} tbody tr`)).toHaveCount(ROW_COUNTS[i]);
    }
    const dataCounts = await page.evaluate(() => window.waitingSections.map((s) => s.rows.length));
    expect(dataCounts).toEqual(ROW_COUNTS);
  });

  test('flagged rows and tags', async ({ page }) => {
    await expect(page.locator('.guide tr.flag')).toHaveCount(10);
    await expect(page.locator('.guide .tag')).toHaveText(['Avoid', 'Legacy', 'Deprecated']);
  });

  test('summary third column is prose, not code', async ({ page }) => {
    await expect(page.locator('#summary pre')).toHaveCount(0);
    for (const id of SECTION_IDS.slice(0, 7)) {
      await expect(page.locator(`#${id} tbody tr`).first().locator('pre')).toHaveCount(1);
    }
  });

  test('tables use column headers', async ({ page }) => {
    const scopes = await page
      .locator('.guide th')
      .evaluateAll((els) => els.map((el) => el.getAttribute('scope')));
    expect(scopes.length).toBe(24);
    expect(new Set(scopes)).toEqual(new Set(['col']));
    await expect(page.locator('#actions th')).toHaveText([
      'Method',
      'Checks performed',
      'Real-world example',
    ]);
  });

  test('code is highlighted with the dashboard palette', async ({ page }) => {
    const colour = (sel) =>
      page
        .locator(sel)
        .first()
        .evaluate((el) => getComputedStyle(el).color);
    expect(await colour('.guide pre .tok-keyword')).toBe('rgb(56, 189, 248)');
    expect(await colour('.guide pre .tok-string')).toBe('rgb(74, 222, 128)');
  });

  test('flagged rows show the orange edge', async ({ page }) => {
    const shadow = await page
      .locator('.guide tr.flag td')
      .first()
      .evaluate((el) => getComputedStyle(el).boxShadow);
    expect(shadow).toContain('rgb(251, 146, 60)');
  });

  test('escapes angle brackets in code', async ({ page }) => {
    const pre = page.locator('#tips tbody tr', { hasText: 'intent-named' }).locator('pre');
    await expect(pre).toContainText('Promise<void>');
    expect(await pre.locator('void').count()).toBe(0);
  });

  test('has no syntax legend', async ({ page }) => {
    await expect(page.locator('.legend')).toHaveCount(0);
  });
});
