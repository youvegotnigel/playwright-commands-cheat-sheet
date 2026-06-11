/** @type {import('./index.js').Category} */
export default {cat:'Config', cls:'config', color:'#6366f1', items:[
{name:'baseURL',
 level:'beginner',
 desc:'Sets the base URL for all page.goto() calls. Lets you use relative paths like /login instead of the full URL.',
 tip:'Set this in playwright.config.ts and never hardcode URLs in tests. Change environments by changing baseURL in one place.',
 docs:'https://playwright.dev/docs/test-configuration#baseurl',
 code:`// playwright.config.ts
export default defineConfig({
  use: {
    baseURL: 'http://localhost:3000',
  },
});

// In tests relative path works because baseURL is set
await page.goto('/login');`},

{name:'testDir',
 level:'beginner',
 desc:'Sets the directory where Playwright looks for test files. Defaults to the directory of the config file.',
 tip:'Keep tests separate from source code. A common convention is a top-level tests/ or e2e/ folder.',
 docs:'https://playwright.dev/docs/test-configuration#testdir',
 code:`// playwright.config.ts
export default defineConfig({
  testDir: './tests',
  testMatch: '**/*.spec.ts',
});`},

{name:'timeout',
 level:'beginner',
 desc:'Sets the maximum time in milliseconds each test is allowed to run before being marked as failed.',
 tip:'Default is 30 seconds. Increase for slow tests. Use test.slow() to triple the timeout for individual tests.',
 docs:'https://playwright.dev/docs/test-timeouts',
 code:`// playwright.config.ts
export default defineConfig({
  timeout: 60000, // 60 seconds per test
  expect: {
    timeout: 10000, // 10 seconds for each assertion
  },
});`},

{name:'retries',
 level:'intermediate',
 desc:'Sets how many times a failing test is retried before being marked as failed. Helps handle rare, intermittent flakiness.',
 tip:'Use 1-2 retries in CI only. Zero retries locally makes failures visible immediately. Never use retries to hide genuinely broken tests.',
 docs:'https://playwright.dev/docs/test-retries',
 code:`// playwright.config.ts
export default defineConfig({
  retries: process.env.CI ? 2 : 0,
});`},

{name:'workers',
 level:'intermediate',
 desc:'Sets the number of parallel worker processes. Defaults to half the number of CPU cores.',
 tip:'More workers means faster runs on powerful machines. Set to 1 when debugging flaky tests or shared state issues.',
 docs:'https://playwright.dev/docs/test-parallel',
 code:`// playwright.config.ts
export default defineConfig({
  workers: process.env.CI ? 4 : undefined,
  // undefined = use default (half CPU cores) locally
});`},

{name:'fullyParallel',
 level:'intermediate',
 desc:'Runs all tests across all files in parallel, not just files in parallel. Each test gets its own worker.',
 tip:'Enable for maximum speed if your tests are fully isolated. Disable if tests within a file share state or must run in order.',
 docs:'https://playwright.dev/docs/test-parallel#parallelize-tests-in-a-single-file',
 code:`// playwright.config.ts
export default defineConfig({
  fullyParallel: true,
});

// To run tests in a single file serially:
test.describe.configure({ mode: 'serial' });`},

{name:'use (browser options)',
 level:'beginner',
 desc:'Sets shared browser and context options applied to all tests: viewport, locale, timezone, permissions, and more.',
 tip:'Set common options here once instead of in every test. Override per-project or per-test as needed.',
 docs:'https://playwright.dev/docs/test-use-options',
 code:`// playwright.config.ts
export default defineConfig({
  use: {
    baseURL: 'http://localhost:3000',
    viewport: { width: 1280, height: 720 },
    locale: 'en-GB',
    timezoneId: 'Europe/London',
    headless: true,
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'on-first-retry',
  },
});`},

{name:'projects',
 level:'intermediate',
 desc:'Defines multiple named test projects, each with its own browser and configuration. Use for cross-browser testing.',
 tip:'Each project can override any use option. Run a specific project with --project=chromium during development.',
 docs:'https://playwright.dev/docs/test-projects',
 code:`// playwright.config.ts
export default defineConfig({
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox',  use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit',   use: { ...devices['Desktop Safari'] } },
    { name: 'mobile',   use: { ...devices['iPhone 14'] } },
  ],
});`},

{name:'reporter',
 level:'intermediate',
 desc:'Configures the output format for test results. Can combine multiple reporters at once.',
 tip:'Use html locally for rich visual results. Use dot or line in CI for clean logs, and add junit for test result integration.',
 docs:'https://playwright.dev/docs/test-reporters',
 code:`// playwright.config.ts
export default defineConfig({
  reporter: [
    ['html', { open: 'never' }],
    ['junit', { outputFile: 'results.xml' }],
    ['list'],
  ],
});`},

{name:'globalSetup / globalTeardown',
 level:'advanced',
 desc:'Runs a script once before all tests start (globalSetup) and once after all tests finish (globalTeardown).',
 tip:'Use globalSetup to log in and save auth state, seed a database, or start a test server. Tear it down in globalTeardown.',
 docs:'https://playwright.dev/docs/test-global-setup-teardown',
 code:`// playwright.config.ts
export default defineConfig({
  globalSetup: './global-setup.ts',
  globalTeardown: './global-teardown.ts',
});

// global-setup.ts
export default async function() {
  await seedDatabase();
}`},

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

{name:'screenshot / video',
 level:'intermediate',
 desc:"Controls when screenshots and videos are captured. Set to only-on-failure to automatically capture evidence when a test fails.",
 tip:'Both default to off. Enable in CI so you always have visual evidence for failures without slowing down passing tests.',
 docs:'https://playwright.dev/docs/test-configuration#automatic-screenshots',
 code:`// playwright.config.ts
export default defineConfig({
  use: {
    // 'off' | 'on' | 'only-on-failure'
    screenshot: 'only-on-failure',
    // 'off' | 'on' | 'retain-on-failure'
    video: 'retain-on-failure',
  },
});`},

{name:'forbidOnly',
 level:'intermediate',
 desc:'Causes the test run to fail immediately if any test.only() or describe.only() is present. Essential for CI pipelines.',
 tip:'Set this to !!process.env.CI so it is only enforced in CI. Locally you can still use .only() freely during development.',
 docs:'https://playwright.dev/docs/api/class-testconfig#test-config-forbid-only',
 code:`// playwright.config.ts
export default defineConfig({
  forbidOnly: !!process.env.CI,
});`},

{name:'testIdAttribute',
 level:'intermediate',
 desc:'Customizes the HTML attribute that getByTestId() looks for. Defaults to data-testid.',
 tip:'Change this if your codebase uses a different attribute like data-cy (Cypress) or data-qa.',
 docs:'https://playwright.dev/docs/api/class-testconfig#test-config-test-id-attribute',
 code:`// playwright.config.ts
export default defineConfig({
  use: {
    testIdAttribute: 'data-cy', // now getByTestId() reads data-cy
  },
});

// In tests
await page.getByTestId('submit-btn').click();
// Finds: <button data-cy="submit-btn">`},

{name:'project dependencies',
 level:'advanced',
 desc:"Declares a 'setup' project that must finish before other projects run. The modern recommended approach for auth state — it replaces the older globalSetup pattern and shows up as a proper step in the HTML report.",
 tip:"The setup project runs once per worker group and saves storageState to a file; dependent projects load it automatically. Pair with teardown: 'cleanup' to run a project-scoped cleanup after all tests finish.",
 docs:'https://playwright.dev/docs/auth#basic-shared-account-in-all-tests',
 code:`// playwright.config.ts
export default defineConfig({
  projects: [
    // 1. Runs once — logs in and saves cookies + localStorage
    { name: 'setup', testMatch: '**/auth.setup.ts' },

    // 2. Real test projects wait for 'setup' and load its saved state
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'playwright/.auth/user.json',
      },
      dependencies: ['setup'],
    },
  ],
});

// auth.setup.ts  (runs automatically before chromium tests)
import { test as setup } from '@playwright/test';

setup('authenticate', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Email').fill('user@test.com');
  await page.getByLabel('Password').fill('secret');
  await page.getByRole('button', { name: 'Log in' }).click();
  await page.context().storageState({ path: 'playwright/.auth/user.json' });
});`},
]};
