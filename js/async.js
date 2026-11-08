// =============================================================
// async.js — content of the Async guide (async.html).
// SECTIONS is the content source: edit it here to change the page.
// js/guide.js renders it.
// =============================================================

import { renderGuide } from './guide.js';

const SECTIONS = [];

// Expose for tests via page.evaluate() (same rationale as window.categories)
window.asyncSections = SECTIONS;

// Column that holds method names, per section: those chips link back to the dashboard
const LINK_COLUMN = { parallel: 0, handoffs: 1, events: 1, structure: 0 };

renderGuide(SECTIONS, { linkColumns: LINK_COLUMN });
