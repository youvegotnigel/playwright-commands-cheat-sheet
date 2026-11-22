// =============================================================
// mind-map.js — draws a guide's mind map into #mindmap: a root,
// numbered groups of branches, and curved links from the root to
// every branch. Each branch opens its section, and every section
// gets a breadcrumb that names its branch and leads back to the map.
// Run it after renderGuide(), so the sections and numbers exist.
// =============================================================

import { inline } from './guide.js';

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// The section number renderGuide() gave a section, e.g. '03'
const numberOf = (id) => document.querySelector(`#${id} h2 .num`)?.textContent ?? '';

function leafMarkup(leaf) {
  if (typeof leaf === 'string') return `<li>${inline(leaf)}</li>`;
  return `<li><a class="mm-sub" href="#${leaf.id}">${inline(leaf.text)}</a></li>`;
}

function branchMarkup(branch, g) {
  return `<li class="mm-branch${branch.heart ? ' mm-heart' : ''}" data-group="mm-g${g}">
      <a class="mm-node" href="#${branch.id}"><span class="mm-num">${numberOf(branch.id)}</span>${esc(branch.label)}</a>
      <ul class="mm-leaves">${branch.leaves.map(leafMarkup).join('')}</ul>
    </li>`;
}

// A breadcrumb above a section's heading: where it sits on the map, and the way back
function addCrumb(id, cls, trail) {
  const h2 = document.querySelector(`#${id} h2`);
  if (!h2) return;
  h2.insertAdjacentHTML(
    'beforebegin',
    `<p class="mm-crumb ${cls}"><span>${trail.map(esc).join(' › ')}</span>` +
      `<a href="#mindmap">↑ Back to the map</a></p>`
  );
}

// Curved links from the root's nearer side to each branch node. Only drawn while the
// map is laid out around the root (wide screens); phones show a stacked tree instead.
function drawLinks(el) {
  const svg = el.querySelector('.mm-links');
  if (getComputedStyle(svg).display === 'none') return;
  const box = el.getBoundingClientRect();
  const root = el.querySelector('.mm-root').getBoundingClientRect();
  const mid = root.left + root.width / 2;
  const cy = root.top + root.height / 2 - box.top;
  const paths = [...el.querySelectorAll('.mm-branch')].map((li) => {
    const node = li.querySelector('.mm-node').getBoundingClientRect();
    const left = node.left + node.width / 2 < mid;
    const sx = (left ? root.left : root.right) - box.left;
    const ex = (left ? node.right : node.left) - box.left;
    const ey = node.top + node.height / 2 - box.top;
    const cx = (sx + ex) / 2;
    const heart = li.classList.contains('mm-heart') ? ' mm-heart' : '';
    const d = `M${sx.toFixed(1)} ${cy.toFixed(1)}C${cx.toFixed(1)} ${cy.toFixed(1)} ${cx.toFixed(1)} ${ey.toFixed(1)} ${ex.toFixed(1)} ${ey.toFixed(1)}`;
    return `<path class="mm-link ${li.dataset.group}${heart}" d="${d}"/>`;
  });
  svg.setAttribute('viewBox', `0 0 ${box.width.toFixed(1)} ${box.height.toFixed(1)}`);
  svg.innerHTML = paths.join('');
}

export function renderMindMap(map, el = document.getElementById('mindmap')) {
  if (!el) return;
  const recap = map.recap.map((r) => `<a href="#${r.id}">${esc(r.label)}</a>`).join('');
  const groups = map.groups
    .map((group, i) => {
      const g = i + 1;
      return `<div class="mm-group mm-g${g}">
        <h3 class="mm-group-title"><span class="mm-step">${g}</span>${esc(group.name)}</h3>
        <ul class="mm-branches">${group.branches.map((b) => branchMarkup(b, g)).join('')}</ul>
      </div>`;
    })
    .join('');
  el.innerHTML = `<svg class="mm-links" aria-hidden="true" focusable="false"></svg>
    <div class="mm-root">
      <p class="mm-root-title">${esc(map.root)}</p>
      <p class="mm-root-sub">${esc(map.sub)}</p>
      <p class="mm-root-links"><a href="#${map.start.id}">${esc(map.start.label)}</a>${recap}</p>
    </div>
    ${groups}`;

  // Breadcrumbs: start and recap sections, every branch, and every sub-branch leaf
  addCrumb(map.start.id, 'mm-g0', ['Start here']);
  for (const r of map.recap) addCrumb(r.id, 'mm-g0', ['Recap']);
  map.groups.forEach((group, i) => {
    const step = `${i + 1} ${group.name}`;
    for (const branch of group.branches) {
      addCrumb(branch.id, `mm-g${i + 1}`, [step, branch.label]);
      for (const leaf of branch.leaves)
        if (typeof leaf !== 'string') addCrumb(leaf.id, `mm-g${i + 1}`, [step, branch.label]);
    }
  });

  drawLinks(el);
  new ResizeObserver(() => drawLinks(el)).observe(el);
}
