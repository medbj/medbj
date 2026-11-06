import { writeFileSync } from 'node:fs';
import { loadEnv } from 'vite';
const env = { ...loadEnv('production', process.cwd(), 'PUBLIC_'), ...process.env };
const scripts = ["'self'", "'wasm-unsafe-eval'"];
const connections = ["'self'"];
function origin(value) {
  if (!value) return null;
  const url = new URL(value);
  if (url.protocol !== 'https:' || url.username || url.password) throw new Error('Configured analytics and newsletter URLs must use HTTPS without credentials.');
  return url.origin;
}
if (env.PUBLIC_PLAUSIBLE_DOMAIN && env.PUBLIC_PLAUSIBLE_SCRIPT_URL) {
  const analyticsOrigin = origin(env.PUBLIC_PLAUSIBLE_SCRIPT_URL);
  scripts.push(analyticsOrigin); connections.push(analyticsOrigin);
} else if (env.PUBLIC_UMAMI_WEBSITE_ID && env.PUBLIC_UMAMI_SCRIPT_URL) {
  const analyticsOrigin = origin(env.PUBLIC_UMAMI_SCRIPT_URL);
  scripts.push(analyticsOrigin); connections.push(analyticsOrigin);
}
origin(env.PUBLIC_NEWSLETTER_ACTION_URL);
const csp = `default-src 'self'; script-src ${scripts.join(' ')}; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src ${connections.join(' ')}; frame-src https://www.youtube-nocookie.com; form-action https:; base-uri 'self'; object-src 'none'; frame-ancestors 'none'; upgrade-insecure-requests`;
writeFileSync('dist/_headers', `/*\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: strict-origin-when-cross-origin\n  Permissions-Policy: camera=(), microphone=(), geolocation=()\n  X-Frame-Options: DENY\n  Content-Security-Policy: ${csp}\n`);
console.log('Generated static security headers for the configured integrations.');
