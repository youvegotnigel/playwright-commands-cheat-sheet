#!/usr/bin/env node
// Converts OKLCH to a 6-digit sRGB hex, for generating a new shade inside a family.
// Usage: node oklch-to-hex.mjs <L 0-1> <C> <h degrees>   e.g. node oklch-to-hex.mjs 0.80 0.135 75
// Prints the hex, or "out of gamut" when the colour cannot be shown in sRGB (lower C and retry).

const [L, C, h] = process.argv.slice(2).map(Number);
if ([L, C, h].some(Number.isNaN)) {
  console.error('usage: node oklch-to-hex.mjs <L> <C> <h>');
  process.exit(2);
}

const a = C * Math.cos((h * Math.PI) / 180);
const b = C * Math.sin((h * Math.PI) / 180);
const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
const linear = [
  4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
  -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
  -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
];

if (linear.some((v) => v < -1e-4 || v > 1 + 1e-4)) {
  console.log('out of gamut');
  process.exit(1);
}

const encode = (v) => {
  const c = Math.min(1, Math.max(0, v));
  const srgb = c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055;
  return Math.round(srgb * 255)
    .toString(16)
    .padStart(2, '0');
};
console.log(`#${linear.map(encode).join('')}`);
