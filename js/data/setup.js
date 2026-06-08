/** @type {import('./index.js').Category} */
export default {cat:'Setup', cls:'setup', color:'#06b6d4', items:[
{name:'test()',
 level:'beginner',
 desc:'Defines a single test case. The first argument is the test name shown in reports; the second is an async function containing your steps.',
 tip:'Always start here. Every Playwright test lives inside a test() block. Write descriptive names so failures are easy to understand at a glance.',
 docs:'https://playwright.dev/docs/api/class-test#test-call',
 code:`import { test, expect } from '@playwright/test';

test('user can log in', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Email').fill('user@test.com');
  await page.getByLabel('Password').fill('secret');
  await page.getByRole('button', { name: 'Login' }).click();
  await expect(page).toHaveURL('/dashboard');
});`},

{name:'test.describe()',
 level:'beginner',
 desc:'Groups related tests under a shared name. Keeps your test file organised and makes reports easier to read.',
 tip:'Group tests by feature or page: e.g. "Login page", "User profile". You can nest describe blocks for sub-features.',
 docs:'https://playwright.dev/docs/api/class-test#test-describe',
 code:`test.describe('Login page', () => {
  test('shows error for wrong password', async ({ page }) => {
    // ...
  });

  test('redirects to dashboard after login', async ({ page }) => {
    // ...
  });
});`},

{name:'test.use()',
 level:'intermediate',
 desc:'Overrides browser context options (viewport, locale, permissions, etc.) for all tests in the current file or describe block. The per-test counterpart to the global use: {} in playwright.config.ts.',
 tip:'Scope it inside a test.describe() to apply only to that group. Use it to test a specific locale, timezone, or device without creating a new project.',
 docs:'https://playwright.dev/docs/api/class-test#test-use',
 code:`test.use({
  baseURL: 'https://example.com',
  viewport: { width: 1920, height: 1080 },
  userAgent: 'custom-agent',
  locale: 'en-GB',
  timezoneId: 'Asia/Colombo',
  permissions: ['clipboard-read'],
  geolocation: { latitude: 6.9, longitude: 79.8 },
  colorScheme: 'dark',
  ignoreHTTPSErrors: true,
  storageState: 'state.json'
});`},

{name:'beforeEach()',
 level:'beginner',
 desc:'Runs a setup block before every test in the current describe. Use it to avoid repeating common setup like navigating to a page.',
 tip:'Great for navigating to the page under test. If every test starts with page.goto(), move it here to keep tests DRY.',
 docs:'https://playwright.dev/docs/api/class-test#test-before-each',
 code:`test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard');
  });

  test('shows welcome message', async ({ page }) => {
    await expect(page.getByText('Welcome')).toBeVisible();
  });
});`},

{name:'afterEach()',
 level:'intermediate',
 desc:'Runs a cleanup block after every test. Useful for logging, resetting state, or capturing a screenshot when a test fails.',
 tip:'Avoid heavy cleanup here: Playwright isolates each test with a fresh browser context by default. The testInfo parameter passed to the hook is the same object as calling test.info() inside a test; they are identical.',
 docs:'https://playwright.dev/docs/api/class-test#test-after-each',
 code:`test.afterEach(async ({ page }, testInfo) => {
  if (testInfo.status !== testInfo.expectedStatus) {
    await page.screenshot({
      path: \`failure-\${testInfo.title}.png\`
    });
  }
});`},

{name:'beforeAll()',
 level:'intermediate',
 desc:'Runs once before all tests in the describe block. Use for expensive one-time setup like seeding a database.',
 tip:'Unlike beforeEach, this runs once total. Be careful shared state mutated by one test can affect others.',
 docs:'https://playwright.dev/docs/api/class-test#test-before-all',
 code:`test.beforeAll(async ({ request }) => {
  await request.post('/api/seed', {
    data: { scenario: 'default' }
  });
});`},

{name:'afterAll()',
 level:'intermediate',
 desc:'Runs once after all tests in the describe block complete. Good for tearing down one-time resources.',
 tip:'Pair with beforeAll() for one-time setup/teardown. If you seeded a database in beforeAll, clean it up here.',
 docs:'https://playwright.dev/docs/api/class-test#test-after-all',
 code:`test.afterAll(async ({ request }) => {
  await request.delete('/api/seed/default');
});`},

{name:'expect()',
 level:'beginner',
 desc:'Creates an assertion. Wrap a locator or value to check it meets a condition. The test fails if the assertion is not met.',
 tip:"Playwright's expect() is async aware, it automatically retries until the condition is true or times out. Always await it on locators.",
 docs:'https://playwright.dev/docs/api/class-genericassertions',
 code:`// Assert on a locator (async, retries automatically)
await expect(page.getByRole('heading')).toHaveText('Dashboard');

// Assert on a plain value (sync)
expect(response.status()).toBe(200);`},

{name:'test.only()',
 level:'beginner',
 desc:'Runs only this test (or describe block), skipping all others in the file. Essential for focusing on one test while developing.',
 tip:'Never commit test.only() to your repo. Use --forbid-only in CI to catch it. Works on describe blocks too: test.describe.only().',
 docs:'https://playwright.dev/docs/api/class-test#test-only',
 code:`test.only('this is the only test that runs', async ({ page }) => {
  await page.goto('/login');
  // all other tests in the file are skipped
});

// Also works on a describe block
test.describe.only('Login', () => {
  test('...', async ({ page }) => { /* ... */ });
});`},

{name:'test.skip()',
 level:'beginner',
 desc:'Skips a test unconditionally or based on a condition. Skipped tests appear in the report but are not executed.',
 tip:'Use conditionally to skip tests that only apply to certain browsers or environments. Works on describe blocks too.',
 docs:'https://playwright.dev/docs/api/class-test#test-skip',
 code:`// Unconditional skip
test.skip('not ready yet', async ({ page }) => { /* ... */ });

// Conditional skip inside a test
test('safari only', async ({ page, browserName }) => {
  test.skip(browserName !== 'webkit', 'Only runs on Safari');
  await page.goto('/');
});`},

{name:'test.fixme()',
 level:'intermediate',
 desc:'Marks a test as broken and expected to fail. Playwright skips it and shows it in the report as a known issue.',
 tip:'Use instead of test.skip() when the test is intentionally failing due to a known bug. Makes it clear the failure is tracked.',
 docs:'https://playwright.dev/docs/api/class-test#test-fixme',
 code:`test.fixme('checkout flow is broken, see JIRA-1234', async ({ page }) => {
  await page.goto('/checkout');
  // This test is known to fail and is skipped until fixed
});`},

{name:'test.abort()',
 level:'intermediate',
 desc:'An emergency stop button for a test. Call it to stop the test right now and mark it as FAILED. Added in Playwright 1.60.',
 tip:'Use it for guardrails: when a fixture or route handler detects a "this should never happen" situation and a normal expect() cannot reach it. The message you pass shows up in the failure. Unlike test.skip()/test.fixme() (which skip), test.abort() fails the test.',
 docs:'https://playwright.dev/docs/api/class-test#test-abort',
 code:`test('does not publish to shared page', async ({ page }) => {
  await page.route('**/publish', route => {
    test.abort('Tests must not publish to the shared page. Use the \`clone\` option.');
    return route.abort();
  });
  // ...
});`},

{name:'test.slow()',
 level:'intermediate',
 desc:'Triples the default timeout for a test that is legitimately slow (e.g. file processing, video rendering, email polling).',
 tip:'Use sparingly. If many tests need this, increase the global timeout in playwright.config.ts instead.',
 docs:'https://playwright.dev/docs/api/class-test#test-slow',
 code:`test('processes large CSV export', async ({ page }) => {
  test.slow(); // triples the timeout for this test only
  await page.goto('/export');
  await page.getByRole('button', { name: 'Export' }).click();
  await expect(page.getByText('Export complete')).toBeVisible();
});`},

{name:'test.step()',
 level:'intermediate',
 desc:'Groups a set of actions inside a named step. Steps appear in the HTML report and trace viewer, making long tests easier to read.',
 tip:'Use for tests with many actions. Step names show up in the report timeline, making failures much easier to pinpoint.',
 docs:'https://playwright.dev/docs/api/class-test#test-step',
 code:`test('full checkout flow', async ({ page }) => {
  await test.step('Add item to cart', async () => {
    await page.goto('/products');
    await page.getByRole('button', { name: 'Add to cart' }).click();
  });

  await test.step('Complete checkout', async () => {
    await page.getByRole('link', { name: 'Checkout' }).click();
    await page.getByLabel('Card number').fill('4242 4242 4242 4242');
    await page.getByRole('button', { name: 'Pay' }).click();
  });

  await expect(page.getByText('Order confirmed')).toBeVisible();
});`},

{name:'test.info()',
 level:'intermediate',
 desc:'Returns the TestInfo object for the currently running test. Exposes metadata like title, status, retry count, output directory, and methods to attach files or adjust the timeout mid-test.',
 tip:'Call test.info() anywhere inside a test body. In beforeEach / afterEach hooks the same object is passed directly as the testInfo parameter: testInfo === test.info(), they are identical.',
 docs:'https://playwright.dev/docs/api/class-testinfo',
 code:`test('upload report', async ({ page }) => {
  const info = test.info();

  console.log(info.title);        // 'upload report'
  console.log(info.retry);        // 0 first run, 1 on first retry
  console.log(info.workerIndex);  // which parallel worker is running this
  console.log(info.outputDir);    // per-test directory for saving artifacts

  // Extend the timeout mid-test
  info.setTimeout(info.timeout + 15000);

  // Attach a screenshot directly to the HTML report
  await info.attach('screenshot', {
    body: await page.screenshot(),
    contentType: 'image/png',
  });
});

// In hooks, testInfo IS test.info() (the same object)
test.afterEach(async ({ page }, testInfo) => {
  if (testInfo.status !== testInfo.expectedStatus) {
    await testInfo.attach('on-failure', {
      body: await page.screenshot(),
      contentType: 'image/png',
    });
  }
});`},

{name:'test() tags',
 level:'intermediate',
 desc:'Attaches one or more tags to a test or describe block via the { tag } option. Tags let you slice the suite at runtime with --grep / --grep-invert. Added in Playwright 1.42.',
 tip:'Tag names must start with @. Use tags like @smoke, @slow, @vrt to run subsets, e.g. a fast smoke gate in CI. Run with: npx playwright test --grep @smoke.',
 docs:'https://playwright.dev/docs/test-annotations#tag-tests',
 code:`// Tag a single test
test('login', { tag: ['@smoke', '@fast'] }, async ({ page }) => {
  await page.goto('/login');
});

// Tag an entire describe block
test.describe('Reports', { tag: '@slow' }, () => {
  test('exports CSV', async ({ page }) => { /* ... */ });
});

// Run only smoke tests:  npx playwright test --grep @smoke
// Skip slow tests:       npx playwright test --grep-invert @slow`},

{name:'test.describe.configure()',
 level:'intermediate',
 desc:'Controls the execution mode and retries for the tests in a file or describe block. mode: "serial" runs them in order and stops on the first failure; mode: "parallel" runs them concurrently even when fullyParallel is off; "default" restores normal behaviour.',
 tip:'Use mode: "serial" only when tests genuinely depend on each other (e.g. a multi-step wizard). A failure skips the rest. Prefer isolated parallel tests everywhere else. You can also set a per-block retries count.',
 docs:'https://playwright.dev/docs/api/class-test#test-describe-configure',
 code:`// Run every test in this file in order; stop on first failure
test.describe.configure({ mode: 'serial' });

// Or scope it to a single describe block
test.describe('Checkout wizard', () => {
  test.describe.configure({ mode: 'serial', retries: 2 });

  test('step 1: add to cart', async ({ page }) => { /* ... */ });
  test('step 2: pay',         async ({ page }) => { /* ... */ });
});

// mode: 'parallel' forces concurrency even if fullyParallel is off`},

{name:'test.describe.skip() / fixme()',
 level:'intermediate',
 desc:'Skips or marks-as-broken an entire describe block in one call, instead of annotating every test inside. skip() drops the whole group; fixme() flags it as a known-failing group that is not run.',
 tip:'Reach for the describe-level variant when a whole feature is unavailable on a browser/environment or is temporarily broken. Far cleaner than adding test.skip() to every test in the block.',
 docs:'https://playwright.dev/docs/api/class-test#test-describe-skip',
 code:`// Skip a whole group unconditionally
test.describe.skip('Beta dashboard', () => {
  test('shows widgets', async ({ page }) => { /* ... */ });
});

// Mark a whole group as broken (known failure, not run)
test.describe.fixme('Legacy export', () => {
  test('downloads PDF', async ({ page }) => { /* ... */ });
});`},
]};
