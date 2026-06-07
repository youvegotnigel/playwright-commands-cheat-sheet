// =============================================================
// highlight.js — tiny dependency-free highlighter for JS/TS snippets
// Returns HTML-escaped markup with <span class="tok-*"> wrappers.
// Single pass: text between matched tokens is escaped and emitted
// plain, so every character is escaped exactly once.
// =============================================================

const KEYWORDS = new Set([
  'await', 'const', 'let', 'var', 'async', 'function', 'return', 'new',
  'if', 'else', 'for', 'of', 'in', 'import', 'from', 'export', 'default',
  'true', 'false', 'null', 'undefined', 'typeof', 'instanceof', 'class',
  'extends', 'try', 'catch', 'finally', 'throw', 'while', 'do', 'switch',
  'case', 'break', 'continue',
]);

const APIS = new Set(['page', 'expect', 'browser', 'context', 'test', 'request']);

function escapeHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// Note: the number arm matches decimal integers/floats only (e.g. 5000, 0.5);
// hex/binary/exponent literals are not specially highlighted — fine for these snippets.
// Ordered alternatives: comment | string | number | identifier
const TOKEN_RE =
  /(\/\/[^\n]*|\/\*[\s\S]*?\*\/)|('(?:\\.|[^'\\])*'|"(?:\\.|[^"\\])*"|`(?:\\.|[^`\\])*`)|(\b\d+(?:\.\d+)?\b)|([A-Za-z_$][\w$]*)/g;

export function highlight(code) {
  let out = '';
  let last = 0;
  let m;
  TOKEN_RE.lastIndex = 0;
  while ((m = TOKEN_RE.exec(code)) !== null) {
    out += escapeHtml(code.slice(last, m.index));
    const [, comment, string, number, ident] = m;
    if (comment !== undefined) {
      out += `<span class="tok-comment">${escapeHtml(comment)}</span>`;
    } else if (string !== undefined) {
      out += `<span class="tok-string">${escapeHtml(string)}</span>`;
    } else if (number !== undefined) {
      out += `<span class="tok-number">${escapeHtml(number)}</span>`;
    } else {
      let cls = null;
      if (KEYWORDS.has(ident)) cls = 'tok-keyword';
      else if (APIS.has(ident)) cls = 'tok-api';
      else if (code[TOKEN_RE.lastIndex] === '(') cls = 'tok-fn';
      out += cls
        ? `<span class="${cls}">${escapeHtml(ident)}</span>`
        : escapeHtml(ident);
    }
    last = TOKEN_RE.lastIndex;
  }
  out += escapeHtml(code.slice(last));
  return out;
}
