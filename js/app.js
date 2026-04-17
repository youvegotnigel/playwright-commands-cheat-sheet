// =============================================================
// app.js — UI logic: rendering, filtering, modal, search
// Depends on: categories (defined in data.js, loaded first)
// =============================================================

/* ── STATE ────────────────────────────────────────────────────── */
let activeFilter = 'all';
let activeView   = 'flat';
let searchVal    = '';

// Flatten all items into a single array, tagging each with its category info
let allItems = [];
categories.forEach(sec =>
  sec.items.forEach(item =>
    allItems.push({ ...item, cls: sec.cls, cat: sec.cat, color: sec.color })
  )
);

/* ── FILTER / SEARCH ──────────────────────────────────────────── */
function getItems() {
  let items = allItems;

  if (activeFilter === 'beginner') {
    items = items.filter(i => i.level === 'beginner');
  } else if (activeFilter !== 'all') {
    items = items.filter(i => i.cat === activeFilter);
  }

  if (searchVal) {
    const q = searchVal.toLowerCase();
    items = items.filter(i =>
      i.name.toLowerCase().includes(q) ||
      i.desc.toLowerCase().includes(q) ||
      i.code.toLowerCase().includes(q) ||
      (i.tip && i.tip.toLowerCase().includes(q))
    );
  }

  return items;
}

/* ── RENDER ───────────────────────────────────────────────────── */
function render() {
  const container = document.getElementById('grid');
  const items = getItems();

  container.innerHTML = '';

  if (items.length === 0) {
    const wrap = document.createElement('div');
    wrap.className = 'grid';
    wrap.innerHTML = '<div class="empty-state">No commands match your search.</div>';
    container.appendChild(wrap);
    return;
  }

  if (activeView === 'grouped') {
    renderGrouped(items, container);
  } else {
    renderFlat(items, container);
  }
}

function renderFlat(items, container) {
  const grid = document.createElement('div');
  grid.className = 'grid';
  items.forEach((item, i) => grid.appendChild(makeTile(item, i + 1)));
  container.appendChild(grid);
}

function renderGrouped(items, container) {
  const groups = {};
  items.forEach(item => {
    if (!groups[item.cat]) groups[item.cat] = [];
    groups[item.cat].push(item);
  });

  // Render in the original category order
  categories.forEach(sec => {
    if (!groups[sec.cat]) return;
    const section = document.createElement('div');
    section.className = 'group-section';

    const header = document.createElement('div');
    header.className = 'group-header';
    header.innerHTML = `<span style="color:${sec.color}">${sec.cat}</span>`;
    section.appendChild(header);

    const grid = document.createElement('div');
    grid.className = 'grid';
    groups[sec.cat].forEach((item, i) => grid.appendChild(makeTile(item, i + 1)));
    section.appendChild(grid);

    container.appendChild(section);
  });
}

/* ── TILE ─────────────────────────────────────────────────────── */
function levelDots(level) {
  if (level === 'beginner')     return '<span style="color:#4ade80">●</span>';
  if (level === 'intermediate') return '<span style="color:#fb923c">●●</span>';
  if (level === 'advanced')     return '<span style="color:#c084fc">●●●</span>';
  return '';
}

function makeTile(item, n) {
  const div = document.createElement('div');
  div.className = `tile ${item.cls}`;
  div.innerHTML = `
    <span class="tile-level">${levelDots(item.level)}</span>
    <div class="tile-inner">
      <span class="tile-num">#${n}</span>
      <span class="tile-name">${item.name}</span>
    </div>`;
  div.onclick = () => openModal(item);
  return div;
}

/* ── MODAL ────────────────────────────────────────────────────── */
function openModal(item) {
  document.getElementById('modal').style.display = 'flex';
  document.getElementById('m-title').innerHTML = item.name;
  document.getElementById('m-desc').innerText  = item.desc;
  document.getElementById('m-code').innerText  = item.code;
  document.getElementById('btn-docs').href     = item.docs;

  // Difficulty badge
  const badge = document.getElementById('m-level');
  const labels = { beginner: '● Beginner', intermediate: '●● Intermediate', advanced: '●●● Advanced' };
  badge.innerText = labels[item.level] || '';
  badge.className = `level-badge level-${item.level}`;

  // Tip — safe DOM manipulation, no innerHTML for user data
  const tipEl = document.getElementById('m-tip');
  tipEl.innerHTML = '';
  const strong = document.createElement('strong');
  strong.textContent = '💡 Tip: ';
  tipEl.appendChild(strong);
  tipEl.appendChild(document.createTextNode(item.tip));

  // Reset copy button state
  const copyBtn = document.getElementById('btn-copy');
  copyBtn.textContent = 'Copy';
  copyBtn.className   = 'btn-copy';
}

function closeModal() {
  document.getElementById('modal').style.display = 'none';
}

function copyCode() {
  navigator.clipboard.writeText(document.getElementById('m-code').innerText);
  const btn = document.getElementById('btn-copy');
  btn.textContent = '✓ Copied!';
  btn.className   = 'btn-copy copied';
  setTimeout(() => {
    btn.textContent = 'Copy';
    btn.className   = 'btn-copy';
  }, 2000);
}

/* ── URL STATE ────────────────────────────────────────────────── */
function updateHash() {
  const params = new URLSearchParams();
  if (activeFilter !== 'all') params.set('filter', activeFilter);
  if (searchVal) params.set('search', searchVal);
  const qs = params.toString();
  history.replaceState(null, '', qs ? '#' + qs : location.pathname + location.search);
}

function readHash() {
  if (!location.hash) return;
  const params = new URLSearchParams(location.hash.slice(1));
  const filter = params.get('filter');
  const search = params.get('search');
  if (filter) activeFilter = filter;
  if (search) {
    searchVal = search.toLowerCase();
    document.getElementById('search-input').value = search;
  }
}

/* ── FILTERS & VIEW ───────────────────────────────────────────── */
function setFilter(f) {
  activeFilter = f;
  document.querySelectorAll('.filter-btn').forEach(b =>
    b.classList.toggle('active', b.dataset.filter === f)
  );
  updateHash();
  render();
}

function setView(v) {
  activeView = v;
  document.getElementById('btnFlat').classList.toggle('active',    v === 'flat');
  document.getElementById('btnGrouped').classList.toggle('active', v === 'grouped');
  render();
}

function search(val) {
  searchVal = val.toLowerCase();
  updateHash();
  render();
}

function buildFilters() {
  const container = document.getElementById('filters');
  const defs = [
    { label: 'All',          filter: 'all',      color: null },
    { label: '⭐ Start Here', filter: 'beginner', color: null },
    ...categories.map(c => ({ label: c.cat, filter: c.cat, color: c.color }))
  ];
  defs.forEach(({ label, filter, color }) => {
    const btn = document.createElement('button');
    btn.className      = 'filter-btn' + (filter === 'all' ? ' active' : '');
    btn.dataset.filter = filter;
    btn.onclick        = () => setFilter(filter);
    btn.innerHTML      = color
      ? `<span class="filter-dot" style="background:${color}"></span>${label}`
      : label;
    container.appendChild(btn);
  });
}

/* ── KEYBOARD ─────────────────────────────────────────────────── */
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeModal();
  if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
    e.preventDefault();
    document.getElementById('search-input').focus();
  }
});

/* ── INIT ─────────────────────────────────────────────────────── */
buildFilters();
readHash();
// Sync filter button active state after reading hash
document.querySelectorAll('.filter-btn').forEach(b =>
  b.classList.toggle('active', b.dataset.filter === activeFilter)
);
// Show platform-appropriate keyboard shortcut hint
(function () {
  const isMac = /Mac|iPhone|iPad|iPod/.test(navigator.platform);
  const el = document.getElementById('search-shortcut');
  if (el) el.textContent = isMac ? '⌘K' : 'Ctrl+K';
}());
render();
