'use server';

import { headers } from 'next/headers';
import { revalidatePath, updateTag } from 'next/cache';
import { emailMatches, endSession, goToAdmin, passwordMatches, requireAdmin, startSession } from '@/lib/auth';
import { asContent, CONTENT_TAG, listVersions, readVersion, writeContent } from '@/lib/content-store';
import { defaultContent } from '@/content/defaults';
import type { SiteContent } from '@/content/schema';
import { analyticsReady, report, resetAnalytics, type Report } from '@/lib/analytics';
import { d1Ready } from '@/lib/d1';
import { sendMetaTest } from '@/lib/meta';
import { readTracking, TRACKING_TAG, writeTracking } from '@/lib/settings';
import { site } from '@/content/book';

export type LoginState = { error?: string };

export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get('email') ?? '');
  const password = String(formData.get('password') ?? '');
  // Both are checked every time, so the answer never reveals which one was wrong.
  const emailOk = emailMatches(email);
  const passwordOk = passwordMatches(password);
  if (!emailOk || !passwordOk) {
    // Slow down guessing.
    await new Promise((r) => setTimeout(r, 800));
    return { error: 'E-mail ou senha incorretos.' };
  }
  await startSession();
  return goToAdmin('panel');
}

export async function logout() {
  await endSession();
  await goToAdmin('login');
}

export type SaveResult = { ok: true; savedAt: string; content: SiteContent } | { ok: false; error: string };

export async function saveContent(input: unknown): Promise<SaveResult> {
  try {
    await requireAdmin();
    if (JSON.stringify(input).length > 2_000_000) throw new Error('Conteúdo grande demais.');
    // Normalised against the schema: wrong types, unknown keys and unsafe links are dropped.
    const content = asContent(input);
    await writeContent(content);
    updateTag(CONTENT_TAG);
    revalidatePath('/', 'layout');
    return { ok: true, savedAt: new Date().toISOString(), content };
  } catch (error) {
    return { ok: false, error: (error as Error).message };
  }
}

export async function getVersions() {
  await requireAdmin();
  return listVersions();
}

export async function loadVersion(url: string): Promise<SaveResult> {
  try {
    await requireAdmin();
    return { ok: true, savedAt: '', content: await readVersion(url) };
  } catch (error) {
    return { ok: false, error: (error as Error).message };
  }
}

export async function getDefaults() {
  await requireAdmin();
  return asContent(defaultContent);
}

export type ReportResult = { ok: true; report: Report } | { ok: false; reason: 'not-configured' | 'error'; error?: string };

export async function getReport(days: number): Promise<ReportResult> {
  await requireAdmin();
  if (!analyticsReady()) return { ok: false, reason: 'not-configured' };
  try {
    const safeDays = [1, 7, 30, 90, 365].includes(days) ? days : 30;
    return { ok: true, report: await report(safeDays) };
  } catch (error) {
    console.error('analytics report:', error);
    return { ok: false, reason: 'error', error: (error as Error).message };
  }
}

export async function clearAnalytics() {
  await requireAdmin();
  if (analyticsReady()) await resetAnalytics();
}

/* ---------- Integrações (Meta Pixel + API de Conversões) ---------- */

export type IntegrationsState = {
  storageReady: boolean;
  pixelId: string;
  testCode: string;
  /** The token never leaves the server: only whether it exists and its last characters. */
  hasToken: boolean;
  tokenHint: string;
};

export async function getIntegrations(): Promise<IntegrationsState> {
  await requireAdmin();
  const t = await readTracking();
  return { storageReady: d1Ready(), pixelId: t.pixelId, testCode: t.testCode, hasToken: Boolean(t.capiToken), tokenHint: t.capiToken.slice(-4) };
}

export async function saveIntegrations(input: { pixelId: string; testCode: string; token?: string; removeToken?: boolean }): Promise<{ ok: true; state: IntegrationsState } | { ok: false; error: string }> {
  try {
    await requireAdmin();
    if (!d1Ready()) throw new Error('O banco de dados (Cloudflare D1) não está configurado.');
    const pixelId = String(input.pixelId ?? '').replace(/\D/g, '');
    if (input.pixelId && !/^\d{8,20}$/.test(pixelId)) throw new Error('O ID do Pixel tem só números (geralmente 15 ou 16 dígitos).');
    const testCode = String(input.testCode ?? '').trim().slice(0, 40);
    if (testCode && !/^[A-Za-z0-9_-]+$/.test(testCode)) throw new Error('Código de teste inválido.');
    const token = String(input.token ?? '').trim();
    if (token && (token.length < 20 || /\s/.test(token))) throw new Error('Esse token não parece válido. Copie de novo no Gerenciador de Eventos.');
    await writeTracking({
      pixelId,
      testCode,
      ...(input.removeToken ? { capiToken: '' } : token ? { capiToken: token } : {}),
    });
    updateTag(TRACKING_TAG);
    revalidatePath('/', 'layout');
    return { ok: true, state: await getIntegrations() };
  } catch (error) {
    return { ok: false, error: (error as Error).message };
  }
}

export async function testIntegrations(): Promise<{ ok: true; message: string } | { ok: false; error: string }> {
  try {
    await requireAdmin();
    const h = await headers();
    const result = await sendMetaTest({
      userAgent: h.get('user-agent') ?? undefined,
      ip: (h.get('x-forwarded-for') ?? '').split(',')[0].trim() || undefined,
      url: site.url,
    });
    return {
      ok: true,
      message: result.testCode
        ? `A Meta recebeu ${result.received} evento de teste. Confira em Gerenciador de Eventos → Testar eventos.`
        : `Conexão funcionando: a Meta recebeu ${result.received} evento. (Com um código de teste, ele aparece na aba "Testar eventos".)`,
    };
  } catch (error) {
    return { ok: false, error: `A Meta recusou: ${(error as Error).message}` };
  }
}
