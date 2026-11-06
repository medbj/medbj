import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, extname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'dist');
const failures = new Set();
const fail = (message) => failures.add(message);
const read = (file) => readFileSync(file, 'utf8');
const listFiles = (directory) =>
  readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const file = join(directory, entry.name);
    return entry.isDirectory() ? listFiles(file) : [file];
  });
const label = (file) => relative(dist, file).split(sep).join('/');
const decode = (value) =>
  value.replace(
    /&(?:amp|quot|apos|lt|gt|#39|#(\d+)|#x([\da-f]+));/gi,
    (match, decimal, hex) => {
      if (decimal) return String.fromCodePoint(Number(decimal));
      if (hex) return String.fromCodePoint(Number.parseInt(hex, 16));
      return (
        {
          '&amp;': '&',
          '&quot;': '"',
          '&apos;': "'",
          '&lt;': '<',
          '&gt;': '>',
          '&#39;': "'",
        }[match.toLowerCase()] || match
      );
    },
  );
const attributes = (tag) => {
  const result = {};
  const pattern = /([\w:-]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g;
  for (const match of tag.matchAll(pattern))
    result[match[1].toLowerCase()] = decode(
      match[2] ?? match[3] ?? match[4] ?? '',
    );
  return result;
};
const elements = (html, name) =>
  [...html.matchAll(new RegExp(`<${name}\\b([^>]*)>`, 'gi'))].map((match) =>
    attributes(match[1]),
  );
const htmlCache = new Map();
const getHtml = (file) => {
  if (!htmlCache.has(file)) htmlCache.set(file, read(file));
  return htmlCache.get(file);
};
const textOnly = (html) =>
  decode(
    html
      .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' '),
  ).replace(/\s+/g, ' ');
const canonicalOf = (html) =>
  elements(html, 'link').find((item) =>
    item.rel?.split(/\s+/).includes('canonical'),
  )?.href;
const routeFile = (pathname) => {
  let decoded;
  try {
    decoded = decodeURIComponent(pathname);
  } catch {
    return null;
  }
  const target = resolve(
    dist,
    `.${decoded.startsWith('/') ? decoded : `/${decoded}`}`,
  );
  if (target !== dist && !target.startsWith(`${dist}${sep}`)) return null;
  for (const candidate of [
    target,
    join(target, 'index.html'),
    `${target}.html`,
  ]) {
    if (existsSync(candidate) && statSync(candidate).isFile()) return candidate;
  }
  return null;
};

if (!existsSync(dist)) {
  console.error(
    'Site check failed: dist/ is missing. Run npm run build first.',
  );
  process.exit(1);
}

const files = listFiles(dist);
const htmlFiles = files.filter(
  (file) => extname(file) === '.html' && !label(file).startsWith('pagefind/'),
);
const required = [
  '/',
  '/blog/',
  '/topics/',
  '/start-here/',
  '/search/',
  '/about/',
  '/get-help/',
  '/newsletter/',
  '/contact/',
  '/privacy/',
  '/disclaimer/',
  '/terms/',
  '/editorial-policy/',
  '/accessibility/',
  '/404.html',
];
for (const route of required)
  if (!routeFile(route)) fail(`Missing route ${route}`);
for (const file of ['rss.xml', 'sitemap-index.xml', 'robots.txt'])
  if (!existsSync(join(dist, file))) fail(`Missing ${file}`);
if (!htmlFiles.length) fail('No generated HTML pages found');

const home = routeFile('/');
let origin = 'https://check.invalid';
if (home) {
  try {
    origin = new URL(canonicalOf(getHtml(home))).origin;
  } catch {
    fail('Homepage has no valid absolute canonical URL');
  }
}
let localLinks = 0;
for (const file of htmlFiles) {
  const html = getHtml(file);
  const fileLabel = label(file);
  const htmlTag = elements(html, 'html');
  if (htmlTag.length !== 1 || !htmlTag[0].lang)
    fail(`${fileLabel}: missing html language`);
  if ([...html.matchAll(/<h1\b/gi)].length !== 1)
    fail(`${fileLabel}: expected exactly one h1`);
  const titles = [...html.matchAll(/<title\b[^>]*>([\s\S]*?)<\/title>/gi)];
  if (titles.length !== 1 || !textOnly(titles[0][1]).trim())
    fail(`${fileLabel}: missing or duplicate title`);
  const descriptions = elements(html, 'meta').filter(
    (item) => item.name?.toLowerCase() === 'description',
  );
  if (descriptions.length !== 1 || !descriptions[0].content?.trim())
    fail(`${fileLabel}: missing or duplicate description`);
  const canonicals = elements(html, 'link').filter((item) =>
    item.rel?.split(/\s+/).includes('canonical'),
  );
  if (canonicals.length !== 1) fail(`${fileLabel}: expected one canonical URL`);
  let canonical;
  try {
    canonical = new URL(canonicals[0]?.href);
    if (
      !['https:', 'http:'].includes(canonical.protocol) ||
      canonical.origin !== origin
    )
      fail(`${fileLabel}: invalid canonical origin`);
    const target = routeFile(canonical.pathname);
    if (target !== file)
      fail(`${fileLabel}: canonical points to another or missing page`);
  } catch {
    fail(`${fileLabel}: canonical must be absolute`);
  }
  const pageUrl =
    canonical ||
    new URL(fileLabel === 'index.html' ? '/' : `/${fileLabel}`, origin);
  const markup = html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '');
  for (const match of markup.matchAll(/<[a-z][\w:-]*\b([^>]*)>/gi)) {
    const attrs = attributes(match[1]);
    for (const attribute of ['href', 'src']) {
      const value = attrs[attribute];
      if (value === undefined) continue;
      if (!value.trim()) {
        fail(`${fileLabel}: empty ${attribute}`);
        continue;
      }
      if (/^(?:mailto|tel|data|blob|javascript):/i.test(value)) continue;
      let url;
      try {
        url = new URL(value, pageUrl);
      } catch {
        fail(`${fileLabel}: invalid ${attribute} ${value}`);
        continue;
      }
      if (!['http:', 'https:'].includes(url.protocol) || url.origin !== origin)
        continue;
      localLinks++;
      const target = routeFile(url.pathname);
      if (!target) {
        fail(`${fileLabel}: broken ${attribute} ${value}`);
        continue;
      }
      if (url.hash && extname(target) === '.html') {
        let fragment;
        try {
          fragment = decodeURIComponent(url.hash.slice(1));
        } catch {
          fail(`${fileLabel}: invalid fragment ${value}`);
          continue;
        }
        const ids = new Set(
          [...getHtml(target).matchAll(/<[a-z][\w:-]*\b([^>]*)>/gi)]
            .map((tag) => attributes(tag[1]).id)
            .filter(Boolean),
        );
        if (!ids.has(fragment)) fail(`${fileLabel}: missing fragment ${value}`);
      }
    }
  }
}

const notFound = routeFile('/404.html');
if (
  notFound &&
  !elements(getHtml(notFound), 'meta').some(
    (item) =>
      item.name?.toLowerCase() === 'robots' &&
      /\bnoindex\b/i.test(item.content || ''),
  )
)
  fail('404.html: missing noindex');
const topics = [
  'anxiety',
  'low-mood',
  'stress-burnout',
  'relationships',
  'sleep',
  'self-esteem',
  'grief-loss',
  'habits-growth',
];
for (const topic of topics)
  if (!routeFile(`/topics/${topic}/`)) fail(`Missing topic hub ${topic}`);

const contentDirectory = join(root, 'src/content/blog');
const articleFiles = existsSync(contentDirectory)
  ? listFiles(contentDirectory).filter((file) => /\.mdx?$/.test(file))
  : [];
if (!articleFiles.length) fail('No article source files found');
for (const source of articleFiles) {
  const id = relative(contentDirectory, source)
    .split(sep)
    .join('/')
    .replace(/\.mdx?$/, '');
  const target = routeFile(`/blog/${id}/`);
  if (!target) {
    fail(`Missing article /blog/${id}/`);
    continue;
  }
  const html = getHtml(target);
  const text = textOnly(html);
  if (!/\bdata-pagefind-body\b/.test(html))
    fail(`${label(target)}: article is not marked for Pagefind`);
  for (const [name, pattern] of [
    ['key takeaways', /key takeaways/i],
    ['references', /references/i],
    [
      'educational disclaimer',
      /(?:education(?:al)?|general information)[\s\S]{0,300}(?:diagnos|treatment|professional)|(?:diagnos|treatment|professional)[\s\S]{0,300}(?:education(?:al)?|general information)/i,
    ],
    ['published date', /published/i],
    ['updated date', /updated/i],
  ])
    if (!pattern.test(text)) fail(`${label(target)}: missing ${name}`);
  if (/^sample:\s*true\s*$/m.test(read(source)) && !/\bsample\b/i.test(text))
    fail(`${label(target)}: sample article is not labelled`);
}
for (const file of htmlFiles) {
  if (
    /\bdata-pagefind-body\b/.test(getHtml(file)) &&
    !articleFiles.some((source) => {
      const id = relative(contentDirectory, source)
        .split(sep)
        .join('/')
        .replace(/\.mdx?$/, '');
      return routeFile(`/blog/${id}/`) === file;
    })
  )
    fail(`${label(file)}: only article pages should be indexed by Pagefind`);
}
const pagefind = join(dist, 'pagefind');
if (
  !existsSync(join(pagefind, 'pagefind.js')) ||
  !files.some(
    (file) => label(file).startsWith('pagefind/') && /\.pf_index$/.test(file),
  )
)
  fail(
    'Pagefind index or loader missing; run the complete npm run build pipeline',
  );

const config = read(join(root, 'src/site.config.ts'));
const mediaFlag = config.match(/\bmedia\s*:\s*(true|false)\b/);
if (!mediaFlag) fail('Could not determine features.media from site.config.ts');
else {
  const enabled = mediaFlag[1] === 'true';
  const generated = Boolean(routeFile('/listen-and-watch/'));
  if (generated !== enabled)
    fail(`Media route does not match features.media=${enabled}`);
  for (const file of htmlFiles) {
    const mediaLinks = elements(getHtml(file), 'a').filter((item) => {
      if (!item.href) return false;
      try {
        const url = new URL(item.href, origin);
        return (
          url.origin === origin && /^\/listen-and-watch\/?$/.test(url.pathname)
        );
      } catch {
        return false;
      }
    });
    if (!enabled && mediaLinks.length)
      fail(`${label(file)}: links to disabled media route`);
  }
  if (
    enabled &&
    home &&
    !elements(getHtml(home), 'a').some((item) =>
      item.href?.includes('/listen-and-watch'),
    )
  )
    fail('Enabled media has no homepage/nav link');
}

const rssFile = join(dist, 'rss.xml');
if (existsSync(rssFile)) {
  const rss = read(rssFile);
  if (
    !/<rss\b/.test(rss) ||
    !/<channel>/.test(rss) ||
    !/<title>[^<]+<\/title>/.test(rss) ||
    !/<description>[\s\S]+?<\/description>/.test(rss)
  )
    fail('RSS: missing basic channel metadata');
  const items = [...rss.matchAll(/<item>([\s\S]*?)<\/item>/g)];
  if (items.length !== articleFiles.length)
    fail(
      `RSS: expected ${articleFiles.length} articles, found ${items.length}`,
    );
  for (const [index, item] of items.entries()) {
    if (
      !/<title>[\s\S]+?<\/title>/.test(item[1]) ||
      !/<pubDate>[\s\S]+?<\/pubDate>/.test(item[1])
    )
      fail(`RSS item ${index + 1}: missing title/date`);
    const link = item[1].match(/<link>([\s\S]*?)<\/link>/)?.[1];
    try {
      const url = new URL(decode(link || ''));
      if (url.origin !== origin || !routeFile(url.pathname))
        fail(`RSS item ${index + 1}: broken article link`);
    } catch {
      fail(`RSS item ${index + 1}: invalid article link`);
    }
  }
}
const sitemapFile = join(dist, 'sitemap-index.xml');
if (existsSync(sitemapFile)) {
  const sitemap = read(sitemapFile);
  const locations = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)];
  if (!/<sitemapindex\b/.test(sitemap) || !locations.length)
    fail('Sitemap index has no sitemap locations');
  for (const match of locations) {
    try {
      const url = new URL(decode(match[1]));
      const target = routeFile(url.pathname);
      if (url.origin !== origin || !target)
        fail(`Sitemap index points to missing or external sitemap ${match[1]}`);
      else if (/<loc>[^<]*\/404(?:\.html|\/)?<\/loc>/.test(read(target)))
        fail('Sitemap includes the noindex 404 page');
    } catch {
      fail(`Invalid sitemap URL ${match[1]}`);
    }
  }
}
const robotsFile = join(dist, 'robots.txt');
if (
  existsSync(robotsFile) &&
  !/^Sitemap:\s*https?:\/\/.+sitemap-index\.xml\s*$/im.test(read(robotsFile))
)
  fail('robots.txt: missing absolute sitemap index URL');

if (failures.size) {
  console.error(`Site check failed (${failures.size}):`);
  for (const message of failures) console.error(`- ${message}`);
  process.exitCode = 1;
} else
  console.log(
    `Site check passed: ${htmlFiles.length} pages, ${articleFiles.length} articles, ${localLinks} local links/assets, all topic hubs, feeds, media gating, and Pagefind.`,
  );
