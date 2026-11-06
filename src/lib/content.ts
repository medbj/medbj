import { getCollection, type CollectionEntry } from 'astro:content';
export type Article = CollectionEntry<'blog'>;
export async function articles() {
  return (await getCollection('blog')).sort(
    (a, b) =>
      b.data.published.valueOf() - a.data.published.valueOf() ||
      Number(b.data.featured) - Number(a.data.featured) ||
      a.data.title.localeCompare(b.data.title),
  );
}
export const articleUrl = (article: Article) => `/blog/${article.id}/`;
export const readTime = (article: Article) =>
  Math.max(1, Math.ceil((article.body || '').split(/\s+/).length / 200));
export const dateLabel = (date: Date) =>
  new Intl.DateTimeFormat('en', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date);
