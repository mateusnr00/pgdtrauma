import 'server-only';

/**
 * Minimal client for Cloudflare D1 over its HTTP API. Used by analytics and by the private
 * settings (Meta integration). Needs CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_D1_DATABASE_ID and
 * CLOUDFLARE_D1_TOKEN (a token with only "D1: Edit").
 */

export type D1Row = Record<string, unknown>;
export type D1Param = string | number | null;

const env = () => ({
  account: process.env.CLOUDFLARE_ACCOUNT_ID ?? '',
  database: process.env.CLOUDFLARE_D1_DATABASE_ID ?? '',
  token: process.env.CLOUDFLARE_D1_TOKEN ?? '',
});

export const d1Ready = () => {
  const e = env();
  return Boolean(e.account && e.database && e.token);
};

export async function d1(sql: string, params: D1Param[] = []): Promise<D1Row[]> {
  const { account, database, token } = env();
  const res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${account}/d1/database/${database}/query`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ sql, params }),
    cache: 'no-store',
  });
  const body = (await res.json().catch(() => null)) as { success?: boolean; errors?: { message: string }[]; result?: { results?: D1Row[] }[] } | null;
  if (!res.ok || !body?.success) {
    throw new Error(`D1: ${body?.errors?.map((e) => e.message).join('; ') || res.status}`);
  }
  return body.result?.[0]?.results ?? [];
}
