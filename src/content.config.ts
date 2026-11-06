import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

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
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use a short lowercase slug with single hyphens');
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
  z.string().regex(/^\/(?!\/)[^\s]*$/, 'Use a site-relative path or an HTTPS URL'),
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
const posts = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/posts' }),
  schema: z
    .object({
      title: nonempty,
      description: nonempty,
      date: isoDate,
      updated: isoDate,
      slug,
      topic,
      tags: z.array(nonempty).min(1),
      author: nonempty,
      reviewedOn: isoDate.nullable(),
      keyTakeaways: z.array(nonempty).min(1),
      references: z.array(reference).min(1),
      sensitive: z.boolean(),
      draft: z.boolean(),
      sample: z.boolean(),
      cover: cover.optional(),
      lang: nonempty,
      dir: z.enum(['ltr', 'rtl', 'auto']).default('ltr'),
      visual: z
        .enum(['waves', 'plant', 'moon', 'stones', 'window', 'paths'])
        .default('plant'),
      featured: z.boolean().default(false),
    })
    .strict()
    .superRefine((data, context) => {
      if (data.updated < data.date)
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
      if (!data.sample && !data.draft && !data.reviewedOn)
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['reviewedOn'],
          message: 'A published non-sample post needs a genuine human review date; samples and drafts may use null',
        });
    }),
});
const media = defineCollection({
  loader: glob({ pattern: '**/*.{yaml,yml,json}', base: './src/content/media' }),
  schema: z
    .object({
      type: z.enum(['podcast', 'video']),
      title: nonempty,
      description: nonempty,
      date: isoDate,
      topic,
      lang: nonempty.default('en'),
      dir: z.enum(['ltr', 'rtl', 'auto']).default('ltr'),
      youtubeId: z.string().regex(/^[\w-]{11}$/).optional(),
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
    .strict(),
});
export const collections = { posts, media };
