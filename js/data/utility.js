/** @type {import('./index.js').Category} */
export default {cat:'Utility', cls:'utility', color:'#a855f7', items:[
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

// Wait until the DOM is parsed after reload
await page.reload({ waitUntil: 'domcontentloaded' });

// 'networkidle' still works but is DISCOURAGED, prefer a
// web assertion (toBeVisible) to confirm the page is ready`},

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
 tip:"'networkidle' is now DISCOURAGED by Playwright, it is flaky on apps with long-polling or analytics. Prefer auto-waiting actions and web assertions (e.g. expect(locator).toBeVisible()) to confirm readiness instead.",
 docs:'https://playwright.dev/docs/api/class-page#page-wait-for-load-state',
 code:`// Wait for the DOM to be fully parsed (recommended)
await page.waitForLoadState('domcontentloaded');

// Wait for the load event (default state)
await page.waitForLoadState('load');

// DISCOURAGED, avoid networkidle, assert on the UI instead:
// await page.waitForLoadState('networkidle');
await expect(page.getByRole('table')).toBeVisible();`},

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
 tip:"Set this up before the action that triggers the log. msg.type() returns 'log', 'warn', 'error', or 'debug' so you can filter by level.",
 docs:'https://playwright.dev/docs/api/class-page#page-event-console',
 code:`page.on('console', msg => {
  console.log(\`[\${msg.type()}] \${msg.text()}\`);
});

// Collect all console errors during a test
const errors = [];
page.on('console', msg => {
  if (msg.type() === 'error') errors.push(msg.text());
});
await page.goto('/dashboard');
expect(errors).toHaveLength(0);`},

{name:'on(pageerror)',
 level:'intermediate',
 desc:"Listens for uncaught JavaScript exceptions thrown in the browser page. Fires whenever the page has an unhandled error.",
 tip:"Different from on('console'): this only fires for uncaught exceptions, not console.error() calls. Use both together for full error coverage.",
 docs:'https://playwright.dev/docs/api/class-page#page-event-page-error',
 code:`// Fail the test if any uncaught JS error occurs
const errors = [];
page.on('pageerror', err => errors.push(err.message));

await page.goto('/dashboard');
await page.getByRole('button', { name: 'Load Data' }).click();

expect(errors, 'No uncaught JS errors expected').toHaveLength(0);`},

{name:'on(dialog)',
 level:'intermediate',
 desc:"Listens for browser dialog events (alert, confirm, prompt, beforeunload) so your test can handle them instead of them blocking execution.",
 tip:'Always set up the listener BEFORE the action that triggers the dialog. Without a handler, dialogs will block the test indefinitely.',
 docs:'https://playwright.dev/docs/dialogs',
 code:`// Auto-accept any dialog that appears
page.on('dialog', dialog => dialog.accept());

// Inspect before deciding
page.on('dialog', async dialog => {
  console.log(dialog.type());    // 'alert' | 'confirm' | 'prompt'
  console.log(dialog.message()); // text shown in the dialog
  await dialog.accept();
});`},

{name:'dialog.accept()',
 level:'intermediate',
 desc:'Accepts a dialog, equivalent to clicking OK. For prompt dialogs, pass a string to fill in the input value.',
 tip:"Call this inside a page.on('dialog') handler. For a prompt, pass the text you want to submit: dialog.accept('my answer').",
 docs:'https://playwright.dev/docs/api/class-dialog#dialog-accept',
 code:`page.on('dialog', async dialog => {
  await dialog.accept();
});

// For a prompt dialog, pass the input value
page.on('dialog', async dialog => {
  await dialog.accept('John Smith');
});`},

{name:'dialog.dismiss()',
 level:'intermediate',
 desc:'Dismisses a dialog, equivalent to clicking Cancel. For alert dialogs, dismiss and accept behave the same way.',
 tip:"Use dismiss() for confirm dialogs when you want to test the 'Cancel' path e.g. confirming that a delete action is cancelled.",
 docs:'https://playwright.dev/docs/api/class-dialog#dialog-dismiss',
 code:`page.on('dialog', async dialog => {
  await dialog.dismiss();
});

// Test that cancelling a confirm prevents deletion
page.on('dialog', async dialog => {
  if (dialog.type() === 'confirm') await dialog.dismiss();
});`},

{name:'dialog.message()',
 level:'intermediate',
 desc:'Returns the message text displayed in the dialog. Use to assert that the correct message is shown before accepting or dismissing.',
 tip:'Great for testing that warning and confirmation messages contain the right content e.g. the item name in a delete confirmation.',
 docs:'https://playwright.dev/docs/api/class-dialog#dialog-message',
 code:`page.on('dialog', async dialog => {
  const msg = dialog.message();
  expect(msg).toContain('Are you sure you want to delete');
  await dialog.accept();
});`},

{name:"on('close')",
 level:'intermediate',
 desc:'Fires when the page is closed. Use to clean up resources or log when a page shuts down during a test.',
 tip:'Useful in multi-page or multi-tab tests. Set up before opening the page so cleanup logic always runs, even on unexpected close.',
 docs:'https://playwright.dev/docs/api/class-page#page-event-close',
 code:`page.on('close', () => {
  console.log('Page was closed');
});

// Track open pages in a multi-tab test
const openPages = new Set([page]);
page.on('close', () => openPages.delete(page));`},

{name:"on('crash')",
 level:'advanced',
 desc:"Fires when the browser page crashes. A crash is distinct from a JS error: the browser process itself has failed.",
 tip:"Crashes are rare but can happen with WebGL, heavy memory use, or native plugins. Use to log diagnostic info and fail the test explicitly rather than hanging.",
 docs:'https://playwright.dev/docs/api/class-page#page-event-crash',
 code:`// Fail the test explicitly if the page crashes
test('renders heavy canvas', async ({ page }) => {
  let crashed = false;
  page.on('crash', () => { crashed = true; });

  await page.goto('/canvas-app');

  expect(crashed, 'Page should not crash').toBe(false);
});`},

{name:"on('domcontentloaded')",
 level:'intermediate',
 desc:"Fires when the page's DOMContentLoaded event fires: the HTML is parsed and the DOM is ready, but images and stylesheets may still be loading.",
 tip:"Playwright's goto() waits for 'load' by default, so you rarely need this. Use it to measure DOM-ready time or run code at the earliest interactive point.",
 docs:'https://playwright.dev/docs/api/class-page#page-event-dom-content-loaded',
 code:`// Measure time to DOM ready
const start = Date.now();
page.on('domcontentloaded', () => {
  console.log(\`DOM ready in \${Date.now() - start}ms\`);
});

await page.goto('/dashboard');`},

{name:"on('download')",
 level:'intermediate',
 desc:"Fires when a file download starts. Provides a Download object with methods to save the file, get the suggested filename, or read its path.",
 tip:"Use page.waitForEvent('download') for a single, predictable download. Use on('download') when multiple downloads may occur or the timing is uncertain.",
 docs:'https://playwright.dev/docs/api/class-page#page-event-download',
 code:`// Handle any download that starts during the test
page.on('download', async download => {
  console.log('Downloading:', download.suggestedFilename());
  await download.saveAs(\`./downloads/\${download.suggestedFilename()}\`);
});

await page.getByRole('button', { name: 'Export CSV' }).click();`},

{name:"on('filechooser')",
 level:'intermediate',
 desc:"Fires when the page opens a file chooser dialog (e.g. when a file input is clicked). Lets you set files programmatically without the OS picker appearing.",
 tip:"Use page.waitForEvent('filechooser') for a single, predictable upload. Use on('filechooser') when multiple file choosers may appear or timing is uncertain.",
 docs:'https://playwright.dev/docs/api/class-page#page-event-file-chooser',
 code:`// Intercept the file chooser and provide files directly
page.on('filechooser', async fileChooser => {
  await fileChooser.setFiles('tests/fixtures/sample.pdf');
});

await page.getByRole('button', { name: 'Upload' }).click();
await expect(page.getByText('sample.pdf')).toBeVisible();`},

{name:"on('frameattached')",
 level:'advanced',
 desc:"Fires when a new frame (iframe) is attached to the page. Provides the Frame object for the newly added frame.",
 tip:"Use to detect when iframes are dynamically injected, for example a payment widget or chat widget loaded lazily. Follow up with frameLocator() to interact with it.",
 docs:'https://playwright.dev/docs/api/class-page#page-event-frame-attached',
 code:`page.on('frameattached', frame => {
  console.log('Frame attached:', frame.url());
});

// Detect when a third-party payment iframe loads
page.on('frameattached', frame => {
  if (frame.url().includes('payment-provider.com')) {
    console.log('Payment iframe is ready');
  }
});`},

{name:"on('framedetached')",
 level:'advanced',
 desc:"Fires when a frame (iframe) is removed from the page DOM. Provides the Frame object that was detached.",
 tip:"Useful for verifying that a widget or modal iframe is correctly removed after a user action, such as closing a payment form or chat window.",
 docs:'https://playwright.dev/docs/api/class-page#page-event-frame-detached',
 code:`const detachedFrames = [];
page.on('framedetached', frame => {
  detachedFrames.push(frame.url());
});

// Close a modal that contains an iframe
await page.getByRole('button', { name: 'Close' }).click();

// Verify the iframe was removed
expect(detachedFrames.some(url => url.includes('widget'))).toBe(true);`},

{name:"on('framenavigated')",
 level:'advanced',
 desc:"Fires when any frame on the page navigates to a new URL, including the main frame and child iframes.",
 tip:"Filter by frame === page.mainFrame() to focus on top-level navigations only. Useful for building a navigation log or detecting unexpected redirects in multi-frame apps.",
 docs:'https://playwright.dev/docs/api/class-page#page-event-frame-navigated',
 code:`const navLog = [];
page.on('framenavigated', frame => {
  navLog.push({
    url: frame.url(),
    isMain: frame === page.mainFrame(),
  });
});

await page.goto('/dashboard');
await page.getByRole('link', { name: 'Settings' }).click();

// navLog now contains all frame navigation events`},

{name:"on('load')",
 level:'intermediate',
 desc:"Fires when the page's load event fires: the page and all its dependent resources (images, stylesheets, scripts) have finished loading.",
 tip:"Playwright's goto() already waits for 'load' by default, so you rarely need this listener. Use it to measure load time or trigger logic exactly at the load boundary.",
 docs:'https://playwright.dev/docs/api/class-page#page-event-load',
 code:`// Measure full page load time
const start = Date.now();
page.on('load', () => {
  console.log(\`Page fully loaded in \${Date.now() - start}ms\`);
});

await page.goto('/dashboard');`},

{name:"on('popup')",
 level:'intermediate',
 desc:"Fires when the page opens a new browser tab or window via window.open() or a target='_blank' link. Provides the new Page object.",
 tip:"Use page.waitForEvent('popup') for a single predictable popup. Use on('popup') to handle multiple popups or when the timing is uncertain.",
 docs:'https://playwright.dev/docs/api/class-page#page-event-popup',
 code:`// Handle any popup that opens during the test
page.on('popup', async popup => {
  await popup.waitForLoadState();
  console.log('Popup opened:', popup.url());
  await expect(popup).toHaveURL(/preview/);
});

await page.getByRole('link', { name: 'Open preview' }).click();`},

{name:"on('request')",
 level:'intermediate',
 desc:"Fires when the page issues any network request. The Request object exposes the URL, method, headers, and POST body.",
 tip:"Use to assert that specific API calls are made during a test. For intercepting and modifying requests, use page.route() instead. Combine with on('response') for full request/response logging.",
 docs:'https://playwright.dev/docs/api/class-page#page-event-request',
 code:`// Assert a specific API call was made
const apiCalls = [];
page.on('request', req => {
  if (req.url().includes('/api/')) apiCalls.push(req.url());
});

await page.getByRole('button', { name: 'Load Users' }).click();
expect(apiCalls.some(url => url.includes('/api/users'))).toBe(true);`},

{name:"on('requestfailed')",
 level:'intermediate',
 desc:"Fires when a network request fails due to a network error, timeout, or abort. The Request object's failure() method returns the error reason.",
 tip:"Use to detect broken resources automatically during a test (missing images, failed API calls, or DNS errors) without asserting on every individual request.",
 docs:'https://playwright.dev/docs/api/class-page#page-event-request-failed',
 code:`const failedRequests = [];
page.on('requestfailed', req => {
  failedRequests.push({
    url: req.url(),
    reason: req.failure()?.errorText,
  });
});

await page.goto('/dashboard');
expect(failedRequests, 'No requests should fail').toHaveLength(0);`},

{name:"on('requestfinished')",
 level:'advanced',
 desc:"Fires when a network request completes successfully, after the full response body has been downloaded. Provides the Request object.",
 tip:"Unlike on('response') which fires when response headers arrive, on('requestfinished') fires after the body is fully received. Use for accurate timing measurements.",
 docs:'https://playwright.dev/docs/api/class-page#page-event-request-finished',
 code:`// Measure how long a specific API call takes end-to-end
page.on('requestfinished', async req => {
  if (req.url().includes('/api/report')) {
    const timing = req.timing();
    console.log(\`Report API: \${timing.responseEnd - timing.startTime}ms\`);
  }
});

await page.getByRole('button', { name: 'Generate Report' }).click();`},

{name:"on('response')",
 level:'intermediate',
 desc:"Fires when the page receives a network response. The Response object exposes the status code, headers, and body.",
 tip:"Use to passively observe API responses without intercepting them. Unlike waitForResponse(), on('response') captures all responses; filter by URL to target a specific endpoint.",
 docs:'https://playwright.dev/docs/api/class-page#page-event-response',
 code:`// Capture and assert on a specific API response
const responses = [];
page.on('response', res => {
  if (res.url().includes('/api/users')) {
    responses.push(res.status());
  }
});

await page.getByRole('button', { name: 'Load Users' }).click();
expect(responses).toContain(200);`},

{name:"on('websocket')",
 level:'advanced',
 desc:"Fires when a WebSocket connection is opened by the page. The WebSocket object lets you listen for frames sent and received over the connection.",
 tip:"Use to inspect real-time WebSocket traffic in tests for chat apps, live dashboards, or collaborative tools. Attach ws.on('framesent') and ws.on('framereceived') to log individual messages.",
 docs:'https://playwright.dev/docs/api/class-page#page-event-web-socket',
 code:`page.on('websocket', ws => {
  console.log('WebSocket opened:', ws.url());

  ws.on('framesent',    frame => console.log('Sent:',     frame.payload));
  ws.on('framereceived',frame => console.log('Received:', frame.payload));
  ws.on('close',        ()    => console.log('WebSocket closed'));
});

await page.goto('/live-chat');`},

{name:"on('worker')",
 level:'advanced',
 desc:"Fires when a dedicated web worker is created by the page. The Worker object exposes the worker script URL and allows evaluating code in the worker's context.",
 tip:"Use to detect and inspect web workers spawned by your app. Call worker.evaluate() to run code inside the worker context and assert on its state.",
 docs:'https://playwright.dev/docs/api/class-page#page-event-worker',
 code:`page.on('worker', worker => {
  console.log('Worker created:', worker.url());
});

// Execute code inside the worker's context
page.on('worker', async worker => {
  const name = await worker.evaluate(() => self.name);
  console.log('Worker name:', name);
});

await page.goto('/app-with-workers');`},

{name:"context.on('page')",
 level:'intermediate',
 desc:"Fires when a new page (tab) opens anywhere in the browser context, including target='_blank' links. The context level counterpart to page.on('popup'). Provides the new Page object.",
 tip:"Listen here when a popup opens at the browser level rather than from one page, or to collect several tabs opened at once. If page.on('popup') never fires, switch to this.",
 docs:'https://playwright.dev/docs/api/class-browsercontext#browser-context-event-page',
 code:`// Catch every new tab opened in this context
const newTabs = [];
context.on('page', async newTab => {
  await newTab.waitForLoadState();
  newTabs.push(newTab);
  console.log('New tab:', newTab.url());
});

await page.getByRole('link', { name: 'Terms' }).click();`},

{name:'context.waitForEvent()',
 level:'intermediate',
 desc:"Waits for a browser context event to fire and returns its value. The context level version of page.waitForEvent(). Most common event: 'page' for a new tab.",
 tip:"Use 'page' when a target='_blank' link opens a new tab at the context level. Use page.waitForEvent('popup') when the window is opened by a specific page. Always start the wait before the action.",
 docs:'https://playwright.dev/docs/api/class-browsercontext#browser-context-wait-for-event',
 code:`// A target='_blank' link opens a new tab
const [newTab] = await Promise.all([
  context.waitForEvent('page'),
  page.getByRole('link', { name: 'Open docs' }).click(),
]);
await newTab.waitForLoadState('domcontentloaded');
await expect(newTab).toHaveURL(/docs/);`},

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

{name:'locator.innerText()',
 level:'beginner',
 desc:'Reads the visible inner text of an element into a JavaScript variable. Returns the rendered text, not raw HTML.',
 tip:'Use when you need the text value to use in logic or further assertions. For a direct assertion, prefer toHaveText() which auto-retries.',
 docs:'https://playwright.dev/docs/api/class-locator#locator-inner-text',
 code:`const heading = await page.locator('h1').innerText();
console.log(heading); // e.g. "Dashboard"

// Use the value in your own assertion
expect(heading).toContain('Dashboard');`},

{name:'locator.getAttribute()',
 level:'beginner',
 desc:'Reads the value of a specific HTML attribute from an element and returns it as a string.',
 tip:'For assertions, prefer toHaveAttribute() which auto-retries. Use getAttribute() when you need the value in your own logic.',
 docs:'https://playwright.dev/docs/api/class-locator#locator-get-attribute',
 code:`const href = await page.locator('a.home').getAttribute('href');
expect(href).toBe('/home');

const expanded = await page.locator('#menu').getAttribute('aria-expanded');
expect(expanded).toBe('true');`},

{name:'locator.count()',
 level:'beginner',
 desc:'Returns the number of elements matching the locator as a JavaScript number. Use for conditional logic.',
 tip:'For assertions, prefer toHaveCount() which auto-retries. Use count() when the number drives test logic rather than a pass/fail check.',
 docs:'https://playwright.dev/docs/api/class-locator#locator-count',
 code:`const rows = await page.locator('tbody tr').count();
console.log(\`Found \${rows} rows\`);

if (rows > 0) {
  await page.locator('tbody tr').first().click();
}`},

{name:'locator.isVisible()',
 level:'intermediate',
 desc:'Returns true or false immediately without retrying or throwing. Use for conditional branching, not assertions.',
 tip:'Do not use for assertions use toBeVisible() instead. isVisible() is for when you need to make a decision based on whether something exists.',
 docs:'https://playwright.dev/docs/api/class-locator#locator-is-visible',
 code:`// Dismiss a cookie banner only if it is present
if (await page.locator('#cookie-banner').isVisible()) {
  await page.getByRole('button', { name: 'Accept' }).click();
}

await page.goto('/dashboard');`},

{name:'locator.isEnabled()',
 level:'intermediate',
 desc:'Returns true or false immediately. Checks if the element is enabled (not disabled). Use for conditional logic, not assertions.',
 tip:'For assertions use toBeEnabled() which auto-retries. Use isEnabled() when you need to branch on the state of an element.',
 docs:'https://playwright.dev/docs/api/class-locator#locator-is-enabled',
 code:`const submitBtn = page.getByRole('button', { name: 'Submit' });

if (await submitBtn.isEnabled()) {
  await submitBtn.click();
} else {
  console.log('Button is disabled, skipping');
}`},

{name:'locator.isChecked()',
 level:'intermediate',
 desc:'Returns true or false immediately. Checks if a checkbox or radio button is in the checked state. Use for conditional logic, not assertions.',
 tip:'For assertions use toBeChecked() which auto-retries. Use isChecked() when the result drives test branching logic.',
 docs:'https://playwright.dev/docs/api/class-locator#locator-is-checked',
 code:`const termsCheckbox = page.locator('#terms');

if (!await termsCheckbox.isChecked()) {
  await termsCheckbox.check();
}`},

{name:'locator.isEditable()',
 level:'intermediate',
 desc:'Returns true or false immediately. Checks if an input is editable (not disabled and not readonly). Use for conditional logic, not assertions.',
 tip:'For assertions use toBeEditable() which auto-retries. Use isEditable() when you need to decide whether to fill a field.',
 docs:'https://playwright.dev/docs/api/class-locator#locator-is-editable',
 code:`const field = page.getByLabel('Notes');

if (await field.isEditable()) {
  await field.fill('Test note');
}`},

{name:'locator.inputValue()',
 level:'intermediate',
 desc:'Reads the current value of an input, textarea, or select element and returns it as a string.',
 tip:'For assertions use toHaveValue() which auto-retries. Use inputValue() when you need the actual value in test logic, e.g. to reuse it in a later step.',
 docs:'https://playwright.dev/docs/api/class-locator#locator-input-value',
 code:`const searchTerm = await page.getByLabel('Search').inputValue();
console.log(searchTerm); // e.g. "Playwright"

// Reuse the value in a later assertion
expect(searchTerm).toContain('Play');`},

{name:'locator.textContent()',
 level:'intermediate',
 desc:'Returns the raw text content of an element including hidden text. Unlike innerText(), this is not affected by CSS visibility.',
 tip:'Use innerText() for user-visible text. Use textContent() when you need hidden or script text. For assertions, prefer toHaveText().',
 docs:'https://playwright.dev/docs/api/class-locator#locator-text-content',
 code:`const raw = await page.locator('#description').textContent();
console.log(raw); // includes hidden text nodes`},

{name:'locator.innerHTML()',
 level:'advanced',
 desc:'Returns the inner HTML of an element as a string, including all child elements and their markup.',
 tip:'Use when you need to inspect or snapshot the HTML structure of a component. For text only, innerText() or textContent() are simpler.',
 docs:'https://playwright.dev/docs/api/class-locator#locator-inner-html',
 code:`const html = await page.locator('.card').innerHTML();
expect(html).toContain('<img');
expect(html).toContain('data-testid="card-image"');`},

{name:'locator.all()',
 level:'intermediate',
 desc:'Returns an array of locator objects for every element currently matching the locator. Useful for iterating over a list.',
 tip:'Resolves immediately against the current DOM, so call it after the list has finished loading. Each item is a full locator you can act on individually.',
 docs:'https://playwright.dev/docs/api/class-locator#locator-all',
 code:`// Click every checkbox in a list
const checkboxes = await page.locator('input[type="checkbox"]').all();
for (const checkbox of checkboxes) {
  await checkbox.check();
}

// Read all row texts into an array
const rows = await page.locator('tbody tr').all();
const labels = await Promise.all(rows.map(r => r.innerText()));`},

{name:'locator.allTextContents()',
 level:'intermediate',
 desc:'Returns an array of the text content strings for all elements matching the locator in a single call.',
 tip:'More concise than calling all() and mapping over innerText(). Use allInnerTexts() for the visible rendered text equivalent.',
 docs:'https://playwright.dev/docs/api/class-locator#locator-all-text-contents',
 code:`const tags = await page.locator('.tag').allTextContents();
// ['JavaScript', 'TypeScript', 'Playwright']
expect(tags).toContain('Playwright');

// allInnerTexts() returns only visible rendered text
const labels = await page.locator('li').allInnerTexts();`},

{name:'waitForFunction()',
 level:'advanced',
 desc:'Waits until a JavaScript expression evaluated in the browser returns a truthy value.',
 tip:'Use when Playwright has no built-in wait for your condition: e.g. waiting for a third-party library to initialize or a custom animation to end.',
 docs:'https://playwright.dev/docs/api/class-page#page-wait-for-function',
 code:`// Wait until a custom global flag is set by the app
await page.waitForFunction(() => window.appReady === true);

// Wait until the number of items in a list reaches 5
await page.waitForFunction(() =>
  document.querySelectorAll('.item').length >= 5
);`},

{name:'page.setViewportSize()',
 level:'intermediate',
 desc:'Changes the browser viewport dimensions mid-test. Useful for testing responsive layouts and breakpoints.',
 tip:'Set a global viewport in playwright.config.ts under use: { viewport }. Use this method in a single test when you need to change it dynamically.',
 docs:'https://playwright.dev/docs/api/class-page#page-set-viewport-size',
 code:`// Test tablet layout
await page.setViewportSize({ width: 768, height: 1024 });
await expect(page.locator('.sidebar')).toBeHidden();

// Test mobile layout
await page.setViewportSize({ width: 375, height: 812 });
await expect(page.locator('.mobile-nav')).toBeVisible();`},

{name:'locator.waitFor()',
 level:'intermediate',
 desc:'Waits for a locator to reach a specific state: visible, hidden, attached, or detached. More targeted than page-level waits.',
 tip:'Use when you need to wait for one specific element rather than the whole page. Accepts the same state options as waitForSelector() but on a locator.',
 docs:'https://playwright.dev/docs/api/class-locator#locator-wait-for',
 code:`// Wait until a specific element becomes visible
await page.locator('#results-table').waitFor({ state: 'visible' });

// Wait for a loading spinner to disappear
await page.locator('#spinner').waitFor({ state: 'hidden' });

// Wait for an element to be removed from the DOM entirely
await page.locator('#modal').waitFor({ state: 'detached' });`},

{name:'page.waitForEvent()',
 level:'intermediate',
 desc:"Waits for a browser page event to fire and returns its value. Common events: 'download', 'popup', 'filechooser', 'console', 'dialog'.",
 tip:'Always set up the wait before the action that triggers the event, using Promise.all to avoid race conditions.',
 docs:'https://playwright.dev/docs/api/class-page#page-wait-for-event',
 code:`// Handle a file download
const [download] = await Promise.all([
  page.waitForEvent('download'),
  page.getByRole('button', { name: 'Export CSV' }).click(),
]);
await download.saveAs('./downloads/export.csv');

// Handle a new popup window
const [popup] = await Promise.all([
  page.waitForEvent('popup'),
  page.getByRole('link', { name: 'Open preview' }).click(),
]);
await popup.waitForLoadState();
await expect(popup).toHaveURL(/preview/);`},

{name:'page.emulateMedia()',
 level:'intermediate',
 desc:"Changes the CSS media type ('screen' or 'print') or color scheme ('light', 'dark', 'no-preference') mid-test.",
 tip:'Use to test print stylesheets or dark mode without spinning up a separate browser project. Call it before the action you want to observe.',
 docs:'https://playwright.dev/docs/api/class-page#page-emulate-media',
 code:`// Test dark mode styles
await page.emulateMedia({ colorScheme: 'dark' });
await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(18, 18, 18)');

// Test print layout
await page.emulateMedia({ media: 'print' });
await expect(page.locator('.no-print')).toBeHidden();

// Restore to defaults
await page.emulateMedia({ colorScheme: 'light', media: 'screen' });`},

{name:'context.grantPermissions()',
 level:'intermediate',
 desc:"Grants the browser context one or more permissions like 'geolocation', 'notifications', or 'clipboard-read' without a user prompt.",
 tip:'Grant permissions in beforeEach or in a global setup file so tests are never blocked by a browser permission dialog.',
 docs:'https://playwright.dev/docs/api/class-browsercontext#browser-context-grant-permissions',
 code:`// Grant geolocation permission and set a mock location
await context.grantPermissions(['geolocation']);
await context.setGeolocation({ latitude: 51.5, longitude: -0.1 });
await page.goto('/store-locator');
await expect(page.locator('.nearest-store')).toBeVisible();

// Grant clipboard access
await context.grantPermissions(['clipboard-read', 'clipboard-write']);`},

{name:'page.addLocatorHandler()',
 level:'advanced',
 desc:'Registers a handler that fires automatically when a specific element appears, so your test can dismiss overlays without adding explicit waits.',
 tip:'Use for cookie banners, survey prompts, or newsletter pop-ups that appear unpredictably mid-test. Removes flakiness without polluting every test with dismissal code.',
 docs:'https://playwright.dev/docs/api/class-page#page-add-locator-handler',
 code:`// Auto-dismiss a cookie banner whenever it appears
await page.addLocatorHandler(
  page.getByRole('button', { name: 'Accept cookies' }),
  async (btn) => { await btn.click(); }
);

// From this point any action that triggers the banner is handled automatically
await page.goto('/products');
await page.locator('.product-card').first().click();`},

{name:'page.clock',
 level:'advanced',
 desc:"Playwright's built-in clock API for controlling Date, setTimeout, setInterval, and requestAnimationFrame in the browser.",
 tip:"Replaces addInitScript Date mocking. Use setFixedTime() for a static date, or install() + runFor() to simulate the passage of time and trigger timers.",
 docs:'https://playwright.dev/docs/clock',
 code:`// Set a fixed date for the entire test
await page.clock.setFixedTime(new Date('2025-01-01T12:00:00'));
await page.goto('/dashboard');
await expect(page.locator('.date-display')).toHaveText('January 1, 2025');

// Install the clock and fast-forward timers by 5 seconds
await page.clock.install({ time: new Date('2025-06-01') });
await page.goto('/session-timer');
await page.clock.runFor(5000); // advances timers by 5 s
await expect(page.locator('#countdown')).toHaveText('4:55');`},
]};
