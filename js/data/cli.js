/** @type {import('./index.js').Category} */
export default {cat:'CLI', cls:'cli', color:'#f59e0b', items:[
{name:'npx playwright test',
 level:'beginner',
 desc:'Runs the full test suite using the configuration in playwright.config.ts. The entry point for every Playwright run.',
 tip:'Run this first to confirm everything is working. Add flags incrementally as you need more control.',
 docs:'https://playwright.dev/docs/test-cli',
 code:`npx playwright test
# Runs all tests found in your testDir`},

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

{name:'--project',
 level:'intermediate',
 desc:'Runs tests against a specific browser project defined in playwright.config.ts, such as chromium, firefox, or webkit.',
 tip:'Use during development to get fast feedback in one browser, then run all projects in CI for full coverage.',
 docs:'https://playwright.dev/docs/test-cli#reference',
 code:`npx playwright test --project=chromium
# Run on Chromium only

npx playwright test --project=firefox --project=webkit
# Run on Firefox and WebKit`},

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
# Opens the interactive UI mode in your browser`},

{name:'--workers',
 level:'intermediate',
 desc:'Sets the number of parallel worker processes used to run tests. Defaults to half the CPU cores available.',
 tip:'Increase workers to speed up a large suite on a powerful machine. Set to 1 when debugging race conditions or shared state.',
 docs:'https://playwright.dev/docs/test-cli#reference',
 code:`npx playwright test --workers=4
# Run with 4 parallel workers

npx playwright test --workers=1
# Run serially, useful for debugging`},

{name:'--retries',
 level:'intermediate',
 desc:'Automatically retries failed tests up to the specified number of times before marking them as failed.',
 tip:'Use 1 or 2 retries in CI to catch rare flakiness. Do not rely on retries to mask genuinely broken tests.',
 docs:'https://playwright.dev/docs/test-retries',
 code:`npx playwright test --retries=2
# Retry each failing test up to 2 times`},

{name:'--timeout',
 level:'intermediate',
 desc:'Sets the maximum time in milliseconds that each test is allowed to run before it is automatically failed.',
 tip:'The default is 30 seconds. Increase for tests that do slow operations like file processing or long animations.',
 docs:'https://playwright.dev/docs/test-timeouts',
 code:`npx playwright test --timeout=60000
# Allow each test up to 60 seconds

npx playwright test --timeout=0
# Disable the timeout entirely (not recommended for CI)`},

{name:'--reporter',
 level:'intermediate',
 desc:'Specifies the output format for test results. Options include html, dot, list, json, junit, and github.',
 tip:'Use html locally to get a rich report with screenshots and traces. Use junit or github in CI pipelines.',
 docs:'https://playwright.dev/docs/test-reporters',
 code:`npx playwright test --reporter=html
# Generate an interactive HTML report

npx playwright test --reporter=dot
# Minimal dot-style output and fast to read in CI`},

{name:'show-report',
 level:'beginner',
 desc:'Opens the last generated HTML report in your default browser. No server setup required.',
 tip:'Run this immediately after a test run to review results, screenshots, videos, and traces for failures.',
 docs:'https://playwright.dev/docs/test-reporters#html-reporter',
 code:`npx playwright show-report
# Opens the HTML report from the default playwright-report/ folder

npx playwright show-report my-report/
# Open a report from a custom output folder`},

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

{name:'--grep',
 level:'intermediate',
 desc:'Runs only tests whose title matches the given regex pattern. More powerful than -g, supports full regex syntax.',
 tip:'Use --grep-invert to exclude tests matching the pattern. Combine with --project to run a filtered set on a specific browser.',
 docs:'https://playwright.dev/docs/test-cli#reference',
 code:`npx playwright test --grep "checkout"
# Run tests matching "checkout"

npx playwright test --grep-invert "smoke"
# Run all tests EXCEPT those matching "smoke"`},

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
