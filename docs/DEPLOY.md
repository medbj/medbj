# Deploy the static site

The output is `dist/`: HTML, CSS, a small amount of client-side JavaScript, and the generated Pagefind search index. There is no database, application server, account system, or comment service. The newsletter submits directly to the selected provider.

## Prepare a release

1. Complete the relevant items in `HUMAN_TODO.md`. Sample educational content and draft legal text require human review before public launch.
2. Install a current Node.js LTS version supported by the installed Astro version. Use the same Node version locally and on the host.
3. Run `npm ci` using the committed lockfile.
4. Copy `.env.example` to `.env` locally, or configure the corresponding build-time variables on your host. Never commit credentials. Set `SITE_URL` to the final HTTPS origin, without a path, and check `src/site.config.ts` for the site name, tagline, and feature flags.
5. Set a genuine public newsletter action only when the provider is ready. Match email and honeypot names to that provider. Some providers also require hidden fields: add them to the newsletter component from the provider's own instructions. Enable double opt-in in the provider dashboard, then test submission without JavaScript, confirmation, invalid addresses, and unsubscribe. An unconfigured newsletter must not imply that an address was stored.
6. Leave analytics variables empty for no analytics. If analytics are desired, set both variables for one provider: `PUBLIC_PLAUSIBLE_DOMAIN` and `PUBLIC_PLAUSIBLE_SCRIPT_URL`, or `PUBLIC_UMAMI_WEBSITE_ID` and `PUBLIC_UMAMI_SCRIPT_URL`. Use the provider's official HTTPS script URL; confirm the actual privacy settings and update the privacy notice. These `PUBLIC_` values are visible in the built site.
7. Keep `features.media` false until real media and transcripts are ready. Enabling it requires a new build. The route, navigation, and home teaser are omitted from a build when it is false.
8. Run:

   ```sh
   npm run check
   npm run lint
   npm run build
   npm run check:site
   ```

`npm run build` checks contrast, builds Astro, and indexes the result with Pagefind. Do not deploy the output of `astro build` alone: it does not run the complete project build pipeline. Environment variables for this static site are read at build time; changing them requires a new build and deployment.

## Cloudflare Pages (primary target)

1. Push the repository to your own Git provider, then create a Cloudflare Pages project using its Git integration.
2. Set the framework preset to Astro (or None with the commands below).
3. Set the build command to `npm run build` and the output directory to `dist`. Use the repository root as the project root.
4. Pin a supported Node LTS version in the Pages build environment, matching local development. Configure `SITE_URL` and the public integration variables under build environment variables. Configure preview and production variables separately so previews do not send real newsletter subscriptions unintentionally.
5. Deploy, then use Cloudflare's custom-domain flow for the final domain and complete its DNS and HTTPS setup.
6. Rebuild after setting the final domain. Check generated canonical URLs, RSS links, sitemap URLs, and `robots.txt` against that domain.

Alternatively, after a local build, use Cloudflare's official Wrangler CLI with your own authenticated Cloudflare account:

```sh
npx wrangler pages deploy dist --project-name YOUR_PAGES_PROJECT
```

Replace `YOUR_PAGES_PROJECT` with the existing Pages project. This command publishes files; use it only when you intend to deploy. Do not put Cloudflare API tokens into public build variables or source files.

Cloudflare Pages can serve `404.html` as the custom not-found page. Confirm that an unknown path returns HTTP 404 rather than a successful page. Do not add a single-page-app fallback that rewrites every request to `/index.html`. Deploy the entire `dist/` tree, including `/pagefind/`.

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

### Build and copy from your computer

Set up SSH key authentication and verify the host fingerprint through a trusted channel. The deployment script uses existing SSH configuration and does not disable host-key checking. A supported `rsync` and `ssh` must be available on both sides.

Preview the proposed copy:

```sh
TARGET_HOST=YOUR_HOST TARGET_USER=YOUR_USER TARGET_PATH=/var/www/psychology-blog \
  ./deploy/deploy.sh --dry-run
```

Publish with the same command without `--dry-run`:

```sh
TARGET_HOST=YOUR_HOST TARGET_USER=YOUR_USER TARGET_PATH=/var/www/psychology-blog \
  ./deploy/deploy.sh
```

The script builds first, validates the destination, and copies `dist/` using rsync. It will not create remote directories or run privileged remote commands. Files removed from the source are **kept on the server by default**. This can retain a removed article or a previously enabled media route. Review and remove obsolete files deliberately, or use the following explicit deletion option only after confirming that the destination contains this site alone:

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

- Open the production homepage, an article, all topic hubs, and a made-up URL.
- Confirm the header's Get Help link remains available on a phone.
- Search for a real article phrase and test a query with no results. Pagefind needs HTTP(S), so do not test by double-clicking HTML files.
- Test pagination and topic filtering, keyboard focus, and the newsletter's real provider flow.
- Confirm `/rss.xml`, `/sitemap-index.xml`, and `/robots.txt` use the intended origin.
- With media disabled, confirm `/listen-and-watch` returns 404 and no navigation or teaser links to it remain.
- With media enabled and genuine content added, confirm no YouTube request occurs before clicking the video facade.
- If analytics are off, confirm no analytics scripts are requested. If enabled, inspect the network requests and privacy notice.
- Record the release commit and preserve a copy of the previous static release for rollback.
