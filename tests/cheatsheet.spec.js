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
});
