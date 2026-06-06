/** @type {import('./index.js').Category} */
export default {cat:'CLI', cls:'cli', color:'#f59e0b', items:[
{name:'npx playwright test',
 level:'beginner',
 desc:'Runs the full test suite using the configuration in playwright.config.ts. The entry point for every Playwright run.',
 tip:'Run this first to confirm everything is working. Add flags incrementally as you need more control.',
 docs:'https://playwright.dev/docs/test-cli',
 code:`npx playwright test
# Runs all tests found in your testDir`},

{name:'--config',
 level:'beginner',
 desc:'Points Playwright to a config file other than the default playwright.config.ts. Useful when a project has multiple configs for different environments.',
 tip:'Keep a separate config for smoke tests, visual tests, or a staging environment and switch between them with this flag.',
 docs:'https://playwright.dev/docs/test-cli#reference',
 code:`npx playwright test --config=playwright.staging.config.ts
# Use a non-default config file

npx playwright test -c e2e/playwright.config.ts
# Short form, pointing to a config in a subdirectory`},

{name:'test &lt;file&gt;',
 level:'beginner',
 desc:'Runs only the tests in a specific file. Useful when you are working on one feature and want a fast feedback loop.',
 tip:'You can pass a partial path. Playwright matches any file whose path contains the string you provide.',
 docs:'https://playwright.dev/docs/test-cli',
 code:`npx playwright test tests/login.spec.ts
# Run a single spec file

npx playwright test login checkout
# Run files matching either name`},

{name:'-g "name"',
 level:'beginner',
 desc:'Runs only tests whose title matches the given string or pattern. Great for targeting a single test without changing the file.',
 tip:'The match is a substring search, so -g "login" runs every test whose name contains "login". Use quotes around names with spaces.',
 docs:'https://playwright.dev/docs/test-cli#reference',
 code:`npx playwright test -g "user can log in"
# Run tests matching this name

npx playwright test -g "login"
# Runs all tests whose name contains "login"`},

{name:'--last-failed',
 level:'intermediate',
 desc:'Re-runs only the tests that failed in the previous run. Reads the last test result to know which tests to target.',
 tip:'Speeds up the fix-run-fix cycle significantly. No need to wait for passing tests while you iterate on a failure.',
 docs:'https://playwright.dev/docs/test-cli#reference',
 code:`npx playwright test --last-failed
# Only re-runs tests that failed last time`},

{name:'--only-changed',
 level:'intermediate',
 desc:'Runs only tests in files that have changed since the last git commit. Compares against HEAD by default, or a specified branch.',
 tip:'Ideal for a fast pre-commit check or a feature-branch PR workflow. Pass a branch name to compare against it instead of HEAD.',
 docs:'https://playwright.dev/docs/test-cli#reference',
 code:`npx playwright test --only-changed
# Run tests in files changed since last git commit

npx playwright test --only-changed=main
# Run tests in files changed compared to the main branch`},

{name:'--project',
 level:'intermediate',
 desc:'Runs tests against a specific browser project defined in playwright.config.ts, such as chromium, firefox, or webkit.',
 tip:'Use during development to get fast feedback in one browser, then run all projects in CI for full coverage.',
 docs:'https://playwright.dev/docs/test-cli#reference',
 code:`npx playwright test --project=chromium
# Run on Chromium only

npx playwright test --project=firefox --project=webkit
# Run on Firefox and WebKit`},

{name:'--no-deps',
 level:'intermediate',
 desc:'Skips running any dependent projects defined under projects[].dependencies in playwright.config.ts. Runs only the specified project.',
 tip:'Use when the dependency setup (such as a global auth project) has already run and you want to skip it to save time.',
 docs:'https://playwright.dev/docs/test-cli#reference',
 code:`npx playwright test --project=chromium --no-deps
# Run Chromium tests without running its dependent projects first`},

{name:'--headed',
 level:'beginner',
 desc:'Runs tests with a visible browser window instead of headless. Lets you watch the test execute in real time.',
 tip:'Use when writing or debugging a test. Not suitable for CI. Always run headless in pipelines.',
 docs:'https://playwright.dev/docs/test-cli#reference',
 code:`npx playwright test --headed
# Opens a real browser window during the run`},

{name:'--debug',
 level:'beginner',
 desc:'Launches the Playwright Inspector alongside the browser. Lets you step through test actions one at a time.',
 tip:'Combine with -g to debug a single test. Use the Inspector to hover over locators and inspect element handles.',
 docs:'https://playwright.dev/docs/debug#playwright-inspector',
 code:`npx playwright test --debug
# Opens Playwright Inspector for step-by-step debugging

npx playwright test -g "checkout" --debug
# Debug a specific test`},

{name:'--ui',
 level:'beginner',
 desc:'Opens the Playwright UI mode, an interactive visual interface to run, watch, and time-travel debug your tests.',
 tip:'The best way to run tests during development. You can watch tests run, inspect traces, and filter by status.',
 docs:'https://playwright.dev/docs/test-ui-mode',
 code:`npx playwright test --ui
# Opens the interactive UI mode in your browser

npx playwright test --ui --headed --workers=1
# Open UI mode with a visible browser and no parallelism, ideal for focused debugging`},

{name:'--workers',
 level:'intermediate',
 desc:'Sets the number of parallel worker processes used to run tests. Defaults to half the CPU cores available.',
 tip:'Increase workers to speed up a large suite on a powerful machine. Set to 1 when debugging race conditions or shared state.',
 docs:'https://playwright.dev/docs/test-cli#reference',
 code:`npx playwright test --workers=4
# Run with 4 parallel workers

npx playwright test --workers=1
# Run serially, useful for debugging`},

{name:'--fully-parallel',
 level:'intermediate',
 desc:'Forces all tests to run in parallel, overriding the fullyParallel setting in playwright.config.ts.',
 tip:'Not recommended if tests share state or write to the same files. Pair with --workers to control the level of parallelism.',
 docs:'https://playwright.dev/docs/test-cli#reference',
 code:`npx playwright test --fully-parallel
# Run all tests in parallel regardless of config

npx playwright test --fully-parallel --workers=4
# Run fully parallel with 4 workers`},

{name:'--retries',
 level:'intermediate',
 desc:'Automatically retries failed tests up to the specified number of times before marking them as failed.',
 tip:'Use 1 or 2 retries in CI to catch rare flakiness. Do not rely on retries to mask genuinely broken tests.',
 docs:'https://playwright.dev/docs/test-retries',
 code:`npx playwright test --retries=2
# Retry each failing test up to 2 times`},

{name:'--repeat-each',
 level:'intermediate',
 desc:'Runs every test a specified number of times in a single run. Useful for detecting flaky tests that fail intermittently.',
 tip:'Combine with --reporter=html to easily spot which iterations failed. Start with 10 runs to surface common flakiness.',
 docs:'https://playwright.dev/docs/test-cli#reference',
 code:`npx playwright test --repeat-each=10
# Run every test 10 times

npx playwright test -g "checkout" --repeat-each=5
# Repeat a specific test 5 times to check for flakiness`},

{name:'--max-failures',
 level:'intermediate',
 desc:'Stops the test run after a specified number of failures. Use -x as a shorthand to stop on the very first failure.',
 tip:'Useful in CI to fail fast and save pipeline time. Avoid in local runs where you want to see all failures at once.',
 docs:'https://playwright.dev/docs/test-cli#reference',
 code:`npx playwright test --max-failures=5
# Stop after 5 test failures

npx playwright test -x
# Stop immediately on the first failure`},

{name:'--fail-on-flaky-tests',
 level:'intermediate',
 desc:'Marks the whole run as failed if any test passes only on retry (a flaky test). Without it, a test that fails then passes on retry counts as a pass.',
 tip:'Added in Playwright v1.52. Enable in CI to surface flakiness instead of silently hiding it behind retries. Equivalent to setting failOnFlakyTests: true in playwright.config.ts.',
 docs:'https://playwright.dev/docs/test-cli#reference',
 code:`npx playwright test --fail-on-flaky-tests
# Fail the run if any test only passes on retry

# Permanent enforcement in playwright.config.ts:
# export default defineConfig({ failOnFlakyTests: !!process.env.CI });`},

{name:'--timeout',
 level:'intermediate',
 desc:'Sets the maximum time in milliseconds that each test is allowed to run before it is automatically failed.',
 tip:'The default is 30 seconds. Increase for tests that do slow operations like file processing or long animations.',
 docs:'https://playwright.dev/docs/test-timeouts',
 code:`npx playwright test --timeout=60000
# Allow each test up to 60 seconds

npx playwright test --timeout=0
# Disable the timeout entirely (not recommended for CI)`},

{name:'--global-timeout',
 level:'intermediate',
 desc:'Sets a maximum total time in milliseconds for the entire test suite run. If the suite exceeds this limit it is cancelled.',
 tip:'Set this in CI to prevent a hung test from blocking a pipeline indefinitely. The default is no global timeout.',
 docs:'https://playwright.dev/docs/test-cli#reference',
 code:`npx playwright test --global-timeout=300000
# Cancel the entire run if it exceeds 5 minutes

npx playwright test --global-timeout=600000 --workers=4
# Useful in CI with a hard pipeline time limit`},

{name:'--reporter',
 level:'intermediate',
 desc:'Specifies the output format for test results. Options include html, dot, list, json, junit, and github.',
 tip:'Use html locally to get a rich report with screenshots and traces. Use junit or github in CI pipelines.',
 docs:'https://playwright.dev/docs/test-reporters',
 code:`npx playwright test --reporter=html
# Generate an interactive HTML report

npx playwright test --reporter=dot
# Minimal dot-style output and fast to read in CI`},

{name:'--quiet',
 level:'intermediate',
 desc:'Suppresses stdout and stderr output printed by tests. Test results are still reported; only test-produced output is hidden.',
 tip:'Use in CI when tests are verbose and you only care about pass or fail. Combine with --reporter=dot for minimal output.',
 docs:'https://playwright.dev/docs/test-cli#reference',
 code:`npx playwright test --quiet
# Suppress stdout and stderr from tests

npx playwright test --quiet --reporter=dot
# Minimal CI output with no test-produced noise`},

{name:'--output',
 level:'intermediate',
 desc:'Sets the directory where test artifacts such as screenshots, videos, and traces are saved. Defaults to test-results.',
 tip:'Override this in CI to place artifacts in a known location for upload or archiving after the run.',
 docs:'https://playwright.dev/docs/test-cli#reference',
 code:`npx playwright test --output=artifacts
# Save test artifacts to the artifacts/ folder

npx playwright test --output=/tmp/pw-results
# Use an absolute path for artifact output`},

{name:'show-report',
 level:'beginner',
 desc:'Opens the last generated HTML report in your default browser. No server setup required.',
 tip:'Run this immediately after a test run to review results, screenshots, videos, and traces for failures.',
 docs:'https://playwright.dev/docs/test-reporters#html-reporter',
 code:`npx playwright show-report
# Opens the HTML report from the default playwright-report/ folder

npx playwright show-report my-report/
# Open a report from a custom output folder`},

{name:'merge-reports',
 level:'advanced',
 desc:'Merges multiple blob reporter output folders from sharded CI runs into a single unified report. The companion command to --shard.',
 tip:'In CI, collect the blob-report folder as an artifact from each shard, then run merge-reports once in a final job to combine them.',
 docs:'https://playwright.dev/docs/test-sharding#merging-reports-from-multiple-shards',
 code:`npx playwright merge-reports --reporter=html ./blob-reports
# Merge all blob reports into one HTML report

npx playwright merge-reports --reporter=junit ./blob-reports > results.xml
# Merge into a JUnit XML report for CI integration`},

{name:'show-trace',
 level:'intermediate',
 desc:'Opens the Playwright Trace Viewer for a specific trace.zip file. Lets you replay a test run step by step.',
 tip:'Enable traces in your config with trace: "on-first-retry" to capture them automatically for failing tests.',
 docs:'https://playwright.dev/docs/trace-viewer',
 code:`npx playwright show-trace trace.zip
# Open a trace file in the Trace Viewer

npx playwright show-trace test-results/my-test/trace.zip`},

{name:'codegen',
 level:'beginner',
 desc:'Opens a browser and records your interactions, generating a Playwright test script in real time.',
 tip:'Great for bootstrapping a new test quickly. Always review and clean up the generated code. It may be brittle.',
 docs:'https://playwright.dev/docs/codegen-intro',
 code:`npx playwright codegen https://example.com
# Record actions on a URL and generate a test

npx playwright codegen --save-storage=auth.json https://example.com
# Record and save authenticated session state`},

{name:'install',
 level:'beginner',
 desc:'Downloads and installs the browser binaries (Chromium, Firefox, WebKit) that Playwright needs to run tests.',
 tip:'Run this after first installing the npm package, and again after upgrading Playwright to get matching browsers.',
 docs:'https://playwright.dev/docs/browsers#install-browsers',
 code:`npx playwright install
# Install all browsers defined in your config

npx playwright install chromium
# Install only Chromium`},

{name:'install --with-deps',
 level:'beginner',
 desc:'Installs browsers and all required OS-level system dependencies. Essential for running on a fresh CI machine.',
 tip:'Always use this flag in CI pipelines and Docker containers where system dependencies may not be pre-installed.',
 docs:'https://playwright.dev/docs/browsers#install-system-dependencies',
 code:`npx playwright install --with-deps
# Install browsers + all OS dependencies (use in CI)

npx playwright install --with-deps chromium
# Install only Chromium and its dependencies`},

{name:'--version',
 level:'beginner',
 desc:'Prints the installed Playwright version to the terminal. Useful for confirming the version in use.',
 tip:'Check this when debugging unexpected behaviour. The Playwright version and the browser binaries must be in sync.',
 docs:'https://playwright.dev/docs/test-cli',
 code:`npx playwright --version
# Prints the installed version, e.g. Version 1.44.0`},

{name:'--help',
 level:'beginner',
 desc:'Prints a full list of available CLI commands and flags with short descriptions.',
 tip:'Use npx playwright test --help to see flags specific to the test runner, or npx playwright --help for top-level commands.',
 docs:'https://playwright.dev/docs/test-cli',
 code:`npx playwright --help
# List all top-level commands

npx playwright test --help
# List all flags for the test runner`},

{name:'--trace',
 level:'intermediate',
 desc:'Controls trace recording. Options: on, off, on-first-retry, on-all-retries, retain-on-failure.',
 tip:'Use retain-on-failure in CI so traces are only kept when a test fails, saving disk space without losing debug info.',
 docs:'https://playwright.dev/docs/trace-viewer-intro',
 code:`npx playwright test --trace on
# Record a trace for every test

npx playwright test --trace on-first-retry
# Record trace only on the first retry of a failing test

npx playwright test --trace retain-on-failure
# Keep traces only for failed tests (recommended for CI)`},

{name:'--update-snapshots',
 level:'intermediate',
 desc:'Regenerates all screenshot and snapshot baselines. New screenshots replace existing ones without failing the test.',
 tip:'Run this after intentional UI changes to accept the new look. Always review the diff before committing updated snapshots.',
 docs:'https://playwright.dev/docs/test-snapshots',
 code:`npx playwright test --update-snapshots
# Regenerate all snapshot baselines

npx playwright test -u -g "header"
# Short form, update snapshots only for tests matching "header"`},

{name:'--ignore-snapshots',
 level:'intermediate',
 desc:'Skips all screenshot and snapshot assertions during the run. Tests pass even if snapshots are missing or outdated.',
 tip:'Use when running tests in an environment where snapshots have not been generated yet, or to isolate functional failures from visual ones.',
 docs:'https://playwright.dev/docs/test-cli#reference',
 code:`npx playwright test --ignore-snapshots
# Skip all snapshot comparisons during the run

npx playwright test --ignore-snapshots --project=chromium
# Run functional tests on Chromium without any visual checks`},

{name:'--grep',
 level:'intermediate',
 desc:'Runs only tests whose title matches the given regex pattern. More powerful than -g, supports full regex syntax.',
 tip:'Combine with --project to run a filtered set on a specific browser. Use --grep-invert to exclude tests by pattern.',
 docs:'https://playwright.dev/docs/test-cli#reference',
 code:`npx playwright test --grep "checkout"
# Run tests matching "checkout"

npx playwright test --grep "login|checkout"
# Run tests matching either pattern`},

{name:'--grep-invert',
 level:'intermediate',
 desc:'Runs only tests whose title does not match the given regex pattern. The inverse of --grep.',
 tip:'Useful for excluding slow or tagged tests from a run. Combine with --grep to apply both include and exclude filters at once.',
 docs:'https://playwright.dev/docs/test-cli#reference',
 code:`npx playwright test --grep-invert "slow"
# Run all tests except those matching "slow"

npx playwright test --grep "checkout" --grep-invert "admin"
# Run checkout tests but exclude any tagged "admin"`},

{name:'--list',
 level:'beginner',
 desc:'Lists all tests that would be run without actually executing them. Useful for auditing test coverage.',
 tip:'Combine with --grep or --project to preview exactly which tests will run before committing to a full run.',
 docs:'https://playwright.dev/docs/test-cli#reference',
 code:`npx playwright test --list
# Print all discovered test names without running them

npx playwright test --list --grep "login"
# Preview which tests match "login"`},

{name:'--shard',
 level:'advanced',
 desc:'Splits the test suite across multiple CI machines. Each shard runs a portion of the total tests.',
 tip:'Use with a CI matrix to reduce total pipeline time. Merge the reports afterward with --merge-reports.',
 docs:'https://playwright.dev/docs/test-sharding',
 code:`npx playwright test --shard=1/3
# Run the first third of tests (machine 1 of 3)

npx playwright test --shard=2/3
# Run the second third (machine 2 of 3)`},

{name:'--pass-with-no-tests',
 level:'intermediate',
 desc:'Exits with a success code even if no tests are found. Prevents false failures when a shard or filter matches nothing.',
 tip:'Add this to CI shard jobs where some shards may legitimately have no tests to run, avoiding unnecessary pipeline failures.',
 docs:'https://playwright.dev/docs/test-cli#reference',
 code:`npx playwright test --pass-with-no-tests
# Exit 0 even if no tests are discovered

npx playwright test --shard=3/3 --pass-with-no-tests
# Safe to use when the last shard might be empty`},

{name:'--forbid-only',
 level:'intermediate',
 desc:'Fails the test run immediately if any test.only() or test.describe.only() is found in the code.',
 tip:'Always enable this in CI. It prevents a developer accidentally committing a test.only() that silently skips the rest of the suite.',
 docs:'https://playwright.dev/docs/test-cli#reference',
 code:`npx playwright test --forbid-only
# Fails fast if test.only() is found anywhere in the suite

# Add to playwright.config.ts for permanent CI enforcement:
# forbidOnly: !!process.env.CI`},
]};
