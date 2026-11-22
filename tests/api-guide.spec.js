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

const PATH = '/api-testing.html';
const sections = (page) => page.evaluate(() => window.apiSections);
const mindMap = (page) => page.evaluate(() => window.apiMindMap);

/* ── PAGE SHELL ────────────────────────────────────────────────── */
test.describe('API testing mind map: page shell', () => {
  for (const path of [PATH, '/api-testing']) {
    test(`loads at ${path} with title, h1, logos and the dashboard stylesheet`, async ({
      page,
    }) => {
      await page.goto(path);

      await expect(page).toHaveTitle(/Playwright API Testing Mind Map/);
      await expect(page.locator('h1')).toHaveCount(1);
      await expect(page.locator('h1')).toHaveText('Playwright API Testing Mind Map');
      await expect(page.locator('header img.header-logo')).toHaveCount(2);
      const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
      expect(bg).toBe('rgb(15, 23, 42)');
    });
  }

  test('meta-bar shows the playwright, last-updated, read-time and visitors badges', async ({
    page,
  }) => {
    await page.goto(PATH);

    await expect(page.locator('.meta-badge .k')).toHaveText([
      'playwright',
      'last updated',
      'read time',
      'visitors',
    ]);
    await expect(page.locator('#last-updated')).toHaveText(MOCK_DATE);
  });

  test('failed fetches leave the exact fallback values in place', async ({ page }) => {
    const expected = await fallbacks(page, PATH);
    await page.route('**/js/meta.json**', (route) => route.abort());
    await page.route('**/package.json**', (route) => route.abort());
    await page.goto(PATH);

    await expect(page.locator('#pw-version')).toHaveText(expected.version);
    await expect(page.locator('#last-updated')).toHaveText(expected.date);
  });

  test('the pills state what was verified', async ({ page }) => {
    await page.goto(PATH);
    await expect(page.locator('.guide .pill')).toHaveText([
      'Verified on 1.65.1',
      '19 / 19 reference tests green',
      '13 branches',
    ]);
  });

  test('the footer keeps the verification note and links every source', async ({ page }) => {
    await page.goto(PATH);
    await expect(page.locator('.guide .foot')).toContainText('55 of 55 when shuffled');
    const hrefs = await page
      .locator('.guide .foot a')
      .evaluateAll((els) => els.map((el) => el.getAttribute('href')));
    expect(hrefs).toHaveLength(7);
    for (const href of hrefs) expect(href).toMatch(/^https:\/\/playwright\.dev\/docs\//);
  });

  test('counts one visit per session from the guide', async ({ page }) => {
    // The counter skips navigator.webdriver, so pose as a real visitor
    await page.addInitScript(() =>
      Object.defineProperty(navigator, 'webdriver', { get: () => false })
    );
    const state = await mockBackends(page);
    await page.goto(PATH);
    await expect.poll(() => state.posts).toBe(1);

    await page.reload();
    await expect(page.locator('h1')).toBeVisible();
    await expect.poll(() => state.posts).toBe(1);
  });
});

/* ── MIND MAP ──────────────────────────────────────────────────── */
const GROUPS = ['Build the framework', 'Send and receive', 'Prove it', 'Run and review'];
const BRANCHES = [
  'structure',
  'fixtures',
  'config',
  'auth',
  'get',
  'post',
  'update',
  'delete',
  'assert',
  'advanced',
  'hybrid',
  'runner',
  'pitfalls',
];

test.describe('API testing mind map: the map', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(PATH);
  });

  test('has four numbered groups and thirteen branches, in reading order', async ({ page }) => {
    const map = page.getByRole('navigation', { name: 'Mind map' });
    await expect(map.locator('.mm-group-title')).toHaveText(GROUPS.map((g, i) => `${i + 1}${g}`));
    const ids = await map
      .locator('.mm-node')
      .evaluateAll((els) => els.map((el) => el.getAttribute('href').slice(1)));
    expect(ids).toEqual(BRANCHES);
  });

  test('every node shows the number of the section it opens', async ({ page }) => {
    for (const id of BRANCHES) {
      const num = await page.locator(`#${id} h2 .num`).textContent();
      await expect(page.locator(`.mm-node[href="#${id}"] .mm-num`), id).toHaveText(num);
    }
  });

  test('every section is reachable from the map', async ({ page }) => {
    const linked = await page
      .locator('#mindmap a')
      .evaluateAll((els) => els.map((el) => el.getAttribute('href').slice(1)));
    const all = (await sections(page)).map((s) => s.id);
    expect(new Set(linked)).toEqual(new Set(all));
  });

  test('clicking a node scrolls its section into view', async ({ page }) => {
    await page.locator('.mm-node[href="#pitfalls"]').click();
    await expect(page.locator('#pitfalls h2')).toBeInViewport();
    await expect(page).toHaveURL(/#pitfalls$/);
  });

  test('fixtures are the gold heart of the map', async ({ page }) => {
    await expect(page.locator('.mm-branch.mm-heart')).toHaveCount(1);
    const heart = page.locator('.mm-heart .mm-node');
    await expect(heart).toHaveAttribute('href', '#fixtures');
    await expect(heart).toHaveCSS('background-color', 'rgb(251, 191, 36)');
  });

  test('every branch carries memory-jogger leaves', async ({ page }) => {
    const counts = await page
      .locator('.mm-branch')
      .evaluateAll((els) => els.map((el) => el.querySelectorAll('.mm-leaves li').length));
    expect(counts).toHaveLength(13);
    for (const n of counts) expect(n).toBeGreaterThanOrEqual(3);
  });

  test('every section has a breadcrumb back to the map', async ({ page }) => {
    const ids = (await sections(page)).map((s) => s.id);
    for (const id of ids) {
      const back = page.locator(`#${id} .mm-crumb a`);
      await expect(back, id).toHaveAttribute('href', '#mindmap');
    }
    await expect(page.locator('#post .mm-crumb span')).toHaveText(
      '2 Send and receive › Send data: POST'
    );
    await expect(page.locator('#hooks .mm-crumb span')).toHaveText(
      '1 Build the framework › Fixtures (core)'
    );
    await page.locator('#tips .mm-crumb a').click();
    await expect(page.locator('#mindmap')).toBeInViewport();
  });

  test('on wide screens a curved link joins the root to every branch', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await expect(page.locator('.mm-links path')).toHaveCount(13);
    // Each link ends on its node's inner edge, at its vertical middle
    const misses = await page.locator('#mindmap').evaluate((map) => {
      const box = map.getBoundingClientRect();
      const nodes = [...map.querySelectorAll('.mm-node')];
      return [...map.querySelectorAll('.mm-links path')]
        .map((path, i) => {
          const [ex, ey] = path.getAttribute('d').split(' ').slice(-2).map(Number);
          const r = nodes[i].getBoundingClientRect();
          const midY = r.top + r.height / 2 - box.top;
          const edges = [r.left - box.left, r.right - box.left];
          const ok = Math.abs(ey - midY) < 1 && edges.some((x) => Math.abs(x - ex) < 1);
          return ok ? null : nodes[i].textContent;
        })
        .filter(Boolean);
    });
    expect(misses).toEqual([]);
  });

  test('the links redraw when the layout changes', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    const first = await page.locator('.mm-links path').first().getAttribute('d');
    await page.setViewportSize({ width: 1000, height: 900 });
    await expect
      .poll(() => page.locator('.mm-links path').first().getAttribute('d'))
      .not.toBe(first);
  });

  test('on phones the map is a single column tree, groups in order', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await expect(page.locator('.mm-links')).toBeHidden();
    const tops = await page
      .locator('.mm-root, .mm-group')
      .evaluateAll((els) => els.map((el) => el.getBoundingClientRect().top));
    expect(tops).toEqual([...tops].sort((a, b) => a - b));
    const lefts = await page
      .locator('.mm-group')
      .evaluateAll((els) => els.map((el) => Math.round(el.getBoundingClientRect().left)));
    expect(new Set(lefts).size).toBe(1);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)
    ).toBe(true);
  });

  test('the map data matches what is drawn', async ({ page }) => {
    const map = await mindMap(page);
    expect(map.groups.map((g) => g.name)).toEqual(GROUPS);
    expect(map.groups.flatMap((g) => g.branches.map((b) => b.id))).toEqual(BRANCHES);
  });
});

/* ── SECTIONS ──────────────────────────────────────────────────── */
const SECTION_IDS = [
  'features',
  'structure',
  'fixtures',
  'hooks',
  'config',
  'auth',
  'get',
  'post',
  'update',
  'delete',
  'assert',
  'advanced',
  'hybrid',
  'runner',
  'pitfalls',
  'summary',
  'tips',
];
const ROW_COUNTS = [10, 4, 6, 7, 2, 3, 3, 4, 2, 1, 3, 1, 1, 3, 16, 10, 7];
const TEXT_SECTIONS = ['features', 'hooks', 'summary', 'tips'];
const CODE_ROWS = SECTION_IDS.reduce(
  (n, id, i) => n + (TEXT_SECTIONS.includes(id) ? 0 : ROW_COUNTS[i]),
  0
);

test.describe('API testing mind map: sections', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(PATH);
  });

  test('renders the seventeen sections in order with numbered headings', async ({ page }) => {
    const ids = await page.locator('.guide section').evaluateAll((els) => els.map((el) => el.id));
    expect(ids).toEqual(SECTION_IDS);
    for (const [i, id] of SECTION_IDS.entries()) {
      await expect(page.locator(`#${id} h2 .num`)).toHaveText(String(i + 1).padStart(2, '0'));
    }
  });

  test('section index has seventeen working anchors', async ({ page }) => {
    const links = page.locator('#toc a');
    await expect(links).toHaveCount(17);
    await expect(links.first()).toHaveText('01 Key features');
    await links.last().click();
    await expect(page.locator('#tips h2')).toBeInViewport();
  });

  test('row counts match the data', async ({ page }) => {
    for (const [i, id] of SECTION_IDS.entries()) {
      await expect(page.locator(`#${id} tbody tr`)).toHaveCount(ROW_COUNTS[i]);
    }
    expect((await sections(page)).map((s) => s.rows.length)).toEqual(ROW_COUNTS);
  });

  test('prose sections have no code blocks, and tables use column headers', async ({ page }) => {
    for (const id of TEXT_SECTIONS) await expect(page.locator(`#${id} pre`)).toHaveCount(0);
    const scopes = await page
      .locator('.guide th')
      .evaluateAll((els) => els.map((el) => el.getAttribute('scope')));
    expect(scopes.length).toBe(17 * 3);
    expect(new Set(scopes)).toEqual(new Set(['col']));
  });

  test('every section has a tagline, and notes and taglines render chips', async ({ page }) => {
    const secs = await sections(page);
    for (const s of secs) {
      await expect(page.locator(`#${s.id} .tagline`), s.id).toHaveText(plain(s.tagline));
      if (s.note) await expect(page.locator(`#${s.id} .note`), s.id).toHaveText(plain(s.note));
    }
    await expect(page.locator('#structure .tagline code.inl')).toHaveText('request');
  });

  test("lead's notes render after their table, with their title", async ({ page }) => {
    const withLead = (await sections(page)).filter((s) => s.lead);
    expect(withLead.map((s) => s.id)).toEqual([
      'structure',
      'fixtures',
      'update',
      'delete',
      'advanced',
      'summary',
    ]);
    for (const s of withLead) {
      const note = page.locator(`#${s.id} .table-card + .lead-note`);
      await expect(note, s.id).toHaveText(`${s.leadTitle ?? "Lead's note."} ${plain(s.lead)}`);
    }
    await expect(page.locator('#summary .lead-note strong')).toHaveText(
      'What I would teach a junior first.'
    );
  });

  test('shell and YAML snippets use the shell highlighter', async ({ page }) => {
    const cli = page.locator('#runner tbody tr').nth(1).locator('pre');
    await expect(cli.locator('.tok-keyword').first()).toHaveText('--project');
    await expect(cli.locator('.tok-comment').first()).toHaveText('# pipeline quality gate');
    const yaml = page.locator('#runner tbody tr').nth(2).locator('pre');
    await expect(yaml.locator('.tok-comment').first()).toHaveText(
      '# .github/workflows/api-tests.yml (job steps)'
    );
  });
});

/* ── LINKS BACK TO THE DASHBOARD ───────────────────────────────── */
test.describe('API testing mind map: links to the dashboard', () => {
  test('every link opens a dashboard search that shows at least one tile', async ({ page }) => {
    await page.goto(PATH);
    const hrefs = await page
      .locator('.guide td a.inl')
      .evaluateAll((els) => els.map((el) => el.getAttribute('href')));
    expect(hrefs.length).toBeGreaterThanOrEqual(5);
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

  test('only the features and summary tables link back', async ({ page }) => {
    await page.goto(PATH);
    const scoped = await page
      .locator('.guide td a.inl')
      .evaluateAll((els) => [...new Set(els.map((el) => el.closest('section').id))]);
    expect(scoped.sort()).toEqual(['features', 'summary']);
  });
});

/* ── COPY BUTTONS ──────────────────────────────────────────────── */
test.describe('API testing mind map: copy buttons', () => {
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
    await page.goto(PATH);
    await expect(page.locator('.guide-copy')).toHaveCount(CODE_ROWS);
  });

  test('copies the exact source text, template literals and blank lines included', async ({
    page,
  }) => {
    await stubClipboard(page);
    await page.goto(PATH);

    await page.locator('#structure tbody tr').nth(1).locator('.guide-copy').click();
    await page.locator('#pitfalls tbody tr').first().locator('.guide-copy').click();

    const { copied, expected } = await page.evaluate(() => {
      const rows = (id) => window.apiSections.find((s) => s.id === id).rows;
      return {
        copied: window.__copied,
        expected: [rows('structure')[1][2], rows('pitfalls')[0][2]],
      };
    });
    expect(copied).toEqual(expected);
    expect(copied[0]).toContain('`${this.path}/${id}`');
    expect(copied[1]).toContain('\n\n// Do this\n');
  });

  for (const width of [1280, 390]) {
    test(`the copy button never covers code at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(PATH);
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
    await page.goto(PATH);
    const button = page.locator('.guide-copy').first();
    await button.click();
    await expect(button).toHaveText('✓ Copied!');
    await expect(button).toHaveText('Copy', { timeout: 4000 });
  });

  test('says Select and copy when the clipboard write is rejected', async ({ page }) => {
    await stubClipboard(page, { reject: true });
    await page.goto(PATH);
    const button = page.locator('.guide-copy').first();
    await button.click();
    await expect(button).toHaveText('Select and copy');
  });
});

/* ── LAYOUT ────────────────────────────────────────────────────── */
test.describe('API testing mind map: layout', () => {
  const noSideScroll = (page) =>
    page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);

  test('has no horizontal page scroll on this device', async ({ page }) => {
    await page.goto(PATH);
    expect(await noSideScroll(page)).toBe(true);
  });

  test('every section stacks in one column', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(PATH);
    const wide = await page
      .locator('.guide section')
      .evaluateAll((els) =>
        els
          .filter((sec) => getComputedStyle(sec).gridTemplateColumns.trim().split(/\s+/).length > 1)
          .map((sec) => sec.id)
      );
    expect(wide).toEqual([]);
  });

  test('phone layout stacks rows with labelled cells', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(PATH);

    await expect(page.locator('#structure thead')).toBeHidden();
    const labels = await page
      .locator('#structure tbody tr')
      .first()
      .locator('td')
      .evaluateAll((els) =>
        els.map((el) => ({
          display: getComputedStyle(el).display,
          content: getComputedStyle(el, '::before').content,
        }))
      );
    expect(labels).toEqual([
      { display: 'block', content: '"File"' },
      { display: 'block', content: '"Its job"' },
      { display: 'block', content: '"Code"' },
    ]);
    expect(await noSideScroll(page)).toBe(true);
  });

  for (const width of [1280, 800, 390]) {
    test(`chips stay inside their cell at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(PATH);
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
// The code a reader should be able to copy and trust: the rows that are not flagged
const unflagged = (secs) =>
  secs
    .filter((s) => !s.text)
    .flatMap((s) => s.rows.filter((r) => !r[3]).map((r) => [`${s.id}: ${r[0]}`, r[2]]));

// Every expect(...) whose chain ends in an async matcher, and that is not awaited
function floatingMatchers(code) {
  const found = [];
  for (const m of code.matchAll(/\bexpect\(/g)) {
    let depth = 0;
    let i = m.index + 'expect'.length;
    for (; i < code.length; i++) {
      if (code[i] === '(') depth++;
      else if (code[i] === ')' && --depth === 0) break;
    }
    const asyncMatcher = /^\s*\.(?:not\.)?(?:toBeOK|rejects|resolves)\b/.test(code.slice(i + 1));
    const awaited = /await\s*$/.test(code.slice(0, m.index));
    if (asyncMatcher && !awaited) found.push(code.slice(m.index, i + 12));
  }
  return found;
}

test.describe('API testing mind map: content', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(PATH);
  });

  test('section titles and column headers are exact', async ({ page }) => {
    const expected = {
      features: ['Key features', ['Feature', 'What you get', 'Worth knowing']],
      structure: ['Framework structure', ['File', 'Its job', 'Code']],
      fixtures: ['Fixtures (core)', ['Piece', 'What it does', 'Code']],
      hooks: ['Hooks vs fixtures', ['Aspect', 'beforeEach / afterEach', 'Fixtures']],
      config: ['Config & context', ['File', 'What it sets', 'Code']],
      auth: ['Authentication', ['File', 'What it does', 'Code']],
      get: ['Receive data: GET', ['Example', 'What it shows', 'Code']],
      post: ['Send data: POST', ['Example', 'Body option', 'Code']],
      update: ['Update: PUT, PATCH', ['Example', 'What it proves', 'Code']],
      delete: ['Delete + cleanup', ['Example', 'What it proves', 'Code']],
      assert: ['Assertions', ['Example', 'What it proves', 'Code']],
      advanced: ['Other useful methods', ['Example', 'What it covers', 'Code']],
      hybrid: ['API + UI hybrid', ['Example', 'What it shows', 'Code']],
      runner: ['Runner + reports', ['Example', 'What it gives you', 'Code']],
      pitfalls: ['Junior mistakes', ['Mistake', 'Why it hurts', 'Avoid vs do this']],
      summary: ['Summary', ['Rule', 'In one line', 'Branch']],
      tips: ['Pro tips', ['Tip', 'Do this', 'Payoff']],
    };
    for (const [id, [title, cols]] of Object.entries(expected)) {
      const escaped = title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      await expect(page.locator(`#${id} h2`)).toHaveText(new RegExp(`\\d${escaped}$`));
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

  test('flagged rows are exactly the sixteen junior mistakes', async ({ page }) => {
    const fromData = (await sections(page)).map((s) => s.rows.map((r) => r[3] === true));
    const fromDom = await page
      .locator('.guide section')
      .evaluateAll((els) =>
        els.map((sec) =>
          [...sec.querySelectorAll('tbody tr')].map((tr) => tr.classList.contains('flag'))
        )
      );
    expect(fromDom).toEqual(fromData);
    await expect(page.locator('.guide tr.flag')).toHaveCount(16);
    await expect(page.locator('#pitfalls tr.flag')).toHaveCount(16);
  });

  test('every mistake shows what to avoid, then what to do', async ({ page }) => {
    const pitfalls = (await sections(page)).find((s) => s.id === 'pitfalls');
    for (const [label, , code, flag] of pitfalls.rows) {
      expect(flag, label).toBe(true);
      expect(code, label).toMatch(/^\/\/ Avoid\n/);
      expect(code.split('\n\n// Do this\n'), label).toHaveLength(2);
    }
  });

  test('async matchers are always awaited', async ({ page }) => {
    const floating = unflagged(await sections(page))
      .map(([label, code]) => [label, floatingMatchers(code)])
      .filter(([, found]) => found.length);
    expect(floating).toEqual([]);
  });

  test('every context a snippet opens, it disposes', async ({ page }) => {
    const leaks = unflagged(await sections(page)).filter(
      ([, code]) =>
        (code.match(/\.newContext\(/g) ?? []).length >
        (code.match(/ctx\.dispose\(\)/g) ?? []).length
    );
    expect(leaks.map(([label]) => label)).toEqual([]);
  });

  test('discouraged patterns appear in code only on flagged rows', async ({ page }) => {
    const DISCOURAGED =
      /from 'axios'|data: JSON\.stringify\(|new Promise\(\(r\) => setTimeout|waitForTimeout\(/;
    for (const s of await sections(page)) {
      if (s.text) continue;
      for (const [label, , code, flag] of s.rows) {
        if (DISCOURAGED.test(code)) expect(flag, `${s.id}: ${label}`).toBe(true);
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
    const cells = (await sections(page)).flatMap((s) => [
      s.title,
      s.tagline ?? '',
      s.note ?? '',
      s.lead ?? '',
      ...s.rows.flat(),
    ]);
    const versions = cells
      .filter((c) => typeof c === 'string')
      .flatMap((c) => [...c.matchAll(/\bv(\d+)\.(\d+)/g)].map((m) => [+m[1], +m[2], m[0]]));
    expect(versions.length).toBeGreaterThan(5);
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
        s.tagline ?? '',
        s.note ?? '',
        s.lead ?? '',
        ...s.cols,
        ...s.rows.flat().filter((c) => typeof c === 'string'),
      ]) {
        expect(text, s.id).not.toMatch(/[–—]/);
      }
      if (!s.text)
        for (const r of s.rows) expect(r[2].trim().length, r[0]).toBeGreaterThanOrEqual(20);
    }
    const map = JSON.stringify(await mindMap(page));
    expect(map).not.toMatch(/[–—]/);
  });

  test('the summary has the ten rules, and every branch it names is on the map', async ({
    page,
  }) => {
    const summary = (await sections(page)).find((s) => s.id === 'summary');
    expect(summary.rows).toHaveLength(10);
    const labels = await page
      .locator('.mm-node')
      .evaluateAll((els) => els.map((el) => el.lastChild.textContent));
    for (const [rule, , branches] of summary.rows) {
      for (const branch of branches.split(', ')) expect(labels, rule).toContain(branch);
    }
  });
});

/* ── COLOURS ───────────────────────────────────────────────────── */
// The dashboard palette, as pinned for the other guides, plus the map's own colours
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
  ['.guide .tagline', 'color', 'rgb(226, 232, 240)'],
  ['.guide .lead-note', 'backgroundColor', 'rgb(30, 41, 59)'],
  ['.guide .lead-note strong', 'color', 'rgb(56, 189, 248)'],
  ['.guide .table-card', 'backgroundColor', 'rgb(30, 41, 59)'],
  ['.guide th', 'color', 'rgb(148, 163, 184)'],
  ['.guide td', 'color', 'rgb(203, 213, 225)'],
  ['.guide pre', 'backgroundColor', 'rgb(2, 6, 23)'],
  ['.guide code.inl', 'backgroundColor', 'rgb(2, 6, 23)'],
  ['.guide-copy', 'backgroundColor', 'rgb(56, 189, 248)'],
  ['.guide pre .tok-keyword', 'color', 'rgb(56, 189, 248)'],
  ['.guide pre .tok-string', 'color', 'rgb(74, 222, 128)'],
  ['.guide pre .tok-api', 'color', 'rgb(192, 132, 252)'],
  ['.guide pre .tok-comment', 'color', 'rgb(148, 163, 184)'],
  ['.guide pre .tok-fn', 'color', 'rgb(251, 191, 36)'],
  ['.mm-root', 'backgroundColor', 'rgb(226, 232, 240)'],
  ['.mm-g1 .mm-group-title', 'color', 'rgb(118, 186, 254)'],
  ['.mm-g2 .mm-group-title', 'color', 'rgb(62, 200, 125)'],
  ['.mm-g3 .mm-group-title', 'color', 'rgb(254, 182, 113)'],
  ['.mm-g4 .mm-group-title', 'color', 'rgb(249, 150, 169)'],
  ['.mm-node', 'backgroundColor', 'rgb(30, 41, 59)'],
];

test.describe('API testing mind map: colours', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(PATH);
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
      '.guide .tagline',
      '.guide .note',
      '.guide .lead-note',
      '.guide .lead-note strong',
      '.guide th',
      '.guide td',
      '.guide code.inl',
      '.guide-copy',
      '.guide .foot p',
      '.guide .foot a',
      '.page-tab:not([aria-current])',
      '.page-tab[aria-current]',
      '.guide pre code',
      '.guide pre .tok-keyword',
      '.guide pre .tok-string',
      '.guide pre .tok-api',
      '.guide pre .tok-comment',
      '.guide pre .tok-fn',
      '.mm-root-title',
      '.mm-root-sub',
      '.mm-root-links a',
      '.mm-g1 .mm-group-title',
      '.mm-g2 .mm-group-title',
      '.mm-g3 .mm-group-title',
      '.mm-g4 .mm-group-title',
      '.mm-step',
      '.mm-node',
      '.mm-g1 .mm-num',
      '.mm-g2 .mm-num',
      '.mm-g3 .mm-num',
      '.mm-g4 .mm-num',
      '.mm-heart .mm-node',
      '.mm-leaves li',
      '.mm-sub',
      '.mm-g1.mm-crumb',
      '.mm-g4.mm-crumb',
      '.mm-crumb a',
    ]) {
      expect(await contrastOf(page, selector), selector).toBeGreaterThanOrEqual(4.5);
    }
  });
});
