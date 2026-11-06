import { articles, type Article } from './content';
import { topicBySlug } from './topics';
import { taxonomySlug } from './post-metadata.mjs';

export function categoryFor(article: Article) {
  const known = topicBySlug(article.data.topic);
  return {
    slug: article.data.topic,
    name: known?.name || article.data.category,
    description:
      known?.description ||
      `Reading about ${article.data.category.toLowerCase()} and everyday wellbeing.`,
  };
}
export function categoryHub(article: Article) {
  return topicBySlug(article.data.topic)
    ? `/topics/${article.data.topic}/`
    : `/categories/${article.data.topic}/`;
}

export async function categories() {
  const groups = new Map<
    string,
    ReturnType<typeof categoryFor> & { articles: Article[] }
  >();
  for (const article of await articles()) {
    const category = categoryFor(article);
    if (!groups.has(category.slug))
      groups.set(category.slug, { ...category, articles: [] });
    groups.get(category.slug)!.articles.push(article);
  }
  return [...groups.values()].sort((a, b) => a.name.localeCompare(b.name));
}

export async function tags() {
  const groups = new Map<
    string,
    { slug: string; name: string; articles: Article[] }
  >();
  for (const article of await articles()) {
    for (const name of new Map(
      article.data.tags.map((name) => [taxonomySlug(name), name]),
    ).values()) {
      const slug = taxonomySlug(name);
      if (!groups.has(slug)) groups.set(slug, { slug, name, articles: [] });
      groups.get(slug)!.articles.push(article);
    }
  }
  return [...groups.values()].sort((a, b) => a.name.localeCompare(b.name));
}
