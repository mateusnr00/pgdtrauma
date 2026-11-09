import 'server-only';
import postgres from 'postgres';

/**
 * First-party, cookie-light analytics. Every page view, section reached and click lands as one
 * row in Postgres (any provider: Neon, Supabase, Vercel Postgres…). No IP is stored; visitors
 * are an anonymous random id kept in a first-party cookie.
 *
 * Configure with DATABASE_URL (or POSTGRES_URL). Without it, tracking is a no-op and the
 * dashboard explains how to connect a database.
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

const TZ = 'America/Sao_Paulo';

const connectionString = () => process.env.DATABASE_URL || process.env.POSTGRES_URL || '';
export const analyticsReady = () => Boolean(connectionString());

type Sql = ReturnType<typeof postgres>;
const g = globalThis as unknown as { __pgtSql?: Sql; __pgtSchema?: Promise<unknown> };

function db(): Sql {
  if (!g.__pgtSql) {
    g.__pgtSql = postgres(connectionString(), {
      max: 3,
      idle_timeout: 20,
      connect_timeout: 10,
      // Poolers in transaction mode (Supabase :6543, Neon -pooler) don't support prepared statements.
      prepare: false,
      onnotice: () => {},
    });
  }
  return g.__pgtSql;
}

/** Creates the table on first use, so connecting a database is the only setup step. */
async function ready(): Promise<Sql> {
  const sql = db();
  g.__pgtSchema ??= sql`
    create table if not exists pgt_events (
      id bigserial primary key,
      at timestamptz not null default now(),
      type text not null,
      name text not null default '',
      path text,
      visitor text,
      session text,
      referrer text,
      source text,
      medium text,
      campaign text,
      device text,
      country text
    );
    create index if not exists pgt_events_at on pgt_events (at);
    create index if not exists pgt_events_type_at on pgt_events (type, at);
  `
    .simple()
    .catch((error) => {
      g.__pgtSchema = undefined;
      throw error;
    });
  await g.__pgtSchema;
  return sql;
}

const clip = (v: unknown, max = 200) => (typeof v === 'string' && v.trim() ? v.trim().slice(0, max) : null);

export async function record(e: TrackEvent) {
  if (!analyticsReady()) return;
  const sql = await ready();
  await sql`
    insert into pgt_events (type, name, path, visitor, session, referrer, source, medium, campaign, device, country)
    values (
      ${e.type}, ${clip(e.name, 120) ?? ''}, ${clip(e.path)}, ${clip(e.visitor, 64)}, ${clip(e.session, 64)},
      ${clip(e.referrer)}, ${clip(e.source, 80)}, ${clip(e.medium, 80)}, ${clip(e.campaign, 120)},
      ${clip(e.device, 16)}, ${clip(e.country, 4)}
    )
  `;
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

async function totals(sql: Sql, from: string, to: string): Promise<Totals> {
  const [r] = await sql`
    select
      count(distinct visitor) filter (where type = 'view') as visitors,
      count(*) filter (where type = 'view') as views,
      count(distinct session) filter (where type = 'view') as sessions,
      count(*) filter (where type = 'purchase') as purchases,
      count(distinct visitor) filter (where type = 'purchase') as buyers
    from pgt_events
    where at >= ${from}::timestamptz and at < ${to}::timestamptz
  `;
  return { visitors: n(r.visitors), views: n(r.views), sessions: n(r.sessions), purchases: n(r.purchases), buyers: n(r.buyers) };
}

const ranked = (rows: Record<string, unknown>[]): Ranked[] => rows.map((r) => ({ label: String(r.label ?? ''), value: n(r.value) }));

export async function report(days: number): Promise<Report> {
  const sql = await ready();
  const now = new Date();
  const to = now.toISOString();
  const from = new Date(now.getTime() - days * 86_400_000).toISOString();
  const prevFrom = new Date(now.getTime() - 2 * days * 86_400_000).toISOString();
  const range = sql`at >= ${from}::timestamptz and at < ${to}::timestamptz`;

  const [current, previous, liveRows, daily, sections, positions, sources, devices, countries, clicks, hours] = await Promise.all([
    totals(sql, from, to),
    totals(sql, prevFrom, from),
    sql`select count(distinct visitor) as value from pgt_events where at > now() - interval '30 minutes'`,
    sql`
      with days as (
        select generate_series(
          (now() at time zone ${TZ})::date - (${days}::int - 1),
          (now() at time zone ${TZ})::date,
          interval '1 day'
        )::date as day
      )
      select to_char(d.day, 'YYYY-MM-DD') as day,
        count(distinct e.visitor) filter (where e.type = 'view') as visitors,
        count(e.id) filter (where e.type = 'view') as views,
        count(e.id) filter (where e.type = 'purchase') as purchases
      from days d
      left join pgt_events e on (e.at at time zone ${TZ})::date = d.day and e.at >= ${from}::timestamptz
      group by d.day order by d.day
    `,
    sql`select name as label, count(distinct visitor) as value from pgt_events where type = 'section' and ${range} group by name`,
    sql`select coalesce(nullif(name, ''), 'outro') as label, count(*) as value from pgt_events where type = 'purchase' and ${range} group by 1 order by 2 desc`,
    sql`
      select label, count(distinct visitor) as value from (
        select visitor,
          coalesce(
            nullif(source, ''),
            nullif(regexp_replace(substring(referrer from '^https?://([^/:?#]+)'), '^(www\\.|m\\.|l\\.|lm\\.)', ''), ''),
            'Direto'
          ) as label
        from pgt_events where type = 'view' and ${range}
      ) t group by label order by 2 desc limit 8
    `,
    sql`select coalesce(device, 'desconhecido') as label, count(distinct visitor) as value from pgt_events where type = 'view' and ${range} group by 1 order by 2 desc`,
    sql`select coalesce(country, '??') as label, count(distinct visitor) as value from pgt_events where type = 'view' and ${range} group by 1 order by 2 desc limit 6`,
    sql`select name as label, count(*) as value from pgt_events where type = 'click' and ${range} group by name order by 2 desc limit 10`,
    sql`
      select extract(hour from at at time zone ${TZ})::int as label, count(*) as value
      from pgt_events where type = 'view' and ${range} group by 1 order by 1
    `,
  ]);

  return {
    days,
    current,
    previous,
    live: n(liveRows[0]?.value),
    daily: daily.map((r) => ({ day: String(r.day), visitors: n(r.visitors), views: n(r.views), purchases: n(r.purchases) })),
    sections: ranked(sections),
    positions: ranked(positions),
    sources: ranked(sources),
    devices: ranked(devices),
    countries: ranked(countries),
    clicks: ranked(clicks),
    hours: ranked(hours),
  };
}

/** Wipes every recorded event (used by the "zerar dados" button). */
export async function resetAnalytics() {
  const sql = await ready();
  await sql`truncate pgt_events`;
}
