# Task: sync the Playwright cheat sheet with current Playwright

You are running headless in GitHub Actions. Your job is to keep this repo's
command data (`js/data/*.js`) accurate against the **current** Playwright release
and open a **pre-validated pull request** with any fixes. You never merge.

Read and obey `CLAUDE.md` and `AGENTS.md` in full — they define the data schema,
the "all fields required" rule, the Context7 accuracy rule, and the **no
em-dash / en-dash rule**. Everything below is the task on top of those rules.

## Authoritative source: Context7 (not your training data)

Verify every claim against the live Playwright docs through the Context7 MCP
server. Resolve the library id for `/microsoft/playwright`, then query the docs
for each command you inspect. Do **not** rely on memory for signatures,
deprecations, or URLs — that is the entire reason Context7 is wired in.

If Context7 is unavailable or rate-limited, stop: log the failure and exit
**without** opening a low-confidence PR. A wrong PR is worse than no PR.

## Steps

1. Read `package.json`, every file in `js/data/`, `CLAUDE.md`, and `AGENTS.md`.
2. Determine the **latest stable** Playwright version (via Context7 / npm).
   Note the version currently pinned as `@playwright/test` in `package.json`.
3. For each documented command, verify against the current docs:
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

## Hard rules for any edit

- Follow the exact data shape used by surrounding entries (compact object
  literal; all of `name`, `level`, `desc`, `tip`, `docs`, `code` present).
- **No em-dashes (—) or en-dashes (–)** in any field. Use periods, commas, or
  colons to break sentences, and a hyphen `-` for ranges.
- `level` is one of `beginner` | `intermediate` | `advanced`.
- `docs` URLs must start with `https://` and point to `playwright.dev`.
- Do **not** rename categories, change `cls`/`color`, restructure files, mass-add
  every new API, or touch the highlighter, UI, or tests.

## Validate, then open the PR

Run the project's own gates and only proceed on green:

```bash
npm run lint
npm test
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
- **`DRY_RUN` is `false` but lint or tests fail and you cannot fix them:** open
  the PR as a **draft** with `gh pr create --draft`, and put the failing command
  output in the PR body. Never open a non-draft PR that is not green. Never merge.

## Bot identity for commits

```bash
git config user.name  "github-actions[bot]"
git config user.email "41898282+github-actions[bot]@users.noreply.github.com"
```
