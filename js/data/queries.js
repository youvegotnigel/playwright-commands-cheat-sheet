/** @type {import('./index.js').Category} */
export default {cat:'Query', cls:'query', color:'#3b82f6', items:[
{name:'locator()',
 level:'beginner',
 desc:'Finds elements using a CSS selector or XPath expression. The most flexible selector method.',
 tip:'Use when no semantic selector (getByRole, getByLabel) fits. Prefer semantic selectors, they are more readable and resilient to UI changes.',
 docs:'https://playwright.dev/docs/api/class-page#page-locator',
 code:`const btn = page.locator('#login');
await btn.click();

// CSS class selector
await page.locator('.nav-item.active').click();

// XPath
await page.locator('//button[text()="Submit"]').click();`},

{name:'getByRole()',
 level:'beginner',
 desc:'Finds an element by its ARIA role (button, heading, textbox, etc.) and optional accessible name. The most recommended selector.',
 tip:"The #1 recommended way to select elements. It mirrors how assistive technologies see the page and is resilient to style changes. Playwright v1.60 added a description option to also match an element's accessible description (aria-describedby text), useful when several elements share the same name.",
 docs:'https://playwright.dev/docs/api/class-page#page-get-by-role',
 code:`await page.getByRole('button', { name: 'Submit' }).click();
await page.getByRole('textbox', { name: 'Email' }).fill('test@mail.com');
await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();

// Disambiguate same-named elements by accessible description (v1.60+)
await page.getByRole('button', {
  name: 'Delete',
  description: 'Delete the current draft',
}).click();`},

{name:'getByText()',
 level:'beginner',
 desc:'Finds an element by its visible text content. Matches substrings by default.',
 tip:'Good for links, labels, and headings. Use exact: true for a strict full text match. For form inputs, prefer getByLabel().',
 docs:'https://playwright.dev/docs/api/class-page#page-get-by-text',
 code:`await page.getByText('Welcome back').click();

// Exact match only
await page.getByText('Submit', { exact: true }).click();`},

{name:'getByLabel()',
 level:'beginner',
 desc:'Finds a form input by the text of its associated label element. Highly recommended for form fields.',
 tip:'The most reliable way to find inputs. If your form has proper labels, this almost always beats using CSS selectors.',
 docs:'https://playwright.dev/docs/api/class-page#page-get-by-label',
 code:`await page.getByLabel('Email').fill('test@mail.com');
await page.getByLabel('Password').fill('secret');
await page.getByLabel('Remember me').check();`},

{name:'getByPlaceholder()',
 level:'beginner',
 desc:'Finds an input by its placeholder text. Useful when no label element is present.',
 tip:'Use as a fallback when getByLabel() is not available. Placeholder text can change, so getByLabel() or getByRole() is more stable long-term.',
 docs:'https://playwright.dev/docs/api/class-page#page-get-by-placeholder',
 code:`await page.getByPlaceholder('Search...').fill('Playwright');
await page.getByPlaceholder('Enter your email').fill('test@mail.com');`},

{name:'getByTestId()',
 level:'beginner',
 desc:'Finds an element by its data-testid attribute, test-specific selector that survives style and structure changes.',
 tip:'Best used when you control the codebase and can add data-testid attributes. Test IDs are invisible to design changes and very stable.',
 docs:'https://playwright.dev/docs/api/class-page#page-get-by-test-id',
 code:`await page.getByTestId('submit-btn').click();
await expect(page.getByTestId('error-msg')).toBeVisible();`},

{name:'getByAltText()',
 level:'intermediate',
 desc:'Finds an img or element with an alt attribute matching the given text.',
 tip:'Primarily for images. Use when you need to assert an image is present or click an image-based link.',
 docs:'https://playwright.dev/docs/api/class-page#page-get-by-alt-text',
 code:`await page.getByAltText('Company logo').click();
await expect(page.getByAltText('User avatar')).toBeVisible();`},

{name:'getByTitle()',
 level:'intermediate',
 desc:'Finds an element by its title attribute. The tooltip text shown on hover.',
 tip:'Useful for icon buttons that have a title but no visible label. Less common than other selectors.',
 docs:'https://playwright.dev/docs/api/class-page#page-get-by-title',
 code:`await page.getByTitle('Close dialog').click();
await expect(page.getByTitle('Settings')).toBeVisible();`},

{name:'frameLocator()',
 level:'advanced',
 desc:'Switches the locator context into an iframe so you can interact with elements inside it.',
 tip:'You must use frameLocator before any query inside an iframe. Normal locators cannot cross iframe boundaries.',
 docs:'https://playwright.dev/docs/api/class-page#page-frame-locator',
 code:`await page.frameLocator('#payment-frame')
  .getByLabel('Card number')
  .fill('4242 4242 4242 4242');`},

{name:'nth()',
 level:'intermediate',
 desc:'Picks the element at a specific index from a list of matches. Index starts at 0.',
 tip:'Use sparingly index-based selectors are brittle when list order changes. Prefer filter() with text or attribute checks when possible.',
 docs:'https://playwright.dev/docs/api/class-locator#locator-nth',
 code:`// Third item (index 2)
await page.locator('li').nth(2).click();

// Last item
await page.locator('li').last().click();`},

{name:'filter()',
 level:'intermediate',
 desc:'Narrows a set of matching elements by additional conditions like text content or the presence of a child element.',
 tip:'Combine with a broad locator to zero in on a specific item. Much more readable than complex CSS selectors.',
 docs:'https://playwright.dev/docs/api/class-locator#locator-filter',
 code:`// Find a list item containing "Active"
await page.locator('li').filter({ hasText: 'Active' }).click();

// Find a table row that contains "John", then click its button
await page.locator('tr').filter({
  has: page.locator('td', { hasText: 'John' })
}).locator('button').click();

// Filter to visible elements only (v1.51+)
await page.locator('.tooltip').filter({ visible: true }).click();`},

{name:'first() / last()',
 level:'beginner',
 desc:'Returns the first or last element from a set of matches. Cleaner aliases for .nth(0) and .nth(-1).',
 tip:'Prefer first() and last() over nth(0) for readability. Still index-based, so be aware of order changes in dynamic lists.',
 docs:'https://playwright.dev/docs/api/class-locator#locator-first',
 code:`// First matching element
await page.locator('li').first().click();

// Last matching element
await page.locator('li').last().click();

// Assert the last row has specific text
await expect(page.locator('tr').last()).toContainText('Total');`},

{name:'and()',
 level:'intermediate',
 desc:'Returns elements that match both this locator AND another locator. Narrows results by combining two conditions with AND logic.',
 tip:'Use when you need two independent conditions on the same element: e.g. a button that is both visible and has a specific label.',
 docs:'https://playwright.dev/docs/api/class-locator#locator-and',
 code:`// Find a button that is also disabled
const disabledSubmit = page.getByRole('button', { name: 'Submit' })
  .and(page.locator(':disabled'));
await expect(disabledSubmit).toBeVisible();`},

{name:'or()',
 level:'intermediate',
 desc:'Returns elements matching either this locator OR another locator. Useful when an element can appear in two different ways.',
 tip:'Good for handling UI states where the same action might appear as a button or a link depending on context.',
 docs:'https://playwright.dev/docs/api/class-locator#locator-or',
 code:`// Handle a UI that shows either a "Sign in" button or a "Log in" link
const signIn = page.getByRole('button', { name: 'Sign in' })
  .or(page.getByRole('link', { name: 'Log in' }));
await signIn.first().click();`},

{name:'describe()',
 level:'intermediate',
 desc:'Attaches a human-readable description to a locator. The description appears in the trace viewer, HTML report, and error messages instead of the raw selector.',
 tip:'Added in Playwright v1.53. Use it to make traces and failures readable, especially for complex chained or filtered locators. It returns the same locator, so you can chain actions directly.',
 docs:'https://playwright.dev/docs/api/class-locator#locator-describe',
 code:`// Without describe: report shows the raw selector
await page.getByTestId('btn-sub').click();

// With describe: report shows "Subscribe button"
await page.getByTestId('btn-sub')
  .describe('Subscribe button')
  .click();

// Especially useful for complex locators
const row = page.getByRole('row')
  .filter({ hasText: 'John' })
  .describe('Johns table row');
await row.getByRole('button', { name: 'Delete' }).click();`},

{name:'locator.locator()',
 level:'intermediate',
 desc:'Chains from an existing locator to find elements inside it. Scopes the search to the descendants of the current locator, keeping selectors short and resilient.',
 tip:"Chain locators to narrow down within a container instead of writing one long selector. Use ':scope > ' for direct children only, and 'xpath=..' to step up to the parent (Playwright has no parent() method).",
 docs:'https://playwright.dev/docs/api/class-locator#locator-locator',
 code:`// Find an input inside a specific form
await page.locator('form#signup').locator('input[name=email]').fill('a@b.com');

// Direct children only, via :scope
const topLevel = page.locator('ul.menu').locator(':scope > li');

// Step up to the parent element (there is no parent() method)
const row = page.getByText('Total').locator('xpath=..');`},

{name:'locator.getByRole()',
 level:'intermediate',
 desc:'Runs a getByRole query (or any getBy* method) scoped to the descendants of an existing locator instead of the whole page.',
 tip:'Every getBy* method (getByRole, getByText, getByLabel, and so on) also exists on a locator. Scope them to a container to target the right element when the same role appears many times on the page.',
 docs:'https://playwright.dev/docs/api/class-locator#locator-get-by-role',
 code:`// Click the "Delete" button inside one specific card
const card = page.getByRole('listitem').filter({ hasText: 'Invoice #42' });
await card.getByRole('button', { name: 'Delete' }).click();

// Scope a link search to the navigation only
const links = await page.locator('nav').getByRole('link').allTextContents();`},
]};
