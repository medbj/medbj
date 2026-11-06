# Validation record

Checked on 6 November 2026. This is an engineering verification record, not clinical review, legal review, or accessibility certification.

## Default release

- `npm run build`: passed; 36 static HTML pages, feeds, sitemap, security headers, and an article-only Pagefind index containing 12 articles.
- `npm run check`: passed with zero errors, warnings, or hints.
- `npm run lint`: passed.
- `npm run format:check`: passed.
- `npm run check:contrast`: passed all declared text, button, and focus token pairs. Pale decorative borders are not control boundaries.
- `npm run check:site`: passed; 1,575 local links/assets and fragment targets, all eight topic hubs, metadata, article content contracts, feeds, noindex 404, and disabled-media consistency.
- `bash -n deploy/deploy.sh` and its `--help` path: passed. No VPS or DNS changes were made.

## Browser verification

Chromium checks covered homepage and article layouts at 320, 768, 1024, and 1440 pixels, with no horizontal overflow. Tested Get Help, skip-to-content and visible 3px teal keyboard focus, article contents links, topic filtering, both article-list pages, reading paths, real Pagefind results, no results, direct and changing search hashes, and legacy query-string migration. The mobile article contents disclosure appears after takeaways and before the prose; keyboard opening and anchor navigation passed, and the desktop sidebar contents remains visible.

No JavaScript is needed to read articles, browse topics, follow support links, or use the configured newsletter form. Default reading/search tests produced no third-party network requests or console errors. Enhanced search stores terms in the URL fragment. With JavaScript disabled, the native homepage search form uses a conventional query string and the search page offers browse links.

Axe checks with WCAG 2 and 2.1 A/AA rules reported zero violations on the homepage, an article, search, Get Help, the mobile homepage, and the mobile article. Some overlapping and pseudo-element contrast checks were incomplete; the separate token contrast gate passed. Human screen-reader, editorial, jurisdiction-specific legal, and real-device checks remain listed in HUMAN_TODO.md.

## Optional integrations

An isolated source copy enabled media, newsletter, analytics, and an alternate canonical origin. Its 37-page build and site checks passed. Browser requests to test provider, analytics, and video URLs were intercepted; no real email was submitted and no external video was fetched.

- Media navigation, homepage teaser, and route appeared only when enabled. Both samples stayed clearly labeled. Every media item renders its text description and any supplied transcript/platform links.
- A video facade made no YouTube request until clicked, then created a titled iframe using `youtube-nocookie.com`. It uses a local decorative thumbnail until real assets are supplied.
- Without JavaScript, the newsletter posted to its configured endpoint with the configured email and honeypot names. Native email validation blocked an invalid address; the mock received the valid address and empty honeypot. A real provider's double opt-in, unsubscribe, required fields, and error handling still need verification.
- Canonical URLs, sitemap, RSS, and robots respected `SITE_URL`; the generated CSP permitted only the configured analytics origin in addition to local scripts and connections.
- Default output was rebuilt after optional tests. It contains no mock endpoints, analytics configuration, newsletter form, or enabled media route.

## Assets and handoff

Original lightweight CSS illustrations use the requested palette. No stock photographs, downloaded fonts, or UI framework are included. Icons come from the official `@hugeicons/core-free-icons` 4.4.0 package in Stroke Rounded style: Search, Arrow Right, Arrow Up Right, Leaf, Book Open, Moon, Heart, Headphones, and Play. Icons render to static SVG without a client framework.

The Git repository records each implementation phase. The source archive contains tracked source and documentation; the static archive contains deployable `dist/` contents. Cloudflare Pages and Nginx/rsync/Certbot instructions are in docs/DEPLOY.md. The new Sites project is private and unpublished. Automatic approval review blocked the source-repository upload because external export to that destination was not explicitly authorized. No source was uploaded and no hosted preview was deployed. Public launch details and human review are tracked in HUMAN_TODO.md.

The designated chat-output directory was unavailable in the selected cloud environment (its parent is read-only and the worker has no administrator command). Source and static archives were prepared in ignored work/deliverables; the complete editable project and dist output remain in the repository.
