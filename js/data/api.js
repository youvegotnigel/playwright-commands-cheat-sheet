/** @type {import('./index.js').Category} */
export default {
  cat: 'API',
  cls: 'api',
  color: '#feb671',
  items: [
    {
      name: 'request.get()',
      level: 'beginner',
      desc: 'Sends an HTTP GET request from within the test. Returns a response object you can assert against.',
      tip: 'Use to verify API behaviour directly, or to fetch data before asserting on it without going through the UI.',
      docs: 'https://playwright.dev/docs/api/class-apirequestcontext#api-request-context-get',
      code: `const res = await request.get('/api/users');
expect(res.status()).toBe(200);

const body = await res.json();
expect(body).toHaveLength(10);`,
    },

    {
      name: 'request.post()',
      level: 'beginner',
      desc: 'Sends an HTTP POST request with a JSON body. Use for creating resources or logging in via API.',
      tip: 'Faster than UI login flows. Log in via API and inject the session token. Saves many seconds per test.',
      docs: 'https://playwright.dev/docs/api/class-apirequestcontext#api-request-context-post',
      code: `const res = await request.post('/api/login', {
  data: {
    email: 'test@mail.com',
    password: 'secret'
  }
});
expect(res.status()).toBe(200);`,
    },

    {
      name: 'request.put()',
      level: 'intermediate',
      desc: 'Sends an HTTP PUT request to fully replace a resource.',
      tip: 'Use to set up test state via API rather than navigating through the UI. Much faster for test setup.',
      docs: 'https://playwright.dev/docs/api/class-apirequestcontext#api-request-context-put',
      code: `const res = await request.put('/api/users/1', {
  data: { name: 'Updated Name', role: 'admin' }
});
expect(res.status()).toBe(200);`,
    },

    {
      name: 'request.patch()',
      level: 'intermediate',
      desc: 'Sends an HTTP PATCH request to partially update a resource.',
      tip: 'Use PATCH when you only want to update specific fields, not replace the whole resource.',
      docs: 'https://playwright.dev/docs/api/class-apirequestcontext#api-request-context-patch',
      code: `const res = await request.patch('/api/users/1', {
  data: { status: 'active' }
});
expect(res.status()).toBe(200);`,
    },

    {
      name: 'request.delete()',
      level: 'intermediate',
      desc: 'Sends an HTTP DELETE request to remove a resource.',
      tip: 'Use in afterEach() to clean up test data that was created during a test run.',
      docs: 'https://playwright.dev/docs/api/class-apirequestcontext#api-request-context-delete',
      code: `const res = await request.delete('/api/users/1');
expect(res.status()).toBe(204);`,
    },

    {
      name: 'apiResponse.timing()',
      level: 'advanced',
      desc: 'Returns resource timing for an API response: an absolute startTime plus the DNS, connect, TLS, request, and response milestones. Lets an API test assert on latency without a separate HTTP client. Added in Playwright v1.62.',
      tip: 'Every field except startTime is measured in milliseconds relative to startTime, and anything unavailable comes back as -1. Responses replayed from a HAR file report -1 for all of them. For a redirect chain you get the timing of the last request only.',
      docs: 'https://playwright.dev/docs/api/class-apiresponse#api-response-timing',
      code: `const res = await request.get('/api/users');
const t = res.timing();

// Time to first byte, relative to the start of the request
expect(t.responseStart).toBeLessThan(500);

// Full round trip, in milliseconds
const total = t.responseEnd - t.requestStart;
console.log('total ms', total);

// Unavailable values are -1, so guard before using them
if (t.domainLookupEnd !== -1) {
  console.log('dns ms', t.domainLookupEnd - t.domainLookupStart);
}`,
    },

    {
      name: 'request.addCookies() / cookies()',
      level: 'intermediate',
      desc: 'Manages the cookie jar of an API request context: addCookies() seeds cookies, cookies() reads them, and clearCookies() removes them. Mirrors the BrowserContext cookie methods. Added in Playwright v1.64.',
      tip: 'Seed a session cookie once and every following request.* call sends it, with no hand-built Cookie header. clearCookies() takes the same name, domain and path filters as context.clearCookies().',
      docs: 'https://playwright.dev/docs/api/class-apirequestcontext#api-request-context-add-cookies',
      code: `await request.addCookies([
  { name: 'session-id', value: '42', url: 'https://example.com' },
]);

// Sent automatically with every request from this context
const res = await request.get('https://example.com/api/me');
await expect(res).toBeOK();

console.log(await request.cookies('https://example.com'));
await request.clearCookies({ name: 'session-id' });`,
    },
  ],
};
