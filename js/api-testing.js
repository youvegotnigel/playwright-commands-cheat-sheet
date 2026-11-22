// =============================================================
// api-testing.js — content of the API testing mind map (api-testing.html).
// SECTIONS is the content source: edit it here to change the page.
// MIND_MAP groups the sections into the branches drawn at the top.
// js/guide.js renders the sections, js/mind-map.js the map.
// =============================================================

import { renderGuide } from './guide.js';
import { renderMindMap } from './mind-map.js';

const SECTIONS = [
  {
    id: 'features',
    title: 'Key features',
    tagline: 'What Playwright gives you for API testing',
    text: true,
    cols: ['Feature', 'What you get', 'Worth knowing'],
    rows: [
      [
        'Built-in HTTP client',
        'The `request` fixture gives every test its own `APIRequestContext`.',
        'No axios, and no browser download: a pure API suite runs on Node alone.',
      ],
      [
        'Config inheritance',
        '`baseURL`, `extraHTTPHeaders`, `httpCredentials`, `proxy` and `ignoreHTTPSErrors` set once under `use`.',
        'They apply to every call.',
      ],
      [
        'Typed responses',
        '`request.get<User>()` types `response.json()` (v1.63).',
        'Pair it with `z.infer` so types and contract never drift.',
      ],
      [
        'Response matcher',
        '`await expect(res).toBeOK()` fails with the full call log (method, URL, headers, status) plus the response text.',
        'Verified on 1.65.1.',
      ],
      [
        'Fixtures',
        'The core of the framework: typed dependency injection with test and worker scope, lazy creation, auto and option fixtures, and teardown that runs even when the test fails.',
        '`mergeTests()` combines API and UI fixture sets.',
      ],
      [
        'Projects and dependencies',
        'An `auth.setup.ts` project runs first.',
        'It appears in the report, and gets traces like any test.',
      ],
      [
        'Shared state with the browser',
        "`page.request` uses the page's cookie jar.",
        '`storageState` files move between API and browser contexts.',
      ],
      [
        'Parallel by default',
        'Workers, `fullyParallel` and sharding.',
        'Plus test locks (v1.63) for the few tests that touch shared global state.',
      ],
      [
        'Evidence on failure',
        'Trace viewer and the HTML report show each API call with headers and bodies.',
        '`testInfo.attach()` feeds Allure too.',
      ],
      [
        'Resilience controls',
        'Per-call `timeout`, `maxRetries` for ECONNRESET, `maxRedirects`.',
        '`AbortSignal` (v1.62) and mTLS client certificates.',
      ],
    ],
  },
  {
    id: 'structure',
    title: 'Framework structure',
    tagline: 'Layer it like Page Object Model: specs call clients, clients call `request`',
    note: 'Specs describe behaviour. Clients know endpoints. Fixtures wire everything together and own setup and cleanup. When an endpoint moves from `/v1` to `/v2`, one client file changes and no spec does.',
    cols: ['File', 'Its job', 'Code'],
    rows: [
      [
        'Folder layout',
        'Fixtures are the heart, clients are the "page objects" of API testing, and every spec imports from one place.',
        `# Folder layout
api-tests/
├── playwright.config.ts        # environments, reporters, projects, fixture options
├── .env.example                # names only, never real secrets
├── src/
│   ├── fixtures/               # THE heart of the framework
│   │   ├── auth.fixtures.ts    # worker: apiRole, envGuard, authToken | test: api
│   │   ├── clients.fixtures.ts # test: usersClient, jobsClient, filesClient
│   │   ├── data.fixtures.ts    # test: cleanup, createUser, createdUser
│   │   └── index.ts            # the ONE import every spec uses
│   ├── clients/                # the "page objects" of API testing
│   │   ├── base.client.ts
│   │   ├── users.client.ts
│   │   ├── jobs.client.ts
│   │   └── files.client.ts
│   ├── builders/
│   │   └── user.builder.ts     # faker-based data factories
│   ├── schemas/
│   │   └── user.schema.ts      # zod contract + inferred types
│   └── utils/
│       └── env.ts              # fail fast on missing config
├── tests/
│   ├── auth.setup.ts           # runs first via project dependencies
│   └── users/
│       └── users.crud.spec.ts
└── .auth/                      # storageState files (gitignored)`,
      ],
      [
        '`src/clients/users.client.ts`',
        'One typed method per endpoint. It returns `APIResponse` and never asserts.',
        `import { BaseClient } from './base.client';
import type { NewUser, User } from '../schemas/user.schema';

type Query = Record<string, string | number | boolean>;

export class UsersClient extends BaseClient {
  private readonly path = '/api/users';

  list(params: Query = {}) {
    return this.request.get<{ items: User[]; total: number }>(this.path, { params });
  }

  getById(id: string) {
    return this.request.get<User>(\`\${this.path}/\${id}\`);
  }

  create(user: NewUser) {
    return this.request.post<User>(this.path, { data: user });
  }

  replace(id: string, user: NewUser) {
    return this.request.put<User>(\`\${this.path}/\${id}\`, { data: user });
  }

  update(id: string, patch: Partial<NewUser>) {
    return this.request.patch<User>(\`\${this.path}/\${id}\`, { data: patch });
  }

  remove(id: string) {
    return this.request.delete(\`\${this.path}/\${id}\`);
  }
}`,
      ],
      [
        '`src/clients/base.client.ts`',
        'Every client receives the authenticated `APIRequestContext` through its constructor.',
        `import type { APIRequestContext } from '@playwright/test';

export abstract class BaseClient {
  constructor(protected readonly request: APIRequestContext) {}
}`,
      ],
      [
        '`src/utils/env.ts`',
        'Fail fast on missing config, with the name of the missing variable.',
        `export const env = (key: string): string => {
  const value = process.env[key];
  if (!value) throw new Error(\`Missing env var: \${key}\`);
  return value;
};`,
      ],
    ],
    lead: 'Clients return `APIResponse` and never assert. Tests own the assertions, so the same client serves happy paths and 4xx tests. That rule is the one I would defend hardest in a design review.',
  },
  {
    id: 'fixtures',
    title: 'Fixtures (core)',
    tagline: 'Fixtures are the framework: every test gets exactly what it asks for',
    note: 'A fixture is a typed, reusable piece of setup and teardown that a test requests by name. Playwright builds only the fixtures a test uses, resolves their dependencies, and tears them down in reverse order, even when the test fails. Token login lives in worker scope; contexts, clients and test data live in test scope. Specs import `test` from `src/fixtures`, never from `@playwright/test`.',
    cols: ['Piece', 'What it does', 'Code'],
    rows: [
      [
        'The fixture graph',
        'Worker scope runs once per worker process. Test scope is fresh for every test. Your test asks by name and Playwright resolves the graph.',
        `// Worker scope: once per worker process
apiRole (option) -> authToken
envGuard (auto)
clientToken

// Test scope: fresh for every test
api (uses authToken) -> usersClient -> createUser -> createdUser
cleanup (box) -> createUser

// Your test asks by name
async ({ usersClient, createdUser }) => { ... }`,
      ],
      [
        'A spec that only consumes fixtures',
        'Imports `test` from `src/fixtures`, sets the role with `test.use()`, and asks for `usersClient` and `createdUser` by name.',
        `import { test, expect } from '../../src/fixtures';   // never '@playwright/test' in specs

// Option fixtures can be overridden per file (a worker option starts fresh workers)
test.use({ apiRole: 'admin' });

// Ask for what you need. Playwright resolves the graph:
// authToken (worker) -> api -> usersClient -> cleanup -> createUser -> createdUser
test('PUT replaces and PATCH updates', async ({ usersClient, createdUser }) => {
  const put = await usersClient.replace(createdUser.id, {
    name: 'Ada Lovelace',
    email: createdUser.email,
    role: 'viewer',
  });
  await expect(put).toBeOK();

  const patch = await usersClient.update(createdUser.id, { role: 'admin' });
  await expect(patch).toBeOK();

  const after = await usersClient.getById(createdUser.id);
  expect(await after.json()).toMatchObject({ name: 'Ada Lovelace', role: 'admin' });
});   // teardown deletes createdUser, worker keeps its token for the next test`,
      ],
      [
        'Anatomy of a fixture and every option',
        'Setup, `use()`, then teardown, plus `scope`, `auto`, `option`, `timeout`, `title` and `box`.',
        `myFixture: [
  async ({ otherFixture }, use, testInfo) => {
    const value = await setUp(otherFixture);   // 1. setup (lazy: only if requested)
    await use(value);                          // 2. the test runs here
    await tearDown(value);                     // 3. teardown, runs even on failure
  },
  {
    scope: 'worker',           // 'test' (default) = fresh per test, 'worker' = once per worker
    auto: true,                // run for every test even when not requested
    option: true,              // configurable via use: {} in config or test.use()
    timeout: 60_000,           // separate timeout, handy for slow worker setup
    title: 'login once',       // readable name in reports
    box: true,                 // keep fixture plumbing out of the report steps
  },
],`,
      ],
      [
        '`src/fixtures/clients.fixtures.ts`',
        'Lazy client fixtures: a client is only built when a test asks for it.',
        `import { test as authTest } from './auth.fixtures';
import { UsersClient } from '../clients/users.client';
import { JobsClient } from '../clients/jobs.client';
import { FilesClient } from '../clients/files.client';

type ClientFixtures = {
  usersClient: UsersClient;
  jobsClient: JobsClient;
  filesClient: FilesClient;
};

// Lazy: a client is only built when a test asks for it
export const test = authTest.extend<ClientFixtures>({
  usersClient: async ({ api }, use) => use(new UsersClient(api)),
  jobsClient: async ({ api }, use) => use(new JobsClient(api)),
  filesClient: async ({ api }, use) => use(new FilesClient(api)),
});`,
      ],
      [
        '`src/fixtures/index.ts`',
        'The one import every spec uses.',
        `// Single import for every spec: import { test, expect } from '../src/fixtures';
export { test } from './data.fixtures';
export { expect } from '@playwright/test';
export type { Role } from './auth.fixtures';`,
      ],
      [
        '`src/fixtures/data.fixtures.ts`',
        'A `cleanup` registry, a `createUser` factory and a ready-made `createdUser`.',
        `import { expect } from '@playwright/test';
import { test as clientsTest } from './clients.fixtures';
import { buildUser } from '../builders/user.builder';
import type { NewUser, User } from '../schemas/user.schema';

export type Cleanup = { add: (task: () => Promise<unknown>) => void };

type DataFixtures = {
  cleanup: Cleanup;                                             // deferred teardown registry
  createUser: (overrides?: Partial<NewUser>) => Promise<User>;  // factory
  createdUser: User;                                            // ready-made
};

export const test = clientsTest.extend<DataFixtures>({
  cleanup: [
    async ({}, use) => {
      const tasks: Array<() => Promise<unknown>> = [];
      await use({ add: (task) => tasks.push(task) });
      // Runs even when the test fails, newest first (children before parents)
      for (const task of tasks.reverse()) await task();
    },
    { box: true },
  ],

  createUser: async ({ usersClient, cleanup }, use) => {
    await use(async (overrides = {}) => {
      const res = await usersClient.create(buildUser(overrides));
      await expect(res).toBeOK();
      const user = await res.json();
      cleanup.add(() => usersClient.remove(user.id));
      return user;
    });
  },

  createdUser: async ({ createUser }, use) => use(await createUser()),
});`,
      ],
    ],
    lead: 'Three rules I enforce in review. One: specs never call `newContext()`, `beforeEach` or `afterEach` for setup; a fixture does. Two: anything slow and read-only (login, tokens, health checks) is worker scoped; anything a test can change is test scoped. Three: `auto: true` is for cheap cross-cutting checks only, never for seeding data.',
  },
  {
    id: 'hooks',
    title: 'Hooks vs fixtures',
    tagline: 'Why setup belongs in fixtures, not in `beforeEach` and `afterEach`',
    text: true,
    cols: ['Aspect', 'beforeEach / afterEach', 'Fixtures'],
    rows: [
      [
        'Reuse across files',
        'Copy-paste or helper calls in every file',
        'Import one `test` object',
      ],
      [
        'When it runs',
        'Every test in the file, needed or not',
        'Only for tests that ask for it (lazy)',
      ],
      ['Sharing state', 'Untyped `let` variables at file level', 'Typed parameters per test'],
      [
        'Teardown',
        'Separate `afterEach` that has to find the state',
        'Right after `use()`, next to its setup',
      ],
      ['Scope', 'Per test, or per file with `beforeAll`', 'Per test or per worker, with options'],
      ['Composition', 'Order of declaration', 'A dependency graph Playwright resolves'],
      ['Parallel safety', 'Shared variables leak between tests', 'Each test gets its own instance'],
    ],
  },
  {
    id: 'config',
    title: 'Config & context',
    tagline: 'Put the environment in config once, never in specs',
    note: 'Built-in fixtures such as `request` and `baseURL` inherit everything under `use`, and custom option fixtures like `apiRole` are set per project. A second service with its own certificates or credentials gets its own worker fixture, so no test ever creates or disposes a context by hand.',
    cols: ['File', 'What it sets', 'Code'],
    rows: [
      [
        '`playwright.config.ts`',
        'Environments, reporters, projects and typed custom fixture options. The `apiRole` option changes per project.',
        `import { defineConfig } from '@playwright/test';
import type { Role } from './src/fixtures';
import 'dotenv/config';

export default defineConfig<{ apiRole: Role }>({   // typed custom fixture options
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,          // a committed test.only fails CI
  retries: process.env.CI ? 2 : 0,
  reporter: [['html', { open: 'never' }], ['allure-playwright']],
  use: {
    baseURL: process.env.API_BASE_URL,   // built-in fixtures (request, baseURL) read this
    extraHTTPHeaders: { Accept: 'application/json' },
    trace: 'retain-on-failure',
  },
  webServer: {                           // optional: boot a stub or the service locally
    command: 'node mock/server.mjs',
    url: 'http://localhost:3333/health',
    reuseExistingServer: !process.env.CI,
  },
  projects: [
    { name: 'setup', testMatch: /.*\\.setup\\.ts/ },
    // Same specs, different identity: the apiRole OPTION fixture changes per project
    { name: 'api', dependencies: ['setup'], use: { apiRole: 'viewer' }, grepInvert: /@admin/ },
    { name: 'api-admin', dependencies: ['setup'], use: { apiRole: 'admin' }, grep: /@admin/ },
  ],
});`,
      ],
      [
        'Extra service as a worker fixture',
        'A second service with its own options, showing every common `newContext()` option.',
        `// A second service with its own options lives in a worker fixture, never in a test
export const test = apiTest.extend<{}, { partnerApi: APIRequestContext }>({
  partnerApi: [
    async ({ playwright }, use) => {
      const ctx = await playwright.request.newContext({
        baseURL: env('PARTNER_API_URL'),
        extraHTTPHeaders: { 'X-Tenant': 'tenant-a' },
        httpCredentials: { username: env('BASIC_USER'), password: env('BASIC_PASS'), send: 'always' },
        ignoreHTTPSErrors: true,   // self-signed QA environments only
        timeout: 15_000,           // per request, default 30s, 0 disables
        failOnStatusCode: false,   // v1.51+, keep false when you test 4xx paths
        maxRedirects: 5,           // v1.52+, default 20
        proxy: { server: 'http://proxy.internal:8080' },
        clientCertificates: [      // mTLS, v1.46+
          { origin: 'https://partner.internal', certPath: 'certs/client.crt', keyPath: 'certs/client.key' },
        ],
      });
      await use(ctx);
      await ctx.dispose();         // the fixture owns the lifecycle
    },
    { scope: 'worker' },
  ],
});

test('partner health', async ({ partnerApi }) => {
  await expect(await partnerApi.get('/health')).toBeOK();
});`,
      ],
    ],
  },
  {
    id: 'auth',
    title: 'Authentication',
    tagline: 'Log in once per worker, not once per test',
    note: 'Token APIs: the `authToken` worker fixture logs in once per role and the test-scoped `api` fixture builds a fresh, authenticated context with a correlation ID for every test. Cookie or session APIs: a setup project saves `storageState` and the `sessionApi` fixture loads it.',
    cols: ['File', 'What it does', 'Code'],
    rows: [
      [
        '`src/fixtures/auth.fixtures.ts`',
        'Worker fixtures `apiRole`, `envGuard`, `authToken` and `clientToken`; test fixtures `api` and `sessionApi`.',
        `import { test as base, expect, type APIRequestContext } from '@playwright/test';
import { env } from '../utils/env';

export type Role = 'viewer' | 'admin';

type WorkerFixtures = {
  apiRole: Role;          // option: set per project in playwright.config.ts
  envGuard: void;         // auto: fail fast when the environment is down
  authToken: string;      // logged in ONCE per worker
  clientToken: string;    // OAuth2 client credentials, form-encoded
};
type TestFixtures = {
  api: APIRequestContext;         // fresh, authenticated context per test
  sessionApi: APIRequestContext;  // cookie-based APIs via storageState
};

export const test = base.extend<TestFixtures, WorkerFixtures>({
  apiRole: ['viewer', { option: true, scope: 'worker' }],

  envGuard: [
    async ({ playwright }, use) => {
      const ctx = await playwright.request.newContext({ baseURL: env('API_BASE_URL') });
      const health = await ctx.get('/health');
      await ctx.dispose();
      if (!health.ok()) throw new Error(\`Environment unhealthy: \${health.status()}\`);
      await use();
    },
    { scope: 'worker', auto: true, title: 'environment health check' },
  ],

  authToken: [
    async ({ playwright, apiRole }, use) => {
      const ctx = await playwright.request.newContext({ baseURL: env('API_BASE_URL') });
      const res = await ctx.post<{ token: string }>('/auth/login', {
        data: {
          username: env(\`API_USER_\${apiRole.toUpperCase()}\`),
          password: env(\`API_PASS_\${apiRole.toUpperCase()}\`),
        },
        failOnStatusCode: true,
      });
      const { token } = await res.json();
      await ctx.dispose();
      await use(token);
    },
    { scope: 'worker', title: 'login once per worker' },
  ],

  clientToken: [
    async ({ playwright }, use) => {
      const ctx = await playwright.request.newContext({ baseURL: env('API_BASE_URL') });
      const res = await ctx.post<{ access_token: string }>('/oauth/token', {
        form: {
          grant_type: 'client_credentials',
          client_id: env('CLIENT_ID'),
          client_secret: env('CLIENT_SECRET'),
        },
        failOnStatusCode: true,
      });
      const { access_token } = await res.json();
      await ctx.dispose();
      await use(access_token);
    },
    { scope: 'worker' },
  ],

  api: async ({ playwright, baseURL, authToken }, use, testInfo) => {
    const correlationId = crypto.randomUUID();
    testInfo.annotations.push({ type: 'correlation-id', description: correlationId });
    const ctx = await playwright.request.newContext({
      baseURL,
      extraHTTPHeaders: {
        Authorization: \`Bearer \${authToken}\`,
        Accept: 'application/json',
        'X-Correlation-Id': correlationId,
      },
    });
    await use(ctx);
    await ctx.dispose();
  },

  sessionApi: async ({ playwright, baseURL }, use) => {
    const ctx = await playwright.request.newContext({ baseURL, storageState: '.auth/session.json' });
    await use(ctx);
    await ctx.dispose();
  },
});

export { expect };`,
      ],
      [
        '`tests/auth.setup.ts`',
        'Cookie or session APIs: a setup project logs in and saves `storageState`.',
        `// tests/auth.setup.ts : cookie / session based APIs (e.g. ASP.NET_SessionId)
import { test as setup, expect } from '@playwright/test';
import { env } from '../src/utils/env';

setup('save API session state', async ({ request }) => {
  const res = await request.post('/account/login', {
    form: { username: env('API_USER'), password: env('API_PASS') },
  });
  await expect(res).toBeOK();
  await request.storageState({ path: '.auth/session.json' });
});`,
      ],
      [
        'Reusing the session',
        'The `sessionApi` fixture loads the saved cookies, and browser tests can load the same file.',
        `// sessionApi fixture (in auth.fixtures.ts) loads the saved cookies
test('session cookies via the sessionApi fixture', async ({ sessionApi, baseURL }) => {
  const url = baseURL ?? '';
  await expect(await sessionApi.get('/api/me')).toBeOK();

  // Cookie control on the request context itself (v1.64+)
  expect((await sessionApi.cookies(url)).map((c) => c.name)).toContain('ASP.NET_SessionId');
  await sessionApi.clearCookies({ name: 'ASP.NET_SessionId' });
  expect((await sessionApi.get('/api/me')).status()).toBe(401);
  await sessionApi.addCookies([{ name: 'ASP.NET_SessionId', value: 'abc123', url }]);
});

// Browser tests can load the same file
test.use({ storageState: '.auth/session.json' });`,
      ],
    ],
  },
  {
    id: 'get',
    title: 'Receive data: GET',
    tagline: 'Read the status first, then the body, with types',
    note: 'Since v1.63 request methods take a type argument, so `await res.json()` comes back typed instead of `any`. Use `params` for query strings rather than building URLs by hand.',
    cols: ['Example', 'What it shows', 'Code'],
    rows: [
      [
        '`tests/users/users.get.spec.ts`',
        'Status first, then a typed body. `params` builds the query string, and the `api` fixture takes one-off headers.',
        `import { test, expect } from '../../src/fixtures';

test('GET /api/users/:id returns a typed user', async ({ usersClient, createdUser }) => {
  const res = await usersClient.getById(createdUser.id);  // APIResponse<User>

  expect(res.status()).toBe(200);                         // 1. status first
  const user = await res.json();                           // 2. typed as User (v1.63+)
  expect(user).toMatchObject({ id: createdUser.id, email: createdUser.email });
});

test('GET /api/users lists a seeded user', { tag: '@smoke' }, async ({ usersClient, createdUser }) => {
  const res = await usersClient.list({ page: 1, limit: 50 });   // params: ?page=1&limit=50

  await expect(res).toBeOK();
  expect(res.headers()['content-type']).toContain('application/json');
  expect((await res.json()).items).toEqual(
    expect.arrayContaining([expect.objectContaining({ email: createdUser.email })]),
  );
});

// One-off headers or params: use the authenticated api fixture directly
test('api fixture: params and headers', async ({ api, createdUser }) => {
  const res = await api.get<User>(\`/api/users/\${createdUser.id}\`, {
    params: { include: 'roles' },
    headers: { 'X-Feature-Flag': 'new-search' },
  });
  expect(res.url()).toContain('include=roles');
});`,
      ],
      [
        'APIResponse cheat sheet',
        'Everything a response can tell you, from `status()` to `timing()` and `securityDetails()`.',
        `res.status();          // 200
res.statusText();      // 'OK'
res.ok();              // true for 200..299
res.url();             // final URL after redirects
res.headers();         // { 'content-type': '...' }, names lower-cased
res.headersArray();    // [{ name, value }], keeps duplicates like Set-Cookie
await res.json();      // parsed body, throws if not JSON
await res.text();      // raw string, best for error logging
await res.body();      // Buffer, for PDFs, images, CSV downloads
res.timing();          // v1.62: DNS, connect, TTFB, responseEnd in ms
await res.securityDetails(); // v1.61: TLS protocol, issuer, validTo
await res.serverAddr();      // v1.61: { ipAddress, port }
await res.dispose();   // free the body in big loops`,
      ],
      [
        'Upgrade note for 1.65',
        'v1.65 behaviour change: a query already in the URL is kept, and `params` are appended to it.',
        `// v1.65 behaviour change: a query already in the URL is kept
test('params are appended to an existing query', async ({ api }) => {
  const res = await api.get('/echo?active=true', { params: 'page=2' });
  expect((await res.json()).query).toBe('?active=true&page=2');  // verified on 1.65.1
});`,
      ],
    ],
  },
  {
    id: 'post',
    title: 'Send data: POST',
    tagline: 'Pick the body option by content type and let Playwright set the header',
    note: '`data` sends JSON, `form` sends URL-encoded fields, `multipart` sends files. Use only one per request. Data comes from builders, and anything a test creates directly is registered with the `cleanup` fixture straight away.',
    cols: ['Example', 'Body option', 'Code'],
    rows: [
      [
        '`tests/users/users.crud.spec.ts`',
        '`data` (JSON). Register cleanup before more asserts, then validate the contract. Plus the 422 negative path.',
        `test('POST creates a user that matches the contract', async ({ usersClient, cleanup }) => {
  const newUser = buildUser({ role: 'admin' });

  const user = await test.step('create user', async () => {
    const res = await usersClient.create(newUser);         // data: newUser (JSON)
    expect(res.status()).toBe(201);
    const created = await res.json();
    cleanup.add(() => usersClient.remove(created.id));      // register BEFORE more asserts
    expect(res.headers().location).toBe(\`/api/users/\${created.id}\`);
    return created;
  });

  await test.step('validate contract', async () => {
    UserSchema.parse(user);                                 // zod: exact failing field
    expect(user).toMatchObject({ ...newUser, id: expect.any(String) });
  });
});

test('POST without email is rejected with 422', async ({ usersClient }) => {
  const res = await usersClient.create(buildUser({ email: '' }));
  await expect(res).not.toBeOK();
  expect(res.status()).toBe(422);
});`,
      ],
      [
        'File upload through the filesClient fixture',
        '`multipart` (multipart/form-data), with a file object or the web-standard `FormData`.',
        `// src/clients/files.client.ts
export class FilesClient extends BaseClient {
  upload(file: UploadFile, description: string) {
    return this.request.post<{ received: boolean }>('/api/files', {
      multipart: { description, file },          // multipart/form-data
    });
  }
  uploadForm(form: FormData) {
    return this.request.post<{ received: boolean }>('/api/files', { multipart: form });
  }
}

// tests: the filesClient fixture hands you an authenticated client
test('upload a discharge summary', async ({ filesClient }) => {
  const buffer = fs.readFileSync('fixtures-data/summary.pdf');
  const res = await filesClient.upload(
    { name: 'summary.pdf', mimeType: 'application/pdf', buffer },
    'Discharge summary',
  );
  expect(res.status()).toBe(201);

  // Same thing with the web-standard FormData
  const form = new FormData();
  form.set('description', 'Discharge summary');
  form.append('file', new File([buffer], 'summary.pdf', { type: 'application/pdf' }));
  expect((await filesClient.uploadForm(form)).status()).toBe(201);
});`,
      ],
      [
        'Form body inside a worker fixture',
        '`form` (application/x-www-form-urlencoded), here for OAuth2 client credentials.',
        `// application/x-www-form-urlencoded inside a WORKER fixture (OAuth2 client credentials)
clientToken: [
  async ({ playwright }, use) => {
    const ctx = await playwright.request.newContext({ baseURL: env('API_BASE_URL') });
    const res = await ctx.post<{ access_token: string }>('/oauth/token', {
      form: {
        grant_type: 'client_credentials',
        client_id: env('CLIENT_ID'),
        client_secret: env('CLIENT_SECRET'),
      },
      failOnStatusCode: true,
    });
    const { access_token } = await res.json();
    await ctx.dispose();
    await use(access_token);
  },
  { scope: 'worker' },
],`,
      ],
      [
        '`src/builders/user.builder.ts`',
        'Faker-based data factory: unique data per run, and tests state only what matters.',
        `import { faker } from '@faker-js/faker';
import type { NewUser } from '../schemas/user.schema';

export const buildUser = (overrides: Partial<NewUser> = {}): NewUser => ({
  name: faker.person.fullName(),
  email: faker.internet.email({ provider: 'example.test' }),  // unique per run
  role: 'viewer',
  ...overrides,                                               // tests state only what matters
});`,
      ],
    ],
  },
  {
    id: 'update',
    title: 'Update: PUT, PATCH',
    tagline: 'Treat every write as unproven until you read it back',
    note: '`put()` replaces the whole resource, `patch()` changes only the fields you send. Assert the write status, then GET the resource and check the stored state.',
    cols: ['Example', 'What it proves', 'Code'],
    rows: [
      [
        'PUT and PATCH',
        'Never trust the write response alone: read it back with a GET.',
        `test('PUT replaces and PATCH updates', async ({ usersClient, createdUser }) => {
  const put = await usersClient.replace(createdUser.id, {
    name: 'Ada Lovelace',
    email: createdUser.email,
    role: 'viewer',
  });
  await expect(put).toBeOK();

  const patch = await usersClient.update(createdUser.id, { role: 'admin' });
  await expect(patch).toBeOK();

  // Never trust the write response alone: read it back
  const after = await usersClient.getById(createdUser.id);
  expect(await after.json()).toMatchObject({ name: 'Ada Lovelace', role: 'admin' });
});`,
      ],
      [
        'Concurrency with If-Match',
        'Optimistic locking: send back the ETag you read. Add a sibling test that expects 412 with a stale ETag.',
        `// Optimistic locking: send back the ETag you read
test('PATCH with If-Match uses the current ETag', async ({ api, usersClient, createdUser }) => {
  const current = await usersClient.getById(createdUser.id);

  const res = await api.patch(\`/api/users/\${createdUser.id}\`, {
    data: { role: 'admin' },
    headers: { 'If-Match': current.headers().etag },
  });
  expect(res.status()).toBe(200);   // add a sibling test expecting 412 with a stale ETag
});`,
      ],
    ],
    lead: 'Ask developers whether PATCH is JSON Merge Patch or JSON Patch. They need different bodies, and the wrong assumption produces tests that pass against the wrong contract.',
  },
  {
    id: 'delete',
    title: 'Delete + cleanup',
    tagline: 'The test that creates data is the test that removes it',
    note: 'Creation goes through the `createUser` factory or the `createdUser` fixture, and both register removal with `cleanup`. Code after `use()` runs even when the test fails, newest first, which shared variables in hooks cannot promise.',
    cols: ['Example', 'What it proves', 'Code'],
    rows: [
      [
        'DELETE and the factory fixture',
        'Expect 204, then 404 on a read. Teardown must be idempotent. A factory creates several users and cleans them all up.',
        `test('DELETE removes the user', async ({ usersClient, createdUser }) => {
  const del = await usersClient.remove(createdUser.id);
  expect(del.status()).toBe(204);

  const get = await usersClient.getById(createdUser.id);
  expect(get.status()).toBe(404);
  // cleanup then gets a harmless 404: teardown must be idempotent
});

test('a factory creates several users, all cleaned up', async ({ usersClient, createUser }) => {
  const [admin, viewer] = await Promise.all([
    createUser({ role: 'admin' }),
    createUser({ role: 'viewer' }),
  ]);

  const res = await usersClient.list({ limit: 100 });
  const emails = (await res.json()).items.map((u) => u.email);
  expect(emails).toEqual(expect.arrayContaining([admin.email, viewer.email]));
});`,
      ],
    ],
    lead: 'Prefer a factory fixture (`createUser`) over many single-purpose ones. One fixture then covers every test that needs one user, three users or a user with a specific role, and cleanup stays in one place.',
  },
  {
    id: 'assert',
    title: 'Assertions',
    tagline: 'Assert status, shape and meaning, in that order',
    note: 'Status proves the call worked. A schema proves the contract held. A partial match proves the business values. Use `expect.poll` for anything eventually consistent and `expect.soft` to collect several header checks in one run.',
    cols: ['Example', 'What it proves', 'Code'],
    rows: [
      [
        'Matchers you will use daily',
        '`toBeOK()` for 2xx, the exact code, soft header checks and a partial match. Plus the negative path.',
        `test('matchers you will use daily', async ({ usersClient, createdUser }) => {
  const res = await usersClient.getById(createdUser.id);

  await expect(res).toBeOK();                  // 2xx, async: ALWAYS await
  expect(res.status()).toBe(200);               // exact code
  expect.soft(res.headers()['content-type']).toContain('json'); // keep going, report all

  const body = await res.json();
  expect(body).toMatchObject({                  // partial match, ignores extras
    id: createdUser.id,
    createdAt: expect.stringMatching(/^\\d{4}-\\d{2}-\\d{2}T/),
  });
});

test('negative path', async ({ usersClient }) => {
  const res = await usersClient.getById(crypto.randomUUID());
  await expect(res).not.toBeOK();
  expect(res.status()).toBe(404);
});`,
      ],
      [
        '`src/schemas/user.schema.ts`',
        'A zod v4 contract with inferred types: one source of truth.',
        `import { z } from 'zod';   // zod v4

export const UserSchema = z.object({
  id: z.uuid(),
  name: z.string().min(1),
  email: z.email(),
  role: z.enum(['viewer', 'admin']),
  createdAt: z.iso.datetime(),
});

export type User = z.infer<typeof UserSchema>;          // one source of truth
export type NewUser = Omit<User, 'id' | 'createdAt'>;`,
      ],
      [
        'Eventual consistency',
        'Async job: no sleeps, `expect.poll` until the state is reached.',
        `// Async job: the jobsClient fixture, no sleeps, poll until the state is reached
test('async job reaches COMPLETED', async ({ jobsClient }) => {
  const start = await jobsClient.start();
  expect(start.status()).toBe(202);
  const { id } = await start.json();

  await expect
    .poll(async () => (await (await jobsClient.status(id)).json()).status, {
      intervals: [200, 500, 1_000],
      timeout: 10_000,
    })
    .toBe('COMPLETED');
});`,
      ],
    ],
  },
  {
    id: 'advanced',
    title: 'Other useful methods',
    tagline: 'The methods and options most suites forget exist',
    note: '`fetch()` covers any verb, `head()` is a cheap probe, and every request method accepts `timeout`, `maxRetries`, `maxRedirects`, `failOnStatusCode`, `ignoreHTTPSErrors` and `signal`.',
    cols: ['Example', 'What it covers', 'Code'],
    rows: [
      [
        'Advanced request options',
        'Any verb, a cheap probe, per-call resilience knobs, cancelling a request, and the throwing variant asserted as a rejection.',
        `test('fetch, head and resilience options', async ({ api }) => {
  // Any verb, or replay a captured Request object
  await expect(await api.fetch('/health', { method: 'GET' })).toBeOK();
  expect((await api.head('/health')).status()).toBe(200);   // headers only, cheap probe

  // Per-call resilience knobs
  await expect(
    await api.get('/health', {
      timeout: 10_000,          // override the 30s default
      maxRetries: 2,            // v1.46+, retries ECONNRESET only, NOT 5xx
      maxRedirects: 0,          // assert a 302 and its Location yourself
      failOnStatusCode: true,   // throw on non-2xx
    }),
  ).toBeOK();

  // Cancel a request (v1.62+). The default timeout still applies.
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5_000);
  await expect(await api.get('/health', { signal: controller.signal })).toBeOK();
  clearTimeout(timer);

  // Throwing variant asserted as a rejection
  await expect(api.get('/api/nope', { failOnStatusCode: true })).rejects.toThrow(/404/);
});`,
      ],
    ],
    lead: '`maxRetries` retries network resets, not HTTP 5xx. If a service returns flaky 503s, that is a finding to raise, not something to retry away.',
  },
  {
    id: 'hybrid',
    title: 'API + UI hybrid',
    tagline: 'Use the API to arrange, the UI to prove',
    note: "`mergeTests()` combines your API fixtures with your page object fixtures, so one test can seed data through the API and prove it in the UI. `page.request` shares the page's cookies, and `route.fetch()` lets you change one field of a real response.",
    cols: ['Example', 'What it shows', 'Code'],
    rows: [
      [
        '`tests/ui/admin-users.spec.ts`',
        'One test object with both fixture sets, `page.request` with the browser session, and a real response patched to force a UI state.',
        `import { test as base, mergeTests, expect } from '@playwright/test';
import { test as apiTest } from '../src/fixtures';
import { AdminUsersPage } from '../src/pages/admin-users.page';

// UI fixtures: page objects injected like API clients
const uiTest = base.extend<{ adminUsersPage: AdminUsersPage }>({
  adminUsersPage: async ({ page }, use) => use(new AdminUsersPage(page)),
});

// One test object with BOTH fixture sets
export const test = mergeTests(apiTest, uiTest);

test('user seeded via API appears in the admin grid', async ({ createdUser, adminUsersPage }) => {
  await adminUsersPage.open();                           // arrange took 50ms, not 5 clicks
  await expect(adminUsersPage.row(createdUser.email)).toBeVisible();
});                                                       // createdUser is deleted after

test('page.request shares the browser session', async ({ page }) => {
  await page.goto('/login');
  // ...log in through the UI
  await expect(await page.request.get('/api/me')).toBeOK(); // sends the browser cookies
});

test('patch a real response to force a UI state', async ({ page }) => {
  await page.route('**/api/feature-flags', async (route) => {
    const response = await route.fetch();                  // real backend call
    const flags = await response.json();
    await route.fulfill({ response, json: { ...flags, newDashboard: true } });
  });
  await page.goto('/dashboard');
});`,
      ],
    ],
  },
  {
    id: 'runner',
    title: 'Runner + reports',
    tagline: 'Make every failure explain itself in the report',
    note: 'Steps give the report a readable story, tags drive pipeline gates, attachments carry request and response evidence into the HTML report and Allure, and traces record every call. Newer releases add locks, isolated retries and shuffling.',
    cols: ['Example', 'What it gives you', 'Code'],
    rows: [
      [
        'Steps, tags, attachments, locks',
        'Request and response evidence for the HTML report and Allure, test locks (v1.63) and isolated retries (v1.62).',
        `test.describe('Users API', { tag: '@api' }, () => {
  test('create then read', { tag: '@smoke' }, async ({ usersClient, cleanup }, testInfo) => {
    const res = await test.step('create user', () => usersClient.create(buildUser()));

    // Request/response evidence for the HTML report and Allure
    await testInfo.attach('create-response', {
      body: await res.text(),
      contentType: 'application/json',
    });
    await expect(res).toBeOK();
    const { id } = await res.json();
    cleanup.add(() => usersClient.remove(id));
  });

  // v1.63+: tests sharing a lock name never run at the same time
  test('rotate the shared signing key', { lock: 'signing-key' }, async ({ api }) => {
    await expect(await api.post('/api/keys/rotate')).toBeOK();
  });
});

// playwright.config.ts, v1.62+: run all retries at the end in one worker
export default defineConfig({ retryStrategy: 'isolated' });`,
      ],
      [
        'CLI you will use',
        'Quality gates, re-running failures, PR feedback, shuffling and the reports.',
        `npx playwright test --project=api --grep @smoke   # pipeline quality gate
npx playwright test -G @slow                       # grep-invert shorthand
npx playwright test --last-failed                  # re-run only failures
npx playwright test --only-changed=origin/main     # PR feedback in seconds
npx playwright test --shuffle                      # v1.64, exposes test coupling
npx playwright show-report
npx playwright show-trace path/to/trace.zip`,
      ],
      [
        'GitHub Actions',
        'The job steps: no `playwright install`, because API suites need no browsers.',
        `# .github/workflows/api-tests.yml (job steps)
- uses: actions/checkout@v4
- uses: actions/setup-node@v4
  with: { node-version: 22, cache: npm }
- run: npm ci                        # no "playwright install": API suites need no browsers
- run: npx playwright test --project=api
  env:
    API_BASE_URL: \${{ vars.API_BASE_URL }}
    API_USER: \${{ secrets.API_USER }}
    API_PASS: \${{ secrets.API_PASS }}
- uses: actions/upload-artifact@v4
  if: \${{ !cancelled() }}
  with: { name: playwright-report, path: playwright-report/ }`,
      ],
    ],
  },
  {
    id: 'pitfalls',
    title: 'Junior mistakes',
    tagline: 'Sixteen mistakes I see in junior API suites, and the fix for each',
    note: 'Each pair below is the same intent written two ways. The Avoid half usually passes on day one and fails in CI a month later.',
    cols: ['Mistake', 'Why it hurts', 'Avoid vs do this'],
    rows: [
      [
        'Using axios or fetch inside specs',
        'You lose baseURL, shared headers, traces, the HTML report and `toBeOK()`. One HTTP stack per framework.',
        `// Avoid
import axios from 'axios';
const res = await axios.get('https://qa.example.com/api/users');

// Do this
test('list users', async ({ usersClient }) => {
  await expect(await usersClient.list()).toBeOK();
});`,
        true,
      ],
      [
        'Forgetting await on async matchers',
        'An un-awaited assertion can finish after the test. Turn on `@typescript-eslint/no-floating-promises` and `playwright/missing-playwright-await` from eslint-plugin-playwright.',
        `// Avoid
expect(res).toBeOK();            // floating promise

// Do this
await expect(res).toBeOK();`,
        true,
      ],
      [
        'Weak status checks',
        '`toBeOK()` prints the call log and the response body on failure. Then assert the exact code: 200 and 201 mean different things.',
        `// Avoid
expect(res.ok()).toBeTruthy();   // 'expected false to be truthy'

// Do this
await expect(res).toBeOK();
expect(res.status()).toBe(201);`,
        true,
      ],
      [
        'Tests that depend on each other',
        'Breaks under `fullyParallel`, retries, `--shuffle` and when a single test is run. Every test arranges its own data through a fixture.',
        `// Avoid
let userId: string;
test('create', async () => { userId = (await create()).id; });
test('delete', async () => { await remove(userId); });

// Do this
test('delete', async ({ usersClient, createdUser }) => {
  await usersClient.remove(createdUser.id);
});`,
        true,
      ],
      [
        'Hardcoded URLs and secrets',
        'Environment lives in config, secrets in CI secret stores. `env()` fails fast with a clear message instead of a mystery 401.',
        `// Avoid
await request.post('https://qa.example.com/auth/login', {
  data: { username: 'admin', password: 'P@ssw0rd' },
});

// Do this
// auth.fixtures.ts, worker scope
data: { username: env(\`API_USER_\${apiRole.toUpperCase()}\`),
        password: env(\`API_PASS_\${apiRole.toUpperCase()}\`) },`,
        true,
      ],
      [
        'Logging in before every test',
        'N tests means N logins, slower runs and rate-limit failures. Use a worker-scoped fixture or a setup project with storageState.',
        `// Avoid
test.beforeEach(async ({ request }) => {
  token = await login(request);
});

// Do this
authToken: [async ({ playwright, apiRole }, use) => { /* login once */ },
  { scope: 'worker' }],`,
        true,
      ],
      [
        'Setup and teardown in hooks instead of fixtures',
        'Hooks run for every test in the file, share untyped variables and get copied between files. Fixtures are lazy, typed, imported once and keep teardown next to setup.',
        `// Avoid
let users: UsersClient;
let user: User;
test.beforeEach(async ({ request }) => {
  users = new UsersClient(request);
  user = await (await users.create(buildUser())).json();
});
test.afterEach(async () => { await users.remove(user.id); });

// Do this
test('PATCH updates role', async ({ usersClient, createdUser }) => {
  await usersClient.update(createdUser.id, { role: 'admin' });
});`,
        true,
      ],
      [
        'God fixtures and auto data seeding',
        'An auto fixture that seeds data slows every test and hides what each test depends on. Keep fixtures small and requested by name.',
        `// Avoid
seedEverything: [async ({ api }, use) => {
  /* 20 POSTs for every test */
  await use();
}, { auto: true }],

// Do this
// small fixtures each test opts into
test('...', async ({ createdUser }) => { /* ... */ });
// auto only for cheap cross-cutting checks like envGuard`,
        true,
      ],
      [
        'Sleeping for async work',
        'Fixed sleeps are slow when the system is fast and flaky when it is slow. Poll for the state you need.',
        `// Avoid
await new Promise((r) => setTimeout(r, 5000));
expect((await getJob()).status).toBe('DONE');

// Do this
test('job completes', async ({ jobsClient }) => {
  await expect.poll(async () => (await (await jobsClient.status(id)).json()).status,
    { timeout: 10_000 }).toBe('COMPLETED');
});`,
        true,
      ],
      [
        'Deep-equal on volatile payloads',
        'IDs and timestamps change every run. Check shape with a schema and values with a partial match.',
        `// Avoid
expect(body).toEqual({ id: 'b1f2...', createdAt: '2026-11-22T04:09:45Z', name: 'Ada' });

// Do this
UserSchema.parse(body);
expect(body).toMatchObject({ name: 'Ada', id: expect.any(String) });`,
        true,
      ],
      [
        '`JSON.stringify` on the body',
        'A string body is sent as `application/octet-stream` (verified on 1.65.1), so many APIs reply 415 or 400. Pass the object and Playwright sets `application/json`.',
        `// Avoid
await request.post('/api/users', { data: JSON.stringify(user) });

// Do this
test('create', async ({ api }) => {
  await api.post('/api/users', { data: user });
});`,
        true,
      ],
      [
        'Parsing before checking status',
        'Status first gives a readable failure. A JSON parse error on an error page hides the real problem.',
        `// Avoid
const body = await res.json();   // throws on a 500 HTML page or a 204
expect(body.id).toBeTruthy();

// Do this
expect(res.status()).toBe(201);
const body = await res.json();`,
        true,
      ],
      [
        '`failOnStatusCode` everywhere',
        'Suite-wide it turns every negative test (401, 404, 422) into a thrown error. Keep it for setup code that must be loud.',
        `// Avoid
// inside the api fixture: every test now throws on 4xx
await playwright.request.newContext({ failOnStatusCode: true });

// Do this
// only the login call inside the authToken worker fixture
await ctx.post('/auth/login', { data, failOnStatusCode: true });`,
        true,
      ],
      [
        'Fixed test data and no cleanup',
        'Shared data collides across workers and runs. Unique data from a builder plus fixture teardown keeps environments clean.',
        `// Avoid
await create({ email: 'test@test.com' });   // 409 on the second run

// Do this
test('...', async ({ createUser }) => {
  const user = await createUser();   // unique data, auto cleanup
});`,
        true,
      ],
      [
        'Raw calls and `any` everywhere',
        'A typed client layer is the API version of Page Object Model. Endpoint changes become a one-file fix, and ESLint stays clean.',
        `// Avoid
const res: any = await request.post(\`\${url}/api/v2/users\`, { data: payload as any });

// Do this
test('create', async ({ usersClient }) => {
  const res = await usersClient.create(buildUser()); // APIResponse<User>
});`,
        true,
      ],
      [
        'Unmanaged contexts',
        'Each context holds connections and response bodies. Fixtures own the lifecycle, so nothing leaks between tests.',
        `// Avoid
const ctx = await playwright.request.newContext();
// ...no dispose()

// Do this
await use(ctx);
await ctx.dispose();   // owned by a fixture`,
        true,
      ],
    ],
  },
  {
    id: 'summary',
    title: 'Summary',
    tagline: 'The whole map in ten lines',
    text: true,
    cols: ['Rule', 'In one line', 'Branch'],
    rows: [
      [
        'Fixtures first',
        'Make fixtures the backbone: specs import `test` from `src/fixtures` and request everything by name.',
        'Fixtures (core)',
      ],
      [
        'Right scope',
        'Worker scope for login and tokens, test scope for contexts, clients and data.',
        'Fixtures (core), Authentication',
      ],
      [
        'Typed clients',
        'Wrap endpoints in typed clients that return `APIResponse` and never assert; inject them as fixtures.',
        'Framework structure',
      ],
      [
        'Factory data',
        'Create data through factory fixtures and register every removal with `cleanup`.',
        'Delete + cleanup',
      ],
      [
        'Config, not specs',
        'Set `baseURL` in config, roles as option fixtures per project, secrets through `env()`.',
        'Config & context',
      ],
      [
        'Right body option',
        'Send bodies with `data`, `form` or `multipart`, never a stringified object.',
        'Send data: POST',
      ],
      [
        'Assert in order',
        'Assert status first, then a schema, then values with `toMatchObject`.',
        'Assertions',
      ],
      [
        'Await and poll',
        'Always `await` async matchers; poll instead of sleeping.',
        'Assertions, Junior mistakes',
      ],
      [
        'Independent tests',
        'Keep tests independent: they must pass alone, in parallel and shuffled.',
        'Junior mistakes',
      ],
      [
        'Failures that explain themselves',
        'Tag, step and attach so every failure explains itself in the report.',
        'Runner + reports',
      ],
    ],
    leadTitle: 'What I would teach a junior first.',
    lead: 'Write one test that passes when run alone, in parallel, shuffled and twice in a row against the same environment. Everything on this map exists to make that true.',
  },
  {
    id: 'tips',
    title: 'Pro tips',
    tagline: 'Small habits that keep the suite fast, readable and honest',
    text: true,
    cols: ['Tip', 'Do this', 'Payoff'],
    rows: [
      [
        'Readable reports',
        'Name worker fixtures with `title` and hide plumbing with `box: true`.',
        'Reports stay readable for the whole team.',
      ],
      [
        'No browsers for API suites',
        'Pure API suites skip `npx playwright install`.',
        'No browsers are needed, which saves minutes per CI job.',
      ],
      [
        'Correlation IDs',
        'Add a correlation ID header per request and log it on failure.',
        'Then search for it in Datadog, New Relic or OpenSearch.',
      ],
      [
        'Timing, not load',
        '`res.timing()` is great for spotting a slow endpoint.',
        'Keep load testing in k6 or JMeter.',
      ],
      [
        'Nightly shuffle',
        'Run `--shuffle` on a nightly job.',
        'Any new failure is a hidden dependency between tests.',
      ],
      [
        'Lint for awaits',
        'Install eslint-plugin-playwright with `no-floating-promises` on.',
        'It catches most missing awaits before review.',
      ],
      [
        'Upgrading to 1.65',
        'Check URLs that already contain a query plus `params`.',
        'And move CI off Node 20.',
      ],
    ],
  },
];

// The map: a root, four groups read clockwise (1 to 4), and one branch per section. Leaves are
// memory joggers; a leaf with an id links to that section (a sub-branch).
const MIND_MAP = {
  root: 'Playwright API testing',
  sub: 'Fixtures at the heart',
  start: { id: 'features', label: 'Start: key features' },
  recap: [
    { id: 'summary', label: 'Recap: summary' },
    { id: 'tips', label: 'Pro tips' },
  ],
  groups: [
    {
      name: 'Build the framework',
      branches: [
        {
          id: 'structure',
          label: 'Framework structure',
          leaves: ['specs → clients → `request`', 'clients never assert', '`env()` fails fast'],
        },
        {
          id: 'fixtures',
          label: 'Fixtures (core)',
          heart: true,
          leaves: [
            'worker: `authToken`, `envGuard`',
            'test: `api`, clients, data',
            'teardown after `use()`',
            { id: 'hooks', text: 'vs `beforeEach` / `afterEach`' },
          ],
        },
        {
          id: 'config',
          label: 'Config & context',
          leaves: [
            '`baseURL` under `use`',
            'roles as option fixtures',
            'extra service = worker fixture',
          ],
        },
        {
          id: 'auth',
          label: 'Authentication',
          leaves: ['log in once per worker', '`storageState` for cookies', 'OAuth2 with `form`'],
        },
      ],
    },
    {
      name: 'Send and receive',
      branches: [
        {
          id: 'get',
          label: 'Receive data: GET',
          leaves: ['status first, then body', 'typed `get<User>()`', '`params` for queries'],
        },
        {
          id: 'post',
          label: 'Send data: POST',
          leaves: [
            '`data`, `form` or `multipart`',
            'builders for unique data',
            'register `cleanup` at once',
          ],
        },
        {
          id: 'update',
          label: 'Update: PUT, PATCH',
          leaves: [
            'PUT replaces, PATCH changes fields',
            'read it back with GET',
            '`If-Match` with the ETag',
          ],
        },
        {
          id: 'delete',
          label: 'Delete + cleanup',
          leaves: ['the creator removes it', '`createUser` factory', 'idempotent teardown'],
        },
      ],
    },
    {
      name: 'Prove it',
      branches: [
        {
          id: 'assert',
          label: 'Assertions',
          leaves: ['status, schema, values', '`toMatchObject` + zod', '`expect.poll`, never sleep'],
        },
        {
          id: 'advanced',
          label: 'Other useful methods',
          leaves: [
            '`fetch()` and `head()`',
            '`timeout`, `maxRetries`, `signal`',
            'retries resets, not 5xx',
          ],
        },
        {
          id: 'hybrid',
          label: 'API + UI hybrid',
          leaves: ['API arranges, UI proves', '`mergeTests()`', '`page.request` shares cookies'],
        },
      ],
    },
    {
      name: 'Run and review',
      branches: [
        {
          id: 'runner',
          label: 'Runner + reports',
          leaves: ['steps, tags, attachments', 'gate with `--grep @smoke`', 'no browsers in CI'],
        },
        {
          id: 'pitfalls',
          label: 'Junior mistakes',
          leaves: [
            '16 mistakes, 16 fixes',
            'always `await` matchers',
            'never `JSON.stringify` a body',
          ],
        },
      ],
    },
  ],
};

// Expose for tests via page.evaluate() (same rationale as window.categories)
window.apiSections = SECTIONS;
window.apiMindMap = MIND_MAP;

// Column that holds method names, per section: those chips link back to the dashboard
const LINK_COLUMN = { features: 1, summary: 1 };

renderGuide(SECTIONS, { linkColumns: LINK_COLUMN });
renderMindMap(MIND_MAP);
