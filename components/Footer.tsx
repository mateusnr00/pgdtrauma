import type { SiteContent } from '@/content/schema';
import { CookieSettingsLink } from './CookieConsent';
import s from './Footer.module.css';

export function Footer({ content: c, cookiesLabel }: { content: SiteContent['footer']; cookiesLabel?: string }) {
  return (
    <footer className={s.footer}>
      <div className={`container ${s.inner}`}>
        <p className={s.title}>
          {c.title}
          {c.titleSuffix && <span className={s.muted}> · {c.titleSuffix}</span>}
        </p>
        <p className={s.muted}>
          {c.credit}
          {cookiesLabel && (
            <>
              {' · '}
              <CookieSettingsLink label={cookiesLabel} />
            </>
          )}
        </p>
        <a href="#topo" className={s.top}>
          {c.backToTop} <span aria-hidden="true">↑</span>
        </a>
      </div>
    </footer>
  );
}
