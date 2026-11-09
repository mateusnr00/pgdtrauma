'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import type { Media, ShowcaseVariant, SiteContent } from '@/content/schema';
import s from './Showcase.module.css';

export function Showcase({ content: c }: { content: SiteContent['showcase'] }) {
  const [active, setActive] = useState(0);
  const stepsRef = useRef<(HTMLElement | null)[]>([]);
  const steps = c.steps;

  useEffect(() => {
    // The "reading line" sits mid-screen on desktop, and below the pinned book on mobile.
    const mq = window.matchMedia('(min-width: 1024px)');
    let io: IntersectionObserver | null = null;
    const observe = () => {
      io?.disconnect();
      const observer = new IntersectionObserver(
        (entries) => {
          for (const e of entries) {
            if (e.isIntersecting) setActive(Number((e.target as HTMLElement).dataset.step));
          }
        },
        { rootMargin: mq.matches ? '-48% 0px -48% 0px' : '-74% 0px -25% 0px' },
      );
      stepsRef.current.slice(0, steps.length).forEach((el) => el && observer.observe(el));
      io = observer;
    };
    observe();
    mq.addEventListener('change', observe);
    return () => {
      io?.disconnect();
      mq.removeEventListener('change', observe);
    };
  }, [steps.length]);

  if (steps.length === 0) return null;
  const current = Math.min(active, steps.length - 1);

  return (
    <section id="obra" className={s.section} data-tone="dark" aria-labelledby="showcase-title">
      <div className={`container ${s.intro}`}>
        <p className="kicker" data-reveal>
          {c.kicker}
        </p>
        <h2 id="showcase-title" className="sr-only">
          {c.kicker}
        </h2>
      </div>

      <div className={`container ${s.layout}`}>
        <div className={s.steps}>
          {steps.map((step, i) => (
            <article
              key={i}
              ref={(el) => {
                stepsRef.current[i] = el;
              }}
              data-step={i}
              className={s.step}
              data-active={current === i || undefined}
            >
              {/* Fallback (no JS / reduced motion): each step carries its own image. */}
              <div className={s.inlineVisual} data-reveal>
                <VisualImage image={step.image} variant={step.variant} sizes="(max-width: 1023px) 88vw, 1px" />
              </div>
              <div className={s.text} data-reveal>
                <p className={s.kicker}>
                  <span className={s.count}>{String(i + 1).padStart(2, '0')}</span>
                  {step.kicker}
                </p>
                <h3 className={s.title}>{step.title}</h3>
                <p className={s.body}>{step.body}</p>
              </div>
            </article>
          ))}
        </div>

        <div className={s.stage}>
          <div className={s.stageInner}>
            {steps.map((step, i) => (
              <figure key={i} className={s.frame} data-variant={step.variant} data-state={i === current ? 'on' : i < current ? 'past' : 'next'}>
                <VisualImage
                  image={step.image}
                  variant={step.variant}
                  sizes={step.variant === 'detail' ? '90vw' : '(max-width: 1023px) 80vw, 46vw'}
                />
              </figure>
            ))}
            <div className={s.progress} aria-hidden="true">
              <span className={s.progressLabel}>{steps[current].caption}</span>
              <span className={s.progressTrack}>
                {steps.map((step, i) => (
                  <span key={i} className={s.tick} data-on={i <= current || undefined} />
                ))}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function VisualImage({ image, variant, sizes }: { image: Media; variant: ShowcaseVariant; sizes: string }) {
  return (
    <div className={s.visual} data-variant={variant}>
      <Image src={image.src} width={image.width} height={image.height} alt={image.alt} sizes={sizes} quality={85} className={s.img} />
    </div>
  );
}
