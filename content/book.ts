/**
 * Deployment configuration. Everything visible on the page lives in the editable content
 * (content/defaults.ts, edited through /admin).
 */
export const site = {
  /** Public URL, used for canonical, Open Graph and JSON-LD. Set NEXT_PUBLIC_SITE_URL in production. */
  url: process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000',
  /** Fallback checkout link when none is set in the admin. */
  purchaseUrl: process.env.NEXT_PUBLIC_PURCHASE_URL || '',
  locale: 'pt_BR',
};
