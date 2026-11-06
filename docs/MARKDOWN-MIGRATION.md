# Markdown authoring migration

Completed on the `markdown-posts` branch. Commit `0d4834b` captures the finished site before migration; `a60a388` adds the Markdown workflow. The existing Astro static architecture was reused rather than replacing the design.

## What changed

- Twelve active `.md` posts were added in `src/content/posts/`. All twelve original `.mdx` files remain untouched and inactive. Every converted article body is identical to its source.
- `src/content.config.ts` and the content helpers accept the requested front matter. Only title, description (maximum 160 characters), date, and category are required. Slugs come from filenames. Updated, tags, language, draft state, and author have defaults. Optional images require alt text.
- The blog contains ten posts per page. Categories and tags generate their own index and archive pages automatically. Existing Topics routes, navigation, and all other pages remain available.
- Post pages automatically receive reading time, previous/next links, a medical disclaimer, language/direction, canonical and social metadata, and Article/BlogPosting JSON-LD. Existing review/sample information is preserved without inventing reviews.
- Local post and Markdown body images are processed by Astro. Covers have responsive WebP variants; images have alt text, intrinsic dimensions, lazy loading, and responsive aspect ratios.
- The English header and footer retain their original direction on Arabic posts; the document and article text use RTL. The Latin wordmark remains readable.
- The default origin is `https://YOUR-DOMAIN.com`, as requested. Sitemap, RSS, robots, and canonical URLs follow that setting. The production build now runs the built-site checks after generating search, so missing assets, broken links, and duplicate metadata fail the build.
- Automatic analytics loading was removed from the main layout. One commented future-script location remains. Existing advertising components are retained as original files and are not rendered by posts. No dependency was added; package-lock and the dependency list are unchanged.
- [README.md](../README.md) contains five operating steps. [WRITING.md](WRITING.md) explains all fields, images, languages, and drafts. [post-template.md](post-template.md) is a blank draft template.

## Design and file preservation

No original file was deleted. Every existing stylesheet and original MDX file is byte-for-byte unchanged. The existing artwork, colors, fonts, header, footer, and navigation were retained. New archives reuse existing components and CSS classes; the only new image rule preserves the aspect ratio of Markdown body images.

Before/after viewport screenshots of home, an article, About, and a topic page at 375 and 1280 pixels had **zero differing pixels in all eight comparisons**. These are viewport comparisons, not a claim of exhaustive visual equivalence for every possible future article. Required pagination and article navigation features add content using the existing styles.

## Verification

- `npm run check`: zero errors, warnings, or hints.
- `npm run build`: no errors or warnings; plain static `dist/` output, 58 HTML pages, 12 articles, and 3,021 checked local links/assets. There is no SSR adapter or server runtime in the deployment output.
- `npm run test:guards`: all 11 cases passed, including minimal metadata, dates, slug collisions, alt text, Arabic direction, and inactive MDX originals.
- Browser preview: 58 pages at 320, 375, 390, 768, and 1280 pixels, totaling 290 responsive checks with no overflow. Keyboard, menus, search/results/empty state, pagination, reading paths, 404s, and no-JavaScript alternatives passed.
- Axe: zero violations in 14 page/viewport checks covering home, an article, Topics, Get Help, Search, a category, and a tag at 375 and 1280 pixels. Incomplete contrast nodes still require human review.
- An isolated copy built one article with only the four required fields, plus French and Arabic articles. It verified automatic category/tag routes, default author/date/language values, Article schema, the medical disclaimer, ten-post pagination, optimized images, Arabic text direction, and unclipped wordmarks.
- A draft-only article, category, tag, body marker, and image were absent from the isolated build, its routes, and browser search. Source exclusion happens before Markdown rendering and image processing. Legacy analytics environment settings injected no scripts.
- The isolated media-enabled variant retained both original podcast/video entries, its route, header links, and home teaser. The main build retains the original disabled setting.
- Secret scanning covered source files and deployment output with Gitleaks, including password/API-key assignments and credential-bearing URL detectors. No credentials were detected. Full available Git history was also scanned before packaging.

The compact evidence is in [qa/markdown-posts.json](qa/markdown-posts.json). Full screenshots, browser matrices, Axe reports, Lighthouse reports, and redacted scans are in ignored `work/markdown-posts/` in this workspace. Browser tests use Chromium emulation; real-device, Safari, and human screen-reader checks remain distinct.

## Mobile performance

Fresh Lighthouse 13.6.0 runs at 375 × 812 with simulated mobile throttling scored 100 for Performance, Accessibility, Best Practices, and SEO on both home and an article. LCP measured 910 ms and 907 ms; CLS was zero. Home loaded 243 B of executable JavaScript; the article loaded 0 B. These are single local laboratory runs, not field guarantees.

## Commands and owner settings

```sh
npm ci
npm run dev
# Add src/content/posts/my-new-article.md using docs/post-template.md.
npm run build
npm run preview
```

Fill the template's four required fields and article body; use `draft: false` to publish it. Upload every file and folder inside `dist/` to your static host. No HTML or route registry needs editing for a new article.

Replace `https://YOUR-DOMAIN.com` with your final HTTPS domain and confirm `site.author` in `src/site.config.ts`. The existing sample-content and human-review checklist in HUMAN_TODO.md still applies before public launch; this migration does not mark reviews complete.
