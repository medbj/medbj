import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';
const topic = z.enum(['anxiety', 'low-mood', 'stress-burnout', 'relationships', 'sleep', 'self-esteem', 'grief-loss', 'habits-growth']);
const blog = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(), description: z.string(), topic, lang: z.string().default('en'),
    published: z.coerce.date(), updated: z.coerce.date(), author: z.string(),
    takeaways: z.array(z.string()).min(1), references: z.array(z.object({ title: z.string(), url: z.string().url() })).min(1),
    sample: z.boolean().default(true), featured: z.boolean().default(false),
    visual: z.enum(['waves', 'plant', 'moon', 'stones', 'window', 'paths']).default('plant'),
  }).refine((data) => data.updated >= data.published, { message: 'Updated date must not precede publication' }),
});
const media = defineCollection({
  loader: glob({ pattern: '**/*.{yaml,yml,json}', base: './src/content/media' }),
  schema: z.object({
    type: z.enum(['podcast', 'video']), title: z.string(), description: z.string(), date: z.coerce.date(), topic,
    lang: z.string().default('en'), youtubeId: z.string().regex(/^[\w-]{11}$/).optional(),
    links: z.object({ spotify: z.string().url().optional(), apple: z.string().url().optional(), youtubeMusic: z.string().url().optional(), rss: z.string().url().optional(), website: z.string().url().optional() }).default({}),
    duration: z.string(), transcriptUrl: z.string().url().optional(), sample: z.boolean(),
  }),
});
export const collections = { blog, media };
