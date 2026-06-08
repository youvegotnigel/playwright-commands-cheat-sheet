/** @type {import('./index.js').Category} */
export default {cat:'Fixtures', cls:'fixture', color:'#8b5cf6', items:[
{name:'test.extend()',
 level:'advanced',
 desc:'Creates a new test object with custom fixtures. Fixtures are values injected into tests and hooks via destructuring, automatically set up and torn down.',
 tip:'The recommended way to implement the Page Object Model in Playwright. Define page objects as fixtures so they are instantiated once per test and shared cleanly.',
 docs:'https://playwright.dev/docs/test-fixtures#creating-a-fixture',
 code:`// fixtures.ts
import { test as base } from '@playwright/test';
import { LoginPage } from './pages/LoginPage';

type MyFixtures = { loginPage: LoginPage };

export const test = base.extend<MyFixtures>({
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },
});

export { expect } from '@playwright/test';

// my.spec.ts: import from fixtures, not @playwright/test
import { test, expect } from './fixtures';

test('user can log in', async ({ loginPage }) => {
  await loginPage.goto();
  await loginPage.login('user@test.com', 'secret');
  await expect(loginPage.welcomeMessage).toBeVisible();
});`},

{name:'Fixture setup & teardown',
 level:'advanced',
 desc:'Code before await use() runs as setup, code after it runs as teardown. The value passed to use() is what the test receives.',
 tip:'Everything after use() runs even if the test fails, making it the right place to clean up resources like temp files, DB rows, or API-created entities.',
 docs:'https://playwright.dev/docs/test-fixtures#fixtures',
 code:`export const test = base.extend<{ user: User }>({
  user: async ({ request }, use) => {
    // Setup: create a user via API
    const created = await request.post('/api/users', {
      data: { name: 'Temp User' },
    });
    const user = await created.json();

    await use(user); // test runs here with the user

    // Teardown: always runs, even if the test failed
    await request.delete(\`/api/users/\${user.id}\`);
  },
});`},

{name:'Worker-scoped fixture',
 level:'advanced',
 desc:'A fixture set up once per worker process and shared across all tests that worker runs, instead of being recreated for every test.',
 tip:'Use worker scope for expensive, reusable setup like a seeded database, a logged-in account, or a running server. Declared via the [fixture, { scope: "worker" }] tuple form.',
 docs:'https://playwright.dev/docs/test-fixtures#worker-scoped-fixtures',
 code:`export const test = base.extend<{}, { account: Account }>({
  account: [async ({ browser }, use) => {
    // Runs once per worker
    const account = await createAccount();
    await use(account);
    await deleteAccount(account);
  }, { scope: 'worker' }],
});`},

{name:'Auto fixture',
 level:'advanced',
 desc:'A fixture that runs for every test automatically, without the test having to request it in its arguments. Marked with { auto: true }.',
 tip:'Use auto fixtures for cross-cutting setup that should always apply: attaching screenshots on failure, seeding state, or installing default routes.',
 docs:'https://playwright.dev/docs/test-fixtures#automatic-fixtures',
 code:`export const test = base.extend<{ autoMocks: void }>({
  autoMocks: [async ({ context }, use) => {
    // Runs for every test, no need to request it
    await context.route('**/analytics/**', r => r.abort());
    await use();
  }, { auto: true }],
});`},

{name:'Override a built-in fixture',
 level:'advanced',
 desc:'Redefine a built-in fixture such as page or context to apply project-wide defaults, then call use() with the customised value.',
 tip:'A clean way to apply setup to every test, e.g. navigate to a base URL, set a default locale, or inject auth, without repeating it in each test.',
 docs:'https://playwright.dev/docs/test-fixtures#overriding-fixtures',
 code:`export const test = base.extend({
  page: async ({ page }, use) => {
    // Every test starts already on the dashboard
    await page.goto('/dashboard');
    await use(page);
  },
});`},

{name:'Option fixtures',
 level:'advanced',
 desc:'Fixtures declared with { option: true } become configurable from playwright.config via the use block, letting projects set different values for the same fixture.',
 tip:'Use option fixtures for per-project configuration like a default user role or feature flag. Set them under projects[].use in the config.',
 docs:'https://playwright.dev/docs/test-parametrize#parametrized-projects',
 code:`// fixtures.ts
export const test = base.extend<{ role: string }>({
  role: ['guest', { option: true }],
});

// playwright.config.ts: set per project
export default defineConfig({
  projects: [
    { name: 'admin', use: { role: 'admin' } },
    { name: 'guest', use: { role: 'guest' } },
  ],
});`},
]};
