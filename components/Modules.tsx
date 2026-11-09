'use client';

import { useState } from 'react';
import type { SiteContent } from '@/content/schema';
import s from './Modules.module.css';

export function Modules({ content: c, lede }: { content: SiteContent['modules']; lede: string }) {
  const modules = c.list;
  const [open, setOpen] = useState<Set<number>>(() => new Set());

  const toggle = (i: number) =>
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });

  const allOpen = open.size === modules.length;

  return (
    <section id="conteudo" className={s.section} data-tone="light" aria-labelledby="modules-title">
      <div className={`container ${s.layout}`}>
        <header className={s.head}>
          <p className="kicker" data-reveal>
            {c.kicker}
          </p>
          <h2 id="modules-title" className={s.title} data-reveal style={{ '--delay': '80ms' } as React.CSSProperties}>
            {c.title}
          </h2>
          <p className={s.lede} data-reveal style={{ '--delay': '160ms' } as React.CSSProperties}>
            {lede}
          </p>
          <button
            type="button"
            className={`link-cta ${s.all}`}
            onClick={() => setOpen(allOpen ? new Set() : new Set(modules.map((_, i) => i)))}
            data-reveal
            data-track={allOpen ? 'sumario:recolher-todos' : 'sumario:abrir-todos'}
          >
            {allOpen ? c.collapseAll : c.expandAll}
          </button>
        </header>

        <ol className={s.list}>
          {modules.map((m, i) => {
            const isOpen = open.has(i);
            const first = m.chapters[0]?.number;
            const last = m.chapters[m.chapters.length - 1]?.number;
            const id = `modulo-${i + 1}`;
            return (
              <li key={i} className={s.module} data-open={isOpen || undefined} data-reveal style={{ '--delay': `${i * 70}ms` } as React.CSSProperties}>
                <h3 className={s.moduleHeading}>
                  <button
                    type="button"
                    className={s.trigger}
                    aria-expanded={isOpen}
                    aria-controls={id}
                    id={`${id}-btn`}
                    onClick={() => toggle(i)}
                    data-track={isOpen ? undefined : `sumario:modulo-${m.numeral || i + 1}`}
                  >
                    <span className={s.numeral}>
                      <span className="sr-only">Módulo </span>
                      {m.numeral}
                    </span>
                    <span className={s.moduleTitle}>{m.title}</span>
                    <span className={s.meta}>
                      {m.chapters.length} {m.chapters.length === 1 ? c.chapterSingular : c.chapterPlural}
                      {first && (
                        <span className={s.range} aria-hidden="true">
                          {first === last ? `cap. ${first}` : `cap. ${first}–${last}`}
                        </span>
                      )}
                    </span>
                    <span className={s.icon} aria-hidden="true" />
                  </button>
                </h3>
                <div className={s.panel} id={id} role="region" aria-labelledby={`${id}-btn`}>
                  <div className={s.panelInner}>
                    <ol className={s.chapters}>
                      {m.chapters.map((ch, k) => (
                        <li key={k} className={s.chapter}>
                          <span className={s.chapterNumber}>{ch.number.padStart(2, '0')}</span>
                          <div>
                            <p className={s.chapterTitle}>{ch.title}</p>
                            <p className={s.chapterAuthors}>
                              {ch.authors.map((p, j) => (
                                <span key={j}>
                                  {j > 0 && <span className={s.sep}> · </span>}
                                  {p.title && <span className={s.honorific}>{p.title} </span>}
                                  {p.name}
                                  {p.affiliation && <span className={s.affiliation}> {p.affiliation}</span>}
                                </span>
                              ))}
                            </p>
                          </div>
                        </li>
                      ))}
                    </ol>
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
