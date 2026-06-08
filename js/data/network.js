/** @type {import('./index.js').Category} */
export default {cat:'Network & Mocking', cls:'network', color:'#14b8a6', items:[
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

{name:'route.fulfill()',
 level:'intermediate',
 desc:'Responds to an intercepted request with a fully custom status code, headers, and body, without hitting the real server.',
 tip:'The primary tool for mocking API responses. Use json: shorthand to skip serialising the body manually. Combine with route() to mock entire endpoints.',
 docs:'https://playwright.dev/docs/api/class-route#route-fulfill',
 code:`// Mock a successful JSON response
await page.route('**/api/products', route => {
  route.fulfill({
    status: 200,
    json: [{ id: 1, name: 'Widget', price: 9.99 }],
  });
});

// Simulate an error response
await page.route('**/api/orders', route => {
  route.fulfill({
    status: 500,
    contentType: 'application/json',
    body: JSON.stringify({ error: 'Internal Server Error' }),
  });
});

// Serve a local fixture file as the response
await page.route('**/api/config', route => {
  route.fulfill({ path: './fixtures/config.json' });
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

{name:'route.fetch()',
 level:'advanced',
 desc:'Forwards the intercepted request to the real server, then returns the real response so you can modify it before the page receives it.',
 tip:'The best of both worlds, real data with modifications. Use to patch one field in a large API response without mocking the whole thing.',
 docs:'https://playwright.dev/docs/api/class-route#route-fetch',
 code:`await page.route('**/api/products', async route => {
  // Get the real response from the server
  const response = await route.fetch();
  const body = await response.json();

  // Modify one field and return the rest unchanged
  body[0].price = 0;
  await route.fulfill({ response, json: body });
});`},

{name:'Block resources by type',
 level:'intermediate',
 desc:'Speeds up tests by aborting requests for heavy resource types like images, fonts, and stylesheets that the test does not need.',
 tip:'Inspect route.request().resourceType() to decide what to block. Common values: image, font, stylesheet, media, script. Great for shaving seconds off image-heavy pages.',
 docs:'https://playwright.dev/docs/api/class-request#request-resource-type',
 code:`// Abort all images and fonts to load pages faster
await page.route('**/*', route => {
  const type = route.request().resourceType();
  if (type === 'image' || type === 'font') {
    route.abort();
  } else {
    route.continue();
  }
});

await page.goto('/gallery');`},

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

{name:'requests()',
 level:'intermediate',
 desc:'Returns an array of the most recent network requests made by the page synchronously, without a pre-registered on(request) listener. Added in Playwright v1.56.',
 tip:"Use to assert which calls a flow made after the fact, with no listener boilerplate. By default it returns requests since the last navigation, pass { filter: 'all' } for every stored request.",
 docs:'https://playwright.dev/docs/api/class-page#page-requests',
 code:`await page.goto('/dashboard');
await page.getByRole('button', { name: 'Refresh' }).click();

// Inspect requests after the fact, no listener needed
const requests = page.requests();
const apiCalls = requests.filter(r => r.url().includes('/api/'));
expect(apiCalls.length).toBeGreaterThan(0);`},

{name:'page.unroute()',
 level:'intermediate',
 desc:'Removes a previously registered route handler so subsequent requests are no longer intercepted.',
 tip:'Use in afterEach() to clean up routes set in beforeEach(), or mid-test when you only want to mock requests temporarily.',
 docs:'https://playwright.dev/docs/api/class-page#page-unroute',
 code:`const handler = route => route.fulfill({ status: 200, body: '[]' });
await page.route('**/api/items', handler);

// ... run tests with the mock active ...

// Remove the mock and real requests will now go through
await page.unroute('**/api/items', handler);`},

{name:'context.route()',
 level:'intermediate',
 desc:'Intercepts network requests for every page in the browser context, not just a single page. Ideal for rules that should apply suite-wide: blocking analytics, injecting auth headers, or mocking third-party scripts.',
 tip:'Set it in a fixture or beforeEach so the rule also covers pages opened later (popups, new tabs). page.route() affects one page; context.route() affects them all.',
 docs:'https://playwright.dev/docs/api/class-browsercontext#browser-context-route',
 code:`test('blocks analytics across the whole context', async ({ page, context }) => {
  // Applies to this page AND any page opened later in the context
  await context.route('**/analytics/**', route => route.abort());

  // Inject a header on every API call from any page
  await context.route('**/api/**', route => {
    route.continue({
      headers: { ...route.request().headers(), 'x-test': 'pw' },
    });
  });

  await page.goto('/dashboard');
});`},

{name:'context.setOffline()',
 level:'intermediate',
 desc:'Emulates an offline (or back-online) network condition for the whole browser context. Use to test offline banners, retry logic, and service-worker fallbacks.',
 tip:'Pass true to go offline, false to restore connectivity. Affects all pages in the context. For granular failures, prefer route.abort() on specific endpoints.',
 docs:'https://playwright.dev/docs/api/class-browsercontext#browser-context-set-offline',
 code:`// Go offline and verify the app shows an offline state
await context.setOffline(true);
await page.getByRole('button', { name: 'Save' }).click();
await expect(page.getByText('You are offline')).toBeVisible();

// Restore connectivity and verify recovery
await context.setOffline(false);
await expect(page.getByText('Back online')).toBeVisible();`},

{name:'routeFromHAR()',
 level:'advanced',
 desc:'Replays network responses from a previously recorded HAR file, serving them as mocks. Record real traffic once, then run tests against the captured responses, with no manual route.fulfill() needed.',
 tip:'Record with update: true (or the CLI: npx playwright open --save-har=api.har), commit the HAR, then replay with update: false in CI. Use the url option to stub only matching requests and let the rest hit the network.',
 docs:'https://playwright.dev/docs/api/class-page#page-route-from-har',
 code:`// Replay recorded responses (default mode)
await page.routeFromHAR('fixtures/api.har', {
  url: '**/api/**',     // only stub API calls
  update: false,        // replay, don't re-record
});

// Re-record the HAR from live traffic (run once to refresh fixtures)
await page.routeFromHAR('fixtures/api.har', { update: true });

await page.goto('/dashboard');`},

{name:'page.routeWebSocket()',
 level:'advanced',
 desc:'Intercepts WebSocket connections matching a URL pattern and lets you mock the server, replying to messages without a real backend. Added in Playwright v1.48.',
 tip:'Call before the WebSocket is created (before goto). Only sockets opened after routeWebSocket() are routed. Use ws.onMessage() to read page messages and ws.send() to push frames back to the page.',
 docs:'https://playwright.dev/docs/api/class-page#page-route-web-socket',
 code:`// Mock the WebSocket server entirely
await page.routeWebSocket('/ws', ws => {
  ws.onMessage(message => {
    if (message === 'ping') ws.send('pong');
  });
});

await page.goto('/chat');
// The page now talks to your mock instead of a real server`},

{name:'WebSocketRoute.connectToServer()',
 level:'advanced',
 desc:'Connects the routed WebSocket to the real server and returns a server-side route, so you can intercept and modify messages in both directions instead of fully mocking.',
 tip:'Setting onMessage() disables the default pass-through for that direction, so forward anything you want to keep with send(). Use this to tamper with or block specific frames while letting the rest flow.',
 docs:'https://playwright.dev/docs/api/class-websocketroute#web-socket-route-connect-to-server',
 code:`await page.routeWebSocket('/ws', ws => {
  const server = ws.connectToServer();

  // Page to server: block one message, forward the rest
  ws.onMessage(message => {
    if (message !== 'secret') server.send(message);
  });

  // Server to page: forward everything unchanged
  server.onMessage(message => ws.send(message));
});`},
]};
