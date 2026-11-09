'use client';

import { useEffect, useRef, useState } from 'react';
import s from './dashboard.module.css';

/**
 * Small, dependency-free SVG charts for the dashboard. One series each (no dual axes), thin
 * marks, recessive grid, and a hover layer with a crosshair and tooltip.
 */

function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setWidth(Math.round(entry.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, width] as const;
}

/** Rounds the axis maximum up to a friendly number so gridlines land on whole values. */
function niceMax(v: number) {
  // Four gridline steps, each a whole, friendly number (1, 2, 5, 10, 20, 25, 50…).
  const raw = Math.max(v, 4) / 4;
  const pow = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * pow).find((x) => x >= raw && Number.isInteger(x)) ?? 10 * pow;
  return step * 4;
}

const fmt = new Intl.NumberFormat('pt-BR');
const dayFmt = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', timeZone: 'UTC' });
const fullDayFmt = new Intl.DateTimeFormat('pt-BR', { weekday: 'short', day: '2-digit', month: 'long', timeZone: 'UTC' });
const capitalize = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);
const asDate = (day: string) => new Date(`${day}T00:00:00Z`);

export type Point = { day: string; value: number; extra?: { label: string; value: number }[] };

type ChartProps = {
  points: Point[];
  label: string;
  kind: 'area' | 'bars';
  tone?: 'green' | 'gold';
  height?: number;
};

export function TimeChart({ points, label, kind, tone = 'green', height = 220 }: ChartProps) {
  const [ref, width] = useWidth<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);

  const pad = { top: 12, right: 8, bottom: 26, left: 36 };
  const w = Math.max(width, 280);
  const innerW = w - pad.left - pad.right;
  const innerH = height - pad.top - pad.bottom;
  const max = niceMax(Math.max(0, ...points.map((p) => p.value)));
  const count = points.length;
  const band = innerW / Math.max(count, 1);
  const x = (i: number) => pad.left + (kind === 'bars' ? band * i + band / 2 : count === 1 ? innerW / 2 : (innerW * i) / (count - 1));
  const y = (v: number) => pad.top + innerH - (v / max) * innerH;

  const ticks = [0, 0.25, 0.5, 0.75, 1].map((t) => Math.round(max * t));
  const labelEvery = Math.max(1, Math.ceil(count / Math.max(2, Math.floor(innerW / 70))));

  const line = points.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(p.value).toFixed(1)}`).join('');
  const area = count ? `${line}L${x(count - 1).toFixed(1)},${y(0)}L${x(0).toFixed(1)},${y(0)}Z` : '';

  const onMove = (e: React.PointerEvent<SVGRectElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * innerW;
    const i = kind === 'bars' ? Math.floor(px / band) : Math.round((px / innerW) * (count - 1));
    setHover(Math.min(count - 1, Math.max(0, i)));
  };

  const hovered = hover !== null ? points[hover] : null;
  const barW = Math.max(2, Math.min(28, band - 2));

  return (
    <div ref={ref} className={s.chart} data-tone={tone}>
      {width > 0 && (
        <svg width={w} height={height} role="img" aria-label={label}>
          <defs>
            <linearGradient id={`fill-${tone}`} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="var(--series)" stopOpacity="0.22" />
              <stop offset="100%" stopColor="var(--series)" stopOpacity="0" />
            </linearGradient>
          </defs>
          {ticks.map((t) => (
            <g key={t}>
              <line x1={pad.left} x2={w - pad.right} y1={y(t)} y2={y(t)} className={t === 0 ? s.axisLine : s.gridLine} />
              <text x={pad.left - 8} y={y(t)} className={s.tick} textAnchor="end" dominantBaseline="middle">
                {fmt.format(t)}
              </text>
            </g>
          ))}
          {points.map((p, i) =>
            i % labelEvery === 0 ? (
              <text key={p.day} x={x(i)} y={height - 6} className={s.tick} textAnchor="middle">
                {dayFmt.format(asDate(p.day)).replace('.', '')}
              </text>
            ) : null,
          )}

          {kind === 'area' ? (
            <>
              <path d={area} fill={`url(#fill-${tone})`} />
              <path d={line} className={s.seriesLine} />
              {hovered && hover !== null && (
                <>
                  <line x1={x(hover)} x2={x(hover)} y1={pad.top} y2={y(0)} className={s.crosshair} />
                  <circle cx={x(hover)} cy={y(hovered.value)} r={5} className={s.dot} />
                </>
              )}
            </>
          ) : (
            points.map((p, i) => {
              const h = Math.max(p.value ? 2 : 0, y(0) - y(p.value));
              const bx = x(i) - barW / 2;
              const by = y(0) - h;
              const r = Math.min(4, barW / 2, h);
              return (
                <path
                  key={p.day}
                  className={s.bar}
                  data-dim={hover !== null && hover !== i ? '' : undefined}
                  d={`M${bx},${y(0)}V${by + r}Q${bx},${by} ${bx + r},${by}H${bx + barW - r}Q${bx + barW},${by} ${bx + barW},${by + r}V${y(0)}Z`}
                />
              );
            })
          )}

          <rect
            x={pad.left}
            y={pad.top}
            width={innerW}
            height={innerH}
            fill="transparent"
            onPointerMove={onMove}
            onPointerDown={onMove}
            onPointerLeave={() => setHover(null)}
          />
        </svg>
      )}

      {hovered && hover !== null && (
        <div
          className={s.tooltip}
          style={{ left: Math.min(Math.max(x(hover), 90), w - 90), top: Math.max(0, y(hovered.value) - 12) }}
          role="status"
        >
          <span className={s.tooltipDate}>{capitalize(fullDayFmt.format(asDate(hovered.day)))}</span>
          <span className={s.tooltipRow}>
            <i className={s.swatch} aria-hidden="true" />
            <b>{fmt.format(hovered.value)}</b> {label.toLowerCase()}
          </span>
          {hovered.extra?.map((e) => (
            <span key={e.label} className={s.tooltipRow} data-muted>
              {fmt.format(e.value)} {e.label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

/** Ranked horizontal bars: the label sits above its bar, value on the right. */
export function BarList({ rows, total, empty = 'Sem dados no período.', format }: { rows: { label: string; value: number; hint?: string }[]; total?: number; empty?: string; format?: (v: number) => string }) {
  if (!rows.length) return <p className={s.empty}>{empty}</p>;
  const max = Math.max(...rows.map((r) => r.value), 1);
  const base = total ?? rows.reduce((a, r) => a + r.value, 0);
  return (
    <ul className={s.barList}>
      {rows.map((r) => (
        <li key={r.label} className={s.barRow}>
          <div className={s.barText}>
            <span className={s.barLabel} title={r.label}>
              {r.label}
            </span>
            <span className={s.barValue}>
              {format ? format(r.value) : fmt.format(r.value)}
              {base > 0 && <span className={s.barPct}>{Math.round((r.value / base) * 100)}%</span>}
            </span>
          </div>
          <span className={s.barTrack} aria-hidden="true">
            <span className={s.barFill} style={{ width: `${(r.value / max) * 100}%` }} />
          </span>
          {r.hint && <span className={s.barHint}>{r.hint}</span>}
        </li>
      ))}
    </ul>
  );
}

/** 24 small columns, one per hour of the day. */
export function HourStrip({ hours }: { hours: { label: string; value: number }[] }) {
  const byHour = new Map(hours.map((h) => [Number(h.label), h.value]));
  const values = Array.from({ length: 24 }, (_, h) => byHour.get(h) ?? 0);
  const max = Math.max(...values, 1);
  const peak = values.indexOf(Math.max(...values));
  if (!hours.length) return <p className={s.empty}>Sem dados no período.</p>;
  return (
    <div>
      <div className={s.hours} role="img" aria-label={`Visitas por hora do dia. Pico às ${peak}h.`}>
        {values.map((v, h) => (
          <span key={h} className={s.hour} data-peak={h === peak || undefined} title={`${h}h: ${fmt.format(v)} visualizações`}>
            <span style={{ height: `${Math.max(v ? 6 : 2, (v / max) * 100)}%` }} />
          </span>
        ))}
      </div>
      <div className={s.hourAxis} aria-hidden="true">
        <span>0h</span>
        <span>6h</span>
        <span>12h</span>
        <span>18h</span>
        <span>23h</span>
      </div>
      <p className={s.hint}>
        Pico às <b>{peak}h</b> (horário de Brasília).
      </p>
    </div>
  );
}
