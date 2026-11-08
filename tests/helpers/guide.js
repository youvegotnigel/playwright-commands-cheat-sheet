// Shared by the guide page specs: backend mocks, contrast and the text checks on guide data.

export const MOCK_DATE = '2025-12-25';

// Every page that carries the Commands / Waits / Selectors page switch, in tab order.
// accent is the computed stroke colour of the tab icon's .accent part.
export const PAGES = [
  { path: '/', tab: 'Commands', icon: 'commands', accent: 'rgb(74, 222, 128)' },
  { path: '/waiting.html', tab: 'Waits', icon: 'waiting', accent: 'rgb(56, 189, 248)' },
  { path: '/locators.html', tab: 'Selectors', icon: 'locators', accent: 'rgb(192, 132, 252)' },
  { path: '/async.html', tab: 'Async', icon: 'async', accent: 'rgb(249, 150, 169)' },
];

// The meta-bar fallback values a page ships in its HTML
export async function fallbacks(page, path) {
  const html = await (await page.request.get(path)).text();
  const value = (id) => html.match(new RegExp(`id="${id}">([^<]+)<`))[1];
  return { version: value('pw-version'), date: value('last-updated') };
}

// Same convention as the other specs: never hit the real Supabase backend, and
// pin the stamped date so the last-updated badge is deterministic.
export async function mockBackends(page) {
  const state = { posts: 0 };
  await page.route('**/js/meta.json**', (route) =>
    route.fulfill({ json: { lastUpdated: MOCK_DATE } })
  );
  await page.route('**/rest/v1/**', (route) => route.fulfill({ json: [] }));
  await page.route('**/functions/v1/**', (route) => {
    if (route.request().method() === 'POST') state.posts += 1;
    route.fulfill({ status: 200, body: '' });
  });
  return state;
}

// Contrast ratio of an element's text against what is actually painted behind it
// (semi-transparent backgrounds composited over their ancestors), per WCAG 2.x
export async function contrastOf(page, selector) {
  return page
    .locator(selector)
    .first()
    .evaluate((el) => {
      const parse = (c) => {
        const [r, g, b, a = 1] = c.match(/[\d.]+/g).map(Number);
        return { r, g, b, a };
      };
      const over = (top, under) => ({
        r: top.r * top.a + under.r * (1 - top.a),
        g: top.g * top.a + under.g * (1 - top.a),
        b: top.b * top.a + under.b * (1 - top.a),
        a: 1,
      });
      const layers = [];
      for (let n = el; n; n = n.parentElement)
        layers.push(parse(getComputedStyle(n).backgroundColor));
      const bg = layers
        .reverse()
        .reduce((under, top) => over(top, under), { r: 255, g: 255, b: 255, a: 1 });
      const fg = over(parse(getComputedStyle(el).color), bg);
      const lum = ({ r, g, b }) => {
        const ch = (v) => ((v /= 255) <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
        return 0.2126 * ch(r) + 0.7152 * ch(g) + 0.0722 * ch(b);
      };
      const [hi, lo] = [lum(fg), lum(bg)].sort((x, y) => y - x);
      return (hi + 0.05) / (lo + 0.05);
    });
}

// Strip the data's inline markup the way a reader sees it: `code` -> code, <tag>X</tag> -> X
export const plain = (text) =>
  text.replace(/`([^`]+)`/g, '$1').replace(/<tag>([^<]+)<\/tag>/g, '$1');

const PAIRS = { ')': '(', ']': '[', '}': '{' };

// First unmatched or mismatched bracket or quote in a code example, or null when balanced.
// Skips the contents of strings (with \ escapes) and comments; a template literal's ${...}
// is scanned as code, so brackets inside it must balance too.
export function unbalanced(code) {
  const stack = []; // '(', '[', '{', or '${' for an open template substitution
  let i = 0;
  // Scans a string from its opening quote q at `from`: { end } is the index after it, null
  // means unclosed, and a template stops early at '${' with { sub: index after '${' }
  const skipString = (from, q = code[from]) => {
    for (let j = from + 1; j < code.length; j++) {
      if (code[j] === '\\') j++;
      else if (code[j] === q) return { end: j + 1 };
      else if (q === '`' && code[j] === '$' && code[j + 1] === '{') return { sub: j + 2 };
      else if (q !== '`' && code[j] === '\n') return null;
    }
    return null;
  };
  while (i < code.length) {
    const c = code[i];
    if (c === '/' && code[i + 1] === '/') {
      const nl = code.indexOf('\n', i);
      i = nl === -1 ? code.length : nl;
    } else if (c === '/' && code[i + 1] === '*') {
      const close = code.indexOf('*/', i + 2);
      if (close === -1) return '/*';
      i = close + 2;
    } else if (c === "'" || c === '"' || c === '`') {
      const r = skipString(i);
      if (!r) return c;
      if (r.sub) {
        stack.push('${');
        i = r.sub;
      } else i = r.end;
    } else if (c === '(' || c === '[' || c === '{') {
      stack.push(c);
      i++;
    } else if (c === '}' && stack.at(-1) === '${') {
      // Back inside the template literal: the '}' acts as its reopening backtick
      stack.pop();
      const r = skipString(i, '`');
      if (!r) return '`';
      if (r.sub) {
        stack.push('${');
        i = r.sub;
      } else i = r.end;
    } else if (PAIRS[c]) {
      if (stack.pop() !== PAIRS[c]) return c;
      i++;
    } else i++;
  }
  return stack.length ? stack.at(-1) : null;
}
