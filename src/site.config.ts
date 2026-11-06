export const site = {
  name: 'Psychology Blog',
  tagline: 'A little understanding. A little more ease.',
  description: 'Clear, thoughtful reads on psychology and everyday wellbeing. Find a starting point, explore a feeling, and take things at your own pace.',
  url: import.meta.env?.SITE_URL || 'https://psychology-reading-room.bejjajimohammed1.chatgpt.site',
  lang: 'en',
  features: { media: false },
  newsletter: {
    action: import.meta.env?.PUBLIC_NEWSLETTER_ACTION_URL || '',
    emailField: import.meta.env?.PUBLIC_NEWSLETTER_EMAIL_FIELD || 'email',
    honeypotField: import.meta.env?.PUBLIC_NEWSLETTER_HONEYPOT_FIELD || 'website',
  },
} as const;
