import 'server-only';
import { d1, d1Ready, type D1Param as Param, type D1Row as Row } from '@/lib/d1';


/**
 * First-party, cookie-light analytics stored in Cloudflare D1 (SQLite), reached through the
 * Cloudflare HTTP API. Every page view, section reached and click is one row. No IP is stored;
 * visitors are an anonymous random id kept in a first-party cookie.
 *
 * Configure CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_D1_DATABASE_ID and CLOUDFLARE_D1_TOKEN (a token with
 * only "D1: Edit"). Without them, tracking is a no-op and the dashboard explains the setup.
 */

export const EVENT_TYPES = ['view', 'section', 'click', 'purchase'] as const;
export type EventType = (typeof EVENT_TYPES)[number];

export type TrackEvent = {
  type: EventType;
  name?: string;
  path?: string;
  visitor?: string;
  session?: string;
  referrer?: string;
  source?: string;
  medium?: string;
  campaign?: string;
  device?: string;
  country?: string;
};

/** Brasília has no daylight saving time: a fixed UTC-3 offset, in seconds. */
const TZ_OFFSET = -3 * 3600;
const LOCAL = `(at / 1000 + ${TZ_OFFSET})`;

export const analyticsReady = d1Ready;
const query = d1;

/** Creates the table on first use, so the only setup is the three environment variables. */
const g = globalThis as unknown as { __pgtSchema?: Promise<unknown> };
async function ready() {
  g.__pgtSchema ??= query(
    `create table if not exists events (
      id integer primary key autoincrement,
      at integer not null,
      type text not null,
      name text not null default '',
      path text, visitor text, session text, referrer text,
      source text, medium text, campaign text, device text, country text
    );
    create index if not exists events_at on events (at);
    create index if not exists events_type_at on events (type, at);`,
  ).catch((error) => {
    g.__pgtSchema = undefined;
    throw error;
  });
  await g.__pgtSchema;
}

const clip = (v: unknown, max = 200): string | null => (typeof v === 'string' && v.trim() ? v.trim().slice(0, max) : null);

const COLUMNS = ['at', 'type', 'name', 'path', 'visitor', 'session', 'referrer', 'source', 'medium', 'campaign', 'device', 'country'];

/** Stores one or more events in a single request. */
export async function record(events: TrackEvent | TrackEvent[]) {
  const list = (Array.isArray(events) ? events : [events]).slice(0, 20);
  if (!analyticsReady() || !list.length) return;
  await ready();
  const now = Date.now();
  const params: Param[] = [];
  for (const e of list) {
    params.push(
      now,
      e.type,
      clip(e.name, 120) ?? '',
      clip(e.path),
      clip(e.visitor, 64),
      clip(e.session, 64),
      clip(e.referrer),
      clip(e.source, 80),
      clip(e.medium, 80),
      clip(e.campaign, 120),
      clip(e.device, 16),
      clip(e.country, 4),
    );
  }
  const row = `(${COLUMNS.map(() => '?').join(', ')})`;
  await query(`insert into events (${COLUMNS.join(', ')}) values ${list.map(() => row).join(', ')}`, params);
}

/* ------------------------------------------------------------------ */
/* Dashboard                                                           */
/* ------------------------------------------------------------------ */

export type Totals = { visitors: number; views: number; sessions: number; purchases: number; buyers: number };
export type DayRow = { day: string; visitors: number; views: number; purchases: number };
export type Ranked = { label: string; value: number };

export type Report = {
  days: number;
  current: Totals;
  previous: Totals;
  live: number;
  daily: DayRow[];
  sections: Ranked[];
  positions: Ranked[];
  sources: Ranked[];
  devices: Ranked[];
  countries: Ranked[];
  clicks: Ranked[];
  hours: Ranked[];
};

const n = (v: unknown) => Number(v ?? 0);
const ranked = (rows: Row[]): Ranked[] => rows.map((r) => ({ label: String(r.label ?? ''), value: n(r.value) }));

async function totals(from: number, to: number): Promise<Totals> {
  const [r] = await query(
    `select
      count(distinct case when type = 'view' then visitor end) as visitors,
      sum(type = 'view') as views,
      count(distinct case when type = 'view' then session end) as sessions,
      sum(type = 'purchase') as purchases,
      count(distinct case when type = 'purchase' then visitor end) as buyers
    from events where at >= ? and at < ?`,
    [from, to],
  );
  return { visitors: n(r?.visitors), views: n(r?.views), sessions: n(r?.sessions), purchases: n(r?.purchases), buyers: n(r?.buyers) };
}

/** Local (Brasília) calendar day of a timestamp, as YYYY-MM-DD. */
const localDay = (ms: number) => new Date(ms + TZ_OFFSET * 1000).toISOString().slice(0, 10);

function hostOf(url: string) {
  const m = url.match(/^https?:\/\/([^/:?#]+)/i);
  return m ? m[1].toLowerCase().replace(/^(www\.|m\.|l\.|lm\.)/, '') : '';
}

export async function report(days: number): Promise<Report> {
  await ready();
  const to = Date.now();
  const from = to - days * 86_400_000;
  const prevFrom = to - 2 * days * 86_400_000;
  const range = [from, to];

  const [current, previous, liveRows, dailyRows, sections, positions, sourceRows, devices, countries, clicks, hours] = await Promise.all([
    totals(from, to),
    totals(prevFrom, from),
    query(`select count(distinct visitor) as value from events where at > ?`, [to - 30 * 60_000]),
    query(
      `select date(${LOCAL}, 'unixepoch') as day,
        count(distinct case when type = 'view' then visitor end) as visitors,
        sum(type = 'view') as views,
        sum(type = 'purchase') as purchases
      from events where at >= ? and at < ? group by day`,
      range,
    ),
    query(`select name as label, count(distinct visitor) as value from events where type = 'section' and at >= ? and at < ? group by name`, range),
    query(
      `select coalesce(nullif(name, ''), 'outro') as label, count(*) as value from events
      where type = 'purchase' and at >= ? and at < ? group by label order by value desc`,
      range,
    ),
    query(
      `select coalesce(source, '') as source, coalesce(referrer, '') as referrer, count(distinct visitor) as value
      from events where type = 'view' and at >= ? and at < ? group by 1, 2`,
      range,
    ),
    query(
      `select coalesce(device, 'desconhecido') as label, count(distinct visitor) as value from events
      where type = 'view' and at >= ? and at < ? group by label order by value desc`,
      range,
    ),
    query(
      `select coalesce(country, '??') as label, count(distinct visitor) as value from events
      where type = 'view' and at >= ? and at < ? group by label order by value desc limit 6`,
      range,
    ),
    query(
      `select name as label, count(*) as value from events
      where type = 'click' and at >= ? and at < ? group by name order by value desc limit 10`,
      range,
    ),
    query(
      `select cast(strftime('%H', ${LOCAL}, 'unixepoch') as integer) as label, count(*) as value from events
      where type = 'view' and at >= ? and at < ? group by label order by label`,
      range,
    ),
  ]);

  // Every day of the period, including days without visits.
  const byDay = new Map(dailyRows.map((r) => [String(r.day), r]));
  const daily: DayRow[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const day = localDay(to - i * 86_400_000);
    const r = byDay.get(day);
    daily.push({ day, visitors: n(r?.visitors), views: n(r?.views), purchases: n(r?.purchases) });
  }

  // Origin: the campaign tag when there is one, else the referring site, else "Direto".
  const sourceTotals = new Map<string, number>();
  for (const r of sourceRows) {
    const label = String(r.source || '') || hostOf(String(r.referrer || '')) || 'Direto';
    sourceTotals.set(label, (sourceTotals.get(label) ?? 0) + n(r.value));
  }
  const sources = [...sourceTotals].map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value).slice(0, 8);

  return {
    days,
    current,
    previous,
    live: n(liveRows[0]?.value),
    daily,
    sections: ranked(sections),
    positions: ranked(positions),
    sources,
    devices: ranked(devices),
    countries: ranked(countries),
    clicks: ranked(clicks),
    hours: ranked(hours),
  };
}

/** Wipes every recorded event (used by the "zerar métricas" button). */
export async function resetAnalytics() {
  await ready();
  await query('delete from events');
}
