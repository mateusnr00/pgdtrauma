'use client';

import { useEffect, useState, useTransition } from 'react';
import { getIntegrations, saveIntegrations, testIntegrations, type IntegrationsState } from '../actions';
import a from '../admin.module.css';
import d from '../_dashboard/dashboard.module.css';
import s from './integrations.module.css';

type Notice = { kind: 'ok' | 'error'; text: string } | null;

export function Integrations() {
  const [state, setState] = useState<IntegrationsState | null>(null);
  const [pixelId, setPixelId] = useState('');
  const [testCode, setTestCode] = useState('');
  const [token, setToken] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [notice, setNotice] = useState<Notice>(null);
  const [saving, startSaving] = useTransition();
  const [testing, startTesting] = useTransition();

  useEffect(() => {
    let alive = true;
    getIntegrations().then((st) => {
      if (!alive) return;
      setState(st);
      setPixelId(st.pixelId);
      setTestCode(st.testCode);
    });
    return () => {
      alive = false;
    };
  }, []);

  if (!state) return <div className={`${d.kpi} ${d.skeleton}`} style={{ minHeight: '22rem' }} aria-busy="true" />;

  const pixelValid = pixelId === '' || /^\d{8,20}$/.test(pixelId);
  const dirty = pixelId !== state.pixelId || testCode !== state.testCode || token !== '';
  const pixelOn = Boolean(state.pixelId);
  const capiOn = pixelOn && state.hasToken;

  const save = (extra: { removeToken?: boolean } = {}) =>
    startSaving(async () => {
      const result = await saveIntegrations({ pixelId, testCode, token, ...extra });
      if (result.ok) {
        setState(result.state);
        setPixelId(result.state.pixelId);
        setTestCode(result.state.testCode);
        setToken('');
        setNotice({ kind: 'ok', text: extra.removeToken ? 'Token removido.' : 'Salvo. O site já está usando as novas configurações.' });
      } else setNotice({ kind: 'error', text: result.error });
    });

  const test = () =>
    startTesting(async () => {
      const result = await testIntegrations();
      setNotice(result.ok ? { kind: 'ok', text: result.message } : { kind: 'error', text: result.error });
    });

  return (
    <div className={d.dashboard}>
      <div className={d.head}>
        <div>
          <h1 className={d.title}>Integrações</h1>
          <p className={d.subtitle}>
            <span className={d.muted}>Conecte o site às suas campanhas de anúncios.</span>
          </p>
        </div>
      </div>

      {!state.storageReady && (
        <p className={a.banner} data-error>
          O banco de dados (Cloudflare D1) não está configurado, então não é possível salvar integrações.
        </p>
      )}

      <section className={s.card} aria-labelledby="meta-title">
        <header className={s.head}>
          <span className={s.logo} aria-hidden="true">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 7V3M15 7V3M7 7h10v4a5 5 0 0 1-10 0V7ZM12 16v5" />
            </svg>
          </span>
          <div>
            <h2 id="meta-title" className={s.title}>
              Meta (Facebook e Instagram)
            </h2>
            <p className={s.sub}>Pixel no navegador + API de Conversões no servidor. Os dois juntos medem mais vendas, mesmo com bloqueadores de anúncio.</p>
          </div>
          <div className={s.status}>
            <Status on={pixelOn} label="Pixel" />
            <Status on={capiOn} label="API de Conversões" />
          </div>
        </header>

        <form
          className={s.form}
          onSubmit={(e) => {
            e.preventDefault();
            if (dirty && pixelValid) save();
          }}
        >
          <div className={s.field}>
            <label htmlFor="pixel" className={a.label}>
              ID do Pixel (conjunto de dados)
            </label>
            <input
              id="pixel"
              className={a.input}
              inputMode="numeric"
              autoComplete="off"
              placeholder="Ex.: 123456789012345"
              value={pixelId}
              onChange={(e) => setPixelId(e.target.value.replace(/\D/g, ''))}
              aria-invalid={!pixelValid || undefined}
            />
            <p className={a.hint}>Só números. Fica em Gerenciador de Eventos → Fontes de dados → seu Pixel.</p>
          </div>

          <div className={s.field}>
            <label htmlFor="token" className={a.label}>
              Token de acesso da API de Conversões
            </label>
            <div className={s.tokenRow}>
              <input
                id="token"
                className={a.input}
                type={showToken ? 'text' : 'password'}
                autoComplete="off"
                spellCheck={false}
                placeholder={state.hasToken ? `Salvo (termina em …${state.tokenHint}). Cole outro para trocar.` : 'Cole aqui o token (começa com EAA…)'}
                value={token}
                onChange={(e) => setToken(e.target.value.trim())}
              />
              <button type="button" className={a.secondaryBtn} onClick={() => setShowToken((v) => !v)} aria-pressed={showToken}>
                {showToken ? 'Ocultar' : 'Mostrar'}
              </button>
            </div>
            <p className={a.hint}>
              Gerenciador de Eventos → seu Pixel → <b>Configurações</b> → <b>API de Conversões</b> → <b>Gerar token de acesso</b>. Depois de salvo, o token fica guardado em segurança e não é mostrado de novo.
              {state.hasToken && (
                <>
                  {' '}
                  <button type="button" className={`${a.textBtn} ${d.dangerText}`} onClick={() => confirm('Remover o token da API de Conversões?') && save({ removeToken: true })}>
                    Remover token
                  </button>
                </>
              )}
            </p>
          </div>

          <div className={s.field}>
            <label htmlFor="test" className={a.label}>
              Código de teste <span className={d.muted}>(opcional)</span>
            </label>
            <input id="test" className={a.input} autoComplete="off" placeholder="Ex.: TEST12345" value={testCode} onChange={(e) => setTestCode(e.target.value.trim())} />
            <p className={a.hint}>Use só para conferir na aba &ldquo;Testar eventos&rdquo; da Meta e <b>apague depois</b>: enquanto houver código, os eventos do servidor contam como teste.</p>
          </div>

          {notice && (
            <p className={a.banner} data-error={notice.kind === 'error' || undefined} role="status" style={{ margin: 0 }}>
              {notice.text}
            </p>
          )}

          <div className={s.actions}>
            <button type="submit" className={a.primaryBtn} disabled={!dirty || !pixelValid || saving || !state.storageReady}>
              {saving ? 'Salvando…' : 'Salvar'}
            </button>
            <button type="button" className={a.secondaryBtn} onClick={test} disabled={testing || dirty || !capiOn}>
              {testing ? 'Enviando…' : 'Enviar evento de teste'}
            </button>
            {dirty && <span className={a.hint}>Salve antes de testar.</span>}
          </div>
        </form>

        <div className={s.events}>
          <p className={d.eyebrow}>Eventos enviados</p>
          <ul>
            <li>
              <b>PageView</b> <span>toda visita ao site</span>
            </li>
            <li>
              <b>ViewContent</b> <span>quando a pessoa chega ao sumário do livro</span>
            </li>
            <li>
              <b>InitiateCheckout</b> <span>clique em &ldquo;Adquirir livro&rdquo; (qualquer botão)</span>
            </li>
          </ul>
          <p className={a.hint}>Cada evento sai pelo Pixel e pela API com o mesmo identificador, então a Meta não conta em dobro.</p>
        </div>
      </section>
    </div>
  );
}

function Status({ on, label }: { on: boolean; label: string }) {
  return (
    <span className={s.chip} data-on={on || undefined}>
      <i aria-hidden="true" />
      {label}: {on ? 'ativo' : 'desligado'}
    </span>
  );
}
