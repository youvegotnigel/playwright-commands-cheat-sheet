# Task: sync the Playwright cheat sheet with current Playwright

You are running headless in GitHub Actions. Keep this repo's command data
(`js/data/*.js`) accurate against the **latest stable** Playwright release and
open a **pre-validated pull request** with the changes.

**You never merge, and never push to `master` or `develop`.** Every change goes
through a pull request that the maintainer (Nigel) reviews and merges manually.
Do not enable auto-merge, do not approve your own PR, and do not bypass branch
protection.

## How to do the sync

Read `.claude/skills/playwright-release-sync/SKILL.md` and its
`references/quality-bar.md`, then follow the workflow exactly. They are the
single source of truth for what to change and to what standard. Also obey
`CLAUDE.md` and `AGENTS.md`.

The workflow's "Detect drift" step already ran both helper scripts. Its output
is in the file named by the `DRIFT_REPORT` environment variable, which is
outside the repo. Read it first:

- If the pinned version is behind, do the full workflow.
- If only docs links are broken, do steps 7 and 9 to 11 only.
- If it was a manual run with no drift, do a quick sanity check of steps 5
  and 7, and exit with no PR when nothing is wrong.

CI differences from the skill:

- Browsers for chromium and webkit are already installed for the version in
  `package-lock.json`. After a version bump, run
  `npx playwright install chromium webkit` again.
- Gate with `npm run lint`, `npm run format:check`, `npm run test:chromium`, and
  the link checker. The two mobile projects add cost without catching data
  issues. They run on the human side.
- Keep changes scoped. Do not rename categories, change `cls`/`color`,
  restructure files, or touch the highlighter or UI. Propose a new category
  under "Suggested follow-ups" instead of creating it.

## Output

Behaviour depends on the `DRY_RUN` environment variable and on whether anything
changed:

- **No changes:** exit 0. Do not create a branch or PR.
- **`DRY_RUN` is `true`:** do not create a branch, commit, or PR. Write the full
  report (skill step 11) and the full `git diff` to `$GITHUB_STEP_SUMMARY`, then
  exit 0.
- **`DRY_RUN` is `false` and every gate passes:**
  1. Check for an existing **open** PR whose head branch starts with
     `bot/cheatsheet-sync-`. If one exists, update that branch instead of
     stacking a duplicate. Otherwise create `bot/cheatsheet-sync-<YYYY-MM-DD>`.
  2. Commit as the bot identity with a Conventional Commit message
     (`chore: sync cheat sheet with Playwright vX.Y.Z`). The body is the skill's
     step 11 report.
  3. Push and open a PR against the default branch with `gh pr create`. The PR
     body is the same report, with "New entries", "Updated", "Fixed" and
     "Deliberately left out" sections.
- **`DRY_RUN` is `false` but a gate fails and you cannot legitimately fix it:**
  open the PR as a **draft** (`gh pr create --draft`), prefix the title with
  `[CI FAILING]`, try `gh pr edit --add-label ci-failing` (ignore it if the label
  does not exist), and paste the failing output under a "Failing checks"
  heading. Never open a non-draft PR on red, and never weaken a test to make it
  green.

## Bot identity for commits

```bash
git config user.name  "github-actions[bot]"
git config user.email "41898282+github-actions[bot]@users.noreply.github.com"
```
