import { after } from 'next/server';
import { analyticsReady, EVENT_TYPES, record, type EventType } from '@/lib/analytics';
import { requestContext } from '@/lib/track-request';
import { metaContextFrom, sendMetaEvent, type MetaEventName } from '@/lib/meta';

/**
 * Collects page views, sections reached and clicks sent by components/Analytics.tsx
 * (navigator.sendBeacon, so the body arrives as text). Purchase clicks are recorded by /comprar.
 */
const ALLOWED: EventType[] = EVENT_TYPES.filter((t) => t !== 'purchase');

export async function POST(request: Request) {
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
  const valid = events
    .filter((e) => ALLOWED.includes(e.type as EventType))
    .map((e) => ({
      type: e.type as EventType,
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
    }));
  if (valid.length && analyticsReady()) after(() => record(valid).catch((error) => console.error('analytics:', error)));

  // Server-side twin of the Pixel events (Meta Conversions API), deduplicated by event id.
  const meta: { name: MetaEventName; eventId: string }[] = [];
  for (const e of events) {
    const eventId = str(e.eid);
    if (!eventId) continue;
    if (e.type === 'view') meta.push({ name: 'PageView', eventId });
    if (e.type === 'section' && e.name === 'conteudo') meta.push({ name: 'ViewContent', eventId });
  }
  if (meta.length) {
    const page = str(body.url);
    const metaCtx = metaContextFrom(request, { url: page, externalId: str(body.visitor) ?? ctx.visitor });
    after(async () => {
      for (const m of meta) await sendMetaEvent(m.name, { ...metaCtx, eventId: m.eventId }).catch((error) => console.error('meta:', error));
    });
  }
  return new Response(null, { status: 204 });
}
