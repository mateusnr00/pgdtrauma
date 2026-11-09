'use client';

import { useEffect, useRef, useState } from 'react';
import type { AuthorEntry } from '@/content/derive';
import { fill } from '@/content/derive';
import type { SiteContent } from '@/content/schema';
import s from './Contributors.module.css';

type Props = {
  content: SiteContent['contributors'];
  /** Everyone who signs a chapter, from the table of contents. */
  authors: AuthorEntry[];
  /** Lede with {autores}/{capitulos} already filled in. */
  lede: string;
  total: string;
};

export function Contributors({ content: c, authors, lede, total }: Props) {
  const featured = c.featured.filter((n) => n.trim());
  const others = Math.max(0, Number(total) - featured.length);
  const groups = authors.reduce<Record<string, AuthorEntry[]>>((acc, a) => {
    const letter = a.name[0].normalize('NFD').replace(/\p{Diacritic}/gu, '').toUpperCase();
    (acc[letter] ??= []).push(a);
    return acc;
  }, {});

  const dialogRef = useRef<HTMLDialogElement>(null);
  const [closing, setClosing] = useState(false);

  const openDrawer = () => {
    dialogRef.current?.showModal();
    document.documentElement.style.overflow = 'hidden';
  };

  // However the dialog closes (button, Escape, backdrop), release the scroll lock. Idempotent.
  const onClosed = () => {
    setClosing(false);
    document.documentElement.style.overflow = '';
  };

  const closeDrawer = () => requestClose(dialogRef.current, setClosing, onClosed);

  // Safety net: never leave the page scroll-locked if the component unmounts while open.
  useEffect(() => () => void (document.documentElement.style.overflow = ''), []);

  return (
    <section id="autores" className={s.section} data-tone="dark" aria-labelledby="contributors-title">
      <div className="container">
        <div className={s.head}>
          <p className="kicker" data-reveal>
            {c.kicker}
          </p>
          <h2 id="contributors-title" className={s.title} data-reveal style={{ '--delay': '80ms' } as React.CSSProperties}>
            {c.title}
          </h2>
          <p className={s.lede} data-reveal style={{ '--delay': '160ms' } as React.CSSProperties}>
            {lede}
          </p>
        </div>

        <ul className={s.names} aria-label="Alguns dos autores">
          {featured.map((n, i) => (
            <li key={`${i}-${n}`} className={s.nameItem} data-reveal="fade" style={{ '--delay': `${i * 45}ms` } as React.CSSProperties}>
              {n}
            </li>
          ))}
          {others > 0 && (
            <li className={s.nameItem} data-reveal="fade">
              <button type="button" className={s.more} onClick={openDrawer} aria-haspopup="dialog">
                {fill(c.othersLabel, { n: others })}
              </button>
            </li>
          )}
        </ul>

        <button type="button" className={`btn ${s.cta}`} onClick={openDrawer} aria-haspopup="dialog" data-reveal>
          {c.button} <span className="btn-arrow" aria-hidden="true">→</span>
        </button>
      </div>

      <dialog
        ref={dialogRef}
        className={s.drawer}
        data-closing={closing || undefined}
        aria-labelledby="drawer-title"
        onClose={onClosed}
        onCancel={(e) => {
          // Escape: animate out instead of the abrupt native close.
          e.preventDefault();
          closeDrawer();
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget) closeDrawer();
        }}
      >
        <div className={s.drawerInner}>
          <header className={s.drawerHead}>
            <div>
              <p className="kicker">{c.drawerKicker}</p>
              <h3 id="drawer-title" className={s.drawerTitle}>
                {fill(c.drawerTitle, { n: total })}
              </h3>
            </div>
            <button type="button" className={s.close} onClick={closeDrawer}>
              <span className="sr-only">{c.close}</span>
              <span aria-hidden="true" />
            </button>
          </header>

          <div className={s.drawerBody}>
            {Object.entries(groups).map(([letter, list]) => (
              <section key={letter} className={s.letterGroup} aria-label={`Letra ${letter}`}>
                <p className={s.letter} aria-hidden="true">
                  {letter}
                </p>
                <ul>
                  {list.map((a) => (
                    <li key={a.name} className={s.author}>
                      <span className={s.authorName}>{a.name}</span>
                      <span className={s.authorChapters}>
                        {a.chapters.length > 1 ? c.chapterPlural : c.chapterSingular} {a.chapters.join(', ')}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        </div>
      </dialog>
    </section>
  );
}

/** Matches --d-2, the drawer's exit animation. */
const EXIT_MS = 450;

/**
 * Animate the drawer out, then close it. A timer (not animationend) guarantees the close
 * even when animations are throttled or skipped.
 */
function requestClose(dialog: HTMLDialogElement | null, setClosing: (v: boolean) => void, done: () => void) {
  if (!dialog?.open || dialog.hasAttribute('data-closing')) return;
  const finish = () => {
    dialog.close();
    done();
  };
  if (document.documentElement.classList.contains('rm')) return finish();
  setClosing(true);
  window.setTimeout(finish, EXIT_MS);
}
