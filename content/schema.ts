/**
 * The whole site as one editable document. Every visible string, image, alt text and label
 * lives here; components only lay it out. The admin edits this object and stores it in
 * Vercel Blob (see lib/content-store.ts).
 */

export type Media = {
  src: string;
  width: number;
  height: number;
  alt: string;
};

export type Video = {
  mp4: string;
  webm: string;
  poster: string;
  label: string;
};

export type Contributor = { title: string; name: string; affiliation: string };
export type Chapter = { number: string; title: string; authors: Contributor[] };
export type Module = { numeral: string; title: string; chapters: Chapter[] };

export type ShowcaseVariant = 'object' | 'detail' | 'photo';

export type SiteContent = {
  meta: {
    title: string;
    description: string;
    siteName: string;
    keywords: string;
    publisher: string;
    edition: string;
    /** Checkout link. Empty: purchase buttons point at the closing section. */
    purchaseUrl: string;
    shareImage: Media;
  };
  header: {
    brandLight: string;
    brandStrong: string;
    nav: { label: string; href: string }[];
    cta: string;
    menuOpen: string;
    menuClose: string;
    skipLink: string;
  };
  hero: {
    eyebrowLeft: string;
    eyebrowRight: string;
    titleLine1: string;
    titleLine2Prefix: string;
    titleLine2Accent: string;
    lede: string;
    primaryCta: string;
    secondaryCta: string;
    imageDesktop: Media;
    imageMobile: Media;
    creditLeft: string;
    creditRight: string;
  };
  opening: {
    titleLine1: string;
    titleLine2: string;
    body: string;
    indexLabel: string;
    pillars: string[];
    note: string;
  };
  showcase: {
    kicker: string;
    steps: { kicker: string; title: string; body: string; caption: string; variant: ShowcaseVariant; image: Media }[];
  };
  stats: {
    kicker: string;
    title: string;
    chaptersLabel: string;
    modulesLabel: string;
    authorsLabel: string;
    editionLabel: string;
    editionWord: string;
    /** Leave empty to count automatically from the table of contents. */
    chaptersValue: string;
    modulesValue: string;
    authorsValue: string;
  };
  modules: {
    kicker: string;
    title: string;
    lede: string;
    expandAll: string;
    collapseAll: string;
    chapterSingular: string;
    chapterPlural: string;
    list: Module[];
  };
  audience: {
    kicker: string;
    title: string;
    groups: string[];
    body: string;
  };
  editor: {
    kicker: string;
    honorific: string;
    nameLine1: string;
    nameLine2: string;
    credentials: { term: string; detail: string }[];
    note: string;
  };
  contributors: {
    kicker: string;
    title: string;
    lede: string;
    featured: string[];
    /** "{n}" is replaced by the number of authors not shown. */
    othersLabel: string;
    button: string;
    /** "{n}" is replaced by the total number of authors. */
    drawerTitle: string;
    drawerKicker: string;
    close: string;
    chapterSingular: string;
    chapterPlural: string;
  };
  printed: {
    kicker: string;
    title: string;
    caption: string;
    play: string;
    pause: string;
    video: Video;
  };
  closing: {
    title: string;
    body: string;
    primaryCta: string;
    secondaryCta: string;
    soon: string;
    image: Media;
  };
  footer: {
    title: string;
    titleSuffix: string;
    credit: string;
    backToTop: string;
  };
};
