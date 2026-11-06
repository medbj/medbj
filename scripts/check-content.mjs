import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { parseDocument } from 'yaml';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const topicSlugs = new Set([
  'anxiety', 'low-mood', 'stress-burnout', 'relationships', 'sleep',
  'self-esteem', 'grief-loss', 'habits-growth',
]);
const listFiles = (directory) =>
  !existsSync(directory)
    ? []
    : readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
        const file = join(directory, entry.name);
        return entry.isDirectory() ? listFiles(file) : [file];
      });
export function isIsoDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const timestamp = Date.parse(`${value}T00:00:00.000Z`);
  return Number.isFinite(timestamp) && new Date(timestamp).toISOString().slice(0, 10) === value;
}

/** Read raw files before Astro can normalize loader IDs or overwrite duplicate slugs. */
export function validateContent(root = projectRoot) {
  const errors = [];
  const posts = [];
  const media = [];
  const slugs = new Map();
  const report = (file, message) => errors.push(`${relative(root, file).split(sep).join('/')}: ${message}`);
  const parse = (file, source) => {
    const document = parseDocument(source, { uniqueKeys: true });
    if (document.errors.length) {
      for (const error of document.errors) report(file, `invalid YAML: ${error.message}`);
      return null;
    }
    const value = document.toJSON();
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      report(file, 'metadata must be an object');
      return null;
    }
    return value;
  };
  const validateCover = (file, value, field) => {
    if (value === undefined) return;
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      report(file, `${field} must contain src, alt, width, and height`);
      return;
    }
    if (typeof value.src !== 'string' || !value.src.trim()) report(file, `${field}.src is required`);
    if (typeof value.alt !== 'string' || !value.alt.trim()) report(file, `${field}.alt must be meaningful nonempty text`);
    for (const dimension of ['width', 'height'])
      if (!Number.isInteger(value[dimension]) || value[dimension] <= 0)
        report(file, `${field}.${dimension} must be a positive integer`);
  };
  const postFiles = listFiles(join(root, 'src/content/posts')).filter((file) => /\.mdx?$/.test(file));
  if (!postFiles.length) errors.push('src/content/posts: at least one post is required');
  for (const file of postFiles) {
    const raw = readFileSync(file, 'utf8');
    const frontmatter = raw.match(/^\uFEFF?---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
    if (!frontmatter) {
      report(file, 'missing YAML frontmatter delimited by ---');
      continue;
    }
    const data = parse(file, frontmatter[1]);
    if (!data) continue;
    posts.push({ file, data });
    if (typeof data.slug !== 'string' || !slugPattern.test(data.slug))
      report(file, 'slug is required and must use lowercase letters, digits, and single hyphens');
    else if (slugs.has(data.slug))
      report(file, `duplicate slug "${data.slug}" also used by ${relative(root, slugs.get(data.slug)).split(sep).join('/')}; slugs must be globally unique until localized routes exist`);
    else slugs.set(data.slug, file);
    for (const key of ['title', 'description', 'author', 'lang'])
      if (typeof data[key] !== 'string' || !data[key].trim()) report(file, `${key} is required`);
    if (!topicSlugs.has(data.topic)) report(file, `topic must be one of the eight supported topic slugs`);
    if (!Array.isArray(data.tags) || !data.tags.length || data.tags.some((tag) => typeof tag !== 'string' || !tag.trim()))
      report(file, 'tags must be a nonempty array of strings');
    for (const key of ['sensitive', 'draft', 'sample'])
      if (typeof data[key] !== 'boolean') report(file, `${key} must be an explicit boolean`);
    if (data.dir !== undefined && !['ltr', 'rtl', 'auto'].includes(data.dir)) report(file, 'dir must be ltr, rtl, or auto');
    for (const key of ['date', 'updated'])
      if (!isIsoDate(data[key])) report(file, `${key} must be a real ISO YYYY-MM-DD calendar date`);
    if (isIsoDate(data.date) && isIsoDate(data.updated) && data.updated < data.date)
      report(file, 'updated must not precede date');
    if (data.reviewedOn !== null && !isIsoDate(data.reviewedOn))
      report(file, 'reviewedOn must be a genuine ISO YYYY-MM-DD date or explicit null for an unreviewed sample or draft');
    if (isIsoDate(data.reviewedOn) && isIsoDate(data.date) && data.reviewedOn < data.date)
      report(file, 'reviewedOn must not precede date');
    if (data.sample === false && data.draft === false && data.reviewedOn === null)
      report(file, 'published non-sample posts require a genuine human reviewedOn date');
    if (!Array.isArray(data.keyTakeaways) || !data.keyTakeaways.length || data.keyTakeaways.some((item) => typeof item !== 'string' || !item.trim()))
      report(file, 'keyTakeaways must contain at least one nonempty takeaway');
    if (!Array.isArray(data.references) || !data.references.length)
      report(file, 'references must contain at least one source');
    else for (const reference of data.references) {
      if (!reference || typeof reference.title !== 'string' || !reference.title.trim()) report(file, 'every reference needs a nonempty title');
      try {
        const url = new URL(reference?.url);
        if (!['https:', 'http:'].includes(url.protocol)) throw new Error('Invalid protocol');
      } catch { report(file, 'every reference needs a valid HTTP or HTTPS URL'); }
    }
    validateCover(file, data.cover, 'cover');
    const body = raw.slice(frontmatter[0].length);
    if (/!\[\s*\]\(/.test(body)) report(file, 'inline Markdown images require descriptive alt text');
    for (const match of body.matchAll(/<img\b([^>]*)>/gi))
      if (!/\balt\s*=\s*(?:"[^"\s][^"]*"|'[^'\s][^']*')/i.test(match[1]))
        report(file, 'inline img elements require nonempty quoted alt text');
  }
  for (const file of listFiles(join(root, 'src/content/media')).filter((file) => /\.(?:ya?ml|json)$/.test(file))) {
    const data = parse(file, readFileSync(file, 'utf8'));
    if (!data) continue;
    media.push({ file, data });
    if (!isIsoDate(data.date)) report(file, 'date must be a real ISO YYYY-MM-DD calendar date');
    validateCover(file, data.thumbnail, 'thumbnail');
  }
  return { errors, posts, media };
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const result = validateContent();
  if (result.errors.length) {
    console.error(`Content validation failed (${result.errors.length}):`);
    for (const error of result.errors) console.error(`- ${error}`);
    process.exitCode = 1;
  } else {
    console.log(`Content validation passed: ${result.posts.length} posts, ${result.media.length} media entries, unique slugs, valid dates, and image alternatives.`);
  }
}
