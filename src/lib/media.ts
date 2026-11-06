import { getCollection, type CollectionEntry } from 'astro:content';
import { site } from '../site.config';

export type MediaItem = CollectionEntry<'media'>;
export type MediaData = MediaItem['data'];
export const mediaPlatforms = [
  ['spotify', 'Spotify'],
  ['apple', 'Apple Podcasts'],
  ['youtubeMusic', 'YouTube Music'],
  ['rss', 'RSS feed'],
  ['website', 'Website'],
] as const;

export function mediaLinks(item: MediaData) {
  return mediaPlatforms.flatMap(([platform, label]) => {
    const href = item.links[platform];
    return href ? [{ platform, label, href }] : [];
  });
}

export async function mediaItems(): Promise<MediaItem[]> {
  return (await getCollection('media')).sort(
    (a, b) =>
      b.data.date.valueOf() - a.data.date.valueOf() ||
      a.data.title.localeCompare(b.data.title),
  );
}

/** Use this effective gate for the header, footer, and home teaser. */
export async function mediaAvailable(): Promise<boolean> {
  return site.features.media && (await mediaItems()).length > 0;
}
