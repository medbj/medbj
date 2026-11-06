# Psychology Blog contributor guide

## Commands
- `npm ci`: install locked dependencies (Node 22 recommended).
- `npm run dev`: local Astro server.
- `npm run build`: token contrast gate, static Astro output, then Pagefind index.
- `npm run check`: strict Astro and TypeScript validation.
- `npm run lint`: ESLint.
- `npm run format` / `npm run format:check`: Prettier with Astro support.
- `npm run check:site`: verify built routes, links, metadata, search, media gating, and content contracts.
- `npm run preview`: serve the complete built site, including Pagefind.

## Layout
- `src/site.config.ts`: brand, canonical origin, language, feature flags, and newsletter settings.
- `src/content/`: MDX articles and YAML media, validated in `src/content.config.ts`.
- `src/components/`, `src/layouts/`: reusable static Astro UI.
- `src/pages/`: static routes and feeds.
- `src/styles/`: tokens and plain responsive CSS.
- `src/lib/`: topics, reading paths, and content helpers.
- `scripts/`: contrast and built-site validation.
- `public/`: local static assets and headers.
- `deploy/`, `docs/DEPLOY.md`: Cloudflare Pages and optional nginx/rsync deployment.
- `work/`: ignored scratch files; never commit secrets.

## Working rules
- Work in phases. At each phase run `npm run build`, fix failures, commit with a clear message, and give a short summary.
- Do not ask the owner questions about ambiguities; choose sensible defaults and record one line each in DECISIONS.md.
- Never invent author credentials, statistics, studies, or clinical claims. Put author biography, editorial and legal review, verified crisis numbers, newsletter endpoint, domain, and podcast/YouTube URLs in HUMAN_TODO.md.
- Static Astro + strict TypeScript + MDX + Zod content collections. No backend, database, accounts, comments, UI framework, or Tailwind.
- Arial, "Liberation Sans", Helvetica, sans-serif only. Plain CSS with logical properties and only colors from tokens.css. Light theme, reduced-motion support, underlined prose links, 44px controls, 3px teal focus rings.
- Mobile first, 18px body, 1.7 line height, roughly 70-character prose, 30px mobile and 36–40px desktop H1.
- Header: Articles, Topics, optional Listen & Watch, About, Get Help; plus search. Get Help always one click away.
- All articles need takeaways, author, published and updated dates, references, disclaimer, related reading, and topic link. Use short plain-English sentences and lang fields.
- Gate the media route, links, and home teaser with features.media; YouTube embeds load only on click and use youtube-nocookie.com. Label samples.
- Use Pagefind locally after build; do not add remote search services. Newsletter posts plain HTML to the configured provider with a honeypot and provider double opt-in. Never fake success.
- Load optional cookieless analytics only when explicitly configured through env. Do not load third-party fonts or scripts by default.
- Maintain RSS, sitemap, robots, noindex 404, all legal/support pages, and deployment documentation.
- Test actual interactive flows and mobile widths. Do not claim clinical, legal, accessibility, or external-link verification that has not happened.
