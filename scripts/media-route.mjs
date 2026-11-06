import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

/** Raw-file counterpart of mediaAvailable(), available before Astro loads collections. */
export function hasMediaFiles(directory = join(process.cwd(), 'src/content/media')) {
  if (!existsSync(directory)) return false;
  return readdirSync(directory, { withFileTypes: true }).some((entry) =>
    entry.isDirectory()
      ? hasMediaFiles(join(directory, entry.name))
      : /\.(?:ya?ml|json)$/.test(entry.name),
  );
}

/** @param {boolean} enabled */
export default function mediaRoute(enabled) {
  return {
    name: 'optional-media-route',
    hooks: {
      'astro:config:setup': ({ injectRoute }) => {
        if (enabled && hasMediaFiles())
          injectRoute({
            pattern: '/listen-and-watch',
            entrypoint: './src/optional/listen-and-watch.astro',
          });
      },
    },
  };
}
