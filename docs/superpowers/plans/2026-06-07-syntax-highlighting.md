# Syntax Highlighting Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add dependency-free syntax highlighting to the command modal's code block.

**Architecture:** A standalone pure module `js/highlight.js` exports `highlight(code) → htmlString`, doing a single-pass, escape-safe regex tokenization. `js/app.js` imports it, exposes it on `window` for tests (mirroring `window.categories`), and renders highlighted HTML into `#m-code`. Colors are `.tok-*` CSS rules. The Copy button is unaffected because it reads `innerText`, which strips the span tags.

**Tech Stack:** Vanilla ES modules (no build step), Playwright tests, ESLint flat config.

---

### Task 1: Highlighter module + unit tests

**Files:**
- Create: `js/highlight.js`
- Modify: `js/app.js` (add import + `window.highlight` exposure)
- Modify: `eslint.config.js` (add `window` to the tests globals)
- Test: `tests/highlight.spec.js`

- [ ] **Step 1: Write the failing tests**

Create `tests/highlight.spec.js`:

```js
import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
});

test.describe('highlight() — tokenizing', () => {
  test('wraps keywords, strings, and Playwright APIs in token spans', async ({
    page,
  }) => {
    const html = await page.evaluate(() =>
      window.highlight("await page.goto('/home');")
    );
    expect(html).toContain('tok-keyword'); // await
    expect(html).toContain('tok-api'); // page
    expect(html).toContain('tok-string'); // '/home'
  });

  test('escapes HTML so snippets cannot inject markup', async ({ page }) => {
    const html = await page.evaluate(() =>
      window.highlight('const x = a < b && c > d;')
    );
    expect(html).toContain('&lt;');
    expect(html).toContain('&gt;');
    expect(html).toContain('&amp;');
    expect(html).not.toContain('< b'); // raw angle bracket must be gone
  });

  test('preserves the original text exactly (Copy stays correct)', async ({
    page,
  }) => {
    const code = 'await expect(page).toHaveTitle(/Home/); // checks title';
    const text = await page.evaluate((c) => {
      const div = document.createElement('div');
      div.innerHTML = window.highlight(c);
      return div.textContent;
    }, code);
    expect(text).toBe(code);
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx playwright test highlight.spec.js --project=chromium`
Expected: FAIL — `window.highlight` is not a function (undefined).

- [ ] **Step 3: Create the highlighter module**

Create `js/highlight.js`:

```js
// =============================================================
// highlight.js — tiny dependency-free highlighter for JS/TS snippets
// Returns HTML-escaped markup with <span class="tok-*"> wrappers.
// Single pass: text between matched tokens is escaped and emitted
// plain, so every character is escaped exactly once.
// =============================================================

const KEYWORDS = new Set([
  'await', 'const', 'let', 'var', 'async', 'function', 'return', 'new',
  'if', 'else', 'for', 'of', 'in', 'import', 'from', 'export', 'default',
  'true', 'false', 'null', 'undefined', 'typeof', 'instanceof', 'class',
  'extends', 'try', 'catch', 'finally', 'throw', 'while', 'do', 'switch',
  'case', 'break', 'continue',
]);

const APIS = new Set(['page', 'expect', 'browser', 'context', 'test', 'request']);

function escapeHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// Ordered alternatives: comment | string | number | identifier
const TOKEN_RE =
  /(\/\/[^\n]*|\/\*[\s\S]*?\*\/)|('(?:\\.|[^'\\])*'|"(?:\\.|[^"\\])*"|`(?:\\.|[^`\\])*`)|(\b\d+(?:\.\d+)?\b)|([A-Za-z_$][\w$]*)/g;

export function highlight(code) {
  let out = '';
  let last = 0;
  let m;
  TOKEN_RE.lastIndex = 0;
  while ((m = TOKEN_RE.exec(code)) !== null) {
    out += escapeHtml(code.slice(last, m.index));
    const [, comment, string, number, ident] = m;
    if (comment !== undefined) {
      out += `<span class="tok-comment">${escapeHtml(comment)}</span>`;
    } else if (string !== undefined) {
      out += `<span class="tok-string">${escapeHtml(string)}</span>`;
    } else if (number !== undefined) {
      out += `<span class="tok-number">${escapeHtml(number)}</span>`;
    } else {
      let cls = null;
      if (KEYWORDS.has(ident)) cls = 'tok-keyword';
      else if (APIS.has(ident)) cls = 'tok-api';
      else if (code[TOKEN_RE.lastIndex] === '(') cls = 'tok-fn';
      out += cls
        ? `<span class="${cls}">${escapeHtml(ident)}</span>`
        : escapeHtml(ident);
    }
    last = TOKEN_RE.lastIndex;
  }
  out += escapeHtml(code.slice(last));
  return out;
}
```

- [ ] **Step 4: Wire the module into app.js and expose for tests**

In `js/app.js`, add the import next to the existing data import (line 5):

```js
import { categories } from './data/index.js';
import { highlight } from './highlight.js';
```

Below the existing `window.categories = categories;` (line 8), add:

```js
// Expose for tests via page.evaluate() (same rationale as window.categories)
window.highlight = highlight;
```

- [ ] **Step 5: Add `window` to the ESLint tests globals**

In `eslint.config.js`, in the `files: ['tests/**/*.js']` block, add `window` to the `globals` object:

```js
        categories: 'readonly',
        window: 'readonly',
        document: 'readonly',
        getComputedStyle: 'readonly',
        fetch: 'readonly',
        localStorage: 'readonly',
```

- [ ] **Step 6: Run the tests to verify they pass**

Run: `npx playwright test highlight.spec.js --project=chromium`
Expected: PASS (3 tests).

- [ ] **Step 7: Lint**

Run: `npx eslint js/ tests/`
Expected: no errors.

- [ ] **Step 8: Commit**

```bash
git add js/highlight.js js/app.js eslint.config.js tests/highlight.spec.js
git commit -m "feat: add dependency-free syntax highlighter for code snippets"
```

---

### Task 2: Render highlighted code in the modal + colors

**Files:**
- Modify: `js/app.js` (`openModal`, the `#m-code` line)
- Modify: `style.css` (add `.tok-*` rules)
- Test: `tests/highlight.spec.js` (add a DOM describe block)

- [ ] **Step 1: Write the failing DOM tests**

Append to `tests/highlight.spec.js`:

```js
test.describe('highlight() — in the modal', () => {
  test('renders token spans inside the code block', async ({ page }) => {
    await page.locator('.tile').first().click();
    await expect(
      page
        .locator('#m-code .tok-keyword, #m-code .tok-string, #m-code .tok-api')
        .first()
    ).toBeVisible();
  });

  test('modal code text matches the source command exactly', async ({
    page,
  }) => {
    const tiles = page.locator('.tile');
    const count = Math.min(await tiles.count(), 8);
    for (let i = 0; i < count; i++) {
      const name = await tiles.nth(i).locator('.tile-name').innerText();
      await tiles.nth(i).click();
      const shown = await page
        .locator('#m-code')
        .evaluate((el) => el.textContent);
      const expected = await page.evaluate((n) => {
        for (const cat of window.categories)
          for (const item of cat.items) if (item.name === n) return item.code;
        return null;
      }, name);
      expect(shown).toBe(expected);
      await page.locator('.btn-close').click();
    }
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx playwright test highlight.spec.js --project=chromium -g "in the modal"`
Expected: FAIL — `#m-code` has no `.tok-*` spans yet (code is plain text).

- [ ] **Step 3: Render highlighted HTML in the modal**

In `js/app.js` `openModal()`, change the code line (currently
`document.getElementById('m-code').innerText  = item.code;`) to:

```js
  document.getElementById('m-code').innerHTML  = highlight(item.code);
```

- [ ] **Step 4: Add the token colors**

In `style.css`, immediately after the `pre { … }` rule, add:

```css
/* Syntax highlighting tokens (see js/highlight.js) */
#m-code .tok-keyword { color: #38bdf8; }
#m-code .tok-string  { color: #4ade80; }
#m-code .tok-api     { color: #c084fc; }
#m-code .tok-number  { color: #fb923c; }
#m-code .tok-comment { color: #64748b; font-style: italic; }
#m-code .tok-fn      { color: #fbbf24; }
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `npx playwright test highlight.spec.js --project=chromium`
Expected: PASS (5 tests).

- [ ] **Step 6: Run the full suite to verify no regressions**

Run: `npx playwright test`
Expected: all tests PASS across chromium, iPhone 16, Pixel 7. In particular,
the existing `Modal › Copy` tests still pass (Copy reads `innerText`).

- [ ] **Step 7: Lint**

Run: `npx eslint js/ tests/`
Expected: no errors.

- [ ] **Step 8: Commit**

```bash
git add js/app.js style.css tests/highlight.spec.js
git commit -m "feat: render syntax-highlighted code in the command modal"
```

---

## Notes for the implementer

- The `tok-fn` rule (identifier followed by `(`) classifies method/function
  names like `goto` in `page.goto(`. Keywords and APIs are checked first, so
  `if (` stays a keyword, not a function.
- `TOKEN_RE` is a module-level regex with the `g` flag; `highlight()` resets
  `lastIndex` at the start of each call so repeated calls are deterministic.
- Do not change `copyCode()` — it intentionally reads `innerText`, which
  returns the visible text without the span tags.
