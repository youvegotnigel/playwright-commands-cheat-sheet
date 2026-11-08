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

  test('meta-bar shows the playwright, last-updated, read-time and visitors badges', async ({
    page,
  }) => {
    await page.goto('/waiting.html');

    await expect(page.locator('.meta-badge .k')).toHaveText([
      'playwright',
      'last updated',
      'read time',
      'visitors',
    ]);
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

  test('every link opens a dashboard search that shows at least one tile', async ({ page }) => {
    const hrefs = await page
      .locator('.guide a.inl')
      .evaluateAll((els) => els.map((el) => el.getAttribute('href')));
    expect(hrefs.length).toBeGreaterThanOrEqual(60);
    for (const href of hrefs) expect(href).toMatch(/^index\.html#search=/);

    // Run every search on the real dashboard: set each hash and count the rendered tiles
    await page.goto('/');
    const empty = await page.evaluate(
      async (hs) => {
        const misses = [];
        for (const h of hs) {
          const hash = h.slice(h.indexOf('#'));
          const changed = new Promise((r) =>
            window.addEventListener('hashchange', r, { once: true })
          );
          location.hash = hash;
          await changed;
          if (!document.querySelectorAll('#grid .tile').length) misses.push(hash);
        }
        return misses;
      },
      [...new Set(hrefs)]
    ); // de-duplicated: re-setting the current hash fires no hashchange
    expect(empty).toEqual([]);
  });

  test('links search for the full command name, so the tile is easy to find', async ({ page }) => {
    const href = (scope, text) =>
      page.locator(`${scope} a.inl`, { hasText: text }).first().getAttribute('href');
    const expected = [
      ['#explicit', 'page.waitForURL(url)', 'waitForURL()'],
      ['#explicit', 'expect(fn).toPass()', 'expect().toPass()'],
      ['#explicit', "page.waitForEvent('popup')", 'page.waitForEvent()'],
      ['#explicit', "context.waitForEvent('page')", 'context.waitForEvent()'],
      ['#explicit', 'locator.waitFor({ state })', 'locator.waitFor()'],
      ['#navigation', 'page.goto(url)', 'goto()'],
      ['#not-waits', /^all\(\)$/, 'locator.all()'],
      ['#assertions', /^toBe$/, 'toBe()'],
      ['#assertions', /^toBeVisible$/, 'toBeVisible()'],
    ];
    for (const [scope, text, name] of expected) {
      expect(await href(scope, text)).toBe(`index.html#search=${encodeURIComponent(name)}`);
    }
  });

  test('a broad method lands on a short list that contains its tile', async ({ page }) => {
    // all() used to search the bare word "all", which matched about 167 of 305 tiles
    await page.locator('#not-waits a.inl', { hasText: /^all\(\)$/ }).click();
    await expect(page.locator('#grid .tile-name', { hasText: /^locator\.all\(\)$/ })).toBeVisible();
    expect(await page.locator('#grid .tile').count()).toBeLessThanOrEqual(10);
  });

  test('chips with no dashboard match are plain chips', async ({ page }) => {
    // These four action methods have no tile on the dashboard, so they must not link
    const plain = page.locator('#actions tbody td:first-child code.inl');
    await expect(plain).toHaveText([
      'setChecked()',
      'selectText()',
      'scrollIntoViewIfNeeded()',
      'blur()',
    ]);
    await expect(
      page
        .locator('#actions tbody td:first-child', { hasText: 'scrollIntoViewIfNeeded' })
        .locator('a')
    ).toHaveCount(0);
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

    await expect(page).toHaveURL(/#search=waitForURL\(\)$/);
    await expect(page.locator('#search-input')).toHaveValue('waitForURL()');
    await expect(page.locator('#grid .tile-name', { hasText: /^waitForURL\(\)$/ })).toBeVisible();
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

  for (const width of [1280, 390]) {
    test(`the copy button never covers code at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto('/waiting.html');
      // The button sits in a band above the first line of code, so no line (however long or
      // however far scrolled) can run underneath it, whatever its label says
      const covering = await page.locator('.guide .block').evaluateAll((blocks) =>
        blocks
          .filter((b) => {
            const btn = b.querySelector('.guide-copy').getBoundingClientRect();
            const code = b.querySelector('pre code').getBoundingClientRect();
            return btn.bottom > code.top + 0.5;
          })
          .map((b) => b.querySelector('pre').textContent.split('\n')[0])
      );
      expect(covering).toEqual([]);
    });
  }

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

/* ── LAYOUT ────────────────────────────────────────────────────── */
test.describe('Waiting guide: layout', () => {
  const noSideScroll = (page) =>
    page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);

  test('has no horizontal page scroll on this device', async ({ page }) => {
    await page.goto('/waiting.html');
    expect(await noSideScroll(page)).toBe(true);
  });

  test('phone layout stacks rows with labelled cells', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/waiting.html');

    await expect(page.locator('#actions thead')).toBeHidden();
    const cells = page.locator('#actions tbody tr').first().locator('td');
    expect(await cells.evaluateAll((els) => els.map((el) => getComputedStyle(el).display))).toEqual(
      ['block', 'block', 'block']
    );
    const labels = await cells.evaluateAll((els) =>
      els.map((el) => ({
        label: el.dataset.label,
        content: getComputedStyle(el, '::before').content,
      }))
    );
    expect(labels.map((l) => l.label)).toEqual([
      'Method',
      'Checks performed',
      'Real-world example',
    ]);
    for (const { label, content } of labels) expect(content).toBe(`"${label}"`);
    expect(await noSideScroll(page)).toBe(true);
  });

  test('desktop layout shows the table header', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/waiting.html');

    await expect(page.locator('#actions thead')).toBeVisible();
    await expect(page.locator('#actions th')).toHaveCount(3);
  });

  test('code scrolls inside its block instead of widening the page', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/waiting.html');

    const style = await page
      .locator('.guide pre')
      .first()
      .evaluate((el) => {
        const cs = getComputedStyle(el);
        return { overflowX: cs.overflowX, whiteSpace: cs.whiteSpace };
      });
    expect(style).toEqual({ overflowX: 'auto', whiteSpace: 'pre' });
    expect(await noSideScroll(page)).toBe(true);
  });

  for (const width of [1280, 800, 390]) {
    test(`method chips stay inside their cell at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto('/waiting.html');
      const spilling = await page.locator('.guide td .inl').evaluateAll((chips) =>
        chips
          .filter((chip) => {
            const td = chip.closest('td');
            const edge =
              td.getBoundingClientRect().right - parseFloat(getComputedStyle(td).paddingRight);
            return chip.getBoundingClientRect().right > edge + 0.5;
          })
          .map((chip) => chip.textContent)
      );
      expect(spilling).toEqual([]);
    });
  }

  for (const width of [800, 390]) {
    test(`a wrapping chip breaks between tokens, not inside a word, at ${width}px`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto('/waiting.html');
      const chip = page.locator('#explicit .inl', { hasText: "'websocket'" });
      // Each string token ('dialog', 'console', ...) must sit on one line: one client rect each
      const split = await chip
        .locator('.tok-string')
        .evaluateAll((els) =>
          els.filter((el) => el.getClientRects().length > 1).map((el) => el.textContent)
        );
      expect(split).toEqual([]);
      // The break hints must not leak into the text a reader selects and copies
      await expect(chip).toHaveText(
        "page.waitForEvent('dialog' / 'console' / 'filechooser' / 'websocket')"
      );
    });
  }

  test('code blocks and chips use the same monospace font stack', async ({ page }) => {
    await page.goto('/waiting.html');
    const font = (sel) =>
      page
        .locator(sel)
        .first()
        .evaluate((el) => getComputedStyle(el).fontFamily);
    const block = await font('.guide pre code');
    expect(block).toBe(await font('.guide td .inl'));
    expect(block).toContain('ui-monospace');
  });
});

/* ── CONTENT CORRECTNESS ───────────────────────────────────────── */
// Strip the data's inline markup the way a reader sees it: `code` -> code, <tag>X</tag> -> X
const plain = (text) => text.replace(/`([^`]+)`/g, '$1').replace(/<tag>([^<]+)<\/tag>/g, '$1');

test.describe('Waiting guide: content', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/waiting.html');
  });

  const sections = (page) => page.evaluate(() => window.waitingSections);
  const row = (secs, id, needle) =>
    secs.find((s) => s.id === id).rows.find((r) => r[0].includes(needle));

  test('section titles and column headers are exact', async ({ page }) => {
    const expected = {
      actions: ['Auto-waiting: actions', ['Method', 'Checks performed', 'Real-world example']],
      assertions: [
        'Auto-waiting: web-first assertions',
        ['Assertion group', 'Matchers', 'Real-world example'],
      ],
      navigation: ['Auto-waiting: navigation', ['Method', 'Default wait', 'Real-world example']],
      explicit: ['Explicit waits', ['Method', 'Use it when', 'Real-world example']],
      'not-waits': [
        'Methods that look like waits but are not',
        ['Method', 'Behaviour', 'Flaky vs correct'],
      ],
      timeouts: [
        'Timeout settings (playwright.config.ts)',
        ['Setting', 'Controls', 'Real-world example'],
      ],
      tips: ['Pro tips and pitfalls', ['Tip', 'Why', 'Real-world example']],
      summary: ['Summary', ['Category', 'Methods', 'Rule of thumb']],
    };
    for (const [id, [title, cols]] of Object.entries(expected)) {
      await expect(page.locator(`#${id} h2`)).toHaveText(
        new RegExp(`${title.replace(/[()]/g, '\\$&')}$`)
      );
      await expect(page.locator(`#${id} th`)).toHaveText(cols);
    }
  });

  test('every rendered cell shows exactly its data', async ({ page }) => {
    const secs = await sections(page);
    const rendered = await page.locator('.guide section').evaluateAll((els) =>
      els.map((sec) =>
        [...sec.querySelectorAll('tbody tr')].map((tr) => {
          const tds = tr.querySelectorAll('td');
          const pre = tds[2].querySelector('pre');
          return [
            tds[0].textContent,
            tds[1].textContent,
            pre ? pre.textContent : tds[2].textContent,
          ];
        })
      )
    );
    secs.forEach((s, i) => {
      const expected = s.rows.map((r) => [plain(r[0]), plain(r[1]), s.text ? plain(r[2]) : r[2]]);
      expect(rendered[i], s.id).toEqual(expected);
    });
  });

  test('actionability checks per action match the Playwright docs', async ({ page }) => {
    const secs = await sections(page);
    const checks = (needle) => row(secs, 'actions', needle)[1];
    const ALL4 = 'Visible, Stable, Receives Events, Enabled';
    expect(checks('`click()`')).toBe(ALL4);
    expect(checks('`check()`')).toBe(ALL4);
    expect(checks('`hover()`')).toBe('Visible, Stable, Receives Events');
    expect(checks('`fill()`')).toBe('Visible, Enabled, Editable');
    expect(checks('`selectOption()`')).toBe('Visible, Enabled');
    expect(checks('`selectText()`')).toBe('Visible');
    expect(checks('`screenshot()`')).toBe('Visible, Stable');
    expect(checks('`scrollIntoViewIfNeeded()`')).toBe('Stable');
    expect(checks('`press()`')).toMatch(/^No actionability checks/);
  });

  test('every check named in the actions table is one of the five pills', async ({ page }) => {
    const pills = await page.locator('.guide .pill').allTextContents();
    const named = (await sections(page))
      .find((s) => s.id === 'actions')
      .rows.filter((r) => !r[1].startsWith('No actionability'))
      .flatMap((r) => r[1].split(', '));
    expect(named.length).toBeGreaterThan(0);
    for (const check of named) expect(pills).toContain(check);
  });

  test('warning tags sit on the right rows, and those rows are flagged', async ({ page }) => {
    for (const [method, tag] of [
      ['page.waitForTimeout(ms)', 'Avoid'],
      ['page.waitForSelector()', 'Legacy'],
      ['page.waitForNavigation()', 'Deprecated'],
    ]) {
      const tr = page.locator('#explicit tbody tr', { hasText: method });
      await expect(tr.locator('.tag')).toHaveText(tag);
      await expect(tr).toHaveClass(/\bflag\b/);
    }
  });

  test('flagged rows are exactly the rows flagged in the data', async ({ page }) => {
    const fromData = (await sections(page)).map((s) => s.rows.map((r) => r[3] === true));
    const fromDom = await page
      .locator('.guide section')
      .evaluateAll((els) =>
        els.map((sec) =>
          [...sec.querySelectorAll('tbody tr')].map((tr) => tr.classList.contains('flag'))
        )
      );
    expect(fromDom).toEqual(fromData);
  });

  test('explicit waits register the wait before the action that triggers it', async ({ page }) => {
    const rows = (await sections(page))
      .find((s) => s.id === 'explicit')
      .rows.filter((r) => /Promise = /.test(r[2]));
    expect(rows.length).toBeGreaterThanOrEqual(6);
    for (const [method, , code] of rows) {
      const register = code.indexOf('Promise = ');
      const trigger = code.search(/\.click\(|saveButton\.click\(/);
      const resolve = code.search(/await \w+Promise/);
      expect(register, method).toBeLessThan(trigger);
      expect(trigger, method).toBeLessThan(resolve);
    }
  });

  test('every flaky example is followed by a web-first correct one', async ({ page }) => {
    for (const [method, , code] of (await sections(page)).find((s) => s.id === 'not-waits').rows) {
      const [flaky, correct] = code.split('// Correct');
      expect(flaky, method).toMatch(/^\/\/ Flaky/);
      expect(flaky, method).not.toContain('await expect(');
      expect(correct, method).toContain('await expect(');
    }
  });

  test('discouraged APIs appear in code only on flagged rows', async ({ page }) => {
    for (const s of await sections(page)) {
      for (const [method, , code, flag] of s.rows) {
        if (/waitForTimeout\(|waitForSelector\(|waitForNavigation\(|force: true/.test(code)) {
          expect(flag, `${s.id}: ${method}`).toBe(true);
        }
      }
    }
  });

  test('timeout settings and defaults are stated correctly', async ({ page }) => {
    await expect(page.locator('#assertions .note')).toContainText('5 seconds by default');
    await expect(page.locator('#timeouts tbody td:first-child')).toHaveText([
      'timeout',
      'expect.timeout',
      'use.actionTimeout',
      'use.navigationTimeout',
      'Per-call override',
    ]);
    await expect(page.locator('#summary tbody td:first-child')).toHaveText([
      'Auto-waiting',
      'Explicit waiting',
      'No waiting',
      'Hard sleeps',
    ]);
  });

  test('content follows the project text rules: no dashes, real code examples', async ({
    page,
  }) => {
    for (const s of await sections(page)) {
      for (const text of [
        s.title,
        s.note ?? '',
        ...s.cols,
        ...s.rows.flat().filter((c) => typeof c === 'string'),
      ]) {
        expect(text, s.id).not.toMatch(/[–—]/);
      }
      if (!s.text)
        for (const r of s.rows) expect(r[2].trim().length, r[0]).toBeGreaterThanOrEqual(20);
    }
  });

  test('the meta-bar fallbacks match the dashboard, so a release bump cannot miss one page', async ({
    page,
  }) => {
    const fallbacks = async (path) => {
      const html = await (await page.request.get(path)).text();
      const value = (id) => html.match(new RegExp(`id="${id}">([^<]+)<`))[1];
      return { version: value('pw-version'), date: value('last-updated') };
    };
    expect(await fallbacks('/waiting.html')).toEqual(await fallbacks('/index.html'));
  });

  test('failed fetches leave the exact fallback values in place', async ({ page }) => {
    const html = await (await page.request.get('/waiting.html')).text();
    const fallback = (id) => html.match(new RegExp(`id="${id}">([^<]+)<`))[1];
    await page.route('**/js/meta.json**', (route) => route.abort());
    await page.route('**/package.json**', (route) => route.abort());
    await page.goto('/waiting.html');
    await expect(page.locator('#pw-version')).toHaveText(fallback('pw-version'));
    await expect(page.locator('#last-updated')).toHaveText(fallback('last-updated'));
  });
});

/* ── COLOURS ───────────────────────────────────────────────────── */
// The dashboard palette (see the colour list in docs/superpowers/specs/2026-11-07-waiting-guide-design.md)
const PALETTE = [
  ['body', 'backgroundColor', 'rgb(15, 23, 42)'],
  ['.guide h1', 'color', 'rgb(226, 232, 240)'],
  ['.guide .lede', 'color', 'rgb(148, 163, 184)'],
  ['.guide .pill', 'color', 'rgb(74, 222, 128)'],
  ['.guide .pill', 'backgroundColor', 'rgba(22, 163, 74, 0.2)'],
  ['.guide #toc a', 'color', 'rgb(148, 163, 184)'],
  ['.guide h2', 'color', 'rgb(226, 232, 240)'],
  ['.guide h2 .num', 'color', 'rgb(46, 173, 51)'],
  ['.guide .note', 'color', 'rgb(148, 163, 184)'],
  ['.guide .table-card', 'backgroundColor', 'rgb(30, 41, 59)'],
  ['.guide .table-card', 'borderTopColor', 'rgb(51, 65, 85)'],
  ['.guide .table-card', 'borderTopLeftRadius', '12px'],
  ['.guide th', 'color', 'rgb(148, 163, 184)'],
  ['.guide td', 'color', 'rgb(203, 213, 225)'],
  ['.guide .tag', 'color', 'rgb(251, 146, 60)'],
  ['.guide .tag', 'backgroundColor', 'rgba(234, 88, 12, 0.2)'],
  ['.guide pre', 'backgroundColor', 'rgb(2, 6, 23)'],
  ['.guide pre', 'color', 'rgb(226, 232, 240)'],
  ['.guide code.inl', 'backgroundColor', 'rgb(2, 6, 23)'],
  ['.guide code.inl', 'color', 'rgb(226, 232, 240)'],
  ['.guide-copy', 'backgroundColor', 'rgb(56, 189, 248)'],
  ['.guide-copy', 'color', 'rgb(0, 0, 0)'],
  ['.guide pre .tok-keyword', 'color', 'rgb(56, 189, 248)'],
  ['.guide pre .tok-string', 'color', 'rgb(74, 222, 128)'],
  ['.guide pre .tok-api', 'color', 'rgb(192, 132, 252)'],
  ['.guide pre .tok-number', 'color', 'rgb(251, 146, 60)'],
  ['.guide pre .tok-comment', 'color', 'rgb(148, 163, 184)'],
  ['.guide pre .tok-comment', 'fontStyle', 'italic'],
  ['.guide pre .tok-fn', 'color', 'rgb(251, 191, 36)'],
];

// Contrast ratio of an element's text against what is actually painted behind it
// (semi-transparent backgrounds composited over their ancestors), per WCAG 2.x
async function contrastOf(page, selector) {
  return page
    .locator(selector)
    .first()
    .evaluate((el) => {
      const parse = (c) => {
        const [r, g, b, a = 1] = c.match(/[\d.]+/g).map(Number);
        return { r, g, b, a };
      };
      const over = (top, under) => ({
        r: top.r * top.a + under.r * (1 - top.a),
        g: top.g * top.a + under.g * (1 - top.a),
        b: top.b * top.a + under.b * (1 - top.a),
        a: 1,
      });
      const layers = [];
      for (let n = el; n; n = n.parentElement)
        layers.push(parse(getComputedStyle(n).backgroundColor));
      const bg = layers
        .reverse()
        .reduce((under, top) => over(top, under), { r: 255, g: 255, b: 255, a: 1 });
      const fg = over(parse(getComputedStyle(el).color), bg);
      const lum = ({ r, g, b }) => {
        const ch = (v) => ((v /= 255) <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
        return 0.2126 * ch(r) + 0.7152 * ch(g) + 0.0722 * ch(b);
      };
      const [hi, lo] = [lum(fg), lum(bg)].sort((x, y) => y - x);
      return (hi + 0.05) / (lo + 0.05);
    });
}

test.describe('Waiting guide: colours', () => {
  test('every guide element uses the dashboard palette', async ({ page }) => {
    await page.goto('/waiting.html');
    for (const [selector, prop, value] of PALETTE) {
      const actual = await page
        .locator(selector)
        .first()
        .evaluate((el, p) => getComputedStyle(el)[p], prop);
      expect(actual, `${selector} ${prop}`).toBe(value);
    }
  });

  test('all guide text meets WCAG AA contrast (4.5:1)', async ({ page }) => {
    await page.goto('/waiting.html');
    for (const selector of [
      '.guide h1',
      '.guide .lede',
      '.guide .pill',
      '.guide #toc a',
      '.guide h2 .num',
      '.guide .note',
      '.guide th',
      '.guide td',
      '.guide .tag',
      '.guide code.inl',
      '.guide-copy',
      '.page-tab:not([aria-current])',
      '.page-tab[aria-current]',
      '.guide pre code',
      '.guide pre .tok-keyword',
      '.guide pre .tok-string',
      '.guide pre .tok-api',
      '.guide pre .tok-number',
      '.guide pre .tok-comment',
      '.guide pre .tok-fn',
    ]) {
      expect(await contrastOf(page, selector), selector).toBeGreaterThanOrEqual(4.5);
    }
  });

  test('code tokens are the same colours as in the dashboard modal', async ({ page }) => {
    const tokenColours = (scope) =>
      page.evaluate((sc) => {
        const out = {};
        for (const cls of ['keyword', 'string', 'api', 'number', 'comment', 'fn']) {
          const el = document.querySelector(`${sc} .tok-${cls}`);
          if (el) out[cls] = getComputedStyle(el).color;
        }
        return out;
      }, scope);

    await page.goto('/waiting.html');
    const guide = await tokenColours('.guide pre');

    await page.goto('/#search=waitForResponse()');
    await page.locator('#grid .tile').first().click();
    const modal = await tokenColours('#m-code');

    const shared = Object.keys(modal).filter((k) => k in guide);
    expect(shared.length).toBeGreaterThanOrEqual(3);
    for (const k of shared) expect(guide[k], `tok-${k}`).toBe(modal[k]);
  });

  test('the shared header and meta-bar look identical on both pages', async ({ page }) => {
    const look = () =>
      page.evaluate(() => ({
        header: document.querySelector('header').outerHTML,
        headerBg: getComputedStyle(document.querySelector('header')).backgroundColor,
        barBg: getComputedStyle(document.querySelector('.meta-bar')).backgroundColor,
        version: getComputedStyle(document.getElementById('pw-version')).backgroundColor,
        date: getComputedStyle(document.getElementById('last-updated')).backgroundColor,
      }));
    await page.goto('/waiting.html');
    const guide = await look();
    await page.goto('/');
    expect(guide).toEqual(await look());
    expect(guide.version).toBe('rgb(34, 197, 94)');
    expect(guide.date).toBe('rgb(56, 189, 248)');
  });

  test('page tabs look exactly like the dashboard filter pills', async ({ page }) => {
    await page.goto('/');
    const look = (sel) =>
      page
        .locator(sel)
        .first()
        .evaluate((el) => {
          const cs = getComputedStyle(el);
          return {
            background: cs.backgroundColor,
            color: cs.color,
            radius: cs.borderTopLeftRadius,
            weight: cs.fontWeight,
            size: cs.fontSize,
            outline: `${cs.outlineStyle} ${cs.outlineWidth} ${cs.outlineColor}`,
          };
        });
    expect(await look('.page-tab:not([aria-current])')).toEqual(
      await look('.filter-btn:not(.active)')
    );
    expect(await look('.page-tab[aria-current]')).toEqual(await look('.filter-btn.active'));
  });

  test('copied feedback turns the button green', async ({ page }) => {
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'clipboard', {
        configurable: true,
        value: { writeText: () => Promise.resolve() },
      });
    });
    await page.goto('/waiting.html');
    const button = page.locator('.guide-copy').first();
    await button.click();
    await expect(button).toHaveCSS('background-color', 'rgb(74, 222, 128)');
  });

  test('keyboard focus shows the white focus ring on tabs, chips and copy buttons', async ({
    page,
    browserName,
  }) => {
    test.skip(browserName === 'webkit', 'WebKit does not move Tab focus to links by default');
    await page.goto('/waiting.html');
    const ring = () =>
      page.evaluate(() => {
        const cs = getComputedStyle(document.activeElement);
        return {
          tag: document.activeElement.className,
          ring: `${cs.outlineStyle} ${cs.outlineWidth} ${cs.outlineColor}`,
        };
      });
    await page.keyboard.press('Tab');
    expect(await ring()).toEqual({ tag: 'page-tab', ring: 'solid 3px rgb(248, 250, 252)' });

    await page.locator('#actions a.inl').first().focus();
    await page.keyboard.press('Shift+Tab');
    await page.keyboard.press('Tab');
    expect((await ring()).ring).toBe('solid 3px rgb(248, 250, 252)');

    await page.locator('.guide-copy').first().focus();
    await page.keyboard.press('Shift+Tab');
    await page.keyboard.press('Tab');
    expect(await ring()).toEqual({ tag: 'guide-copy', ring: 'solid 3px rgb(248, 250, 252)' });
  });
});
