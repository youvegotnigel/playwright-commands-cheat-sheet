// =============================================================
// meta-bar.js — fills the Playwright version and last-updated
// badges. Shared by the dashboard (app.js) and the waiting guide
// (waiting.js). Both fetches fail gracefully, leaving the fallback
// values present in each page's HTML.
// =============================================================

export function loadMetaBadges() {
  // Playwright version — read from package.json's declared dependency
  fetch('./package.json')
    .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
    .then((pkg) => {
      const dep =
        pkg.devDependencies?.['@playwright/test'] ?? pkg.dependencies?.['@playwright/test'];
      if (!dep) return;
      const clean = dep.replace(/^[\^~>=<\s]+/, ''); // strip range prefix
      const el = document.getElementById('pw-version');
      if (el) el.textContent = 'v' + clean;
    })
    .catch(() => {});

  // Last updated — stamped into js/meta.json by the "Stamp last-updated
  // date" GitHub Action on every push to master, so it reflects the most
  // recent merge without any runtime API call or rate limits.
  fetch('./js/meta.json', { cache: 'no-cache' })
    .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
    .then((meta) => {
      if (!meta?.lastUpdated) return;
      const el = document.getElementById('last-updated');
      if (el) el.textContent = meta.lastUpdated; // YYYY-MM-DD
    })
    .catch(() => {});
}
