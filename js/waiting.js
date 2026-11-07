// =============================================================
// waiting.js — content of the Waiting guide (waiting.html).
// SECTIONS is the content source: edit it here to change the page.
// js/guide.js renders it.
// =============================================================

import { renderGuide } from './guide.js';

const SECTIONS = [
  {
    id: 'actions',
    title: 'Auto-waiting: actions',
    note: 'Before acting, Playwright retries until the element passes the actionability checks listed for that method.',
    cols: ['Method', 'Checks performed', 'Real-world example'],
    rows: [
      [
        '`click()`, `dblclick()`, `tap()`',
        'Visible, Stable, Receives Events, Enabled',
        `await page.getByRole('button', { name: 'Save' }).click();`,
      ],
      [
        '`check()`, `uncheck()`, `setChecked()`',
        'Visible, Stable, Receives Events, Enabled',
        `await page.getByLabel('I accept the terms').check();`,
      ],
      [
        '`hover()`, `dragTo()`',
        'Visible, Stable, Receives Events',
        `await page.getByText('Task A')
  .dragTo(page.getByTestId('done-column'));`,
      ],
      [
        '`fill()`, `clear()`',
        'Visible, Enabled, Editable',
        `await page.getByLabel('Email').fill('nigel@test.com');`,
      ],
      [
        '`selectOption()`',
        'Visible, Enabled',
        `await page.getByLabel('Country').selectOption('LK');`,
      ],
      ['`selectText()`', 'Visible', `await page.getByTestId('notes-editor').selectText();`],
      [
        '`screenshot()`',
        'Visible, Stable',
        `await page.getByTestId('invoice-card')
  .screenshot({ path: 'invoice.png' });`,
      ],
      [
        '`scrollIntoViewIfNeeded()`',
        'Stable',
        `await page.getByText('Load more').scrollIntoViewIfNeeded();`,
      ],
      [
        '`press()`, `pressSequentially()`, `focus()`, `blur()`, `setInputFiles()`, `dispatchEvent()`',
        'No actionability checks. Only waits for the element to be attached.',
        `await page.getByLabel('Upload').setInputFiles('data/report.pdf');

await page.getByLabel('Search')
  .pressSequentially('para', { delay: 100 });`,
      ],
    ],
  },
  {
    id: 'assertions',
    title: 'Auto-waiting: web-first assertions',
    note: 'These retry until they pass or expect.timeout runs out (5 seconds by default).',
    cols: ['Assertion group', 'Matchers', 'Real-world example'],
    rows: [
      [
        'Visibility and presence',
        '`toBeVisible`, `toBeHidden`, `toBeAttached`, `toBeInViewport`',
        `await expect(page.getByTestId('loader')).toBeHidden();`,
      ],
      [
        'State',
        '`toBeEnabled`, `toBeDisabled`, `toBeEditable`, `toBeChecked`, `toBeEmpty`, `toBeFocused`',
        `await expect(
  page.getByRole('button', { name: 'Submit' }),
).toBeDisabled();`,
      ],
      [
        'Text and values',
        '`toHaveText`, `toContainText`, `toHaveValue`, `toHaveValues`',
        `await expect(page.getByRole('alert')).toHaveText('Saved successfully');`,
      ],
      [
        'Attributes and styling',
        '`toHaveAttribute`, `toHaveClass`, `toContainClass`, `toHaveCSS`, `toHaveId`, `toHaveJSProperty`',
        `await expect(
  page.getByRole('tab', { name: 'Profile' }),
).toHaveAttribute('aria-selected', 'true');`,
      ],
      ['Count', '`toHaveCount`', `await expect(page.getByTestId('row')).toHaveCount(5);`],
      [
        'Accessibility',
        '`toHaveRole`, `toHaveAccessibleName`, `toHaveAccessibleDescription`, `toMatchAriaSnapshot`',
        `await expect(page.getByTestId('close-btn'))
  .toHaveAccessibleName('Close dialog');`,
      ],
      [
        'Visual',
        '`toHaveScreenshot` (locator or page)',
        `await expect(page).toHaveScreenshot('dashboard.png', {
  maxDiffPixels: 100,
});`,
      ],
      [
        'Page',
        '`toHaveTitle`, `toHaveURL`',
        `await expect(page).toHaveURL(/\\/dashboard/);
await expect(page).toHaveTitle('Patient Dashboard');`,
      ],
      [
        'Not auto-retrying (generic matchers, checked once)',
        '`toBe`, `toEqual`, `toContain`, `toBeTruthy`',
        `// Only on values you have already resolved
expect(await response.json()).toEqual({ status: 'OK' });`,
        true,
      ],
    ],
  },
  {
    id: 'navigation',
    title: 'Auto-waiting: navigation',
    cols: ['Method', 'Default wait', 'Real-world example'],
    rows: [
      [
        '`page.goto(url)`',
        'The `load` event. Configurable with `waitUntil`.',
        `await page.goto('/login', { waitUntil: 'domcontentloaded' });`,
      ],
      [
        '`page.reload()`, `goBack()`, `goForward()`',
        'The `load` event',
        `await page.reload();
await expect(page.getByText('Draft restored')).toBeVisible();`,
      ],
    ],
  },
  {
    id: 'explicit',
    title: 'Explicit waits',
    note: 'Golden rule: register the wait before the action that triggers it.',
    cols: ['Method', 'Use it when', 'Real-world example'],
    rows: [
      [
        '`locator.waitFor({ state })`',
        "You need a state without acting or asserting: `'visible'` (default), `'hidden'`, `'attached'`, `'detached'`",
        `await page.getByTestId('loader').waitFor({ state: 'hidden' });`,
      ],
      [
        '`page.waitForURL(url)`',
        'Waiting for a redirect, such as SSO login',
        `await page.getByRole('button', { name: 'Sign in' }).click();
await page.waitForURL('**/home');`,
      ],
      [
        '`page.waitForLoadState(state)`',
        "Waiting for `'load'`, `'domcontentloaded'` or `'networkidle'`",
        `await popup.waitForLoadState('domcontentloaded');`,
      ],
      [
        '`page.waitForResponse(pred)`',
        'Waiting for an API call to finish. Register the wait before the action.',
        `const responsePromise = page.waitForResponse(
  (res) => res.url().includes('/api/patients') && res.status() === 200,
);
await page.getByRole('button', { name: 'Search' }).click();
const response = await responsePromise;`,
      ],
      [
        '`page.waitForRequest(pred)`',
        'Checking that a request was fired',
        `const requestPromise = page.waitForRequest('**/api/audit');
await saveButton.click();
expect((await requestPromise).method()).toBe('POST');`,
      ],
      [
        "`page.waitForEvent('popup')`",
        'Handling a new window opened from the page',
        `const popupPromise = page.waitForEvent('popup');
await page.getByRole('link', { name: 'Open report' }).click();
const popup = await popupPromise;`,
      ],
      [
        "`page.waitForEvent('download')`",
        'Testing file exports',
        `const downloadPromise = page.waitForEvent('download');
await page.getByRole('button', { name: 'Export CSV' }).click();
const download = await downloadPromise;
await download.saveAs('out/export.csv');`,
      ],
      [
        "`page.waitForEvent('dialog' / 'console' / 'filechooser' / 'websocket')`",
        'Handling browser dialogs, logs, native file pickers or sockets',
        `const chooserPromise = page.waitForEvent('filechooser');
await page.getByText('Browse').click();
const chooser = await chooserPromise;
await chooser.setFiles('data/cv.pdf');`,
      ],
      [
        "`context.waitForEvent('page')`",
        'Waiting for a new tab opened anywhere in the context',
        `const tabPromise = context.waitForEvent('page');
await page.getByText('Help Centre').click();
const newTab = await tabPromise;`,
      ],
      [
        '`page.waitForFunction(fn)`',
        'Waiting on a custom JS condition in the browser',
        `await page.waitForFunction(() => window.appReady === true);`,
      ],
      [
        '`expect.poll(fn)`',
        'Retrying any async value, such as an API or DB check',
        `await expect
  .poll(async () => (await request.get('/api/job/42')).json(), {
    timeout: 30_000,
  })
  .toMatchObject({ status: 'COMPLETED' });`,
      ],
      [
        '`expect(fn).toPass()`',
        'Retrying a whole block of steps until it passes',
        `await expect(async () => {
  await page.getByRole('button', { name: 'Refresh' }).click();
  await expect(page.getByText('Ready')).toBeVisible({ timeout: 1_000 });
}).toPass({ timeout: 15_000 });`,
      ],
      [
        '`page.waitForTimeout(ms)` <tag>Avoid</tag>',
        'Hard sleep. Debugging only.',
        `await page.waitForTimeout(2_000); // local debug only, never commit`,
        true,
      ],
      [
        '`page.waitForSelector()` <tag>Legacy</tag>',
        'Use `locator.waitFor()` instead',
        `// Before
await page.waitForSelector('#grid');

// After
await page.locator('#grid').waitFor();`,
        true,
      ],
      [
        '`page.waitForNavigation()` <tag>Deprecated</tag>',
        'Use `waitForURL()` instead',
        `await page.getByRole('button', { name: 'Pay now' }).click();
await page.waitForURL('**/checkout/confirm');`,
        true,
      ],
    ],
  },
  {
    id: 'not-waits',
    title: 'Methods that look like waits but are not',
    note: 'The trap juniors fall into most often.',
    cols: ['Method', 'Behaviour', 'Flaky vs correct'],
    rows: [
      [
        '`isVisible()`, `isHidden()`',
        'Return immediately, with no waiting at all',
        `// Flaky: checks once, may run before render
if (await page.getByText('Welcome').isVisible()) { /* ... */ }

// Correct
await expect(page.getByText('Welcome')).toBeVisible();`,
        true,
      ],
      [
        '`count()`, `allTextContents()`, `allInnerTexts()`, `all()`',
        'Return a snapshot with no waiting',
        `// Flaky
expect(await rows.count()).toBe(5);

// Correct
await expect(rows).toHaveCount(5);`,
        true,
      ],
      [
        '`textContent()`, `innerText()`, `getAttribute()`, `inputValue()`',
        'Wait for the element to exist, but do not retry on content',
        `// Flaky
expect(await status.textContent()).toBe('Paid');

// Correct
await expect(status).toHaveText('Paid');`,
        true,
      ],
      [
        '`isChecked()`, `isEnabled()`, `isEditable()`, `isDisabled()`',
        'Wait for the element to be attached, then check its state once',
        `// Flaky
expect(await submitButton.isEnabled()).toBe(true);

// Correct
await expect(submitButton).toBeEnabled();`,
        true,
      ],
    ],
  },
  {
    id: 'timeouts',
    title: 'Timeout settings (playwright.config.ts)',
    cols: ['Setting', 'Controls', 'Real-world example'],
    rows: [
      [
        '`timeout`',
        'Each test',
        `export default defineConfig({
  timeout: 60_000,
});`,
      ],
      ['`expect.timeout`', 'Web-first assertions', `expect: { timeout: 10_000 },`],
      [
        '`use.actionTimeout`',
        '`click`, `fill` and other actions',
        `use: { actionTimeout: 15_000 },`,
      ],
      ['`use.navigationTimeout`', '`goto`, `waitForURL`', `use: { navigationTimeout: 30_000 },`],
      [
        'Per-call override',
        'One known slow step',
        `await expect(reportTable).toBeVisible({ timeout: 30_000 });`,
      ],
    ],
  },
  {
    id: 'tips',
    title: 'Pro tips and pitfalls',
    cols: ['Tip', 'Why', 'Real-world example'],
    rows: [
      [
        'Never commit `waitForTimeout`',
        'It hides a missing assertion or response wait. Enforce it with ESLint so CI catches it.',
        `// eslint.config.ts
rules: {
  'playwright/no-wait-for-timeout': 'error',
},`,
      ],
      [
        'Avoid `networkidle`',
        'Apps that poll, use WebSockets or send analytics may never go idle',
        `// Instead of waitForLoadState('networkidle')
await expect(page.getByTestId('grid')).toBeVisible();`,
      ],
      [
        'Register the wait before the trigger',
        'Otherwise the event can fire before the listener exists, causing intermittent timeouts',
        `const savePromise = page.waitForResponse('**/api/save');
await saveButton.click();
await savePromise;`,
      ],
      [
        "Don't wrap auto-waiting actions",
        'Calling `waitFor()` and then `click()` is redundant noise',
        `// Redundant
await submitButton.waitFor({ state: 'visible' });
await submitButton.click();

// Enough
await submitButton.click();`,
      ],
      [
        'Use `addLocatorHandler()` for random overlays',
        'Handles cookie banners and session-timeout modals globally',
        `await page.addLocatorHandler(
  page.getByRole('button', { name: 'Accept cookies' }),
  async (button) => button.click(),
);`,
      ],
      [
        'Treat `{ force: true }` as a code smell',
        "It skips actionability checks and can hide real bugs, like an overlay a user couldn't click through",
        `// Investigate the overlay before resorting to this
await submitButton.click({ force: true });`,
        true,
      ],
      [
        'Use intent-named waits in Page Objects',
        'Specs stay readable and the wait logic lives in one place',
        `async waitForSearchResults(): Promise<void> {
  await this.page.waitForResponse('**/api/search');
  await expect(this.results.first()).toBeVisible();
}`,
      ],
    ],
  },
  {
    id: 'summary',
    title: 'Summary',
    text: true,
    cols: ['Category', 'Methods', 'Rule of thumb'],
    rows: [
      [
        'Auto-waiting',
        'All locator actions, web-first `expect` assertions, `goto` and `reload`',
        'Your first choice',
      ],
      [
        'Explicit waiting',
        '`waitFor`, `waitForURL`, `waitForResponse`, `waitForRequest`, `waitForEvent`, `waitForLoadState`, `waitForFunction`, `expect.poll`, `toPass`',
        'For network, events and custom conditions',
      ],
      [
        'No waiting',
        '`isVisible`, `isHidden`, `count`, `allTextContents`, generic matchers like `toBe`',
        "Don't use these for synchronisation",
      ],
      ['Hard sleeps', '`waitForTimeout`', 'Never in committed code', true],
    ],
  },
];

// Expose for tests via page.evaluate() (same rationale as window.categories)
window.waitingSections = SECTIONS;

// Column that holds method names, per section: those chips link back to the dashboard
const LINK_COLUMN = { actions: 0, navigation: 0, explicit: 0, 'not-waits': 0, assertions: 1 };

renderGuide(SECTIONS, { linkColumns: LINK_COLUMN });
