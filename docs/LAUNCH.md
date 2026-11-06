# Public launch checklist

The site can build for private review while launch checks fail. Do not mark human review complete or remove sample, legal-review, or crisis-verification safeguards merely to make a command pass. `docs/QA.md` records fresh engineering checks on the current implementation; `docs/VALIDATION.md` is an earlier-build record; it does not establish editorial, clinical, or legal approval.

- [ ] Final site name, domain, tagline, and social links in site.config.ts
- [ ] Real author name and bio (or "Editorial team") set
- [ ] All sample content removed or replaced; `npm run check:launch` passes
- [ ] Crisis resources verified by a human, with `lastVerified` dates
- [ ] Privacy Policy, Terms, and Medical Disclaimer reviewed (legal review done)
- [ ] Newsletter provider connected, test signup confirmed, double opt-in on
- [ ] Listen & Watch: real podcast/YouTube links added and `features.media` set to true, or left false
- [ ] Domain connected, HTTPS on, www/non-www redirect set
- [ ] Sitemap submitted to Google Search Console and Bing Webmaster Tools
- [ ] Canonical tags and structured data checked on one article (Rich Results Test)
- [ ] Lighthouse mobile: Performance, Accessibility, SEO, Best Practices all 90+
- [ ] Contrast check passes; keyboard-only walkthrough done
- [ ] 404 page and RSS feed work
- [ ] Social share previews checked for one article
- [ ] At least 8 real articles written and reviewed, publishing cadence decided
- [ ] Repo pushed to a remote; secrets kept outside the repo

The launch attestations `PUBLIC_NEWSLETTER_DOUBLE_OPT_IN_CONFIRMED`, `LEGAL_REVIEW_CONFIRMED`, and `EDITORIAL_PROCESS_CONFIRMED` stay false until the corresponding human work is complete. Setting a value to true does not perform a review or turn sample content into reviewed work.
