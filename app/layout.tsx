import type { Metadata, Viewport } from 'next';
import { Inter_Tight, Newsreader } from 'next/font/google';
import { site } from '@/content/book';
import { getContent } from '@/lib/content-store';
import './globals.css';

// Portuguese is fully covered by the "latin" subset.
const sans = Inter_Tight({
  subsets: ['latin'],
  variable: '--font-inter-tight',
  display: 'swap',
});

// Editorial accents only appear below the fold: don't compete with the hero for bandwidth.
const serif = Newsreader({
  subsets: ['latin'],
  style: ['normal', 'italic'],
  variable: '--font-newsreader',
  display: 'swap',
  preload: false,
});

export async function generateMetadata(): Promise<Metadata> {
  const { meta } = await getContent();
  const image = { url: meta.shareImage.src, width: meta.shareImage.width, height: meta.shareImage.height, alt: meta.shareImage.alt };
  return {
    // Origin only: media paths already carry the base path.
    metadataBase: new URL(new URL(site.url).origin),
    title: meta.title,
    description: meta.description,
    alternates: { canonical: site.url },
    keywords: meta.keywords.split(',').map((k) => k.trim()).filter(Boolean),
    openGraph: {
      type: 'book',
      locale: site.locale,
      url: site.url,
      siteName: meta.siteName,
      title: meta.title,
      description: meta.description,
      images: [image],
    },
    twitter: { card: 'summary_large_image', title: meta.title, description: meta.description, images: [image] },
    robots: { index: true, follow: true },
  };
}

export const viewport: Viewport = {
  themeColor: '#050d09',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" data-tone="dark" className={`${sans.variable} ${serif.variable}`} suppressHydrationWarning>
      <head>
        {/* Flags JS before first paint so reveal states never flash and never hide content without JS. */}
        <script dangerouslySetInnerHTML={{ __html: "(function(d){d.classList.add('js');if(matchMedia('(prefers-reduced-motion: reduce)').matches&&!/[?&]motion=full/.test(location.search))d.classList.add('rm')})(document.documentElement)" }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
