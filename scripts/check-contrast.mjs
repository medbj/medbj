import { readFileSync } from 'node:fs';
const css = readFileSync(new URL('../src/styles/tokens.css', import.meta.url), 'utf8');
const tokens = Object.fromEntries([...css.matchAll(/--([\w-]+):\s*(#[\da-f]{6})/gi)].map((m) => [m[1], m[2]]));
function luminance(hex) {
  const rgb = hex.slice(1).match(/../g).map((x) => parseInt(x, 16) / 255).map((v) => v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
  return rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722;
}
let failures = 0;
const pairs = [];
for (const foreground of ['ink', 'muted', 'link', 'link-hover']) {
  for (const background of ['white', 'sand', 'sand-soft']) pairs.push([foreground, background, 4.5]);
}
pairs.push(['white', 'link', 4.5], ['white', 'link-hover', 4.5]);
for (const background of ['white', 'sand', 'sand-soft']) pairs.push(['link', background, 3]);
for (const [fg, bg, min] of pairs) {
  if (!tokens[fg] || !tokens[bg]) throw new Error(`Missing token ${fg}/${bg}`);
  const a = luminance(tokens[fg]), b = luminance(tokens[bg]);
  const ratio = (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
  console.log(`${fg} on ${bg}: ${ratio.toFixed(2)}:1 (minimum ${min})`);
  if (ratio < min) failures++;
}
if (failures) { console.error(`${failures} contrast checks failed.`); process.exit(1); }
console.log('All text, button, and focus color pairs pass. The border token is decorative; controls use teal boundaries.');
