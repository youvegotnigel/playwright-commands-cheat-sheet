/** @type {import('./index.js').Category} */
export default {cat:'Component Testing', cls:'component', color:'#f43f5e', items:[
{name:'Setup (experimental-ct)',
 level:'advanced',
 desc:'Playwright can mount and test individual UI components in a real browser. Add the experimental component-testing package for your framework and a ct config.',
 tip:'Component testing is experimental. Pick the package matching your framework: experimental-ct-react, experimental-ct-vue, or experimental-ct-svelte. Scaffold with: npm init playwright@latest -- --ct.',
 docs:'https://playwright.dev/docs/test-components',
 code:`// playwright-ct.config.ts
import { defineConfig } from '@playwright/experimental-ct-react';

export default defineConfig({
  testDir: './src',
  use: { ctPort: 3100 },
});

// Run component tests:
// npx playwright test -c playwright-ct.config.ts`},

{name:'mount()',
 level:'advanced',
 desc:'Renders a component into a real browser page and returns a Locator pointing at it. The starting point for every component test.',
 tip:'mount is provided as a test fixture, destructure it from the test args. After mounting you assert and interact with the returned locator exactly like any Playwright locator.',
 docs:'https://playwright.dev/docs/test-components#test-stories',
 code:`import { test, expect } from '@playwright/experimental-ct-react';
import { Button } from './Button';

test('renders', async ({ mount }) => {
  const component = await mount(<Button title="Submit" />);
  await expect(component).toContainText('Submit');
});`},

{name:'Passing props',
 level:'advanced',
 desc:'Provide a component\'s inputs as JSX props (or framework equivalents) when mounting, then assert the rendered output reflects them.',
 tip:'Props are passed just like in your app code. Use this to test how a component renders different states: variants, disabled, loading, and so on.',
 docs:'https://playwright.dev/docs/test-components#props',
 code:`test('renders the message prop', async ({ mount }) => {
  const component = await mount(<Greeting msg="greetings" />);
  await expect(component).toContainText('greetings');
});`},

{name:'Component events',
 level:'advanced',
 desc:'Pass event handlers as props and assert they fire when you interact with the mounted component.',
 tip:'Capture event firing in a local variable from the handler, then assert on it after the interaction. The mount locator click triggers real DOM events.',
 docs:'https://playwright.dev/docs/test-components#events',
 code:`test('emits a click event', async ({ mount }) => {
  let clicked = false;

  const component = await mount(
    <Button title="Submit" onClick={() => { clicked = true; }} />
  );

  await component.click();
  expect(clicked).toBeTruthy();
});`},

{name:'component.update()',
 level:'advanced',
 desc:'Re-renders a mounted component with new props, children, or event handlers, simulating an update from a parent component.',
 tip:'Use to test how a component reacts to changing inputs without remounting, e.g. a counter that increments or a list that grows.',
 docs:'https://playwright.dev/docs/test-components#update-props',
 code:`test('reacts to prop changes', async ({ mount }) => {
  const component = await mount(<Counter value={1} />);
  await expect(component).toContainText('1');

  await component.update(<Counter value={2} />);
  await expect(component).toContainText('2');
});`},

{name:'component.unmount()',
 level:'advanced',
 desc:'Removes the mounted component from the page. Use to assert teardown behaviour or that cleanup logic runs.',
 tip:'Returned from await mount(). Use it to verify a component cleans up after itself: removed listeners, cleared timers, or an unmount callback firing.',
 docs:'https://playwright.dev/docs/test-components#unmount',
 code:`test('unmounts cleanly', async ({ mount, page }) => {
  const component = await mount(<Toast message="Saved" />);
  await expect(component).toBeVisible();

  await component.unmount();
  await expect(page.getByText('Saved')).toHaveCount(0);
});`},

{name:'Asserting on a component',
 level:'advanced',
 desc:'The locator returned by mount() supports the full assertion and query API, so you can chain getByRole, fill, and expect just like a page test.',
 tip:'Treat the mounted component as a scoped page: use component.getByRole(), component.getByLabel(), and standard expect() matchers to verify structure and behaviour.',
 docs:'https://playwright.dev/docs/test-components#test-stories',
 code:`test('form component validates input', async ({ mount }) => {
  const component = await mount(<SignupForm />);

  await component.getByLabel('Email').fill('not-an-email');
  await component.getByRole('button', { name: 'Sign up' }).click();

  await expect(component.getByRole('alert'))
    .toContainText('valid email');
});`},
]};
