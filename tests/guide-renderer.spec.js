// Unit tests for js/guide.js: the exported inline() markup and the optional section fields
// renderGuide() learned for the API testing mind map (tagline, lead, leadTitle), the shell
// highlighting rule, and the read time that counts them. Runs on a bare harness page with
// fixture sections, so no guide's real content is involved.
import { test, expect } from '@playwright/test';
import { openHarness } from './helpers/guide.js';

test.beforeEach(async ({ page }) => {
  await openHarness(page);
});

// Renders fixture sections into the harness with the real renderer
const render = (page, sections, linkColumns = {}) =>
  page.evaluate(
    async ([secs, links]) => {
      const { renderGuide } = await import('/js/guide.js');
      window.unitSections = secs;
      renderGuide(secs, { linkColumns: links });
    },
    [sections, linkColumns]
  );

// The smallest valid code section: one row, one snippet
const section = (extra = {}, code = "await page.goto('/home');") => ({
  id: 'one',
  title: 'One',
  cols: ['A', 'B', 'C'],
  rows: [['a', 'b', code]],
  ...extra,
});

/* ── inline() ──────────────────────────────────────────────────── */
test.describe('inline()', () => {
  const inline = (page, text, link = false) =>
    page.evaluate(async ([t, l]) => (await import('/js/guide.js')).inline(t, l), [text, link]);

  test('turns backticks into a highlighted code chip', async ({ page }) => {
    const html = await inline(page, 'Use `page.goto()` first');
    expect(html).toMatch(/^Use <code class="inl">.*<\/code> first$/);
    expect(html).toContain('<span class="tok-api">page</span>');
  });

  test('turns <tag>X</tag> into a warning tag', async ({ page }) => {
    expect(await inline(page, 'Old way <tag>Avoid</tag>')).toBe(
      'Old way <span class="tag">Avoid</span>'
    );
  });

  test('escapes HTML in plain text and in chips', async ({ page }) => {
    const html = await inline(page, '<b>bold</b> and `a < b`');
    expect(html).not.toContain('<b>');
    expect(html).toContain('&lt;b&gt;bold&lt;/b&gt;');
    expect(html).toContain('a &lt; b');
  });

  test('links a chip to the dashboard only when asked and a command matches', async ({ page }) => {
    const linked = await inline(page, '`request.get()`', true);
    expect(linked).toContain(`href="index.html#search=${encodeURIComponent('request.get()')}"`);
    expect(await inline(page, '`request.get()`', false)).not.toContain('<a');
    // No command mentions it, so it stays a plain chip
    expect(await inline(page, '`zzNoSuchMethod()`', true)).not.toContain('<a');
  });

  test('leaves text without markup untouched', async ({ page }) => {
    expect(await inline(page, 'Plain words, nothing else.')).toBe('Plain words, nothing else.');
  });
});

/* ── tagline and note ──────────────────────────────────────────── */
test.describe('renderGuide(): tagline and note', () => {
  test('a tagline renders right under the heading, with chips', async ({ page }) => {
    await render(page, [section({ tagline: 'Specs call `request`', note: 'A note.' })]);
    const order = await page
      .locator('#one')
      .evaluate((sec) => [...sec.children].map((el) => el.className || el.tagName));
    expect(order.slice(0, 3)).toEqual(['H2', 'tagline', 'note']);
    await expect(page.locator('#one .tagline')).toHaveText('Specs call request');
    await expect(page.locator('#one .tagline code.inl')).toHaveText('request');
  });

  test('no tagline field, no tagline element', async ({ page }) => {
    await render(page, [section()]);
    await expect(page.locator('#one .tagline')).toHaveCount(0);
    await expect(page.locator('#one .note')).toHaveCount(0);
  });

  test('notes render inline markup, and escape HTML', async ({ page }) => {
    await render(page, [section({ note: 'Use `params` <i>always</i>' })]);
    await expect(page.locator('#one .note code.inl')).toHaveText('params');
    await expect(page.locator('#one .note')).toHaveText('Use params <i>always</i>');
    await expect(page.locator('#one .note i')).toHaveCount(0);
  });
});

/* ── lead's note ───────────────────────────────────────────────── */
test.describe("renderGuide(): lead's note", () => {
  test('renders after the table with the default title', async ({ page }) => {
    await render(page, [section({ lead: 'Clients never assert.' })]);
    const lead = page.locator('#one .table-card + .lead-note');
    await expect(lead).toHaveText("Lead's note. Clients never assert.");
    await expect(lead.locator('strong')).toHaveText("Lead's note.");
  });

  test('leadTitle replaces the default title', async ({ page }) => {
    await render(page, [section({ lead: 'Write one test.', leadTitle: 'Teach this first.' })]);
    await expect(page.locator('#one .lead-note strong')).toHaveText('Teach this first.');
    await expect(page.locator('#one .lead-note')).not.toContainText("Lead's note.");
  });

  test('takes chips and escapes HTML', async ({ page }) => {
    await render(page, [
      section({ lead: '`maxRetries` is not <b>5xx</b>', leadTitle: '<i>T</i>' }),
    ]);
    await expect(page.locator('#one .lead-note code.inl')).toHaveText('maxRetries');
    await expect(page.locator('#one .lead-note b, #one .lead-note i')).toHaveCount(0);
    await expect(page.locator('#one .lead-note strong')).toHaveText('<i>T</i>');
  });

  test('no lead field, no callout', async ({ page }) => {
    await render(page, [section()]);
    await expect(page.locator('.lead-note')).toHaveCount(0);
  });

  test('works on prose sections too', async ({ page }) => {
    await render(page, [section({ text: true, lead: 'Prose lead.' }, 'prose third column')]);
    await expect(page.locator('#one pre')).toHaveCount(0);
    await expect(page.locator('#one .lead-note')).toContainText('Prose lead.');
  });
});

/* ── shell highlighting ────────────────────────────────────────── */
test.describe('renderGuide(): highlighter choice', () => {
  const tokens = async (page, code) => {
    await render(page, [section({}, code)]);
    return page
      .locator('#one pre code span')
      .evaluateAll((els) => els.map((el) => [el.className, el.textContent]));
  };

  test('a snippet starting with npx uses the shell highlighter', async ({ page }) => {
    const toks = await tokens(page, 'npx playwright test --grep @smoke   # quality gate');
    expect(toks).toContainEqual(['tok-api', 'npx']);
    expect(toks).toContainEqual(['tok-keyword', '--grep']);
    expect(toks).toContainEqual(['tok-comment', '# quality gate']);
  });

  test('a snippet starting with a # comment uses it too, after leading space', async ({ page }) => {
    const toks = await tokens(page, '  # .github/workflows/api.yml\n- run: npm ci');
    expect(toks).toContainEqual(['tok-comment', '# .github/workflows/api.yml']);
    expect(toks).toContainEqual(['tok-api', 'npm']);
  });

  test('a JS snippet keeps the JS highlighter, // stays a comment', async ({ page }) => {
    const toks = await tokens(page, "await page.goto('/x'); // go");
    expect(toks).toContainEqual(['tok-keyword', 'await']);
    expect(toks).toContainEqual(['tok-comment', '// go']);
  });

  test('a # later in a JS snippet does not switch highlighters', async ({ page }) => {
    const toks = await tokens(page, "const url = '/a#b';\nawait page.goto(url);");
    expect(toks).toContainEqual(['tok-keyword', 'const']);
    expect(toks.some(([cls]) => cls === 'tok-comment')).toBe(false);
  });

  test('Copy still copies the exact shell source', async ({ page }) => {
    await page.addInitScript(() => {
      window.__copied = [];
      Object.defineProperty(navigator, 'clipboard', {
        configurable: true,
        value: { writeText: (t) => (window.__copied.push(t), Promise.resolve()) },
      });
    });
    await page.reload();
    const code = '# CLI\nnpx playwright test --last-failed';
    await render(page, [section({}, code)]);
    await page.locator('#one .guide-copy').click();
    expect(await page.evaluate(() => window.__copied)).toEqual([code]);
    await expect(page.locator('#one pre')).toHaveText(code);
  });
});

/* ── read time ─────────────────────────────────────────────────── */
test.describe('renderGuide(): read time', () => {
  // One section with 7 words of its own: title, three column names and three cells
  const words = (n) => Array.from({ length: n }, (_, i) => `w${i}`).join(' ');
  const base = (extra) => section({ ...extra }, 'code');

  test('a tiny guide reads in at least 1 min', async ({ page }) => {
    await render(page, [base({})]);
    await expect(page.locator('#read-time')).toHaveText('1 min');
  });

  test('tagline words count: 7 + 293 = 300 words is 2 min at 200 a minute', async ({ page }) => {
    await render(page, [base({ tagline: words(293) })]);
    await expect(page.locator('#read-time')).toHaveText('2 min');
  });

  test("lead's note words count too", async ({ page }) => {
    await render(page, [base({ lead: words(293) })]);
    await expect(page.locator('#read-time')).toHaveText('2 min');
  });

  test('just under the rounding line stays at 1 min', async ({ page }) => {
    // 7 + 100 + 192 = 299 words, 1.495 minutes
    await render(page, [base({ tagline: words(100), lead: words(192) })]);
    await expect(page.locator('#read-time')).toHaveText('1 min');
  });

  test('leadTitle is not counted, only shown', async ({ page }) => {
    // 7 + 291 + 1 = 299 words: 1 min. Counting the 50-word title would make it 2 min.
    await render(page, [base({ tagline: words(291), leadTitle: words(50), lead: 'x' })]);
    await expect(page.locator('#read-time')).toHaveText('1 min');
  });
});
