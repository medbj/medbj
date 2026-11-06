import { getCollection } from 'astro:content';
/** Recheck route content so a missing caller prop cannot monetize a sensitive post. */
export async function canMonetize(pathname: string, sensitive = false) {
  if (sensitive || /^\/get-help(?:\/|$)/.test(pathname)) return false;
  const slug = pathname.match(/^\/blog\/([^/]+)\/?$/)?.[1];
  if (slug) {
    const post = (await getCollection('posts')).find(
      ({ data }) => data.slug === slug,
    );
    if (!post || post.data.sensitive || post.data.draft) return false;
  }
  return true;
}
