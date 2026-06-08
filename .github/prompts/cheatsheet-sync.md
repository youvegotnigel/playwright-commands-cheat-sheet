# Task: sync the Playwright cheat sheet with current Playwright

You are running headless in GitHub Actions. Your job is to keep this repo's
command data (`js/data/*.js`) accurate against the **current** Playwright release
and open a **pre-validated pull request** with any fixes.

**You never merge, and never push to `master` or `develop`.** Every change goes
through a pull request that the maintainer (Nigel) reviews and merges manually.
Do not enable auto-merge, do not approve your own PR, and do not bypass branch
protection. Your output is always a PR awaiting human approval, nothing more.

Read and obey `CLAUDE.md`, `AGENTS.md`, and `README.md` in full — they define the
data schema, the "all fields required" rule, the Context7 accuracy rule, the **no
em-dash / en-dash rule**, and the contributor conventions for adding commands.
Any new command you add must follow the "Adding a New Command" guidance in
`README.md` and `AGENTS.md`. Everything below is the task on top of those rules.

## Authoritative source: Context7 (not your training data)

Verify every claim against the live Playwright docs through the Context7 MCP
server. Resolve the library id for `/microsoft/playwright`, then query the docs
for each command you inspect. Do **not** rely on memory for signatures,
deprecations, or URLs — that is the entire reason Context7 is wired in.

If Context7 is unavailable or rate-limited, stop: log the failure and exit
**without** opening a low-confidence PR. A wrong PR is worse than no PR.

## Steps

1. Read `package.json`, every file in `js/data/`, `CLAUDE.md`, `AGENTS.md`, and
   `README.md`.
2. Determine the **latest stable** Playwright version (via Context7 / npm).
   Note the version currently pinned as `@playwright/test` in `package.json`.
   **If the pinned version already equals the latest stable, there is almost
   certainly no drift: do a quick sanity check and exit early with no PR rather
   than re-verifying every command.**
3. **Work changelog-first to stay cheap (this controls the cost of the run).**
   Do NOT fetch full docs for all ~100 commands. Instead, query Context7 once for
   the **release notes / changelog between the pinned version and latest**, build
   a short list of APIs that were deprecated, changed, or added, and then only
   deep-verify:
   - the documented commands whose API appears in that changelog delta, and
   - your shortlist of candidate new commands (step 4).
   Leave unchanged commands alone without re-querying their docs. For each command
   you do verify against the current docs:
   - Is it **deprecated** or removed? If deprecated, keep the entry but note it
     in `tip` and point to the replacement. If fully removed, replace it with the
     current equivalent rather than deleting outright.
   - Has the **signature / behavior** changed? Update `desc` / `code` / `tip`.
   - Is the `docs` URL **broken or moved**? Fix it (must be a real
     `https://playwright.dev/...` URL).
4. Identify a **small** number (roughly 1-5) of **genuinely high-value new
   commands** introduced in recent releases that fit an existing category, and
   add them as new entries. Be conservative: quality over coverage.
5. **Version bump:** if the latest stable Playwright is newer than the pinned
   version, bump the `@playwright/test` devDependency in `package.json` to it in
   this same PR, so the version badge, the dependency, and the documented
   behavior stay consistent.
6. **Keep the documentation consistent.** If your changes warrant it, update the
   docs in the same PR so nothing drifts:
   - On a version bump, update every hardcoded Playwright version reference,
     including the **version badge in `README.md`** and the **version line in
     `CLAUDE.md`**, to match `package.json`.
   - If you add a command in a way that affects documented examples, category
     lists, or counts in `README.md`, `AGENTS.md`, or `CLAUDE.md`, update those
     too. (The live command count in the app is computed automatically, so it
     needs no manual edit.)
   - Make only the documentation changes that your data changes actually require.
     Do not rewrite or restructure the docs beyond that.
7. **Add or update tests for what you change.** Tests live in `tests/`.
   - The generic checks in `data-integrity.spec.js` already validate every
     entry's schema, level, docs URL, and the no-dash rule, so a plain new entry
     needs no extra test.
   - When you add a **notable** new command or change an existing feature in a
     way worth pinning down, add or update a **targeted** test, following the
     existing per-entry pattern (see the `test.info() entry` block in
     `data-integrity.spec.js`): assert the entry exists in the right category,
     has the expected `level`, and that its `code` covers the key API.
   - When you change an existing entry that a test already asserts on, update
     that test so it matches the new behavior.
   - Keep tests meaningful: do not add redundant tests that merely duplicate the
     generic schema checks, and do not weaken or delete a failing assertion just
     to make it pass.

## Hard rules for any edit

- Follow the exact data shape used by surrounding entries (compact object
  literal; all of `name`, `level`, `desc`, `tip`, `docs`, `code` present).
- **No em-dashes (—) or en-dashes (–)** in any field. Use periods, commas, or
  colons to break sentences, and a hyphen `-` for ranges.
- `level` is one of `beginner` | `intermediate` | `advanced`.
- `docs` URLs must start with `https://` and point to `playwright.dev`.
- Do **not** rename categories, change `cls`/`color`, restructure files, mass-add
  every new API, or touch the highlighter or UI. You **may** add or update
  targeted tests in `tests/` for the entries you change (see step 7), but do not
  restructure the test suite or alter unrelated tests.

## Validate, then open the PR

Run the project's own gates and only proceed on green. This includes any tests
you added or updated in step 7 — they are part of the gate, not optional.

Run the **chromium project only** — it exercises every test (including
`data-integrity.spec.js` and its dash guard) once. The two mobile projects rerun
the same data checks and add cost/time without catching data issues, so skip them
here; the full 3-project suite still runs in CI on the human side if a PAT is set.

```bash
npm run lint
npm run test:chromium
```

Behavior depends on the `DRY_RUN` environment variable and on whether anything
changed:

- **No changes at all:** exit 0. Do not create a branch or PR.
- **`DRY_RUN` is `true`:** do **not** create a branch, commit, or PR. Write a
  clear summary of the proposed changes and the full `git diff` to the GitHub
  Actions **job summary** (`$GITHUB_STEP_SUMMARY`), then exit 0.
- **`DRY_RUN` is `false` and lint + tests pass:**
  1. Create a branch named `bot/cheatsheet-sync-<YYYY-MM-DD>`.
  2. Before creating it, check for an existing **open** PR whose head branch
     starts with `bot/cheatsheet-sync-`; if one exists, update that branch
     instead of stacking a duplicate.
  3. Commit as the bot identity with a Conventional Commit message
     (e.g. `chore: sync cheat sheet with Playwright vX.Y.Z`).
  4. Push and open a PR against the default branch with `gh pr create`. The PR
     body must list **every** change (what and why, with the Playwright version),
     a "New entries added" section, and a "Suggested follow-ups" section for
     anything you chose not to include.
- **`DRY_RUN` is `false` but lint or tests fail and you cannot legitimately fix
  them:** the PR must be **flagged, not hidden**. Open it as a **draft**
  (`gh pr create --draft`), prefix the title with `[CI FAILING]`, add the
  `ci-failing` label if available (`gh pr edit --add-label ci-failing`, ignore if
  the label does not exist), and paste the full failing `npm run lint` /
  `npm run test:chromium` output into the PR body under a "Failing checks" heading. Never open a non-draft
  PR when lint or tests are red, never silence a failure by weakening a test, and
  never merge. A human decides what to do with a flagged PR.

## Bot identity for commits

```bash
git config user.name  "github-actions[bot]"
git config user.email "41898282+github-actions[bot]@users.noreply.github.com"
```
