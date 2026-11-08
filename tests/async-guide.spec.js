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

const RULES = [
  'Await every call',
  'Register before you trigger',
  "Assert, don't sleep",
  'Parallel only when independent',
  'Close what you open',
];

/* ── PAGE SHELL ────────────────────────────────────────────────── */
test.describe('Async guide: page shell', () => {
  for (const path of ['/async.html', '/async']) {
    test(`loads at ${path} with title, h1, logos and the dashboard stylesheet`, async ({
      page,
    }) => {
      await page.goto(path);

      await expect(page).toHaveTitle(/Playwright Async Guide/);
      await expect(page.locator('h1')).toHaveCount(1);
      await expect(page.locator('h1')).toHaveText('Playwright Async Cheat Sheet');
      await expect(page.locator('header img.header-logo')).toHaveCount(2);
      const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
      expect(bg).toBe('rgb(15, 23, 42)');
    });
  }

  test('meta-bar shows the playwright, last-updated and visitors badges', async ({ page }) => {
    await page.goto('/async.html');

    await expect(page.locator('.meta-badge .k')).toHaveText([
      'playwright',
      'last updated',
      'visitors',
    ]);
    await expect(page.locator('#last-updated')).toHaveText(MOCK_DATE);
  });

  test('failed fetches leave the exact fallback values in place', async ({ page }) => {
    const expected = await fallbacks(page, '/async.html');
    await page.route('**/js/meta.json**', (route) => route.abort());
    await page.route('**/package.json**', (route) => route.abort());
    await page.goto('/async.html');

    await expect(page.locator('#pw-version')).toHaveText(expected.version);
    await expect(page.locator('#last-updated')).toHaveText(expected.date);
  });

  test('the pills read the five async rules', async ({ page }) => {
    await page.goto('/async.html');

    await expect(page.locator('.guide .pill')).toHaveText(RULES);
    await expect(page.locator('.guide .pill.warn')).toHaveCount(0);
  });

  test('counts one visit per session from the guide', async ({ page }) => {
    // The counter skips navigator.webdriver, so pose as a real visitor
    await page.addInitScript(() =>
      Object.defineProperty(navigator, 'webdriver', { get: () => false })
    );
    const state = await mockBackends(page);
    await page.goto('/async.html');
    await expect.poll(() => state.posts).toBe(1);

    await page.reload();
    await expect(page.locator('h1')).toBeVisible();
    await expect.poll(() => state.posts).toBe(1);
  });
});

/* ── SECTIONS ──────────────────────────────────────────────────── */
const SECTION_IDS = [
  'basics',
  'awaits',
  'loops',
  'parallel',
  'multi-user',
  'handoffs',
  'events',
  'structure',
  'summary',
];
const ROW_COUNTS = [6, 7, 5, 6, 7, 6, 5, 7, 5];
const CODE_ROWS = ROW_COUNTS.reduce((a, b) => a + b, 0) - 5; // the summary is prose
const sections = (page) => page.evaluate(() => window.asyncSections);

test.describe('Async guide: sections', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/async.html');
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
    await expect(links.first()).toHaveText('01 How async works in a Playwright test');
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
    await expect(page.locator('.guide tr.flag')).toHaveCount(11);
    await expect(page.locator('.guide .tag')).toHaveText(['Broken', 'Race', 'Avoid', 'Fragile']);
    // Every awaits row is flagged, with no tag
    await expect(page.locator('#awaits tr.flag')).toHaveCount(7);
    await expect(page.locator('#awaits .tag')).toHaveCount(0);
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
test.describe('Async guide: links to the dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/async.html');
  });

  test('every link opens a dashboard search that shows at least one tile', async ({ page }) => {
    const hrefs = await page
      .locator('.guide a.inl')
      .evaluateAll((els) => els.map((el) => el.getAttribute('href')));
    expect(hrefs.length).toBeGreaterThanOrEqual(10);
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

  test('links target the right tiles', async ({ page }) => {
    const expected = [
      ['#handoffs', /^expect\.poll\(\)$/, 'expect.poll()'],
      ['#structure', /^test\.step\(\)$/, 'test.step()'],
      ['#structure', /^test\.extend\(\)$/, 'test.extend()'],
      ['#structure', /^test\.info\(\)$/, 'test.info()'],
      ['#parallel', /^waitForResponse\(\)$/, 'waitForResponse()'],
      ['#events', /^page\.waitForEvent\(\)$/, 'page.waitForEvent()'],
      ['#events', /^context\.waitForEvent\(\)$/, 'context.waitForEvent()'],
    ];
    for (const [scope, text, name] of expected) {
      const href = await page
        .locator(`${scope} a.inl`, { hasText: text })
        .first()
        .getAttribute('href');
      expect(href, String(text)).toBe(`index.html#search=${encodeURIComponent(name)}`);
    }
  });

  test('only chips that name a dashboard command are links', async ({ page }) => {
    const linked = async (id) =>
      page.locator(`#${id} a.inl`).evaluateAll((els) => els.map((el) => el.textContent));
    expect(await linked('parallel')).toEqual(['waitForResponse()']);
    expect(await linked('handoffs')).toEqual([
      'toContainText()',
      'toHaveCount()',
      'toHaveText()',
      'toContainText()',
      'expect.poll()',
    ]);
    expect(await linked('events')).toEqual(['page.waitForEvent()', 'context.waitForEvent()']);
    expect(await linked('structure')).toEqual(['test.extend()', 'test.step()', 'test.info()']);
  });

  test('chips outside the linked columns are never links', async ({ page }) => {
    for (const id of ['basics', 'awaits', 'loops', 'multi-user', 'summary']) {
      await expect(page.locator(`#${id} a.inl`)).toHaveCount(0);
    }
  });
});

/* ── COPY BUTTONS ──────────────────────────────────────────────── */
test.describe('Async guide: copy buttons', () => {
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
    await page.goto('/async.html');
    await expect(page.locator('.guide-copy')).toHaveCount(CODE_ROWS);
  });

  test('copies the exact source text, blank lines and quotes included', async ({ page }) => {
    await stubClipboard(page);
    await page.goto('/async.html');

    await page.locator('#basics tbody tr').first().locator('.guide-copy').click();
    await page.locator('#awaits tbody tr').first().locator('.guide-copy').click();

    const { copied, expected } = await page.evaluate(() => {
      const rows = (id) => window.asyncSections.find((s) => s.id === id).rows;
      return {
        copied: window.__copied,
        expected: [rows('basics')[0][2], rows('awaits')[0][2]],
      };
    });
    expect(copied).toEqual(expected);
    expect(copied[1]).toContain('\n\n// Correct');
  });

  for (const width of [1280, 390]) {
    test(`the copy button never covers code at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto('/async.html');
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
    await page.goto('/async.html');
    const button = page.locator('.guide-copy').first();
    await button.click();
    await expect(button).toHaveText('✓ Copied!');
    await expect(button).toHaveText('Copy', { timeout: 4000 });
  });

  test('says Select and copy when the clipboard write is rejected', async ({ page }) => {
    await stubClipboard(page, { reject: true });
    await page.goto('/async.html');
    const button = page.locator('.guide-copy').first();
    await button.click();
    await expect(button).toHaveText('Select and copy');
  });
});

/* ── LAYOUT ────────────────────────────────────────────────────── */
test.describe('Async guide: layout', () => {
  const noSideScroll = (page) =>
    page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);

  test('has no horizontal page scroll on this device', async ({ page }) => {
    await page.goto('/async.html');
    expect(await noSideScroll(page)).toBe(true);
  });

  test('phone layout stacks rows with labelled cells', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/async.html');

    await expect(page.locator('#basics thead')).toBeHidden();
    const labels = await page
      .locator('#basics tbody tr')
      .first()
      .locator('td')
      .evaluateAll((els) =>
        els.map((el) => ({
          display: getComputedStyle(el).display,
          content: getComputedStyle(el, '::before').content,
        }))
      );
    expect(labels).toEqual([
      { display: 'block', content: '"Concept"' },
      { display: 'block', content: '"What it means"' },
      { display: 'block', content: '"Example"' },
    ]);
    expect(await noSideScroll(page)).toBe(true);
  });

  test('code scrolls inside its block instead of widening the page', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/async.html');
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
      await page.goto('/async.html');
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
// A statement that starts with a Playwright call on one of these receivers, with no await,
// return or assignment, is a floating promise. page.on() and page.once() only register a
// listener, so they are fine.
const RECEIVERS = ['page', '\\w+Page', 'context', '\\w+Context', 'browser', 'locator'];
RECEIVERS.push('\\w+Button', '\\w+Field', '\\w+Row');
const FLOATING = new RegExp(`^\\s*(?:${RECEIVERS.join('|')})\\.(?!on\\(|once\\()\\w+\\(`);
const WEB_FIRST_MATCHERS =
  'BeVisible|BeHidden|HaveText|ContainText|HaveCount|HaveURL|HaveTitle|HaveValue|BeEnabled|BeDisabled|BeChecked|HaveAttribute';
const UNAWAITED_ASSERTION = new RegExp(
  `^\\s*expect\\(.*\\)\\.(not\\.)?to(${WEB_FIRST_MATCHERS})\\(`
);
const DISCOURAGED = /\.forEach\(async|waitForTimeout\(|setTimeout\(|\.then\(/;

// The code a reader should be able to copy and trust: unflagged rows, and the Correct half
// of the flagged awaits rows
function trustedCode(secs) {
  return secs
    .filter((s) => !s.text)
    .flatMap((s) =>
      s.rows.flatMap(([label, , code, flag]) => {
        if (!flag) return [[`${s.id}: ${label}`, code]];
        if (s.id === 'awaits') return [[`${s.id}: ${label}`, code.split('// Correct')[1] ?? '']];
        return [];
      })
    );
}

test.describe('Async guide: content', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/async.html');
  });

  test('section titles and column headers are exact', async ({ page }) => {
    const expected = {
      basics: ['How async works in a Playwright test', ['Concept', 'What it means', 'Example']],
      awaits: [
        'Forgotten and misplaced awaits',
        ['Mistake', 'What goes wrong', 'Flaky vs correct'],
      ],
      loops: ['Loops and collections', ['Task', 'Approach', 'Example']],
      parallel: ['Doing things at the same time', ['Pattern', 'Use it when', 'Example']],
      'multi-user': ['Two or more browsers in one test', ['Scenario', 'Approach', 'Example']],
      handoffs: ['Hand-offs between actors', ['Hand-off', 'How the other side waits', 'Example']],
      events: ['Events and listeners', ['Situation', 'Approach', 'Example']],
      structure: ['Helpers, fixtures and lint', ['Practice', 'Why', 'Example']],
      summary: ['Summary', ['Situation', 'Do this', 'Rule of thumb']],
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
    expect(fromData.flat().filter(Boolean)).toHaveLength(11);
  });

  test('no floating Playwright calls', async ({ page }) => {
    const floating = [];
    for (const [label, code] of trustedCode(await sections(page))) {
      for (const line of code.split('\n')) {
        if (line.trimEnd().endsWith(';') && FLOATING.test(line)) floating.push(`${label}: ${line}`);
      }
    }
    expect(floating).toEqual([]);
  });

  test('web-first assertions are awaited', async ({ page }) => {
    const unawaited = [];
    for (const [label, code] of trustedCode(await sections(page))) {
      for (const line of code.split('\n')) {
        if (UNAWAITED_ASSERTION.test(line)) unawaited.push(`${label}: ${line}`);
      }
    }
    expect(unawaited).toEqual([]);
  });

  test('discouraged patterns appear in code only on flagged rows', async ({ page }) => {
    for (const s of await sections(page)) {
      if (s.text) continue;
      for (const [label, , code, flag] of s.rows) {
        if (DISCOURAGED.test(code)) expect(flag, `${s.id}: ${label}`).toBe(true);
      }
    }
  });

  test('every awaits row shows the flaky way, then the correct way', async ({ page }) => {
    const awaits = (await sections(page)).find((s) => s.id === 'awaits');
    for (const [label, , code, flag] of awaits.rows) {
      expect(flag, label).toBe(true);
      const [flaky, correct] = code.split('// Correct');
      expect(flaky, label).toMatch(/^\/\/ Flaky/);
      expect(correct, label).toContain('await');
    }
  });

  test('multi-user examples close what they open', async ({ page }) => {
    for (const s of await sections(page)) {
      if (s.id !== 'multi-user' && s.id !== 'handoffs') continue;
      for (const [label, , code] of s.rows) {
        if (code.includes('newContext('))
          expect(code, `${s.id}: ${label}`).toMatch(/\.close\(\)|await use\(/);
      }
    }
  });

  test('hand-offs wait on the receiving side', async ({ page }) => {
    const handoffs = (await sections(page)).find((s) => s.id === 'handoffs');
    for (const [label, , code, flag] of handoffs.rows) {
      if (flag) continue;
      expect(code, label).toMatch(/await expect\(|expect\.poll\(/);
    }
  });

  test('switching is just using the other page', async ({ page }) => {
    for (const s of await sections(page)) {
      for (const [label, , code] of s.rows) {
        if (!s.text) expect(code, `${s.id}: ${label}`).not.toMatch(/switchTo|setActivePage/);
      }
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
    expect(versions.length).toBeGreaterThanOrEqual(2);
    for (const [a, b, text] of versions)
      expect(a * 1000 + b, text).toBeLessThanOrEqual(maj * 1000 + min);
  });

  test('every code example has balanced brackets and quotes', async ({ page }) => {
    const bad = (await sections(page))
      .filter((s) => !s.text)
      .flatMap((s) => s.rows.map((r) => [`${s.id}: ${r[0]}`, unbalanced(r[2])]))
      .filter(([, problem]) => problem !== null);
    expect(bad).toEqual([]);
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

  test('the summary has one row per rule', async ({ page }) => {
    await expect(page.locator('#summary tbody td:first-child')).toHaveText([
      'Any Playwright call',
      'Waiting for something',
      'An action triggers an event',
      'Several independent things',
      'More than one user',
    ]);
  });
});

/* ── COLOURS ───────────────────────────────────────────────────── */
// The dashboard palette, as pinned for the waiting and locator guides
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

test.describe('Async guide: colours', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/async.html');
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
