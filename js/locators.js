// =============================================================
// locators.js — content of the Locator guide (locators.html).
// SECTIONS is the content source: edit it here to change the page.
// js/guide.js renders it.
// =============================================================

import { renderGuide } from './guide.js';

const SECTIONS = [
  {
    id: 'ladder',
    title: 'The locator priority ladder',
    note: 'Use the highest rung that uniquely matches. Lower rungs are not wrong, they just break more often.',
    cols: ['Locator', 'Use it when', 'Real-world example'],
    rows: [
      [
        '`getByRole()`',
        "The default. It finds elements the way assistive technology does, by role and accessible name. If it can't find a control, that is often an accessibility bug.",
        `await page.getByRole('button', { name: 'Book appointment' }).click();`,
      ],
      [
        '`getByLabel()`',
        'Form fields. It matches the `<label>`, `aria-labelledby` or `aria-label` text, so it also proves the field is labelled.',
        `await page.getByLabel('Date of birth').fill('1984-03-12');`,
      ],
      [
        '`getByPlaceholder()`',
        'Inputs with no label, such as a search box. A placeholder is a weak label, so ask for a real one.',
        `await page.getByPlaceholder('Search patients').fill('Okafor');`,
      ],
      [
        '`getByText()`',
        'Non-interactive content: messages, paragraphs, list items. For buttons and links, use `getByRole()` with a name.',
        `await expect(page.getByText('Appointment confirmed')).toBeVisible();`,
      ],
      [
        '`getByAltText()`',
        'Images, and image-like elements with an `alt` attribute.',
        `await expect(page.getByAltText('Chest X-ray, 12 March')).toBeVisible();`,
      ],
      [
        '`getByTitle()`',
        'Elements whose only text is a `title` attribute, such as an icon with a tooltip. Rare in well-built apps.',
        `await expect(page.getByTitle('Allergy alert')).toBeVisible();`,
      ],
      [
        '`getByTestId()`',
        'No stable user-facing hook exists. Test IDs survive copy and layout changes, but users never see them, so they prove nothing about accessibility. Agree them with developers as a contract.',
        `await page.getByTestId('patient-summary-card').click();`,
      ],
      [
        '`locator(css)` <tag>Last resort</tag>',
        "Nothing above works, such as a third-party widget you can't change. Tie it to stable attributes, never styling classes, and comment why.",
        `// Vendor date picker: no roles or labels to use
await page.locator('[data-date="2026-11-20"]').click();`,
        true,
      ],
    ],
  },
  {
    id: 'role-options',
    title: 'Making role locators precise',
    note: 'Options keep a role locator unique without falling back to CSS.',
    cols: ['Option', 'What it does', 'Example'],
    rows: [
      [
        '`name`',
        "Matches the accessible name. By default it is case-insensitive and matches a substring, so `'Save'` also matches Save draft.",
        `await page.getByRole('button', { name: 'Save' }).click();`,
      ],
      [
        '`exact: true`',
        'Case-sensitive, whole-string match (whitespace is still trimmed). Use it when one name is part of another.',
        `await page.getByRole('button', { name: 'Save', exact: true }).click();`,
      ],
      [
        '`name` as a regex',
        'Matches a pattern, for names with an optional or changing part.',
        `await expect(
  page.getByRole('link', { name: /^Dr\\.? Okafor$/ }),
).toBeVisible();`,
      ],
      [
        '`level`',
        'Heading level, 1 to 6. Tells the page title apart from a section heading with the same text.',
        `await expect(
  page.getByRole('heading', { name: 'Appointments', level: 1 }),
).toBeVisible();`,
      ],
      [
        '`checked`, `pressed`, `expanded`, `selected`',
        'Match ARIA state, so the locator itself says which element you mean.',
        `await page.getByRole('checkbox', { name: 'SMS reminders', checked: false }).check();
await page.getByRole('tab', { name: 'History', selected: false }).click();`,
      ],
      [
        '`disabled`',
        'Matches disabled elements, native `disabled` or `aria-disabled`. To check one element, assert `toBeDisabled()` instead.',
        `const locked = page.getByRole('textbox', { disabled: true });
await expect(locked).toHaveCount(2);`,
      ],
      [
        '`includeHidden`',
        'Also matches elements hidden from assistive technology. It is off by default, so a test fails when content is hidden from users.',
        `await expect(
  page.getByRole('dialog', { name: 'Session timeout', includeHidden: true }),
).toBeAttached();`,
      ],
      [
        '`description` (v1.60+)',
        'Matches the accessible description, for example from `aria-describedby`. Tells apart buttons with the same name.',
        `await page
  .getByRole('button', { name: 'Cancel', description: 'Appointment on 20 November' })
  .click();`,
      ],
    ],
  },
  {
    id: 'narrowing',
    title: 'Scoping and filtering',
    note: 'Narrow by what the user sees around an element, not by where it sits in the DOM.',
    cols: ['Method', 'Use it when', 'Example'],
    rows: [
      [
        'Chaining: `locator.getByRole()`',
        'The element lives inside a region, such as a dialog, form or card. Scope to the region first, then locate inside it.',
        `const dialog = page.getByRole('dialog', { name: 'Reschedule' });
await dialog.getByRole('button', { name: 'Confirm' }).click();`,
      ],
      [
        '`filter({ hasText })`',
        'Picking one of many similar items by text anywhere inside it.',
        `await page
  .getByRole('listitem')
  .filter({ hasText: 'Amara Okafor' })
  .getByRole('button', { name: 'View record' })
  .click();`,
      ],
      [
        '`filter({ has })`',
        'Picking items by an element inside them, such as a badge or a button.',
        `const urgent = page.getByRole('row').filter({
  has: page.getByText('Urgent'),
});
await expect(urgent).toHaveCount(3);`,
      ],
      [
        '`filter({ hasNot })`, `filter({ hasNotText })`',
        'Excluding items: rows without a badge, appointments that are not cancelled.',
        `const active = page.getByRole('row').filter({ hasNotText: 'Cancelled' });
await expect(active).toHaveCount(4);`,
      ],
      [
        '`visible()` (v1.63+)',
        'Only visible matches, such as the open copy of a menu that also exists hidden in the DOM. It replaces the `:visible` pseudo-class.',
        `await page.getByText('Print summary').visible().click();`,
      ],
      [
        '`within()` (v1.64+)',
        'You already have two locators and want one inside the other, read in natural order.',
        `const form = page.getByRole('form', { name: 'New patient' });
await page.getByLabel('Postcode').within(form).fill('AB1 2CD');`,
      ],
      [
        '`and()`',
        'Both conditions must hold on the same element, such as a role and a title.',
        `const save = page
  .getByRole('button', { name: 'Save' })
  .and(page.getByTitle('Save clinical notes'));
await save.click();`,
      ],
      [
        '`or()`',
        'Exactly one of two things appears, such as a setup screen on first sign-in or the dashboard after it.',
        `const setup = page.getByRole('heading', { name: 'Set up two-factor sign-in' });
const today = page.getByRole('heading', { name: "Today's appointments" });
await expect(setup.or(today)).toBeVisible();
if (await setup.isVisible()) {
  await page.getByRole('button', { name: 'Skip for now' }).click();
}`,
      ],
      [
        '`first()`, `last()`, `nth()` <tag>Fragile</tag>',
        'They pick by position, so a new row or a re-sort silently changes the target. Use them only when order is the point (see Lists). Otherwise narrow by content.',
        `// Breaks when a new appointment is added at the top
await page.getByRole('row').nth(1).click();`,
        true,
      ],
    ],
  },
  {
    id: 'lists',
    title: 'Lists, tables and repeated items',
    note: 'Assert the list first, then act on it.',
    cols: ['Task', 'Approach', 'Example'],
    rows: [
      [
        'Act on the row that contains a value',
        '`filter({ hasText })` on the row, then locate inside it',
        `await page
  .getByRole('row')
  .filter({ hasText: 'MRN 104233' })
  .getByRole('button', { name: 'Check in' })
  .click();`,
      ],
      [
        'Read a whole column',
        '`within()` resolves `nth()` inside each row (v1.64+)',
        `const times = page.getByRole('cell').nth(1).within(page.getByRole('row'));
await expect(times).toHaveText(['09:00', '09:30', '10:15']);`,
      ],
      [
        'Assert how many items there are',
        '`toHaveCount()` retries until the count matches',
        `const results = page
  .getByRole('list', { name: 'Search results' })
  .getByRole('listitem');
await expect(results).toHaveCount(5);`,
      ],
      [
        "Assert every item's text, in order",
        '`toHaveText([...])` with an array checks count, order and text in one retrying assertion',
        `await expect(
  page.getByRole('list', { name: 'Medications' }).getByRole('listitem'),
).toHaveText(['Amoxicillin', 'Ibuprofen', 'Metformin']);`,
      ],
      [
        'Loop over items',
        "`toHaveCount()` first, then `all()`. `all()` doesn't wait, so on a list that is still loading it returns too few items",
        `const overdue = page.getByRole('row').filter({ hasText: 'Overdue' });
await expect(overdue).toHaveCount(3);
for (const row of await overdue.all()) {
  await expect(row.getByRole('button', { name: 'Send reminder' })).toBeEnabled();
}`,
      ],
      [
        'Pick by position, when order is the point',
        '`first()`, `last()` or `nth()` on a list you have sorted on purpose',
        `await page.getByRole('columnheader', { name: 'Date' }).click();
await expect(page.getByRole('row').last()).toContainText('20 Nov 2026');`,
      ],
    ],
  },
  {
    id: 'boundaries',
    title: 'Frames, shadow DOM and new tabs',
    cols: ['Situation', 'Approach', 'Example'],
    rows: [
      [
        'Content inside an iframe',
        '`frameLocator()`, then locate as usual inside it',
        `const video = page.frameLocator('iframe[title="Video consultation"]');
await video.getByRole('button', { name: 'Join call' }).click();`,
      ],
      [
        'You already have a locator for the iframe',
        '`contentFrame()` turns it into a frame locator',
        `const viewer = page.getByTitle('Lab results viewer').contentFrame();
await expect(viewer.getByRole('heading', { name: 'Full blood count' })).toBeVisible();`,
      ],
      [
        'Open shadow DOM (web components)',
        'Nothing extra: `getBy*` locators and CSS pierce open shadow roots automatically',
        `// <patient-search> renders its input inside a shadow root
await page.getByRole('searchbox', { name: 'Find patient' }).fill('Okafor');`,
      ],
      [
        "XPath inside shadow DOM <tag>Doesn't pierce</tag>",
        'XPath never enters shadow roots, so it finds nothing. Switch to a role or text locator.',
        `// Finds nothing: the button is inside <triage-panel>'s shadow root
await page.locator('xpath=//button[@id="escalate"]').click();

// Use instead
await page.getByRole('button', { name: 'Escalate' }).click();`,
        true,
      ],
      [
        'Closed shadow DOM',
        'Not supported. Test through what the host element exposes: its attributes, events and visible output.',
        `// <secure-pin-pad> uses a closed shadow root
const pinPad = page.locator('secure-pin-pad');
await expect(pinPad).toHaveAttribute('status', 'locked');`,
      ],
      [
        'A link opens a new tab or popup',
        "Start waiting with `page.waitForEvent('popup')` before the click, then locate in the new page (see Explicit waits in the Waiting guide)",
        `const popupPromise = page.waitForEvent('popup');
await page.getByRole('link', { name: 'Open discharge letter' }).click();
const letter = await popupPromise;
await expect(letter.getByRole('heading', { name: 'Discharge summary' })).toBeVisible();`,
      ],
    ],
  },
  {
    id: 'strictness',
    title: 'Strict mode and readable failures',
    note: 'Actions and assertions need exactly one element. Treat a strict mode error as a question about your locator.',
    cols: ['Situation', 'What to do', 'Example'],
    rows: [
      [
        'Error: strict mode violation, locator resolved to 2 elements',
        "The locator is ambiguous. Narrow it with role options, a filter or a scope. Don't reach for `first()`: it hides the ambiguity and acts on whichever element comes first.",
        `// Two Delete buttons, one per allergy
await page
  .getByRole('listitem')
  .filter({ hasText: 'Penicillin' })
  .getByRole('button', { name: 'Delete' })
  .click();`,
      ],
      [
        '`describe()` for readable traces and reports',
        'Long chains read badly in traces, reports and error messages. A description names the intent.',
        `const checkIn = page
  .getByRole('row')
  .filter({ hasText: 'MRN 104233' })
  .getByRole('button', { name: 'Check in' })
  .describe('Check-in button for MRN 104233');
await checkIn.click();`,
      ],
      [
        'See what Playwright sees: `ariaSnapshot()`, `toMatchAriaSnapshot()`',
        "When a role locator finds nothing, print the accessibility tree to see the real roles and names. Pin a region's structure with `toMatchAriaSnapshot()`.",
        `console.log(await page.getByRole('main').ariaSnapshot());

await expect(page.getByRole('navigation')).toMatchAriaSnapshot(\`
  - link "Patients"
  - link "Appointments"
\`);`,
      ],
      [
        '`getByRef()` (v1.64+) <tag>Not for tests</tag>',
        'Refs like `e2` come from an AI-mode aria snapshot and change with every snapshot. They suit an agent driving a live page, never a committed test.',
        `// Agent tooling only: refs resolve against the latest snapshot
await page.ariaSnapshot({ mode: 'ai' });
await page.getByRef('e2').click();`,
        true,
      ],
    ],
  },
  {
    id: 'fragile',
    title: 'Fragile vs robust locators',
    note: 'Each fragile locator passes today and fails after an unrelated change.',
    cols: ['Pattern', 'Why it breaks', 'Fragile vs robust'],
    rows: [
      [
        'CSS class chains',
        'Classes are for styling. A redesign or a CSS-in-JS rebuild renames them.',
        `// Fragile
await page.locator('.card.card--primary > .btn.btn-lg').click();

// Robust
await page.getByRole('button', { name: 'Start consultation' }).click();`,
        true,
      ],
      [
        '`nth-child` and positional CSS',
        'A new row, banner or wrapper shifts every position.',
        `// Fragile
await page.locator('table tr:nth-child(3) td:nth-child(5) button').click();

// Robust
await page
  .getByRole('row')
  .filter({ hasText: 'Amara Okafor' })
  .getByRole('button', { name: 'Edit' })
  .click();`,
        true,
      ],
      [
        'Absolute XPath',
        'It encodes the whole DOM path, so any change above the element breaks it.',
        `// Fragile
await page.locator('xpath=/html/body/div[2]/main/form/div[3]/input').fill('Okafor');

// Robust
await page.getByLabel('Surname').fill('Okafor');`,
        true,
      ],
      [
        'Text that includes dynamic data',
        'Dates, counts and names change between runs and environments.',
        `// Fragile
await expect(page.getByText('You have 3 appointments on 7 November')).toBeVisible();

// Robust
await expect(page.getByText(/You have \\d+ appointments/)).toBeVisible();`,
        true,
      ],
      [
        '`page.$()` and ElementHandles',
        "A handle points at one DOM node and goes stale when the page re-renders. It doesn't auto-wait or retry.",
        `// Fragile
const button = await page.$('#submit');
await button.click();

// Robust
await page.getByRole('button', { name: 'Submit referral' }).click();`,
        true,
      ],
      [
        'Legacy `text=` and `>>` selectors',
        'Old selector-engine syntax: hard to read and not idiomatic. Locator methods replace it.',
        `// Fragile
await page.locator('text=Patients >> text=Amara Okafor').click();

// Robust
await page
  .getByRole('region', { name: 'Patients' })
  .getByText('Amara Okafor')
  .click();`,
        true,
      ],
      [
        'The `:visible` pseudo-class',
        'It only works in CSS selectors and is easy to miss in a long one. `visible()` (v1.63+) says the same thing as a method.',
        `// Fragile
await page.locator('button:visible', { hasText: 'Print' }).click();

// Robust
await page.getByRole('button', { name: 'Print' }).visible().click();`,
        true,
      ],
    ],
  },
  {
    id: 'team',
    title: 'Team practices for a stable suite',
    cols: ['Practice', 'Why', 'Example'],
    rows: [
      [
        'Agree a `testIdAttribute` with developers',
        'One attribute name, documented, never reused for styling or analytics. Developers then know not to rename it.',
        `// playwright.config.ts
export default defineConfig({
  use: { testIdAttribute: 'data-qa' },
});`,
      ],
      [
        'Define locators once, in page objects',
        'A label change is one edit, not fifty, and specs read as user intent.',
        `export class AppointmentPage {
  readonly bookButton: Locator;

  constructor(private readonly page: Page) {
    this.bookButton = page.getByRole('button', { name: 'Book appointment' });
  }

  async book(slot: string): Promise<void> {
    await this.page.getByRole('radio', { name: slot }).check();
    await this.bookButton.click();
  }
}`,
      ],
      [
        'Fix accessibility instead of working around it',
        "If a role or label locator can't find a control, screen reader users can't either. A missing label is a bug: raise it.",
        `// Instead of page.locator('.icon-btn.trash'), ask for
// <button aria-label="Remove allergy">
await page.getByRole('button', { name: 'Remove allergy' }).click();`,
      ],
      [
        'Lint for raw locators',
        '`eslint-plugin-playwright` catches fragile locators in review, before they reach the main branch.',
        `// eslint.config.js
rules: {
  'playwright/prefer-native-locators': 'error',
  'playwright/no-raw-locators': 'warn',
  'playwright/no-nth-methods': 'warn',
  'playwright/no-element-handle': 'error',
},`,
      ],
      [
        'Pick locators with tools: `codegen`, UI mode, trace viewer',
        'Pick locator in UI mode, the trace viewer and the VS Code extension suggests the locator Playwright would choose, starting from the top of the ladder.',
        `// In a test: pause, then use Pick locator in the Inspector
await page.pause();

// Or record a whole flow from the terminal:
// npx playwright codegen localhost:3000/patients`,
      ],
    ],
  },
  {
    id: 'summary',
    title: 'Summary',
    text: true,
    cols: ['Category', 'Locators', 'Rule of thumb'],
    rows: [
      [
        'User-facing',
        '`getByRole`, `getByLabel`, `getByPlaceholder`, `getByText`, `getByAltText`, `getByTitle`',
        'Your first choice',
      ],
      ['Contract', '`getByTestId`', 'When no user-facing hook is stable'],
      [
        'Structural',
        '`locator()` with CSS or XPath',
        'Last resort, with a comment saying why',
        true,
      ],
      ['Positional', '`nth`, `first`, `last`', 'Only when order is the point'],
    ],
  },
];

// Expose for tests via page.evaluate() (same rationale as window.categories)
window.locatorSections = SECTIONS;

// Column that holds method names, per section: those chips link back to the dashboard
const LINK_COLUMN = { ladder: 0, narrowing: 0, lists: 1, boundaries: 1, strictness: 0, team: 0 };

renderGuide(SECTIONS, { linkColumns: LINK_COLUMN });
