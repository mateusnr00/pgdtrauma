'use client';

import { useEffect } from 'react';

/**
 * Page-wide, render-free behaviours:
 * - Tone: the page background morphs between the deep green and paper as sections marked
 *   with data-tone cross the middle of the viewport, so sections flow into each other
 *   instead of stacking as hard-edged blocks.
 * - Reveal: elements marked with data-reveal get .is-in the first time they enter view.
 */
export function PageBehaviors() {
  useEffect(() => {
    const root = document.documentElement;

    const toneSections = document.querySelectorAll<HTMLElement>('[data-tone]:not(html)');
    const toneObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) root.dataset.tone = (entry.target as HTMLElement).dataset.tone;
        }
      },
      { rootMargin: '-50% 0px -50% 0px' },
    );
    toneSections.forEach((s) => toneObserver.observe(s));

    const revealObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.classList.add('is-in');
          revealObserver.unobserve(entry.target);
        }
      },
      { rootMargin: '0px 0px -12% 0px', threshold: 0.01 },
    );
    document.querySelectorAll('[data-reveal]').forEach((el) => revealObserver.observe(el));

    return () => {
      toneObserver.disconnect();
      revealObserver.disconnect();
    };
  }, []);

  return null;
}
