# Syntax Highlighting — Design

**Date:** 2026-06-07
**Status:** Approved

## Goal

Highlight the JS/TS Playwright code shown in the command modal. Today the
snippet renders as a plain `<pre>` with no color. Highlighting makes the
snippets easier to scan and gives the modal a clear visual upgrade.

## Constraints

- The site is vanilla ES modules with **no build step**, served from GitHub
  Pages, and should keep working **offline**.
- Therefore: no CDN, no third-party library. A small, self-contained,
  dependency-free highlighter written in vanilla JS.
- The existing **Copy** button must keep copying the exact original snippet.

## Architecture

A new standalone module `js/highlight.js` exporting one pure function:

```
highlight(code: string) -> string   // HTML-escaped markup with <span> wrappers
```

No state, no DOM access, no dependencies — testable in isolation.

### Tokenizing (single-pass, escape-safe)

Use one combined regular expression with ordered alternatives (comments,
strings, numbers, keywords, Playwright APIs, method names). Scan the input
left-to-right with a single replacer that classifies each match and wraps it
in `<span class="tok-…">`. Text *between* matches is HTML-escaped and emitted
as plain text.

This one-pass approach:
- Avoids the classic highlighter bug of re-highlighting inside tokens that
  were already wrapped.
- Guarantees **every** character is HTML-escaped, so a snippet containing
  `<`, `>`, or `&` cannot break the DOM or inject markup.

### Token classes → colors (site palette)

| Class          | Matches                                              | Color                     |
| -------------- | ---------------------------------------------------- | ------------------------- |
| `tok-keyword`  | `await`, `const`, `let`, `async`, `function`, `return`, `new`, `if`, `else`, `for`, `of`, `import`, `from`, `export`, `true`, `false`, `null`, `undefined` | cyan `#38bdf8`   |
| `tok-string`   | `'…'`, `"…"`, `` `…` ``                                | green `#4ade80`           |
| `tok-api`      | `page`, `expect`, `browser`, `context`, `test`       | purple `#c084fc`          |
| `tok-number`   | numeric literals                                     | orange `#fb923c`          |
| `tok-comment`  | `//…`, `/*…*/`                                        | gray `#64748b`, italic    |
| `tok-fn`       | identifier immediately followed by `(`               | yellow `#fbbf24`          |
| (default)      | everything else                                      | inherited `#e2e8f0`       |

Colors live in `style.css` as `.tok-*` rules scoped under the modal `pre`.

## Integration

In `js/app.js` `openModal()`, change:

```js
document.getElementById('m-code').innerText = item.code;
```

to:

```js
document.getElementById('m-code').innerHTML = highlight(item.code);
```

The **Copy** button reads `#m-code`'s `innerText`, which returns the visible
text without span tags — so it keeps producing the exact original snippet,
unchanged. No change needed to `copyCode()`.

## Testing (`tests/highlight.spec.js`)

- Opening a modal renders `.tok-keyword` and `.tok-string` spans inside
  `#m-code`.
- **Round-trip integrity:** `#m-code` `innerText` equals the raw `item.code`
  for a sample of commands. This proves Copy is unaffected — the key safety
  test.
- A snippet containing `<` / `>` is rendered escaped (no injected elements);
  assert no unexpected child elements appear and the visible text is intact.

Tests mock nothing — they exercise the real module through the page, matching
the existing suite's conventions.

## Out of scope

- Highlighting anything other than the modal code block (e.g. inline text).
- Multi-language snippets (Python/Java/.NET) — separate future feature.
- A full grammar/AST tokenizer — the regex highlighter is sufficient for
  these short snippets.
