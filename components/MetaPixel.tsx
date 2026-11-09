'use client';

import { useEffect, useState } from 'react';
import Script from 'next/script';
import { CONSENT_EVENT, consentFrom } from '@/lib/consent';

/**
 * Meta Pixel, loaded only after the visitor accepts cookies (LGPD). It only initialises the Pixel:
 * the events (PageView, ViewContent, AddToCart) come from components/Analytics.tsx with the same
 * event id the server sends to the Conversions API, so Meta deduplicates them. Events fired while
 * the script was loading wait in window.__pgtPixelQueue.
 */
export function MetaPixel({ pixelId }: { pixelId: string }) {
  const id = pixelId.replace(/\D/g, '');
  const [allowed, setAllowed] = useState(false);
  const [lateConsent, setLateConsent] = useState(false);

  useEffect(() => {
    const check = () => consentFrom(document.cookie) === 'all';
    if (check()) {
      // Mirrors a cookie into state once on mount; nothing to derive during render on the server.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setAllowed(true);
      return;
    }
    const onConsent = () => {
      if (!check()) return;
      setLateConsent(true);
      setAllowed(true);
    };
    window.addEventListener(CONSENT_EVENT, onConsent);
    return () => window.removeEventListener(CONSENT_EVENT, onConsent);
  }, []);

  if (!id || !allowed) return null;
  // Accepted during this visit: the page view happened before the Pixel existed, so count it now.
  const pageView = lateConsent ? "fbq('track','PageView');" : '';
  return (
    <Script id="meta-pixel" strategy="afterInteractive">
      {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${id}');${pageView}(window.__pgtPixelQueue||[]).forEach(function(a){fbq.apply(null,a)});window.__pgtPixelQueue=[];`}
    </Script>
  );
}
