# Prelaunch engineering audit — 6 November 2026

The requested mobile, favicon, sitemap, robots, metadata, and credential checks passed. The fixes preserve the current owner-private Sites audience. Public launch still requires the human work listed below.

| Check                        | Result                                                                                                                                                                                                                                                  |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Mobile and responsive layout | All 40 pages passed at 320, 375, 390, 768, and 1280 CSS pixels: 200 page/viewport checks, with no horizontal overflow.                                                                                                                                  |
| Mobile interactions          | Keyboard skip link, native menu, one-click Get Help, Pagefind search and empty state, pagination, five reading paths, article contents, and navigation without JavaScript passed.                                                                       |
| Zoom reflow                  | Five representative pages passed at a 640-pixel CSS viewport with device scale 2, equivalent to reflow in a 1280-pixel window at 200% zoom.                                                                                                             |
| Favicon                      | Branded navy M SVG, a 16/32/48-pixel ICO, a 32-pixel PNG, and a 180-pixel Apple touch icon are linked from every page. HTTP responses, image dimensions, and ICO frames were verified.                                                                  |
| Sitemap                      | `/sitemap.xml` serves a valid sitemap index with 35 indexable page URLs in its generated chunk. Astro's original `/sitemap-index.xml` remains available. Drafts and noindex utility pages are excluded.                                                 |
| Robots                       | `/robots.txt` returns plain text, points to the absolute `/sitemap.xml` URL on the configured site origin, and excludes local search.                                                                                                                   |
| Titles and descriptions      | All 40 HTML pages have a nonempty, unique title and meta description, including utility pages. The homepage title and search description were improved; Get Help metadata now describes verification accurately.                                        |
| Local links and assets       | Built-site validation passed for 2,159 local links/assets, canonical URLs, structured data, RSS, image alternatives, media gating, drafts, and article JavaScript budget.                                                                               |
| Accessibility automation     | Axe found zero violations on home, article, topics, Get Help, and search pages at 375 and 1280 pixels. The token contrast gate passed.                                                                                                                  |
| Credential scanning          | Gitleaks 8.24.3 found zero secrets in all available Git history, the current source snapshot, and the deployment output. Default detectors were extended with quoted password/API-key/client-secret assignments and passwords embedded in service URLs. |
| Sensitive files              | Only `.env.example` is tracked; its optional provider settings are blank. Local HTTP checks returned 404 for `/.env`, `/.git/config`, source files, and the ignored publication helper.                                                                 |

The source and deployment scanners reported zero findings, including passwords, API keys, tokens, and private keys covered by the detectors. Runtime publication credentials are supplied through hidden stdin and are not written into source or build files.

## Fresh mobile Lighthouse measurements

Lighthouse 13.6.0 ran against the production-style local preview at 375 × 812 with simulated mobile throttling.

| Page     | Performance | Accessibility | Best Practices | SEO |    LCP | CLS | Script bytes |
| -------- | ----------: | ------------: | -------------: | --: | -----: | --: | -----------: |
| Homepage |         100 |           100 |            100 | 100 | 908 ms |   0 |        243 B |
| Article  |         100 |           100 |            100 | 100 | 907 ms |   0 |          0 B |

These are single local laboratory runs. Lighthouse suggested small render-blocking CSS opportunities; neither run had an incomplete audit. Chromium viewport/touch emulation and automated checks do not replace physical-device, Safari, or human screen-reader testing. Axe's incomplete contrast nodes remain for human review.

## Checks and evidence

`npm run check`, `npm run build`, `npm run check:site`, and all six `npm run test:guards` cases passed. Browser runs recorded no page errors or outside requests. All favicon, sitemap, robots, and RSS endpoints returned 200; a made-up route returned 404.

The compact current evidence is in [qa/prelaunch.json](qa/prelaunch.json). Full browser matrices, Axe reports, Lighthouse HTML/JSON, redacted secret-scan reports, and screenshots are retained in ignored `work/prelaunch/` in this workspace.

## Outstanding public-launch requirements

`npm run check:launch` still reports 36 existing failures. They cover sample articles and media; the requirement for at least eight real, reviewed articles; four unverified crisis-resource records; pending legal and editorial review; explicit final-domain configuration; and a real newsletter provider with tested double opt-in. No human-review flags were changed to bypass this gate.

Complete [HUMAN_TODO.md](../HUMAN_TODO.md) and [LAUNCH.md](LAUNCH.md), including real contact/operator information, actual provider testing, and production-domain verification, before changing the private site's audience for public launch.
