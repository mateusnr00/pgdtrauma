'use client';

import { useEffect, useState } from 'react';
import type { SiteContent } from '@/content/schema';
import { CONSENT_COOKIE, CONSENT_EVENT, CONSENT_OPEN_EVENT, consentFrom, type Consent } from '@/lib/consent';
import s from './CookieConsent.module.css';

/**
 * Cookie notice. Shown until the visitor chooses; the choice lasts six months and can be changed
 * from the footer. Only "Aceitar" turns on the Meta Pixel and the Conversions API.
 */
export function CookieConsent({ content: c }: { content: SiteContent['cookies'] }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    // Reads the cookie once after hydration: the server can't know it for a static page.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!consentFrom(document.cookie)) setOpen(true);
    const reopen = () => setOpen(true);
    window.addEventListener(CONSENT_OPEN_EVENT, reopen);
    return () => window.removeEventListener(CONSENT_OPEN_EVENT, reopen);
  }, []);

  // Lets other fixed elements (the floating purchase bar) step aside while the notice is up.
  useEffect(() => {
    const root = document.documentElement;
    if (open) root.dataset.cookiesOpen = '';
    else delete root.dataset.cookiesOpen;
  }, [open]);

  const choose = (value: Consent) => {
    document.cookie = `${CONSENT_COOKIE}=${value}; path=/; max-age=${60 * 60 * 24 * 182}; samesite=lax${location.protocol === 'https:' ? '; secure' : ''}`;
    setOpen(false);
    window.dispatchEvent(new Event(CONSENT_EVENT));
  };

  return (
    <div className={s.notice} data-open={open || undefined} role="region" aria-label="Aviso de cookies" inert={!open}>
      <p className={s.text}>{c.text}</p>
      <div className={s.actions}>
        <button type="button" className={s.ghost} onClick={() => choose('essential')}>
          {c.reject}
        </button>
        <button type="button" className={`btn ${s.accept}`} onClick={() => choose('all')}>
          {c.accept}
        </button>
      </div>
    </div>
  );
}

/** Footer link that reopens the notice. */
export function CookieSettingsLink({ label }: { label: string }) {
  return (
    <button type="button" className={s.manage} onClick={() => window.dispatchEvent(new Event(CONSENT_OPEN_EVENT))}>
      {label}
    </button>
  );
}
