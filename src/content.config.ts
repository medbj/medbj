import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';
import { relative } from 'node:path';
import { site } from './site.config';
import { filenameSlug, taxonomySlug } from './lib/post-metadata.mjs';
import { validateContent } from '../scripts/check-content.mjs';

const nonempty = z.string().trim().min(1, 'This value must not be empty');
const topic = z.enum([
  'anxiety',
  'low-mood',
  'stress-burnout',
  'relationships',
  'sleep',
  'self-esteem',
  'grief-loss',
  'habits-growth',
]);
const slug = z
  .string()
  .regex(
    /^[\p{L}\p{N}]+(?:-[\p{L}\p{N}]+)*$/u,
    'Use letters, digits, and single hyphens',
  );
const isoDate = z
  .preprocess(
    (value) =>
      value instanceof Date
        ? Number.isNaN(value.valueOf())
          ? ''
          : value.toISOString().slice(0, 10)
        : value,
    z.string().refine((value) => {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
      const timestamp = Date.parse(`${value}T00:00:00.000Z`);
      return (
        Number.isFinite(timestamp) &&
        new Date(timestamp).toISOString().slice(0, 10) === value
      );
    }, 'Use a real calendar date in ISO YYYY-MM-DD format'),
  )
  .transform((value) => new Date(`${value}T00:00:00.000Z`));
const externalUrl = z
  .string()
  .url()
  .refine((value) => /^https?:\/\//.test(value), 'Use an HTTP or HTTPS URL');
const transcriptUrl = z.union([
  externalUrl,
  z
    .string()
    .regex(/^\/(?!\/)[^\s]*$/, 'Use a site-relative path or an HTTPS URL'),
]);
const cover = z
  .object({
    src: nonempty,
    alt: nonempty,
    width: z.number().int().positive(),
    height: z.number().int().positive(),
  })
  .strict();
const reference = z.object({ title: nonempty, url: externalUrl }).strict();
// Exclude draft source files before rendering or registering their image assets.
const draftPatterns = validateContent()
  .posts.filter(({ data }) => data.draft === true)
  .map(
    ({ file }) =>
      `!${relative('src/content/posts', file).replaceAll('\\', '/')}`,
  );
const posts = defineCollection({
  loader: glob({
    pattern: ['**/*.md', ...draftPatterns],
    base: './src/content/posts',
    generateId: ({ entry, data }) =>
      typeof data.slug === 'string' ? data.slug : filenameSlug(entry),
  }),
  schema: ({ image }) =>
    z
      .object({
        title: nonempty,
        description: nonempty.max(160),
        date: isoDate,
        updated: isoDate.optional(),
        slug: slug.optional(),
        category: nonempty.refine(
          (value) => Boolean(taxonomySlug(value)),
          'Category needs a letter or digit',
        ),
        tags: z
          .array(
            nonempty.refine(
              (value) => Boolean(taxonomySlug(value)),
              'Tag needs a letter or digit',
            ),
          )
          .default([]),
        author: nonempty.default(site.author.name),
        reviewedOn: isoDate.nullable().default(null),
        keyTakeaways: z.array(nonempty).default([]),
        references: z.array(reference).default([]),
        sensitive: z.boolean().default(false),
        draft: z.boolean().default(false),
        sample: z.boolean().default(false),
        image: image().optional(),
        imageAlt: nonempty.optional(),
        cover: cover.optional(),
        lang: nonempty.default('en'),
        dir: z.enum(['ltr', 'rtl', 'auto']).optional(),
        visual: z
          .enum(['waves', 'plant', 'moon', 'stones', 'window', 'paths'])
          .default('plant'),
        featured: z.boolean().default(false),
      })
      .strict()
      .superRefine((data, context) => {
        if (data.updated && data.updated < data.date)
          context.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['updated'],
            message: 'Updated date must not precede publication date',
          });
        if (data.reviewedOn && data.reviewedOn < data.date)
          context.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['reviewedOn'],
            message: 'Review date must not precede publication date',
          });
        if (data.image && !data.imageAlt)
          context.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['imageAlt'],
            message: 'An image requires meaningful imageAlt text',
          });
      })
      .transform((data) => ({
        ...data,
        updated: data.updated || data.date,
        topic: taxonomySlug(data.category),
        dir: /^(ar|fa|he|ur)(-|$)/i.test(data.lang)
          ? ('rtl' as const)
          : data.dir || ('ltr' as const),
      })),
});
const media = defineCollection({
  loader: glob({
    pattern: '**/*.{yaml,yml,json}',
    base: './src/content/media',
  }),
  schema: z
    .object({
      type: z.enum(['podcast', 'video']),
      title: nonempty,
      description: nonempty,
      date: isoDate,
      topic,
      lang: nonempty.default('en'),
      dir: z.enum(['ltr', 'rtl', 'auto']).default('ltr'),
      youtubeId: z
        .string()
        .regex(/^[\w-]{11}$/)
        .optional(),
      links: z
        .object({
          spotify: externalUrl.optional(),
          apple: externalUrl.optional(),
          youtubeMusic: externalUrl.optional(),
          rss: externalUrl.optional(),
          website: externalUrl.optional(),
        })
        .strict()
        .default({}),
      duration: nonempty,
      transcriptUrl: transcriptUrl.optional(),
      thumbnail: cover.optional(),
      sample: z.boolean().default(true),
    })
    .strict()
    .superRefine((data, context) => {
      const hasPlatform = Object.values(data.links).some(Boolean);
      if (!data.sample && data.type === 'podcast' && !hasPlatform)
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['links'],
          message:
            'A released podcast requires a genuine platform or website link',
        });
      if (
        !data.sample &&
        data.type === 'video' &&
        !hasPlatform &&
        !data.youtubeId
      )
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['links'],
          message:
            'A released video requires a genuine platform link or YouTube ID',
        });
      if (data.thumbnail && !/^\/(?!\/)/.test(data.thumbnail.src))
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['thumbnail', 'src'],
          message:
            'Use a local thumbnail to avoid third-party requests before consent',
        });
    }),
});
export const collections = { posts, media };
