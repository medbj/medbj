import { site } from '../site.config';
export function GET() {
  return new Response(
    `User-agent: *\nAllow: /\nDisallow: /search/\nSitemap: ${new URL('/sitemap-index.xml', site.url).href}\n`,
    { headers: { 'Content-Type': 'text/plain; charset=utf-8' } },
  );
}
