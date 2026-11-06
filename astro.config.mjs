import { defineConfig } from 'astro/config';
import { loadEnv } from 'vite';
const env = loadEnv(
  process.env.NODE_ENV || 'production',
  process.cwd(),
  'SITE_',
);
import mdx from '@astrojs/mdx';
import { site } from './src/site.config.ts';
import sitemap from '@astrojs/sitemap';
import mediaRoute from './scripts/media-route.mjs';

export default defineConfig({
  site: process.env.SITE_URL || env.SITE_URL || site.url,
  output: 'static',
  integrations: [
    mdx(),
    mediaRoute(site.features.media),
    sitemap({
      filter: (page) =>
        !page.endsWith('/404/') &&
        !page.endsWith('/404.html') &&
        !page.endsWith('/search/'),
    }),
  ],
});
