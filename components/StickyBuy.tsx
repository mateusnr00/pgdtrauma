'use client';

import { useEffect, useState } from 'react';
import type { Media } from '@/content/schema';
import { purchaseLink } from '@/lib/purchase';
import s from './StickyBuy.module.css';

/**
 * Purchase bar that follows the scroll. It appears once the opening screen is behind the reader
 * and steps aside when the closing section (which has its own purchase button) comes into view.
 * Bottom bar on phones, floating card on larger screens.
 */
export function StickyBuy({ label, note, purchaseUrl, cover }: { label: string; note: string; purchaseUrl: string; cover: Media }) {
  const [shown, setShown] = useState(false);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const vh = window.innerHeight;
      const hero = document.getElementById('topo')?.getBoundingClientRect();
      const closing = document.getElementById('adquirir')?.getBoundingClientRect();
      const menuOpen = document.querySelector('.site-header[data-open]') !== null;
      const pastHero = hero ? hero.bottom < vh * 0.35 : window.scrollY > vh;
      const beforeClosing = closing ? closing.top > vh * 0.85 : true;
      setShown(pastHero && beforeClosing && !menuOpen);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    // The mobile menu toggles a data attribute on the header: follow it too.
    const header = document.querySelector('.site-header');
    const mo = header ? new MutationObserver(onScroll) : null;
    if (header) mo?.observe(header, { attributes: true, attributeFilter: ['data-open'] });
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      mo?.disconnect();
      cancelAnimationFrame(frame);
    };
  }, []);

  const external = Boolean(purchaseUrl);

  return (
    <aside className={s.bar} data-shown={shown || undefined} aria-label="Comprar o livro" inert={!shown}>
      <div className={s.inner}>
        {cover.src && (
          // eslint-disable-next-line @next/next/no-img-element -- tiny decorative thumbnail, already optimised upstream
          <img src={cover.src} alt="" width={cover.width} height={cover.height} className={s.cover} loading="lazy" decoding="async" />
        )}
        {note && <p className={s.note}>{note}</p>}
        <a href={purchaseLink(purchaseUrl, 'flutuante')} className={`btn ${s.button}`} {...(external ? { target: '_blank', rel: 'noopener' } : {})}>
          {label} <span className="btn-arrow" aria-hidden="true">→</span>
        </a>
      </div>
    </aside>
  );
}
