'use client';

import { useEffect } from 'react';
import { BASE_PATH } from '@/lib/base-path';
import { consentFrom } from '@/lib/consent';

/**
 * Anonymous, first-party analytics: one page view per visit, each section the visitor actually
 * reaches (once), and clicks on in-page links and elements marked with data-track.
 * Purchase clicks are counted on the server by /comprar.
 */

const ENDPOINT = `${BASE_PATH}/api/t`;
const VISITOR_COOKIE = 'pgt_v';

const rid = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID().replace(/-/g, '')
    : Math.random().toString(36).slice(2) + Date.now().toString(36);

function visitorId() {
  const found = document.cookie.match(new RegExp(`(?:^|; )${VISITOR_COOKIE}=([^;]+)`));
  const id = found?.[1] ?? rid();
  // Refreshed on every visit: one year from the last one.
  document.cookie = `${VISITOR_COOKIE}=${id}; path=/; max-age=31536000; samesite=lax${location.protocol === 'https:' ? '; secure' : ''}`;
  return id;
}

function sessionId() {
  try {
    let id = sessionStorage.getItem('pgt_s');
    if (!id) sessionStorage.setItem('pgt_s', (id = rid()));
    return id;
  } catch {
    return rid();
  }
}

type Fbq = (...args: unknown[]) => void;
const BOOK = {
  content_name: 'Princípios Gerais da Traumatologia',
  content_type: 'product',
  content_category: 'Livro',
  content_ids: ['principios-gerais-da-traumatologia'],
  contents: [{ id: 'principios-gerais-da-traumatologia', quantity: 1 }],
  currency: 'BRL',
};

/** Fires a Meta Pixel event when the Pixel is on the page; the same id goes to the server (Conversions API). */
function pixel(event: string, eventId: string, data: Record<string, unknown> = {}) {
  if (consentFrom(document.cookie) !== 'all') return;
  const w = window as unknown as { fbq?: Fbq; __pgtPixelQueue?: unknown[][] };
  const args = ['track', event, data, { eventID: eventId }];
  // The Pixel script may still be loading: components/MetaPixel.tsx flushes this queue after init.
  if (typeof w.fbq === 'function') w.fbq(...args);
  else (w.__pgtPixelQueue ??= []).push(args);
}

export function Analytics() {
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const externalReferrer = document.referrer && !document.referrer.startsWith(location.origin) ? document.referrer : '';
    const base = {
      path: location.pathname,
      visitor: visitorId(),
      session: sessionId(),
      referrer: externalReferrer,
      source: params.get('utm_source') ?? params.get('ref') ?? '',
      medium: params.get('utm_medium') ?? '',
      campaign: params.get('utm_campaign') ?? '',
      url: location.href,
    };

    const send = (events: { type: string; name?: string; eid?: string }[]) => {
      const body = JSON.stringify({ ...base, events });
      if (!navigator.sendBeacon?.(ENDPOINT, body)) {
        fetch(ENDPOINT, { method: 'POST', body, keepalive: true }).catch(() => {});
      }
    };

    const viewId = rid();
    pixel('PageView', viewId);
    send([{ type: 'view', eid: viewId }]);

    // Sections: counted once, when at least a third of the section (or of the screen) is visible.
    const seen = new Set<string>();
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          const id = (e.target as HTMLElement).id;
          if (!e.isIntersecting || seen.has(id)) continue;
          seen.add(id);
          io.unobserve(e.target);
          if (id === 'conteudo') {
            const eid = rid();
            pixel('ViewContent', eid, BOOK);
            send([{ type: 'section', name: id, eid }]);
          } else send([{ type: 'section', name: id }]);
        }
      },
      { threshold: [0, 0.35], rootMargin: '0px 0px -35% 0px' },
    );
    document.querySelectorAll<HTMLElement>('main section[id]').forEach((el) => io.observe(el));

    const onClick = (event: MouseEvent) => {
      const el = (event.target as Element | null)?.closest<HTMLElement>('[data-track], a[href]');
      if (!el) return;
      const href = el.getAttribute('href') ?? '';
      if (href.includes('/comprar')) {
        // Counted by the server; the Pixel event and the server's Conversions API event share this id.
        const eid = rid();
        pixel('AddToCart', eid, BOOK);
        const target = new URL(href, location.href);
        target.searchParams.set('eid', eid);
        el.setAttribute('href', target.pathname + target.search);
        return;
      }
      const name = el.dataset.track || (href.startsWith('#') ? `link:${href}` : /^https?:/.test(href) ? `saida:${new URL(href).hostname}` : '');
      if (name) send([{ type: 'click', name }]);
    };
    document.addEventListener('click', onClick, { capture: true });

    return () => {
      io.disconnect();
      document.removeEventListener('click', onClick, { capture: true });
    };
  }, []);

  return null;
}
