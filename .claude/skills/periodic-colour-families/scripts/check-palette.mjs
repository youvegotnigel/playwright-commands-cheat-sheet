#!/usr/bin/env node
// Validates a periodic-table tile palette: WCAG contrast against the tile text,
// OKLCH lightness band, and OKLab distance within and between families.
// Usage: node check-palette.mjs palette.json
// palette.json: { "text": "#0f172a", "families": [{ "name": "Setup", "fills": [["config", "#72a0f5"], ...] }, ...] }

import { readFileSync } from 'node:fs';

const MIN_CONTRAST = 4.5;
// Measured on the approved Selenide palette (references/selenide-reference-palette.json):
// L 0.709-0.921, in-family steps 4.6-9.9 (6.2+ except the orange trio), boundaries 10.6+.
const L_MIN = 0.7; // design band 0.71-0.92, widened for hex rounding
const L_MAX = 0.93;
const MIN_DE_IN_FAMILY = 4.5; // OKLab delta E x100, adjacent shades in one family (hard)
const TARGET_DE_IN_FAMILY = 6; // below this is a warning, not a failure
const MIN_DE_BOUNDARY = 7.7; // last fill of a family vs first fill of the next, in display order

const hexToRgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
const toLinear = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);

function luminance(hex) {
  const [r, g, b] = hexToRgb(hex).map(toLinear);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a, b) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

function oklab(hex) {
  const [r, g, b] = hexToRgb(hex).map(toLinear);
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ];
}

function oklch(hex) {
  const [L, a, b] = oklab(hex);
  const h = (Math.atan2(b, a) * 180) / Math.PI;
  return [L, Math.hypot(a, b), (h + 360) % 360];
}

const deltaE = (x, y) => {
  const [p, q] = [oklab(x), oklab(y)];
  return 100 * Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]);
};

const palette = JSON.parse(readFileSync(process.argv[2], 'utf8'));
const text = palette.text ?? '#0f172a';
const failures = [];
const warnings = [];
let n = 0;

console.log('#   family      cls                   fill     contrast  L     C     h');
for (const fam of palette.families) {
  fam.fills.forEach(([cls, fill], i) => {
    n += 1;
    const c = contrast(fill, text);
    const [L, C, h] = oklch(fill);
    console.log(
      `${String(n).padEnd(3)} ${fam.name.padEnd(11)} ${cls.padEnd(21)} ${fill}  ${c.toFixed(2).padStart(6)}   ` +
        `${L.toFixed(3)} ${C.toFixed(3)} ${h.toFixed(0).padStart(3)}`
    );
    if (!/^#[0-9a-fA-F]{6}$/.test(fill)) failures.push(`${cls}: ${fill} is not 6-digit hex`);
    if (c < MIN_CONTRAST) failures.push(`${cls}: contrast ${c.toFixed(2)} < ${MIN_CONTRAST}`);
    if (L < L_MIN || L > L_MAX) failures.push(`${cls}: OKLCH L ${L.toFixed(3)} outside ${L_MIN}-${L_MAX}`);
    if (i > 0) {
      const prev = fam.fills[i - 1];
      const d = deltaE(prev[1], fill);
      const msg = `${prev[0]} -> ${cls}: in-family delta E ${d.toFixed(1)}`;
      if (d < MIN_DE_IN_FAMILY) failures.push(`${msg} < ${MIN_DE_IN_FAMILY}`);
      else if (d < TARGET_DE_IN_FAMILY) warnings.push(`${msg} < target ${TARGET_DE_IN_FAMILY}`);
    }
  });
}

console.log('');
palette.families.slice(1).forEach((fam, i) => {
  const [ca, xa] = palette.families[i].fills.at(-1);
  const [cb, xb] = fam.fills[0];
  const d = deltaE(xa, xb);
  console.log(`Boundary ${palette.families[i].name} -> ${fam.name} (${ca} / ${cb}): delta E ${d.toFixed(1)}`);
  if (d < MIN_DE_BOUNDARY) failures.push(`boundary ${ca} / ${cb}: delta E ${d.toFixed(1)} < ${MIN_DE_BOUNDARY}`);
});

// Faded secondary text on tiles (number, category label): tile text at this opacity over each fill.
if (palette.secondaryOpacity !== undefined) {
  const op = palette.secondaryOpacity;
  const rgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  const mix = (fg, bg) =>
    '#' +
    rgb(fg)
      .map((v, i) => Math.round(v * op + rgb(bg)[i] * (1 - op)).toString(16).padStart(2, '0'))
      .join('');
  const fills = palette.families.flatMap((f) => f.fills);
  const [worstCls, worstFill] = fills.reduce((w, f) =>
    contrast(mix(text, f[1]), f[1]) < contrast(mix(text, w[1]), w[1]) ? f : w
  );
  const c = contrast(mix(text, worstFill), worstFill);
  console.log(`\nSecondary tile text at opacity ${op}: worst ${c.toFixed(2)} on ${worstCls}`);
  if (c < MIN_CONTRAST) failures.push(`secondary text at opacity ${op}: ${c.toFixed(2)} on ${worstCls} < ${MIN_CONTRAST}`);
}

// Page chrome: [foreground, background, role]. Every role here is readable text, so 4.5 applies.
if (palette.pairs?.length) {
  console.log('\nChrome pairs');
  for (const [fg, bg, role] of palette.pairs) {
    const c = contrast(fg, bg);
    console.log(`  ${fg} on ${bg}  ${c.toFixed(2).padStart(5)}  ${role}`);
    if (c < MIN_CONTRAST) failures.push(`chrome ${role}: ${fg} on ${bg} ${c.toFixed(2)} < ${MIN_CONTRAST}`);
  }
}

if (warnings.length) console.log(`\nWarnings (${warnings.length})\n  ${warnings.join('\n  ')}`);
if (failures.length) {
  console.log(`\nFAIL (${failures.length})\n  ${failures.join('\n  ')}`);
  process.exit(1);
}
console.log('\nPASS');
