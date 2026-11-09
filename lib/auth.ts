import 'server-only';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { ADMIN_HOST } from '@/lib/base-path';

/**
 * Single-owner admin login: one password (ADMIN_PASSWORD) and a signed, httpOnly session
 * cookie (HMAC with ADMIN_SECRET). Every admin page, server action and upload checks it.
 */

const COOKIE = 'pgt_admin';
const TTL_SECONDS = 60 * 60 * 12;

export const adminConfigured = () => Boolean(process.env.ADMIN_PASSWORD && process.env.ADMIN_SECRET);

const sign = (value: string) => createHmac('sha256', process.env.ADMIN_SECRET ?? '').update(value).digest('base64url');

function safeEqual(a: string, b: string) {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

export function passwordMatches(input: string) {
  const expected = process.env.ADMIN_PASSWORD ?? '';
  // Compare digests so length differences don't leak through timing.
  return adminConfigured() && safeEqual(sign(`pw:${input}`), sign(`pw:${expected}`));
}

export async function startSession() {
  const expires = Math.floor(Date.now() / 1000) + TTL_SECONDS;
  const value = `${expires}.${sign(String(expires))}`;
  (await cookies()).set(COOKIE, value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: TTL_SECONDS,
  });
}

export async function endSession() {
  (await cookies()).delete(COOKIE);
}

export async function isAdmin() {
  if (!adminConfigured()) return false;
  const value = (await cookies()).get(COOKIE)?.value;
  if (!value) return false;
  const [expires, signature] = value.split('.');
  if (!expires || !signature || Number(expires) < Date.now() / 1000) return false;
  return safeEqual(signature, sign(expires));
}

export async function requireAdmin() {
  if (!(await isAdmin())) throw new Error('Sessão expirada. Entre novamente.');
}

/** Sends the browser to the panel ('/') or its login ('/login'), with clean URLs on the admin host. */
export async function goToAdmin(to: 'panel' | 'login'): Promise<never> {
  const host = (await headers()).get('host')?.split(':')[0];
  if (host === ADMIN_HOST) redirect(to === 'panel' ? `https://${ADMIN_HOST}/` : `https://${ADMIN_HOST}/login`);
  redirect(to === 'panel' ? '/admin' : '/admin/login');
}
