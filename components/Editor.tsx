import type { SiteContent } from '@/content/schema';
import { Orbits } from './Orbits';
import s from './Editor.module.css';

export function Editor({ content: c }: { content: SiteContent['editor'] }) {
  return (
    <section id="editor" className={`tone-bridge bridge-from-paper ${s.section}`} data-tone="dark" aria-labelledby="editor-title">
      <Orbits className={s.orbits} />
      <div className={`container ${s.layout}`}>
        <p className={`kicker ${s.kicker}`} data-reveal>
          {c.kicker}
        </p>

        <h2 id="editor-title" className={s.name} data-reveal="lines">
          {c.honorific && (
            <span className={`mask-line ${s.honorific}`} style={{ '--i': 0 } as React.CSSProperties}>
              <span className="serif-accent">{c.honorific}</span>
            </span>
          )}
          <span className="mask-line" style={{ '--i': 1 } as React.CSSProperties}>
            <span>{c.nameLine1}</span>
          </span>
          {c.nameLine2 && (
            <span className="mask-line" style={{ '--i': 2 } as React.CSSProperties}>
              <span>{c.nameLine2}</span>
            </span>
          )}
        </h2>

        <dl className={s.credentials}>
          {c.credentials.map((cr, i) => (
            <div key={i} className={s.credential} data-reveal style={{ '--delay': `${i * 90}ms` } as React.CSSProperties}>
              <dt className={s.term}>{cr.term}</dt>
              <dd className={s.detail}>{cr.detail}</dd>
            </div>
          ))}
        </dl>

        {c.note && (
          <p className={s.note} data-reveal>
            {c.note}
          </p>
        )}
      </div>
    </section>
  );
}
