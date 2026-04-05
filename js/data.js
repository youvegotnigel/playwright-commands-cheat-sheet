// =============================================================
// data.js — All Playwright commands, descriptions, tips & docs
//
// To add a new command: find the right category below and add
// a new object to its `items` array with these fields:
//   name  — the command name shown on the tile
//   level — 'beginner' | 'intermediate' | 'advanced'
//   desc  — plain English explanation of what it does
//   tip   — when to use it, gotchas, alternatives
//   docs  — URL to the official Playwright docs page
//   code  — example code shown in the modal
// =============================================================

const categories = [

/* ── TEST SETUP ───────────────────────────────────────────────── */
{cat:'Setup', cls:'setup', color:'#06b6d4', items:[
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
 tip:'Avoid heavy cleanup here: Playwright isolates each test with a fresh browser context by default.',
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
]},

/* ── QUERIES ──────────────────────────────────────────────────── */
{cat:'Query', cls:'query', color:'#3b82f6', items:[
{name:'locator()',
 level:'beginner',
 desc:'Finds elements using a CSS selector or XPath expression. The most flexible selector method.',
 tip:'Use when no semantic selector (getByRole, getByLabel) fits. Prefer semantic selectors, they are more readable and resilient to UI changes.',
 docs:'https://playwright.dev/docs/api/class-page#page-locator',
 code:`const btn = page.locator('#login');
await btn.click();

// CSS class selector
await page.locator('.nav-item.active').click();

// XPath
await page.locator('//button[text()="Submit"]').click();`},

{name:'getByRole()',
 level:'beginner',
 desc:'Finds an element by its ARIA role (button, heading, textbox, etc.) and optional accessible name. The most recommended selector.',
 tip:"The #1 recommended way to select elements. It mirrors how assistive technologies see the page and is resilient to style changes.",
 docs:'https://playwright.dev/docs/api/class-page#page-get-by-role',
 code:`await page.getByRole('button', { name: 'Submit' }).click();
await page.getByRole('textbox', { name: 'Email' }).fill('test@mail.com');
await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();`},

{name:'getByText()',
 level:'beginner',
 desc:'Finds an element by its visible text content. Matches substrings by default.',
 tip:'Good for links, labels, and headings. Use exact: true for a strict full text match. For form inputs, prefer getByLabel().',
 docs:'https://playwright.dev/docs/api/class-page#page-get-by-text',
 code:`await page.getByText('Welcome back').click();

// Exact match only
await page.getByText('Submit', { exact: true }).click();`},

{name:'getByLabel()',
 level:'beginner',
 desc:'Finds a form input by the text of its associated label element. Highly recommended for form fields.',
 tip:'The most reliable way to find inputs. If your form has proper labels, this almost always beats using CSS selectors.',
 docs:'https://playwright.dev/docs/api/class-page#page-get-by-label',
 code:`await page.getByLabel('Email').fill('test@mail.com');
await page.getByLabel('Password').fill('secret');
await page.getByLabel('Remember me').check();`},

{name:'getByPlaceholder()',
 level:'beginner',
 desc:'Finds an input by its placeholder text. Useful when no label element is present.',
 tip:'Use as a fallback when getByLabel() is not available. Placeholder text can change, so getByLabel() or getByRole() is more stable long-term.',
 docs:'https://playwright.dev/docs/api/class-page#page-get-by-placeholder',
 code:`await page.getByPlaceholder('Search...').fill('Playwright');
await page.getByPlaceholder('Enter your email').fill('test@mail.com');`},

{name:'getByTestId()',
 level:'beginner',
 desc:'Finds an element by its data-testid attribute, test-specific selector that survives style and structure changes.',
 tip:'Best used when you control the codebase and can add data-testid attributes. Test IDs are invisible to design changes and very stable.',
 docs:'https://playwright.dev/docs/api/class-page#page-get-by-test-id',
 code:`await page.getByTestId('submit-btn').click();
await expect(page.getByTestId('error-msg')).toBeVisible();`},

{name:'getByAltText()',
 level:'intermediate',
 desc:'Finds an img or element with an alt attribute matching the given text.',
 tip:'Primarily for images. Use when you need to assert an image is present or click an image-based link.',
 docs:'https://playwright.dev/docs/api/class-page#page-get-by-alt-text',
 code:`await page.getByAltText('Company logo').click();
await expect(page.getByAltText('User avatar')).toBeVisible();`},

{name:'getByTitle()',
 level:'intermediate',
 desc:'Finds an element by its title attribute. The tooltip text shown on hover.',
 tip:'Useful for icon buttons that have a title but no visible label. Less common than other selectors.',
 docs:'https://playwright.dev/docs/api/class-page#page-get-by-title',
 code:`await page.getByTitle('Close dialog').click();
await expect(page.getByTitle('Settings')).toBeVisible();`},

{name:'frameLocator()',
 level:'advanced',
 desc:'Switches the locator context into an iframe so you can interact with elements inside it.',
 tip:'You must use frameLocator before any query inside an iframe. Normal locators cannot cross iframe boundaries.',
 docs:'https://playwright.dev/docs/api/class-page#page-frame-locator',
 code:`await page.frameLocator('#payment-frame')
  .getByLabel('Card number')
  .fill('4242 4242 4242 4242');`},

{name:'nth()',
 level:'intermediate',
 desc:'Picks the element at a specific index from a list of matches. Index starts at 0.',
 tip:'Use sparingly index-based selectors are brittle when list order changes. Prefer filter() with text or attribute checks when possible.',
 docs:'https://playwright.dev/docs/api/class-locator#locator-nth',
 code:`// Third item (index 2)
await page.locator('li').nth(2).click();

// Last item
await page.locator('li').last().click();`},

{name:'filter()',
 level:'intermediate',
 desc:'Narrows a set of matching elements by additional conditions like text content or the presence of a child element.',
 tip:'Combine with a broad locator to zero in on a specific item. Much more readable than complex CSS selectors.',
 docs:'https://playwright.dev/docs/api/class-locator#locator-filter',
 code:`// Find a list item containing "Active"
await page.locator('li').filter({ hasText: 'Active' }).click();

// Find a table row that contains "John", then click its button
await page.locator('tr').filter({
  has: page.locator('td', { hasText: 'John' })
}).locator('button').click();`},
]},

/* ── ACTIONS ──────────────────────────────────────────────────── */
{cat:'Action', cls:'action', color:'#22c55e', items:[
{name:'click()',
 level:'beginner',
 desc:'Clicks an element. Playwright automatically scrolls it into view and waits for it to be actionable before clicking.',
 tip:"No need to manually scroll or wait. Playwright handles it. For double-click use dblclick(). For right-click, pass { button: 'right' }.",
 docs:'https://playwright.dev/docs/api/class-locator#locator-click',
 code:`await page.locator('#login').click();

// Right-click
await page.locator('#item').click({ button: 'right' });

// Click while holding Ctrl
await page.locator('#item').click({ modifiers: ['Control'] });`},

{name:'fill()',
 level:'beginner',
 desc:'Sets the value of an input, textarea, or content editable element instantly. Clears any existing content first.',
 tip:"Preferred over type() for most cases. It is faster and more reliable. Use type() only when testing keystroke-by-keystroke behaviour like autocomplete.",
 docs:'https://playwright.dev/docs/api/class-locator#locator-fill',
 code:`await page.getByLabel('Email').fill('test@mail.com');

// Fill then submit with keyboard
await page.getByLabel('Search').fill('Playwright');
await page.keyboard.press('Enter');`},

{name:'press()',
 level:'beginner',
 desc:'Simulates pressing a key on a focused element. Supports named keys: Enter, Tab, Escape, ArrowDown, and more.',
 tip:'Use for submitting forms with Enter, moving focus with Tab, or dismissing with Escape. For global shortcuts use keyboard.press().',
 docs:'https://playwright.dev/docs/api/class-locator#locator-press',
 code:`// Submit a form
await page.locator('#search').press('Enter');

// Move focus to the next field
await page.locator('#email').press('Tab');`},

{name:'check()',
 level:'beginner',
 desc:'Checks a checkbox or radio button. Does nothing if it is already checked.',
 tip:'More semantic than click() for checkboxes. It guarantees the element ends up checked regardless of its current state.',
 docs:'https://playwright.dev/docs/api/class-locator#locator-check',
 code:`await page.locator('#terms').check();
await page.getByLabel('Subscribe to newsletter').check();`},

{name:'uncheck()',
 level:'beginner',
 desc:'Unchecks a checkbox. Does nothing if it is already unchecked.',
 tip:'Use instead of click() to ensure the checkbox ends up unchecked. Safe to call even if already unchecked.',
 docs:'https://playwright.dev/docs/api/class-locator#locator-uncheck',
 code:`await page.locator('#newsletter').uncheck();
await page.getByLabel('Remember me').uncheck();`},

{name:'selectOption()',
 level:'beginner',
 desc:'Selects one or more options in a select dropdown by value, visible label text, or index.',
 tip:'Can select by value, visible text (label), or index. Pass an array for multi-select dropdowns.',
 docs:'https://playwright.dev/docs/api/class-locator#locator-select-option',
 code:`// By value attribute
await page.locator('select#country').selectOption('ca');

// By visible label text
await page.locator('select').selectOption({ label: 'Canada' });

// Multi-select
await page.locator('select#tags').selectOption(['news', 'sport']);`},

{name:'hover()',
 level:'intermediate',
 desc:'Moves the mouse over an element, triggering hover states and revealing any related dropdowns or tooltips.',
 tip:'Use when a menu or tooltip only appears on hover. Playwright waits for the element to be visible before hovering.',
 docs:'https://playwright.dev/docs/api/class-locator#locator-hover',
 code:`// Hover to reveal a dropdown menu
await page.locator('#nav-menu').hover();
await page.getByRole('link', { name: 'Settings' }).click();`},

{name:'dblclick()',
 level:'intermediate',
 desc:'Double-clicks an element. Used for actions like entering edit mode on a table cell or selecting a word in text.',
 tip:'Only use when the feature explicitly requires a double-click. For regular interactions, use click().',
 docs:'https://playwright.dev/docs/api/class-locator#locator-dbl-click',
 code:`// Double-click a cell to enter edit mode
await page.locator('td.editable').dblclick();
await page.locator('td.editable input').fill('new value');`},

{name:'type()',
 level:'intermediate',
 desc:'Types text character by character, firing keyboard events for each key. Simulates a real user typing.',
 tip:'Use fill() instead for most cases. Use type() only when the input reacts to individual keystrokes (autocomplete, live validation).',
 docs:'https://playwright.dev/docs/api/class-locator#locator-type',
 code:`// Slow typing to trigger autocomplete suggestions
await page.locator('#search').type('Play', { delay: 100 });
await page.getByRole('option', { name: 'Playwright' }).click();`},

{name:'clear()',
 level:'beginner',
 desc:'Clears the current value of an input or textarea.',
 tip:'fill() clears automatically before typing. Use clear() when you want to empty a field without immediately filling it with new content.',
 docs:'https://playwright.dev/docs/api/class-locator#locator-clear',
 code:`await page.locator('#search').clear();

await page.getByLabel('Name').clear();
await expect(page.getByLabel('Name')).toHaveValue('');`},

{name:'dragTo()',
 level:'advanced',
 desc:'Drags an element and drops it onto a target element, handling the full mousedown, mousemove, mouseup sequence.',
 tip:'Works for most drag-and-drop implementations. For complex custom DnD libraries you may need mouse.move() steps manually.',
 docs:'https://playwright.dev/docs/api/class-locator#locator-drag-to',
 code:`await page.locator('#drag-item').dragTo(page.locator('#drop-zone'));`},

{name:'setInputFiles()',
 level:'intermediate',
 desc:'Uploads one or more files to a file input element without opening the OS file picker dialog.',
 tip:'Handles file uploads programmatically, no dialog needed. Path is relative to the project root. Pass an array for multiple files.',
 docs:'https://playwright.dev/docs/api/class-locator#locator-set-input-files',
 code:`// Single file
await page.locator('input[type=file]').setInputFiles('tests/fixtures/doc.pdf');

// Multiple files
await page.locator('input[type=file]').setInputFiles([
  'tests/fixtures/a.png',
  'tests/fixtures/b.png'
]);`},

{name:'scrollIntoView()',
 level:'intermediate',
 desc:'Scrolls the page until the element is visible in the viewport. Useful for elements below the fold.',
 tip:'Most Playwright actions scroll automatically. Use this explicitly when you need the element visible before taking a screenshot.',
 docs:'https://playwright.dev/docs/api/class-locator#locator-scroll-into-view-if-needed',
 code:`await page.locator('#footer-section').scrollIntoViewIfNeeded();
await page.screenshot({ path: 'footer.png' });`},

{name:'keyboard.press()',
 level:'intermediate',
 desc:'Sends a global keyboard shortcut to the page, not tied to any specific element.',
 tip:'Use for global shortcuts like Ctrl+S, Ctrl+Z, or Escape. For element-specific key presses, use locator.press() instead.',
 docs:'https://playwright.dev/docs/api/class-keyboard#keyboard-press',
 code:`await page.keyboard.press('Control+A');  // Select all
await page.keyboard.press('Control+Z');  // Undo
await page.keyboard.press('Escape');     // Close modal`},
]},

/* ── ASSERTIONS ───────────────────────────────────────────────── */
{cat:'Assertions', cls:'assertion', color:'#fb923c', items:[
{name:'toBeVisible()',
 level:'beginner',
 desc:'Asserts that an element is present in the DOM and visible on screen (not hidden by CSS).',
 tip:'The most common assertion. Playwright retries until it passes or times out. Use .not.toBeVisible() for the inverse.',
 docs:'https://playwright.dev/docs/api/class-locatorassertions#locator-assertions-to-be-visible',
 code:`await expect(page.locator('#success-msg')).toBeVisible();

// Assert it is NOT visible
await expect(page.locator('#spinner')).not.toBeVisible();`},

{name:'toBeHidden()',
 level:'beginner',
 desc:'Asserts that an element is hidden, either absent from the DOM or not visible (display:none, visibility:hidden, etc.).',
 tip:'Equivalent to .not.toBeVisible() but reads more clearly when you are intentionally verifying hidden state.',
 docs:'https://playwright.dev/docs/api/class-locatorassertions#locator-assertions-to-be-hidden',
 code:`await expect(page.locator('#loading-spinner')).toBeHidden();
await expect(page.locator('#error-banner')).toBeHidden();`},

{name:'toHaveText()',
 level:'beginner',
 desc:"Asserts the element's text content matches the expected value exactly. Accepts a string or regex.",
 tip:'Normalizes whitespace by default. Use toContainText() for a partial match. Pass a regex for flexible matching.',
 docs:'https://playwright.dev/docs/api/class-locatorassertions#locator-assertions-to-have-text',
 code:`await expect(page.locator('h1')).toHaveText('Dashboard');

// Regex match
await expect(page.locator('.status')).toHaveText(/active/i);`},

{name:'toContainText()',
 level:'beginner',
 desc:"Asserts that the element's text content includes the expected substring. Partial match. Other text is allowed.",
 tip:'Use when you only care about part of the text. toHaveText() requires the full text to match.',
 docs:'https://playwright.dev/docs/api/class-locatorassertions#locator-assertions-to-contain-text',
 code:`await expect(page.locator('#notification')).toContainText('saved successfully');`},

{name:'toHaveURL()',
 level:'beginner',
 desc:'Asserts the current page URL matches the expected string or regex. Automatically waits for navigation to complete.',
 tip:'Essential after clicks that trigger navigation. Playwright waits for the URL to match before the assertion passes.',
 docs:'https://playwright.dev/docs/api/class-pageassertions#page-assertions-to-have-url',
 code:`await expect(page).toHaveURL('/dashboard');

// Regex for partial match
await expect(page).toHaveURL(/\/users\/\d+/);`},

{name:'toHaveTitle()',
 level:'beginner',
 desc:'Asserts the page title element matches the expected string or regex.',
 tip:'Useful for smoke tests to verify you are on the right page. Accepts a regex for partial matching.',
 docs:'https://playwright.dev/docs/api/class-pageassertions#page-assertions-to-have-title',
 code:`await expect(page).toHaveTitle('Dashboard | MyApp');

// Partial match with regex
await expect(page).toHaveTitle(/Dashboard/);`},

{name:'toBeEnabled()',
 level:'beginner',
 desc:'Asserts that a form element (button, input, etc.) is not disabled and can be interacted with.',
 tip:'Use to verify a button becomes clickable after all required fields are filled, or after an async operation completes.',
 docs:'https://playwright.dev/docs/api/class-locatorassertions#locator-assertions-to-be-enabled',
 code:`await expect(page.getByRole('button', { name: 'Submit' })).toBeEnabled();`},

{name:'toBeDisabled()',
 level:'beginner',
 desc:'Asserts that a form element is disabled and cannot be interacted with.',
 tip:'Use to verify buttons or inputs are correctly disabled when a form is incomplete or during a loading state.',
 docs:'https://playwright.dev/docs/api/class-locatorassertions#locator-assertions-to-be-disabled',
 code:`// Submit button should be disabled until form is valid
await expect(page.getByRole('button', { name: 'Submit' })).toBeDisabled();`},

{name:'toBeChecked()',
 level:'intermediate',
 desc:'Asserts that a checkbox or radio button is in the checked state.',
 tip:'Use after check() to verify the state changed, or in initial-state tests to verify default selections.',
 docs:'https://playwright.dev/docs/api/class-locatorassertions#locator-assertions-to-be-checked',
 code:`await expect(page.locator('#terms')).toBeChecked();

// Assert NOT checked
await expect(page.locator('#newsletter')).not.toBeChecked();`},

{name:'toHaveValue()',
 level:'intermediate',
 desc:'Asserts that an input, textarea, or select element has the expected value.',
 tip:'Use after fill() to verify the value was set correctly, or to check the current state of a select dropdown.',
 docs:'https://playwright.dev/docs/api/class-locatorassertions#locator-assertions-to-have-value',
 code:`await expect(page.locator('#email')).toHaveValue('test@mail.com');
await expect(page.locator('select#country')).toHaveValue('ca');`},

{name:'toHaveCount()',
 level:'intermediate',
 desc:'Asserts the number of elements matching a locator. Useful for lists, table rows, and repeated components.',
 tip:'Playwright waits and retries until the count matches. Great for asserting after async operations that add or remove items.',
 docs:'https://playwright.dev/docs/api/class-locatorassertions#locator-assertions-to-have-count',
 code:`await expect(page.locator('tbody tr')).toHaveCount(10);

// After deleting an item
await expect(page.locator('.card')).toHaveCount(3);`},

{name:'toHaveAttribute()',
 level:'intermediate',
 desc:'Asserts that an element has a specific HTML attribute with an optional expected value.',
 tip:'Useful for checking aria attributes (aria-expanded, aria-selected), href values on links, or data attributes.',
 docs:'https://playwright.dev/docs/api/class-locatorassertions#locator-assertions-to-have-attribute',
 code:`await expect(page.locator('a.home')).toHaveAttribute('href', '/home');

// Check aria state
await expect(page.locator('#menu')).toHaveAttribute('aria-expanded', 'true');`},

{name:'toHaveClass()',
 level:'intermediate',
 desc:'Asserts that an element has the specified CSS class. Accepts a string or regex.',
 tip:'Use to verify active states, selected items, or error states that are communicated via CSS classes.',
 docs:'https://playwright.dev/docs/api/class-locatorassertions#locator-assertions-to-have-class',
 code:`await expect(page.locator('#tab-home')).toHaveClass(/active/);
await expect(page.locator('#form-email')).toHaveClass(/error/);`},
]},

/* ── UTILITY ──────────────────────────────────────────────────── */
{cat:'Utility', cls:'utility', color:'#a855f7', items:[
{name:'goto()',
 level:'beginner',
 desc:'Navigates the browser to the specified URL. Waits for the page to load before resolving.',
 tip:'The first step in most tests. Set baseURL in playwright.config.ts so you only need to pass the path (e.g. /login).',
 docs:'https://playwright.dev/docs/api/class-page#page-goto',
 code:`await page.goto('https://example.com');

// Relative path when baseURL is set in config
await page.goto('/login');`},

{name:'reload()',
 level:'beginner',
 desc:'Reloads the current page, the same as pressing F5 in the browser.',
 tip:'Useful for testing that state persists across page reloads (e.g. localStorage, cookies).',
 docs:'https://playwright.dev/docs/api/class-page#page-reload',
 code:`await page.reload();

// Wait until all network activity settles after reload
await page.reload({ waitUntil: 'networkidle' });`},

{name:'goBack()',
 level:'beginner',
 desc:'Navigates to the previous page in browser history, the same as clicking the Back button.',
 tip:'Use to test multi-step flows where the user navigates back and the previous state should be preserved.',
 docs:'https://playwright.dev/docs/api/class-page#page-go-back',
 code:`await page.goBack();
await expect(page).toHaveURL('/products');`},

{name:'goForward()',
 level:'beginner',
 desc:'Navigates forward in browser history, the same as clicking the Forward button.',
 tip:'Use alongside goBack() to test browser history navigation behaviour.',
 docs:'https://playwright.dev/docs/api/class-page#page-go-forward',
 code:`await page.goForward();
await expect(page).toHaveURL('/checkout');`},

{name:'screenshot()',
 level:'beginner',
 desc:'Captures a screenshot of the full page or a specific element and saves it to a file.',
 tip:'Great for debugging failing tests. Use { fullPage: true } to capture the entire scrollable page. For visual regression use toMatchSnapshot().',
 docs:'https://playwright.dev/docs/api/class-page#page-screenshot',
 code:`// Full scrollable page
await page.screenshot({ path: 'page.png', fullPage: true });

// Specific element only
await page.locator('.chart').screenshot({ path: 'chart.png' });`},

{name:'pause()',
 level:'beginner',
 desc:'Pauses test execution and opens the Playwright Inspector for step-by-step debugging.',
 tip:'Only use during development. Remove before committing. Run tests with PWDEBUG=1 to start the Inspector automatically.',
 docs:'https://playwright.dev/docs/api/class-page#page-pause',
 code:`// Opens the Playwright Inspector UI
await page.pause();

// Resume by clicking "Resume" in the Inspector`},

{name:'waitForSelector()',
 level:'intermediate',
 desc:'Waits for an element matching a CSS selector to appear in the DOM or reach a specific state.',
 tip:"In most cases Playwright's auto-waiting means you do not need this. Prefer waitForLoadState() or just interact with the element directly.",
 docs:'https://playwright.dev/docs/api/class-page#page-wait-for-selector',
 code:`await page.waitForSelector('#results-table');

// Wait for element to disappear
await page.waitForSelector('#spinner', { state: 'hidden' });`},

{name:'waitForTimeout()',
 level:'beginner',
 desc:'Pauses test execution for a fixed number of milliseconds.',
 tip:'Avoid in production tests. It makes them slow and brittle. Prefer waitForLoadState(), waitForURL(), or waitForSelector() instead.',
 docs:'https://playwright.dev/docs/api/class-page#page-wait-for-timeout',
 code:`// Use sparingly, prefer event-based waits
await page.waitForTimeout(2000);`},

{name:'waitForLoadState()',
 level:'intermediate',
 desc:"Waits for the page to reach a specific load state: 'load', 'domcontentloaded', or 'networkidle'.",
 tip:"'networkidle' waits until there are no active network requests useful after actions that trigger background API calls.",
 docs:'https://playwright.dev/docs/api/class-page#page-wait-for-load-state',
 code:`// Wait for all network activity to stop
await page.waitForLoadState('networkidle');

// Wait for the DOM to be fully parsed
await page.waitForLoadState('domcontentloaded');`},

{name:'waitForURL()',
 level:'intermediate',
 desc:'Waits for the page URL to match a string or regex pattern. Resolves once the URL matches.',
 tip:'Preferred over the deprecated waitForNavigation(). Use after clicking a link or submit button to wait for the redirect.',
 docs:'https://playwright.dev/docs/api/class-page#page-wait-for-url',
 code:`await page.getByRole('button', { name: 'Login' }).click();
await page.waitForURL('**/dashboard');`},

{name:'evaluate()',
 level:'advanced',
 desc:"Executes a JavaScript function in the browser's context and returns the result to the test.",
 tip:'Use when you need browser-only APIs (localStorage, computed styles, DOM properties). The function runs in the page, not in Node.js.',
 docs:'https://playwright.dev/docs/api/class-page#page-evaluate',
 code:`// Read from localStorage
const token = await page.evaluate(() => localStorage.getItem('authToken'));

// Hide an element via JS
await page.evaluate(() => {
  document.querySelector('#cookie-banner').style.display = 'none';
});`},

{name:'on(console)',
 level:'intermediate',
 desc:"Listens for console messages emitted by the browser page. Useful for debugging and verifying logs in tests.",
 tip:"Set this up before the action that triggers the log. Use page.on('pageerror') to catch uncaught JS errors.",
 docs:'https://playwright.dev/docs/api/class-page#page-event-console',
 code:`page.on('console', msg => {
  console.log(\`[\${msg.type()}] \${msg.text()}\`);
});

// Catch uncaught JS errors
page.on('pageerror', err => console.error('Page error:', err));`},

{name:'addInitScript()',
 level:'advanced',
 desc:'Injects a script into every new page and frame before any page scripts run. Use to mock globals or set test flags.',
 tip:"Perfect for mocking Date.now(), disabling animations, or setting window flags your app reads on startup.",
 docs:'https://playwright.dev/docs/api/class-page#page-add-init-script',
 code:`// Disable CSS transitions for faster, stable tests
await page.addInitScript(() => {
  window.__PLAYWRIGHT__ = true;
  document.documentElement.style.setProperty(
    '--transition-duration', '0ms'
  );
});`},
]},

/* ── API ──────────────────────────────────────────────────────── */
{cat:'API', cls:'api', color:'#ef4444', items:[
{name:'request.get()',
 level:'beginner',
 desc:'Sends an HTTP GET request from within the test. Returns a response object you can assert against.',
 tip:'Use to verify API behaviour directly, or to fetch data before asserting on it without going through the UI.',
 docs:'https://playwright.dev/docs/api/class-apirequestcontext#api-request-context-get',
 code:`const res = await request.get('/api/users');
expect(res.status()).toBe(200);

const body = await res.json();
expect(body).toHaveLength(10);`},

{name:'request.post()',
 level:'beginner',
 desc:'Sends an HTTP POST request with a JSON body. Use for creating resources or logging in via API.',
 tip:'Faster than UI login flows. Log in via API and inject the session token. Saves many seconds per test.',
 docs:'https://playwright.dev/docs/api/class-apirequestcontext#api-request-context-post',
 code:`const res = await request.post('/api/login', {
  data: {
    email: 'test@mail.com',
    password: 'secret'
  }
});
expect(res.status()).toBe(200);`},

{name:'request.put()',
 level:'intermediate',
 desc:'Sends an HTTP PUT request to fully replace a resource.',
 tip:'Use to set up test state via API rather than navigating through the UI. Much faster for test setup.',
 docs:'https://playwright.dev/docs/api/class-apirequestcontext#api-request-context-put',
 code:`const res = await request.put('/api/users/1', {
  data: { name: 'Updated Name', role: 'admin' }
});
expect(res.status()).toBe(200);`},

{name:'request.patch()',
 level:'intermediate',
 desc:'Sends an HTTP PATCH request to partially update a resource.',
 tip:'Use PATCH when you only want to update specific fields, not replace the whole resource.',
 docs:'https://playwright.dev/docs/api/class-apirequestcontext#api-request-context-patch',
 code:`const res = await request.patch('/api/users/1', {
  data: { status: 'active' }
});
expect(res.status()).toBe(200);`},

{name:'request.delete()',
 level:'intermediate',
 desc:'Sends an HTTP DELETE request to remove a resource.',
 tip:'Use in afterEach() to clean up test data that was created during a test run.',
 docs:'https://playwright.dev/docs/api/class-apirequestcontext#api-request-context-delete',
 code:`const res = await request.delete('/api/users/1');
expect(res.status()).toBe(204);`},

{name:'route()',
 level:'intermediate',
 desc:'Intercepts network requests matching a URL pattern and lets you fulfill, abort, or modify them.',
 tip:'Essential for mocking API responses in UI tests. Makes tests faster and independent of backend state.',
 docs:'https://playwright.dev/docs/api/class-page#page-route',
 code:`await page.route('**/api/users', route => {
  route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify([{ id: 1, name: 'Mock User' }])
  });
});`},

{name:'route.abort()',
 level:'advanced',
 desc:"Aborts a matched network request, simulating a network failure or blocking unwanted requests.",
 tip:'Use to block analytics, ads, or third-party scripts that slow down or interfere with your tests.',
 docs:'https://playwright.dev/docs/api/class-route#route-abort',
 code:`// Block all analytics requests
await page.route('**/analytics/**', route => route.abort());

// Simulate a network error for a specific endpoint
await page.route('**/api/data', route => route.abort('failed'));`},

{name:'route.continue()',
 level:'advanced',
 desc:'Allows a matched request to proceed as normal, optionally with modified headers or body.',
 tip:'Use when you want to intercept a request to inspect or modify it, then let it pass through to the real server.',
 docs:'https://playwright.dev/docs/api/class-route#route-continue',
 code:`// Add a custom header to all API requests
await page.route('**/api/**', route => {
  route.continue({
    headers: { ...route.request().headers(), 'x-test-id': 'playwright' }
  });
});`},

{name:'waitForResponse()',
 level:'intermediate',
 desc:'Waits for a network response matching a URL pattern or predicate. Returns the response object.',
 tip:'Use to wait for an API call to complete before asserting on the UI. Prevents flaky tests caused by asserting before data loads.',
 docs:'https://playwright.dev/docs/api/class-page#page-wait-for-response',
 code:`const [res] = await Promise.all([
  page.waitForResponse('**/api/users'),
  page.getByRole('button', { name: 'Load Users' }).click()
]);
expect(res.status()).toBe(200);`},

{name:'waitForRequest()',
 level:'intermediate',
 desc:'Waits for the page to send a network request matching a URL pattern. Returns the request object.',
 tip:'Use to verify that an action triggered the expected API call and check the URL, method, and payload.',
 docs:'https://playwright.dev/docs/api/class-page#page-wait-for-request',
 code:`const [req] = await Promise.all([
  page.waitForRequest('**/api/login'),
  page.getByRole('button', { name: 'Login' }).click()
]);
expect(req.method()).toBe('POST');
expect(req.postDataJSON()).toMatchObject({ email: 'test@mail.com' });`},
]},

/* ── PATTERNS ─────────────────────────────────────────────────── */
{cat:'Patterns', cls:'pattern', color:'#ec4899', items:[
{name:'Login flow',
 level:'beginner',
 desc:'A complete end-to-end login test: navigate, fill credentials, submit, and assert you landed on the right page.',
 tip:'For repeated logins across many tests, extract this into a storageState fixture or a page object to avoid duplication.',
 docs:'https://playwright.dev/docs/auth',
 code:`test('user can log in', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Email').fill('user@test.com');
  await page.getByLabel('Password').fill('secret123');
  await page.getByRole('button', { name: 'Log in' }).click();

  await expect(page).toHaveURL('/dashboard');
  await expect(page.getByRole('heading', { name: 'Welcome' })).toBeVisible();
});`},

{name:'Form submit',
 level:'beginner',
 desc:'Fill in a form, submit it, and assert the success state the most common pattern in web testing.',
 tip:'Assert on visible UI feedback (success message, new item in list) rather than just the URL to make the test more meaningful.',
 docs:'https://playwright.dev/docs/input',
 code:`test('creates a new contact', async ({ page }) => {
  await page.goto('/contacts/new');

  await page.getByLabel('Name').fill('Jane Smith');
  await page.getByLabel('Email').fill('jane@test.com');
  await page.getByRole('button', { name: 'Save' }).click();

  await expect(page.getByText('Contact saved')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Jane Smith' })).toBeVisible();
});`},

{name:'Wait for API',
 level:'intermediate',
 desc:'Trigger an action, wait for the API response, then assert the UI updated. Prevents flaky tests from asserting before data loads.',
 tip:'Wrap the click and waitForResponse in Promise.all so they start at the same time, otherwise you might miss the response event.',
 docs:'https://playwright.dev/docs/network#waiting-for-response',
 code:`test('loads user list', async ({ page }) => {
  await page.goto('/users');

  const [response] = await Promise.all([
    page.waitForResponse('**/api/users'),
    page.getByRole('button', { name: 'Load Users' }).click()
  ]);
  expect(response.status()).toBe(200);

  await expect(page.locator('tbody tr')).toHaveCount(5);
});`},

{name:'Mock API',
 level:'intermediate',
 desc:'Intercept and mock an API response before navigating. Makes tests fast and independent of real backend data.',
 tip:'Set up route() before page.goto() so the mock is in place when the page first loads and makes its requests.',
 docs:'https://playwright.dev/docs/mock',
 code:`test('shows users from mocked API', async ({ page }) => {
  await page.route('**/api/users', route => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        { id: 1, name: 'Alice' },
        { id: 2, name: 'Bob' }
      ])
    });
  });

  await page.goto('/users');
  await expect(page.getByText('Alice')).toBeVisible();
  await expect(page.getByText('Bob')).toBeVisible();
});`},

{name:'File upload',
 level:'intermediate',
 desc:'Upload a file using a file input without triggering the OS file picker dialog.',
 tip:'Store test fixtures in a tests/fixtures/ folder. For drag-and-drop uploads, use dispatchEvent with a DataTransfer object.',
 docs:'https://playwright.dev/docs/input#upload-files',
 code:`test('uploads a document', async ({ page }) => {
  await page.goto('/upload');

  await page.locator('input[type=file]').setInputFiles(
    'tests/fixtures/sample.pdf'
  );
  await page.getByRole('button', { name: 'Upload' }).click();

  await expect(page.getByText('Upload complete')).toBeVisible();
});`},

{name:'API login setup',
 level:'intermediate',
 desc:'Log in via the API to get auth state, then inject it into the browser, much faster than UI login for every test.',
 tip:'Save the storage state to a file and reuse it with storageState in playwright.config.ts for maximum speed across all tests.',
 docs:'https://playwright.dev/docs/auth',
 code:`test.beforeEach(async ({ page, request }) => {
  // Log in via API, no UI needed
  const res = await request.post('/api/login', {
    data: { email: 'test@mail.com', password: 'secret' }
  });
  const { token } = await res.json();

  // Inject the token before the page loads
  await page.addInitScript(t => {
    localStorage.setItem('authToken', t);
  }, token);

  await page.goto('/dashboard');
});`},
]},

/* ── CLI ──────────────────────────────────────────────────────── */
{cat:'CLI', cls:'cli', color:'#f59e0b', items:[
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
]},

]; // end categories
