import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, extname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { validateContent } from './check-content.mjs';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const read = (file) => readFileSync(file, 'utf8');
const listFiles = (directory) =>
  !existsSync(directory)
    ? []
    : readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
        const file = join(directory, entry.name);
        return entry.isDirectory() ? listFiles(file) : [file];
      });
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
  for (const match of tag.matchAll(
    /([\w:-]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g,
  ))
    result[match[1].toLowerCase()] = decode(
      match[2] ?? match[3] ?? match[4] ?? '',
    );
  return result;
};
const elements = (html, name) =>
  [...html.matchAll(new RegExp(`<${name}\\b([^>]*)>`, 'gi'))].map((match) =>
    attributes(match[1]),
  );
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
const noindex = (html) =>
  elements(html, 'meta').some(
    (item) =>
      item.name?.toLowerCase() === 'robots' &&
      /\bnoindex\b/i.test(item.content || ''),
  );
const hasMonetization = (html) =>
  /\bdata-(?:ad-slot|affiliate-note)\b/i.test(html) ||
  elements(html, 'a').some((item) =>
    item.rel?.split(/\s+/).includes('sponsored'),
  );
const collectJsonLd = (value) => {
  if (Array.isArray(value)) return value.flatMap(collectJsonLd);
  if (!value || typeof value !== 'object') return [];
  return [value, ...Object.values(value).flatMap(collectJsonLd)];
};
const ofType = (entries, type) =>
  entries.filter((entry) => [entry['@type']].flat().includes(type));

/** Validate an already-built static site. This performs no build and no network calls. */
export function checkSite(root = projectRoot) {
  const dist = join(root, 'dist');
  const failures = new Set();
  const fail = (message) => failures.add(message);
  if (!existsSync(dist))
    return {
      errors: ['dist/ is missing. Run npm run build first.'],
      pages: 0,
      articles: 0,
      localLinks: 0,
    };
  const label = (file) => relative(dist, file).split(sep).join('/');
  const files = listFiles(dist);
  const htmlFiles = files.filter(
    (file) => extname(file) === '.html' && !label(file).startsWith('pagefind/'),
  );
  const htmlCache = new Map();
  const getHtml = (file) => {
    if (!htmlCache.has(file)) htmlCache.set(file, read(file));
    return htmlCache.get(file);
  };
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
    return (
      [target, join(target, 'index.html'), `${target}.html`].find(
        (candidate) => existsSync(candidate) && statSync(candidate).isFile(),
      ) || null
    );
  };
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
    '/content-guidelines/',
    '/styleguide/',
    '/404.html',
  ];
  for (const route of required)
    if (!routeFile(route)) fail(`Missing route ${route}`);
  for (const file of ['rss.xml', 'sitemap-index.xml', 'robots.txt', 'og.png'])
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
  const ogFile = join(dist, 'og.png');
  if (existsSync(ogFile)) {
    const bytes = readFileSync(ogFile);
    if (
      bytes.length < 24 ||
      bytes.subarray(0, 8).toString('hex') !== '89504e470d0a1a0a' ||
      bytes.readUInt32BE(16) !== 1200 ||
      bytes.readUInt32BE(20) !== 630
    )
      fail('og.png: expected a valid 1200 × 630 PNG');
  }
  const rawContent = validateContent(root);
  for (const error of rawContent.errors) fail(error);
  const published = rawContent.posts.filter(
    ({ data }) => data.draft === false && typeof data.slug === 'string',
  );
  const drafts = rawContent.posts.filter(
    ({ data }) => data.draft === true && typeof data.slug === 'string',
  );
  const articleTargets = new Set(
    published
      .map(({ data }) => routeFile(`/blog/${data.slug}/`))
      .filter(Boolean),
  );
  const titleOwners = new Map();
  const descriptionOwners = new Map();
  const jsonLdByFile = new Map();
  let localLinks = 0;
  for (const file of htmlFiles) {
    const html = getHtml(file);
    const fileLabel = label(file);
    const htmlTag = elements(html, 'html');
    if (htmlTag.length !== 1 || !htmlTag[0].lang)
      fail(`${fileLabel}: missing html language`);
    if ([...html.matchAll(/<h1\b/gi)].length !== 1)
      fail(`${fileLabel}: expected exactly one h1`);
    const head = html.match(/<head\b[^>]*>([\s\S]*?)<\/head>/i)?.[1] || '';
    const titles = [...head.matchAll(/<title\b[^>]*>([\s\S]*?)<\/title>/gi)];
    if (titles.length !== 1 || !textOnly(titles[0][1]).trim())
      fail(`${fileLabel}: missing or duplicate title`);
    const descriptions = elements(html, 'meta').filter(
      (item) => item.name?.toLowerCase() === 'description',
    );
    if (descriptions.length !== 1 || !descriptions[0].content?.trim())
      fail(`${fileLabel}: missing or duplicate description`);
    // Non-indexed demonstration/utility pages are not search snippets. Sensitive
    // articles may deliberately share a neutral browser title for reader privacy.
    const sensitive = published.some(
      ({ data }) => data.sensitive && routeFile(`/blog/${data.slug}/`) === file,
    );
    for (const [kind, value, owners] of [
      ['title', titles[0] ? textOnly(titles[0][1]).trim() : '', titleOwners],
      [
        'description',
        descriptions[0]?.content?.trim() || '',
        descriptionOwners,
      ],
    ]) {
      if (!value || noindex(html) || (kind === 'title' && sensitive)) continue;
      if (owners.has(value))
        fail(`${fileLabel}: ${kind} duplicates ${owners.get(value)}`);
      else owners.set(value, fileLabel);
    }
    const canonicals = elements(html, 'link').filter((item) =>
      item.rel?.split(/\s+/).includes('canonical'),
    );
    if (canonicals.length !== 1)
      fail(`${fileLabel}: expected one canonical URL`);
    let canonical;
    try {
      canonical = new URL(canonicals[0]?.href);
      if (
        !['https:', 'http:'].includes(canonical.protocol) ||
        canonical.origin !== origin ||
        canonical.search ||
        canonical.hash
      )
        fail(`${fileLabel}: invalid canonical origin or query/fragment`);
      if (routeFile(canonical.pathname) !== file)
        fail(`${fileLabel}: canonical points to another or missing page`);
    } catch {
      fail(`${fileLabel}: canonical must be absolute`);
    }
    const pageUrl =
      canonical ||
      new URL(fileLabel === 'index.html' ? '/' : `/${fileLabel}`, origin);
    const meta = elements(html, 'meta');
    const valueOf = (key) =>
      meta.filter(
        (item) => (item.property || item.name)?.toLowerCase() === key,
      );
    for (const key of [
      'og:type',
      'og:title',
      'og:description',
      'og:url',
      'og:image',
      'og:image:width',
      'og:image:height',
      'og:image:alt',
      'twitter:card',
      'twitter:title',
      'twitter:description',
      'twitter:image',
      'twitter:image:alt',
    ])
      if (valueOf(key).length !== 1 || !valueOf(key)[0].content?.trim())
        fail(`${fileLabel}: missing or duplicate ${key}`);
    if (valueOf('og:url')[0]?.content !== canonical?.href)
      fail(`${fileLabel}: og:url differs from canonical`);
    if (valueOf('twitter:card')[0]?.content !== 'summary_large_image')
      fail(`${fileLabel}: Twitter card must use summary_large_image`);
    for (const key of ['title', 'description', 'image', 'image:alt'])
      if (
        valueOf(`twitter:${key}`)[0]?.content !==
        valueOf(`og:${key}`)[0]?.content
      )
        fail(`${fileLabel}: Twitter ${key} differs from Open Graph`);
    try {
      const image = new URL(valueOf('og:image')[0]?.content);
      if (
        !['http:', 'https:'].includes(image.protocol) ||
        (image.origin === origin && !routeFile(image.pathname))
      )
        fail(`${fileLabel}: broken OG image`);
    } catch {
      fail(`${fileLabel}: OG image must be absolute`);
    }
    for (const img of elements(html, 'img')) {
      if (!img.alt?.trim())
        fail(
          `${fileLabel}: image ${img.src || '(missing src)'} requires meaningful alt text`,
        );
      for (const dimension of ['width', 'height'])
        if (!/^[1-9]\d*$/.test(img[dimension] || ''))
          fail(
            `${fileLabel}: image ${img.src || '(missing src)'} requires a positive ${dimension}`,
          );
      if (img.src && !/\.(?:webp|avif)(?:[?#]|$)/i.test(img.src))
        fail(`${fileLabel}: image ${img.src} must use WebP or AVIF`);
    }
    const entries = [];
    for (const script of html.matchAll(
      /<script\b([^>]*)>([\s\S]*?)<\/script>/gi,
    )) {
      if (attributes(script[1]).type?.toLowerCase() !== 'application/ld+json')
        continue;
      try {
        entries.push(...collectJsonLd(JSON.parse(script[2])));
      } catch {
        fail(`${fileLabel}: invalid JSON-LD`);
      }
    }
    jsonLdByFile.set(file, entries);
    for (const type of ['WebSite', 'Organization'])
      if (!ofType(entries, type).length)
        fail(`${fileLabel}: missing ${type} JSON-LD`);
    if (file !== home && !ofType(entries, 'BreadcrumbList').length)
      fail(`${fileLabel}: missing BreadcrumbList JSON-LD`);
    if (
      entries.some((entry) =>
        [entry['@type']]
          .flat()
          .some(
            (type) =>
              typeof type === 'string' &&
              /^(?:Medical|Physician|Hospital|PsychologicalTreatment|Psychiatric)/i.test(
                type,
              ),
          ),
      )
    )
      fail(`${fileLabel}: unsupported medical schema type`);
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
        if (
          !['http:', 'https:'].includes(url.protocol) ||
          url.origin !== origin
        )
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
          if (!ids.has(fragment))
            fail(`${fileLabel}: missing fragment ${value}`);
        }
      }
    }
  }
  for (const route of ['/404.html', '/styleguide/']) {
    const target = routeFile(route);
    if (target && !noindex(getHtml(target))) fail(`${route}: missing noindex`);
  }
  for (const topic of [
    'anxiety',
    'low-mood',
    'stress-burnout',
    'relationships',
    'sleep',
    'self-esteem',
    'grief-loss',
    'habits-growth',
  ])
    if (!routeFile(`/topics/${topic}/`)) fail(`Missing topic hub ${topic}`);
  for (const { data } of published) {
    const target = routeFile(`/blog/${data.slug}/`);
    if (!target) {
      fail(`Missing article /blog/${data.slug}/`);
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
      ['author', /\bby\b|about the author/i],
      ['published date', /published/i],
      ['updated date', /updated/i],
      ['last reviewed status', /last reviewed/i],
    ])
      if (!pattern.test(text)) fail(`${label(target)}: missing ${name}`);
    if (
      !elements(html, 'a').some((item) =>
        /\/editorial-policy\/?(?:#.*)?$/.test(item.href || ''),
      )
    )
      fail(`${label(target)}: missing editorial policy link`);
    if (data.sample && !/\bsample\b/i.test(text))
      fail(`${label(target)}: sample article is not labelled`);
    if (data.sensitive) {
      if (
        !/\bdata-crisis-banner\b/.test(html) ||
        !elements(html, 'a').some((item) => item.href === '/get-help/')
      )
        fail(
          `${label(target)}: sensitive article requires the crisis banner and support link`,
        );
      if (hasMonetization(html))
        fail(
          `${label(target)}: sensitive articles cannot contain ads or affiliate links`,
        );
    }
    const posting = ofType(jsonLdByFile.get(target) || [], 'BlogPosting');
    if (posting.length !== 1)
      fail(`${label(target)}: expected one BlogPosting JSON-LD object`);
    else {
      const entry = posting[0];
      for (const field of ['datePublished', 'dateModified', 'inLanguage'])
        if (!entry[field]) fail(`${label(target)}: BlogPosting lacks ${field}`);
      if (
        !entry.author ||
        ![entry.author]
          .flat()
          .some(
            (author) =>
              author && typeof author.name === 'string' && author.name.trim(),
          )
      )
        fail(`${label(target)}: BlogPosting lacks an author name`);
      for (const [field, expected] of [
        ['datePublished', data.date],
        ['dateModified', data.updated],
      ])
        if (
          typeof entry[field] !== 'string' ||
          entry[field].slice(0, 10) !== expected
        )
          fail(
            `${label(target)}: BlogPosting ${field} differs from source metadata`,
          );
      if (entry.inLanguage !== data.lang)
        fail(
          `${label(target)}: BlogPosting language differs from source metadata`,
        );
    }
    let javascriptBytes = 0;
    const counted = new Set();
    for (const match of html.matchAll(
      /<script\b([^>]*)>([\s\S]*?)<\/script>/gi,
    )) {
      const attrs = attributes(match[1]);
      if (
        ['application/ld+json', 'application/json'].includes(
          attrs.type?.toLowerCase(),
        )
      )
        continue;
      if (!attrs.src) {
        javascriptBytes += Buffer.byteLength(match[2]);
        continue;
      }
      const url = new URL(attrs.src, origin);
      if (url.origin !== origin || counted.has(url.pathname)) continue;
      counted.add(url.pathname);
      const local = routeFile(url.pathname);
      if (!local) fail(`${label(target)}: missing local script ${attrs.src}`);
      else javascriptBytes += statSync(local).size;
    }
    if (javascriptBytes >= 20000)
      fail(
        `${label(target)}: article JavaScript is ${javascriptBytes} uncompressed bytes; budget is under 20,000`,
      );
  }
  for (const route of ['/get-help/', '/content-guidelines/', '/disclaimer/']) {
    const target = routeFile(route);
    if (target && hasMonetization(getHtml(target)))
      fail(`${route}: support pages cannot contain ads or affiliate links`);
  }
  // Pagefind's binary index is not searched as text: instead verify the inputs
  // it indexes, forbid draft outputs/links, and require a complete generated index.
  for (const file of htmlFiles)
    if (
      /\bdata-pagefind-body\b/.test(getHtml(file)) &&
      !articleTargets.has(file)
    )
      fail(
        `${label(file)}: only published article pages should be indexed by Pagefind`,
      );
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
  const xmlFiles = files.filter((file) => /\.xml$/.test(file));
  for (const { data } of drafts) {
    const route = `/blog/${data.slug}/`;
    if (routeFile(route)) fail(`Draft article route was generated: ${route}`);
    for (const file of [...htmlFiles, ...xmlFiles])
      if (read(file).includes(route))
        fail(
          `${label(file)}: draft article appears in generated HTML, RSS, or sitemap: ${route}`,
        );
  }
  const configFile = join(root, 'src/site.config.ts');
  const mediaFlag =
    existsSync(configFile) &&
    read(configFile).match(/\bmedia\s*:\s*(true|false)\b/);
  if (!mediaFlag)
    fail('Could not determine features.media from site.config.ts');
  else {
    const enabled = mediaFlag[1] === 'true' && rawContent.media.length > 0;
    if (Boolean(routeFile('/listen-and-watch/')) !== enabled)
      fail(
        `Media route must require features.media=true AND nonempty media (expected ${enabled ? 'present' : 'absent'})`,
      );
    for (const file of htmlFiles) {
      const links = elements(getHtml(file), 'a').filter((item) => {
        try {
          const url = new URL(item.href, origin);
          return (
            url.origin === origin &&
            /^\/listen-and-watch\/?$/.test(url.pathname)
          );
        } catch {
          return false;
        }
      });
      if (!enabled && links.length)
        fail(`${label(file)}: links to unavailable media route`);
    }
    if (
      enabled &&
      home &&
      !elements(getHtml(home), 'a').some((item) =>
        item.href?.includes('/listen-and-watch'),
      )
    )
      fail('Available media has no homepage/nav link');
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
    if (items.length !== published.length)
      fail(
        `RSS: expected ${published.length} published articles, found ${items.length}`,
      );
    const itemRoutes = new Set();
    for (const [index, item] of items.entries()) {
      if (
        !/<title>[\s\S]+?<\/title>/.test(item[1]) ||
        !/<pubDate>[\s\S]+?<\/pubDate>/.test(item[1])
      )
        fail(`RSS item ${index + 1}: missing title/date`);
      try {
        const url = new URL(
          decode(item[1].match(/<link>([\s\S]*?)<\/link>/)?.[1] || ''),
        );
        if (
          url.origin !== origin ||
          !articleTargets.has(routeFile(url.pathname))
        )
          fail(`RSS item ${index + 1}: link is not a published article`);
        if (itemRoutes.has(url.pathname))
          fail(`RSS item ${index + 1}: duplicate article link`);
        itemRoutes.add(url.pathname);
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
    const sitemapRoutes = new Set();
    for (const match of locations) {
      try {
        const url = new URL(decode(match[1]));
        const target = routeFile(url.pathname);
        if (url.origin !== origin || !target) {
          fail(
            `Sitemap index points to missing or external sitemap ${match[1]}`,
          );
          continue;
        }
        const entries = [...read(target).matchAll(/<url>([\s\S]*?)<\/url>/g)];
        for (const entry of entries) {
          const page = new URL(
            decode(entry[1].match(/<loc>(.*?)<\/loc>/)?.[1] || ''),
          );
          const pageFile = routeFile(page.pathname);
          if (
            page.origin !== origin ||
            !pageFile ||
            extname(pageFile) !== '.html'
          )
            fail(
              `Sitemap points to a missing or external page ${page.pathname}`,
            );
          else if (noindex(getHtml(pageFile)))
            fail(`Sitemap includes a noindex page ${page.pathname}`);
          if (sitemapRoutes.has(page.pathname))
            fail(`Sitemap duplicates ${page.pathname}`);
          sitemapRoutes.add(page.pathname);
          const post = published.find(
            ({ data }) => `/blog/${data.slug}/` === page.pathname,
          );
          if (
            post &&
            entry[1].match(/<lastmod>(.*?)<\/lastmod>/)?.[1]?.slice(0, 10) !==
              post.data.updated
          )
            fail(
              `Sitemap article lastmod differs from source metadata: ${page.pathname}`,
            );
        }
      } catch {
        fail(`Invalid sitemap URL or entry in ${match[1]}`);
      }
    }
    for (const { data } of published)
      if (!sitemapRoutes.has(`/blog/${data.slug}/`))
        fail(`Sitemap omits published article ${data.slug}`);
  }
  const robotsFile = join(dist, 'robots.txt');
  if (existsSync(robotsFile)) {
    const sitemap = read(robotsFile).match(
      /^Sitemap:\s*(https?:\/\/\S+)\s*$/im,
    )?.[1];
    if (!sitemap || sitemap !== `${origin}/sitemap-index.xml`)
      fail('robots.txt: sitemap index URL must match canonical origin');
  }
  return {
    errors: [...failures],
    pages: htmlFiles.length,
    articles: published.length,
    localLinks,
  };
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
  const result = checkSite();
  if (result.errors.length) {
    console.error(`Site check failed (${result.errors.length}):`);
    for (const error of result.errors) console.error(`- ${error}`);
    process.exitCode = 1;
  } else
    console.log(
      `Site check passed: ${result.pages} pages, ${result.articles} published articles, ${result.localLinks} local links/assets, metadata, image alternatives, feeds, media gating, drafts, article JS budget, and Pagefind inputs.`,
    );
}
