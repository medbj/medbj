# Publishing with one Markdown file

Create `src/content/posts/my-new-article.md`. The filename supplies `/blog/my-new-article/`; no HTML, route list, or category registry needs editing. Use a unique filename containing words separated by hyphens; names consisting only of numbers are reserved for pagination. UTF-8 filenames and content are supported.

```md
---
title: 'A small pause'
description: 'A short reflection on leaving a little room in an ordinary day.'
date: 2026-11-06
category: Everyday life
---

Write your introduction here.

## A place to begin

Continue with ordinary Markdown paragraphs, lists, and links.
```

This is an authoring example, not a reviewed article. [post-template.md](post-template.md) is a blank template and starts as a draft. Fill its four required fields before building; set `draft: false` when ready to publish. A missing `draft` field defaults to false.

| Field         | Required     | Meaning                                                                                                                                 |
| ------------- | ------------ | --------------------------------------------------------------------------------------------------------------------------------------- |
| `title`       | Yes          | Article heading and search title.                                                                                                       |
| `description` | Yes          | Unique plain-text summary, at most 160 characters.                                                                                      |
| `date`        | Yes          | A real date in `YYYY-MM-DD` format.                                                                                                     |
| `category`    | Yes          | Any meaningful category name. Its archive is generated automatically.                                                                   |
| `updated`     | No           | Defaults to `date`; cannot precede it.                                                                                                  |
| `tags`        | No           | A YAML list, such as `[rest, daily life]`; defaults to an empty list.                                                                   |
| `lang`        | No           | Defaults to `en`. Use `fr` for French or `ar` for Arabic. Arabic sets HTML and article direction to RTL automatically.                  |
| `draft`       | No           | Boolean `true` excludes the entire post from routes, archives, RSS, sitemap, related/previous/next links, search, and image processing. |
| `image`       | No           | Relative path to a local image inside `src/`, such as `./images/photo.jpg`.                                                             |
| `imageAlt`    | With `image` | Describe the image meaningfully.                                                                                                        |
| `author`      | No           | Defaults to `site.author.name` in `src/site.config.ts`.                                                                                 |

Categories appear at `/categories/<category-slug>/`, tags at `/tags/<tag-slug>/`. Category and tag names are converted to URL slugs automatically; accents are normalized and Arabic names are supported. Existing `/topics/` pages and navigation are preserved. Article category labels and tag links lead to the generated archives.

The blog shows ten posts per page, newest first. Equal dates retain the existing featured/title ordering. Reading time, previous/next links, the medical disclaimer, RSS, sitemap, social metadata, and Article JSON-LD are generated automatically. Sensitive posts can use the optional `sensitive: true` field to retain the crisis banner and neutral, unique browser title.

## Images

Put a rights-cleared image in `src/content/posts/images/` and use `image: ./images/photo.jpg` with `imageAlt`. Astro emits responsive WebP images with intrinsic dimensions and lazy loading, plus an optimized social image. Images referenced in Markdown can use `![A meaningful description](./images/photo.jpg)`; Astro also processes local Markdown images. Do not put passwords or private files in image paths.

## Drafts, languages, and original content

Published collections contain only `.md` files. The twelve original `.mdx` files remain untouched as historical source; they are excluded from publication, avoiding duplicate articles. Edit the corresponding `.md` versions. Older optional fields such as `slug`, `keyTakeaways`, `references`, `reviewedOn`, `sample`, `visual`, `cover`, and `featured` remain supported to preserve existing articles. A supplied `slug` preserves an older URL; otherwise the filename is used.

Draft source is excluded by the loader before Markdown or images enter the build. Restart `npm run dev` after changing draft status; `npm run build` always rereads the source. Valid drafts still need the required metadata. Marking a post as published does not invent an editorial review: the existing “Not yet reviewed” status remains until a genuine `reviewedOn` date is supplied. References and key takeaways are optional front matter and render when supplied; ordinary Markdown sections work too.

French and Arabic article text is written directly in the same Markdown files with `lang: fr` or `lang: ar`. The shared site interface retains its current wording and design. Do not use the same filename or explicit slug for different translations.

The default canonical origin is `https://YOUR-DOMAIN.com`. Replace it in `src/site.config.ts`, or set `SITE_URL` at build time, before uploading to your domain. All output is plain static HTML, CSS, images, browser search assets, XML, and text files; no server runtime is required. No new dependency, analytics script, or ad script was added. The single commented slot in `src/layouts/Base.astro` is the place for any future owner-supplied scripts.
