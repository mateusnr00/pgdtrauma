import type { SiteContent } from '@/content/schema';
import s from './Opening.module.css';

export function Opening({ content: c }: { content: SiteContent['opening'] }) {
  return (
    <section id="visao" className={s.section} data-tone="dark" aria-labelledby="opening-title">
      <div className="container">
        <h2 id="opening-title" className={s.title} data-reveal="lines">
          <span className="mask-line" style={{ '--i': 0 } as React.CSSProperties}>
            <span>{c.titleLine1}</span>
          </span>
          {c.titleLine2 && (
            <span className={`mask-line ${s.second}`} style={{ '--i': 1 } as React.CSSProperties}>
              <span className="serif-accent">{c.titleLine2}</span>
            </span>
          )}
        </h2>

        <div className={s.grid}>
          <p className={s.body} data-reveal>
            {c.body}
          </p>

          <div className={s.index}>
            {c.indexLabel && (
              <p className={s.indexLabel} data-reveal>
                {c.indexLabel}
              </p>
            )}
            <ol className={s.pillars}>
              {c.pillars.map((p, i) => (
                <li key={`${i}-${p}`} className={s.pillar} data-reveal style={{ '--delay': `${i * 90}ms` } as React.CSSProperties}>
                  <span className={s.num} aria-hidden="true">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span className={s.pillarText}>{p}</span>
                </li>
              ))}
            </ol>
            {c.note && (
              <p className={`serif-accent ${s.note}`} data-reveal>
                {c.note}
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
