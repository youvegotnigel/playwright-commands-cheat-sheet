// =============================================================
// guide.js — renders a guide page (waiting.html, locators.html)
// from its data module. Each module passes its SECTIONS and the
// column, per section, whose method chips link to the dashboard.
// Code is highlighted with the dashboard's own highlighter.
// =============================================================

import { categories } from './data/index.js';
import { highlight } from './highlight.js';
import { loadMetaBadges } from './meta-bar.js';

/* ── MARKUP ───────────────────────────────────────────────────── */
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// The method a chip names: its last call (and that call's receiver), else the whole text.
// page.waitForURL(url) -> page / waitForURL, expect(fn).toPass() -> toPass, toBeVisible -> toBeVisible
function chipMethod(chip) {
  const calls = [...chip.matchAll(/(?:([A-Za-z_$][\w$]*)\.)?([A-Za-z_$][\w$]*)\s*\(/g)];
  if (!calls.length) return { receiver: '', key: chip.trim() };
  const [, receiver = '', key] = calls[calls.length - 1];
  return { receiver, key };
}

const COMMAND_NAMES = categories.flatMap((c) => c.items.map((i) => i.name));

// Dashboard search for a chip. Prefer the matching command's full name (receiver.key(), then
// key(), then any obj.key()) so the link lands on a short list holding that tile, not on every
// mention of a common word like "all". Fall back to the bare method name, and return null when
// no command name mentions it, so a link never lands on an empty grid.
function searchTerm(chip) {
  const { receiver, key } = chipMethod(chip);
  const k = key.toLowerCase();
  const named = (name) => COMMAND_NAMES.find((n) => n.toLowerCase() === name.toLowerCase());
  return (
    (receiver && named(`${receiver}.${key}()`)) ||
    named(`${key}()`) ||
    COMMAND_NAMES.find((n) => n.toLowerCase().endsWith(`.${k}()`)) ||
    (COMMAND_NAMES.some((n) => n.toLowerCase().includes(k)) ? key : null)
  );
}

// Inline markup: `code` becomes a highlighted chip (a link when `link` is set and the
// dashboard knows the method), <tag>X</tag> a warning tag
function inline(text, link = false) {
  return text
    .split(/(`[^`]+`|<tag>[^<]+<\/tag>)/)
    .map((part) => {
      if (part.startsWith('`')) {
        const chip = part.slice(1, -1);
        // <wbr> after "." and "(" lets a long chip wrap between tokens instead of mid-word,
        // without adding characters to the text a reader selects
        const html = highlight(chip).replace(/([.(])/g, '$1<wbr>');
        const term = link ? searchTerm(chip) : null;
        if (term) {
          const href = `index.html#search=${encodeURIComponent(term)}`;
          return `<a class="inl" href="${href}" title="Open in the commands dashboard">${html}</a>`;
        }
        return `<code class="inl">${html}</code>`;
      }
      if (part.startsWith('<tag>')) return `<span class="tag">${esc(part.slice(5, -6))}</span>`;
      return esc(part);
    })
    .join('');
}

// Copies the snippet's source string from `sections`, so the text is exactly the original
async function copySnippet(btn, sections) {
  const code = sections[btn.dataset.section].rows[btn.dataset.row][2];
  try {
    await navigator.clipboard.writeText(code);
    btn.textContent = '✓ Copied!';
    btn.classList.add('copied');
  } catch {
    btn.textContent = 'Select and copy';
  }
  setTimeout(() => {
    btn.textContent = 'Copy';
    btn.classList.remove('copied');
  }, 2000);
}

// Renders the TOC and section tables, wires the Copy buttons and fills the meta-bar.
// linkColumns maps a section id to the column (0 or 1) whose chips link back.
export function renderGuide(sections, { linkColumns }) {
  const toc = document.getElementById('toc');
  const main = document.getElementById('content');
  sections.forEach((s, n) => {
    const num = String(n + 1).padStart(2, '0');
    toc.insertAdjacentHTML('beforeend', `<a href="#${s.id}">${num} ${esc(s.title)}</a>`);
    const linkCol = linkColumns[s.id];
    const rows = s.rows
      .map((r, row) => {
        const third = s.text
          ? inline(r[2])
          : `<div class="block"><pre><code>${highlight(r[2])}</code></pre>
            <button class="guide-copy" type="button" data-section="${n}" data-row="${row}">Copy</button></div>`;
        return `<tr class="${r[3] ? 'flag' : ''}">
          <td data-label="${esc(s.cols[0])}">${inline(r[0], linkCol === 0)}</td>
          <td data-label="${esc(s.cols[1])}">${inline(r[1], linkCol === 1)}</td>
          <td data-label="${esc(s.cols[2])}">${third}</td></tr>`;
      })
      .join('');
    main.insertAdjacentHTML(
      'beforeend',
      `<section id="${s.id}">
        <h2><span class="num">${num}</span>${esc(s.title)}</h2>
        ${s.note ? `<p class="note">${esc(s.note)}</p>` : ''}
        <div class="table-card"><table>
          <colgroup><col class="c1"><col class="c2"><col class="c3"></colgroup>
          <thead><tr>${s.cols.map((c) => `<th scope="col">${esc(c)}</th>`).join('')}</tr></thead>
          <tbody>${rows}</tbody>
        </table></div>
      </section>`
    );
  });

  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.guide-copy');
    if (btn) copySnippet(btn, sections);
  });

  const readTime = document.getElementById('read-time');
  if (readTime) readTime.textContent = `${readMinutes(sections)} min`;

  loadMetaBadges();
}

/* ── READ TIME ────────────────────────────────────────────────── */
// The guide's meta-bar badge, in the slot the dashboard uses for its command count.
// Counts every word the guide shows: titles, notes, column headers, cells and code.
const WORDS_PER_MINUTE = 200;

function readMinutes(sections) {
  const text = sections
    .flatMap((s) => [s.title, s.note ?? '', ...s.cols, ...s.rows.flatMap((r) => r.slice(0, 3))])
    .join(' ');
  const words = text.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / WORDS_PER_MINUTE));
}
