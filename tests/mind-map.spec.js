// Unit tests for js/mind-map.js: renderMindMap() on a small fixture map, independent of the
// API testing page's real content. Covers the markup, escaping, section numbers, sub-branch
// leaves, breadcrumbs, the curved links and their redraw, and the narrow-screen tree.
import { test, expect } from '@playwright/test';
import { openHarness } from './helpers/guide.js';

// Six sections: a start, two groups of branches (one with a sub-branch section), and a recap
const SECTIONS = ['intro', 'alpha', 'beta', 'beta-more', 'gamma', 'wrap'].map((id) => ({
  id,
  title: `Title ${id}`,
  cols: ['A', 'B', 'C'],
  rows: [['a', 'b', 'c']],
  text: true,
}));

const MAP = {
  root: 'Root <topic>',
  sub: 'Sub & line',
  start: { id: 'intro', label: 'Start here' },
  recap: [{ id: 'wrap', label: 'Recap' }],
  groups: [
    {
      name: 'First group',
      branches: [
        { id: 'alpha', label: 'Alpha <b>', leaves: ['plain leaf', 'chip `use()` leaf'] },
        {
          id: 'beta',
          label: 'Beta',
          heart: true,
          leaves: ['one', { id: 'beta-more', text: 'more on `beta`' }],
        },
      ],
    },
    { name: 'Second group', branches: [{ id: 'gamma', label: 'Gamma', leaves: ['g1'] }] },
  ],
};

// Renders the fixture sections, then the map, with the real modules
async function render(page, map = MAP, { sections = SECTIONS, target = 'default' } = {}) {
  await page.evaluate(
    async ([secs, m, where]) => {
      const { renderGuide } = await import('/js/guide.js');
      const { renderMindMap } = await import('/js/mind-map.js');
      renderGuide(secs, { linkColumns: {} });
      if (where === 'default') renderMindMap(m);
      else renderMindMap(m, document.getElementById(where));
    },
    [sections, map, target]
  );
}

test.beforeEach(async ({ page }) => {
  await openHarness(page);
});

/* ── MARKUP ────────────────────────────────────────────────────── */
test.describe('renderMindMap(): markup', () => {
  test('draws the root with its title, subtitle, start and recap links', async ({ page }) => {
    await render(page);
    await expect(page.locator('.mm-root-title')).toHaveText('Root <topic>');
    await expect(page.locator('.mm-root-sub')).toHaveText('Sub & line');
    const links = await page
      .locator('.mm-root-links a')
      .evaluateAll((els) => els.map((a) => [a.textContent, a.getAttribute('href')]));
    expect(links).toEqual([
      ['Start here', '#intro'],
      ['Recap', '#wrap'],
    ]);
  });

  test('numbers the groups from 1 and gives each its colour class', async ({ page }) => {
    await render(page);
    await expect(page.locator('.mm-group-title')).toHaveText(['1First group', '2Second group']);
    const classes = await page
      .locator('.mm-group')
      .evaluateAll((els) => els.map((el) => el.className));
    expect(classes).toEqual(['mm-group mm-g1', 'mm-group mm-g2']);
    const groups = await page
      .locator('.mm-branch')
      .evaluateAll((els) => els.map((el) => el.dataset.group));
    expect(groups).toEqual(['mm-g1', 'mm-g1', 'mm-g2']);
  });

  test('each branch links to its section and shows that section number', async ({ page }) => {
    await render(page);
    const nodes = await page
      .locator('.mm-node')
      .evaluateAll((els) =>
        els.map((a) => [a.getAttribute('href'), a.querySelector('.mm-num').textContent])
      );
    // renderGuide numbers sections 01..06 in order: alpha 02, beta 03, gamma 05
    expect(nodes).toEqual([
      ['#alpha', '02'],
      ['#beta', '03'],
      ['#gamma', '05'],
    ]);
  });

  test('a branch whose section is missing still renders, with no number', async ({ page }) => {
    const map = structuredClone(MAP);
    map.groups[1].branches[0].id = 'nowhere';
    await render(page, map);
    await expect(page.locator('.mm-node[href="#nowhere"] .mm-num')).toHaveText('');
  });

  test('only the heart branch is marked as the heart', async ({ page }) => {
    await render(page);
    await expect(page.locator('.mm-branch.mm-heart .mm-node')).toHaveAttribute('href', '#beta');
    await expect(page.locator('.mm-branch.mm-heart')).toHaveCount(1);
  });

  test('string leaves become list items with chips; object leaves link to their section', async ({
    page,
  }) => {
    await render(page);
    await expect(page.locator('.mm-node[href="#alpha"] + .mm-leaves li')).toHaveText([
      'plain leaf',
      'chip use() leaf',
    ]);
    await expect(page.locator('.mm-node[href="#alpha"] + .mm-leaves code.inl')).toHaveText('use()');
    const sub = page.locator('.mm-sub');
    await expect(sub).toHaveCount(1);
    await expect(sub).toHaveAttribute('href', '#beta-more');
    await expect(sub).toHaveText('more on beta');
  });

  test('labels and names are escaped, never parsed as HTML', async ({ page }) => {
    await render(page);
    await expect(page.locator('.mm-node[href="#alpha"]')).toHaveText('02Alpha <b>');
    await expect(page.locator('#mindmap b, .mm-root-title topic')).toHaveCount(0);
  });

  test('the SVG layer is hidden from assistive tech', async ({ page }) => {
    await render(page);
    const svg = page.locator('#mindmap svg.mm-links');
    await expect(svg).toHaveAttribute('aria-hidden', 'true');
    await expect(svg).toHaveAttribute('focusable', 'false');
  });

  test('does nothing, and throws nothing, without a container', async ({ page }) => {
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.evaluate(() => document.getElementById('mindmap').remove());
    await render(page);
    await expect(page.locator('.mm-root, .mm-crumb')).toHaveCount(0);
    expect(errors).toEqual([]);
  });

  test('renders into a container passed in', async ({ page }) => {
    await page.evaluate(() =>
      document
        .querySelector('main')
        .insertAdjacentHTML('afterbegin', '<nav id="other" class="mindmap"></nav>')
    );
    await render(page, MAP, { target: 'other' });
    await expect(page.locator('#other .mm-branch')).toHaveCount(3);
    await expect(page.locator('#mindmap .mm-branch')).toHaveCount(0);
  });
});

/* ── BREADCRUMBS ───────────────────────────────────────────────── */
test.describe('renderMindMap(): breadcrumbs', () => {
  test('every section gets a crumb before its heading, linking back to the map', async ({
    page,
  }) => {
    await render(page);
    for (const { id } of SECTIONS) {
      const first = await page
        .locator(`#${id}`)
        .evaluate((sec) => [sec.children[0].className, sec.children[1].tagName]);
      expect(first, id).toEqual([expect.stringContaining('mm-crumb'), 'H2']);
      await expect(page.locator(`#${id} .mm-crumb a`), id).toHaveAttribute('href', '#mindmap');
    }
  });

  test('crumbs name the group step and branch, in the group colour', async ({ page }) => {
    await render(page);
    const crumbs = await page
      .locator('.mm-crumb')
      .evaluateAll((els) =>
        Object.fromEntries(
          els.map((el) => [
            el.closest('section').id,
            [el.querySelector('span').textContent, el.classList[1]],
          ])
        )
      );
    expect(crumbs).toEqual({
      intro: ['Start here', 'mm-g0'],
      alpha: ['1 First group › Alpha <b>', 'mm-g1'],
      beta: ['1 First group › Beta', 'mm-g1'],
      'beta-more': ['1 First group › Beta', 'mm-g1'],
      gamma: ['2 Second group › Gamma', 'mm-g2'],
      wrap: ['Recap', 'mm-g0'],
    });
  });

  test('a section the map does not know is skipped without an error', async ({ page }) => {
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    const map = structuredClone(MAP);
    map.recap.push({ id: 'missing', label: 'Missing' });
    await render(page, map);
    await expect(page.locator('.mm-crumb')).toHaveCount(SECTIONS.length);
    expect(errors).toEqual([]);
  });

  test('a crumb never changes the section layout to more than one column', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await render(page);
    const columns = await page
      .locator('.guide section')
      .evaluateAll((els) =>
        els.map((el) => getComputedStyle(el).gridTemplateColumns.trim().split(/\s+/).length)
      );
    expect(new Set(columns)).toEqual(new Set([1]));
  });

  test('clicking a crumb link returns to the map', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 600 });
    await render(page);
    await page.locator('#wrap .mm-crumb a').scrollIntoViewIfNeeded();
    await page.locator('#wrap .mm-crumb a').click();
    await expect(page.locator('#mindmap')).toBeInViewport();
  });
});

/* ── LINKS ─────────────────────────────────────────────────────── */
test.describe('renderMindMap(): curved links', () => {
  // End point of each path, and the node box it should land on, relative to the map
  const geometry = (page) =>
    page.locator('#mindmap').evaluate((map) => {
      const box = map.getBoundingClientRect();
      const root = map.querySelector('.mm-root').getBoundingClientRect();
      const nodes = [...map.querySelectorAll('.mm-node')].map((n) => n.getBoundingClientRect());
      return [...map.querySelectorAll('.mm-links path')].map((p, i) => {
        const nums = p
          .getAttribute('d')
          .match(/-?\d+(\.\d+)?/g)
          .map(Number);
        const [sx, sy] = nums.slice(0, 2);
        const [ex, ey] = nums.slice(-2);
        const n = nodes[i];
        return {
          cls: p.getAttribute('class'),
          start: { x: sx, y: sy },
          end: { x: ex, y: ey },
          root: {
            left: root.left - box.left,
            right: root.right - box.left,
            midY: root.top + root.height / 2 - box.top,
          },
          node: {
            left: n.left - box.left,
            right: n.right - box.left,
            midY: n.top + n.height / 2 - box.top,
            leftSide: n.left + n.width / 2 < root.left + root.width / 2,
          },
        };
      });
    });

  test('one path per branch, coloured by group, gold for the heart', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await render(page);
    const classes = await page
      .locator('.mm-links path')
      .evaluateAll((els) => els.map((el) => el.getAttribute('class')));
    expect(classes).toEqual(['mm-link mm-g1', 'mm-link mm-g1 mm-heart', 'mm-link mm-g2']);
  });

  test('each path runs from the root side facing the node to the node inner edge', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await render(page);
    const links = await geometry(page);
    expect(links).toHaveLength(3);
    for (const l of links) {
      expect(Math.abs(l.start.y - l.root.midY)).toBeLessThan(0.2);
      expect(Math.abs(l.end.y - l.node.midY)).toBeLessThan(0.2);
      if (l.node.leftSide) {
        expect(Math.abs(l.start.x - l.root.left)).toBeLessThan(0.2);
        expect(Math.abs(l.end.x - l.node.right)).toBeLessThan(0.2);
      } else {
        expect(Math.abs(l.start.x - l.root.right)).toBeLessThan(0.2);
        expect(Math.abs(l.end.x - l.node.left)).toBeLessThan(0.2);
      }
    }
    // Group 1 sits left of the root, group 2 right of it
    expect(links.map((l) => l.node.leftSide)).toEqual([true, true, false]);
  });

  test('the viewBox matches the map, so links line up at any size', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await render(page);
    const [viewBox, size] = await page.locator('#mindmap').evaluate((map) => {
      const r = map.getBoundingClientRect();
      return [
        map.querySelector('.mm-links').getAttribute('viewBox'),
        `0 0 ${r.width.toFixed(1)} ${r.height.toFixed(1)}`,
      ];
    });
    expect(viewBox).toBe(size);
  });

  test('narrow screens draw no links and hide the layer', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await render(page);
    await expect(page.locator('.mm-links')).toBeHidden();
    await expect(page.locator('.mm-links path')).toHaveCount(0);
  });

  test('links are drawn when the map widens, and follow the nodes', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await render(page);
    await page.setViewportSize({ width: 1280, height: 900 });
    await expect(page.locator('.mm-links path')).toHaveCount(3);
    const wide = await page.locator('.mm-links path').first().getAttribute('d');
    await page.setViewportSize({ width: 1000, height: 900 });
    await expect
      .poll(() => page.locator('.mm-links path').first().getAttribute('d'))
      .not.toBe(wide);
    for (const l of await geometry(page)) expect(Math.abs(l.end.y - l.node.midY)).toBeLessThan(0.2);
  });
});

/* ── NARROW LAYOUT ─────────────────────────────────────────────── */
test.describe('renderMindMap(): narrow layout', () => {
  test('stacks root then groups in order, in one column, with no side scroll', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await render(page);
    const boxes = await page
      .locator('.mm-root, .mm-group')
      .evaluateAll((els) => els.map((el) => el.getBoundingClientRect().toJSON()));
    for (let i = 1; i < boxes.length; i++)
      expect(boxes[i].top).toBeGreaterThanOrEqual(boxes[i - 1].bottom);
    expect(new Set(boxes.map((b) => Math.round(b.left))).size).toBe(1);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)
    ).toBe(true);
  });

  test('each group hangs off a spine in its own colour', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await render(page);
    const spines = await page
      .locator('.mm-branches')
      .evaluateAll((els) => els.map((el) => getComputedStyle(el).borderLeftColor));
    expect(spines).toEqual(['rgb(118, 186, 254)', 'rgb(62, 200, 125)']);
  });
});
