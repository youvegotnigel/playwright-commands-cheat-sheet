/** @type {import('./index.js').Category} */
export default {cat:'Assertions', cls:'assertion', color:'#fb923c', items:[
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

{name:'toBeAttached()',
 level:'intermediate',
 desc:'Asserts that an element is present in the DOM, regardless of whether it is visible. An element can be attached but hidden.',
 tip:'Use when you need to verify an element exists in the DOM without caring about visibility. Use .not.toBeAttached() to assert an element was removed entirely.',
 docs:'https://playwright.dev/docs/api/class-locatorassertions#locator-assertions-to-be-attached',
 code:`// Element exists in the DOM even though it may not be visible
await expect(page.locator('#tooltip')).toBeAttached();

// Assert modal is fully removed from the DOM after closing
await page.getByRole('button', { name: 'Close' }).click();
await expect(page.locator('#modal')).not.toBeAttached();`},

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
await expect(page).toHaveURL(/\\/users\\/\\d+/);`},

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

{name:'toBeFocused()',
 level:'intermediate',
 desc:'Asserts that an element currently has keyboard focus (it is the active element in the document).',
 tip:'Use after clicking an input or triggering a focus event to verify focus landed correctly. Also useful for testing focus management in modals and dialogs.',
 docs:'https://playwright.dev/docs/api/class-locatorassertions#locator-assertions-to-be-focused',
 code:`await page.getByLabel('Email').click();
await expect(page.getByLabel('Email')).toBeFocused();

// Verify focus moves to first field when a dialog opens
await page.getByRole('button', { name: 'Open Dialog' }).click();
await expect(page.getByRole('textbox').first()).toBeFocused();`},

{name:'toHaveValue()',
 level:'intermediate',
 desc:'Asserts that an input, textarea, or select element has the expected value.',
 tip:'Use after fill() to verify the value was set correctly, or to check the current state of a select dropdown.',
 docs:'https://playwright.dev/docs/api/class-locatorassertions#locator-assertions-to-have-value',
 code:`await expect(page.locator('#email')).toHaveValue('test@mail.com');
await expect(page.locator('select#country')).toHaveValue('ca');`},

{name:'toHaveValues()',
 level:'intermediate',
 desc:'Asserts that a multi-select element has exactly the expected set of selected option values.',
 tip:'Only for <select multiple> elements. For a single-select use toHaveValue(). Matches the value attributes of the options, not their display text.',
 docs:'https://playwright.dev/docs/api/class-locatorassertions#locator-assertions-to-have-values',
 code:`await page.locator('select#skills').selectOption(['javascript', 'typescript']);
await expect(page.locator('select#skills')).toHaveValues(['javascript', 'typescript']);

// Assert partial selection changed
await page.locator('select#skills').selectOption(['javascript']);
await expect(page.locator('select#skills')).toHaveValues(['javascript']);`},

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

{name:'toContainClass()',
 level:'intermediate',
 desc:'Asserts that an element contains the specified CSS class name. Unlike toHaveClass(), it does not require an exact match of all classes.',
 tip:'Prefer toContainClass() over toHaveClass() when an element has many classes and you only care about one of them. Added in Playwright v1.52.',
 docs:'https://playwright.dev/docs/api/class-locatorassertions#locator-assertions-to-contain-class',
 code:`// Element has class="btn btn-primary active" this passes
await expect(page.locator('#submit')).toContainClass('active');

// Assert multiple classes are all present
await expect(page.locator('#submit')).toContainClass('btn btn-primary');`},

{name:'toHaveCSS()',
 level:'intermediate',
 desc:'Asserts that an element has a specific computed CSS property value. Checks the rendered style, not just the attribute.',
 tip:'Reads computed styles, so it reflects cascaded values including those applied by external stylesheets and animations.',
 docs:'https://playwright.dev/docs/api/class-locatorassertions#locator-assertions-to-have-css',
 code:`await expect(page.locator('.alert')).toHaveCSS('background-color', 'rgb(255, 0, 0)');
await expect(page.locator('.modal')).toHaveCSS('display', 'flex');

// Use regex for flexible matching
await expect(page.locator('.card')).toHaveCSS('border-radius', /px$/);`},

{name:'toBeEditable()',
 level:'intermediate',
 desc:'Asserts that an input or textarea is editable, not disabled and not readonly.',
 tip:'Use to verify that a field is available for user input after some state change, like loading completing or a toggle being switched on.',
 docs:'https://playwright.dev/docs/api/class-locatorassertions#locator-assertions-to-be-editable',
 code:`await expect(page.getByLabel('Email')).toBeEditable();

// Assert it is NOT editable (readonly)
await expect(page.getByLabel('Username')).not.toBeEditable();`},

{name:'toBeEmpty()',
 level:'beginner',
 desc:'Asserts that an input or textarea has no value, or that an element has no text content or children.',
 tip:'Use after clear() to verify the field was emptied. Also works on container elements to assert they have no children.',
 docs:'https://playwright.dev/docs/api/class-locatorassertions#locator-assertions-to-be-empty',
 code:`await page.getByLabel('Search').clear();
await expect(page.getByLabel('Search')).toBeEmpty();

// Assert an error container has no messages
await expect(page.locator('#error-list')).toBeEmpty();`},

{name:'toBeInViewport()',
 level:'intermediate',
 desc:'Asserts that an element is within the visible viewport area of the browser window.',
 tip:'Use to verify that sticky headers, floating buttons, or scroll-to-top elements are visible at the right scroll position.',
 docs:'https://playwright.dev/docs/api/class-locatorassertions#locator-assertions-to-be-in-viewport',
 code:`// Assert the element is at least partially visible in the viewport
await expect(page.locator('#sticky-header')).toBeInViewport();

// Assert at least 50% of the element is visible
await expect(page.locator('.banner')).toBeInViewport({ ratio: 0.5 });`},

{name:'toHaveScreenshot()',
 level:'advanced',
 desc:'Captures a screenshot of an element or page and compares it pixel-by-pixel against a stored baseline image. Fails if they differ.',
 tip:'Run with --update-snapshots to generate the baseline on first run. Commit the snapshots. Use threshold option to allow minor rendering differences.',
 docs:'https://playwright.dev/docs/api/class-pageassertions#page-assertions-to-have-screenshot-1',
 code:`// Full page visual regression
await expect(page).toHaveScreenshot('dashboard.png');

// Single element comparison
await expect(page.locator('.chart')).toHaveScreenshot('chart.png', {
  maxDiffPixelRatio: 0.01  // allow up to 1% pixel difference
});`},

{name:'toBeOK()',
 level:'intermediate',
 desc:'Asserts that an API response has a status code in the 2xx range (200–299). Use with APIRequestContext.',
 tip:'The quickest sanity-check for API tests. Combine with response.json() to also validate the response body shape.',
 docs:'https://playwright.dev/docs/api/class-apiresponseassertions#api-response-assertions-to-be-ok',
 code:`const response = await request.get('/api/users');
await expect(response).toBeOK();

// Also validate the body
const data = await response.json();
expect(data.users).toHaveLength(10);`},

{name:'toBe()',
 level:'beginner',
 desc:'Generic assertion that checks a value is strictly equal to the expected value using Object.is() comparison.',
 tip:'Use for primitive values (string, number, boolean). For objects/arrays use toEqual() for deep equality. Works with expect.poll() for async values.',
 docs:'https://playwright.dev/docs/api/class-genericassertions#generic-assertions-to-be',
 code:`const count = await page.locator('.item').count();
expect(count).toBe(5);

const isLoggedIn = await page.evaluate(() => !!localStorage.getItem('token'));
expect(isLoggedIn).toBe(true);`},

{name:'toContain()',
 level:'beginner',
 desc:'Generic assertion that checks a string contains a substring, or an array contains an item. Not to be confused with toContainText() which targets DOM elements.',
 tip:'Use on JavaScript values, not locators. For DOM text matching use toContainText(). For matching objects inside arrays, use expect.arrayContaining().',
 docs:'https://playwright.dev/docs/api/class-genericassertions#generic-assertions-to-contain',
 code:`// String contains substring
const url = page.url();
expect(url).toContain('/dashboard');

// Array contains item
const tags = await page.evaluate(() => window.__tags__);
expect(tags).toContain('featured');`},

{name:'toBeTruthy()',
 level:'beginner',
 desc:'Generic assertion that checks a value is truthy: anything that is not false, 0, "", null, undefined, or NaN.',
 tip:'Use when you care that a value exists but not its exact content. For a stricter check use toBe(true). Pairs well with page.evaluate() results.',
 docs:'https://playwright.dev/docs/api/class-genericassertions#generic-assertions-to-be-truthy',
 code:`const token = await page.evaluate(() => localStorage.getItem('session'));
expect(token).toBeTruthy();

// Verify an object was returned from the page
const user = await page.evaluate(() => window.currentUser);
expect(user).toBeTruthy();`},

{name:'toHaveLength()',
 level:'beginner',
 desc:'Generic assertion that checks a string or array has the expected length.',
 tip:'Use on JavaScript values. For counting DOM elements use toHaveCount() instead, which has built-in auto-retry logic that toHaveLength() lacks.',
 docs:'https://playwright.dev/docs/api/class-genericassertions#generic-assertions-to-have-length',
 code:`// Check array length
const items = await page.evaluate(() => window.cart.items);
expect(items).toHaveLength(3);

// Check string length (e.g. a generated OTP code)
const code = await page.locator('#otp-code').inputValue();
expect(code).toHaveLength(6);`},

{name:'toMatchObject()',
 level:'intermediate',
 desc:'Generic assertion that checks an object contains the expected subset of properties. Extra properties in the received object are ignored.',
 tip:'Use for partial object matching when you only care about some fields of an API response or page state. Use toEqual() when you need a complete exact match.',
 docs:'https://playwright.dev/docs/api/class-genericassertions#generic-assertions-to-match-object',
 code:`const profile = await page.evaluate(() => window.userProfile);
expect(profile).toMatchObject({ name: 'Jane', role: 'admin' });

// Works with arrays of objects too
const items = await response.json();
expect(items).toMatchObject([{ id: 1, active: true }, { id: 2 }]);`},

{name:'toBeGreaterThan()',
 level:'beginner',
 desc:'Generic assertion that checks a number is greater than the expected value. Related: toBeGreaterThanOrEqual(), toBeLessThan(), toBeLessThanOrEqual().',
 tip:'Useful for asserting counts, prices, timestamps, or any numeric value with a minimum requirement. Pair with page.evaluate() to extract numbers from the page.',
 docs:'https://playwright.dev/docs/api/class-genericassertions#generic-assertions-to-be-greater-than',
 code:`const resultCount = await page.locator('.result').count();
expect(resultCount).toBeGreaterThan(0);

// Assert page load time is within budget
const start = Date.now();
await page.goto('/dashboard');
expect(Date.now() - start).toBeLessThan(3000);`},

{name:'expect.soft()',
 level:'intermediate',
 desc:'A soft assertion that records a failure but does not stop the test. All soft assertion failures are reported together at the end.',
 tip:'Use when you want to check multiple things in one test and see all failures at once, not just the first one.',
 docs:'https://playwright.dev/docs/test-assertions#soft-assertions',
 code:`test('checks all dashboard widgets', async ({ page }) => {
  await page.goto('/dashboard');

  await expect.soft(page.getByTestId('revenue-widget')).toBeVisible();
  await expect.soft(page.getByTestId('users-widget')).toBeVisible();
  await expect.soft(page.getByTestId('orders-widget')).toBeVisible();

  // Test continues even if some assertions above fail
  // All failures are reported together at the end
});`},

{name:'expect.poll()',
 level:'advanced',
 desc:'Polls a function repeatedly until its return value satisfies the assertion. Useful for asserting on values that change asynchronously.',
 tip:'Use when asserting on a value outside of Playwright locators (e.g. a database call, an API response polled manually).',
 docs:'https://playwright.dev/docs/test-assertions#expectpoll',
 code:`// Poll until the database shows the record was created
await expect.poll(async () => {
  const res = await request.get('/api/jobs/123');
  return (await res.json()).status;
}, { timeout: 10000 }).toBe('completed');`},

{name:'expect().toPass()',
 level:'advanced',
 desc:'Retries an async callback containing assertions until all assertions inside pass or the timeout expires.',
 tip:'Use when you need to retry a block with multiple assertions together (e.g. check both a status code and response body). For single-value polling, expect.poll() is simpler.',
 docs:'https://playwright.dev/docs/test-assertions#expecttopass',
 code:`await expect(async () => {
  const res = await page.request.get('/api/status');
  expect(res.status()).toBe(200);
  const body = await res.json();
  expect(body.ready).toBe(true);
}).toPass({ timeout: 10000 });

// With custom retry intervals (ms between retries)
await expect(async () => {
  const res = await page.request.get('/api/status');
  expect(res.status()).toBe(200);
  const body = await res.json();
  expect(body.ready).toBe(true);
}).toPass({ timeout: 10000, intervals: [1000, 2000, 5000] });`},
]};
