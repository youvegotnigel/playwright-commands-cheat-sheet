import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
});

/* ── PAGE LOAD ─────────────────────────────────────────────────── */
test.describe('Page load', () => {
  test('shows the header and title', async ({ page }) => {
    await expect(page).toHaveTitle(/Playwright Commands Dashboard/);
    await expect(page.locator('header')).toContainText('Playwright Commands Dashboard');
  });

  test('renders command tiles', async ({ page }) => {
    const tiles = page.locator('.tile');
    await expect(tiles).toHaveCount(await tiles.count()); // tiles exist
    expect(await tiles.count()).toBeGreaterThan(10);
  });

  test('tile count matches the data', async ({ page }) => {
    const dataCount = await page.evaluate(() =>
      categories.reduce((sum, cat) => sum + cat.items.length, 0)
    );
    expect(await page.locator('.tile').count()).toBe(dataCount);
  });

  test('renders filter buttons including All and Beginner', async ({ page }) => {
    await expect(page.locator('.filter-btn', { hasText: 'All' })).toBeVisible();
    await expect(page.locator('.filter-btn', { hasText: 'Start Here' })).toBeVisible();
  });

  test('Flat view is active by default', async ({ page }) => {
    await expect(page.locator('#btnFlat')).toHaveClass(/active/);
    await expect(page.locator('#btnGrouped')).not.toHaveClass(/active/);
  });
});

/* ── SEARCH ────────────────────────────────────────────────────── */
test.describe('Search', () => {
  test('filters tiles as user types', async ({ page }) => {
    const allCount = await page.locator('.tile').count();

    await page.locator('input[type="text"]').fill('goto');
    const filtered = page.locator('.tile');
    expect(await filtered.count()).toBeLessThan(allCount);
    expect(await filtered.count()).toBeGreaterThan(0);
  });

  test('shows empty state for a nonsense query', async ({ page }) => {
    await page.locator('input[type="text"]').fill('xyzxyzxyznonexistent');
    await expect(page.locator('.empty-state')).toBeVisible();
    await expect(page.locator('.empty-state')).toContainText('No commands match');
  });

  test('restores all tiles after clearing search', async ({ page }) => {
    const allCount = await page.locator('.tile').count();
    await page.locator('input[type="text"]').fill('goto');
    await page.locator('input[type="text"]').clear();
    expect(await page.locator('.tile').count()).toBe(allCount);
  });

  test('is case-insensitive', async ({ page }) => {
    await page.locator('input[type="text"]').fill('goto');
    const lower = await page.locator('.tile').count();

    await page.locator('input[type="text"]').fill('GOTO');
    const upper = await page.locator('.tile').count();

    expect(upper).toBe(lower);
    expect(upper).toBeGreaterThan(0);
  });

  test('works while a category filter is active', async ({ page }) => {
    // Apply a category filter first, then search within it
    await page.locator('.filter-btn', { hasText: 'Start Here' }).click();
    const afterFilter = await page.locator('.tile').count();

    await page.locator('input[type="text"]').fill('page');
    const afterSearch = await page.locator('.tile').count();

    // Search should narrow results further (or keep same if all match)
    expect(afterSearch).toBeLessThanOrEqual(afterFilter);
    expect(afterSearch).toBeGreaterThan(0);
  });

  test('active filter is preserved after clearing search', async ({ page }) => {
    await page.locator('.filter-btn', { hasText: 'Start Here' }).click();
    const afterFilter = await page.locator('.tile').count();

    await page.locator('input[type="text"]').fill('page');
    await page.locator('input[type="text"]').clear();

    // Tile count should return to the filtered count, not the full count
    expect(await page.locator('.tile').count()).toBe(afterFilter);
    await expect(page.locator('.filter-btn', { hasText: 'Start Here' })).toHaveClass(/active/);
  });
});

/* ── FILTERS ───────────────────────────────────────────────────── */
test.describe('Filters', () => {
  test('Beginner filter shows only beginner tiles', async ({ page }) => {
    const allCount = await page.locator('.tile').count();
    await page.locator('.filter-btn', { hasText: 'Start Here' }).click();

    const filtered = await page.locator('.tile').count();
    expect(filtered).toBeGreaterThan(0);
    expect(filtered).toBeLessThan(allCount);
  });

  test('clicking All resets after another filter', async ({ page }) => {
    const allCount = await page.locator('.tile').count();

    await page.locator('.filter-btn', { hasText: 'Start Here' }).click();
    await page.locator('.filter-btn', { hasText: 'All' }).click();

    expect(await page.locator('.tile').count()).toBe(allCount);
  });

  test('active filter button gets the active class', async ({ page }) => {
    const beginnerBtn = page.locator('.filter-btn', { hasText: 'Start Here' });
    await beginnerBtn.click();
    await expect(beginnerBtn).toHaveClass(/active/);

    await page.locator('.filter-btn', { hasText: 'All' }).click();
    await expect(page.locator('.filter-btn', { hasText: 'All' })).toHaveClass(/active/);
  });
});

/* ── VIEW TOGGLE ───────────────────────────────────────────────── */
test.describe('View toggle', () => {
  test('Grouped view renders group headers', async ({ page }) => {
    await page.locator('#btnGrouped').click();
    await expect(page.locator('.group-header').first()).toBeVisible();
  });

  test('switching back to Flat removes group headers', async ({ page }) => {
    await page.locator('#btnGrouped').click();
    await page.locator('#btnFlat').click();
    await expect(page.locator('.group-header')).toHaveCount(0);
  });
});

/* ── MODAL ─────────────────────────────────────────────────────── */
test.describe('Modal', () => {
  test('opens when a tile is clicked and shows title/code', async ({ page }) => {
    const firstTile = page.locator('.tile').first();
    const tileName  = await firstTile.locator('.tile-name').innerText();

    await firstTile.click();

    const modal = page.locator('#modal');
    await expect(modal).toBeVisible();
    await expect(page.locator('#m-title')).toContainText(tileName);
    await expect(page.locator('#m-code')).not.toBeEmpty();
  });

  test('shows the difficulty badge', async ({ page }) => {
    await page.locator('.tile').first().click();
    await expect(page.locator('#m-level')).toBeVisible();
    const badgeText = await page.locator('#m-level').innerText();
    expect(['Beginner', 'Intermediate', 'Advanced'].some(l => badgeText.includes(l))).toBe(true);
  });

  test('Docs link has a valid href', async ({ page }) => {
    await page.locator('.tile').first().click();
    const href = await page.locator('#btn-docs').getAttribute('href');
    expect(href).toMatch(/^https?:\/\//);
  });

  test('closes via the × button', async ({ page }) => {
    await page.locator('.tile').first().click();
    await page.locator('.close-icon').click();
    await expect(page.locator('#modal')).toBeHidden();
  });

  test('closes via the Close button', async ({ page }) => {
    await page.locator('.tile').first().click();
    await page.locator('.btn-close').click();
    await expect(page.locator('#modal')).toBeHidden();
  });

  test('closes when pressing Escape', async ({ page }) => {
    await page.locator('.tile').first().click();
    await page.keyboard.press('Escape');
    await expect(page.locator('#modal')).toBeHidden();
  });

  test('closes when clicking the backdrop', async ({ page }) => {
    await page.locator('.tile').first().click();
    // Click the modal backdrop (outside modal-content)
    await page.locator('#modal').click({ position: { x: 5, y: 5 } });
    await expect(page.locator('#modal')).toBeHidden();
  });

  test('Copy button changes text to ✓ Copied!', async ({ page }) => {
    await page.locator('.tile').first().click();
    await page.locator('#btn-copy').click();
    await expect(page.locator('#btn-copy')).toContainText('Copied');
  });

  test('Copy button resets back to Copy after 2 seconds', async ({ page }) => {
    await page.locator('.tile').first().click();
    await page.locator('#btn-copy').click();
    await expect(page.locator('#btn-copy')).toContainText('Copied');
    await expect(page.locator('#btn-copy')).toContainText('Copy', { timeout: 4000 });
  });

  test('opening a different tile shows its content', async ({ page }) => {
    const tiles = page.locator('.tile');
    const firstName  = await tiles.nth(0).locator('.tile-name').innerText();
    const secondName = await tiles.nth(1).locator('.tile-name').innerText();

    await tiles.nth(0).click();
    await expect(page.locator('#m-title')).toContainText(firstName);

    // Close first, then open a different tile
    await page.locator('.btn-close').click();
    await tiles.nth(1).click();
    await expect(page.locator('#m-title')).toContainText(secondName);
    await expect(page.locator('#modal')).toBeVisible();
  });

  test('Docs link opens in a new tab', async ({ page }) => {
    await page.locator('.tile').first().click();
    const target = await page.locator('#btn-docs').getAttribute('target');
    expect(target).toBe('_blank');
  });
});

/* ── URL DEEP-LINKING ──────────────────────────────────────────── */
test.describe('URL deep-linking', () => {
  test('applying a category filter updates the URL hash', async ({ page }) => {
    await page.locator('.filter-btn', { hasText: 'Action' }).click();
    expect(page.url()).toContain('filter=Action');
  });

  test('typing in search updates the URL hash', async ({ page }) => {
    await page.locator('#search-input').fill('click');
    expect(page.url()).toContain('search=click');
  });

  test('both filter and search are reflected in the URL hash', async ({ page }) => {
    await page.locator('.filter-btn', { hasText: 'Action' }).click();
    await page.locator('#search-input').fill('click');
    const url = page.url();
    expect(url).toContain('filter=Action');
    expect(url).toContain('search=click');
  });

  test('resetting to All removes filter from URL hash', async ({ page }) => {
    await page.locator('.filter-btn', { hasText: 'Action' }).click();
    await page.locator('.filter-btn', { hasText: 'All' }).click();
    expect(page.url()).not.toContain('filter=');
  });

  test('clearing search removes search from URL hash', async ({ page }) => {
    await page.locator('#search-input').fill('click');
    await page.locator('#search-input').clear();
    expect(page.url()).not.toContain('search=');
  });

  test('loading with #filter hash pre-applies the category filter', async ({ page }) => {
    const totalCount = await page.locator('.tile').count();

    await page.goto('/#filter=Action');
    await expect(page.locator('.filter-btn', { hasText: 'Action' })).toHaveClass(/active/);
    const filteredCount = await page.locator('.tile').count();
    expect(filteredCount).toBeGreaterThan(0);
    expect(filteredCount).toBeLessThan(totalCount);
  });

  test('loading with #filter=beginner hash applies the Start Here filter', async ({ page }) => {
    const totalCount = await page.locator('.tile').count();

    await page.goto('/#filter=beginner');
    await expect(page.locator('.filter-btn', { hasText: 'Start Here' })).toHaveClass(/active/);
    const filteredCount = await page.locator('.tile').count();
    expect(filteredCount).toBeGreaterThan(0);
    expect(filteredCount).toBeLessThan(totalCount);
  });

  test('loading with #search hash pre-populates the search input and filters tiles', async ({ page }) => {
    const totalCount = await page.locator('.tile').count();

    await page.goto('/#search=click');
    const inputValue = await page.locator('#search-input').inputValue();
    expect(inputValue).toBe('click');
    const filteredCount = await page.locator('.tile').count();
    expect(filteredCount).toBeGreaterThan(0);
    expect(filteredCount).toBeLessThan(totalCount);
  });

  test('loading with both #filter and #search applies both simultaneously', async ({ page }) => {
    await page.goto('/#filter=Action&search=click');
    await expect(page.locator('.filter-btn', { hasText: 'Action' })).toHaveClass(/active/);
    const inputValue = await page.locator('#search-input').inputValue();
    expect(inputValue).toBe('click');
    expect(await page.locator('.tile').count()).toBeGreaterThan(0);
  });
});

/* ── KEYBOARD SHORTCUTS ────────────────────────────────────────── */
test.describe('Keyboard shortcuts', () => {
  test('search shortcut hint badge is visible in the search bar', async ({ page }) => {
    await expect(page.locator('#search-shortcut')).toBeVisible();
    const text = await page.locator('#search-shortcut').innerText();
    expect(['⌘K', 'Ctrl+K']).toContain(text);
  });

  test('Ctrl+K focuses the search input', async ({ page }) => {
    await page.locator('body').click(); // ensure focus is away from search
    await page.keyboard.press('Control+k');
    const isFocused = await page.locator('#search-input').evaluate(
      el => document.activeElement === el
    );
    expect(isFocused).toBe(true);
  });

  test('search input has an accessible aria-label', async ({ page }) => {
    const label = await page.locator('#search-input').getAttribute('aria-label');
    expect(label).toBeTruthy();
  });
});

/* ── MOBILE ────────────────────────────────────────────────────── */
test.describe('Mobile', () => {
  test('filter bar is scrollable when filters overflow', async ({ page, isMobile }) => {
    if (!isMobile) test.skip();
    const filterBar = page.locator('#filters');
    const scrollWidth  = await filterBar.evaluate(el => el.scrollWidth);
    const clientWidth  = await filterBar.evaluate(el => el.clientWidth);
    // On mobile the filter bar should allow horizontal scrolling
    const overflowX = await filterBar.evaluate(el => getComputedStyle(el).overflowX);
    if (scrollWidth > clientWidth) {
      expect(['auto', 'scroll']).toContain(overflowX);
    }
  });

  test('modal content is visible and not clipped on small screens', async ({ page, isMobile }) => {
    if (!isMobile) test.skip();
    await page.locator('.tile').first().click();
    const modal = page.locator('.modal-content');
    await expect(modal).toBeVisible();

    const box = await modal.boundingBox();
    const viewportWidth = page.viewportSize().width;
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(viewportWidth + 1); // +1 for rounding
  });

  test('tiles respond to tap', async ({ page, isMobile }) => {
    if (!isMobile) test.skip();
    await page.locator('.tile').first().tap();
    await expect(page.locator('#modal')).toBeVisible();
  });
});

/* ── NEW ASSERTIONS (from screenshot) ─────────────────────────── */
test.describe('New assertion tiles', () => {
  const newAssertions = [
    'toBeFocused()',
    'toBeOK()',
    'toBe()',
    'toContain()',
    'toBeTruthy()',
    'toHaveLength()',
    'toMatchObject()',
    'toBeGreaterThan()',
    'expect().toPass()',
  ];

  test('all 9 new assertion commands are rendered as tiles', async ({ page }) => {
    await page.locator('.filter-btn', { hasText: 'Assertions' }).click();
    for (const name of newAssertions) {
      await expect(
        page.locator('.tile', { hasText: name }),
        `Expected tile for "${name}" to be visible`
      ).toBeVisible();
    }
  });

  test('Assertions category tile count increased to 30', async ({ page }) => {
    await page.locator('.filter-btn', { hasText: 'Assertions' }).click();
    await expect(page.locator('.tile')).toHaveCount(30);
  });

  for (const name of newAssertions) {
    test(`modal for "${name}" shows description, code, and docs link`, async ({ page }) => {
      await page.locator('.filter-btn', { hasText: 'Assertions' }).click();
      await page.locator('.tile', { hasText: name }).click();

      await expect(page.locator('#modal')).toBeVisible();
      await expect(page.locator('#m-title')).toContainText(name);
      await expect(page.locator('#m-desc')).not.toBeEmpty();
      await expect(page.locator('#m-code')).not.toBeEmpty();

      const href = await page.locator('#btn-docs').getAttribute('href');
      expect(href).toMatch(/^https:\/\/playwright\.dev/);

      await page.locator('.btn-close').click();
    });
  }
});
