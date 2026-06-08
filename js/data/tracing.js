/** @type {import('./index.js').Category} */
export default {cat:'Tracing & Debugging', cls:'tracing', color:'#64748b', items:[
{name:'pause()',
 level:'beginner',
 desc:'Pauses test execution and opens the Playwright Inspector for step-by-step debugging.',
 tip:'Only use during development. Remove before committing. Run tests with PWDEBUG=1 to start the Inspector automatically.',
 docs:'https://playwright.dev/docs/api/class-page#page-pause',
 code:`// Opens the Playwright Inspector UI
await page.pause();

// Resume by clicking "Resume" in the Inspector`},

{name:'--debug',
 level:'beginner',
 desc:'Launches the Playwright Inspector alongside the browser. Lets you step through test actions one at a time.',
 tip:'Combine with -g to debug a single test. Use the Inspector to hover over locators and inspect element handles.',
 docs:'https://playwright.dev/docs/debug#playwright-inspector',
 code:`npx playwright test --debug
# Opens Playwright Inspector for step-by-step debugging

npx playwright test -g "checkout" --debug
# Debug a specific test`},

{name:'codegen',
 level:'beginner',
 desc:'Opens a browser and records your interactions, generating a Playwright test script in real time.',
 tip:'Great for bootstrapping a new test quickly. Always review and clean up the generated code. It may be brittle.',
 docs:'https://playwright.dev/docs/codegen-intro',
 code:`npx playwright codegen https://example.com
# Record actions on a URL and generate a test

npx playwright codegen --save-storage=auth.json https://example.com
# Record and save authenticated session state`},

{name:'trace',
 level:'intermediate',
 desc:'Controls when traces are recorded. A trace is a full recording of browser actions, network, and console output, viewable in the Trace Viewer.',
 tip:'Use retain-on-failure in CI, traces are only kept for failing tests, saving disk space while ensuring you always have debug data.',
 docs:'https://playwright.dev/docs/trace-viewer-intro',
 code:`// playwright.config.ts
export default defineConfig({
  use: {
    // 'off' | 'on' | 'on-first-retry' | 'on-all-retries' | 'retain-on-failure'
    trace: 'retain-on-failure',
  },
});

// View a trace:
// npx playwright show-trace test-results/trace.zip`},

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

{name:'context.tracing.start()',
 level:'advanced',
 desc:'Starts recording a trace programmatically, capturing screenshots, DOM snapshots, and source. Stop with tracing.stop() to write the trace.zip.',
 tip:'Use in global setup or a fixture when you want traces outside the test runner (e.g. in a plain Node script). Inside @playwright/test, the trace config option is usually enough.',
 docs:'https://playwright.dev/docs/api/class-tracing#tracing-start',
 code:`// Start before the actions you want to capture
await context.tracing.start({ screenshots: true, snapshots: true });

await page.goto('/dashboard');
await page.getByRole('button', { name: 'Submit' }).click();

// Stop and write the trace to disk
await context.tracing.stop({ path: 'trace.zip' });
// View it: npx playwright show-trace trace.zip`},

{name:'tracing.startChunk()',
 level:'advanced',
 desc:'Records a self-contained slice of an ongoing trace, then writes just that slice with stopChunk(). Lets you capture multiple short traces within one started session.',
 tip:'Use to save a separate trace per test action or per scenario without restarting tracing each time. Call tracing.start() once, then bracket each slice with startChunk()/stopChunk().',
 docs:'https://playwright.dev/docs/api/class-tracing#tracing-start-chunk',
 code:`await context.tracing.start({ screenshots: true, snapshots: true });

// Capture only the checkout flow as its own trace
await context.tracing.startChunk();
await page.getByRole('button', { name: 'Checkout' }).click();
await page.getByRole('button', { name: 'Pay' }).click();
await context.tracing.stopChunk({ path: 'checkout-trace.zip' });`},

{name:'show-trace',
 level:'intermediate',
 desc:'Opens the Playwright Trace Viewer for a specific trace.zip file. Lets you replay a test run step by step.',
 tip:'Enable traces in your config with trace: "on-first-retry" to capture them automatically for failing tests.',
 docs:'https://playwright.dev/docs/trace-viewer',
 code:`npx playwright show-trace trace.zip
# Open a trace file in the Trace Viewer

npx playwright show-trace test-results/my-test/trace.zip`},
]};
