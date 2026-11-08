import { test, expect } from '@playwright/test';
import { PAGES, fallbacks, mockBackends } from './helpers/guide.js';

test.beforeEach(async ({ page }) => {
  await mockBackends(page);
});

const COUNT = PAGES.length;
const TABS = PAGES.map((p) => p.tab);
const nav = (page) => page.getByRole('navigation', { name: 'Pages' });
const tab = (page, label) => nav(page).getByText(label, { exact: true });

// The page a tab opens: the dashboard shows its grid, a guide is named by its path
async function expectOpened(page, target) {
  if (target.path === '/') {
    await expect(page).toHaveURL(/\/(index\.html)?$/);
    await expect(page.locator('#grid')).toBeVisible();
  } else {
    await expect(page).toHaveURL(new RegExp(target.path.replace('.html', '(\\.html)?') + '$'));
    await expect(page.locator('h1')).toBeVisible();
  }
}

/* ── PAGE SWITCH ───────────────────────────────────────────────── */
test.describe('Page switch', () => {
  test('is on every page with aria-current on the current one', async ({ page }) => {
    for (const { path, tab: current } of PAGES) {
      await page.goto(path);
      const links = nav(page).getByRole('link');
      await expect(links, path).toHaveCount(COUNT);
      for (const [i, label] of TABS.entries()) {
        await expect(links.nth(i), path).toHaveAccessibleName(label);
      }
      await expect(nav(page).locator('[aria-current="page"]'), path).toHaveAccessibleName(current);
    }
  });

  // Custom line icons, one per page. The lines take the tab's text colour; one detail takes
  // the page's accent from the palette.
  test('each tab has its own decorative SVG icon with a page accent, and no emoji', async ({
    page,
  }) => {
    for (const { path } of PAGES) {
      await page.goto(path);
      await expect(page.locator('.page-switch .page-tab'), path).toHaveText(TABS);

      const icons = await page.locator('.page-tab svg.tab-icon').evaluateAll((svgs) =>
        svgs.map((svg) => ({
          hidden: svg.getAttribute('aria-hidden'),
          focusable: svg.getAttribute('focusable'),
          cls: svg.getAttribute('class'),
          markup: svg.innerHTML,
          line: getComputedStyle(svg).stroke,
          text: getComputedStyle(svg.closest('.page-tab')).color,
          accent: getComputedStyle(svg.querySelector('.accent')).stroke,
        }))
      );
      expect(icons, path).toHaveLength(COUNT);
      expect(new Set(icons.map((i) => i.markup)).size, path).toBe(COUNT);
      icons.forEach((icon, i) => {
        expect(icon.hidden, path).toBe('true');
        expect(icon.focusable, path).toBe('false');
        expect(icon.cls, path).toContain(`icon-${PAGES[i].icon}`);
        expect(icon.line, path).toBe(icon.text);
        expect(icon.accent, path).toBe(PAGES[i].accent);
      });
    }
  });

  test('tab icons take the same space, so the tabs look balanced', async ({ page }) => {
    await page.goto('/waiting.html');
    const boxes = await page
      .locator('.page-tab .tab-icon')
      .evaluateAll((els) => els.map((el) => el.getBoundingClientRect()));
    expect(boxes).toHaveLength(COUNT);
    for (const box of boxes) {
      expect(Math.abs(boxes[0].width - box.width)).toBeLessThanOrEqual(1);
      expect(Math.abs(boxes[0].height - box.height)).toBeLessThanOrEqual(1);
    }

    const tabs = await page
      .locator('.page-tab')
      .evaluateAll((els) => els.map((el) => el.getBoundingClientRect().height));
    for (const height of tabs) expect(Math.abs(tabs[0] - height)).toBeLessThanOrEqual(1);
  });

  test('every tab opens its page from every other page', async ({ page }) => {
    for (const from of PAGES) {
      for (const to of PAGES) {
        await page.goto(from.path);
        await tab(page, to.tab).click();
        await expectOpened(page, to);
      }
    }
  });

  test('navigates both ways', async ({ page }) => {
    await page.goto('/waiting.html');
    await tab(page, 'Commands').click();
    await expectOpened(page, PAGES[0]);

    await tab(page, 'Waits').click();
    await expect(page).toHaveURL(/waiting/);
    await expect(page.locator('h1')).toHaveText('Playwright Waiting Cheat Sheet');
  });

  test('does not add filter buttons to the dashboard', async ({ page }) => {
    await page.goto('/');
    const expected = await page.evaluate(() => categories.length + 3);
    await expect(page.locator('.filter-btn')).toHaveCount(expected);
  });

  test('keyboard focus shows the white focus ring on every tab', async ({ page, browserName }) => {
    test.skip(browserName === 'webkit', 'WebKit does not move Tab focus to links by default');
    await page.goto('/locators.html');
    const focused = () =>
      page.evaluate(() => {
        const el = document.activeElement;
        const cs = getComputedStyle(el);
        return {
          cls: el.className,
          name: el.textContent.trim(),
          ring: `${cs.outlineStyle} ${cs.outlineWidth} ${cs.outlineColor}`,
        };
      });
    const ring = 'solid 3px rgb(248, 250, 252)';
    for (const label of TABS) {
      await page.keyboard.press('Tab');
      expect(await focused(), label).toEqual({ cls: 'page-tab', name: label, ring });
    }
  });
});

/* ── CROSS-PAGE ────────────────────────────────────────────────── */
test.describe('Cross-page', () => {
  test('all pages share an identical header', async ({ page }) => {
    const headers = [];
    for (const { path } of PAGES) {
      await page.goto(path);
      headers.push(await page.locator('header').evaluate((el) => el.outerHTML));
    }
    for (const header of headers) expect(header).toBe(headers[0]);
  });

  test('the meta-bar fallbacks match on all pages', async ({ page }) => {
    const [dashboard, ...guides] = await Promise.all(PAGES.map((p) => fallbacks(page, p.path)));
    for (const guide of guides) expect(guide).toEqual(dashboard);
  });

  test('on a 360px phone the tabs share one row without overflow', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 740 });
    for (const { path } of PAGES) {
      await page.goto(path);
      const boxes = await page.locator('.page-tab').evaluateAll((els) =>
        els.map((el) => ({
          top: el.getBoundingClientRect().top,
          width: el.getBoundingClientRect().width,
          clipped: el.scrollWidth > el.clientWidth,
        }))
      );
      expect(boxes, path).toHaveLength(COUNT);
      for (const box of boxes) {
        expect(box.top, path).toBe(boxes[0].top);
        expect(Math.abs(box.width - boxes[0].width), path).toBeLessThanOrEqual(1);
        expect(box.clipped, path).toBe(false);
      }
      const noSideScroll = await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth
      );
      expect(noSideScroll, path).toBe(true);
    }
  });
});

/* ── PAGE TAB ANIMATION ────────────────────────────────────────── */
// A tab click navigates away at once, so the icon plays on arrival: the landing page's
// current tab animates after every tab click, and stays still on a plain visit.
test.describe('Page tabs: icon animation on click', () => {
  // Whether the current tab's icon is set to play, and whether any of its parts has a CSS
  // animation applied (computed style, so the check does not race the animation's end)
  const icon = (page, name) =>
    page.locator(`.page-tab[aria-current] svg.icon-${name}`).evaluate((svg) => ({
      play: svg.classList.contains('play'),
      animated: [...svg.querySelectorAll('*')].some(
        (el) => getComputedStyle(el).animationName !== 'none'
      ),
    }));
  const PLAYS = { play: true, animated: true };
  const STILL = { play: false, animated: false };
  const byIcon = (name) => PAGES.find((p) => p.icon === name);

  test('every tab click plays the icon of the page it opens', async ({ page }) => {
    await page.goto('/');
    expect(await icon(page, 'commands')).toEqual(STILL);

    for (const name of ['waiting', 'locators', 'waiting', 'waiting', 'commands']) {
      // 3rd: clicked before, plays again. 4th: the current tab, reloads and plays
      await tab(page, byIcon(name).tab).click();
      await expect(page.locator(`.page-tab[aria-current] svg.icon-${name}`)).toHaveClass(
        /\bplay\b/
      );
      expect(await icon(page, name), name).toEqual(PLAYS);
    }
  });

  test('a plain visit or reload, without a tab click, does not animate', async ({ page }) => {
    await page.goto('/');
    await tab(page, 'Selectors').click();
    await expect(page.locator('.page-tab[aria-current] svg.icon-locators')).toHaveClass(/\bplay\b/);
    await page.reload();
    expect(await icon(page, 'locators')).toEqual(STILL);
  });

  test('reduced motion: the icon never moves', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    await tab(page, 'Selectors').click();
    await expect(page.locator('h1')).toHaveText('Playwright Locator Cheat Sheet');
    expect((await icon(page, 'locators')).animated).toBe(false);
  });

  test('tabs still navigate when storage is blocked', async ({ page }) => {
    await page.addInitScript(() => {
      for (const name of ['localStorage', 'sessionStorage']) {
        Object.defineProperty(window, name, {
          get: () => {
            throw new Error('blocked');
          },
        });
      }
    });
    await page.goto('/waiting.html');
    await tab(page, 'Selectors').click();
    await expect(page.locator('h1')).toHaveText('Playwright Locator Cheat Sheet');
  });
});
