/** Cookie consent, shared by the page (client) and the tracking routes (server). */
export const CONSENT_COOKIE = 'pgt_consent';
export type Consent = 'all' | 'essential';
export const CONSENT_EVENT = 'pgt:consent';
export const CONSENT_OPEN_EVENT = 'pgt:consent-open';

/** Reads the choice from a Cookie header or document.cookie. */
export function consentFrom(cookieString: string | null | undefined): Consent | null {
  const value = (cookieString ?? '').match(new RegExp(`(?:^|; )${CONSENT_COOKIE}=([^;]+)`))?.[1];
  return value === 'all' || value === 'essential' ? value : null;
}
