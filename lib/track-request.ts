import 'server-only';
import { cookies, headers } from 'next/headers';
import { isAdmin } from '@/lib/auth';

/** Cookie with the anonymous visitor id, written by the tracker on the page. */
export const VISITOR_COOKIE = 'pgt_v';

const BOT = /bot|crawl|spider|slurp|facebookexternalhit|whatsapp|telegram|preview|headless|lighthouse|pagespeed|vercel|monitor|curl|wget|python|axios|node-fetch/i;

/**
 * Who is behind this request, for analytics. Returns null for bots and for the logged-in admin,
 * so neither inflates the numbers.
 */
export async function requestContext() {
  const h = await headers();
  const ua = h.get('user-agent') ?? '';
  if (!ua || BOT.test(ua)) return null;
  if (await isAdmin()) return null;
  const country = h.get('x-vercel-ip-country') ?? undefined;
  const visitor = (await cookies()).get(VISITOR_COOKIE)?.value;
  const device = /ipad|tablet/i.test(ua) ? 'tablet' : /mobi|android|iphone/i.test(ua) ? 'celular' : 'computador';
  return { country, visitor, device };
}
