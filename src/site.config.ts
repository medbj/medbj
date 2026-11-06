export const site = {
  name: 'MENA Psychology',
  tagline: 'A little understanding. A little more ease.',
  description:
    'Clear, thoughtful reads on psychology and everyday wellbeing. Find a starting point, explore a feeling, and take things at your own pace.',
  url:
    import.meta.env?.SITE_URL ||
    'https://psychology-reading-room.bejjajimohammed1.chatgpt.site',
  lang: 'en',
  features: { media: false, affiliates: false },
  adsEnabled: false,
  author: { name: 'Editorial team', bio: '' },
  legalReviewed: import.meta.env?.LEGAL_REVIEW_CONFIRMED === 'true',
  editorialProcessConfirmed:
    import.meta.env?.EDITORIAL_PROCESS_CONFIRMED === 'true',
  newsletter: {
    doubleOptInConfirmed:
      import.meta.env?.PUBLIC_NEWSLETTER_DOUBLE_OPT_IN_CONFIRMED === 'true',
    action: import.meta.env?.PUBLIC_NEWSLETTER_ACTION_URL || '',
    emailField: import.meta.env?.PUBLIC_NEWSLETTER_EMAIL_FIELD || 'email',
    honeypotField:
      import.meta.env?.PUBLIC_NEWSLETTER_HONEYPOT_FIELD || 'website',
  },
} as const;
