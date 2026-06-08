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

test.describe('highlight() — in the modal', () => {
  test('renders token spans inside the code block', async ({ page }) => {
    await page.locator('.tile').first().click();
    await expect(
      page
        .locator('#m-code .tok-keyword, #m-code .tok-string, #m-code .tok-api')
        .first()
    ).toBeVisible();
  });

  test('modal code text matches the source command exactly', async ({
    page,
  }) => {
    const tiles = page.locator('.tile');
    const count = Math.min(await tiles.count(), 8);
    for (let i = 0; i < count; i++) {
      const name = await tiles.nth(i).locator('.tile-name').innerText();
      await tiles.nth(i).click();
      const shown = await page
        .locator('#m-code')
        .evaluate((el) => el.textContent);
      const expected = await page.evaluate((n) => {
        for (const cat of window.categories)
          for (const item of cat.items) if (item.name === n) return item.code;
        return null;
      }, name);
      expect(shown).toBe(expected);
      await page.locator('.btn-close').click();
    }
  });
});

test.describe('highlightShell() — CLI snippets', () => {
  test('dims # comments and colors flags and programs', async ({ page }) => {
    const html = await page.evaluate(() =>
      window.highlightShell('npx playwright test --config=ci.ts # run it')
    );
    expect(html).toContain('<span class="tok-api">npx</span>');
    expect(html).toContain('<span class="tok-keyword">--config</span>');
    expect(html).toContain('<span class="tok-comment"># run it</span>');
  });

  test('does NOT treat // in a URL as a comment', async ({ page }) => {
    const html = await page.evaluate(() =>
      window.highlightShell('npx playwright codegen https://example.com')
    );
    expect(html).not.toContain('tok-comment');
  });

  test('preserves the original text exactly (Copy stays correct)', async ({
    page,
  }) => {
    const code = 'npx playwright test --grep "log in" # filter';
    const text = await page.evaluate((c) => {
      const div = document.createElement('div');
      div.innerHTML = window.highlightShell(c);
      return div.textContent;
    }, code);
    expect(text).toBe(code);
  });

  test('CLI commands render with the shell highlighter in the modal', async ({
    page,
  }) => {
    await page.locator('.filter-btn', { hasText: 'Tracing' }).click();
    await page.locator('.tile', { hasText: 'codegen' }).first().click();
    // shell '#' comment lines ARE dimmed
    await expect(page.locator('#m-code .tok-comment').first()).toContainText(
      '# Record'
    );
    // ...but the URL's '//' is NOT swallowed into a comment
    const comments = (
      await page.locator('#m-code .tok-comment').allInnerTexts()
    ).join('\n');
    expect(comments).not.toContain('example.com');
    // the full URL is still present in the rendered code
    await expect(page.locator('#m-code')).toContainText('https://example.com');
  });
});
