// =============================================================
// mocking.js — content of the Network mocking guide (mocking.html).
// SECTIONS is the content source: edit it here to change the page.
// js/guide.js renders it.
// =============================================================

import { renderGuide } from './guide.js';

const SECTIONS = [];

// Expose for tests via page.evaluate() (same rationale as window.categories)
window.mockingSections = SECTIONS;

// Column that holds method names, per section: those chips link back to the dashboard
const LINK_COLUMN = { strategy: 0, outcomes: 0, channels: 1, verify: 1 };

renderGuide(SECTIONS, { linkColumns: LINK_COLUMN });
