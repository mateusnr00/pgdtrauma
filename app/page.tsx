import { Header } from '@/components/Header';
import { Hero } from '@/components/Hero';
import { Opening } from '@/components/Opening';
import { Showcase } from '@/components/Showcase';
import { Stats } from '@/components/Stats';
import { Modules } from '@/components/Modules';
import { Audience } from '@/components/Audience';
import { Editor } from '@/components/Editor';
import { Contributors } from '@/components/Contributors';
import { Printed } from '@/components/Printed';
import { FinalCta } from '@/components/FinalCta';
import { Footer } from '@/components/Footer';
import { PageBehaviors } from '@/components/PageBehaviors';
import { site } from '@/content/book';
import { authorsOf, fill, totalsOf } from '@/content/derive';
import { getContent } from '@/lib/content-store';

/*
 * Narrative: the object (hero) → what it is (opening) → how it is made (showcase)
 * → its scale (numbers) → what's inside (modules) → who it serves (audience)
 * → who stands behind it (editor, authors) → the printed edition → the invitation.
 * All content comes from the editable document managed in /admin.
 */
export default async function Page() {
  const c = await getContent();
  const totals = totalsOf(c);
  const authors = authorsOf(c.modules.list);
  const tokens = { capitulos: totals.chapters, modulos: totals.modules, autores: totals.authors };
  const purchaseUrl = c.meta.purchaseUrl || site.purchaseUrl;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Book',
    name: c.meta.siteName,
    url: site.url,
    inLanguage: 'pt-BR',
    bookEdition: c.meta.edition,
    bookFormat: 'https://schema.org/Hardcover',
    description: c.meta.description,
    image: new URL(c.meta.shareImage.src, site.url).toString(),
    publisher: { '@type': 'Organization', name: c.meta.publisher },
    editor: {
      '@type': 'Person',
      name: [c.editor.nameLine1, c.editor.nameLine2].filter(Boolean).join(' '),
      honorificPrefix: c.editor.honorific,
      jobTitle: c.editor.credentials[0]?.term,
    },
    contributor: authors.map((p) => ({ '@type': 'Person', name: p.name })),
    about: ['Traumatologia', 'Ortopedia'],
    audience: { '@type': 'Audience', audienceType: c.audience.groups.join(', ') },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, `${String.fromCharCode(92)}u003c`) }} />
      <a href="#conteudo-principal" className="skip-link">
        {c.header.skipLink}
      </a>
      <Header content={c.header} purchaseUrl={purchaseUrl} />
      <main id="conteudo-principal">
        <Hero content={c.hero} />
        <Opening content={c.opening} />
        <Showcase content={c.showcase} />
        <Stats content={c.stats} totals={totals} />
        <Modules content={c.modules} lede={fill(c.modules.lede, tokens)} />
        <Audience content={c.audience} />
        <Editor content={c.editor} />
        <Contributors content={c.contributors} authors={authors} lede={fill(c.contributors.lede, tokens)} total={totals.authors} />
        <Printed content={c.printed} />
        <FinalCta content={c.closing} purchaseUrl={purchaseUrl} />
      </main>
      <Footer content={c.footer} />
      <PageBehaviors />
    </>
  );
}
