import { test, expect } from '@playwright/test';
import {
  MOCK_DATE,
  mockBackends,
  fallbacks,
  contrastOf,
  plain,
  unbalanced,
} from './helpers/guide.js';

test.beforeEach(async ({ page }) => {
  await mockBackends(page);
});

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

  test('meta-bar shows the playwright, last-updated, read-time and visitors badges', async ({
    page,
  }) => {
    await page.goto('/locators.html');

    await expect(page.locator('.meta-badge .k')).toHaveText([
      'playwright',
      'last updated',
      'read time',
      'visitors',
    ]);
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

/* ── SECTIONS ──────────────────────────────────────────────────── */
const SECTION_IDS = [
  'ladder',
  'role-options',
  'narrowing',
  'lists',
  'boundaries',
  'strictness',
  'fragile',
  'team',
  'summary',
];
const ROW_COUNTS = [8, 8, 9, 6, 6, 4, 7, 5, 4];
const sections = (page) => page.evaluate(() => window.locatorSections);

test.describe('Locator guide: sections', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/locators.html');
  });

  test('renders the nine sections in order with numbered headings', async ({ page }) => {
    const ids = await page.locator('.guide section').evaluateAll((els) => els.map((el) => el.id));
    expect(ids).toEqual(SECTION_IDS);
    for (const [i, id] of SECTION_IDS.entries()) {
      await expect(page.locator(`#${id} h2 .num`)).toHaveText(String(i + 1).padStart(2, '0'));
    }
  });

  test('section index has nine working anchors', async ({ page }) => {
    const links = page.locator('#toc a');
    await expect(links).toHaveCount(9);
    await expect(links.first()).toHaveText('01 The locator priority ladder');
    await links.last().click();
    await expect(page.locator('#summary h2')).toBeInViewport();
  });

  test('row counts match the data', async ({ page }) => {
    for (const [i, id] of SECTION_IDS.entries()) {
      await expect(page.locator(`#${id} tbody tr`)).toHaveCount(ROW_COUNTS[i]);
    }
    expect((await sections(page)).map((s) => s.rows.length)).toEqual(ROW_COUNTS);
  });

  test('flagged rows and tags', async ({ page }) => {
    await expect(page.locator('.guide tr.flag')).toHaveCount(12);
    await expect(page.locator('.guide .tag')).toHaveText([
      'Last resort',
      'Fragile',
      "Doesn't pierce",
      'Not for tests',
    ]);
  });

  test('summary third column is prose, and tables use column headers', async ({ page }) => {
    await expect(page.locator('#summary pre')).toHaveCount(0);
    const scopes = await page
      .locator('.guide th')
      .evaluateAll((els) => els.map((el) => el.getAttribute('scope')));
    expect(scopes.length).toBe(27);
    expect(new Set(scopes)).toEqual(new Set(['col']));
  });
});

/* ── LINKS BACK TO THE DASHBOARD ───────────────────────────────── */
test.describe('Locator guide: links to the dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/locators.html');
  });

  test('every link opens a dashboard search that shows at least one tile', async ({ page }) => {
    const hrefs = await page
      .locator('.guide a.inl')
      .evaluateAll((els) => els.map((el) => el.getAttribute('href')));
    expect(hrefs.length).toBeGreaterThanOrEqual(25);
    for (const href of hrefs) expect(href).toMatch(/^index\.html#search=/);

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

  test('links search for the full command name', async ({ page }) => {
    const expected = [
      ['#ladder', /^getByRole\(\)$/, 'getByRole()'],
      ['#ladder', /^locator\(css\)$/, 'locator()'],
      ['#narrowing', /^within\(\)$/, 'locator.within()'],
      ['#narrowing', /^visible\(\)$/, 'locator.visible()'],
      ['#boundaries', /^frameLocator\(\)$/, 'frameLocator()'],
      ['#strictness', /^ariaSnapshot\(\)$/, 'locator.ariaSnapshot()'],
      ['#strictness', /^getByRef\(\)$/, 'page.getByRef()'],
    ];
    for (const [scope, text, name] of expected) {
      const href = await page
        .locator(`${scope} a.inl`, { hasText: text })
        .first()
        .getAttribute('href');
      expect(href, String(text)).toBe(`index.html#search=${encodeURIComponent(name)}`);
    }
  });

  test('a method with no dashboard tile is a plain chip, not a link', async ({ page }) => {
    const chip = page.locator('#boundaries code.inl', { hasText: /^contentFrame\(\)$/ });
    await expect(chip).toHaveCount(1);
    expect(await chip.evaluate((el) => el.closest('a'))).toBeNull();
  });

  test('chips outside the linked columns are never links', async ({ page }) => {
    for (const id of ['role-options', 'fragile', 'summary']) {
      await expect(page.locator(`#${id} a.inl`)).toHaveCount(0);
    }
  });
});

/* ── COPY BUTTONS ──────────────────────────────────────────────── */
test.describe('Locator guide: copy buttons', () => {
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
    await page.goto('/locators.html');
    await expect(page.locator('.guide-copy')).toHaveCount(53);
  });

  test('copies the exact source text, backslashes included', async ({ page }) => {
    await stubClipboard(page);
    await page.goto('/locators.html');

    await page.locator('#ladder tbody tr').first().locator('.guide-copy').click();
    await page
      .locator('#role-options tbody tr', { hasText: 'regex' })
      .first()
      .locator('.guide-copy')
      .click();

    const { copied, expected } = await page.evaluate(() => {
      const rows = (id) => window.locatorSections.find((s) => s.id === id).rows;
      return {
        copied: window.__copied,
        expected: [
          rows('ladder')[0][2],
          rows('role-options').find((r) => /regex/.test(r[0] + r[1]))[2],
        ],
      };
    });
    expect(copied).toEqual(expected);
    expect(copied[1]).toContain('\\.');
  });

  for (const width of [1280, 390]) {
    test(`the copy button never covers code at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto('/locators.html');
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
    await page.goto('/locators.html');
    const button = page.locator('.guide-copy').first();
    await button.click();
    await expect(button).toHaveText('✓ Copied!');
    await expect(button).toHaveText('Copy', { timeout: 4000 });
  });

  test('says Select and copy when the clipboard write is rejected', async ({ page }) => {
    await stubClipboard(page, { reject: true });
    await page.goto('/locators.html');
    const button = page.locator('.guide-copy').first();
    await button.click();
    await expect(button).toHaveText('Select and copy');
  });
});

/* ── LAYOUT ────────────────────────────────────────────────────── */
test.describe('Locator guide: layout', () => {
  const noSideScroll = (page) =>
    page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);

  test('has no horizontal page scroll on this device', async ({ page }) => {
    await page.goto('/locators.html');
    expect(await noSideScroll(page)).toBe(true);
  });

  test('phone layout stacks rows with labelled cells', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/locators.html');

    await expect(page.locator('#ladder thead')).toBeHidden();
    const labels = await page
      .locator('#ladder tbody tr')
      .first()
      .locator('td')
      .evaluateAll((els) =>
        els.map((el) => ({
          display: getComputedStyle(el).display,
          content: getComputedStyle(el, '::before').content,
        }))
      );
    expect(labels).toEqual([
      { display: 'block', content: '"Locator"' },
      { display: 'block', content: '"Use it when"' },
      { display: 'block', content: '"Real-world example"' },
    ]);
    expect(await noSideScroll(page)).toBe(true);
  });

  test('code scrolls inside its block instead of widening the page', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/locators.html');
    const style = await page
      .locator('.guide pre')
      .first()
      .evaluate((el) => {
        const cs = getComputedStyle(el);
        return { overflowX: cs.overflowX, whiteSpace: cs.whiteSpace };
      });
    expect(style).toEqual({ overflowX: 'auto', whiteSpace: 'pre' });
  });

  for (const width of [1280, 800, 390]) {
    test(`method chips stay inside their cell at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto('/locators.html');
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
});

/* ── CONTENT CORRECTNESS ───────────────────────────────────────── */
// Discouraged patterns: only on flagged rows. Positional methods are also fine in `lists`,
// where order is the point and within()'s column example needs nth().
const DISCOURAGED = /page\.\$\(|nth-child|\/html\/|['"]text=|>>|:visible/;
const POSITIONAL = /\.nth\(|\.first\(\)|\.last\(\)/;

test.describe('Locator guide: content', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/locators.html');
  });

  test('section titles and column headers are exact', async ({ page }) => {
    const expected = {
      ladder: ['The locator priority ladder', ['Locator', 'Use it when', 'Real-world example']],
      'role-options': ['Making role locators precise', ['Option', 'What it does', 'Example']],
      narrowing: ['Scoping and filtering', ['Method', 'Use it when', 'Example']],
      lists: ['Lists, tables and repeated items', ['Task', 'Approach', 'Example']],
      boundaries: ['Frames, shadow DOM and new tabs', ['Situation', 'Approach', 'Example']],
      strictness: ['Strict mode and readable failures', ['Situation', 'What to do', 'Example']],
      fragile: ['Fragile vs robust locators', ['Pattern', 'Why it breaks', 'Fragile vs robust']],
      team: ['Team practices for a stable suite', ['Practice', 'Why', 'Example']],
      summary: ['Summary', ['Category', 'Locators', 'Rule of thumb']],
    };
    for (const [id, [title, cols]] of Object.entries(expected)) {
      await expect(page.locator(`#${id} h2`)).toHaveText(new RegExp(`\\d${title}$`));
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

  test('the ladder rows follow the pills, top rung first', async ({ page }) => {
    const ladder = (await sections(page)).find((s) => s.id === 'ladder');
    expect(ladder.rows.map((r) => r[0])).toEqual([
      '`getByRole()`',
      '`getByLabel()`',
      '`getByPlaceholder()`',
      '`getByText()`',
      '`getByAltText()`',
      '`getByTitle()`',
      '`getByTestId()`',
      '`locator(css)` <tag>Last resort</tag>',
    ]);
    const pills = await page.locator('.guide .pill').allTextContents();
    const rung = (pill) =>
      pill === 'CSS / XPath'
        ? 'locator(css)'
        : `getBy${pill.replace(/ (\w)/g, (_, c) => c.toUpperCase()).replace(/ID$/, 'Id')}()`;
    expect(pills.map(rung)).toEqual(
      ladder.rows.map((r) => plain(r[0]).replace(/ Last resort$/, ''))
    );
    await expect(page.locator('#summary tbody td:first-child')).toHaveText([
      'User-facing',
      'Contract',
      'Structural',
      'Positional',
    ]);
  });

  test('discouraged patterns appear in code only on flagged rows', async ({ page }) => {
    for (const s of await sections(page)) {
      if (s.text) continue;
      for (const [label, , code, flag] of s.rows) {
        if (DISCOURAGED.test(code)) expect(flag, `${s.id}: ${label}`).toBe(true);
        if (POSITIONAL.test(code) && s.id !== 'lists') expect(flag, `${s.id}: ${label}`).toBe(true);
      }
    }
  });

  test('every fragile example is followed by a robust one', async ({ page }) => {
    const fragile = (await sections(page)).find((s) => s.id === 'fragile');
    for (const [label, , code, flag] of fragile.rows) {
      expect(flag, label).toBe(true);
      const [before, robust] = code.split('// Robust');
      expect(before, label).toMatch(/^\/\/ Fragile/);
      expect(robust, label).toMatch(/getBy\w+\(|\.filter\(|\.within\(/);
      expect(robust, label).not.toMatch(DISCOURAGED);
      expect(robust, label).not.toMatch(POSITIONAL);
    }
  });

  test('version notes never name a version above the pinned Playwright', async ({ page }) => {
    // Read through the server, as the page does: specs never touch the filesystem
    const pkg = await (await page.request.get('/package.json')).json();
    const [maj, min] = pkg.devDependencies['@playwright/test']
      .replace(/^\D+/, '')
      .split('.')
      .map(Number);
    const cells = (await sections(page)).flatMap((s) => [s.title, s.note ?? '', ...s.rows.flat()]);
    const versions = cells
      .filter((c) => typeof c === 'string')
      .flatMap((c) => [...c.matchAll(/\bv(\d+)\.(\d+)/g)].map((m) => [+m[1], +m[2], m[0]]));
    expect(versions.length).toBeGreaterThanOrEqual(4);
    for (const [a, b, text] of versions)
      expect(a * 1000 + b, text).toBeLessThanOrEqual(maj * 1000 + min);
  });

  test('every code example in both guides has balanced brackets and quotes', async ({ page }) => {
    const check = (secs) =>
      secs
        .filter((s) => !s.text)
        .flatMap((s) => s.rows.map((r) => [`${s.id}: ${r[0]}`, unbalanced(r[2])]))
        .filter(([, bad]) => bad !== null);
    expect(check(await sections(page))).toEqual([]);
    await page.goto('/waiting.html');
    expect(check(await page.evaluate(() => window.waitingSections))).toEqual([]);
  });

  test('ElementHandles are faulted for the right reason', async ({ page }) => {
    // handle.click() does wait for actionability; what a handle lacks is re-querying
    const [, why] = (await sections(page))
      .find((s) => s.id === 'fragile')
      .rows.find((r) => r[0].includes('page.$()'));
    expect(why).not.toMatch(/auto-wait/);
    expect(why).toMatch(/doesn't wait for the element to exist/);
    expect(why).toMatch(/re-quer/);
  });

  test('strict mode applies to actions and single-element assertions only', async ({ page }) => {
    // toHaveCount() and toHaveText([...]) on many elements are fine, and the Lists section uses them
    await expect(page.locator('#strictness .note')).toContainText(
      'Actions and single-element assertions'
    );
  });

  test('count examples never count a table header row by accident', async ({ page }) => {
    // getByRole('row') includes the header; a hasNotText filter keeps it in the count
    for (const s of await sections(page)) {
      for (const [label, , code] of s.rows) {
        if (/toHaveCount/.test(code ?? '')) {
          expect(code, `${s.id}: ${label}`).not.toMatch(/getByRole\('row'\)\.filter\(\{ hasNot/);
        }
      }
    }
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
});

/* ── COLOURS ───────────────────────────────────────────────────── */
// The dashboard palette, as pinned for the waiting guide
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
  ['.guide th', 'color', 'rgb(148, 163, 184)'],
  ['.guide td', 'color', 'rgb(203, 213, 225)'],
  ['.guide .tag', 'color', 'rgb(251, 146, 60)'],
  ['.guide .tag', 'backgroundColor', 'rgba(234, 88, 12, 0.2)'],
  ['.guide pre', 'backgroundColor', 'rgb(2, 6, 23)'],
  ['.guide code.inl', 'backgroundColor', 'rgb(2, 6, 23)'],
  ['.guide-copy', 'backgroundColor', 'rgb(56, 189, 248)'],
  ['.guide pre .tok-keyword', 'color', 'rgb(56, 189, 248)'],
  ['.guide pre .tok-string', 'color', 'rgb(74, 222, 128)'],
  ['.guide pre .tok-api', 'color', 'rgb(192, 132, 252)'],
  ['.guide pre .tok-comment', 'color', 'rgb(148, 163, 184)'],
  ['.guide pre .tok-fn', 'color', 'rgb(251, 191, 36)'],
];

test.describe('Locator guide: colours', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/locators.html');
  });

  test('every guide element uses the dashboard palette', async ({ page }) => {
    for (const [selector, prop, value] of PALETTE) {
      const actual = await page
        .locator(selector)
        .first()
        .evaluate((el, p) => getComputedStyle(el)[p], prop);
      expect(actual, `${selector} ${prop}`).toBe(value);
    }
  });

  test('all guide text meets WCAG AA contrast (4.5:1)', async ({ page }) => {
    for (const selector of [
      '.guide h1',
      '.guide .lede',
      '.guide .pill',
      '.guide .pill.warn',
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
      '.guide pre .tok-comment',
      '.guide pre .tok-fn',
    ]) {
      expect(await contrastOf(page, selector), selector).toBeGreaterThanOrEqual(4.5);
    }
  });
});
