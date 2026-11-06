import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: process.env.SITE_URL || 'https://example.com',
  output: 'static',
  integrations: [mdx(), sitemap({ filter: (page) => !page.endsWith('/404/') && !page.endsWith('/search/') })],
});
