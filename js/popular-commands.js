// =============================================================
// popular-commands.js — per-command "open" counts via Supabase.
// Mirrors the visitor counter: WRITES go server-side through an
// Edge Function (service-role key); READS use the publishable anon
// key directly. Exposes a "popular" set (top ~10% by opens) for the
// UI to badge + sort.
// =============================================================

const SUPABASE_URL = 'https://tilbhgcncnwibnfgebkg.supabase.co';
const SUPABASE_KEY = 'sb_publishable_yCaOt8Z9sl-JEQC5wZ6_sQ_jZi610z1';
const FUNCTION_URL = `${SUPABASE_URL}/functions/v1/increment-command-view`;
const REST_URL = `${SUPABASE_URL}/rest/v1/command_views?select=command_id,view_count`;
const CACHE_KEY = 'command-views-cache';
const SESSION_PREFIX = 'cmd-opened:';

// id -> view_count for the current load; `popular` is a Set of ids.
let counts = new Map();
let popular = new Set();

// Stable identity for a command (the data has no ids): category class + name.
export function commandId(item) {
  return `${item.cls}:${item.name}`;
}

export function getViewCount(id) {
  return counts.get(id) || 0;
}

export function isPopular(id) {
  return popular.has(id);
}

// Build the counts map and the popular set (top ~10% of commands that have
// at least one view, ranked by view_count descending).
function applyRows(rows) {
  counts = new Map();
  rows.forEach((r) => counts.set(r.command_id, Number(r.view_count) || 0));

  const viewed = [...counts.entries()].filter(([, n]) => n > 0).sort((a, b) => b[1] - a[1]);
  const topN = Math.ceil(viewed.length * 0.1);
  popular = new Set(viewed.slice(0, topN).map(([id]) => id));
}

// Fetch all counts once. Resolves so the caller can re-render. Falls back to
// the cached rows (then to empty) so the page never breaks on an outage.
export function loadCounts() {
  return fetch(`${REST_URL}&apikey=${SUPABASE_KEY}`, {
    signal: AbortSignal.timeout(5000),
  })
    .then((res) => res.json())
    .then((rows) => {
      if (!Array.isArray(rows)) {
        throw new Error('Unexpected command_views response');
      }
      applyRows(rows);
      localStorage.setItem(CACHE_KEY, JSON.stringify(rows));
    })
    .catch((err) => {
      console.debug('Command views unavailable:', err);
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        try {
          applyRows(JSON.parse(cached));
        } catch {
          /* ignore a corrupt cache */
        }
      }
    });
}

// Record an open: once per session per command, never for automated browsers.
export function recordOpen(item) {
  try {
    // Skip CI/Playwright/Selenium/most bots so they don't inflate counts.
    if (navigator.webdriver) return;

    const id = commandId(item);
    const key = SESSION_PREFIX + id;
    if (sessionStorage.getItem(key)) return; // already counted this session
    sessionStorage.setItem(key, '1');

    fetch(FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${SUPABASE_KEY}`,
      },
      body: JSON.stringify({ command_id: id }),
    }).catch((err) => {
      console.debug('Command view counter unavailable:', err);
    });
  } catch (err) {
    console.debug('Command view counter error:', err);
  }
}
