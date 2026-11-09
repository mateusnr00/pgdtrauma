'use client';

import { useEffect, useRef, useState } from 'react';
import type { SiteContent } from '@/content/schema';
import s from './Header.module.css';

export function Header({ content, purchaseUrl }: { content: SiteContent['header']; purchaseUrl: string }) {
  const links = content.nav;
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<string | null>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const purchaseHref = purchaseUrl || '#adquirir';
  const external = Boolean(purchaseUrl);

  useEffect(() => {
    let frame = 0;
    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        setScrolled(window.scrollY > 24);
      });
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(frame);
    };
  }, []);

  // Highlight the section currently in the middle of the viewport.
  useEffect(() => {
    const linked = new Set(content.nav.map((l) => l.href));
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          const id = `#${e.target.id}`;
          setActive(linked.has(id) ? id : null);
        }
      },
      { rootMargin: '-45% 0px -50% 0px' },
    );
    document.querySelectorAll<HTMLElement>('main > [id]').forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [content.nav]);

  // Mobile menu: lock scroll, close on Escape, return focus to the toggle.
  useEffect(() => {
    if (!open) return;
    const root = document.documentElement;
    root.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        toggleRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => {
      root.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const close = () => setOpen(false);

  return (
    <header className={`site-header ${s.header}`} data-scrolled={scrolled || undefined} data-open={open || undefined}>
      <div className={`container ${s.bar}`}>
        <a href="#topo" className={s.brand} onClick={close} aria-label={`${content.brandLight}${content.brandStrong}`.trim()}>
          <span className={s.brandMark} aria-hidden="true" />
          <span className={s.brandText}>
            <span className={s.brandLight}>{content.brandLight}</span>
            <span className={s.brandStrong}>{content.brandStrong}</span>
          </span>
        </a>

        <nav className={s.nav} aria-label="Seções">
          <ul className={s.navList}>
            {links.map((l) => (
              <li key={`${l.href}-${l.label}`}>
                <a href={l.href} className={s.navLink} aria-current={active === l.href ? 'location' : undefined}>
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <a
          href={purchaseHref}
          className={`btn ${s.cta}`}
          {...(external ? { target: '_blank', rel: 'noopener' } : {})}
        >
          {content.cta}
        </a>

        <button
          ref={toggleRef}
          type="button"
          className={s.toggle}
          aria-expanded={open}
          aria-controls="menu-mobile"
          onClick={() => setOpen((v) => !v)}
        >
          <span className="sr-only">{open ? content.menuClose : content.menuOpen}</span>
          <span className={s.toggleLine} aria-hidden="true" />
          <span className={s.toggleLine} aria-hidden="true" />
        </button>
      </div>

      <div id="menu-mobile" className={s.sheet} hidden={!open}>
        <nav aria-label="Seções" className="container">
          <ul className={s.sheetList}>
            {links.map((l, i) => (
              <li key={`${l.href}-${l.label}`} style={{ '--i': i } as React.CSSProperties}>
                <a href={l.href} onClick={close} className={s.sheetLink}>
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
          <a
            href={purchaseHref}
            onClick={close}
            className={`btn ${s.sheetCta}`}
            {...(external ? { target: '_blank', rel: 'noopener' } : {})}
          >
            {content.cta} <span className="btn-arrow" aria-hidden="true">→</span>
          </a>
        </nav>
      </div>
    </header>
  );
}
