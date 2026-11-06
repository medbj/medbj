import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { loadEnv } from 'vite';
import { isIsoDate, validateContent } from './check-content.mjs';
import { checkSite } from './check-site.mjs';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const read = (file) => readFileSync(file, 'utf8');
const visibleText = (html) =>
  html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ');
const reviewMarkers =
  /\b(?:TODO|TBD|placeholder|lorem ipsum|draft)\b|awaiting\s+(?:(?:human|legal|editorial)\s+)?review|(?:legal\s+)?review\s+(?:is\s+)?(?:pending|required)|not yet\s+(?:legally\s+)?reviewed|must be reviewed/i;

function httpsUrl(value) {
  if (typeof value !== 'string' || !value.trim()) return null;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && !url.username && !url.password
      ? url
      : null;
  } catch {
    return null;
  }
}

function isProductionDomain(url) {
  const hostname = url.hostname.toLowerCase();
  return (
    hostname.includes('.') &&
    !/^\d+(?:\.\d+){3}$/.test(hostname) &&
    !hostname.includes(':') &&
    !/(?:^|[.-])(?:localhost|preview|staging)(?:[.-]|$)/.test(hostname) &&
    !/(?:^|\.)(?:example\.(?:com|org|net)|invalid|test|example|localhost)$/.test(
      hostname,
    ) &&
    url.pathname === '/' &&
    !url.search &&
    !url.hash
  );
}

/**
 * Public-release gate. Environment values are never included in diagnostics.
 * checkBuiltSite:false is for isolated fixture tests; the CLI always checks dist.
 * Confirmation flags record human attestations; this code cannot perform review.
 */
export function validateLaunch(root = projectRoot, options = {}) {
  const env = options.env || {
    ...loadEnv('production', root, ''),
    ...process.env,
  };
  const failures = new Set();
  const fail = (message) => failures.add(message);
  const label = (file) => relative(root, file).split(sep).join('/');
  const content = validateContent(root);
  for (const error of content.errors) fail(error);
  for (const { file, data } of [...content.posts, ...content.media])
    if (data.sample !== false)
      fail(
        `${label(file)}: sample content must be removed or replaced, including drafts and disabled media`,
      );
  const realReviewed = content.posts.filter(
    ({ data }) =>
      data.draft === false &&
      data.sample === false &&
      isIsoDate(data.reviewedOn),
  );
  if (realReviewed.length < 8)
    fail(
      `At least 8 real, human-reviewed, published articles are required; found ${realReviewed.length}`,
    );

  const siteUrl = httpsUrl(env.SITE_URL);
  if (!siteUrl || !isProductionDomain(siteUrl))
    fail(
      'SITE_URL must explicitly configure the final HTTPS domain; example, local, and staging domains are not public-launch domains',
    );
  const newsletterUrl = httpsUrl(env.PUBLIC_NEWSLETTER_ACTION_URL);
  if (!newsletterUrl || !isProductionDomain(new URL(newsletterUrl.origin)))
    fail(
      'PUBLIC_NEWSLETTER_ACTION_URL must configure a real HTTPS newsletter provider endpoint',
    );
  for (const [key, meaning] of [
    [
      'PUBLIC_NEWSLETTER_DOUBLE_OPT_IN_CONFIRMED',
      'a human must test the signup and confirm provider-side double opt-in',
    ],
    [
      'LEGAL_REVIEW_CONFIRMED',
      'a human must confirm review of the legal pages and update their pending copy',
    ],
    [
      'EDITORIAL_PROCESS_CONFIRMED',
      'a human must confirm the published editorial process and publishing cadence',
    ],
  ])
    if (env[key] !== 'true') fail(`${key}=true is required: ${meaning}`);

  const crisisFile = join(root, 'src/data/crisis-resources.json');
  if (!existsSync(crisisFile))
    fail('src/data/crisis-resources.json is missing');
  else {
    try {
      const resources = JSON.parse(read(crisisFile));
      if (!Array.isArray(resources) || !resources.length)
        fail(
          'Crisis resources must contain human-verified entries; an empty registry cannot pass launch',
        );
      else
        for (const [index, entry] of resources.entries()) {
          const name =
            typeof entry?.country === 'string'
              ? entry.country
              : `entry ${index + 1}`;
          if (entry?.verified !== true)
            fail(`Crisis resource ${name}: a human must verify this entry`);
          if (
            !isIsoDate(entry?.lastVerified) ||
            entry.lastVerified > new Date().toISOString().slice(0, 10)
          )
            fail(
              `Crisis resource ${name}: a real, non-future lastVerified date is required`,
            );
          if (
            !entry?.service?.trim() ||
            !entry?.number?.trim() ||
            !entry?.hours?.trim() ||
            !Array.isArray(entry?.languages) ||
            !entry.languages.length ||
            /not yet|unverified|placeholder|TODO/i.test(entry.hours || '')
          )
            fail(
              `Crisis resource ${name}: complete service, number, confirmed hours, and languages are required`,
            );
        }
    } catch {
      fail('src/data/crisis-resources.json must be valid JSON');
    }
  }

  if (options.checkBuiltSite !== false) {
    for (const error of checkSite(root).errors) fail(error);
    const dist = join(root, 'dist');
    for (const route of [
      'privacy',
      'terms',
      'disclaimer',
      'editorial-policy',
    ]) {
      const file = join(dist, route, 'index.html');
      if (!existsSync(file)) {
        fail(`/${route}/: built legal/editorial page is missing`);
        continue;
      }
      const html = read(file);
      if (
        /\bdata-legal-review\s*=\s*["']pending["']/i.test(html) ||
        reviewMarkers.test(visibleText(html))
      )
        fail(
          `/${route}/: pending legal/editorial review markers must be replaced after real human review`,
        );
    }
    const home = join(dist, 'index.html');
    if (siteUrl && existsSync(home)) {
      const href = read(home).match(
        /<link\b(?=[^>]*\brel=["']canonical["'])(?=[^>]*\bhref=["']([^"']+)["'])[^>]*>/i,
      )?.[1];
      try {
        if (new URL(href).origin !== siteUrl.origin)
          fail(
            'Built canonical origin differs from SITE_URL; rebuild with the production environment',
          );
      } catch {
        fail('Built homepage canonical must match SITE_URL');
      }
    }
    const newsletter = join(dist, 'newsletter/index.html');
    if (newsletterUrl && existsSync(newsletter)) {
      // Decode basic attribute entities without printing a provider URL or token.
      const actions = [
        ...read(newsletter).matchAll(
          /<form\b[^>]*\baction=["']([^"']*)["'][^>]*>/gi,
        ),
      ].map((match) => match[1].replace(/&amp;/g, '&'));
      if (!actions.includes(newsletterUrl.href))
        fail(
          'Built newsletter form does not use PUBLIC_NEWSLETTER_ACTION_URL; rebuild with the production environment',
        );
    }
  }
  return {
    errors: [...failures],
    realReviewedArticles: realReviewed.length,
    posts: content.posts.length,
    media: content.media.length,
  };
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
  const result = validateLaunch();
  if (result.errors.length) {
    console.error(`Public launch blocked (${result.errors.length}):`);
    for (const error of result.errors) console.error(`- ${error}`);
    console.error(
      'A normal build may still be used for private review. Complete HUMAN_TODO.md and rebuild before running this separate release gate.',
    );
    process.exitCode = 1;
  } else
    console.log(
      `Public launch checks passed for ${result.realReviewedArticles} reviewed articles. Human confirmation flags are attestations, not automated legal, editorial, or crisis-resource verification.`,
    );
}
