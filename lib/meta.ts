import 'server-only';
import { createHash } from 'node:crypto';
import { getTracking, readTracking } from '@/lib/settings';

/**
 * Meta Conversions API: the server-side twin of each Pixel event. Both carry the same event_id,
 * so Meta counts each action once even when the browser blocks the Pixel.
 */

const GRAPH = 'https://graph.facebook.com/v21.0';

export type MetaEventName = 'PageView' | 'ViewContent' | 'InitiateCheckout';

export type MetaContext = {
  eventId?: string;
  url?: string;
  ip?: string;
  userAgent?: string;
  fbp?: string;
  fbc?: string;
  externalId?: string;
};

const sha256 = (v: string) => createHash('sha256').update(v.trim().toLowerCase()).digest('hex');

function payload(name: MetaEventName, ctx: MetaContext) {
  const user_data: Record<string, unknown> = {};
  if (ctx.ip) user_data.client_ip_address = ctx.ip;
  if (ctx.userAgent) user_data.client_user_agent = ctx.userAgent;
  if (ctx.fbp) user_data.fbp = ctx.fbp;
  if (ctx.fbc) user_data.fbc = ctx.fbc;
  if (ctx.externalId) user_data.external_id = [sha256(ctx.externalId)];
  return {
    event_name: name,
    event_time: Math.floor(Date.now() / 1000),
    action_source: 'website',
    ...(ctx.eventId ? { event_id: ctx.eventId } : {}),
    ...(ctx.url ? { event_source_url: ctx.url } : {}),
    user_data,
    ...(name === 'InitiateCheckout' || name === 'ViewContent'
      ? { custom_data: { content_name: 'Princípios Gerais da Traumatologia', content_type: 'product', content_category: 'Livro' } }
      : {}),
  };
}

async function post(pixelId: string, token: string, testCode: string, data: unknown[]) {
  const res = await fetch(`${GRAPH}/${pixelId}/events?access_token=${encodeURIComponent(token)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ data, ...(testCode ? { test_event_code: testCode } : {}) }),
    cache: 'no-store',
  }).catch(() => {
    throw new Error('não foi possível conectar com a Meta agora. Tente de novo em instantes.');
  });
  const body = (await res.json().catch(() => ({}))) as { events_received?: number; error?: { message?: string; error_user_msg?: string } };
  if (!res.ok || body.error) throw new Error(body.error?.error_user_msg || body.error?.message || `HTTP ${res.status}`);
  return body.events_received ?? 0;
}

/** Sends one event if the Pixel and the token are configured; otherwise does nothing. */
export async function sendMetaEvent(name: MetaEventName, ctx: MetaContext) {
  const { pixelId, capiToken, testCode } = await getTracking();
  if (!pixelId || !capiToken) return;
  await post(pixelId, capiToken, testCode, [payload(name, ctx)]);
}

/** Used by the admin's "Enviar evento de teste" button: always reads the latest saved settings. */
export async function sendMetaTest(ctx: MetaContext) {
  const { pixelId, capiToken, testCode } = await readTracking();
  if (!pixelId) throw new Error('Informe o ID do Pixel.');
  if (!capiToken) throw new Error('Informe o token da API de Conversões.');
  const received = await post(pixelId, capiToken, testCode, [payload('PageView', { ...ctx, eventId: `teste-${Date.now()}` })]);
  return { received, testCode };
}

/** Request details Meta uses to match the visitor (IP, browser, its own cookies). */
export function metaContextFrom(request: Request, extra: Partial<MetaContext> = {}): MetaContext {
  const cookie = request.headers.get('cookie') ?? '';
  const read = (name: string) => cookie.match(new RegExp(`(?:^|; )${name}=([^;]+)`))?.[1];
  return {
    ip: (request.headers.get('x-forwarded-for') ?? '').split(',')[0].trim() || undefined,
    userAgent: request.headers.get('user-agent') ?? undefined,
    fbp: read('_fbp'),
    fbc: read('_fbc'),
    ...extra,
  };
}
