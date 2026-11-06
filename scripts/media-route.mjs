// Astro's route injection omits the route entirely when the feature is disabled.
import { readFileSync } from 'node:fs';
export default function mediaRoute() {
  return { name: 'optional-media-route', hooks: { 'astro:config:setup': ({ injectRoute }) => {
    const config = readFileSync(new URL('../src/site.config.ts', import.meta.url), 'utf8');
    if (/features:\s*\{\s*media:\s*true\b/.test(config)) injectRoute({ pattern: '/listen-and-watch', entrypoint: './src/optional/listen-and-watch.astro' });
  } } };
}
