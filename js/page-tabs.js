// =============================================================
// page-tabs.js — plays a page tab's icon animation when the tab
// is clicked. The click navigates away at once, so the icon plays
// on arrival: the landing page's current tab animates. A plain
// visit or reload stays still.
// =============================================================

const PENDING = 'tab-icon-pending'; // sessionStorage: the tab just clicked

// Storage can throw (blocked site data, private modes): the tabs must still work,
// they just skip the animation
function readPending() {
  try {
    return sessionStorage.getItem(PENDING);
  } catch {
    return null;
  }
}
function writePending(value) {
  try {
    sessionStorage.setItem(PENDING, value);
  } catch {
    /* animation is a nicety: skip it */
  }
}

document.querySelectorAll('.page-tab').forEach((tab) => {
  tab.addEventListener('click', () => writePending(tab.getAttribute('href')));
});

const current = document.querySelector('.page-tab[aria-current="page"]');
if (current && readPending() === current.getAttribute('href')) {
  writePending('');
  current.querySelector('.tab-icon')?.classList.add('play');
}
