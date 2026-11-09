import 'server-only';
import { get, list, put } from '@vercel/blob';
import { unstable_cache } from 'next/cache';
import { defaultContent } from '@/content/defaults';
import { BASE_PATH, withBase } from '@/lib/base-path';
import type { SiteContent } from '@/content/schema';

const CURRENT = 'content/site.json';
const HISTORY = 'content/history/';
export const CONTENT_TAG = 'site-content';

const hasStore = () => Boolean(process.env.BLOB_READ_WRITE_TOKEN);

/** Keys whose values become links or media sources: only safe schemes are accepted. */
const URL_KEYS = new Set(['href', 'purchaseUrl', 'src', 'mp4', 'webm', 'poster']);
/** Media sources that point at files of this app must carry the base path. */
const MEDIA_KEYS = new Set(['src', 'mp4', 'webm', 'poster']);
const safeUrl = (v: string) => v === '' || /^(https?:\/\/|\/|#)/i.test(v.trim());

/**
 * Lays a stored (or submitted) document over the defaults. Every value keeps the type of its
 * default, unknown keys are dropped and new fields added later always get a value, so a stored
 * version can never break the page.
 */
export function normalize(template: unknown, value: unknown, key = ''): unknown {
  if (Array.isArray(template)) {
    if (!Array.isArray(value)) return template;
    const itemTemplate = template[0];
    if (itemTemplate === undefined) return [];
    return value.map((v, i) => normalize(template[i] ?? itemTemplate, v, key));
  }
  if (template && typeof template === 'object') {
    const source = value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
    const out: Record<string, unknown> = {};
    for (const [k, t] of Object.entries(template as Record<string, unknown>)) out[k] = normalize(t, source[k], k);
    return out;
  }
  if (typeof template === 'number') {
    const n = typeof value === 'number' ? value : Number(value);
    return Number.isFinite(n) && n > 0 ? Math.round(n) : template;
  }
  if (typeof template === 'string') {
    if (typeof value !== 'string') return template;
    if (URL_KEYS.has(key) && !safeUrl(value)) return template;
    if (MEDIA_KEYS.has(key)) return withBase(value.trim());
    return value.slice(0, 20000);
  }
  return template;
}

export const asContent = (value: unknown) => normalize(defaultContent, value) as SiteContent;

async function readJson(pathOrUrl: string): Promise<unknown | null> {
  const result = await get(pathOrUrl, { access: 'public', useCache: false });
  if (!result) return null;
  return JSON.parse(await new Response(result.stream).text());
}

async function readContent(): Promise<SiteContent> {
  if (!hasStore()) return asContent(defaultContent);
  try {
    const saved = await readJson(CURRENT);
    return saved ? asContent(saved) : defaultContent;
  } catch (error) {
    console.error('[content] falling back to defaults:', error);
    return asContent(defaultContent);
  }
}

/** Cached for the public page; invalidated by tag whenever the admin saves. */
// Bump CACHE_VERSION whenever the document shape or asset paths change: the data cache outlives deployments.
const CACHE_VERSION = 'v2';
export const getContent = unstable_cache(readContent, ['site-content', CACHE_VERSION, BASE_PATH], { tags: [CONTENT_TAG] });

/** Uncached read for the admin, so the editor always opens the latest saved version. */
export const getContentFresh = readContent;

export async function writeContent(content: SiteContent) {
  if (!hasStore()) throw new Error('Armazenamento não configurado (BLOB_READ_WRITE_TOKEN ausente).');
  const body = JSON.stringify(content);
  const options = { access: 'public' as const, contentType: 'application/json', addRandomSuffix: false, cacheControlMaxAge: 60 };
  await put(CURRENT, body, { ...options, allowOverwrite: true });
  await put(`${HISTORY}${new Date().toISOString().replace(/[:.]/g, '-')}.json`, body, options);
}

export async function listVersions() {
  if (!hasStore()) return [];
  const { blobs } = await list({ prefix: HISTORY, limit: 1000 });
  return blobs
    .sort((a, b) => +new Date(b.uploadedAt) - +new Date(a.uploadedAt))
    .slice(0, 40)
    .map((b) => ({ url: b.url, savedAt: new Date(b.uploadedAt).toISOString(), size: b.size }));
}

export async function readVersion(url: string) {
  if (!/^https:\/\/[a-z0-9-]+\.public\.blob\.vercel-storage\.com\/content\/history\//i.test(url)) {
    throw new Error('Versão inválida.');
  }
  const saved = await readJson(url);
  if (!saved) throw new Error('Versão não encontrada.');
  return asContent(saved);
}
