import { test, expect } from '@playwright/test';

// Expected values are hand-written from the approved periodic-colour-families
// mapping (display order, top to bottom). Do not derive them from app code.
const PALETTE = [
  // Setup (blue)
  ['config', '#72a0f5'],
  ['setup', '#76bafe'],
  ['cli', '#a3e7ff'],
  // Finding (cyan)
  ['query', '#3bcddc'],
  ['accessibility', '#75ecde'],
  // Acting (green)
  ['action', '#3ec87d'],
  ['utility', '#84d987'],
  ['clock', '#b8e688'],
  ['media', '#e2f07d'],
  // Debugging (yellow)
  ['tracing', '#f4c43a'],
  ['network', '#f4e886'],
  // Checking (orange)
  ['assertion', '#f98e52'],
  ['api', '#feb671'],
  // Structure (rose)
  ['fixture', '#f0777a'],
  ['pattern', '#f996a9'],
  ['component', '#ffb5cd'],
];

const TILE_TEXT = [15, 23, 42]; // #0f172a, same as the page background
const MIN_CONTRAST = 4.5;

const hexToRgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
const rgbString = ([r, g, b]) => `rgb(${r}, ${g}, ${b})`;
const parseRgb = (s) =>
  s
    .match(/\d+(\.\d+)?/g)
    .slice(0, 3)
    .map(Number);

// WCAG 2.x relative luminance and contrast ratio
function luminance([r, g, b]) {
  const lin = [r, g, b].map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * lin[0] + 0.7152 * lin[1] + 0.0722 * lin[2];
}
function contrast(a, b) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

test.beforeEach(async ({ page }) => {
  await page.route('**/rest/v1/**', (route) => route.fulfill({ json: [] }));
  await page.route('**/functions/v1/**', (route) => route.fulfill({ status: 200, body: '' }));
  await page.goto('/');
  await page.locator('.tile').first().waitFor();
});

test.describe('Category order and data colours', () => {
  test('categories are in family display order', async ({ page }) => {
    const cls = await page.evaluate(() => window.categories.map((c) => c.cls));
    expect(cls).toEqual(PALETTE.map(([c]) => c));
  });

  test('each category colour equals its approved fill', async ({ page }) => {
    const colours = await page.evaluate(() =>
      Object.fromEntries(window.categories.map((c) => [c.cls, c.color]))
    );
    for (const [cls, fill] of PALETTE) {
      expect(colours[cls], cls).toBe(fill);
    }
  });
});

test.describe('Tile fills', () => {
  for (const [cls, fill] of PALETTE) {
    test(`.${cls} tile is a flat ${fill} fill with dark text`, async ({ page }) => {
      const style = await page
        .locator(`.tile.${cls}`)
        .first()
        .evaluate((el) => {
          const s = getComputedStyle(el);
          return { bg: s.backgroundColor, image: s.backgroundImage, color: s.color };
        });
      expect(style.bg).toBe(rgbString(hexToRgb(fill)));
      expect(style.image).toBe('none');
      expect(style.color).toBe(rgbString(TILE_TEXT));
    });

    test(`.${cls} tile text is readable (>= ${MIN_CONTRAST}:1, full opacity)`, async ({ page }) => {
      const parts = await page
        .locator(`.tile.${cls}`)
        .first()
        .evaluate((el) => {
          const bg = getComputedStyle(el).backgroundColor;
          return [...el.querySelectorAll('.tile-num, .tile-name, .tile-level, .tile-level *')].map(
            (n) => {
              const s = getComputedStyle(n);
              return { sel: n.className || n.tagName, color: s.color, opacity: s.opacity, bg };
            }
          );
        });
      expect(parts.length).toBeGreaterThan(0);
      for (const p of parts) {
        expect(p.opacity, `${cls} ${p.sel} opacity`).toBe('1');
        expect(
          contrast(parseRgb(p.color), parseRgb(p.bg)),
          `${cls} ${p.sel} ${p.color} on ${p.bg}`
        ).toBeGreaterThanOrEqual(MIN_CONTRAST);
      }
    });
  }
});

test.describe('Tile shape', () => {
  test('tiles are square', async ({ page }) => {
    const boxes = await page.locator('.tile').evaluateAll((els) =>
      els.slice(0, 40).map((el) => {
        const r = el.getBoundingClientRect();
        return { w: r.width, h: r.height };
      })
    );
    for (const b of boxes) {
      expect(Math.abs(b.w - b.h)).toBeLessThanOrEqual(1);
    }
  });

  test('desktop grid shows at most 6 tiles per row', async ({ page }) => {
    test.skip((page.viewportSize()?.width ?? 0) < 1100, 'desktop width only');
    const tops = await page
      .locator('.tile')
      .evaluateAll((els) =>
        els.slice(0, 20).map((el) => Math.round(el.getBoundingClientRect().top))
      );
    const firstRow = tops.filter((t) => t === tops[0]).length;
    expect(firstRow).toBe(6);
  });

  test('tile text stays inside the tile', async ({ page }) => {
    const overflow = await page
      .locator('.tile')
      .evaluateAll((els) =>
        els
          .filter(
            (el) => el.scrollWidth > el.clientWidth + 1 || el.scrollHeight > el.clientHeight + 1
          )
          .map((el) => el.querySelector('.tile-name')?.textContent)
      );
    expect(overflow).toEqual([]);
  });
});

test.describe('Tile states', () => {
  test('hover lifts the tile instead of scaling it', async ({ page }) => {
    const tile = page.locator('.tile').first();
    await tile.scrollIntoViewIfNeeded();
    await tile.hover();
    await expect
      .poll(() => tile.evaluate((el) => getComputedStyle(el).transform))
      .toBe('matrix(1, 0, 0, 1, 0, -2)');
  });

  test('tiles are keyboard focusable with a visible ring', async ({ page }) => {
    const tile = page.locator('.tile').first();
    await expect(tile).toHaveAttribute('tabindex', '0');
    await tile.focus();
    await page.keyboard.press('Shift+Tab');
    await page.keyboard.press('Tab');
    const outline = await tile.evaluate((el) => {
      const s = getComputedStyle(el);
      return { width: s.outlineWidth, color: s.outlineColor, offset: s.outlineOffset };
    });
    expect(outline).toEqual({ width: '3px', color: 'rgb(248, 250, 252)', offset: '2px' });
  });

  test('Enter on a focused tile opens the modal', async ({ page }) => {
    await page.locator('.tile').first().focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('#modal')).toBeVisible();
  });
});

test.describe('Page surfaces and text', () => {
  test('body background is the page slate', async ({ page }) => {
    const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    expect(bg).toBe('rgb(15, 23, 42)');
  });

  test('group headers are readable on the page', async ({ page }) => {
    await page.locator('#btnGrouped').click();
    const headers = await page
      .locator('.group-header span')
      .evaluateAll((els) =>
        els
          .filter((el) => el.parentElement.classList.contains('group-header'))
          .map((el) => getComputedStyle(el).color)
      );
    expect(headers.length).toBe(PALETTE.length);
    for (const color of headers) {
      expect(contrast(parseRgb(color), [15, 23, 42]), color).toBeGreaterThanOrEqual(MIN_CONTRAST);
    }
  });

  test('group headers follow the family order', async ({ page }) => {
    await page.locator('#btnGrouped').click();
    const colours = await page
      .locator('.group-header > span')
      .evaluateAll((els) => els.map((el) => getComputedStyle(el).color));
    expect(colours).toEqual(PALETTE.map(([, fill]) => rgbString(hexToRgb(fill))));
  });

  test('filter dots use the category fills', async ({ page }) => {
    const dots = await page
      .locator('.filter-dot')
      .evaluateAll((els) => els.map((el) => getComputedStyle(el).backgroundColor));
    for (const [, fill] of PALETTE) {
      expect(dots).toContain(rgbString(hexToRgb(fill)));
    }
  });

  test('modal description, tip and code comments are readable', async ({ page }) => {
    await page.locator('.tile').first().click();
    await expect(page.locator('#modal')).toBeVisible();
    const pairs = await page.evaluate(() => {
      const bgOf = (sel) => getComputedStyle(document.querySelector(sel)).backgroundColor;
      const colOf = (sel) => getComputedStyle(document.querySelector(sel)).color;
      const out = [
        ['desc', colOf('#m-desc'), bgOf('.modal-content')],
        ['tip', colOf('#m-tip'), bgOf('#m-tip')],
        ['btn-docs', colOf('#btn-docs'), bgOf('.modal-content')],
      ];
      const comment = document.querySelector('#m-code .tok-comment');
      if (comment) out.push(['comment', getComputedStyle(comment).color, bgOf('#m-code')]);
      return out;
    });
    for (const [name, color, bg] of pairs) {
      expect(
        contrast(parseRgb(color), parseRgb(bg)),
        `${name} ${color} on ${bg}`
      ).toBeGreaterThanOrEqual(MIN_CONTRAST);
    }
  });

  test('syntax comment token is readable on the code block', async ({ page }) => {
    const color = await page.evaluate(() => {
      const pre = document.createElement('pre');
      pre.id = 'm-code';
      pre.innerHTML = window.highlight('// note');
      document.body.appendChild(pre);
      const el = pre.querySelector('.tok-comment');
      return getComputedStyle(el).color;
    });
    expect(contrast(parseRgb(color), [2, 6, 23])).toBeGreaterThanOrEqual(MIN_CONTRAST);
  });
});
