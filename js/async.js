// =============================================================
// async.js — content of the Async guide (async.html).
// SECTIONS is the content source: edit it here to change the page.
// js/guide.js renders it.
// =============================================================

import { renderGuide } from './guide.js';

const SECTIONS = [
  {
    id: 'basics',
    title: 'How async works in a Playwright test',
    note: 'Every call that talks to the browser returns a promise. The test only waits for it if you say so.',
    cols: ['Concept', 'What it means', 'Example'],
    rows: [
      [
        'Every call returns a promise',
        'Clicking, filling and navigating happen in the browser, not in your test process. `await` pauses the test until the browser reports back. Without it, the next line runs too early.',
        `await page.goto('/patients');
await page.getByRole('button', { name: 'New patient' }).click();`,
      ],
      [
        'Locators are lazy',
        'Creating a locator does nothing and needs no `await`. Only acting on it, or asserting on it, talks to the browser.',
        `const save = page.getByRole('button', { name: 'Save' });
await save.click();`,
      ],
      [
        '`expect(locator)` is awaited, `expect(value)` is not',
        'A web-first assertion polls the page until it passes, so it returns a promise. An assertion on a plain value checks once and returns at once.',
        `await expect(page.getByRole('status')).toHaveText('Saved'); // retries
const title = await page.title();
expect(title).toContain('Patients'); // plain value, no retry`,
      ],
      [
        '`test.step()` returns a promise',
        'A step is async work with a name. Await it, or the next step starts while this one is still running.',
        `await test.step('Book the appointment', async () => {
  await page.getByRole('button', { name: 'Book' }).click();
});`,
      ],
      [
        '`return await` inside `try` and `catch`',
        'Returning a promise without `await` lets its rejection skip your `catch`. Inside a `try`, write `return await`.',
        `async function readTitle(page: Page): Promise<string> {
  try {
    return await page.title();
  } catch (error) {
    throw new Error('No title yet: ' + error);
  }
}`,
      ],
      [
        'Typed async helpers',
        'Give every helper that awaits a `Promise<void>` (or `Promise<T>`) return type. The signature tells callers they must await it.',
        `async function admit(page: Page, name: string): Promise<void> {
  await page.getByLabel('Patient name').fill(name);
  await page.getByRole('button', { name: 'Admit' }).click();
}`,
      ],
    ],
  },
  {
    id: 'awaits',
    title: 'Forgotten and misplaced awaits',
    note: 'Each row shows the flaky way first, then the correct way. TypeScript will not stop you: a promise you ignore is still valid code.',
    cols: ['Mistake', 'What goes wrong', 'Flaky vs correct'],
    rows: [
      [
        'Missing `await` on an action',
        'The click is still running when the next line starts, so the assertion sometimes sees the old page. It passes on a fast machine and fails in CI.',
        `// Flaky
page.getByRole('button', { name: 'Save' }).click();
await expect(page.getByText('Saved')).toBeVisible();

// Correct
await page.getByRole('button', { name: 'Save' }).click();
await expect(page.getByText('Saved')).toBeVisible();`,
        true,
      ],
      [
        'Missing `await` on a web-first assertion',
        'The assertion is never waited for, so it can never fail the test. A broken page passes, which is worse than a failing test.',
        `// Flaky
expect(page.getByRole('alert')).toBeHidden();

// Correct
await expect(page.getByRole('alert')).toBeHidden();`,
        true,
      ],
      [
        'An `async` helper called without `await`',
        'The helper runs in the background while the test carries on. Its failure becomes an unhandled rejection, far from the line that caused it.',
        `// Flaky
admit(page, 'Patient A');
await expect(page.getByText('Admitted')).toBeVisible();

// Correct
await admit(page, 'Patient A');
await expect(page.getByText('Admitted')).toBeVisible();`,
        true,
      ],
      [
        '`.then()` mixed with `await`',
        'The chain is a second, detached flow. Nothing waits for it, and its errors are easy to lose. Pick `await` and use it everywhere.',
        `// Flaky
page.goto('/chart').then(() => page.getByRole('link', { name: 'Labs' }).click());
await expect(page.getByRole('heading', { name: 'Labs' })).toBeVisible();

// Correct
await page.goto('/chart');
await page.getByRole('link', { name: 'Labs' }).click();
await expect(page.getByRole('heading', { name: 'Labs' })).toBeVisible();`,
        true,
      ],
      [
        '`if (await el.isVisible())` as a sync point',
        '`isVisible()` answers right now and never waits. If the banner appears 200ms later, the branch is skipped and the test is flaky.',
        `// Flaky
if (await page.getByText('Welcome back').isVisible()) {
  await page.getByRole('button', { name: 'Continue' }).click();
}

// Correct
await expect(page.getByText('Welcome back')).toBeVisible();
await page.getByRole('button', { name: 'Continue' }).click();`,
        true,
      ],
      [
        '`await` on a locator',
        'A locator is not a promise, so awaiting it does nothing. It looks like a wait, but no element was found or checked.',
        `// Flaky
await page.getByRole('row', { name: 'Chart 14' });

// Correct
await page.getByRole('row', { name: 'Chart 14' }).click();`,
        true,
      ],
      [
        'An un-awaited `test.step()`',
        'The step body runs detached, so the report shows the step passing before its actions finish, and the next step races it.',
        `// Flaky
test.step('Book the visit', async () => {
  await page.getByRole('button', { name: 'Book' }).click();
});

// Correct
await test.step('Book the visit', async () => {
  await page.getByRole('button', { name: 'Book' }).click();
});`,
        true,
      ],
    ],
  },
  {
    id: 'loops',
    title: 'Loops and collections',
    note: 'A loop is where one missing await becomes ten. Pick the loop that matches how the work should run.',
    cols: ['Task', 'Approach', 'Example'],
    rows: [
      [
        'One by one, in order',
        'Use `for...of` with `await` inside. Each pass finishes before the next starts, which is what you want when the steps depend on each other.',
        `const wards = ['Ward A', 'Ward B', 'Ward C'];
for (const name of wards) {
  await page.getByRole('link', { name }).click();
  await expect(page.getByRole('heading', { name })).toBeVisible();
}`,
      ],
      [
        'Independent reads, together',
        '`Promise.all()` over `map` suits reads that do not change the page. Never use it for actions on one page.',
        `const rows = page.getByRole('row');
const texts = await Promise.all(
  (await rows.all()).map((row) => row.innerText())
);`,
      ],
      [
        'Assert a whole list in one go',
        'Pass an array to `toHaveText()`. It retries until the list matches, and it fails with a readable diff.',
        `await expect(page.getByRole('listitem')).toHaveText([
  'Triage',
  'Consult',
  'Discharge',
]);`,
      ],
      [
        'Visit each element of a list',
        'Assert the count first so the list has settled, then loop over `all()`. Without the count, `all()` can return a half-loaded list.',
        `const cards = page.getByTestId('bed-card');
await expect(cards).toHaveCount(4);
for (const card of await cards.all()) {
  await expect(card).toContainText('Occupied');
}`,
      ],
      [
        '`forEach()` with an async callback <tag>Broken</tag>',
        '`forEach()` ignores the promises its callback returns. The loop ends at once, the test carries on, and the clicks run in the background.',
        `const rows = await page.getByRole('row').all();

// Broken: forEach does not wait for async callbacks
rows.forEach(async (row) => {
  await row.getByRole('button', { name: 'Check in' }).click();
});

// Fix: for...of waits for each click
for (const row of rows) {
  await row.getByRole('button', { name: 'Check in' }).click();
}`,
        true,
      ],
    ],
  },
  {
    id: 'parallel',
    title: 'Doing things at the same time',
    note: 'Parallel is safe when the things are independent: different pages, or reads that change nothing.',
    cols: ['Pattern', 'Use it when', 'Example'],
    rows: [
      [
        '`waitForResponse()` as a promise variable',
        'You need the response, and the click is a separate step. Start the wait before the click, then await it after.',
        `const responsePromise = page.waitForResponse('**/api/appointments');
await page.getByRole('button', { name: 'Book' }).click();
const response = await responsePromise;
expect(response.status()).toBe(201);`,
      ],
      [
        'Wait and trigger in one expression',
        'The same pattern, shorter. The wait is created first, so it cannot miss the response.',
        `const [response] = await Promise.all([
  page.waitForResponse('**/api/appointments'),
  page.getByRole('button', { name: 'Book' }).click(),
]);`,
      ],
      [
        'Two independent pages at once',
        'Two actors load their own pages. Different pages do not share a thread of actions, so they can run together.',
        `await Promise.all([
  doctorPage.goto('/consults/42'),
  patientPage.goto('/consults/42'),
]);`,
      ],
      [
        'Either A or B',
        '`locator.or()` (v1.33) matches whichever shows first and keeps retrying. Do not reach for `Promise.race()`: the loser keeps running.',
        `const dashboard = page.getByRole('heading', { name: 'Dashboard' });
const consent = page.getByRole('dialog', { name: 'Consent' });
await expect(dashboard.or(consent)).toBeVisible();`,
      ],
      [
        'Best-effort cleanup',
        '`Promise.allSettled()` runs every cleanup even when one fails, then lets you decide what a failure means.',
        `const results = await Promise.allSettled([
  doctorContext.close(),
  patientContext.close(),
]);
const failed = results.filter((r) => r.status === 'rejected');
expect(failed).toHaveLength(0);`,
      ],
      [
        'Two actions on one page, run together <tag>Race</tag>',
        'A page handles one action at a time. Firing two together makes them race, and the order is not guaranteed.',
        `// Race: both actions drive the same page
await Promise.all([
  page.getByLabel('Name').fill('Patient A'),
  page.getByRole('button', { name: 'Save' }).click(),
]);

// Fix: one action at a time
await page.getByLabel('Name').fill('Patient A');
await page.getByRole('button', { name: 'Save' }).click();`,
        true,
      ],
    ],
  },
  {
    id: 'multi-user',
    title: 'Two or more browsers in one test',
    note: 'A telehealth consult needs a doctor and a patient at the same time. Each actor gets their own browser context, and the test talks to whichever one it needs.',
    cols: ['Scenario', 'Approach', 'Example'],
    rows: [
      [
        'One context per actor',
        'A context is an isolated browser profile with its own cookies and storage. Start each actor from a saved `storageState` so nobody logs in twice.',
        `const doctorContext = await browser.newContext({ storageState: 'auth/doctor.json' });
const patientContext = await browser.newContext({ storageState: 'auth/patient.json' });
const doctorPage = await doctorContext.newPage();
const patientPage = await patientContext.newPage();
try {
  await doctorPage.goto('/inbox');
  await patientPage.goto('/inbox');
} finally {
  await doctorContext.close();
  await patientContext.close();
}`,
      ],
      [
        'A fixture that hands out the actors',
        'Move the setup into a typed fixture. Tests ask for `doctorPage` and `patientPage`, and the fixture closes both after `await use()`, even when the test fails.',
        `import { test as base, Page } from '@playwright/test';

export const test = base.extend<{ doctorPage: Page; patientPage: Page }>({
  doctorPage: async ({ browser }, use) => {
    const context = await browser.newContext({ storageState: 'auth/doctor.json' });
    await use(await context.newPage());
    await context.close();
  },
  patientPage: async ({ browser }, use) => {
    const context = await browser.newContext({ storageState: 'auth/patient.json' });
    await use(await context.newPage());
    await context.close();
  },
});`,
      ],
      [
        '"Switching" between browsers',
        'There is no switch. Each actor is a `Page` variable, and the test uses whichever one the next step needs, in any order.',
        `await patientPage.getByRole('button', { name: 'Message the doctor' }).click();
await doctorPage.getByRole('link', { name: 'Inbox' }).click();
await patientPage.getByLabel('Message').fill('My rash is spreading');`,
      ],
      [
        '`bringToFront()` for focus-dependent features',
        'Pages do not need focus to be driven. Use `bringToFront()` only when the app itself reads focus or page visibility, such as a presence indicator.',
        `// The indicator listens to page visibility
await patientPage.bringToFront();
await expect(patientPage.getByRole('status')).toHaveText('Online');`,
      ],
      [
        'Both actors join at the same moment',
        'Two different pages, so `Promise.all()` is safe. Then assert on both sides, because each page has to see the other.',
        `await Promise.all([
  doctorPage.getByRole('button', { name: 'Join call' }).click(),
  patientPage.getByRole('button', { name: 'Join call' }).click(),
]);
await expect(doctorPage.getByText('2 participants')).toBeVisible();
await expect(patientPage.getByText('2 participants')).toBeVisible();`,
      ],
      [
        'A second browser engine for interop',
        'The `playwright` fixture launches another engine in the same test, for example a patient on Firefox and a doctor on the project browser.',
        `test('chat works across engines', async ({ browser, playwright }) => {
  const firefox = await playwright.firefox.launch();
  const patientContext = await firefox.newContext({ storageState: 'auth/patient.json' });
  const patientPage = await patientContext.newPage();
  const doctorPage = await browser.newPage();
  // ... the patient and the doctor talk to each other ...
  await doctorPage.close();
  await patientContext.close();
  await firefox.close();
});`,
      ],
      [
        'Close contexts in teardown, not at the end of the body',
        'If an assertion fails, the rest of the test body never runs, and the contexts stay open. A hook or fixture teardown always runs.',
        `let doctorContext: BrowserContext;
let patientContext: BrowserContext;

test.beforeEach(async ({ browser }) => {
  doctorContext = await browser.newContext({ storageState: 'auth/doctor.json' });
  patientContext = await browser.newContext({ storageState: 'auth/patient.json' });
});

test.afterEach(async () => {
  await doctorContext.close();
  await patientContext.close();
});`,
      ],
    ],
  },
  {
    id: 'handoffs',
    title: 'Hand-offs between actors',
    note: 'One actor does something, another has to see it. The waiting always happens on the receiving side, on what that user would see, never on time.',
    cols: ['Hand-off', 'How the other side waits', 'Example'],
    rows: [
      [
        'The patient sends a chat message',
        'The doctor page asserts the message appears with `toContainText()`. The assertion retries until the message arrives.',
        `await patientPage.getByLabel('Message').fill('The rash has spread');
await patientPage.getByRole('button', { name: 'Send' }).click();

await expect(doctorPage.getByRole('log')).toContainText('The rash has spread');`,
      ],
      [
        'The nurse hands a triage case to the doctor',
        'The doctor page watches the queue with `toHaveCount()`. Capture the queue first, act on the nurse page, then assert the new count.',
        `const queue = doctorPage.getByTestId('triage-queue').getByRole('listitem');
await expect(queue).toHaveCount(1);

await nursePage.getByRole('button', { name: 'Send to doctor' }).click();

await expect(queue).toHaveCount(2);`,
      ],
      [
        'The admin approves, the patient is waiting',
        'The patient page asserts its own status with `toHaveText()`. Nothing is passed between the pages: the shared state lives on the server.',
        `await adminPage.getByRole('button', { name: 'Approve booking' }).click();

await expect(patientPage.getByRole('status')).toHaveText('Booking confirmed');`,
      ],
      [
        'Two receptionists edit one appointment',
        'Both load the form first, both change it, and the second save must show the conflict. Each side asserts with `toContainText()` on its own page.',
        `await Promise.all([
  receptionistAPage.goto('/appointments/42/edit'),
  receptionistBPage.goto('/appointments/42/edit'),
]);
await receptionistAPage.getByLabel('Time').fill('10:30');
await receptionistBPage.getByLabel('Time').fill('11:00');

await receptionistAPage.getByRole('button', { name: 'Save' }).click();
await expect(receptionistAPage.getByRole('status')).toHaveText('Saved');

await receptionistBPage.getByRole('button', { name: 'Save' }).click();
await expect(receptionistBPage.getByRole('alert')).toContainText('changed by someone else');`,
      ],
      [
        'State only the backend knows, or a pushed message',
        '`expect.poll()` (v1.19) retries a function until it returns the value. For a pushed message, create the `framereceived` wait before the action that causes it.',
        `// Backend state: poll the API until the note is signed
await doctorPage.getByRole('button', { name: 'Sign note' }).click();
await expect.poll(async () => {
  const response = await request.get('/api/notes/42');
  return (await response.json()).status;
}).toBe('signed');

// A pushed message: socket is the WebSocket the patient page opened
const frame = socket.waitForEvent('framereceived');
await doctorPage.getByRole('button', { name: 'Start call' }).click();
await frame;`,
      ],
      [
        'A sleep between actors <tag>Avoid</tag>',
        'A fixed delay is a guess: too long on a good day, too short on a bad one. Wait for what the other user would see instead.',
        `// Avoid: a guess that depends on the machine
await patientPage.getByRole('button', { name: 'Send' }).click();
await doctorPage.waitForTimeout(3000);

// Instead: wait for the message itself
await patientPage.getByRole('button', { name: 'Send' }).click();
await expect(doctorPage.getByRole('log')).toContainText('The rash has spread');`,
        true,
      ],
    ],
  },
  {
    id: 'events',
    title: 'Events and listeners',
    note: 'Events do not wait for you. Register the listener before the action that fires the event, or you can miss it.',
    cols: ['Situation', 'Approach', 'Example'],
    rows: [
      [
        'Wait for a popup or download',
        'Create the `page.waitForEvent()` promise first, trigger the action, then await the promise. Use `context.waitForEvent()` for events on any page in the context.',
        `const popupPromise = page.waitForEvent('popup');
await page.getByRole('link', { name: 'Open lab report' }).click();
const popup = await popupPromise;
await expect(popup.getByRole('heading', { name: 'Lab report' })).toBeVisible();`,
      ],
      [
        'Handle one event, or every event',
        'Register with once to handle the next event only. Register with on to handle every event until you remove the listener.',
        `// once: only the next dialog
page.once('dialog', async (dialog) => {
  await dialog.accept();
});

// on: every dialog until the listener is removed
page.on('dialog', async (dialog) => {
  await dialog.dismiss();
});`,
      ],
      [
        'Async handlers',
        'Handlers can be async, but Playwright does not wait for them. If the test depends on what a handler does, wait for its result with a poll.',
        `let accepted = false;
page.on('dialog', async (dialog) => {
  await dialog.accept();
  accepted = true;
});
await page.getByRole('button', { name: 'Discharge patient' }).click();
await expect.poll(() => accepted).toBe(true);`,
      ],
      [
        'Collect console errors, assert at the end',
        'Gather the errors in an array while the test runs, and make one assertion at the end. A test that fails on the first error hides the others.',
        `const errors: string[] = [];
page.on('console', (message) => {
  if (message.type() === 'error') errors.push(message.text());
});
await page.goto('/chart');
await expect(page.getByRole('heading', { name: 'Chart' })).toBeVisible();
expect(errors).toEqual([]);`,
      ],
      [
        'Stop listening cleanly',
        "`removeAllListeners(type, { behavior: 'wait' })` waits for handlers that are still running before it returns, so none finish after the test ends.",
        `const finished: string[] = [];
page.on('response', async (response) => {
  await response.finished();
  finished.push(response.url());
});
await page.goto('/chart');
await page.removeAllListeners('response', { behavior: 'wait' });
expect(finished.length).toBeGreaterThan(0);`,
      ],
    ],
  },
  {
    id: 'structure',
    title: 'Helpers, fixtures and lint',
    note: 'Good structure makes the right thing the easy thing: awaitable helpers, setup in fixtures, and a linter that catches what review misses.',
    cols: ['Practice', 'Why', 'Example'],
    rows: [
      [
        'Page object methods are `async` and typed',
        'The return type tells every caller to await. A method that does browser work and returns `void` invites a floating promise.',
        `export class AppointmentPage {
  constructor(private readonly page: Page) {}

  async book(reason: string): Promise<void> {
    await this.page.getByLabel('Reason').fill(reason);
    await this.page.getByRole('button', { name: 'Book' }).click();
  }
}`,
      ],
      [
        'No `await` in a constructor',
        'A constructor cannot be async. Use a fixture, or a static `create()` that does the async work and returns the finished object.',
        `export class ConsultPage {
  private constructor(private readonly page: Page) {}

  static async create(page: Page, id: string): Promise<ConsultPage> {
    await page.goto('/consults/' + id);
    return new ConsultPage(page);
  }
}`,
      ],
      [
        '`test.extend()` fixtures set up, hand over, then tear down',
        'Everything after `await use()` runs when the test ends, pass or fail. That makes it the right place to clean up what the fixture created.',
        `export const test = base.extend<{ patientId: string }>({
  patientId: async ({ request }, use) => {
    const response = await request.post('/api/patients', { data: { name: 'Patient A' } });
    const { id } = await response.json();
    await use(id);
    await request.delete('/api/patients/' + id);
  },
});`,
      ],
      [
        '`test.step()` with `{ box: true }`',
        'A boxed step reports a failure at the call to your helper, not deep inside it. Reports stay readable when a helper is used in twenty tests.',
        `async function login(page: Page, role: string): Promise<void> {
  await test.step('Log in as ' + role, async () => {
    await page.goto('/login');
    await page.getByRole('button', { name: role }).click();
  }, { box: true });
}`,
      ],
      [
        'Unique data per worker with `test.info()`',
        'Parallel workers share one database. Build names from `parallelIndex` so two workers never create the same patient.',
        `const worker = test.info().parallelIndex;
const patientName = 'Patient W' + worker;
await page.getByLabel('Name').fill(patientName);`,
      ],
      [
        'One page shared across tests in a beforeAll hook <tag>Fragile</tag>',
        'A failure leaves the shared page in an unknown state, and every later test inherits it. Tests also cannot run in parallel on one page.',
        `// Fragile: one failure poisons every later test
let page: Page;
test.beforeAll(async ({ browser }) => {
  page = await browser.newPage();
});

// Better: a fresh page per test from the built-in fixture
test('books a visit', async ({ page }) => {
  await page.goto('/appointments');
});`,
        true,
      ],
      [
        'Lint rules that catch floating promises',
        'Review misses a missing await. A linter does not. These rules need typescript-eslint with type information and eslint-plugin-playwright.',
        `// eslint.config.mjs (rules only)
export default [
  {
    rules: {
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-misused-promises': 'error',
      '@typescript-eslint/await-thenable': 'error',
      'playwright/missing-playwright-await': 'error',
      'playwright/no-wait-for-timeout': 'error',
    },
  },
];`,
      ],
    ],
  },
  {
    id: 'summary',
    title: 'Summary',
    text: true,
    cols: ['Situation', 'Do this', 'Rule of thumb'],
    rows: [
      [
        'Any Playwright call',
        '`await` it',
        'A line that calls Playwright without `await` is a bug until proven otherwise',
      ],
      ['Waiting for something', 'Assert it with a web-first `expect`', "Assert, don't sleep"],
      [
        'An action triggers an event',
        'Register the wait first, then act',
        'Promise first, trigger second, await third',
      ],
      [
        'Several independent things',
        '`Promise.all()` across different pages',
        'Never two actions on one page at once',
      ],
      [
        'More than one user',
        'One context per actor, closed in teardown',
        'Whatever you open, close in a fixture or a hook',
      ],
    ],
  },
];

// Expose for tests via page.evaluate() (same rationale as window.categories)
window.asyncSections = SECTIONS;

// Column that holds method names, per section: those chips link back to the dashboard
const LINK_COLUMN = { parallel: 0, handoffs: 1, events: 1, structure: 0 };

renderGuide(SECTIONS, { linkColumns: LINK_COLUMN });
