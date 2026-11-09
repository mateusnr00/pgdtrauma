'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Report, Totals } from '@/lib/analytics';
import { clearAnalytics, getReport, type ReportResult } from '../actions';
import { BarList, HourStrip, TimeChart } from './Charts';
import { clickLabel, countryLabel, DEVICE_LABELS, POSITION_LABELS, SECTION_LABELS, SECTION_ORDER, sourceLabel } from './labels';
import a from '../admin.module.css';
import s from './dashboard.module.css';

const PERIODS = [
  { days: 1, label: '24 h' },
  { days: 7, label: '7 dias' },
  { days: 30, label: '30 dias' },
  { days: 90, label: '90 dias' },
  { days: 365, label: '12 meses' },
];

const fmt = new Intl.NumberFormat('pt-BR');
const pct = (v: number) => `${new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 }).format(v * 100)}%`;
const rate = (t: Totals) => (t.visitors ? t.buyers / t.visitors : 0);

type PurchaseProps = {
  purchaseUrl: string;
  savedPurchaseUrl: string;
  onPurchaseChange: (v: string) => void;
  onSave: () => void;
  saving: boolean;
  canSave: boolean;
  siteUrl: string;
};

export function Dashboard(props: PurchaseProps) {
  const [days, setDays] = useState(30);
  const [result, setResult] = useState<ReportResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);

  const fetchReport = (d: number) =>
    getReport(d).catch((error): ReportResult => ({ ok: false, reason: 'error', error: (error as Error).message }));

  const apply = useCallback((next: ReportResult) => {
    setResult(next);
    setUpdatedAt(new Date());
    setLoading(false);
  }, []);

  const load = useCallback((d: number) => fetchReport(d).then(apply), [apply]);

  const refresh = (d: number) => {
    setLoading(true);
    if (d !== days) setDays(d);
    else load(d);
  };

  useEffect(() => {
    let alive = true;
    fetchReport(days).then((next) => {
      if (alive) apply(next);
    });
    return () => {
      alive = false;
    };
  }, [days, apply]);

  // Refresh every minute while the tab is visible.
  useEffect(() => {
    const id = setInterval(() => {
      if (document.visibilityState === 'visible') load(days);
    }, 60_000);
    return () => clearInterval(id);
  }, [days, load]);

  const report = result?.ok ? result.report : null;

  return (
    <div className={s.dashboard}>
      <div className={s.head}>
        <div>
          <h1 className={s.title}>Métricas</h1>
          <p className={s.subtitle}>
            {report && report.live > 0 ? (
              <span className={s.live}>
                <i aria-hidden="true" /> {fmt.format(report.live)} {report.live === 1 ? 'pessoa no site agora' : 'pessoas no site agora'}
              </span>
            ) : (
              <span className={s.muted}>Quem visitou o site e quem clicou em comprar.</span>
            )}
            {updatedAt && <span className={s.muted}> · atualizado às {updatedAt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>}
          </p>
        </div>
        <div className={s.headActions}>
          <div className={s.segmented} role="radiogroup" aria-label="Período">
            {PERIODS.map((p) => (
              <button key={p.days} type="button" role="radio" aria-checked={days === p.days} onClick={() => refresh(p.days)}>
                {p.label}
              </button>
            ))}
          </div>
          <button type="button" className={a.secondaryBtn} onClick={() => refresh(days)} disabled={loading} aria-label="Atualizar números">
            <span className={s.refresh} data-spin={loading || undefined} aria-hidden="true">
              ↻
            </span>
          </button>
        </div>
      </div>

      <PurchaseCard {...props} />

      {result && !result.ok && result.reason === 'not-configured' && <SetupCard />}
      {result && !result.ok && result.reason === 'error' && (
        <p className={a.banner} data-error>
          Não foi possível carregar as métricas agora. Tente atualizar em instantes. {result.error && <small>({result.error})</small>}
        </p>
      )}
      {!result && <Skeleton />}
      {report && <Report report={report} loading={loading} onCleared={() => refresh(days)} />}
    </div>
  );
}

/* ------------------------------------------------------------------ */

function PurchaseCard({ purchaseUrl, savedPurchaseUrl, onPurchaseChange, onSave, saving, canSave, siteUrl }: PurchaseProps) {
  const valid = purchaseUrl === '' || /^https?:\/\/\S+\.\S+/i.test(purchaseUrl.trim());
  const changed = purchaseUrl !== savedPurchaseUrl;
  const [copied, setCopied] = useState<string | null>(null);
  const [channel, setChannel] = useState('instagram');

  const shareLink = useMemo(() => {
    const u = new URL(siteUrl);
    u.searchParams.set('utm_source', channel);
    return u.toString();
  }, [channel, siteUrl]);

  const copy = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      setTimeout(() => setCopied(null), 1800);
    } catch {
      /* clipboard blocked: the field stays selectable */
    }
  };

  return (
    <section className={s.purchase} aria-labelledby="purchase-title">
      <div className={s.purchaseMain}>
        <p className={s.eyebrow}>Botão &ldquo;Adquirir livro&rdquo;</p>
        <h2 id="purchase-title" className={s.purchaseTitle}>
          Para onde o botão leva
        </h2>
        <p className={s.purchaseHint}>
          Todos os botões de compra do site (topo, menu do celular e seção final) levam para este link. Troque quando quiser: o site muda na hora e cada clique é contado aqui.
        </p>
        <form
          className={s.purchaseForm}
          onSubmit={(e) => {
            e.preventDefault();
            if (valid && changed) onSave();
          }}
        >
          <label className="sr-only" htmlFor="purchase-url">
            Link de compra
          </label>
          <input
            id="purchase-url"
            className={a.input}
            type="url"
            inputMode="url"
            placeholder="https://loja.com.br/principios-gerais-da-traumatologia"
            value={purchaseUrl}
            onChange={(e) => onPurchaseChange(e.target.value.trim())}
            aria-invalid={!valid || undefined}
            aria-describedby="purchase-status"
          />
          <button type="submit" className={a.primaryBtn} disabled={!valid || !changed || saving || !canSave}>
            {saving ? 'Salvando…' : 'Salvar link'}
          </button>
          {purchaseUrl && valid && (
            <a href={purchaseUrl} target="_blank" rel="noopener" className={a.secondaryBtn}>
              Testar ↗
            </a>
          )}
        </form>
        <p id="purchase-status" className={s.purchaseStatus} data-state={!valid ? 'error' : changed ? 'pending' : savedPurchaseUrl ? 'ok' : 'empty'}>
          {!valid
            ? 'O link precisa começar com https:// e ser um endereço completo.'
            : changed
              ? 'Link alterado e ainda não salvo.'
              : savedPurchaseUrl
                ? 'No ar. Os botões estão levando para este link.'
                : 'Sem link: os botões rolam até a seção final, com o aviso "em breve".'}
        </p>
      </div>

      <div className={s.purchaseSide}>
        <p className={s.eyebrow}>Divulgar com rastreio</p>
        <p className={s.purchaseHint}>Use um link por canal para saber de onde vêm as visitas.</p>
        <div className={s.channels} role="radiogroup" aria-label="Canal">
          {['instagram', 'whatsapp', 'facebook', 'email', 'linkedin', 'youtube'].map((c) => (
            <button key={c} type="button" role="radio" aria-checked={channel === c} onClick={() => setChannel(c)}>
              {sourceLabel(c)}
            </button>
          ))}
        </div>
        <div className={s.copyRow}>
          <input className={a.input} readOnly value={shareLink} onFocus={(e) => e.currentTarget.select()} aria-label="Link para divulgar" />
          <button type="button" className={a.secondaryBtn} onClick={() => copy(shareLink, 'share')}>
            {copied === 'share' ? 'Copiado ✓' : 'Copiar'}
          </button>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */

function Delta({ now, before, inverse = false }: { now: number; before: number; inverse?: boolean }) {
  if (!before && !now) return <span className={s.delta}>—</span>;
  if (!before) return <span className={s.delta} data-trend="up">novo</span>;
  const change = (now - before) / before;
  const up = change >= 0;
  const good = inverse ? !up : up;
  return (
    <span className={s.delta} data-trend={Math.abs(change) < 0.005 ? undefined : good ? 'up' : 'down'}>
      <span aria-hidden="true">{up ? '▲' : '▼'}</span> {pct(Math.abs(change))}
      <span className="sr-only">{up ? ' a mais' : ' a menos'}</span>
    </span>
  );
}

function Kpi({ label, value, now, before, hint, accent }: { label: string; value: string; now: number; before: number; hint: string; accent?: boolean }) {
  return (
    <div className={s.kpi} data-accent={accent || undefined}>
      <span className={s.kpiLabel}>{label}</span>
      <span className={s.kpiValue}>{value}</span>
      <span className={s.kpiFoot}>
        <Delta now={now} before={before} /> <span className={s.muted}>{hint}</span>
      </span>
    </div>
  );
}

function Report({ report: r, loading, onCleared }: { report: Report; loading: boolean; onCleared: () => void }) {
  const period = r.days === 1 ? 'nas últimas 24 h' : `nos últimos ${r.days} dias`;
  const vs = 'vs. período anterior';
  const sectionMap = new Map(r.sections.map((x) => [x.label, x.value]));
  const start = r.current.visitors;

  const funnel = [
    { label: 'Entraram no site', value: start },
    ...['obra', 'conteudo', 'autores', 'adquirir'].map((id) => ({ label: `Chegaram em “${SECTION_LABELS[id]}”`, value: Math.min(start, sectionMap.get(id) ?? 0) })),
    { label: 'Clicaram em comprar', value: Math.min(start, r.current.buyers) },
  ];

  const sectionsRows = SECTION_ORDER.filter((id) => sectionMap.has(id)).map((id) => ({ label: SECTION_LABELS[id], value: sectionMap.get(id) ?? 0 }));
  const daily = r.daily;
  const hasData = r.current.views > 0 || r.current.purchases > 0;

  return (
    <div className={s.report} data-loading={loading || undefined}>
      <div className={s.kpis}>
        <Kpi label="Visitantes" value={fmt.format(r.current.visitors)} now={r.current.visitors} before={r.previous.visitors} hint={vs} />
        <Kpi label="Visualizações" value={fmt.format(r.current.views)} now={r.current.views} before={r.previous.views} hint={vs} />
        <Kpi label="Cliques em comprar" value={fmt.format(r.current.purchases)} now={r.current.purchases} before={r.previous.purchases} hint={vs} accent />
        <Kpi label="Conversão" value={pct(rate(r.current))} now={rate(r.current)} before={rate(r.previous)} hint="visitantes que clicaram" />
      </div>

      {!hasData && (
        <p className={a.banner}>
          Ainda não há visitas registradas {period}. Os números aparecem aqui assim que alguém abrir o site (suas visitas logado no painel não contam).
        </p>
      )}

      <div className={s.grid2}>
        <Card title="Visitantes por dia" subtitle={period} wide>
          <TimeChart
            kind="area"
            label="Visitantes"
            points={daily.map((d) => ({
              day: d.day,
              value: d.visitors,
              extra: [
                { label: 'visualizações', value: d.views },
                { label: 'cliques em comprar', value: d.purchases },
              ],
            }))}
          />
          <DataTable daily={daily} />
        </Card>
        <Card title="Cliques em “Adquirir livro” por dia" subtitle={period} wide>
          <TimeChart kind="bars" tone="gold" label="Cliques" height={160} points={daily.map((d) => ({ day: d.day, value: d.purchases }))} />
        </Card>
      </div>

      <div className={s.grid2}>
        <Card title="Jornada do visitante" subtitle="Quantos visitantes chegaram a cada ponto da página">
          <ol className={s.funnel}>
            {funnel.map((f, i) => (
              <li key={f.label} className={s.funnelStep} data-last={i === funnel.length - 1 || undefined}>
                <div className={s.barText}>
                  <span className={s.barLabel}>{f.label}</span>
                  <span className={s.barValue}>
                    {fmt.format(f.value)}
                    <span className={s.barPct}>{start ? pct(f.value / start) : '0%'}</span>
                  </span>
                </div>
                <span className={s.barTrack} aria-hidden="true">
                  <span className={s.barFill} style={{ width: `${start ? (f.value / start) * 100 : 0}%` }} />
                </span>
              </li>
            ))}
          </ol>
        </Card>
        <Card title="Qual botão de compra mais converte" subtitle="Cliques por posição do botão">
          <BarList rows={r.positions.map((p) => ({ label: POSITION_LABELS[p.label] ?? p.label, value: p.value }))} empty="Nenhum clique em comprar ainda." />
        </Card>
      </div>

      <div className={s.grid3}>
        <Card title="De onde vêm" subtitle="Visitantes por origem">
          <BarList rows={r.sources.map((x) => ({ label: sourceLabel(x.label), value: x.value }))} total={r.current.visitors} />
        </Card>
        <Card title="Dispositivos" subtitle="Visitantes por tipo de aparelho">
          <BarList rows={r.devices.map((x) => ({ label: DEVICE_LABELS[x.label] ?? x.label, value: x.value }))} total={r.current.visitors} />
        </Card>
        <Card title="Países" subtitle="Visitantes por país">
          <BarList rows={r.countries.map((x) => ({ label: countryLabel(x.label), value: x.value }))} total={r.current.visitors} />
        </Card>
      </div>

      <div className={s.grid3}>
        <Card title="Seções mais vistas" subtitle="Visitantes que chegaram a cada seção">
          <BarList rows={sectionsRows} total={r.current.visitors} />
        </Card>
        <Card title="Mais clicados" subtitle="Menu, sumário, autores e vídeo">
          <BarList rows={r.clicks.map((x) => ({ label: clickLabel(x.label), value: x.value }))} empty="Nenhum clique registrado ainda." />
        </Card>
        <Card title="Horários de pico" subtitle="Visualizações por hora do dia">
          <HourStrip hours={r.hours} />
        </Card>
      </div>

      <footer className={s.foot}>
        <p className={s.muted}>
          Contagem anônima e própria do site: sem cookies de terceiros e sem guardar IP. Robôs e suas visitas logado no painel não entram nos números.
        </p>
        <button
          type="button"
          className={`${a.textBtn} ${s.dangerText}`}
          onClick={async () => {
            if (!confirm('Apagar todas as métricas registradas até agora? Isso não pode ser desfeito.')) return;
            await clearAnalytics();
            onCleared();
          }}
        >
          Zerar métricas
        </button>
      </footer>
    </div>
  );
}

function Card({ title, subtitle, children, wide }: { title: string; subtitle?: string; children: React.ReactNode; wide?: boolean }) {
  return (
    <section className={s.card} data-wide={wide || undefined}>
      <header className={s.cardHead}>
        <h2 className={s.cardTitle}>{title}</h2>
        {subtitle && <p className={s.cardSub}>{subtitle}</p>}
      </header>
      {children}
    </section>
  );
}

function DataTable({ daily }: { daily: Report['daily'] }) {
  return (
    <details className={s.tableToggle}>
      <summary>Ver em tabela</summary>
      <div className={s.tableWrap}>
        <table className={s.table}>
          <thead>
            <tr>
              <th scope="col">Dia</th>
              <th scope="col">Visitantes</th>
              <th scope="col">Visualizações</th>
              <th scope="col">Cliques em comprar</th>
            </tr>
          </thead>
          <tbody>
            {[...daily].reverse().map((d) => (
              <tr key={d.day}>
                <th scope="row">{new Date(`${d.day}T00:00:00Z`).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</th>
                <td>{fmt.format(d.visitors)}</td>
                <td>{fmt.format(d.views)}</td>
                <td>{fmt.format(d.purchases)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}

function SetupCard() {
  return (
    <section className={s.setup}>
      <p className={s.eyebrow}>Falta 1 passo</p>
      <h2 className={s.purchaseTitle}>Ligue o banco de dados das métricas</h2>
      <p className={s.purchaseHint}>A contagem de visitas e cliques já está no site. Ela só precisa de um lugar para guardar os números:</p>
      <ol className={s.steps}>
        <li>
          Na Cloudflare, crie um token com a permissão <b>Account → D1 → Edit</b>.
        </li>
        <li>
          Na Vercel, em <b>Settings → Environment Variables</b>, adicione <b>CLOUDFLARE_D1_TOKEN</b> com esse token (as outras duas variáveis já estão lá).
        </li>
        <li>
          Em <b>Deployments</b>, faça um <b>Redeploy</b> do último deploy.
        </li>
      </ol>
    </section>
  );
}

function Skeleton() {
  return (
    <div className={s.kpis} aria-busy="true" aria-label="Carregando métricas">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className={`${s.kpi} ${s.skeleton}`} />
      ))}
    </div>
  );
}
