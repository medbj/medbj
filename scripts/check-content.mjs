import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { parseDocument } from 'yaml';
import { normalizePostData, taxonomySlug } from '../src/lib/post-metadata.mjs';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const slugPattern = /^[\p{L}\p{N}]+(?:-[\p{L}\p{N}]+)*$/u;
const listFiles = (directory) =>
  !existsSync(directory)
    ? []
    : readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
        const file = join(directory, entry.name);
        return entry.isDirectory() ? listFiles(file) : [file];
      });
export function isIsoDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value))
    return false;
  const timestamp = Date.parse(`${value}T00:00:00.000Z`);
  return (
    Number.isFinite(timestamp) &&
    new Date(timestamp).toISOString().slice(0, 10) === value
  );
}

/** Read raw files before Astro can normalize loader IDs or overwrite duplicate slugs. */
export function validateContent(root = projectRoot) {
  const errors = [];
  const posts = [];
  const media = [];
  const slugs = new Map();
  const report = (file, message) =>
    errors.push(`${relative(root, file).split(sep).join('/')}: ${message}`);
  const parse = (file, source) => {
    const document = parseDocument(source, { uniqueKeys: true });
    if (document.errors.length) {
      for (const error of document.errors)
        report(file, `invalid YAML: ${error.message}`);
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
    if (typeof value.src !== 'string' || !value.src.trim())
      report(file, `${field}.src is required`);
    if (typeof value.alt !== 'string' || !value.alt.trim())
      report(file, `${field}.alt must be meaningful nonempty text`);
    for (const dimension of ['width', 'height'])
      if (!Number.isInteger(value[dimension]) || value[dimension] <= 0)
        report(file, `${field}.${dimension} must be a positive integer`);
  };
  const postFiles = listFiles(join(root, 'src/content/posts')).filter((file) =>
    /\.md$/.test(file),
  );
  if (!postFiles.length)
    errors.push('src/content/posts: at least one post is required');
  for (const file of postFiles) {
    const raw = readFileSync(file, 'utf8');
    const frontmatter = raw.match(
      /^\uFEFF?---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/,
    );
    if (!frontmatter) {
      report(file, 'missing YAML frontmatter delimited by ---');
      continue;
    }
    const rawData = parse(file, frontmatter[1]);
    if (!rawData) continue;
    const data = normalizePostData(rawData, file);
    posts.push({ file, data });
    if (typeof data.slug !== 'string' || !slugPattern.test(data.slug))
      report(
        file,
        'slug or filename must use letters, digits, and single hyphens',
      );
    else if (slugs.has(data.slug))
      report(
        file,
        `duplicate slug "${data.slug}" also used by ${relative(root, slugs.get(data.slug)).split(sep).join('/')}; slugs must be globally unique until localized routes exist`,
      );
    else slugs.set(data.slug, file);
    if (typeof data.slug === 'string' && /^\d+$/.test(data.slug))
      report(file, 'numeric post slugs are reserved for blog pagination');
    for (const key of ['title', 'description', 'category', 'lang'])
      if (typeof data[key] !== 'string' || !data[key].trim())
        report(file, `${key} is required`);
    if (
      data.author !== undefined &&
      (typeof data.author !== 'string' || !data.author.trim())
    )
      report(file, 'author must be nonempty when supplied');
    if (typeof data.category === 'string' && !taxonomySlug(data.category))
      report(file, 'category needs a letter or digit');
    if (typeof data.description === 'string' && data.description.length > 160)
      report(file, 'description must be 160 characters or fewer');
    if (
      !Array.isArray(data.tags) ||
      data.tags.some(
        (tag) => typeof tag !== 'string' || !tag.trim() || !taxonomySlug(tag),
      )
    )
      report(file, 'tags must be an array of nonempty strings');
    for (const key of ['sensitive', 'draft', 'sample'])
      if (typeof data[key] !== 'boolean')
        report(file, `${key} must be a boolean`);
    if (
      rawData.dir !== undefined &&
      !['ltr', 'rtl', 'auto'].includes(rawData.dir)
    )
      report(file, 'dir must be ltr, rtl, or auto');
    for (const key of ['date', 'updated'])
      if (!isIsoDate(data[key]))
        report(file, `${key} must be a real ISO YYYY-MM-DD calendar date`);
    if (
      isIsoDate(data.date) &&
      isIsoDate(data.updated) &&
      data.updated < data.date
    )
      report(file, 'updated must not precede date');
    if (data.reviewedOn !== null && !isIsoDate(data.reviewedOn))
      report(
        file,
        'reviewedOn must be a genuine ISO YYYY-MM-DD date or explicit null for an unreviewed sample or draft',
      );
    if (
      isIsoDate(data.reviewedOn) &&
      isIsoDate(data.date) &&
      data.reviewedOn < data.date
    )
      report(file, 'reviewedOn must not precede date');
    if (
      !Array.isArray(data.keyTakeaways) ||
      data.keyTakeaways.some((item) => typeof item !== 'string' || !item.trim())
    )
      report(file, 'keyTakeaways must be an array of nonempty takeaways');
    if (!Array.isArray(data.references))
      report(file, 'references must be an array');
    else
      for (const reference of data.references) {
        if (
          !reference ||
          typeof reference.title !== 'string' ||
          !reference.title.trim()
        )
          report(file, 'every reference needs a nonempty title');
        try {
          const url = new URL(reference?.url);
          if (!['https:', 'http:'].includes(url.protocol))
            throw new Error('Invalid protocol');
        } catch {
          report(file, 'every reference needs a valid HTTP or HTTPS URL');
        }
      }
    if (data.image !== undefined) {
      if (
        typeof data.image !== 'string' ||
        !/^\.\.?\//.test(data.image) ||
        !/\.(png|jpe?g|webp|avif|gif|svg)$/i.test(data.image)
      )
        report(
          file,
          'image must be a relative path to a local image, for example ./images/photo.jpg',
        );
      else {
        const imageFile = resolve(dirname(file), data.image);
        if (!imageFile.startsWith(`${resolve(root, 'src')}${sep}`))
          report(file, 'image must live inside the project src directory');
        else if (!existsSync(imageFile))
          report(file, 'image file does not exist');
      }
      if (typeof data.imageAlt !== 'string' || !data.imageAlt.trim())
        report(file, 'imageAlt is required when image is supplied');
    }
    validateCover(file, data.cover, 'cover');
    const body = raw.slice(frontmatter[0].length);
    if (
      data.sensitive &&
      /(?:<AdSlot|<AffiliateNote|rel\s*=\s*["'][^"']*sponsored)/i.test(body)
    )
      report(file, 'sensitive posts must not include ads or affiliate links');
    if (/!\[\s*\]\(/.test(body))
      report(file, 'inline Markdown images require descriptive alt text');
    for (const match of body.matchAll(/<img\b([^>]*)>/gi))
      if (!/\balt\s*=\s*(?:"[^"\s][^"]*"|'[^'\s][^']*')/i.test(match[1]))
        report(file, 'inline img elements require nonempty quoted alt text');
  }
  for (const file of listFiles(join(root, 'src/content/media')).filter((file) =>
    /\.(?:ya?ml|json)$/.test(file),
  )) {
    const data = parse(file, readFileSync(file, 'utf8'));
    if (!data) continue;
    media.push({ file, data });
    if (!isIsoDate(data.date))
      report(file, 'date must be a real ISO YYYY-MM-DD calendar date');
    validateCover(file, data.thumbnail, 'thumbnail');
  }
  return { errors, posts, media };
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
  const result = validateContent();
  if (result.errors.length) {
    console.error(`Content validation failed (${result.errors.length}):`);
    for (const error of result.errors) console.error(`- ${error}`);
    process.exitCode = 1;
  } else {
    console.log(
      `Content validation passed: ${result.posts.length} posts, ${result.media.length} media entries, unique slugs, valid dates, and image alternatives.`,
    );
  }
}
