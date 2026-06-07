import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
});

test.describe('highlight() — tokenizing', () => {
  test('wraps keywords, strings, and Playwright APIs in token spans', async ({
    page,
  }) => {
    const html = await page.evaluate(() =>
      window.highlight("await page.goto('/home');")
    );
    expect(html).toContain('<span class="tok-keyword">await</span>');
    expect(html).toContain('<span class="tok-api">page</span>');
    expect(html).toContain('tok-string'); // string literal '/home'
  });

  test('classifies function calls and comments', async ({ page }) => {
    const html = await page.evaluate(() =>
      window.highlight('locator.click(); // do it')
    );
    expect(html).toContain('<span class="tok-fn">click</span>');
    expect(html).toContain('<span class="tok-comment">// do it</span>');
  });

  test('is deterministic across repeated calls (regex lastIndex reset)', async ({
    page,
  }) => {
    const [a, b] = await page.evaluate(() => {
      const code = "await page.goto('/x');";
      return [window.highlight(code), window.highlight(code)];
    });
    expect(a).toBe(b);
    expect(a).toContain('<span class="tok-keyword">await</span>');
  });

  test('escapes HTML so snippets cannot inject markup', async ({ page }) => {
    const html = await page.evaluate(() =>
      window.highlight('const x = a < b && c > d;')
    );
    expect(html).toContain('&lt;');
    expect(html).toContain('&gt;');
    expect(html).toContain('&amp;');
    expect(html).not.toContain('< b'); // raw angle bracket must be gone
  });

  test('preserves the original text exactly (Copy stays correct)', async ({
    page,
  }) => {
    const code = 'await expect(page).toHaveTitle(/Home/); // checks title';
    const text = await page.evaluate((c) => {
      const div = document.createElement('div');
      div.innerHTML = window.highlight(c);
      return div.textContent;
    }, code);
    expect(text).toBe(code);
  });
});
