# Decisions

- The uploaded brief ends mid-sentence and has no implementation-plan section; use three phases: foundation, complete reading experience, verification and delivery.
- Use the attached /workspace/medbj repository and retain its existing Git history.
- Keep Psychology Blog as the working brand, Arial as the only font, and the exact requested eight color tokens.
- Ship original educational sample articles clearly labeled for editorial review; no claimed clinician credentials or clinical review.
- Keep media disabled at launch until real platform links and transcripts are supplied; retain two marked sample items and a fully gated route.
- Leave newsletter submission unavailable until a real provider endpoint is configured; never report a simulated subscription.
- Use the private Sites preview origin as the default canonical URL in site.config.ts; SITE_URL overrides it for Cloudflare Pages or a confirmed custom domain.
- Do not publish unverified crisis phone numbers; provide general emergency guidance and a link to an external country directory.
- Treat pale borders as decorative; use teal control outlines and focus rings for the 3:1 non-text contrast requirement.
- Store enhanced search state in the URL fragment so terms are not sent in HTTP requests; accept and clear legacy query strings.
- Automatic approval review blocked source export to Sites; keep the completed site local and the new Sites project private/unpublished until explicit upload approval is given.
