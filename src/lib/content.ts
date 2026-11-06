import { getCollection, type CollectionEntry } from 'astro:content';
type Post = CollectionEntry<'posts'>;
export type Article = Omit<Post, 'data'> & {
  data: Omit<Post['data'], 'slug'> & { slug: string };
};

/** Every public reader flow must use this accessor so drafts stay out of the build. */
export async function articles(): Promise<Article[]> {
  return (await getCollection('posts', ({ data }) => !data.draft))
    .map((post) => ({
      ...post,
      data: { ...post.data, slug: post.data.slug || post.id },
    }))
    .sort(
      (a, b) =>
        b.data.date.valueOf() - a.data.date.valueOf() ||
        Number(b.data.featured) - Number(a.data.featured) ||
        a.data.title.localeCompare(b.data.title),
    );
}
export const allPublicPosts = articles;
export const articleUrl = (article: Article) => `/blog/${article.data.slug}/`;
export const readTime = (article: Article) =>
  Math.max(1, Math.ceil((article.body || '').trim().split(/\s+/).length / 200));
export const dateLabel = (date: Date) =>
  new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date);
