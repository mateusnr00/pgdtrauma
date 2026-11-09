import { after } from 'next/server';
import { site } from '@/content/book';
import { record } from '@/lib/analytics';
import { BASE_PATH } from '@/lib/base-path';
import { getContent } from '@/lib/content-store';
import { requestContext } from '@/lib/track-request';
import { metaContextFrom, sendMetaEvent } from '@/lib/meta';

/**
 * Every "Adquirir livro" button points here (?de=topo|menu|final|…). The click is counted and the
 * visitor is sent to the purchase link set in the admin, so the destination can change at any time
 * without touching the buttons, and clicks are counted even without JavaScript.
 */
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const from = (url.searchParams.get('de') ?? '').replace(/[^a-z0-9-]/gi, '').slice(0, 30) || 'outro';
  const { meta } = await getContent();
  const target = meta.purchaseUrl || site.purchaseUrl;

  const ctx = await requestContext();
  if (ctx) {
    const eventId = (url.searchParams.get('eid') ?? '').replace(/[^a-z0-9-]/gi, '').slice(0, 64);
    const page = request.headers.get('referer') ?? undefined;
    const metaCtx = metaContextFrom(request, { eventId: eventId || undefined, url: page, externalId: ctx.visitor });
    after(() => sendMetaEvent('InitiateCheckout', metaCtx).catch((error) => console.error('meta:', error)));
    after(() =>
      record({
        type: 'purchase',
        name: from,
        path: url.pathname,
        visitor: ctx.visitor,
        referrer: request.headers.get('referer') ?? undefined,
        device: ctx.device,
        country: ctx.country,
      }).catch((error) => console.error('analytics:', error)),
    );
  }

  const destination = /^https?:\/\//i.test(target) ? target : new URL(`${BASE_PATH}#adquirir`, url.origin).toString();
  return new Response(null, {
    status: 302,
    headers: { Location: destination, 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' },
  });
}
