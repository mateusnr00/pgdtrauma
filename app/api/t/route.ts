import { after } from 'next/server';
import { analyticsReady, EVENT_TYPES, record, type EventType } from '@/lib/analytics';
import { requestContext } from '@/lib/track-request';

/**
 * Collects page views, sections reached and clicks sent by components/Analytics.tsx
 * (navigator.sendBeacon, so the body arrives as text). Purchase clicks are recorded by /comprar.
 */
const ALLOWED: EventType[] = EVENT_TYPES.filter((t) => t !== 'purchase');

export async function POST(request: Request) {
  if (!analyticsReady()) return new Response(null, { status: 204 });
  const text = await request.text();
  if (text.length > 4000) return new Response(null, { status: 413 });

  let body: Record<string, unknown>;
  try {
    body = JSON.parse(text);
  } catch {
    return new Response(null, { status: 400 });
  }
  const events = (Array.isArray(body.events) ? body.events : [body]).slice(0, 20) as Record<string, unknown>[];

  const ctx = await requestContext();
  if (!ctx) return new Response(null, { status: 204 });

  const str = (v: unknown) => (typeof v === 'string' ? v : undefined);
  after(async () => {
    for (const e of events) {
      const type = e.type as EventType;
      if (!ALLOWED.includes(type)) continue;
      await record({
        type,
        name: str(e.name),
        path: str(body.path ?? e.path),
        visitor: str(body.visitor) ?? ctx.visitor,
        session: str(body.session),
        referrer: str(body.referrer),
        source: str(body.source),
        medium: str(body.medium),
        campaign: str(body.campaign),
        device: ctx.device,
        country: ctx.country,
      }).catch((error) => console.error('analytics:', error));
    }
  });
  return new Response(null, { status: 204 });
}
