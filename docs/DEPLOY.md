# Deploy the static site

The output is `dist/`: HTML, CSS, a small amount of client-side JavaScript, and the generated Pagefind search index. There is no database, application server, account system, or comment service. The newsletter submits directly to the selected provider.

## Prepare a release

1. Complete `HUMAN_TODO.md` and every checkbox in `docs/LAUNCH.md` for a public launch. Sample educational content, unverified crisis records, and draft legal text keep the public launch gate closed. A private review build can remain available while this work is pending.
2. Install a current Node.js LTS version supported by the installed Astro version. Use the same Node version locally and on the host.
3. Run `npm ci` using the committed lockfile.
4. Copy `.env.example` to `.env` locally, or configure the corresponding build-time variables on your host. Never commit credentials. Set `SITE_URL` to the final HTTPS origin, without a path, and check `src/site.config.ts` for the site name, tagline, and feature flags.
5. Set a genuine public newsletter action only when the provider is ready. Match email and honeypot names to that provider. Set `PUBLIC_NEWSLETTER_EMAIL_FIELD` and `PUBLIC_NEWSLETTER_HONEYPOT_FIELD` to the exact provider field names; their defaults do not establish compatibility. Some providers also require hidden fields: add them to the newsletter component from the provider's own instructions. Enable double opt-in in the provider dashboard, then test submission without JavaScript, confirmation, invalid addresses, and unsubscribe. An unconfigured newsletter must not imply that an address was stored. Set `PUBLIC_NEWSLETTER_DOUBLE_OPT_IN_CONFIRMED=true` only after a human completes a real signup and verifies provider-side double opt-in.
6. Leave analytics variables empty for no analytics. If analytics are desired, set both variables for one provider: `PUBLIC_PLAUSIBLE_DOMAIN` and `PUBLIC_PLAUSIBLE_SCRIPT_URL`, or `PUBLIC_UMAMI_WEBSITE_ID` and `PUBLIC_UMAMI_SCRIPT_URL`. Use the provider's official HTTPS script URL; confirm the actual privacy settings and update the privacy notice. These `PUBLIC_` values are visible in the built site.
7. Keep `features.media` false until real media and transcripts are ready. Keep `features.affiliates` and `adsEnabled` false for launch; the neutral author fallback is “Editorial team” without qualifications. Enabling it requires a new build. The route, navigation, and home teaser are omitted from a build when it is false.
8. Run:

   ```sh
   npm run check
   npm run lint
   npm run test:guards
   npm run build
   npm run check:site
   npm run check:launch
   ```

`npm run build` validates content and duplicate slugs, checks contrast, builds Astro, generates response headers, and indexes the result with Pagefind. Do not deploy the output of `astro build` alone: it does not run the complete project build pipeline. Environment variables for this static site are read at build time; changing them requires a new build and deployment.

`npm run check:launch` is a production-readiness gate, not a requirement for developing or privately reviewing samples. It must fail until all sample post and media records are removed or replaced, crisis records are human-verified with dates, legal placeholders are resolved, required site/newsletter variables are supplied, alt text is complete, and internal links work. Do not change flags or review dates merely to bypass it. Optional analytics are not required when disabled. A successful build alone does not establish public launch readiness.

After real legal review, replace the draft wording, resolve pending legal-review markers, and set `LEGAL_REVIEW_CONFIRMED=true` only to attest to that completed human work. Set `EDITORIAL_PROCESS_CONFIRMED=true` only after the real process is supplied and accurately described. Neither value conducts or proves a review. Leave them false while the operator, contacts, providers, retention, applicable rights process, or editorial responsibilities remain unknown.

## Cloudflare Pages (primary target)

1. Push the repository to your own Git provider, then create a Cloudflare Pages project using its Git integration.
2. Set the framework preset to Astro (or None with the commands below).
3. For the public production project, set the build command to `npm run build && npm run check:launch` and the output directory to `dist`. Use the repository root as the project root. A separate private review project may use `npm run build`; keep it private and clearly marked as a review copy while launch checks fail.
4. Pin a supported Node LTS version in the Pages build environment, matching local development. Configure `SITE_URL` and the public integration variables under build environment variables. Configure preview and production variables separately so previews do not send real newsletter subscriptions unintentionally.
5. After launch checks pass, deploy, then use Cloudflare's custom-domain flow for the final domain and complete DNS and HTTPS setup. Choose one canonical hostname and configure an HTTP redirect from its www or non-www alternative to that hostname.
6. Rebuild after setting the final domain. Check generated canonical URLs, RSS links, sitemap URLs, and `robots.txt` against that domain.

Alternatively, after a local build and a passing `npm run check:launch`, use Cloudflare's official Wrangler CLI with your own authenticated Cloudflare account:

```sh
npx wrangler pages deploy dist --project-name YOUR_PAGES_PROJECT
```

Replace `YOUR_PAGES_PROJECT` with the existing Pages project. This command publishes files; use it only when you intend to deploy. Do not put Cloudflare API tokens into public build variables or source files.

Cloudflare Pages can serve `404.html` as the custom not-found page. Confirm that an unknown path returns HTTP 404 rather than a successful page. Do not add a single-page-app fallback that rewrites every request to `/index.html`. Deploy the entire `dist/` tree, including `/pagefind/`.

The build includes a Cloudflare Pages `_headers` file. Keep it with the deployed output so the configured content security and privacy headers are applied. If you enable an external analytics script, check that its actual script and collection origins are allowed by the generated policy, then verify the browser console and network requests. Do not weaken the policy to allow every origin.

## Self-host on an Ubuntu VPS with Nginx

These steps assume an existing VPS, DNS you control, a non-root SSH user, and a dedicated web root. Replace the example domain, SSH host, username, and paths; the example values are placeholders. Firewall changes and server administration remain the operator's responsibility.

### Provision the web root

On the server, install the required packages:

```sh
sudo apt update
sudo apt install nginx certbot python3-certbot-nginx rsync
```

Create `/var/www/psychology-blog`, owned by the non-root deployment user, with permissions that let Nginx read the files. Do not use a shared directory for this site. Allow inbound HTTP and HTTPS through your provider firewall and host firewall as appropriate.

Copy `deploy/nginx.conf` to `/etc/nginx/sites-available/psychology-blog`. Edit `server_name` and `root`. Enable it with a symlink in `sites-enabled`, and remove a conflicting default vhost only if it is safe for the other sites on that server. Validate before reloading:

```sh
sudo nginx -t
sudo systemctl reload nginx
```

The supplied configuration serves normal static paths, uses the custom 404 page, and caches only asset locations. It does not assume a JavaScript application router. Consider access-log retention and whether full request paths could reveal sensitive reading interests; disclose and minimize logs according to your operating requirements.

Nginx does not interpret Cloudflare's `_headers` file. The example Nginx configuration sets basic response headers directly. To apply the site's Content-Security-Policy too, copy the generated policy from `dist/_headers` into an `add_header Content-Security-Policy "..." always;` directive in the Nginx server block, preserving the exact origins needed by the configured build. Recheck it when newsletter, analytics, or media settings change, and run `nginx -t` before reloading.

### Build and copy from your computer

Set up SSH key authentication and verify the host fingerprint through a trusted channel. The deployment script uses existing SSH configuration and does not disable host-key checking. A supported `rsync` and `ssh` must be available on both sides.

Preview the proposed copy:

```sh
TARGET_HOST=YOUR_HOST TARGET_USER=YOUR_USER TARGET_PATH=/var/www/psychology-blog \
  ./deploy/deploy.sh --dry-run
```

The deployment script runs `npm run build`, `npm run check:site`, and `npm run check:launch` before contacting the destination, including on a dry run. A failed gate stops the transfer. For a public VPS release, complete the human launch work, then publish with the same command without `--dry-run`:

```sh
TARGET_HOST=YOUR_HOST TARGET_USER=YOUR_USER TARGET_PATH=/var/www/psychology-blog \
  ./deploy/deploy.sh
```

For an access-controlled private review destination only, the operator may explicitly set `ALLOW_PREVIEW_DEPLOY=1`. This attests that the target is a private preview and skips only `check:launch`; content, build, and generated-site checks still run. The script cannot confirm your server's access controls. Do not use the override for public publication. For example:

```sh
ALLOW_PREVIEW_DEPLOY=1 TARGET_HOST=YOUR_PRIVATE_HOST TARGET_USER=YOUR_USER \
  TARGET_PATH=/var/www/private-review ./deploy/deploy.sh --dry-run
```

The script builds and checks first, validates the destination, and copies `dist/` using rsync. It will not create remote directories or run privileged remote commands. Files removed from the source are **kept on the server by default**. This can retain a removed article or a previously enabled media route. Review and remove obsolete files deliberately, or use the following explicit deletion option only after confirming that the destination contains this site alone:

```sh
DEPLOY_DELETE=1 TARGET_HOST=YOUR_HOST TARGET_USER=YOUR_USER \
  TARGET_PATH=/var/www/psychology-blog ./deploy/deploy.sh --dry-run
```

Inspect the deletion list before repeating without `--dry-run`. `DEPLOY_DELETE=1` synchronizes deletions within the destination. Keep a backup or previous release if you need rollback. For busy production sites, use versioned release directories and an atomic symlink switch under an operator-managed release process instead of copying in place.

### Enable HTTPS with Certbot

Point the domain's DNS to the VPS first and confirm HTTP is reachable. Then, on the server, request certificates for the real domain names you serve:

```sh
sudo certbot --nginx -d example.com -d www.example.com
sudo certbot renew --dry-run
```

Choose the HTTP-to-HTTPS redirect when prompted. Use only domains you control; replace the examples before running. Check the platform's Certbot renewal timer and confirm successful renewal monitoring. Run `sudo nginx -t` after configuration changes. Enable HSTS only after HTTPS and renewal work reliably for every affected hostname.

## Release verification

Follow `docs/LAUNCH.md` as well as these deployment checks. Keep private review copies private when human launch work remains.

- Open the production homepage, an article, all topic hubs, and a made-up URL.
- Confirm the header's Get Help link remains available on a phone.
- Search for a real article phrase and test a query with no results. Pagefind needs HTTP(S), so do not test by double-clicking HTML files.
- Test pagination and topic filtering, keyboard focus, and the newsletter's real provider flow.
- Confirm `/rss.xml`, `/sitemap-index.xml`, and `/robots.txt` use the intended origin.
- With media disabled, confirm `/listen-and-watch` returns 404 and no navigation or teaser links to it remain.
- With media enabled and genuine content added, confirm no YouTube request occurs before clicking the video facade.
- If analytics are off, confirm no analytics scripts are requested. If enabled, inspect the network requests and privacy notice.
- Confirm the www/non-www alternative redirects to the chosen canonical HTTPS hostname.
- Check one article's canonical and structured data with the Rich Results Test, and inspect its social share image and text. This does not establish clinical credibility.
- Submit the sitemap to Google Search Console and Bing Webmaster Tools using the owner's verified accounts.
- Record fresh results in `docs/QA.md`. Record mobile Lighthouse results for Performance, Accessibility, SEO, and Best Practices against the 90+ checklist target; also record 375px/1280px, keyboard, zoom, and screen-reader checks.
- Confirm at least eight real articles have been written and reviewed, and that a publishing and re-review cadence has an owner.
- Record the release commit and preserve a copy of the previous static release for rollback. Keep deployment credentials and other secrets outside the repository.
