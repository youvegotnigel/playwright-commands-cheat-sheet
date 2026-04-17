import { test, expect } from '@playwright/test';

// Access categories which data.js exposes as a global
test.beforeEach(async ({ page }) => {
  await page.goto('/');
});

test.describe('Data integrity', () => {
  test('categories array is non-empty', async ({ page }) => {
    const count = await page.evaluate(() => categories.length);
    expect(count).toBeGreaterThan(0);
  });

  test('every category has required fields (cat, cls, color, items)', async ({ page }) => {
    const issues = await page.evaluate(() => {
      const problems = [];
      categories.forEach((cat, i) => {
        if (!cat.cat)   problems.push(`categories[${i}] missing "cat"`);
        if (!cat.cls)   problems.push(`categories[${i}] missing "cls"`);
        if (!cat.color) problems.push(`categories[${i}] missing "color"`);
        if (!Array.isArray(cat.items) || cat.items.length === 0)
          problems.push(`categories[${i}] missing or empty "items"`);
      });
      return problems;
    });
    expect(issues).toEqual([]);
  });

  test('every item has required fields (name, level, desc, tip, docs, code)', async ({ page }) => {
    const issues = await page.evaluate(() => {
      const required = ['name', 'level', 'desc', 'tip', 'docs', 'code'];
      const problems = [];
      categories.forEach(cat => {
        cat.items.forEach(item => {
          required.forEach(field => {
            if (!item[field])
              problems.push(`"${item.name || '?'}" in "${cat.cat}" is missing "${field}"`);
          });
        });
      });
      return problems;
    });
    expect(issues).toEqual([]);
  });

  test('every item level is one of: beginner | intermediate | advanced', async ({ page }) => {
    const invalid = await page.evaluate(() => {
      const valid = new Set(['beginner', 'intermediate', 'advanced']);
      const bad = [];
      categories.forEach(cat => {
        cat.items.forEach(item => {
          if (!valid.has(item.level))
            bad.push(`"${item.name}" has invalid level: "${item.level}"`);
        });
      });
      return bad;
    });
    expect(invalid).toEqual([]);
  });

  test('every item docs URL starts with https://', async ({ page }) => {
    const invalid = await page.evaluate(() => {
      const bad = [];
      categories.forEach(cat => {
        cat.items.forEach(item => {
          if (!item.docs.startsWith('https://'))
            bad.push(`"${item.name}" has invalid docs URL: "${item.docs}"`);
        });
      });
      return bad;
    });
    expect(invalid).toEqual([]);
  });

  test('no duplicate command names within a category', async ({ page }) => {
    const duplicates = await page.evaluate(() => {
      const dupes = [];
      categories.forEach(cat => {
        const seen = new Set();
        cat.items.forEach(item => {
          if (seen.has(item.name))
            dupes.push(`Duplicate "${item.name}" in category "${cat.cat}"`);
          seen.add(item.name);
        });
      });
      return dupes;
    });
    expect(duplicates).toEqual([]);
  });

  test('no duplicate command names across all categories', async ({ page }) => {
    const duplicates = await page.evaluate(() => {
      const seen = new Set();
      const dupes = [];
      categories.forEach(cat => {
        cat.items.forEach(item => {
          if (seen.has(item.name))
            dupes.push(`"${item.name}" appears in more than one category`);
          seen.add(item.name);
        });
      });
      return dupes;
    });
    expect(duplicates).toEqual([]);
  });

  test('no field value is blank or whitespace only', async ({ page }) => {
    const issues = await page.evaluate(() => {
      const required = ['name', 'level', 'desc', 'tip', 'docs', 'code'];
      const problems = [];
      categories.forEach(cat => {
        cat.items.forEach(item => {
          required.forEach(field => {
            if (typeof item[field] === 'string' && item[field].trim() === '')
              problems.push(`"${item.name}" in "${cat.cat}" has blank "${field}"`);
          });
        });
      });
      return problems;
    });
    expect(issues).toEqual([]);
  });

  test('all docs URLs point to playwright.dev', async ({ page }) => {
    const invalid = await page.evaluate(() => {
      const bad = [];
      categories.forEach(cat => {
        cat.items.forEach(item => {
          if (!item.docs.includes('playwright.dev'))
            bad.push(`"${item.name}" docs URL does not point to playwright.dev: "${item.docs}"`);
        });
      });
      return bad;
    });
    expect(invalid).toEqual([]);
  });

  test('all code snippets are non-trivial (at least 20 characters)', async ({ page }) => {
    const issues = await page.evaluate(() => {
      const bad = [];
      categories.forEach(cat => {
        cat.items.forEach(item => {
          if (item.code.trim().length < 20)
            bad.push(`"${item.name}" has a suspiciously short code snippet: "${item.code.trim()}"`);
        });
      });
      return bad;
    });
    expect(issues).toEqual([]);
  });

  test('all category colors are valid hex codes', async ({ page }) => {
    const invalid = await page.evaluate(() => {
      const hexPattern = /^#[0-9a-fA-F]{6}$/;
      const bad = [];
      categories.forEach(cat => {
        if (!hexPattern.test(cat.color))
          bad.push(`Category "${cat.cat}" has invalid color: "${cat.color}"`);
      });
      return bad;
    });
    expect(invalid).toEqual([]);
  });
});
