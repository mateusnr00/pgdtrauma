'use client';

import { useCallback, useEffect, useRef } from 'react';
import { getImageProps } from 'next/image';
import type { SiteContent } from '@/content/schema';
import { clamp01, easeInOutCubic, easeOutCubic, usePrefersReducedMotion, useScrollProgress } from '@/lib/motion';
import { Orbits } from './Orbits';
import s from './Hero.module.css';


export function Hero({ content: c }: { content: SiteContent['hero'] }) {
  const ref = useRef<HTMLElement>(null);
  const reduced = usePrefersReducedMotion();

  const write = useCallback((el: HTMLElement, p: number) => {
    // 0 → .72: the book rises and grows while the title recedes; .72 → 1: the credit settles in.
    const rise = easeInOutCubic(clamp01(p / 0.72));
    el.style.setProperty('--rise', rise.toFixed(4));
    const fade = easeOutCubic(clamp01(p / 0.4));
    el.style.setProperty('--fade', fade.toFixed(4));
    el.toggleAttribute('data-faded', fade > 0.98);
    el.style.setProperty('--credit', easeOutCubic(clamp01((p - 0.62) / 0.3)).toFixed(4));
  }, []);
  useScrollProgress(ref, write, { disabled: reduced });

  // Start the book just below the copy, whatever the screen height, so it never covers the CTAs.
  const copyRef = useRef<HTMLDivElement>(null);
  const bookRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const hero = ref.current, copyEl = copyRef.current, bookEl = bookRef.current;
    if (!hero || !copyEl || !bookEl || reduced) return;
    const place = () => {
      const stage = copyEl.parentElement as HTMLElement;
      const styles = getComputedStyle(hero);
      const fromScale = parseFloat(styles.getPropertyValue('--from-s')) || 0.75;
      const stageH = stage.clientHeight;
      const copyBottom = copyEl.offsetTop + copyEl.offsetHeight;
      const bookH = bookEl.offsetHeight;
      const centre = bookEl.offsetTop; // top: N% of the stage; translate(-50%) centres on it
      const gap = Math.max(24, stageH * 0.04);
      const fromY = copyBottom + gap + (fromScale * bookH) / 2 - centre;
      hero.style.setProperty('--from-y', `${Math.max(0, Math.round(fromY))}px`);
    };
    place();
    const ro = new ResizeObserver(place);
    ro.observe(copyEl);
    ro.observe(hero);
    window.addEventListener('resize', place);
    document.fonts?.ready.then(place);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', place);
    };
  }, [reduced]);

  const common = { quality: 85, fetchPriority: 'high' as const, loading: 'eager' as const };
  const desktop = getImageProps({ ...common, ...c.imageDesktop, sizes: '(max-width: 767px) 78vw, min(92vw, 1320px)' }).props;
  const mobile = getImageProps({ ...common, ...c.imageMobile, sizes: '(max-width: 767px) 78vw, 1px' }).props;

  return (
    <section ref={ref} id="topo" className={s.hero} data-tone="dark" aria-labelledby="hero-title">
      <div className={s.stage}>
        <div className={s.light} aria-hidden="true" />
        <Orbits className={s.orbits} />

        <div ref={copyRef} className={`container ${s.copy}`}>
          <p className={s.eyebrow}>
            {c.eyebrowLeft && <span>{c.eyebrowLeft}</span>}
            {c.eyebrowLeft && c.eyebrowRight && <span className={s.dot} aria-hidden="true" />}
            {c.eyebrowRight && <span>{c.eyebrowRight}</span>}
          </p>
          <h1 id="hero-title" className={s.title}>
            <span className={s.line}>
              <span>{c.titleLine1}</span>
            </span>
            <span className={s.line}>
              <span>
                {c.titleLine2Prefix} <em className={s.gold}>{c.titleLine2Accent}</em>
              </span>
            </span>
          </h1>
          {c.lede && <p className={s.lede}>{c.lede}</p>}
          <div className={s.actions}>
            <a href="#obra" className="btn">
              {c.primaryCta}
            </a>
            <a href="#conteudo" className="link-cta">
              {c.secondaryCta} <span className="btn-arrow" aria-hidden="true">→</span>
            </a>
          </div>
        </div>

        <div ref={bookRef} className={s.bookWrap}>
          <picture className={s.book}>
            <source media="(max-width: 767px)" srcSet={mobile.srcSet} sizes={mobile.sizes} width={mobile.width} height={mobile.height} />
            <img {...desktop} alt={c.imageDesktop.alt} className={s.bookImg} />
          </picture>
          <div className={s.floor} aria-hidden="true" />
        </div>

        <div className={`container ${s.credit}`} aria-hidden="true">
          <span>{c.creditLeft}</span>
          <span>{c.creditRight}</span>
        </div>

        <div className={s.cue} aria-hidden="true">
          <span />
        </div>
      </div>
    </section>
  );
}
