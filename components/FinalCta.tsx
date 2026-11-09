'use client';

import { useCallback, useRef } from 'react';
import Image from 'next/image';
import type { SiteContent } from '@/content/schema';
import { purchaseLink } from '@/lib/purchase';
import { usePrefersReducedMotion, useScrollProgress } from '@/lib/motion';
import s from './FinalCta.module.css';

export function FinalCta({ content: c, purchaseUrl }: { content: SiteContent['closing']; purchaseUrl: string }) {
  const ref = useRef<HTMLElement>(null);
  const reduced = usePrefersReducedMotion();
  const write = useCallback((el: HTMLElement, p: number) => el.style.setProperty('--p', p.toFixed(4)), []);
  useScrollProgress(ref, write, { mode: 'pass', disabled: reduced });

  return (
    <section ref={ref} id="adquirir" className={s.section} data-tone="dark" aria-labelledby="final-title">
      <div className={s.light} aria-hidden="true" />
      <div className={`container ${s.layout}`}>
        <div className={s.bookWrap}>
          <Image
            src={c.image.src}
            width={c.image.width}
            height={c.image.height}
            alt={c.image.alt}
            sizes="(max-width: 767px) 64vw, (max-width: 1023px) 44vw, 30vw"
            quality={85}
            className={s.book}
          />
        </div>

        <div className={s.copy}>
          <h2 id="final-title" className={s.title} data-reveal="lines">
            <span className="mask-line">
              <span>{c.title}</span>
            </span>
          </h2>
          <p className={s.body} data-reveal style={{ '--delay': '120ms' } as React.CSSProperties}>
            {c.body}
          </p>
          <div className={s.actions} data-reveal style={{ '--delay': '220ms' } as React.CSSProperties}>
            {purchaseUrl ? (
              <a href={purchaseLink(purchaseUrl, 'final')} className="btn" target="_blank" rel="noopener">
                {c.primaryCta} <span className="btn-arrow" aria-hidden="true">→</span>
              </a>
            ) : (
              <span className="btn" role="link" aria-disabled="true" aria-describedby="purchase-soon">
                {c.primaryCta}
              </span>
            )}
            <a href="#conteudo" className="link-cta">
              {c.secondaryCta} <span className="btn-arrow" aria-hidden="true">→</span>
            </a>
          </div>
          {!purchaseUrl && (
            <p id="purchase-soon" className={s.soon}>
              {c.soon}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
