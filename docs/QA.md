# Browser and performance QA — 6 November 2026

The default static build passed the tested flows at 375px and 1280px: home, articles, topic index/hubs, guided paths, Get Help, pagination, and local search. Search matched `sléep` to sleep results, handled zero results, and kept query state in the URL fragment. Native mobile navigation worked with JavaScript disabled. Skip-link/menu focus rings measured 3px teal. The article ToC opened and linked to the expected heading.

Home, article, and Get Help also reflowed without horizontal overflow at an effective 640 CSS px / 2× device pixel ratio, a 200%-zoom-equivalent layout for a 1280px physical window. This was a reflow simulation, not a manual desktop-browser zoom walkthrough.

Axe WCAG 2, 2.1, and 2.2 A/AA checks reported zero violations on home/article at both widths, search, Get Help, and the optional media page. Some contrast checks remained incomplete because of overlapping elements; the project's separate token contrast gate passed. Automated checks do not establish full WCAG conformance.

Default reading pages made no external requests. The tested article loaded 0 bytes of executable JavaScript. The intentional missing-route check returned 404 with `noindex`; its expected HTTP-error console message was recorded separately from application errors.

## Lighthouse

Lighthouse 13.6.0, mobile 375×812, device scale 1, simulated mobile throttling, local static preview:

| Page    | Performance | Accessibility | Best Practices | SEO |    LCP | CLS | Script bytes |
| ------- | ----------: | ------------: | -------------: | --: | -----: | --: | -----------: |
| Home    |         100 |           100 |            100 | 100 | 909 ms |   0 |        243 B |
| Article |         100 |           100 |            100 | 100 | 908 ms |   0 |          0 B |

Both runs met the requested 90+ category, LCP under 2.5 seconds, and article JS under 20 KB targets. These were single local laboratory runs, not field measurements or a guarantee for every device and connection.

## Isolated optional-feature tests

All fixture changes were confined to `work/full-brief/qa-variant`; default source and output were not modified by fixture builds.

- Enabling media exposed the route, navigation, and home teaser. Both items retained descriptions and topic fallbacks. No YouTube request or iframe appeared before a click. The resulting iframe used `youtube-nocookie.com` without autoplay. A blocked mock player retained direct and reading fallbacks; no-JS readers retained the direct video link.
- Enabling the feature with an empty collection omitted its route, navigation, and teaser. The build and site checks passed; Astro logged its expected empty-collection warning.
- Configured newsletter fields sent native POST bodies to an intercepted mock provider with and without JavaScript. Invalid email, honeypot, and offline cases did not submit. The pending state and duplicate-submit guard worked. A deliberate provider 503 was followed by usable back/reset and signup-help guidance. No real subscription or confirmation email was sent; provider double opt-in still needs human verification.
- Ads and affiliates rendered on an ordinary isolated positive-control article with sponsored disclosure. The sensitive fixture showed a crisis banner and neutral tab title, with no promotion. Get Help had no promotion. Attempting to add AffiliateNote markup to a sensitive fixture was rejected by the raw-content validator.
- All external fixture requests were intercepted. No real video, analytics, or email-provider load/submission occurred. The mock provider's intentional 503 produced the expected console response.

## Verification and evidence

The production-style build and static checks passed: 40 HTML pages, 12 published sample articles, and 2,038 local links/assets. `npm run check` returned zero errors, warnings, or hints. ESLint, formatting, content validation, the token contrast gate, and all six safeguard fixtures passed. `npm run check:launch` intentionally fails because sample posts/media, unverified crisis seeds, pending legal/editorial copy, and real production/provider settings remain incomplete. This is a private engineering review build.

Small machine-readable summaries are included in `docs/qa/`: browser-final.json, axe-final.json, lighthouse-summary.json, browser-variant.json, and empty-media.json. Complete local Lighthouse HTML/JSON reports and screenshots are retained in ignored `work/full-brief/qa/` in this workspace. Reports are generated evidence, not clinical review, legal approval, or accessibility certification.

Reproduce the engineering checks with `npm run check`, `npm run lint`, `npm run build`, `npm run check:site`, `npm run test:guards`, and `npm run format:check`. Run `npm run preview` to serve the completed Pagefind index. Lighthouse can be run against that preview with mobile emulation and the performance, accessibility, best-practices, and SEO categories. Record new measurements after substantive changes.

Human screen-reader and real-device checks, actual provider double opt-in/unsubscribe, verified support-resource information, legal approval, and deployment-domain checks remain in HUMAN_TODO.md and docs/LAUNCH.md.

Icons use the official Hugeicons Stroke Rounded package at build time: Search, Arrow Right, Arrow Up Right, Leaf, Book Open, Moon, Heart, Headphones, and Play. The SVG Arial wordmark contains no icon. No font files or icon runtime framework load in the browser.

## Reference-inspired layout refresh — 6 November 2026

The homepage now uses a cream canvas, rounded sage and olive sections, guided-reading cards, editorial article rows, topic panels, and a circular reading invitation. The shared navy wordmark places Psychology below MENA. The restored ReadingGarden source is unchanged.

Astro validation, ESLint, the production build, token contrast checks, and built-site validation passed. Browser checks covered the homepage, an article, and a topic page at 320, 375, 640, 768, 1280, and 1440 pixels. They verified no horizontal overflow, artwork and caption spacing, stacked navy branding, reading-path destinations, Pagefind search, keyboard focus, and navigation without JavaScript. Article executable JavaScript remained 0 B; no browser errors or external requests were observed.

Axe reported zero violations on the homepage and article at 375 and 1280 pixels. Its incomplete contrast nodes still require human review; the expanded token contrast gate passed for the new surfaces. Local screenshots and machine-readable results are in ignored `work/layout-refresh/`. The Lighthouse scores above belong to the earlier full-brief build and were not remeasured for this layout update.

## Prelaunch audit — 6 November 2026

See [PRELAUNCH.md](PRELAUNCH.md) for the later, current engineering audit and [qa/prelaunch.json](qa/prelaunch.json) for its compact evidence. All 40 pages passed at five viewport widths, all titles and descriptions were unique, ten Axe page/viewport checks had zero violations, and source/history/build credential scans found no secrets. Fresh mobile Lighthouse runs on home and an article scored 100 in all four categories, with LCP of 908 ms and 907 ms. Favicon formats, `/sitemap.xml`, and `/robots.txt` were verified. The separate public-launch gate remains blocked on existing human content, review, resource-verification, and provider requirements.
