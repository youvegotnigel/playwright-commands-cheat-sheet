/** @type {import('./index.js').Category} */
export default {cat:'API', cls:'api', color:'#ef4444', items:[
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

{name:'context.route()',
 level:'intermediate',
 desc:'Intercepts network requests across ALL pages in the browser context, not just the current page. Perfect for blocking third-party scripts or injecting auth headers globally.',
 tip:'Prefer context.route() over page.route() when the same mock or block must apply to every page in the test, including popups and new tabs opened mid-test.',
 docs:'https://playwright.dev/docs/api/class-browsercontext#browser-context-route',
 code:`test('no analytics noise', async ({ page, context }) => {
  // Block analytics on every page opened in this test
  await context.route('**/analytics/**', route => route.abort());
  await context.route('**/gtag/**',      route => route.abort());

  await page.goto('/dashboard');
  // Any popup or new tab also has analytics blocked
});

// Inject an auth header on every API call across all pages
await context.route('**/api/**', async route => {
  await route.continue({
    headers: {
      ...route.request().headers(),
      Authorization: 'Bearer test-token',
    },
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

{name:'page.routeFromHAR()',
 level:'advanced',
 desc:'Replays network responses from a recorded HAR (HTTP Archive) file. Record real traffic once, replay it as mocks forever, no manual route.fulfill() needed.',
 tip:"Record with { update: true } to refresh against the real server. Use { update: false } (default) for the frozen snapshot. Scope it to specific URLs with the url option to let other requests through.",
 docs:'https://playwright.dev/docs/mock#record-and-replay-requests',
 code:`// First run: record live traffic into a HAR file
await page.routeFromHAR('tests/fixtures/api.har', { update: true });
await page.goto('/users');

// Subsequent runs: replay from the frozen HAR (no real network calls)
await page.routeFromHAR('tests/fixtures/api.har', { update: false });
await page.goto('/users');
await expect(page.locator('tbody tr')).toHaveCount(5);

// Scope to specific URLs - let other requests go through normally
await page.routeFromHAR('tests/fixtures/api.har', {
  url: '**/api/**',
  update: false,
});`},
]};
