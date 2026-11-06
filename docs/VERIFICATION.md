# Verification commands

`npm run build` produces a private review build, including clearly labelled sample content. It runs raw content validation, contrast checks, Astro, generated security headers, and Pagefind. It does not assert that human editorial, legal, or crisis-resource review has happened.

After building, `npm run check:site` validates generated routes, all local links/assets/fragments, canonical and social metadata, a 1200 × 630 default OG PNG, structured data, image alternatives/dimensions/formats, published-article RSS and sitemap entries, article lastmod dates, and article JavaScript below 20,000 uncompressed bytes. Media must be enabled **and** have content. Sensitive articles need the crisis banner and cannot contain ads or sponsored links; support pages cannot contain monetization. Only published articles may expose `data-pagefind-body`. Draft routes and draft links in HTML, RSS, and sitemap must be absent. Pagefind uses binary index files, so the check validates its HTML inputs and generated loader/index rather than pretending a raw string search proves its search results.

`npm run check:launch` is a separate public-release gate. It loads the production `.env` files with Vite's `loadEnv('production', projectRoot, '')`, with existing process environment taking precedence. It never prints environment values. Configure:

| Variable                                         | Required meaning                                                                                                                                                           |
| ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `SITE_URL`                                       | Final HTTPS site origin, with no path/query/fragment; local, example, and staging domains are rejected. A Sites domain is permitted when explicitly chosen for production. |
| `PUBLIC_NEWSLETTER_ACTION_URL`                   | Real HTTPS provider form endpoint.                                                                                                                                         |
| `PUBLIC_NEWSLETTER_DOUBLE_OPT_IN_CONFIRMED=true` | Human attestation that test signup completed and provider-side double opt-in is active.                                                                                    |
| `LEGAL_REVIEW_CONFIRMED=true`                    | Human attestation that Privacy, Terms, and Disclaimer were reviewed. Pending markers/copy must also be replaced.                                                           |
| `EDITORIAL_PROCESS_CONFIRMED=true`               | Human attestation that the published editorial process and publishing cadence are real and confirmed.                                                                      |

The gate rejects any remaining sample post (including a draft), sample media (including disabled media), fewer than eight nonsample published posts with actual review dates, invalid content/image alternatives, unverified/incomplete crisis entries or missing actual verification dates, and pending/TODO/placeholder legal or editorial copy in the built pages. It also runs the complete site check, ensures built canonicals match `SITE_URL`, and checks the newsletter form uses the configured endpoint. Rebuild after production environment or copy changes. These flags record human confirmations; the script does not perform legal, clinical, or editorial review, test a provider, or verify a crisis number over a network.

## Script API and fixture tests

`validateContent(root)` in `scripts/check-content.mjs` returns `{ errors, posts, media }` from raw files. `checkSite(root)` in `scripts/check-site.mjs` returns `{ errors, pages, articles, localLinks }` for an existing `dist/`. `validateLaunch(root, { env })` in `scripts/check-launch.mjs` returns `{ errors, realReviewedArticles, posts, media }`. All three collect actionable errors without mutating content.

Run `node scripts/check-content.test.mjs` (or `npm run test:checks`). The tests create temporary fixtures for valid raw metadata, duplicate explicit slugs across nested drafts, invalid calendar dates, empty cover/inline alternatives, samples despite completed human-confirmation flags, and missing environment/unverified crisis data. The fixture-only `checkBuiltSite:false` option isolates the release content rules; the launch CLI always validates the built site. Fixture dates and confirmations are test data and make no claim about real site content.

Browser accessibility, keyboard, 200% zoom, newsletter provider behavior, Pagefind runtime results, blocked media playback, and mobile Lighthouse remain separate checks documented in `docs/QA.md` and `docs/LAUNCH.md`. Static checks do not certify them.
