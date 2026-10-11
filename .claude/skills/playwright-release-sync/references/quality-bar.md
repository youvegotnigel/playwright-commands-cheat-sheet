# Quality bar for cheat sheet entries

`CLAUDE.md` holds the schema, which `data-integrity.spec.js` enforces. This file
covers the judgement calls that no test can check.

## Every claim is sourced

| Claim | Source |
|---|---|
| Method name, parameters, option names, return shape | `.d.ts` of the installed release |
| CLI flag and its argument | `npx playwright test --help` / `npx playwright <cmd> --help` |
| "Added in vX.Y", behaviour change, deprecation | Release notes at the tag (`release-delta.mjs`) |
| Browser support, caveats, defaults | The doc comment in the `.d.ts` (it is generated from the docs source) |
| `docs` URL and anchor | The live playwright.dev page, via the link checker |

If a source contradicts the release notes, the `.d.ts` wins, and the discrepancy
goes in the report.

## Writing an entry

- **name**: the identifier a user would search for, such as `locator.within()`,
  `--shuffle` or `projects (default)`. It must be globally unique. To add an
  option to a concept that already has an entry, follow the existing
  `concept (option)` pattern.
- **level**: `beginner` for the everyday path, `intermediate` for options most
  suites eventually need, `advanced` for specialised, experimental or
  tooling-oriented APIs.
- **desc**: what it does, in one or two sentences. End new APIs with
  `Added in Playwright vX.Y.`
- **tip**: the non-obvious part, such as a gotcha, a default, a browser
  limitation, when to prefer something else, or what it replaces. Do not
  restate desc.
- **code**: a realistic, runnable snippet that shows the key API plus the most
  important variation. Reuse the release notes' example where it is good. Use
  shell snippets for CLI entries (`npx ...` plus `# comment` lines).
  Inside the template literal, write `\${` and `\\`.
- Apply the dash ban to every field, including code comments.
- **Experimental APIs** say so in the tip, together with the flag or setting
  that enables them.

## Placement

Put a new entry next to its closest relative in the same category file, not at
the end by default. Examples: `locator.within()` goes after `locator.visible()`,
and `--shuffle` after `--repeat-each`. New categories are out of scope for a
sync. Propose one under follow-ups instead.

## Finding a real anchor

Docusaurus ships minified HTML with unquoted ids:

```bash
curl -sfL https://playwright.dev/docs/<page> | grep -oE 'id="?[a-z0-9-]+' | sed -E 's/id="?//' | sort -u
```

API methods use `class-<class>#<class>-<method-kebab>`, for example
`class-locator#locator-within`. Overloads get `-1` / `-2` suffixes. Guide
headings get renamed, so prefer an API anchor when one exists.

## Tests

Add one block per release in `tests/data-integrity.spec.js`, following the
existing `Playwright 1.62 entries` / `Playwright 1.64 entries` blocks:

```js
test.describe('Playwright X.Y entries', () => {
  const itemIn = (page, cat, name) =>
    page.evaluate(
      ([c, n]) => categories.find((x) => x.cat === c)?.items.find((i) => i.name === n) ?? null,
      [cat, name]
    );

  test('"<name>" exists in <Category> at level <level>', async ({ page }) => {
    const entry = await itemIn(page, '<Category>', '<name>');
    expect(entry).not.toBeNull();
    expect(entry.level).toBe('<level>');
  });

  test('<name> code shows <the distinguishing detail>', async ({ page }) => {
    const { code } = await itemIn(page, '<Category>', '<name>');
    expect(code).toContain('<the API call that proves the entry is right>');
  });
});
```

Assert the detail that would be wrong if someone copied an older answer, such as
the new option name or the per-parent semantics. Do not just assert that the
name appears.

When an API is removed, add a regression guard so the old form cannot come back
(see `Component Testing uses the stories model`).

`categories` is the page global. Specs must not import project ESM files
directly (see AGENTS.md).

## Report

```
New entries: <name> (<Category>, vX.Y): one line on what and why
Updated: <name>: what changed and which release item caused it
Fixed: broken docs links, stale version references, pre-existing inaccuracies
Deliberately left out: <release-note item>: reason
```
