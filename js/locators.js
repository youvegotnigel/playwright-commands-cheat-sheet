// =============================================================
// locators.js — content of the Locator guide (locators.html).
// SECTIONS is the content source: edit it here to change the page.
// js/guide.js renders it.
// =============================================================

import { renderGuide } from './guide.js';

const SECTIONS = [];

// Expose for tests via page.evaluate() (same rationale as window.categories)
window.locatorSections = SECTIONS;

// Column that holds method names, per section: those chips link back to the dashboard
const LINK_COLUMN = {};

renderGuide(SECTIONS, { linkColumns: LINK_COLUMN });
