import { defineConfig } from 'astro/config';
import { loadEnv } from 'vite';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import { site } from './src/site.config.ts';
import mediaRoute from './scripts/media-route.mjs';
import { validateContent } from './scripts/check-content.mjs';

const env = loadEnv(process.env.NODE_ENV || 'production', process.cwd(), 'SITE_');
const origin = process.env.SITE_URL || env.SITE_URL || site.url;
// Reuse the raw-content validator: collection IDs can otherwise overwrite duplicate slugs.
const { errors, posts, media } = validateContent(process.cwd());
if (errors.length) throw new Error(`Content validation failed:\n${errors.join('\n')}`);
const publicPosts = posts.filter(({ data }) => !data.draft);
const day = (value) => value instanceof Date ? value.toISOString().slice(0, 10) : typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : undefined;
const newest = (values) => values.map(day).filter(Boolean).sort().at(-1);
const modified = ({ data }) => newest([data.updated, data.reviewedOn, data.date]);
const allPostsModified = newest(publicPosts.map(modified));
const postModified = new Map(publicPosts.map((entry) => [`/blog/${entry.data.slug}/`, modified(entry)]));
const topicModified = new Map([...new Set(publicPosts.map(({ data }) => data.topic))].map((topic) => [`/topics/${topic}/`, newest(publicPosts.filter(({ data }) => data.topic === topic).map(modified))]));
const mediaModified = newest(media.map(({ data }) => data.date));
const normalPath = (url) => {
  const pathname = new URL(url, origin).pathname;
  return pathname.endsWith('/') || /\.[^/]+$/.test(pathname) ? pathname : `${pathname}/`;
};
const excluded = new Set(['/404/', '/404.html', '/search/', '/styleguide/']);

export default defineConfig({
  site: origin,
  output: 'static',
  integrations: [
    mdx(),
    mediaRoute(site.features.media),
    sitemap({
      filter: (url) => {
        const path = normalPath(url);
        if (excluded.has(path)) return false;
        // Keep draft or unrecognized article routes out, even if a route is added incorrectly.
        if (/^\/blog\/[^/]+\/$/.test(path) && !/^\/blog\/\d+\/$/.test(path)) return postModified.has(path);
        return true;
      },
      serialize: (item) => {
        const path = normalPath(item.url);
        let lastmod = postModified.get(path) || topicModified.get(path);
        if (['/', '/blog/', '/topics/', '/start-here/'].includes(path) || /^\/blog\/\d+\/$/.test(path)) lastmod = allPostsModified;
        if (path === '/listen-and-watch/') lastmod = mediaModified;
        // Static trust/legal pages need their own real editorial update date; do not stamp the build date.
        return lastmod ? { ...item, lastmod } : item;
      },
    }),
  ],
});
