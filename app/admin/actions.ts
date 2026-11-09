'use server';

import { revalidatePath, updateTag } from 'next/cache';
import { endSession, goToAdmin, passwordMatches, requireAdmin, startSession } from '@/lib/auth';
import { asContent, CONTENT_TAG, listVersions, readVersion, writeContent } from '@/lib/content-store';
import { defaultContent } from '@/content/defaults';
import type { SiteContent } from '@/content/schema';

export type LoginState = { error?: string };

export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const password = String(formData.get('password') ?? '');
  if (!passwordMatches(password)) {
    // Slow down guessing.
    await new Promise((r) => setTimeout(r, 800));
    return { error: 'Senha incorreta.' };
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
