/** @type {import('./index.js').Category} */
export default {cat:'Action', cls:'action', color:'#22c55e', items:[
{name:'click()',
 level:'beginner',
 desc:'Clicks an element. Playwright automatically scrolls it into view and waits for it to be actionable before clicking.',
 tip:"No need to manually scroll or wait. Playwright handles it. For double-click use dblclick(). For right-click, pass { button: 'right' }.",
 docs:'https://playwright.dev/docs/api/class-locator#locator-click',
 code:`await page.locator('#login').click();

// Right-click
await page.locator('#item').click({ button: 'right' });

// Click while holding Ctrl
await page.locator('#item').click({ modifiers: ['Control'] });`},

{name:'fill()',
 level:'beginner',
 desc:'Sets the value of an input, textarea, or content editable element instantly. Clears any existing content first.',
 tip:"Preferred over type() for most cases. It is faster and more reliable. Use type() only when testing keystroke-by-keystroke behaviour like autocomplete.",
 docs:'https://playwright.dev/docs/api/class-locator#locator-fill',
 code:`await page.getByLabel('Email').fill('test@mail.com');

// Fill then submit with keyboard
await page.getByLabel('Search').fill('Playwright');
await page.keyboard.press('Enter');`},

{name:'press()',
 level:'beginner',
 desc:'Simulates pressing a key on a focused element. Supports named keys: Enter, Tab, Escape, ArrowDown, and more.',
 tip:'Use for submitting forms with Enter, moving focus with Tab, or dismissing with Escape. For global shortcuts use keyboard.press().',
 docs:'https://playwright.dev/docs/api/class-locator#locator-press',
 code:`// Submit a form
await page.locator('#search').press('Enter');

// Move focus to the next field
await page.locator('#email').press('Tab');`},

{name:'check()',
 level:'beginner',
 desc:'Checks a checkbox or radio button. Does nothing if it is already checked.',
 tip:'More semantic than click() for checkboxes. It guarantees the element ends up checked regardless of its current state.',
 docs:'https://playwright.dev/docs/api/class-locator#locator-check',
 code:`await page.locator('#terms').check();
await page.getByLabel('Subscribe to newsletter').check();`},

{name:'uncheck()',
 level:'beginner',
 desc:'Unchecks a checkbox. Does nothing if it is already unchecked.',
 tip:'Use instead of click() to ensure the checkbox ends up unchecked. Safe to call even if already unchecked.',
 docs:'https://playwright.dev/docs/api/class-locator#locator-uncheck',
 code:`await page.locator('#newsletter').uncheck();
await page.getByLabel('Remember me').uncheck();`},

{name:'selectOption()',
 level:'beginner',
 desc:'Selects one or more options in a select dropdown by value, visible label text, or index.',
 tip:'Can select by value, visible text (label), or index. Pass an array for multi-select dropdowns.',
 docs:'https://playwright.dev/docs/api/class-locator#locator-select-option',
 code:`// By value attribute
await page.locator('select#country').selectOption('ca');

// By visible label text
await page.locator('select').selectOption({ label: 'Canada' });

// Multi-select
await page.locator('select#tags').selectOption(['news', 'sport']);`},

{name:'hover()',
 level:'intermediate',
 desc:'Moves the mouse over an element, triggering hover states and revealing any related dropdowns or tooltips.',
 tip:'Use when a menu or tooltip only appears on hover. Playwright waits for the element to be visible before hovering.',
 docs:'https://playwright.dev/docs/api/class-locator#locator-hover',
 code:`// Hover to reveal a dropdown menu
await page.locator('#nav-menu').hover();
await page.getByRole('link', { name: 'Settings' }).click();`},

{name:'dblclick()',
 level:'intermediate',
 desc:'Double-clicks an element. Used for actions like entering edit mode on a table cell or selecting a word in text.',
 tip:'Only use when the feature explicitly requires a double-click. For regular interactions, use click().',
 docs:'https://playwright.dev/docs/api/class-locator#locator-dbl-click',
 code:`// Double-click a cell to enter edit mode
await page.locator('td.editable').dblclick();
await page.locator('td.editable input').fill('new value');`},

{name:'pressSequentially()',
 level:'intermediate',
 desc:'Types text character by character, firing keyboard events for each key. The modern replacement for the deprecated type().',
 tip:'Use fill() for most cases. It is faster and more reliable. Use pressSequentially() only when the input reacts to individual keystrokes (autocomplete, live validation, character counters).',
 docs:'https://playwright.dev/docs/api/class-locator#locator-press-sequentially',
 code:`// Slow typing to trigger autocomplete suggestions
await page.locator('#search').pressSequentially('Play', { delay: 100 });
await page.getByRole('option', { name: 'Playwright' }).click();`},

{name:'clear()',
 level:'beginner',
 desc:'Clears the current value of an input or textarea.',
 tip:'fill() clears automatically before typing. Use clear() when you want to empty a field without immediately filling it with new content.',
 docs:'https://playwright.dev/docs/api/class-locator#locator-clear',
 code:`await page.locator('#search').clear();

await page.getByLabel('Name').clear();
await expect(page.getByLabel('Name')).toHaveValue('');`},

{name:'dragTo()',
 level:'advanced',
 desc:'Drags an element and drops it onto a target element, handling the full mousedown, mousemove, mouseup sequence.',
 tip:'Works for most drag-and-drop implementations. For complex custom DnD libraries you may need mouse.move() steps manually.',
 docs:'https://playwright.dev/docs/api/class-locator#locator-drag-to',
 code:`await page.locator('#drag-item').dragTo(page.locator('#drop-zone'));`},

{name:'setInputFiles()',
 level:'intermediate',
 desc:'Uploads one or more files to a file input element without opening the OS file picker dialog.',
 tip:'Handles file uploads programmatically, no dialog needed. Path is relative to the project root. Pass an array for multiple files.',
 docs:'https://playwright.dev/docs/api/class-locator#locator-set-input-files',
 code:`// Single file
await page.locator('input[type=file]').setInputFiles('tests/fixtures/doc.pdf');

// Multiple files
await page.locator('input[type=file]').setInputFiles([
  'tests/fixtures/a.png',
  'tests/fixtures/b.png'
]);`},

{name:'scrollIntoView()',
 level:'intermediate',
 desc:'Scrolls the page until the element is visible in the viewport. Useful for elements below the fold.',
 tip:'Most Playwright actions scroll automatically. Use this explicitly when you need the element visible before taking a screenshot.',
 docs:'https://playwright.dev/docs/api/class-locator#locator-scroll-into-view-if-needed',
 code:`await page.locator('#footer-section').scrollIntoViewIfNeeded();
await page.screenshot({ path: 'footer.png' });`},

{name:'keyboard.press()',
 level:'intermediate',
 desc:'Sends a global keyboard shortcut to the page, not tied to any specific element.',
 tip:'Use for global shortcuts like Ctrl+S, Ctrl+Z, or Escape. For element-specific key presses, use locator.press() instead.',
 docs:'https://playwright.dev/docs/api/class-keyboard#keyboard-press',
 code:`await page.keyboard.press('Control+A');  // Select all
await page.keyboard.press('Control+Z');  // Undo
await page.keyboard.press('Escape');     // Close modal`},

{name:'tap()',
 level:'intermediate',
 desc:'Simulates a touch tap on an element. Use when testing mobile viewport sizes or touch-enabled interactions.',
 tip:'Requires the browser context to be created with hasTouch: true, or set via use: { hasTouch: true } in playwright.config.ts.',
 docs:'https://playwright.dev/docs/api/class-locator#locator-tap',
 code:`// Enable touch in config: use: { hasTouch: true }
await page.goto('/mobile-menu');
await page.locator('#hamburger').tap();
await expect(page.locator('#nav-drawer')).toBeVisible();`},

{name:'focus()',
 level:'intermediate',
 desc:'Moves keyboard focus to an element without clicking it. Triggers focus-related events and styles.',
 tip:'Useful for testing focus states, keyboard navigation, and tooltip-on-focus behaviour without triggering a click.',
 docs:'https://playwright.dev/docs/api/class-locator#locator-focus',
 code:`await page.getByLabel('Email').focus();
await expect(page.locator('.email-tooltip')).toBeVisible();

// Check focus is applied
await page.getByRole('button', { name: 'Submit' }).focus();
await expect(page.getByRole('button', { name: 'Submit' })).toBeFocused();`},

{name:'dispatchEvent()',
 level:'advanced',
 desc:'Fires a custom DOM event on an element directly. Useful when standard interaction methods cannot trigger framework-specific events.',
 tip:'Use as a last resort when click() or fill() do not trigger the event your app is listening for (e.g. custom React/Vue events).',
 docs:'https://playwright.dev/docs/api/class-locator#locator-dispatch-event',
 code:`// Fire a custom 'change' event on an input
await page.locator('#custom-input').dispatchEvent('change');

// Fire a drop event
await page.locator('#drop-zone').dispatchEvent('drop', {
  dataTransfer: await page.evaluateHandle(() => new DataTransfer())
});`},
]};
