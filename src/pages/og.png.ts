import type { APIRoute } from 'astro';
import sharp from 'sharp';
import { site } from '../site.config';
import tokenCss from '../styles/tokens.css?raw';

export const prerender = true;

const escapeXml = (value: string): string =>
  value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&apos;',
    };
    return entities[character];
  });

function color(name: string): string {
  const value = tokenCss.match(
    new RegExp(`--${name}\\s*:\\s*(#[\\da-f]{6})\\s*;`, 'i'),
  )?.[1];
  if (!value) throw new Error(`OG image is missing color token --${name}.`);
  return value;
}

function wrap(value: string, width: number): string[] {
  const lines: string[] = [];
  for (const word of value.trim().split(/\s+/)) {
    const last = lines.length - 1;
    if (last < 0 || `${lines[last]} ${word}`.length > width) lines.push(word);
    else lines[last] += ` ${word}`;
  }
  return lines;
}

export const GET: APIRoute = async () => {
  const white = color('white');
  const sand = color('sand');
  const ink = color('ink');
  const brand = color('brand');
  const muted = color('muted');
  const border = color('border');
  const titleLines = wrap(site.name, 28);
  const titleSize = titleLines.length > 1 ? 66 : 82;
  const titleStart = titleLines.length > 1 ? 175 : 225;
  const titleEnd = titleStart + (titleLines.length - 1) * (titleSize + 8);
  const sentences = site.tagline.trim().split(/(?<=[.!?])\s+/);
  const taglineLines =
    sentences.length > 1
      ? sentences.flatMap((line) => wrap(line, 58))
      : wrap(site.tagline, 52);
  const title = titleLines
    .map(
      (line, index) =>
        `<text x="80" y="${titleStart + index * (titleSize + 8)}">${escapeXml(line)}</text>`,
    )
    .join('');
  const tagline = taglineLines
    .map(
      (line, index) =>
        `<text x="84" y="${titleEnd + 70 + index * 44}">${escapeXml(line)}</text>`,
    )
    .join('');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
    <rect width="1200" height="630" fill="${white}" />
    <rect y="500" width="1200" height="130" fill="${sand}" />
    <path d="M80 90H1120" stroke="${border}" stroke-width="2" />
    <g fill="${brand}" font-family="Arial, 'Liberation Sans', Helvetica, sans-serif" font-size="${titleSize}" font-weight="700" letter-spacing="-2">${title}</g>
    <g fill="${muted}" font-family="Arial, 'Liberation Sans', Helvetica, sans-serif" font-size="32">${tagline}</g>
    <text x="84" y="555" fill="${ink}" font-family="Arial, 'Liberation Sans', Helvetica, sans-serif" font-size="22">Psychology and everyday wellbeing</text>
    <text x="84" y="591" fill="${muted}" font-family="Arial, 'Liberation Sans', Helvetica, sans-serif" font-size="18">${escapeXml(new URL(site.url).host)}</text>
  </svg>`;
  const image = await sharp(Buffer.from(svg))
    .png({ compressionLevel: 9 })
    .toBuffer();
  return new Response(Uint8Array.from(image), {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=86400',
    },
  });
};
