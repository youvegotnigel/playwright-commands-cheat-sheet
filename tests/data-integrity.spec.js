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
        if (!cat.cat) problems.push(`categories[${i}] missing "cat"`);
        if (!cat.cls) problems.push(`categories[${i}] missing "cls"`);
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
      categories.forEach((cat) => {
        cat.items.forEach((item) => {
          required.forEach((field) => {
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
      categories.forEach((cat) => {
        cat.items.forEach((item) => {
          if (!valid.has(item.level)) bad.push(`"${item.name}" has invalid level: "${item.level}"`);
        });
      });
      return bad;
    });
    expect(invalid).toEqual([]);
  });

  test('every item docs URL starts with https://', async ({ page }) => {
    const invalid = await page.evaluate(() => {
      const bad = [];
      categories.forEach((cat) => {
        cat.items.forEach((item) => {
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
      categories.forEach((cat) => {
        const seen = new Set();
        cat.items.forEach((item) => {
          if (seen.has(item.name)) dupes.push(`Duplicate "${item.name}" in category "${cat.cat}"`);
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
      categories.forEach((cat) => {
        cat.items.forEach((item) => {
          if (seen.has(item.name)) dupes.push(`"${item.name}" appears in more than one category`);
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
      categories.forEach((cat) => {
        cat.items.forEach((item) => {
          required.forEach((field) => {
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
      categories.forEach((cat) => {
        cat.items.forEach((item) => {
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
      categories.forEach((cat) => {
        cat.items.forEach((item) => {
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
      categories.forEach((cat) => {
        if (!hexPattern.test(cat.color))
          bad.push(`Category "${cat.cat}" has invalid color: "${cat.color}"`);
      });
      return bad;
    });
    expect(invalid).toEqual([]);
  });

  test('no field contains an em-dash or en-dash (use periods, commas, or hyphens)', async ({
    page,
  }) => {
    const offenders = await page.evaluate(() => {
      const fields = ['name', 'level', 'desc', 'tip', 'docs', 'code'];
      const bad = [];
      categories.forEach((cat) => {
        cat.items.forEach((item) => {
          fields.forEach((field) => {
            const value = item[field];
            if (typeof value !== 'string') return;
            if (value.includes('—'))
              bad.push(`"${item.name}" in "${cat.cat}" has an em-dash in "${field}"`);
            if (value.includes('–'))
              bad.push(`"${item.name}" in "${cat.cat}" has an en-dash in "${field}"`);
          });
        });
      });
      return bad;
    });
    expect(offenders).toEqual([]);
  });
});

test.describe('test.info() entry', () => {
  test('test.info() exists in the Setup category', async ({ page }) => {
    const found = await page.evaluate(() => {
      const setup = categories.find((c) => c.cat === 'Setup');
      return setup ? setup.items.some((i) => i.name === 'test.info()') : false;
    });
    expect(found).toBe(true);
  });

  test('test.info() has level intermediate', async ({ page }) => {
    const level = await page.evaluate(() => {
      const setup = categories.find((c) => c.cat === 'Setup');
      return setup?.items.find((i) => i.name === 'test.info()')?.level;
    });
    expect(level).toBe('intermediate');
  });

  test('test.info() docs URL points to the TestInfo class', async ({ page }) => {
    const docs = await page.evaluate(() => {
      const setup = categories.find((c) => c.cat === 'Setup');
      return setup?.items.find((i) => i.name === 'test.info()')?.docs ?? '';
    });
    expect(docs).toBe('https://playwright.dev/docs/api/class-testinfo');
  });

  test('test.info() code covers key properties and methods', async ({ page }) => {
    const code = await page.evaluate(() => {
      const setup = categories.find((c) => c.cat === 'Setup');
      return setup?.items.find((i) => i.name === 'test.info()')?.code ?? '';
    });
    expect(code).toContain('title');
    expect(code).toContain('retry');
    expect(code).toContain('outputDir');
    expect(code).toContain('setTimeout');
    expect(code).toContain('attach');
  });

  test('test.info() tip clarifies that testInfo and test.info() are identical', async ({
    page,
  }) => {
    const tip = await page.evaluate(() => {
      const setup = categories.find((c) => c.cat === 'Setup');
      return setup?.items.find((i) => i.name === 'test.info()')?.tip ?? '';
    });
    expect(tip).toContain('testInfo');
    expect(tip.toLowerCase()).toContain('identical');
  });

  test('afterEach() tip mentions testInfo === test.info() equivalence', async ({ page }) => {
    const tip = await page.evaluate(() => {
      const setup = categories.find((c) => c.cat === 'Setup');
      return setup?.items.find((i) => i.name === 'afterEach()')?.tip ?? '';
    });
    expect(tip).toContain('testInfo');
    expect(tip).toContain('test.info()');
  });
});

test.describe('consoleMessages() entry', () => {
  test('consoleMessages() exists in the Utility category', async ({ page }) => {
    const found = await page.evaluate(() => {
      const utility = categories.find((c) => c.cat === 'Utility');
      return utility ? utility.items.some((i) => i.name === 'consoleMessages()') : false;
    });
    expect(found).toBe(true);
  });

  test('consoleMessages() has level intermediate', async ({ page }) => {
    const level = await page.evaluate(() => {
      const utility = categories.find((c) => c.cat === 'Utility');
      return utility?.items.find((i) => i.name === 'consoleMessages()')?.level;
    });
    expect(level).toBe('intermediate');
  });

  test('consoleMessages() code covers consoleMessages() and type()', async ({ page }) => {
    const code = await page.evaluate(() => {
      const utility = categories.find((c) => c.cat === 'Utility');
      return utility?.items.find((i) => i.name === 'consoleMessages()')?.code ?? '';
    });
    expect(code).toContain('consoleMessages()');
    expect(code).toContain('type()');
  });
});

test.describe('pageErrors() entry', () => {
  test('pageErrors() exists in the Utility category', async ({ page }) => {
    const found = await page.evaluate(() => {
      const utility = categories.find((c) => c.cat === 'Utility');
      return utility ? utility.items.some((i) => i.name === 'pageErrors()') : false;
    });
    expect(found).toBe(true);
  });

  test('pageErrors() has level intermediate', async ({ page }) => {
    const level = await page.evaluate(() => {
      const utility = categories.find((c) => c.cat === 'Utility');
      return utility?.items.find((i) => i.name === 'pageErrors()')?.level;
    });
    expect(level).toBe('intermediate');
  });

  test('pageErrors() code covers pageErrors() and toHaveLength', async ({ page }) => {
    const code = await page.evaluate(() => {
      const utility = categories.find((c) => c.cat === 'Utility');
      return utility?.items.find((i) => i.name === 'pageErrors()')?.code ?? '';
    });
    expect(code).toContain('pageErrors()');
    expect(code).toContain('toHaveLength');
  });
});

test.describe('expect.configure() entry', () => {
  test('expect.configure() exists in the Assertions category', async ({ page }) => {
    const found = await page.evaluate(() => {
      const assertions = categories.find((c) => c.cat === 'Assertions');
      return assertions ? assertions.items.some((i) => i.name === 'expect.configure()') : false;
    });
    expect(found).toBe(true);
  });

  test('expect.configure() has level advanced', async ({ page }) => {
    const level = await page.evaluate(() => {
      const assertions = categories.find((c) => c.cat === 'Assertions');
      return assertions?.items.find((i) => i.name === 'expect.configure()')?.level;
    });
    expect(level).toBe('advanced');
  });

  test('expect.configure() docs URL points to the expectconfigure section', async ({ page }) => {
    const docs = await page.evaluate(() => {
      const assertions = categories.find((c) => c.cat === 'Assertions');
      return assertions?.items.find((i) => i.name === 'expect.configure()')?.docs ?? '';
    });
    expect(docs).toBe('https://playwright.dev/docs/test-assertions#expectconfigure');
  });

  test('expect.configure() code covers timeout and soft defaults', async ({ page }) => {
    const code = await page.evaluate(() => {
      const assertions = categories.find((c) => c.cat === 'Assertions');
      return assertions?.items.find((i) => i.name === 'expect.configure()')?.code ?? '';
    });
    expect(code).toContain('expect.configure(');
    expect(code).toContain('timeout');
    expect(code).toContain('soft');
  });
});

test.describe('Playwright 1.62 entries', () => {
  test('locator.waitForFunction() exists in the Query category as intermediate', async ({
    page,
  }) => {
    const entry = await page.evaluate(() => {
      const query = categories.find((c) => c.cat === 'Query');
      return query?.items.find((i) => i.name === 'locator.waitForFunction()') ?? null;
    });
    expect(entry).not.toBeNull();
    expect(entry.level).toBe('intermediate');
    expect(entry.docs).toBe(
      'https://playwright.dev/docs/api/class-locator#locator-wait-for-function'
    );
  });

  test('locator.waitForFunction() code calls the method on a locator', async ({ page }) => {
    const code = await page.evaluate(() => {
      const query = categories.find((c) => c.cat === 'Query');
      return query?.items.find((i) => i.name === 'locator.waitForFunction()')?.code ?? '';
    });
    expect(code).toContain('.waitForFunction(');
    // The element is the first argument, which is what distinguishes it from
    // page.waitForFunction().
    expect(code).toContain('el');
  });

  test("scroll: 'none' option exists in the Action category as advanced", async ({ page }) => {
    const entry = await page.evaluate(() => {
      const action = categories.find((c) => c.cat === 'Action');
      return action?.items.find((i) => i.name === "scroll: 'none' option") ?? null;
    });
    expect(entry).not.toBeNull();
    expect(entry.level).toBe('advanced');
  });

  test("scroll option code shows both 'none' and the 'auto' default", async ({ page }) => {
    const code = await page.evaluate(() => {
      const action = categories.find((c) => c.cat === 'Action');
      return action?.items.find((i) => i.name === "scroll: 'none' option")?.code ?? '';
    });
    expect(code).toContain("scroll: 'none'");
    expect(code).toContain("scroll: 'auto'");
  });

  test('apiResponse.timing() exists in the API category as advanced', async ({ page }) => {
    const entry = await page.evaluate(() => {
      const api = categories.find((c) => c.cat === 'API');
      return api?.items.find((i) => i.name === 'apiResponse.timing()') ?? null;
    });
    expect(entry).not.toBeNull();
    expect(entry.level).toBe('advanced');
    expect(entry.docs).toBe(
      'https://playwright.dev/docs/api/class-apiresponse#api-response-timing'
    );
  });

  test('apiResponse.timing() code reads timing milestones and guards -1', async ({ page }) => {
    const code = await page.evaluate(() => {
      const api = categories.find((c) => c.cat === 'API');
      return api?.items.find((i) => i.name === 'apiResponse.timing()')?.code ?? '';
    });
    expect(code).toContain('.timing()');
    expect(code).toContain('responseStart');
    // Unavailable values come back as -1, so the example must show the guard.
    expect(code).toContain('-1');
  });

  test('WebAuthn passkeys entry notes v1.62 storage state persistence', async ({ page }) => {
    const tip = await page.evaluate(() => {
      const patterns = categories.find((c) => c.cat === 'Patterns');
      return patterns?.items.find((i) => i.name === 'WebAuthn passkeys')?.tip ?? '';
    });
    expect(tip).toContain('storageState');
    expect(tip).toContain('v1.62');
  });
});

test.describe('Reorganized categories', () => {
  // Helper: return the list of category names that contain a command.
  const homesOf = (page, name) =>
    page.evaluate(
      (cmd) => categories.filter((c) => c.items.some((i) => i.name === cmd)).map((c) => c.cat),
      name
    );

  const namesIn = (page, cat) =>
    page.evaluate(
      (name) => categories.find((c) => c.cat === name)?.items.map((i) => i.name) ?? [],
      cat
    );

  const newCategories = [
    'Network & Mocking',
    'Clock & Time',
    'Fixtures',
    'Tracing & Debugging',
    'Component Testing',
    'Media & Audio',
  ];

  for (const cat of newCategories) {
    test(`category "${cat}" exists with at least one item`, async ({ page }) => {
      const count = await page.evaluate(
        (name) => categories.find((c) => c.cat === name)?.items.length ?? 0,
        cat
      );
      expect(count).toBeGreaterThan(0);
    });
  }

  /* ── Moved tiles: now in the new home, and removed from the old one ── */
  // Each entry asserts the command resolves to exactly one category (its new
  // home), which simultaneously proves it was removed from where it used to live.
  const moves = [
    // From API -> Network & Mocking
    { name: 'route()', to: 'Network & Mocking' },
    { name: 'route.fulfill()', to: 'Network & Mocking' },
    { name: 'route.abort()', to: 'Network & Mocking' },
    { name: 'route.continue()', to: 'Network & Mocking' },
    { name: 'route.fetch()', to: 'Network & Mocking' },
    { name: 'waitForResponse()', to: 'Network & Mocking' },
    { name: 'waitForRequest()', to: 'Network & Mocking' },
    { name: 'page.unroute()', to: 'Network & Mocking' },
    { name: 'context.route()', to: 'Network & Mocking' },
    { name: 'routeFromHAR()', to: 'Network & Mocking' },
    // From Utility -> Tracing & Debugging
    { name: 'pause()', to: 'Tracing & Debugging' },
    // From Config -> Tracing & Debugging
    { name: 'trace', to: 'Tracing & Debugging' },
    // From CLI -> Tracing & Debugging
    { name: '--debug', to: 'Tracing & Debugging' },
    { name: 'show-trace', to: 'Tracing & Debugging' },
    { name: 'codegen', to: 'Tracing & Debugging' },
    { name: '--trace', to: 'Tracing & Debugging' },
    // From Setup -> Fixtures
    { name: 'test.extend()', to: 'Fixtures' },
  ];

  for (const { name, to } of moves) {
    test(`"${name}" lives only in "${to}"`, async ({ page }) => {
      expect(await homesOf(page, name)).toEqual([to]);
    });
  }

  // Still an exhaustive list, so unrelated entries cannot drift back into this
  // category. apiResponse.timing() was added deliberately for Playwright v1.62:
  // it reads the response returned by these same request.* calls.
  test('the API category holds the request.* commands plus apiResponse.timing()', async ({
    page,
  }) => {
    const names = await namesIn(page, 'API');
    expect(names).toEqual([
      'request.get()',
      'request.post()',
      'request.put()',
      'request.patch()',
      'request.delete()',
      'apiResponse.timing()',
    ]);
  });

  test('"page.clock" was split into methods and no longer exists as an entry', async ({ page }) => {
    expect(await homesOf(page, 'page.clock')).toEqual([]);
  });

  /* ── New tiles: every newly-added command is present in its category ── */
  const expectedCommands = {
    'Network & Mocking': [
      'Block resources by type', // new
      'requests()', // new (v1.56)
      'context.setOffline()', // new
      'page.routeWebSocket()', // new (v1.48)
      'WebSocketRoute.connectToServer()', // new
    ],
    'Clock & Time': [
      'clock.install()',
      'clock.setFixedTime()',
      'clock.setSystemTime()',
      'clock.runFor()',
      'clock.fastForward()',
      'clock.pauseAt()',
      'clock.resume()',
    ],
    Fixtures: [
      'test.extend()',
      'Fixture setup & teardown',
      'Worker-scoped fixture',
      'Auto fixture',
      'Override a built-in fixture',
      'Option fixtures',
    ],
    'Tracing & Debugging': [
      'context.tracing.start()', // new
      'tracing.startChunk()', // new
    ],
    'Component Testing': [
      'Setup (experimental-ct)',
      'mount()',
      'Passing props',
      'Component events',
      'component.update()',
      'component.unmount()',
      'Asserting on a component',
    ],
    'Media & Audio': [
      'Assert audio is playing',
      'audio.currentTime advances',
      'Assert audio is muted',
      'AnalyserNode peak amplitude',
      'WebRTC audio via getStats()',
    ],
  };

  for (const [cat, commands] of Object.entries(expectedCommands)) {
    test(`"${cat}" contains its expected commands`, async ({ page }) => {
      const names = await namesIn(page, cat);
      expect(names).toEqual(expect.arrayContaining(commands));
    });
  }

  test('Network & Mocking requests() example uses the v1.56 method', async ({ page }) => {
    const code = await page.evaluate(() => {
      const net = categories.find((c) => c.cat === 'Network & Mocking');
      return net?.items.find((i) => i.name === 'requests()')?.code ?? '';
    });
    expect(code).toContain('page.requests()');
  });

  test('Network & Mocking WebSocket examples use the real API', async ({ page }) => {
    const { wsCode, serverCode } = await page.evaluate(() => {
      const items = categories.find((c) => c.cat === 'Network & Mocking')?.items ?? [];
      return {
        wsCode: items.find((i) => i.name === 'page.routeWebSocket()')?.code ?? '',
        serverCode: items.find((i) => i.name === 'WebSocketRoute.connectToServer()')?.code ?? '',
      };
    });
    expect(wsCode).toContain('routeWebSocket');
    expect(wsCode).toContain('ws.send(');
    expect(serverCode).toContain('connectToServer()');
  });
});

test.describe('Media & Audio entries', () => {
  // Helper: fetch one item out of the Media & Audio category by name.
  const itemIn = (page, cat, name) =>
    page.evaluate(
      ([c, n]) => categories.find((x) => x.cat === c)?.items.find((i) => i.name === n) ?? null,
      [cat, name]
    );

  const levels = [
    ['Assert audio is playing', 'intermediate'],
    ['audio.currentTime advances', 'intermediate'],
    ['Assert audio is muted', 'intermediate'],
    ['AnalyserNode peak amplitude', 'advanced'],
    ['WebRTC audio via getStats()', 'advanced'],
  ];

  for (const [name, level] of levels) {
    test(`"${name}" exists in Media & Audio at level ${level}`, async ({ page }) => {
      const entry = await itemIn(page, 'Media & Audio', name);
      expect(entry).not.toBeNull();
      expect(entry.level).toBe(level);
    });
  }

  test('playback check reads paused, ended and readyState together', async ({ page }) => {
    const code = (await itemIn(page, 'Media & Audio', 'Assert audio is playing')).code;
    // All three are needed: paused alone does not prove the media is progressing.
    expect(code).toContain('paused');
    expect(code).toContain('ended');
    expect(code).toContain('readyState');
  });

  test('currentTime entry polls the playhead rather than sleeping', async ({ page }) => {
    const code = (await itemIn(page, 'Media & Audio', 'audio.currentTime advances')).code;
    expect(code).toContain('currentTime');
    expect(code).toContain('.poll(');
    expect(code).toContain('toBeGreaterThan');
  });

  test('muted entry distinguishes muted from volume', async ({ page }) => {
    const entry = await itemIn(page, 'Media & Audio', 'Assert audio is muted');
    expect(entry.code).toContain('muted');
    expect(entry.code).toContain('volume');
    // The tip must explain that the two properties are independent.
    expect(entry.tip).toContain('volume');
  });

  test('AnalyserNode entry measures real output through the Web Audio graph', async ({ page }) => {
    const entry = await itemIn(page, 'Media & Audio', 'AnalyserNode peak amplitude');
    expect(entry.code).toContain('AudioContext');
    expect(entry.code).toContain('createAnalyser');
    expect(entry.code).toContain('getFloatTimeDomainData');
    // Reconnecting to destination is the gotcha that keeps audio audible.
    expect(entry.code).toContain('ctx.destination');
  });

  test('WebRTC entry reads totalAudioEnergy from inbound-rtp audio stats', async ({ page }) => {
    const code = (await itemIn(page, 'Media & Audio', 'WebRTC audio via getStats()')).code;
    expect(code).toContain('getStats()');
    expect(code).toContain('inbound-rtp');
    expect(code).toContain('totalAudioEnergy');
  });

  test('no Media & Audio example uses a hard wait', async ({ page }) => {
    const offenders = await page.evaluate(() => {
      // Strip // comments before scanning, otherwise a comment explaining why a
      // hard wait is unnecessary counts as a hard wait. The [^:] guard keeps
      // '://' in URLs from being treated as the start of a comment.
      const stripComments = (code) => code.replace(/(^|[^:])\/\/.*$/gm, '$1');
      const cat = categories.find((c) => c.cat === 'Media & Audio');
      return (cat?.items ?? [])
        .filter((i) => {
          const src = stripComments(i.code);
          return src.includes('waitForTimeout') || src.includes('sleep(');
        })
        .map((i) => i.name);
    });
    expect(offenders).toEqual([]);
  });
});

test.describe('Chromium launchOptions entries', () => {
  const configItem = (page, name) =>
    page.evaluate(
      (n) => categories.find((c) => c.cat === 'Config')?.items.find((i) => i.name === n) ?? null,
      name
    );

  const groups = [
    'container stability',
    'visual determinism',
    'media and autoplay',
    'proxy and security',
    'performance',
    'accessibility',
    'mobile',
  ];

  test('the launchOptions umbrella entry exists at level intermediate', async ({ page }) => {
    const entry = await configItem(page, 'launchOptions');
    expect(entry).not.toBeNull();
    expect(entry.level).toBe('intermediate');
    expect(entry.code).toContain('launchOptions');
  });

  for (const group of groups) {
    const name = `launchOptions.args (${group})`;
    test(`"${name}" exists in Config at level advanced`, async ({ page }) => {
      const entry = await configItem(page, name);
      expect(entry).not.toBeNull();
      expect(entry.level).toBe('advanced');
      // Every group must actually show an args array under launchOptions.
      expect(entry.code).toContain('launchOptions');
      expect(entry.code).toContain('args: [');
    });
  }

  const switches = [
    ['container stability', ['--no-sandbox', '--disable-dev-shm-usage']],
    ['visual determinism', ['--force-device-scale-factor=1', '--font-render-hinting=none']],
    [
      'media and autoplay',
      ['--autoplay-policy=no-user-gesture-required', '--use-fake-device-for-media-stream'],
    ],
    ['proxy and security', ['--proxy-server=', '--ignore-certificate-errors']],
    ['performance', ['--disable-background-timer-throttling', '--disable-renderer-backgrounding']],
    ['accessibility', ['--force-prefers-reduced-motion', '--force-renderer-accessibility']],
    ['mobile', ['--touch-events=enabled', '--enable-viewport']],
  ];

  for (const [group, flags] of switches) {
    test(`"${group}" documents its defining Chromium switches`, async ({ page }) => {
      const code = (await configItem(page, `launchOptions.args (${group})`)).code;
      for (const flag of flags) expect(code).toContain(flag);
    });
  }

  // Where Playwright ships a cross-browser option, the entry must lead with it
  // rather than sending people straight to a Chromium-only flag.
  const prefersBuiltIn = [
    ['proxy and security', ['proxy:', 'ignoreHTTPSErrors']],
    ['accessibility', ['reducedMotion', 'forcedColors', 'colorScheme']],
    ['mobile', ['devices[', 'hasTouch']],
  ];

  for (const [group, options] of prefersBuiltIn) {
    test(`"${group}" shows the cross-browser option alongside the args`, async ({ page }) => {
      const code = (await configItem(page, `launchOptions.args (${group})`)).code;
      for (const option of options) expect(code).toContain(option);
    });
  }
});
