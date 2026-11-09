'use client';

import { useCallback, useEffect, useMemo, useState, useTransition } from 'react';
import type { SiteContent } from '@/content/schema';
import { site } from '@/content/book';
import { getDefaults, getVersions, loadVersion, logout, saveContent } from '../actions';
import { Dashboard } from '../_dashboard/Dashboard';
import { Integrations } from '../_integrations/Integrations';
import { Fields, type Path } from './Fields';
import { sections } from './spec';
import s from '../admin.module.css';

type Tab = 'metricas' | 'conteudo' | 'integracoes';
type Version = { url: string; savedAt: string; size: number };

function setIn(obj: unknown, path: Path, value: unknown): unknown {
  if (path.length === 0) return value;
  const [head, ...rest] = path;
  if (Array.isArray(obj)) {
    const copy = [...obj];
    copy[head as number] = setIn(copy[head as number], rest, value);
    return copy;
  }
  const record = (obj ?? {}) as Record<string, unknown>;
  return { ...record, [head]: setIn(record[head as string], rest, value) };
}

const formatDate = (iso: string) =>
  new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(iso));

export function Editor({ initial, storeReady }: { initial: SiteContent; storeReady: boolean }) {
  const [content, setContent] = useState(initial);
  const [saved, setSaved] = useState(initial);
  const [active, setActive] = useState<string>(sections[0].id);
  const [status, setStatus] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null);
  const [saving, startSaving] = useTransition();
  const [historyOpen, setHistoryOpen] = useState(false);
  const [versions, setVersions] = useState<Version[] | null>(null);
  const [tab, setTab] = useState<Tab>('metricas');

  const switchTab = (next: Tab) => {
    setTab(next);
    window.scrollTo({ top: 0 });
  };

  const dirty = useMemo(() => JSON.stringify(content) !== JSON.stringify(saved), [content, saved]);
  const section = sections.find((x) => x.id === active) ?? sections[0];

  const onChange = useCallback((path: Path, value: unknown) => {
    setContent((prev) => setIn(prev, path, value) as SiteContent);
    setStatus(null);
  }, []);

  const save = useCallback(() => {
    startSaving(async () => {
      const result = await saveContent(content);
      if (result.ok) {
        setContent(result.content);
        setSaved(result.content);
        setVersions(null);
        setStatus({ kind: 'ok', text: `Publicado às ${new Date(result.savedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}.` });
      } else {
        setStatus({ kind: 'error', text: result.error });
      }
    });
  }, [content]);

  /** Publishes only the purchase link, leaving any other unpublished edits as drafts. */
  const savePurchase = useCallback(() => {
    startSaving(async () => {
      const url = content.meta.purchaseUrl;
      const result = await saveContent({ ...saved, meta: { ...saved.meta, purchaseUrl: url } });
      if (result.ok) {
        setSaved(result.content);
        setContent((prev) => ({ ...prev, meta: { ...prev.meta, purchaseUrl: result.content.meta.purchaseUrl } }));
        setVersions(null);
        setStatus({ kind: 'ok', text: `Link de compra salvo às ${new Date(result.savedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}.` });
      } else {
        setStatus({ kind: 'error', text: result.error });
      }
    });
  }, [content.meta.purchaseUrl, saved]);

  const siteUrl = site.url.startsWith('http://localhost') ? 'https://pgdtraumatologia.com/pgdtrauma' : site.url;

  // Ctrl/Cmd + S saves.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        if (dirty && !saving) save();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [dirty, saving, save]);

  // Warn before leaving with unsaved changes.
  useEffect(() => {
    if (!dirty) return;
    const onLeave = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener('beforeunload', onLeave);
    return () => window.removeEventListener('beforeunload', onLeave);
  }, [dirty]);

  const openHistory = async () => {
    setHistoryOpen(true);
    if (!versions) setVersions(await getVersions().catch(() => []));
  };

  const restore = async (url: string) => {
    const result = await loadVersion(url);
    if (result.ok) {
      setContent(result.content);
      setHistoryOpen(false);
      setStatus({ kind: 'ok', text: 'Versão carregada. Revise e clique em "Publicar" para colocá-la no ar.' });
    } else setStatus({ kind: 'error', text: result.error });
  };

  const restoreDefaults = async () => {
    if (!confirm('Carregar o conteúdo original do site? Nada é publicado até você clicar em "Publicar".')) return;
    setContent(await getDefaults());
    setHistoryOpen(false);
    setStatus({ kind: 'ok', text: 'Conteúdo original carregado. Clique em "Publicar" para colocá-lo no ar.' });
  };

  return (
    <div className={s.shell}>
      <header className={s.topbar}>
        <div className={s.brand}>
          <span className={s.brandMark} aria-hidden="true" />
          <span className={s.brandName}>
            <strong>Painel</strong> <span className={s.muted}>· Princípios Gerais da Traumatologia</span>
          </span>
        </div>
        <nav className={s.tabs} aria-label="Área do painel">
          <button type="button" aria-current={tab === 'metricas' ? 'page' : undefined} onClick={() => switchTab('metricas')}>
            Métricas
          </button>
          <button type="button" aria-current={tab === 'conteudo' ? 'page' : undefined} onClick={() => switchTab('conteudo')}>
            Conteúdo do site
            {dirty && <span className={s.dot} aria-label="com alterações não publicadas" />}
          </button>
          <button type="button" aria-current={tab === 'integracoes' ? 'page' : undefined} onClick={() => switchTab('integracoes')}>
            Integrações
          </button>
        </nav>
        <div className={s.topActions}>
          {tab === 'conteudo' && (
            <>
              <span className={s.state} data-dirty={dirty || undefined} role="status" aria-live="polite">
                {saving ? 'Publicando…' : dirty ? 'Alterações não publicadas' : status?.kind === 'ok' ? status.text : 'Tudo publicado'}
              </span>
              <button type="button" className={s.secondaryBtn} onClick={openHistory}>
                Histórico
              </button>
              {dirty && (
                <button
                  type="button"
                  className={s.secondaryBtn}
                  onClick={() => {
                    if (confirm('Descartar as alterações não publicadas?')) setContent(saved);
                  }}
                >
                  Descartar
                </button>
              )}
              <button type="button" className={s.primaryBtn} onClick={save} disabled={!dirty || saving || !storeReady}>
                {saving ? 'Publicando…' : 'Publicar'}
              </button>
            </>
          )}
          <a href={site.url.startsWith('http://localhost') ? '/pgdtrauma' : site.url} target="_blank" rel="noopener" className={s.secondaryBtn}>
            Ver site ↗
          </a>
          <form action={logout}>
            <button type="submit" className={s.textBtn}>
              Sair
            </button>
          </form>
        </div>
      </header>

      {!storeReady && (
        <p className={s.banner}>Armazenamento não configurado neste ambiente (BLOB_READ_WRITE_TOKEN ausente): é possível editar, mas não publicar.</p>
      )}
      {status?.kind === 'error' && (
        <p className={s.banner} data-error>
          {status.text}
        </p>
      )}
      {status?.kind === 'ok' && dirty && <p className={s.banner}>{status.text}</p>}

      {tab === 'integracoes' ? (
        <div className={s.wideBody}>
          <Integrations />
        </div>
      ) : tab === 'metricas' ? (
        <div className={s.wideBody}>
          <Dashboard
            purchaseUrl={content.meta.purchaseUrl}
            savedPurchaseUrl={saved.meta.purchaseUrl}
            onPurchaseChange={(v) => onChange(['meta', 'purchaseUrl'], v)}
            onSave={savePurchase}
            saving={saving}
            canSave={storeReady}
            siteUrl={siteUrl}
          />
        </div>
      ) : (
      <div className={s.body}>
        <nav className={s.sidebar} aria-label="Seções do site">
          <label className={s.mobileNav}>
            <span className="sr-only">Seção</span>
            <select className={s.input} value={active} onChange={(e) => setActive(e.target.value)}>
              {sections.map((x) => (
                <option key={x.id} value={x.id}>
                  {x.title}
                </option>
              ))}
            </select>
          </label>
          <ul className={s.navList}>
            {sections.map((x) => (
              <li key={x.id}>
                <button type="button" className={s.navItem} aria-current={x.id === active ? 'page' : undefined} onClick={() => setActive(x.id)}>
                  {x.title}
                  {JSON.stringify(content[x.id]) !== JSON.stringify(saved[x.id]) && <span className={s.dot} aria-label="alterado" />}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <main className={s.main}>
          <div className={s.sectionHead}>
            <h1 className={s.sectionTitle}>{section.title}</h1>
            <p className={s.sectionDesc}>{section.description}</p>
          </div>
          <Fields key={section.id} fields={section.fields} value={content[section.id] as unknown as Record<string, unknown>} path={[section.id]} onChange={onChange} />
        </main>
      </div>
      )}

      {historyOpen && (
        <div className={s.overlay} onClick={() => setHistoryOpen(false)}>
          <aside className={s.drawer} role="dialog" aria-modal="true" aria-label="Histórico de versões" onClick={(e) => e.stopPropagation()}>
            <div className={s.drawerHead}>
              <h2 className={s.drawerTitle}>Histórico</h2>
              <button type="button" className={s.textBtn} onClick={() => setHistoryOpen(false)}>
                Fechar
              </button>
            </div>
            <p className={s.hint}>Cada publicação fica guardada. Carregar uma versão não publica nada até você clicar em &ldquo;Publicar&rdquo;.</p>
            {versions === null ? (
              <p className={s.hint}>Carregando…</p>
            ) : versions.length === 0 ? (
              <p className={s.hint}>Nenhuma versão publicada ainda.</p>
            ) : (
              <ul className={s.versionList}>
                {versions.map((v, i) => (
                  <li key={v.url} className={s.version}>
                    <span>
                      {formatDate(v.savedAt)}
                      {i === 0 && <span className={s.badge}>atual</span>}
                    </span>
                    <button type="button" className={s.textBtn} onClick={() => restore(v.url)}>
                      Carregar
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <button type="button" className={s.secondaryBtn} onClick={restoreDefaults}>
              Carregar conteúdo original do site
            </button>
          </aside>
        </div>
      )}
    </div>
  );
}
