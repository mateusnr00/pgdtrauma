import type { SiteContent } from '@/content/schema';
import s from './Stats.module.css';

type Totals = { chapters: string; modules: string; authors: string };

/** Numbers are counted from the table of contents unless overridden in the admin. */
export function Stats({ content: c, totals }: { content: SiteContent['stats']; totals: Totals }) {
  return (
    <section id="numeros" className={`tone-bridge bridge-from-dark ${s.section}`} data-tone="light" aria-labelledby="stats-title">
      <div className="container">
        <div className={s.head}>
          <p className="kicker" data-reveal>
            {c.kicker}
          </p>
          <h2 id="stats-title" className={s.title} data-reveal style={{ '--delay': '80ms' } as React.CSSProperties}>
            {c.title}
          </h2>
        </div>

        <dl className={s.grid}>
          <div className={s.hero} data-reveal>
            <dt className={s.label}>{c.chaptersLabel}</dt>
            <dd className={s.bigNumber}>{totals.chapters}</dd>
          </div>
          <div className={s.side}>
            <div className={s.item} data-reveal style={{ '--delay': '120ms' } as React.CSSProperties}>
              <dt className={s.label}>{c.modulesLabel}</dt>
              <dd className={s.number}>{totals.modules}</dd>
            </div>
            <div className={s.item} data-reveal style={{ '--delay': '220ms' } as React.CSSProperties}>
              <dt className={s.label}>{c.authorsLabel}</dt>
              <dd className={s.number}>{totals.authors}</dd>
            </div>
            <div className={s.item} data-reveal style={{ '--delay': '320ms' } as React.CSSProperties}>
              <dt className={s.label}>{c.editionLabel}</dt>
              <dd className={s.word}>{c.editionWord}</dd>
            </div>
          </div>
        </dl>
      </div>
    </section>
  );
}
