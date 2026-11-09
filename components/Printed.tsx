'use client';

import { useEffect, useRef, useState } from 'react';
import type { SiteContent } from '@/content/schema';
import { usePrefersReducedMotion } from '@/lib/motion';
import s from './Printed.module.css';

/**
 * Short, silent footage of printed copies. It plays only while on screen (never with
 * reduced motion) and always offers a visible pause control.
 */
export function Printed({ content: c }: { content: SiteContent['printed'] }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const reduced = usePrefersReducedMotion();
  const [playing, setPlaying] = useState(false);
  const [userPaused, setUserPaused] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || reduced || userPaused) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          video.preload = 'auto';
          video.play().catch(() => setPlaying(false));
        } else video.pause();
      },
      { threshold: 0.35 },
    );
    io.observe(video);
    return () => io.disconnect();
  }, [reduced, userPaused]);

  const toggle = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      setUserPaused(false);
      video.play().catch(() => setPlaying(false));
    } else {
      setUserPaused(true);
      video.pause();
    }
  };

  return (
    <section id="impresso" className={s.section} data-tone="dark" aria-labelledby="printed-title">
      <div className="container">
        <div className={s.head}>
          <p className="kicker" data-reveal>
            {c.kicker}
          </p>
          <h2 id="printed-title" className={s.title} data-reveal style={{ '--delay': '80ms' } as React.CSSProperties}>
            {c.title}
          </h2>
        </div>

        <figure className={s.figure} data-reveal>
          <div className={s.frame}>
            <video
              key={c.video.mp4 + c.video.webm}
              ref={videoRef}
              className={s.video}
              muted
              loop
              playsInline
              preload="none"
              poster={c.video.poster || undefined}
              width={1024}
              height={576}
              aria-label={c.video.label}
              onPlay={() => setPlaying(true)}
              onPause={() => setPlaying(false)}
            >
              {c.video.webm && <source src={c.video.webm} type="video/webm" />}
              {c.video.mp4 && <source src={c.video.mp4} type="video/mp4" />}
            </video>
            <button type="button" className={s.control} onClick={toggle} data-playing={playing || undefined}>
              <span className="sr-only">{playing ? c.pause : c.play}</span>
              <span className={s.glyph} aria-hidden="true" />
            </button>
          </div>
          {c.caption && <figcaption className={s.caption}>{c.caption}</figcaption>}
        </figure>
      </div>
    </section>
  );
}
