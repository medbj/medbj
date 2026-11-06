# MENA Psychology

An Astro blog that builds to plain static files. The existing design, pages, navigation, original MDX source, and optional podcast/YouTube support are retained. Publishing needs one Markdown file; there is no database, server runtime, login, or admin panel.

1. **Run locally.** Use Node.js 24 LTS and the committed lockfile:

   ```sh
   npm ci
   npm run dev
   ```

2. **Add an article.** Copy `docs/post-template.md` to `src/content/posts/my-new-article.md`. Fill `title`, `description` (maximum 160 characters), `date` (`YYYY-MM-DD`), and `category`, then write normal Markdown below the front matter. The filename creates `/blog/my-new-article/`. Categories, tags, links, reading time, and metadata are automatic. See [docs/WRITING.md](docs/WRITING.md) for optional fields, images, French, and Arabic.

3. **Control publication.** Use `draft: true` to exclude a post from every public surface. Set `draft: false` or omit the field to publish. The blank template starts as a draft. Restart the dev server after changing draft status; every production build reads the current files. Edit `.md` posts; the original `.mdx` files are retained but inactive.

4. **Build and preview.** Replace `https://YOUR-DOMAIN.com` in `src/site.config.ts` with your final HTTPS domain; confirm `site.author` there too. Then run:

   ```sh
   npm run build
   npm run preview
   ```

   The build writes `dist/`, including search, `sitemap.xml`, `rss.xml`, `robots.txt`, and favicons. Optional verification commands are `npm run check`, `npm run check:site`, and `npm run test:guards`.

5. **Upload.** Copy **all contents of `dist/`** to your server's public document root, preserving folders such as `_astro/` and `pagefind/`. Configure your static host to serve `404.html` for unknown paths. Uploading source, `node_modules`, environment files, or a Node server is unnecessary. See [docs/DEPLOY.md](docs/DEPLOY.md) for hosting examples.

No analytics or advertising script runs. A clearly marked comment in `src/layouts/Base.astro` provides one place for scripts you may choose to add later. The optional media feature keeps its existing behavior and configuration.

Existing sample articles, legal drafts, unverified support resources, and real provider settings still require the human work in [HUMAN_TODO.md](HUMAN_TODO.md) before public launch. The separate `npm run check:launch` gate records those requirements; normal static builds work for review.
