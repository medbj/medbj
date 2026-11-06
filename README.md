# MENA Psychology

A calm educational mental health reading site built with Astro, strict TypeScript, MDX content collections, plain CSS, and Pagefind. It produces a static `dist/` directory with no application backend, database, accounts, or comments. Arial is the only font family used.

The complete attached brief defines an English launch for a worldwide audience. MENA Psychology is the current working brand. The referenced earlier multilingual archive is not available in this workspace; no recovered French or Arabic source is claimed. Content language fields, direction support, and logical CSS properties prepare for later localization.

## Run locally

Use Node 22 LTS or a supported Node LTS release consistent with the installed Astro version and deployment host.

```sh
npm install
cp .env.example .env
npm run dev
```

For a repeatable checkout using the committed lockfile, use `npm ci` instead of `npm install`. Set the final canonical HTTPS origin with `SITE_URL`. Keep newsletter and analytics values empty until the real services are configured. These are build-time settings; `PUBLIC_` values appear in the generated site and must never hold API keys.

```sh
npm run check          # Astro and strict TypeScript diagnostics
npm run lint           # ESLint
npm run check:content  # Validate content contracts and duplicate slugs
npm run check:contrast # Declared token-pair contrast checks
npm run build          # Content and contrast gates, Astro, headers, Pagefind
npm run check:site     # Generated routes, local links, metadata, content contracts
npm run check:launch   # Public launch gate; intentionally fails while human work remains
npm run test:guards    # Fixtures for content and launch safeguards
npm run preview       # Serve the completed build, including search
npm run format        # Prettier
npm run format:check  # Formatting without editing
```

Pagefind is generated after a production build. Use `npm run build` and `npm run preview` to test search; the dev server alone does not create its index. Reading, topic links, support links, and configured newsletter submission work without JavaScript. Search provides an article-index fallback when scripts are unavailable.

## Review build and public launch

The repository deliberately includes labelled sample content and pending human work. `npm run build` can produce a complete review copy. `npm run check:launch` must fail while samples, unverified crisis records, legal-review placeholders, required configuration, missing alt text, or broken internal links remain. Do not remove labels or assert review to make it pass.

The launch gate requires `SITE_URL`, `PUBLIC_NEWSLETTER_ACTION_URL`, and confirmed provider field names in `PUBLIC_NEWSLETTER_EMAIL_FIELD` and `PUBLIC_NEWSLETTER_HONEYPOT_FIELD`. Set `PUBLIC_NEWSLETTER_DOUBLE_OPT_IN_CONFIRMED=true` only after a human verifies a real provider signup and double opt-in. Set `LEGAL_REVIEW_CONFIRMED=true` and `EDITORIAL_PROCESS_CONFIRMED=true` only after the corresponding human work is complete and the website accurately describes it. These values are attestations, not automatic reviews.

Complete `HUMAN_TODO.md` and `docs/LAUNCH.md` before public deployment. A private review site is separate from a public launch. Use `docs/QA.md` for measurements on the current full-brief implementation. `docs/VALIDATION.md` records the earlier build and does not establish results for changed code. Neither engineering checks nor a launch-gate result establish editorial accuracy, clinical review, legal approval, or accessibility certification.

## Layout

- `src/site.config.ts`: working name, domain, tagline, language, feature flags, and author settings.
- `src/content.config.ts`, `src/content/`: validated educational post and media records, including language, review status, draft, sensitive, and sample fields.
- `src/data/`: crisis-resource records and commercial-link registry; content helpers provide topics and beginner reading paths.
- `src/components/`, `src/layouts/`: shared reading, support, disclosure, media, and newsletter UI.
- `src/pages/`: articles, topics, reading paths, search, trust pages, feeds, and support.
- `src/styles/`: supplied color tokens and responsive logical-property CSS.
- `scripts/`: contrast, generated-site, launch, and build helpers.
- `public/`: local assets and static hosting files.
- `deploy/`, `docs/DEPLOY.md`: Cloudflare Pages and optional Nginx, rsync, and Certbot deployment.
- `docs/LAUNCH.md`: the full public launch checklist.
- `docs/QA.md`: current verification status and fresh measurement record.
- `AGENTS.md`, `DECISIONS.md`, `HUMAN_TODO.md`: working rules, chosen defaults, and facts requiring a real human answer.
- `work/`: ignored staging and intermediate files; never a place to commit secrets.

## Content, support, and privacy

Articles offer general education, not diagnosis, treatment, or personal care. Do not invent qualifications, statistics, studies, reviews, or contact details. Keep pending author information, verified crisis details, editorial process, legal review, newsletter setup, and real media links in `HUMAN_TODO.md`.

Four crisis-resource seed records come from the user brief and remain unverified. The support page publishes actionable phone details only for records verified by a human and dated accordingly; otherwise it offers the two global directories and general urgent-support guidance. Get Help and sensitive articles must have no ads or affiliate recommendations.

Newsletter forms post directly to a real provider endpoint with a honeypot. Provider-side double opt-in, exact field mapping, success/error handling, and unsubscribe need real testing. Never display simulated subscription success. Optional cookieless analytics load only when their environment values are configured; fonts and basic reading do not require third-party requests.

`features.media`, `features.affiliates`, and `adsEnabled` are false by default. The author fallback is “Editorial team,” with no claimed qualifications. Disabled or empty media creates no reader-facing route or dead navigation. Real media needs a description, usable fallback link, and transcripts where available. YouTube loads only after a reader chooses the facade. Ads and affiliate features remain off at launch.

## Implementation phases

The complete replacement brief supersedes the earlier incomplete attachment and defines phases 0–8: scaffold, design system, content model, pages, trust pages, SEO, features, QA, and deployment setup. Existing history is retained. Build, fix errors, and commit each completed phase; record defaults in `DECISIONS.md` without inventing human-owned facts.
