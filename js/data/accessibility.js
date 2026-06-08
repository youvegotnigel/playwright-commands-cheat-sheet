/** @type {import('./index.js').Category} */
export default {cat:'Accessibility', cls:'accessibility', color:'#10b981', items:[
{name:'toMatchAriaSnapshot()',
 level:'intermediate',
 desc:'Asserts the ARIA structure of an element matches a YAML snapshot. Captures roles, names, and states in a human-readable format.',
 tip:'Run with --update-snapshots to generate the baseline. Commit the snapshot files. Great for catching unintended ARIA regressions. Added in v1.50.',
 docs:'https://playwright.dev/docs/aria-snapshots',
 code:`// Generate snapshot on first run: npx playwright test --update-snapshots
await expect(page.locator('nav')).toMatchAriaSnapshot(\`
  - navigation:
    - link "Home"
    - link "Products"
    - link "Contact"
\`);`},

{name:'toHaveAccessibleName()',
 level:'intermediate',
 desc:'Asserts that an element has the expected accessible name, the label announced by screen readers.',
 tip:'Use to verify that icon-only buttons, images, and form fields have meaningful accessible names for screen reader users.',
 docs:'https://playwright.dev/docs/api/class-locatorassertions#locator-assertions-to-have-accessible-name',
 code:`await expect(page.getByRole('button', { name: 'Close' }))
  .toHaveAccessibleName('Close dialog');

// Icon button with no visible label
await expect(page.locator('#delete-btn')).toHaveAccessibleName('Delete item');`},

{name:'toHaveAccessibleDescription()',
 level:'intermediate',
 desc:'Asserts the accessible description of an element in the supplementary text announced by screen readers (from the aria-described by attribute).',
 tip:'Use to verify that help text, error messages, and tooltips are correctly linked to their inputs via the aria-described by attribute.',
 docs:'https://playwright.dev/docs/api/class-locatorassertions#locator-assertions-to-have-accessible-description',
 code:`await expect(page.getByLabel('Password'))
  .toHaveAccessibleDescription('Must be at least 8 characters');`},

{name:'toHaveAccessibleErrorMessage()',
 level:'intermediate',
 desc:'Asserts the accessible error message of an invalid form field in the text linked via aria-errormessage. Added in v1.50.',
 tip:'Use when testing form validation. Verifies that errors are properly exposed to assistive technologies, not just visible on screen.',
 docs:'https://playwright.dev/docs/api/class-locatorassertions#locator-assertions-to-have-accessible-error-message',
 code:`// Submit an invalid form and check the error is accessible
await page.getByRole('button', { name: 'Submit' }).click();
await expect(page.getByLabel('Email'))
  .toHaveAccessibleErrorMessage('Please enter a valid email address');`},

{name:'toHaveRole()',
 level:'intermediate',
 desc:'Asserts that an element has the specified ARIA role. Checks the implicit or explicit role exposed to assistive technologies.',
 tip:'Use to verify that custom components correctly expose their role. A div styled as a button should have role="button".',
 docs:'https://playwright.dev/docs/api/class-locatorassertions#locator-assertions-to-have-role',
 code:`await expect(page.locator('#save-btn')).toHaveRole('button');
await expect(page.locator('nav')).toHaveRole('navigation');
await expect(page.locator('.alert')).toHaveRole('alert');`},

{name:'locator.ariaSnapshot()',
 level:'advanced',
 desc:'Returns the ARIA structure of an element as a YAML string. Use to inspect the accessibility tree during test development.',
 tip:'Call this when authoring a toMatchAriaSnapshot() test to copy the output as your baseline. Shows what screen readers see.',
 docs:'https://playwright.dev/docs/aria-snapshots#generating-snapshots',
 code:`// Print the ARIA tree of the navigation to the console
const snapshot = await page.locator('nav').ariaSnapshot();
console.log(snapshot);
// Output:
// - navigation:
//   - link "Home"
//   - link "Products"`},

{name:'Keyboard navigation',
 level:'intermediate',
 desc:'Tests that interactive elements are reachable and operable using only the keyboard Tab, Shift+Tab, Enter, Space, and arrow keys.',
 tip:'Every interactive element must be keyboard accessible. Test Tab order, focus visibility, and that Enter/Space activate buttons and links.',
 docs:'https://playwright.dev/docs/accessibility-testing',
 code:`// Tab through the form and verify focus order
await page.goto('/contact');
await page.keyboard.press('Tab'); // focus first field
await expect(page.getByLabel('Name')).toBeFocused();

await page.keyboard.press('Tab'); // move to next field
await expect(page.getByLabel('Email')).toBeFocused();

// Activate a button with keyboard
await page.getByRole('button', { name: 'Submit' }).focus();
await page.keyboard.press('Enter');`},

{name:'Axe integration',
 level:'advanced',
 desc:'Runs the axe-core accessibility engine against the page to detect WCAG violations. Requires the @axe-core/playwright package.',
 tip:'Install with: npm install @axe-core/playwright. Axe catches broad WCAG issues automatically. Combine with specific assertions for full coverage.',
 docs:'https://playwright.dev/docs/accessibility-testing#using-axe-playwright',
 code:`import AxeBuilder from '@axe-core/playwright';

test('page has no accessibility violations', async ({ page }) => {
  await page.goto('/dashboard');

  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa'])
    .analyze();

  expect(results.violations).toEqual([]);
});`},

{name:'AxeBuilder - scan scope',
 level:'advanced',
 desc:'Scope an axe-core scan to specific components using .include(), or exclude noisy/irrelevant sections using .exclude().',
 tip:'Use .include() to focus on the component under test. Use .exclude() to skip third-party widgets or known-broken sections you do not own.',
 docs:'https://playwright.dev/docs/accessibility-testing#scanning-a-subset-of-a-page',
 code:`// Scan an entire page
const results = await new AxeBuilder({ page })
  .analyze();

// Scan specific component(s) only
const results = await new AxeBuilder({ page })
  .include('#pane666')
  .include('#pane777')
  .analyze();

// Exclude specific component(s) from the scan
const results = await new AxeBuilder({ page })
  .exclude('#pane666')
  .analyze();`},

{name:'AxeBuilder - WCAG tags & rules',
 level:'advanced',
 desc:'Target a specific WCAG standard with .withTags(), or suppress known false-positives by disabling individual rule IDs with .disableRules().',
 tip:'Pass multiple tags like [\'wcag2a\',\'wcag2aa\'] to broaden coverage. Get rule IDs from the axe violation output\'s .id field, then disable only what you intentionally accept.',
 docs:'https://playwright.dev/docs/accessibility-testing#using-axe-playwright',
 code:`// Scan against a specific WCAG standard
const results = await new AxeBuilder({ page })
  .withTags(['wcag2a'])
  .analyze();

// Disable specific rule ID(s) during scan
const results = await new AxeBuilder({ page })
  .disableRules(['duplicate-id'])
  .analyze();`},

{name:'AxeBuilder - full example',
 level:'advanced',
 desc:'End-to-end axe scan with page setup, navigation, network-idle wait, violation assertion, and detailed console reporting.',
 tip:'Always wait for networkidle before scanning dynamic pages, as axe runs synchronously on the DOM and elements must be fully rendered.',
 docs:'https://playwright.dev/docs/accessibility-testing#using-axe-playwright',
 code:`test('Sample Accessibility Test', { tag: ['@unstable'] }, async ({ page }) => {

  // 1. Page set up (navigates to app and logs in)
  const { topWidget } = await setUpERequestTest(page);

  // 2. Simulate user actions to navigate to the page you want to scan
  await topWidget.inboxDropdown.click();
  await topWidget.reactInboxDropdownFax.click();

  // 3. Wait for elements on the page to fully load
  await page.waitForLoadState('networkidle');

  // 4. Scan the entire page
  const results = await new AxeBuilder({ page })
    .analyze();

  // 5. Assert no violations (or log a report)
  expect(results.violations).toEqual([]);

  // Example reporting: counts for violations, passes etc.
  console.log("Counts:", {
    violations: results.violations.length,
    passes: results.passes.length,
    incomplete: results.incomplete.length,
    inapplicable: results.inapplicable.length,
  });

  // Example reporting: detailed violation info
  if (results.violations.length > 0) {
    results.violations.forEach(violation => {
      console.log(\`[\${violation.impact}] \${violation.id}: \${violation.description}\`);
      violation.nodes.forEach(node => {
        let failureSummary = (node.failureSummary.split(":"))[1];
        console.log(\`   - Failure Summary: \${failureSummary}\`);
      })
    })
  }
})`},
]};
