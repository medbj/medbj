/** @param {boolean} enabled */
export default function mediaRoute(enabled) {
  return {
    name: 'optional-media-route',
    hooks: {
      'astro:config:setup': ({ injectRoute }) => {
        if (enabled)
          injectRoute({
            pattern: '/listen-and-watch',
            entrypoint: './src/optional/listen-and-watch.astro',
          });
      },
    },
  };
}
