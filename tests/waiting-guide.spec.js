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

/* ── LINKS BACK TO THE DASHBOARD ───────────────────────────────── */
test.describe('Waiting guide: links to the dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/waiting.html');
  });

  test('every linked chip leads to at least one dashboard item', async ({ page }) => {
    const hrefs = await page
      .locator('.guide a.inl')
      .evaluateAll((els) => els.map((el) => el.getAttribute('href')));
    expect(hrefs.length).toBeGreaterThanOrEqual(20);
    for (const href of hrefs) expect(href).toMatch(/^index\.html#search=/);

    const keys = hrefs.map((h) => decodeURIComponent(h.split('#search=')[1]));
    // `categories` is only a global on the dashboard, so load the data module directly
    const dead = await page.evaluate(async (ks) => {
      const { categories } = await import('./js/data/index.js');
      return ks.filter(
        (k) =>
          !categories.some((c) =>
            c.items.some((i) => i.name.toLowerCase().includes(k.toLowerCase()))
          )
      );
    }, keys);
    expect(dead).toEqual([]);
  });

  test('known chips link with the right search key', async ({ page }) => {
    const href = (name) => page.locator('.guide a.inl', { hasText: name }).first();
    await expect(href('page.waitForURL(url)')).toHaveAttribute(
      'href',
      'index.html#search=waitForURL'
    );
    await expect(href('expect(fn).toPass()')).toHaveAttribute('href', 'index.html#search=toPass');
    await expect(
      page.locator('#assertions a.inl', { hasText: /^toBeVisible$/ }).first()
    ).toHaveAttribute('href', 'index.html#search=toBeVisible');
  });

  test('chips with no dashboard match are plain chips', async ({ page }) => {
    const chip = page.locator('#actions tbody td:first-child', {
      hasText: 'scrollIntoViewIfNeeded',
    });
    await expect(chip.locator('code.inl')).toHaveText('scrollIntoViewIfNeeded()');
    await expect(chip.locator('a')).toHaveCount(0);
  });

  test('linked chips look like plain chips, with no default link colours', async ({ page }) => {
    const style = (sel) =>
      page
        .locator(sel)
        .first()
        .evaluate((el) => {
          const cs = getComputedStyle(el);
          return { color: cs.color, background: cs.backgroundColor, display: cs.display };
        });
    const link = await style('#actions a.inl');
    const plain = await style('#actions code.inl');
    expect(link).toEqual(plain);
    expect(link.color).toBe('rgb(226, 232, 240)');
    expect(link.background).toBe('rgb(2, 6, 23)');

    // Punctuation inside a link (the brackets) must not pick up the browser link colour
    const bracket = await page
      .locator('#actions a.inl')
      .first()
      .evaluate((el) => {
        const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
        for (let n = walker.nextNode(); n; n = walker.nextNode()) {
          if (n.textContent.includes('(')) return getComputedStyle(n.parentElement).color;
        }
      });
    expect(bracket).toBe('rgb(226, 232, 240)');
  });

  test('chips outside the linked columns are never links', async ({ page }) => {
    for (const id of ['timeouts', 'tips', 'summary']) {
      await expect(page.locator(`#${id} a.inl`)).toHaveCount(0);
    }
  });

  test('clicking a link opens the dashboard with that search', async ({ page }) => {
    await page.locator('#explicit a.inl', { hasText: 'page.waitForURL(url)' }).click();

    await expect(page).toHaveURL(/index\.html#search=waitForURL$|\/#search=waitForURL$/);
    await expect(page.locator('#search-input')).toHaveValue('waitForURL');
    await expect(page.locator('.tile').first()).toBeVisible();

    await page.goBack();
    await expect(page).toHaveURL(/waiting/);
  });
});

/* ── COPY BUTTONS ──────────────────────────────────────────────── */
test.describe('Waiting guide: copy buttons', () => {
  async function stubClipboard(page, { reject = false } = {}) {
    await page.addInitScript((shouldReject) => {
      window.__copied = [];
      Object.defineProperty(navigator, 'clipboard', {
        configurable: true,
        value: {
          writeText: (text) => {
            window.__copied.push(text);
            return shouldReject ? Promise.reject(new Error('denied')) : Promise.resolve();
          },
        },
      });
    }, reject);
  }

  test('there is one copy button per code row', async ({ page }) => {
    await page.goto('/waiting.html');
    await expect(page.locator('.guide-copy')).toHaveCount(51);
  });

  test('copies the exact source text', async ({ page }) => {
    await stubClipboard(page);
    await page.goto('/waiting.html');

    const rowButton = (sectionId, firstCell) =>
      page.locator(`#${sectionId} tbody tr`, { hasText: firstCell }).first().locator('.guide-copy');

    await rowButton('explicit', 'page.waitForResponse(pred)').click();
    await rowButton('assertions', 'toHaveURL').click();

    const { copied, expected } = await page.evaluate(() => {
      const find = (id, needle) =>
        window.waitingSections
          .find((s) => s.id === id)
          .rows.find((r) => r[1].includes(needle) || r[0].includes(needle))[2];
      return {
        copied: window.__copied,
        expected: [find('explicit', 'page.waitForResponse(pred)'), find('assertions', 'toHaveURL')],
      };
    });
    expect(copied).toEqual(expected);
    expect(copied[0]).toContain('res.url().includes');
    expect(copied[1]).toContain('/\\/dashboard/');
  });

  test('code never runs underneath the copy button', async ({ page }) => {
    await page.goto('/waiting.html');
    const pad = await page
      .locator('.guide pre')
      .first()
      .evaluate((el) => parseFloat(getComputedStyle(el).paddingRight));
    const buttonWidth = await page
      .locator('.guide-copy')
      .first()
      .evaluate((el) => el.getBoundingClientRect().width);
    expect(pad).toBeGreaterThanOrEqual(buttonWidth + 6);
  });

  test('shows feedback, then resets', async ({ page }) => {
    await stubClipboard(page);
    await page.goto('/waiting.html');

    const button = page.locator('.guide-copy').first();
    await button.click();
    await expect(button).toHaveText('✓ Copied!');
    await expect(button).toHaveClass(/copied/);
    await expect(button).toHaveText('Copy', { timeout: 4000 });
    await expect(button).not.toHaveClass(/copied/);
  });

  test('says Select and copy when the clipboard write is rejected', async ({ page }) => {
    await stubClipboard(page, { reject: true });
    await page.goto('/waiting.html');

    const button = page.locator('.guide-copy').first();
    await button.click();
    await expect(button).toHaveText('Select and copy');
    await expect(button).toHaveText('Copy', { timeout: 4000 });
  });
});
