'use client';

import { useEffect, useState, type RefObject } from 'react';

export const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
export const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
export const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

/** Mirrors the .rm class that layout.tsx sets on <html> from prefers-reduced-motion. */
export function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const root = document.documentElement;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const forced = /[?&]motion=full/.test(location.search);
    const update = () => {
      const r = mq.matches && !forced;
      root.classList.toggle('rm', r);
      setReduced(r);
    };
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);
  return reduced;
}

/**
 * Writes how far the user has scrolled through `ref` (0 → 1) into CSS custom properties,
 * once per frame and only while the element is near the viewport. All visual work then
 * happens in CSS on transform/opacity.
 *
 * mode "pin":  0 when the element's top hits the viewport top, 1 when its bottom hits the viewport bottom
 *              (for tall sections with a sticky stage).
 * mode "pass": 0 when the element enters from below, 1 when it leaves at the top.
 */
export function useScrollProgress(
  ref: RefObject<HTMLElement | null>,
  write: (el: HTMLElement, p: number) => void,
  { mode = 'pin', disabled = false }: { mode?: 'pin' | 'pass'; disabled?: boolean } = {},
) {
  useEffect(() => {
    const el = ref.current;
    if (!el || disabled) return;

    let frame = 0;
    let idle = 0;
    let active = false;

    const measure = () => {
      frame = 0;
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight;
      const p =
        mode === 'pin'
          ? clamp01(-r.top / Math.max(1, r.height - vh))
          : clamp01((vh - r.top) / Math.max(1, r.height + vh));
      write(el, p);
    };
    const schedule = () => {
      if (!active) return;
      if (!frame) frame = requestAnimationFrame(measure);
      // Flag active scrolling: CSS promotes scaled images to GPU layers only while moving,
      // so they re-rasterise sharp at their final size once scrolling stops.
      if (!el.hasAttribute('data-scrolling')) el.setAttribute('data-scrolling', '');
      clearTimeout(idle);
      idle = window.setTimeout(() => el.removeAttribute('data-scrolling'), 160);
    };

    const io = new IntersectionObserver(
      ([entry]) => {
        active = entry.isIntersecting;
        if (active) schedule();
      },
      { rootMargin: '25% 0px 25% 0px' },
    );
    io.observe(el);
    measure();

    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    return () => {
      io.disconnect();
      cancelAnimationFrame(frame);
      clearTimeout(idle);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
    };
  }, [ref, write, mode, disabled]);
}
