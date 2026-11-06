import { z } from 'astro:content';
import registry from '../data/affiliates.json';
const entry = z
  .object({
    id: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    title: z.string().trim().min(1),
    url: z
      .string()
      .url()
      .refine(
        (value) => value.startsWith('https://'),
        'Use a genuine HTTPS affiliate destination',
      ),
  })
  .strict();
export const affiliates = z.array(entry).parse(registry);
if (new Set(affiliates.map(({ id }) => id)).size !== affiliates.length)
  throw new Error('Affiliate IDs must be unique');
