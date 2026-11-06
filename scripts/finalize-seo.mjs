import { copyFileSync } from 'node:fs';

// Keep Astro's generated chunks and index, with the conventional discovery URL.
copyFileSync(
  new URL('../dist/sitemap-index.xml', import.meta.url),
  new URL('../dist/sitemap.xml', import.meta.url),
);
