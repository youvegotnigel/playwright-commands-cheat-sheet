# Playwright Cheat Sheet Sync Action — Design

**Date:** 2026-06-08
**Status:** Approved

## Goal

Keep the cheat sheet data (`js/data/*.js`) accurate as Playwright ships new
versions, deprecates methods, and changes signatures — without a human manually
diffing the docs each release. A scheduled GitHub Action runs Claude Code with
the Context7 MCP server (current Playwright docs) and opens a **pre-validated
pull request** with the fixes for human review.

This is a recurring maintenance task, so the value is in automating the tedious
part (finding drift, drafting the edits) while keeping a human merge gate.

## Constraints

- The site is vanilla ES modules with **no build step**. The action only edits
  data files, `package.json`, and runs the existing npm scripts; it introduces
  no new runtime dependencies into the app.
- **Never auto-merge.** The action opens a PR; a human reviews and merges. The
  agent has no authority to push to `master`/`develop` directly.
- **Every PR must be pre-validated.** The agent runs `npm run lint` and
  `npm test` (the full Playwright suite, including `data-integrity.spec.js` and
  its em-dash/en-dash guard) before opening a non-draft PR.
- **The project's own rules govern the edits.** Claude Code auto-loads
  `CLAUDE.md` and `AGENTS.md`; the data schema, "all fields required," the
  Context7 accuracy rule, and the **no em-dash / en-dash rule** are therefore
  already in the agent's context. The task prompt must not contradict them.
- **Least-privilege CI.** The workflow requests only `contents: write` and
  `pull-requests: write`.
- **Bounded cost.** Pinned model + a `--max-turns` cap; ~12 scheduled runs/year;
  a run that finds no drift opens no PR.

## Decisions (settled during brainstorming)

- **Output:** a pull request that edits the data files directly (not an issue,
  not a comment). CI + human review are the safety net.
- **Trigger:** monthly cron (`0 6 1 * *`, 06:00 UTC on the 1st) to match
  Playwright's ~monthly cadence, plus `workflow_dispatch` for on-demand runs.
  The manual trigger exposes a `dry_run` boolean input that performs the scan
  and prints the proposed diff to the job summary **without** creating a PR.
- **Scope:** correctness **plus** a small set of curated new entries. The agent
  may:
  - update `desc` / `tip` / `code` / `docs` for drift,
  - mark deprecated methods (note in `tip`, keep the entry),
  - repair broken or moved `docs` URLs,
  - add a **few** genuinely high-value new commands from recent releases.

  The agent must **not** mass-add every new API, restructure files, rename
  categories, or change colors/`cls` values.
- **Version target (the judgment call, confirmed by user):** the agent checks
  the latest stable Playwright. If it is newer than the `@playwright/test`
  version pinned in `package.json`, the **same PR bumps that devDependency** and
  syncs the entries to that version, so the version badge (read from
  `package.json`), the dependency, and the documented behavior stay consistent.
  Plain dependency-only bumps remain Dependabot's responsibility; this PR bundles
  the bump *with* the doc sync because they belong together.

## Components

### 1. `.github/workflows/cheatsheet-sync.yml`

The workflow. Responsibilities:

- Triggers: `schedule` (monthly cron) + `workflow_dispatch` (with `dry_run`).
- `permissions: { contents: write, pull-requests: write }`.
- A `concurrency` group so overlapping runs cannot race.
- Steps: checkout (full history) → `setup-node@v4` (Node 20, npm cache) →
  `npm ci` → `npx playwright install --with-deps chromium webkit` (the suite
  needs browsers) → run `anthropics/claude-code-action@v1`.
- The action receives:
  - `prompt`: points at / inlines the task brief (see component 2),
  - `claude_args`: `--mcp-config` (Context7, component 3), an allowed-tools list
    (Bash, Edit/Write, Read, plus `gh`), `--max-turns`, and a pinned `--model`,
  - `anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}`,
  - `GH_TOKEN` / `GITHUB_TOKEN` in env so the agent can push a branch and run
    `gh pr create`.
- A commented-out hook for an optional `PAT` secret, used only if the user wants
  `test.yml` to re-run on the bot's PR (see Gotchas).

### 2. `.github/prompts/cheatsheet-sync.md`

The agent's task brief, versioned and reviewable, kept out of the YAML. It
describes only the *task and guardrails*, deferring conventions to
`CLAUDE.md` / `AGENTS.md`:

1. Read `package.json`, all `js/data/*.js`, `CLAUDE.md`, `AGENTS.md`.
2. Determine the latest stable Playwright version (via Context7 / npm).
3. For each documented command, use Context7 to verify it against the current
   docs: deprecations, signature changes, moved/broken `docs` URLs.
4. Identify a small number of high-value new commands worth adding.
5. Apply edits following the project rules (schema, no em-dashes, accuracy).
6. If the latest version is newer than the pin, bump `@playwright/test` in
   `package.json`.
7. Run `npm run lint` && `npm test`.
   - On green: create a dated branch, commit (bot identity, conventional
     message), push, and `gh pr create` with a summary of every change and a
     "Suggested follow-ups" section.
   - On failure it cannot resolve: open the PR as a **draft** explaining what
     failed.
   - In `dry_run` mode: skip branch/commit/PR; write the proposed diff and
     findings to the job summary.
8. If nothing changed: exit cleanly, open no PR.

### 3. Context7 MCP config

A small JSON passed via `claude_args --mcp-config` registering the remote
Context7 server (`https://mcp.context7.com/mcp`). Reads
`CONTEXT7_API_KEY` from secrets when present (higher rate limit) and works
without it. Library target: `/microsoft/playwright`.

## Data flow

```
cron (0 6 1 * *) | workflow_dispatch{dry_run}
  └─ checkout (fetch-depth: 0)
      └─ setup-node 20 + npm ci + playwright install chromium webkit
          └─ claude-code-action@v1
              prompt:  .github/prompts/cheatsheet-sync.md
              mcp:     Context7 → /microsoft/playwright
              tools:   Read, Edit/Write, Bash, gh
              ├─ read data + package.json + CLAUDE.md + AGENTS.md
              ├─ Context7: current API for target version
              ├─ edit entries (+ bump package.json if newer)
              ├─ npm run lint && npm test        ← hard gate
              └─ green → branch+commit+push+`gh pr create`
                 fail  → draft PR w/ explanation
                 dry_run → job summary only, no PR
                 no drift → exit 0, no PR
```

## Error handling & edge cases

- **Tests fail and the agent cannot fix them:** open a **draft** PR documenting
  the failing output; never a green-looking PR. Never merge.
- **No drift found:** exit 0, no branch, no PR — a clean no-op run.
- **Duplicate PRs:** dated branch name (`bot/cheatsheet-sync-YYYY-MM-DD`); the
  agent checks for an existing open sync PR and updates rather than stacking
  duplicates.
- **Context7 unavailable / rate-limited:** the agent reports the failure in the
  job log and exits without opening a low-confidence PR (no guessing from
  memory — that is the whole reason Context7 is in the loop).
- **Cost runaway:** `--max-turns` cap bounds a single run; `concurrency`
  prevents pile-ups.
- **Missing `ANTHROPIC_API_KEY`:** the action fails fast with a clear message;
  until the secret is added the workflow simply errors on run (no silent
  partial behavior).

## Gotchas / prerequisites

- **Repo secrets (added by the user, out of band):** `ANTHROPIC_API_KEY`
  (required); `CONTEXT7_API_KEY` (optional); optional `PAT` for CI-on-PR.
- **CI-on-PR:** PRs opened with the default `GITHUB_TOKEN` do **not** trigger
  `test.yml`. This is acceptable because the sync job already runs the full
  suite before opening the PR. If the user later wants `test.yml` to re-run on
  the bot's PR too, switch the push/`gh` auth to the `PAT` secret (commented
  hook left in the workflow).
- **Branch protection:** the PR targets the default branch; merge stays manual.

## Testing the workflow itself

- A GitHub workflow cannot be unit-tested in the Playwright suite. Validation is
  by **manual `workflow_dispatch` with `dry_run: true`** first: confirm the
  agent reads the data, queries Context7, and prints a sensible proposed diff to
  the job summary without opening a PR.
- A second `dry_run: false` manual run confirms the end-to-end PR path
  (branch → lint/test gate → `gh pr create`).
- No change to the existing `data-integrity.spec.js` is required: it already
  enforces the schema and dash rules that any agent-authored entry must pass.

## Out of scope

- Auto-merging PRs.
- Documenting non-Playwright libraries.
- Restructuring categories, the highlighter, or the UI.
- Replacing Dependabot for routine dependency bumps unrelated to doc drift.
