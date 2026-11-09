import type { SiteContent } from '@/content/schema';
import s from './Audience.module.css';

export function Audience({ content: c }: { content: SiteContent['audience'] }) {
  return (
    <section id="publico" className={s.section} data-tone="light" aria-labelledby="audience-title">
      <div className="container">
        <div className={s.head}>
          <p className="kicker" data-reveal>
            {c.kicker}
          </p>
          <h2 id="audience-title" className={s.title} data-reveal style={{ '--delay': '80ms' } as React.CSSProperties}>
            {c.title}
          </h2>
        </div>

        <ul className={s.groups}>
          {c.groups.map((g, i) => (
            <li key={`${i}-${g}`} className={s.group} data-reveal style={{ '--delay': `${i * 90}ms`, '--i': i } as React.CSSProperties}>
              <span className={s.index} aria-hidden="true">
                {String(i + 1).padStart(2, '0')}
              </span>
              <span className={s.name}>{g}</span>
            </li>
          ))}
        </ul>

        {c.body && (
          <p className={`serif-accent ${s.body}`} data-reveal>
            {c.body}
          </p>
        )}
      </div>
    </section>
  );
}
