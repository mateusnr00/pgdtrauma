import 'server-only';
import { unstable_cache } from 'next/cache';
import { d1, d1Ready } from '@/lib/d1';

/**
 * Private settings kept in Cloudflare D1 (never in the public content store): the Meta Pixel
 * and the Conversions API token. The token is only ever read on the server.
 */

export const TRACKING_TAG = 'tracking-settings';

export type Tracking = { pixelId: string; capiToken: string; testCode: string };
const EMPTY: Tracking = { pixelId: '', capiToken: '', testCode: '' };
const KEYS = { pixelId: 'meta.pixelId', capiToken: 'meta.capiToken', testCode: 'meta.testCode' } as const;

const g = globalThis as unknown as { __pgtSettings?: Promise<unknown> };
async function ready() {
  g.__pgtSettings ??= d1('create table if not exists settings (key text primary key, value text not null, updated_at integer not null)').catch((e) => {
    g.__pgtSettings = undefined;
    throw e;
  });
  await g.__pgtSettings;
}

export async function readTracking(): Promise<Tracking> {
  if (!d1Ready()) return EMPTY;
  try {
    await ready();
    const rows = await d1(`select key, value from settings where key like 'meta.%'`);
    const map = new Map(rows.map((r) => [String(r.key), String(r.value ?? '')]));
    return { pixelId: map.get(KEYS.pixelId) ?? '', capiToken: map.get(KEYS.capiToken) ?? '', testCode: map.get(KEYS.testCode) ?? '' };
  } catch (error) {
    console.error('[settings] read failed:', error);
    return EMPTY;
  }
}

/** Cached for every request to the site and to the tracking endpoints; cleared when the admin saves. */
export const getTracking = unstable_cache(readTracking, ['tracking-settings', 'v1'], { tags: [TRACKING_TAG], revalidate: 3600 });

export async function writeTracking(values: Partial<Tracking>) {
  await ready();
  for (const [field, value] of Object.entries(values) as [keyof Tracking, string | undefined][]) {
    if (value === undefined) continue;
    if (value === '') await d1('delete from settings where key = ?', [KEYS[field]]);
    else
      await d1('insert into settings (key, value, updated_at) values (?, ?, ?) on conflict(key) do update set value = excluded.value, updated_at = excluded.updated_at', [
        KEYS[field],
        value,
        Date.now(),
      ]);
  }
}
