import rss from '@astrojs/rss';
import { articles, articleUrl } from '../lib/content';
import { site } from '../site.config';
export async function GET() {
  return rss({
    title: site.name,
    description: site.description,
    site: site.url,
    items: (await articles()).map((article) => ({
      title: article.data.title,
      pubDate: article.data.published,
      description: `${article.data.sample ? 'Sample article. Awaiting human editorial review. ' : ''}${article.data.description}`,
      link: articleUrl(article),
      categories: [article.data.topic],
    })),
    customData: `<language>${site.lang}</language>`,
  });
}
