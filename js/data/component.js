/** @type {import('./index.js').Category} */
export default {
  cat: 'Component Testing',
  cls: 'component',
  color: '#d946ef',
  items: [
    {
      name: 'Setup (stories model)',
      level: 'advanced',
      desc: 'Component tests are plain @playwright/test tests that run against a small story gallery page served by your own dev server. Add a project whose baseURL points at the gallery. No extra npm package is needed. The stories model arrived in Playwright v1.62.',
      tip: 'Run npx playwright init-skills and ask your coding agent to "set up component testing using the playwright-component-testing skill": it writes the gallery, config project, first story and spec for your framework. reuseContext: true is a large speedup for component suites.',
      docs: 'https://playwright.dev/docs/test-components#step-2-configure-playwright',
      code: `// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  projects: [
    {
      name: 'components',
      testDir: './tests/components',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: 'http://localhost:5173/playwright/gallery/index.html',
        serviceWorkers: 'block', // keeps page.route() mocks authoritative
        reuseContext: true,
      },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173/playwright/gallery/index.html',
    reuseExistingServer: !process.env.CI,
  },
});

// Run: npx playwright test --project=components`,
    },

    {
      name: 'Writing a story',
      level: 'advanced',
      desc: 'A story is a tiny wrapper that renders the component in one specific scenario. Stories live next to the component in *.story.tsx (or .ts, .jsx, .js, .vue) files, and each named export is one scenario.',
      tip: 'The story id is the path under src/ without the .story extension plus the export name, e.g. components/Button/Primary. Any unique suffix such as Button/Primary also works. Prefer a new export per scenario over parameterizing one.',
      docs: 'https://playwright.dev/docs/test-components#step-3-write-a-story',
      code: `// src/components/Button.story.tsx
import { Button } from './Button';

export const Primary = () => <Button title="Submit" />;

export const Disabled = () => <Button title="Submit" disabled />;`,
    },

    {
      name: 'mount()',
      level: 'advanced',
      desc: 'The built-in mount fixture navigates to the gallery, renders the story with the given id, and returns a Locator scoped to the story root. The starting point for every component test.',
      tip: 'Import test and expect from plain @playwright/test. Each mount() navigates fresh, so tests are fully isolated and mounting several stories in one test is cheap. A render error or unknown story id makes mount() throw.',
      docs: 'https://playwright.dev/docs/api/class-fixtures#fixtures-mount',
      code: `import { test, expect } from '@playwright/test';

test('renders primary button', async ({ mount }) => {
  const component = await mount('components/Button/Primary');
  await expect(component.getByRole('button')).toHaveText('Submit');
});`,
    },

    {
      name: 'Passing props',
      level: 'advanced',
      desc: 'Pass plain serializable props as the second argument to mount(). The gallery hands them to the story as its props.',
      tip: 'Give mount the story type as a template argument and the props are type-checked against the story signature. Keep props to plain data: callbacks belong inside the story, not the test.',
      docs: 'https://playwright.dev/docs/test-components#per-test-props',
      code: `// src/components/Button.story.tsx
export const WithTitle = ({ title = 'Default' }: { title?: string }) =>
  <Button title={title} />;

// tests/components/button.spec.ts
import type { WithTitle } from '../../src/components/Button.story';

test('renders the title prop', async ({ mount }) => {
  const component = await mount<typeof WithTitle>('Button/WithTitle', { title: 'Hello' });
  await expect(component.getByRole('button')).toHaveText('Hello');
});`,
    },

    {
      name: 'Component events',
      level: 'advanced',
      desc: 'To assert that a callback fired, let the story own the state and the callback, and record the observable outcome into a hidden input. The test then asserts on it with a web-first assertion.',
      tip: 'This replaces passing a handler from the test, which no longer crosses the Node.js and browser boundary. Record each value in its own data-testid input: String() for scalars, JSON.stringify() for payloads.',
      docs: 'https://playwright.dev/docs/test-components#record-state-for-assertions',
      code: `// src/components/Button.story.tsx
export const CountsClicks = () => {
  const [clicks, setClicks] = useState(0);
  return <>
    <Button title="Submit" onClick={() => setClicks((n) => n + 1)} />
    <form hidden><input data-testid="click-count" readOnly value={String(clicks)} /></form>
  </>;
};

// tests/components/button.spec.ts
test('counts clicks', async ({ mount }) => {
  const component = await mount('components/Button/CountsClicks');
  await component.getByRole('button').click();
  await expect(component.getByTestId('click-count')).toHaveValue('1');
});`,
    },

    {
      name: 'component.update()',
      level: 'advanced',
      desc: 'Re-renders the same story with new props on the existing root, without remounting, so component state is preserved. Use it to test prop transitions.',
      tip: 'update() takes a plain props object, not JSX. With mount<typeof Story>() the new props are type-checked against the story too.',
      docs: 'https://playwright.dev/docs/test-components#prop-transitions-with-update',
      code: `test('reacts to prop changes', async ({ mount }) => {
  const component = await mount('components/Counter/Default', { value: 1 });
  await expect(component.getByTestId('value')).toHaveText('1');

  await component.update({ value: 2 });
  await expect(component.getByTestId('value')).toHaveText('2');
});`,
    },

    {
      name: 'component.unmount()',
      level: 'advanced',
      desc: 'Unmounts the story from the gallery. Use to assert teardown behaviour or that cleanup logic runs.',
      tip: 'Returned from await mount(). Have the story record cleanup effects in the DOM or assert on what disappears from the page.',
      docs: 'https://playwright.dev/docs/api/class-fixtures#fixtures-mount',
      code: `test('unmounts cleanly', async ({ mount, page }) => {
  const component = await mount('components/Toast/Saved');
  await expect(component.getByText('Saved')).toBeVisible();

  await component.unmount();
  await expect(page.getByText('Saved')).toHaveCount(0);
});`,
    },

    {
      name: 'Asserting on a component',
      level: 'advanced',
      desc: 'The locator returned by mount() supports the full query and assertion API, including visual comparison, so you can chain getByRole, fill, and expect just like a page test.',
      tip: 'Screenshot the returned root locator, not the page, so nothing else in the gallery leaks into the baseline.',
      docs: 'https://playwright.dev/docs/test-components#multiple-states-and-visual-comparison',
      code: `test('form validates input', async ({ mount }) => {
  const component = await mount('components/SignupForm/Empty');

  await component.getByLabel('Email').fill('not-an-email');
  await component.getByRole('button', { name: 'Sign up' }).click();
  await expect(component.getByRole('alert')).toContainText('valid email');
});

test('visual states', async ({ mount }) => {
  await expect(await mount('Button/Primary')).toHaveScreenshot('primary.png');
  await expect(await mount('Button/Disabled')).toHaveScreenshot('disabled.png');
});`,
    },

    {
      name: 'Network mocking in component tests',
      level: 'advanced',
      desc: 'Mock API calls with page.route() exactly as in an end-to-end test. Register routes before mount(), because mounting navigates.',
      tip: "Set serviceWorkers: 'block' in the components project so the app's own service worker cannot serve cached responses that shadow your routes. Teams using MSW can start setupWorker inside a story instead.",
      docs: 'https://playwright.dev/docs/test-components#handling-network-requests',
      code: `test('renders the error state', async ({ page, mount }) => {
  await page.route('**/api/items', (route) => route.fulfill({ status: 500 }));

  const component = await mount('components/ItemList/Default');
  await expect(component.getByRole('alert')).toContainText('Something went wrong');
});`,
    },

    {
      name: 'Migrating from experimental-ct',
      level: 'advanced',
      desc: 'The @playwright/experimental-ct-react, -ct-react17 and -ct-vue packages are removed. Move each JSX mount() to a named story export and mount it by id. Stay on Playwright 1.62 until the migration is done.',
      tip: 'Migrate spec by spec with the old CT project and the new components project side by side, then delete the ct package plus playwright/index.html, playwright/index.ts and playwright/.cache. ctViteConfig, ctPort and beforeMount hooks have no equivalent: your dev server and the gallery own them.',
      docs: 'https://playwright.dev/docs/test-components#migration-from-the-experimental-packages',
      code: `// Before (removed package)
import { test, expect } from '@playwright/experimental-ct-react';
const component = await mount(<Button title="Submit" />);
await component.update(<Button title="Save" />);

// After (plain @playwright/test, Button.story.tsx exports WithTitle)
import { test, expect } from '@playwright/test';
const component = await mount('components/Button/WithTitle', { title: 'Submit' });
await component.update({ title: 'Save' });`,
    },
  ],
};
