import { site } from '../site.config';

export type JsonLd = Record<string, unknown>;
type DateValue = Date | string;

type PostMetadata = {
  title: string;
  description: string;
  slug: string;
  date: DateValue;
  updated: DateValue;
  reviewedOn?: DateValue | null;
  lang?: string;
  author?: string;
  topic?: string;
  tags?: string[];
  draft?: boolean;
  sample?: boolean;
  cover?: { src: string; alt: string; width: number; height: number };
};

type MediaMetadata = {
  type: 'podcast' | 'video';
  title: string;
  description: string;
  date: DateValue;
  topic?: string;
  lang?: string;
  youtubeId?: string;
  duration?: string;
  transcriptUrl?: string;
  sample: boolean;
  links?: {
    spotify?: string;
    apple?: string;
    youtubeMusic?: string;
    rss?: string;
    website?: string;
  };
};

export function absoluteUrl(path: string): string {
  return new URL(path, site.url).href;
}

/** Canonicals omit private search state and use one slash form for HTML pages. */
export function canonicalUrl(pathname: string): string {
  const url = new URL(pathname, site.url);
  url.search = '';
  url.hash = '';
  if (!url.pathname.endsWith('/') && !/\.[^/]+$/.test(url.pathname)) {
    url.pathname += '/';
  }
  return url.href;
}

function dateIso(value: DateValue): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.valueOf()))
    throw new Error(`Invalid structured-data date: ${String(value)}`);
  return date.toISOString();
}

/** Escape characters that could close or disturb an inline JSON-LD script. */
export function serializeJsonLd(value: unknown): string {
  return JSON.stringify(value)
    .replace(/</g, '\\u003c')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
}

const routeLabels: Record<string, string> = {
  blog: 'Articles',
  topics: 'Topics',
  categories: 'Categories',
  tags: 'Tags',
  'start-here': 'Start here',
  'listen-and-watch': 'Listen & Watch',
  search: 'Search',
  about: 'About',
  'get-help': 'Get Help',
  newsletter: 'Newsletter',
  contact: 'Contact',
  privacy: 'Privacy',
  disclaimer: 'Medical disclaimer',
  terms: 'Terms',
  'editorial-policy': 'Editorial policy',
  'content-guidelines': 'Content guidelines',
  accessibility: 'Accessibility',
};

export function breadcrumbJsonLd(
  pathname: string,
  title: string,
): JsonLd | null {
  const segments = new URL(pathname, site.url).pathname
    .split('/')
    .filter(Boolean);
  if (!segments.length) return null;
  const items = [
    { '@type': 'ListItem', position: 1, name: 'Home', item: canonicalUrl('/') },
  ];
  let path = '';
  for (const [index, segment] of segments.entries()) {
    path += `/${segment}`;
    const fallback =
      routeLabels[segment] ||
      (/^\d+$/.test(segment) ? `Page ${segment}` : segment.replace(/-/g, ' '));
    items.push({
      '@type': 'ListItem',
      position: index + 2,
      name: index === segments.length - 1 ? title : fallback,
      item: canonicalUrl(path),
    });
  }
  return {
    '@type': 'BreadcrumbList',
    '@id': `${canonicalUrl(pathname)}#breadcrumbs`,
    itemListElement: items,
  };
}

/** No owner name, credentials, affiliations, or medical organization type is inferred. */
export function siteJsonLd(
  pathname: string,
  title: string,
  lang: string = site.lang,
): JsonLd {
  const organizationId = `${canonicalUrl('/')}#organization`;
  const breadcrumbs = breadcrumbJsonLd(pathname, title);
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': organizationId,
        name: site.name,
        url: canonicalUrl('/'),
        description: site.description,
      },
      {
        '@type': 'WebSite',
        '@id': `${canonicalUrl('/')}#website`,
        name: site.name,
        url: canonicalUrl('/'),
        description: site.description,
        inLanguage: lang,
        publisher: { '@id': organizationId },
      },
      ...(breadcrumbs ? [breadcrumbs] : []),
    ],
  };
}

/** Accepts an Astro collection entry or its validated data. Drafts emit no article schema. */
export function articleJsonLd(
  article: { data: PostMetadata } | PostMetadata,
): JsonLd | null {
  const data = 'data' in article ? article.data : article;
  if (data.draft) return null;
  const url = canonicalUrl(`/blog/${data.slug}/`);
  const author = data.author?.trim() || 'Editorial team';
  const image = data.cover
    ? {
        '@type': 'ImageObject',
        url: absoluteUrl(data.cover.src),
        width: data.cover.width,
        height: data.cover.height,
        caption: data.cover.alt,
      }
    : {
        '@type': 'ImageObject',
        url: absoluteUrl('/og.png'),
        width: 1200,
        height: 630,
      };
  return {
    '@context': 'https://schema.org',
    '@type': ['Article', 'BlogPosting'],
    '@id': `${url}#article`,
    headline: data.title,
    description: data.description,
    url,
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    datePublished: dateIso(data.date),
    dateModified: dateIso(data.updated),
    inLanguage: data.lang || site.lang,
    author: {
      '@type': author === 'Editorial team' ? 'Organization' : 'Person',
      name: author,
      url: canonicalUrl('/about/'),
    },
    publisher: { '@id': `${canonicalUrl('/')}#organization` },
    image,
    ...(data.topic ? { articleSection: data.topic } : {}),
    ...(data.tags?.length ? { keywords: data.tags.join(', ') } : {}),
    ...(data.sample
      ? { creativeWorkStatus: 'Sample content awaiting human editorial review' }
      : {}),
  };
}

/** Convert supported human durations to ISO 8601 without guessing ambiguous values. */
export function mediaDuration(value: string | undefined): string | undefined {
  const text = value?.trim();
  if (!text) return undefined;
  if (/^PT(?=\d)(?:\d+H)?(?:\d+M)?(?:\d+(?:\.\d+)?S)?$/.test(text)) return text;
  const clock = text.match(/^(?:(\d+):)?(\d{1,2}):(\d{2})$/);
  if (clock) {
    const hours = clock[1] ? Number(clock[1]) : 0;
    const minutes = Number(clock[2]);
    const seconds = Number(clock[3]);
    if (minutes >= 60 || seconds >= 60) return undefined;
    return `PT${hours ? `${hours}H` : ''}${minutes ? `${minutes}M` : ''}${seconds || (!hours && !minutes) ? `${seconds}S` : ''}`;
  }
  const words = text.match(
    /^(?:(\d+)\s*(?:h|hr|hrs|hour|hours)\s*)?(?:(\d+)\s*(?:m|min|mins|minute|minutes)\s*)?(?:(\d+)\s*(?:s|sec|secs|second|seconds))?$/i,
  );
  if (!words || !words.slice(1).some(Boolean)) return undefined;
  const [, hours, minutes, seconds] = words;
  return `PT${hours ? `${Number(hours)}H` : ''}${minutes ? `${Number(minutes)}M` : ''}${seconds ? `${Number(seconds)}S` : ''}`;
}

/** Only real media with sufficient episode/video data gets structured data. */
export function mediaJsonLd(
  item: { data: MediaMetadata } | MediaMetadata,
): JsonLd | null {
  const data = 'data' in item ? item.data : item;
  if (data.sample || !data.title.trim() || !data.description.trim())
    return null;
  const links = data.links || {};
  const duration = mediaDuration(data.duration);
  const common = {
    '@context': 'https://schema.org',
    name: data.title,
    description: data.description,
    inLanguage: data.lang || site.lang,
    ...(data.topic ? { about: data.topic } : {}),
  };
  const transcript = data.transcriptUrl
    ? {
        subjectOf: {
          '@type': 'WebPage',
          name: 'Transcript',
          url: data.transcriptUrl,
        },
      }
    : {};
  if (data.type === 'video') {
    if (!data.youtubeId || !/^[\w-]{11}$/.test(data.youtubeId)) return null;
    return {
      ...common,
      '@type': 'VideoObject',
      uploadDate: dateIso(data.date),
      url: `https://www.youtube.com/watch?v=${data.youtubeId}`,
      embedUrl: `https://www.youtube-nocookie.com/embed/${data.youtubeId}`,
      // This is metadata only. The facade never loads remote thumbnails on page view.
      thumbnailUrl: `https://i.ytimg.com/vi/${data.youtubeId}/hqdefault.jpg`,
      ...(duration ? { duration } : {}),
      ...transcript,
    };
  }
  // An RSS feed alone is not enough to identify an individual episode.
  const url =
    links.website || links.spotify || links.apple || links.youtubeMusic;
  if (!url) return null;
  return {
    ...common,
    '@type': 'PodcastEpisode',
    datePublished: dateIso(data.date),
    url,
    ...(duration ? { timeRequired: duration } : {}),
    ...transcript,
  };
}
