# Human review before a public launch

The working title is Psychology Blog. Educational articles and media entries are samples. This checklist records information that must come from a real person; it is not evidence of clinical, legal, or professional review.

- [ ] Choose the final site name, tagline, and canonical domain; update `src/site.config.ts`, `SITE_URL`, and hosting configuration.
- [ ] Identify the responsible author and site operator. Supply an accurate bio, contact method, and any credentials that can be verified. Do not imply clinical credentials or review that has not happened.
- [ ] Have a suitable human editor review every sample article, reference, takeaway, and reading path for accuracy, accessibility, tone, and suitability for the intended audience. Verify all reference destinations and publication/update dates.
- [ ] Review the Get Help page. Independently verify any country-specific crisis phone/text numbers and availability against official local sources before adding them. Record verification dates and an owner for future checks. The site must not imply that it offers emergency care or monitors messages.
- [ ] Choose a newsletter provider and add its public form action to `PUBLIC_NEWSLETTER_ACTION_URL`. Match its email and honeypot field names, any mandatory hidden fields, and consent requirements. Enable and test provider-side double opt-in, confirmation, unsubscribe, error handling, and keyboard-only submission without JavaScript. Do not put API keys in public environment variables.
- [ ] Supply a real contact channel and response expectations. Do not ask readers to send sensitive health information through ordinary email or a general contact form.
- [ ] Have the privacy, terms, disclaimer, editorial policy, newsletter consent, analytics configuration, and accessibility statement reviewed for the operator's jurisdiction and worldwide audience. Current copy is a starting point, not legal advice or a claim of certification.
- [ ] Decide whether to enable cookieless analytics. Verify the provider's actual processing, retention, location, and privacy settings; update the privacy notice before enabling it. Check host logs and retention too.
- [ ] Supply genuine podcast and YouTube links, descriptions, publication dates, duration, rights-cleared thumbnail assets, and accessible transcripts. Replace or remove both marked sample media entries. Leave `features.media` disabled until ready.
- [ ] Confirm that YouTube is loaded only after explicit interaction and explain third-party processing before the reader chooses to load a video.
- [ ] Test the final production domain on a phone, a slow connection, a keyboard, and a screen reader. Check search, pagination, topic filters, newsletter submission, support links, RSS, sitemap, canonical URLs, and the 404 page.
- [ ] Select the production host, configure HTTPS and domain DNS, and decide access, backups, update ownership, and security-patch responsibility. A private review deployment is separate from a public launch.
