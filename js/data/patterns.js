/** @type {import('./index.js').Category} */
export default {cat:'Patterns', cls:'pattern', color:'#ec4899', items:[
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

{name:'Page Object Model',
 level:'intermediate',
 desc:"Encapsulates a page's selectors and actions into a reusable class. Keeps tests readable and centralizes locator maintenance.",
 tip:'If a locator changes, fix it in one place, not in every test. The biggest maintainability win in large test suites.',
 docs:'https://playwright.dev/docs/pom',
 code:`// pages/LoginPage.ts
export class LoginPage {
  constructor(private page: Page) {}

  async login(email: string, password: string) {
    await this.page.getByLabel('Email').fill(email);
    await this.page.getByLabel('Password').fill(password);
    await this.page.getByRole('button', { name: 'Log in' }).click();
  }
}

// tests/login.spec.ts
test('user can log in', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await page.goto('/login');
  await loginPage.login('user@test.com', 'secret');
  await expect(page).toHaveURL('/dashboard');
});`},

{name:'storageState auth',
 level:'intermediate',
 desc:'Saves authenticated browser state (cookies, localStorage) to a file and reuses it across tests, eliminating repeated UI logins.',
 tip:'This globalSetup approach still works, but the modern recommended pattern is a dedicated "setup" project that other projects list in dependencies. It shows up in reports and traces and reruns on retry. See "projects (dependencies)" in the Config category.',
 docs:'https://playwright.dev/docs/auth#basic-shared-account-in-all-tests',
 code:`// global-setup.ts, runs once before all tests
import { chromium } from '@playwright/test';

export default async function globalSetup() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('/login');
  await page.getByLabel('Email').fill('user@test.com');
  await page.getByLabel('Password').fill('secret');
  await page.getByRole('button', { name: 'Log in' }).click();
  await page.context().storageState({ path: 'auth.json' });
  await browser.close();
}

// playwright.config.ts
// use: { storageState: 'auth.json' }`},

{name:'New window or popup',
 level:'intermediate',
 desc:'Clicking a link or button can open a second window or tab. Use Promise.all to start listening before the click fires, so you never miss the popup event.',
 tip:'If "popup" never fires, the page opened at the browser context level (e.g. a target=_blank link). Listen with context.waitForEvent("page") instead.',
 docs:'https://playwright.dev/docs/pages#handling-new-pages',
 code:`// Race risk: if you click first, the popup can open
// before you start waiting. Promise.all starts the
// listener and the click together, so you never miss it.
const [popup] = await Promise.all([
  page.waitForEvent('popup'),       // start watching first
  page.click('text=Open report'),   // then trigger it
]);

await popup.waitForLoadState();              // let it finish loading
await expect(popup).toHaveTitle(/Report/);   // now assert on it

// A new tab opened at the context level instead
const [newTab] = await Promise.all([
  context.waitForEvent('page'),
  page.click('text=Terms'),
]);
await newTab.waitForLoadState('domcontentloaded');`},

{name:'Popup via Page Object',
 level:'intermediate',
 desc:'Hide the popup timing logic inside a page object method that returns the new page object, so the test stays clean and reads like plain English.',
 tip:'The test never sees waitForEvent or Promise.all, just a method call that hands back a ready-to-use page object for the new window.',
 docs:'https://playwright.dev/docs/pom',
 code:`// pages/DashboardPage.ts
async openReportInNewWindow(): Promise<ReportPage> {
  const [popup] = await Promise.all([
    this.page.waitForEvent('popup'),
    this.openReportLink.click(),
  ]);
  await popup.waitForLoadState();
  return new ReportPage(popup); // hand back a page object
}

// The test reads cleanly, no timing noise
const reportPage = await dashboardPage.openReportInNewWindow();
await reportPage.expectLoaded();`},

{name:'Many popups at once',
 level:'advanced',
 desc:'Promise.all on one event catches only one window. If a single action opens several, collect each new page with a context event handler, then wait for the count you expect.',
 tip:'Close popups once you are done with them. Leftover windows pile up in long suites and slow the run.',
 docs:'https://playwright.dev/docs/pages#handling-new-pages',
 code:`const newPages = [];
context.on('page', p => newPages.push(p)); // catch each new tab

await page.click('text=Open all');

await expect.poll(() => newPages.length).toBe(3); // wait for all 3
await Promise.all(newPages.map(p => p.waitForLoadState()));

// Tidy up when finished
await popup.close();`},

{name:'Page vs context events',
 level:'intermediate',
 desc:'waitForEvent only accepts events that the object itself emits. A Page emits page level events, a BrowserContext emits context level events. Pass the right name to the right object.',
 tip:"A new window opened by a page is page.waitForEvent('popup'). A new tab at the browser level (target=_blank) is context.waitForEvent('page'). There is no 'page' event on a Page, and no 'popup' event on a context.",
 docs:'https://playwright.dev/docs/events',
 code:`// PAGE events: one tab. Listen on page.
//   popup, download, filechooser, dialog, console,
//   pageerror, request, response, load, worker, ...
const [popup] = await Promise.all([
  page.waitForEvent('popup'),       // new window from this page
  page.click('text=Open report'),
]);

// CONTEXT events: whole session, all tabs. Listen on context.
//   page, weberror, request, response, console, dialog, ...
const [newTab] = await Promise.all([
  context.waitForEvent('page'),     // new tab in the context
  page.click('text=Terms'),
]);

// Rule of thumb: if 'popup' never fires, try 'page'.`},
]};
