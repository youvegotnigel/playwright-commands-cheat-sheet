/** @type {import('./index.js').Category} */
export default {
  cat: 'Config',
  cls: 'config',
  color: '#6366f1',
  items: [
    {
      name: 'baseURL',
      level: 'beginner',
      desc: 'Sets the base URL for all page.goto() calls. Lets you use relative paths like /login instead of the full URL.',
      tip: 'Set this in playwright.config.ts and never hardcode URLs in tests. Change environments by changing baseURL in one place.',
      docs: 'https://playwright.dev/docs/test-configuration#baseurl',
      code: `// playwright.config.ts
export default defineConfig({
  use: {
    baseURL: 'http://localhost:3000',
  },
});

// In tests relative path works because baseURL is set
await page.goto('/login');`,
    },

    {
      name: 'testDir',
      level: 'beginner',
      desc: 'Sets the directory where Playwright looks for test files. Defaults to the directory of the config file.',
      tip: 'Keep tests separate from source code. A common convention is a top-level tests/ or e2e/ folder.',
      docs: 'https://playwright.dev/docs/test-configuration#testdir',
      code: `// playwright.config.ts
export default defineConfig({
  testDir: './tests',
  testMatch: '**/*.spec.ts',
});`,
    },

    {
      name: 'timeout',
      level: 'beginner',
      desc: 'Sets the maximum time in milliseconds each test is allowed to run before being marked as failed.',
      tip: 'Default is 30 seconds. Increase for slow tests. Use test.slow() to triple the timeout for individual tests.',
      docs: 'https://playwright.dev/docs/test-timeouts',
      code: `// playwright.config.ts
export default defineConfig({
  timeout: 60000, // 60 seconds per test
  expect: {
    timeout: 10000, // 10 seconds for each assertion
  },
});`,
    },

    {
      name: 'retries',
      level: 'intermediate',
      desc: 'Sets how many times a failing test is retried before being marked as failed. Helps handle rare, intermittent flakiness.',
      tip: 'Use 1-2 retries in CI only. Zero retries locally makes failures visible immediately. Never use retries to hide genuinely broken tests.',
      docs: 'https://playwright.dev/docs/test-retries',
      code: `// playwright.config.ts
export default defineConfig({
  retries: process.env.CI ? 2 : 0,
});`,
    },

    {
      name: 'workers',
      level: 'intermediate',
      desc: 'Sets the number of parallel worker processes. Defaults to half the number of CPU cores.',
      tip: 'More workers means faster runs on powerful machines. Set to 1 when debugging flaky tests or shared state issues.',
      docs: 'https://playwright.dev/docs/test-parallel',
      code: `// playwright.config.ts
export default defineConfig({
  workers: process.env.CI ? 4 : undefined,
  // undefined = use default (half CPU cores) locally
});`,
    },

    {
      name: 'fullyParallel',
      level: 'intermediate',
      desc: 'Runs all tests across all files in parallel, not just files in parallel. Each test gets its own worker.',
      tip: 'Enable for maximum speed if your tests are fully isolated. Disable if tests within a file share state or must run in order.',
      docs: 'https://playwright.dev/docs/test-parallel#parallelize-tests-in-a-single-file',
      code: `// playwright.config.ts
export default defineConfig({
  fullyParallel: true,
});

// To run tests in a single file serially:
test.describe.configure({ mode: 'serial' });`,
    },

    {
      name: 'use (browser options)',
      level: 'beginner',
      desc: 'Sets shared browser and context options applied to all tests: viewport, locale, timezone, permissions, and more.',
      tip: 'Set common options here once instead of in every test. Override per-project or per-test as needed.',
      docs: 'https://playwright.dev/docs/test-use-options',
      code: `// playwright.config.ts
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
});`,
    },

    {
      name: 'projects',
      level: 'intermediate',
      desc: 'Defines multiple named test projects, each with its own browser and configuration. Use for cross-browser testing.',
      tip: 'Each project can override any use option. Run a specific project with --project=chromium during development.',
      docs: 'https://playwright.dev/docs/test-projects',
      code: `// playwright.config.ts
export default defineConfig({
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox',  use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit',   use: { ...devices['Desktop Safari'] } },
    { name: 'mobile',   use: { ...devices['iPhone 14'] } },
  ],
});`,
    },

    {
      name: 'reporter',
      level: 'intermediate',
      desc: 'Configures the output format for test results. Can combine multiple reporters at once.',
      tip: 'Use html locally for rich visual results. Use dot or line in CI for clean logs, and add junit for test result integration.',
      docs: 'https://playwright.dev/docs/test-reporters',
      code: `// playwright.config.ts
export default defineConfig({
  reporter: [
    ['html', { open: 'never' }],
    ['junit', { outputFile: 'results.xml' }],
    ['list'],
  ],
});`,
    },

    {
      name: 'globalSetup / globalTeardown',
      level: 'advanced',
      desc: 'Runs a script once before all tests start (globalSetup) and once after all tests finish (globalTeardown).',
      tip: 'Use globalSetup to log in and save auth state, seed a database, or start a test server. Tear it down in globalTeardown.',
      docs: 'https://playwright.dev/docs/test-global-setup-teardown',
      code: `// playwright.config.ts
export default defineConfig({
  globalSetup: './global-setup.ts',
  globalTeardown: './global-teardown.ts',
});

// global-setup.ts
export default async function() {
  await seedDatabase();
}`,
    },

    {
      name: 'screenshot / video',
      level: 'intermediate',
      desc: 'Controls when screenshots and videos are captured. Set to only-on-failure to automatically capture evidence when a test fails.',
      tip: 'Both default to off. Enable in CI so you always have visual evidence for failures without slowing down passing tests. Playwright v1.61 added retry-aware video modes: retain-on-failure-and-retries, retain-on-first-failure, and on-all-retries.',
      docs: 'https://playwright.dev/docs/test-configuration#automatic-screenshots',
      code: `// playwright.config.ts
export default defineConfig({
  use: {
    // 'off' | 'on' | 'only-on-failure'
    screenshot: 'only-on-failure',
    // 'off' | 'on' | 'retain-on-failure' | 'on-first-retry'
    // v1.61 added: 'retain-on-failure-and-retries'
    //              'retain-on-first-failure' | 'on-all-retries'
    video: 'retain-on-failure-and-retries',
  },
});`,
    },

    {
      name: 'forbidOnly',
      level: 'intermediate',
      desc: 'Causes the test run to fail immediately if any test.only() or describe.only() is present. Essential for CI pipelines.',
      tip: 'Set this to !!process.env.CI so it is only enforced in CI. Locally you can still use .only() freely during development.',
      docs: 'https://playwright.dev/docs/api/class-testconfig#test-config-forbid-only',
      code: `// playwright.config.ts
export default defineConfig({
  forbidOnly: !!process.env.CI,
});`,
    },

    {
      name: 'testIdAttribute',
      level: 'intermediate',
      desc: 'Customizes the HTML attribute that getByTestId() looks for. Defaults to data-testid.',
      tip: 'Change this if your codebase uses a different attribute like data-cy (Cypress) or data-qa.',
      docs: 'https://playwright.dev/docs/api/class-testconfig#test-config-test-id-attribute',
      code: `// playwright.config.ts
export default defineConfig({
  use: {
    testIdAttribute: 'data-cy', // now getByTestId() reads data-cy
  },
});

// In tests
await page.getByTestId('submit-btn').click();
// Finds: <button data-cy="submit-btn">`,
    },

    {
      name: 'projects (dependencies)',
      level: 'advanced',
      desc: 'A project can declare dependencies on other projects that must run first, plus a teardown project that runs after it finishes. This is the modern, recommended way to handle auth: a "setup" project logs in and saves storageState before the test projects run.',
      tip: 'Preferred over globalSetup for auth. The setup step shows up in the report and trace, can use fixtures, and reruns on retry. Point dependent projects at the saved storageState via use.',
      docs: 'https://playwright.dev/docs/test-projects#dependencies',
      code: `// playwright.config.ts
export default defineConfig({
  projects: [
    // 1. Runs first: logs in and saves auth state to a file
    { name: 'setup', testMatch: /global\\.setup\\.ts/ },

    // 2. Depends on 'setup'; starts already authenticated
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], storageState: 'auth.json' },
      dependencies: ['setup'],
      teardown: 'cleanup',
    },

    // 3. Runs after everything that names it as teardown
    { name: 'cleanup', testMatch: /global\\.teardown\\.ts/ },
  ],
});`,
    },

    {
      name: 'launchOptions',
      level: 'intermediate',
      desc: 'Passes browser launch settings such as args, slowMo, and executablePath through the use block to every browser Playwright starts.',
      tip: 'launchOptions applies at launch time, so it is per-project and cannot be changed inside a test. Put anything that must vary per test in context options like viewport or colorScheme instead.',
      docs: 'https://playwright.dev/docs/api/class-testoptions#test-options-launch-options',
      code: `// playwright.config.ts
export default defineConfig({
  use: {
    launchOptions: {
      args: ['--disable-dev-shm-usage'],
      slowMo: 0, // milliseconds to pause between operations, for debugging
    },
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        launchOptions: { args: ['--no-sandbox'] }, // replaces, does not merge
      },
    },
  ],
});`,
    },

    {
      name: 'launchOptions.args (container stability)',
      level: 'advanced',
      desc: 'Chromium switches that stop the browser crashing inside Docker, CI runners, and other containers with restricted kernels or small shared memory.',
      tip: 'Reach for --disable-dev-shm-usage first. The classic "Target closed" or "Page crashed" failure in Docker is Chromium exhausting the default 64MB /dev/shm. Avoid --single-process, it trades crashes for hangs.',
      docs: 'https://playwright.dev/docs/api/class-browsertype#browser-type-launch-option-args',
      code: `// playwright.config.ts
export default defineConfig({
  use: {
    launchOptions: {
      args: [
        '--no-sandbox',              // needed when running as root in a container
        '--disable-setuid-sandbox',  // pairs with the above
        '--disable-dev-shm-usage',   // write to /tmp instead of a tiny /dev/shm
        '--disable-gpu',             // no GPU on most CI runners
      ],
    },
  },
});

// Better than --disable-dev-shm-usage if you control the container:
// docker run --shm-size=1gb ...`,
    },

    {
      name: 'launchOptions.args (visual determinism)',
      level: 'advanced',
      desc: 'Chromium switches that remove rendering variance so toHaveScreenshot() comparisons stay stable across machines.',
      tip: 'Font rendering and device scale factor are the two biggest sources of screenshot diffs between a developer laptop and a Linux CI runner. Pin both, and run visual tests in a container so the installed font set matches too.',
      docs: 'https://playwright.dev/docs/api/class-browsertype#browser-type-launch-option-args',
      code: `// playwright.config.ts
export default defineConfig({
  use: {
    launchOptions: {
      args: [
        '--force-device-scale-factor=1', // stop HiDPI laptops rendering at 2x
        '--font-render-hinting=none',    // identical glyphs across machines
        '--disable-lcd-text',            // no subpixel colour fringing
        '--force-color-profile=srgb',    // ignore the monitor colour profile
        '--hide-scrollbars',             // scrollbars differ per platform
        '--disable-partial-raster',      // full repaints, no stale tiles
      ],
    },
  },
});`,
    },

    {
      name: 'launchOptions.args (media and autoplay)',
      level: 'advanced',
      desc: 'Chromium switches that let audio and video autoplay without a user gesture and swap real cameras and microphones for fake devices.',
      tip: 'Without --autoplay-policy=no-user-gesture-required a headless play() call rejects with NotAllowedError, which looks like a broken player rather than a blocked one. Combine these with the Media & Audio checks to assert playback actually produces sound.',
      docs: 'https://playwright.dev/docs/api/class-browsertype#browser-type-launch-option-args',
      code: `// playwright.config.ts
export default defineConfig({
  use: {
    launchOptions: {
      args: [
        '--autoplay-policy=no-user-gesture-required', // let play() work headless
        '--use-fake-ui-for-media-stream',   // auto accept the camera/mic prompt
        '--use-fake-device-for-media-stream', // synthetic webcam and microphone
        '--use-file-for-fake-audio-capture=./fixtures/speech.wav',
        '--allow-file-access-from-files',
      ],
    },
  },
});

// The fake audio file drives getUserMedia, so WebRTC totalAudioEnergy
// rises predictably and a "is the caller audible" test becomes reliable.`,
    },

    {
      name: 'launchOptions.args (proxy and security)',
      level: 'advanced',
      desc: 'Chromium switches for routing traffic through a proxy, pinning DNS, and relaxing certificate or origin restrictions in test environments.',
      tip: 'Prefer the built-in proxy and ignoreHTTPSErrors options over the equivalent args, because they work across all three browsers and can be scoped per context. Never ship --disable-web-security to a suite that also tests CORS, it hides the bugs you are looking for.',
      docs: 'https://playwright.dev/docs/api/class-browsertype#browser-type-launch-option-args',
      code: `// Prefer the cross-browser options where they exist
export default defineConfig({
  use: {
    proxy: { server: 'http://proxy.internal:8080', bypass: '.localhost' },
    ignoreHTTPSErrors: true,
  },
});

// Chromium specific args when you need finer control
export default defineConfig({
  use: {
    launchOptions: {
      args: [
        '--proxy-server=http://proxy.internal:8080',
        '--proxy-bypass-list=*.localhost;127.0.0.1',
        '--ignore-certificate-errors',   // self signed certs in staging
        '--host-resolver-rules=MAP api.example.com 127.0.0.1',
      ],
    },
  },
});`,
    },

    {
      name: 'launchOptions.args (performance)',
      level: 'advanced',
      desc: 'Chromium switches that cut startup cost and stop the browser throttling timers and rendering when a test window sits in the background.',
      tip: 'Background throttling is the hidden cause of tests that pass alone but time out when run with workers > 1. Chromium slows timers in unfocused windows, so polling and animation waits silently stretch past their timeout.',
      docs: 'https://playwright.dev/docs/api/class-browsertype#browser-type-launch-option-args',
      code: `// playwright.config.ts
export default defineConfig({
  use: {
    launchOptions: {
      args: [
        '--disable-background-timer-throttling',    // keep timers at full speed
        '--disable-backgrounding-occluded-windows', // parallel workers overlap
        '--disable-renderer-backgrounding',
        '--disable-extensions',                     // nothing to load at startup
        '--disable-ipc-flooding-protection',
        '--js-flags=--max-old-space-size=4096',     // headroom for heavy apps
      ],
    },
  },
});`,
    },

    {
      name: 'launchOptions.args (accessibility)',
      level: 'advanced',
      desc: 'Chromium switches that force the accessibility tree on and pin motion, contrast, and colour preferences at the browser level.',
      tip: 'Use the reducedMotion, forcedColors, and colorScheme context options first, since they are cross-browser and can be overridden per test. Only fall back to args when you need the setting fixed before the first page loads.',
      docs: 'https://playwright.dev/docs/api/class-browsertype#browser-type-launch-option-args',
      code: `// Preferred: per-context options, overridable inside a test
export default defineConfig({
  use: {
    reducedMotion: 'reduce',
    forcedColors: 'active',
    colorScheme: 'dark',
  },
});

// Browser level equivalents, fixed for the whole session
export default defineConfig({
  use: {
    launchOptions: {
      args: [
        '--force-prefers-reduced-motion',  // kill animations before first paint
        '--force-renderer-accessibility',  // always build the a11y tree
        '--force-high-contrast',
        '--force-color-profile=srgb',
      ],
    },
  },
});`,
    },

    {
      name: 'launchOptions.args (mobile)',
      level: 'advanced',
      desc: 'Chromium switches for touch input, mobile viewport behaviour, and overlay scrollbars when emulating a phone.',
      tip: 'The devices[] descriptors already set userAgent, viewport, deviceScaleFactor, isMobile, and hasTouch, so start there. These args only matter when you need a device profile Playwright does not ship or a touch behaviour the descriptor does not cover.',
      docs: 'https://playwright.dev/docs/api/class-browsertype#browser-type-launch-option-args',
      code: `// Preferred: a built-in device descriptor
export default defineConfig({
  projects: [{ name: 'iPhone 16', use: { ...devices['iPhone 16'] } }],
});

// Chromium args for a profile the descriptors do not cover
export default defineConfig({
  projects: [
    {
      name: 'custom-phone',
      use: {
        viewport: { width: 412, height: 915 },
        isMobile: true,
        hasTouch: true,
        launchOptions: {
          args: [
            '--touch-events=enabled',            // dispatch real touch events
            '--enable-viewport',                 // honour the meta viewport tag
            '--enable-features=OverlayScrollbar', // mobile style scrollbars
            '--force-device-scale-factor=2.6',
          ],
        },
      },
    },
  ],
});`,
    },
  ],
};
