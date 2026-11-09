import { withBase } from '@/lib/base-path';
import { modules as tocModules } from './contents';
import type { Media, Module, SiteContent } from './schema';

/**
 * The original content of the site, used until the admin saves a version and as the base
 * every saved version is merged onto (so new fields always have a value).
 */

// Files in /public/media (paths are stable across builds, unlike hashed static imports).
const angle = { src: '/media/book-angle.png', width: 920, height: 1025 };
const back = { src: '/media/book-back.png', width: 717, height: 995 };
const front = { src: '/media/book-front.png', width: 794, height: 1241 };
const pair = { src: '/media/book-pair.png', width: 1507, height: 995 };
const photo = { src: '/media/book-photo.jpg', width: 899, height: 1300 };
const og = { src: '/media/og.jpg', width: 1200, height: 630 };

const media = (img: { src: string; width: number; height: number }, alt: string): Media => ({
  src: withBase(img.src),
  width: img.width,
  height: img.height,
  alt,
});

const toc: Module[] = tocModules.map((m) => ({
  numeral: m.numeral,
  title: m.title,
  chapters: m.chapters.map((c) => ({
    number: String(c.number),
    title: c.title,
    authors: c.authors.map((p) => ({ title: p.title ?? '', name: p.name, affiliation: p.affiliation ?? '' })),
  })),
}));

export const defaultContent: SiteContent = {
  meta: {
    title: 'Princípios Gerais da Traumatologia — Prof. Dr. Marcos Rassi Fernandes',
    description:
      'Uma obra clara, sistematizada e abrangente sobre os fundamentos essenciais para a compreensão e o tratamento do trauma. Editada pelo Prof. Dr. Marcos Rassi Fernandes.',
    siteName: 'Princípios Gerais da Traumatologia',
    keywords: 'traumatologia, ortopedia, trauma, fraturas, luxações, lesões ligamentares, livro de medicina, residência médica',
    publisher: 'Conexão Editora',
    edition: 'Primeira edição',
    purchaseUrl: '',
    shareImage: media(og, 'Capa e contracapa do livro Princípios Gerais da Traumatologia sobre fundo verde profundo.'),
  },
  header: {
    brandLight: 'Princípios Gerais da ',
    brandStrong: 'Traumatologia',
    nav: [
      { href: '#obra', label: 'O livro' },
      { href: '#conteudo', label: 'Conteúdo' },
      { href: '#publico', label: 'Para quem é' },
      { href: '#editor', label: 'Editor' },
      { href: '#autores', label: 'Autores' },
    ],
    cta: 'Adquirir livro',
    menuOpen: 'Abrir menu',
    menuClose: 'Fechar menu',
    skipLink: 'Pular para o conteúdo',
  },
  hero: {
    eyebrowLeft: 'Primeira edição',
    eyebrowRight: 'Editor: Prof. Dr. Marcos Rassi Fernandes',
    titleLine1: 'Princípios Gerais',
    titleLine2Prefix: 'da',
    titleLine2Accent: 'Traumatologia',
    lede: 'Os fundamentos essenciais para a compreensão e o tratamento do trauma, reunidos em uma obra clara, sistematizada e abrangente.',
    primaryCta: 'Conhecer a obra',
    secondaryCta: 'Ver conteúdo',
    imageDesktop: media(
      pair,
      'Livro Princípios Gerais da Traumatologia, primeira edição, editado por Prof. Dr. Marcos Rassi Fernandes: capa e contracapa verde-escuras com o título em dourado.',
    ),
    imageMobile: media(
      front,
      'Livro Princípios Gerais da Traumatologia, primeira edição: capa verde-escura com o título em dourado e a ilustração de um esqueleto em linhas finas.',
    ),
    creditLeft: 'Conexão Editora',
    creditRight: 'Primeira edição',
  },
  opening: {
    titleLine1: 'Uma visão integrada',
    titleLine2: 'e atual da traumatologia.',
    body: 'Princípios Gerais da Traumatologia reúne conhecimentos fundamentais sobre o trauma e os organiza em uma leitura objetiva, sem perder a profundidade necessária à compreensão de cada tema.',
    indexLabel: 'Reúne conhecimentos fundamentais sobre',
    pillars: ['Avaliação inicial', 'Diagnóstico', 'Princípios de tratamento', 'Estratégias de abordagem'],
    note: 'das diferentes condições traumáticas.',
  },
  showcase: {
    kicker: 'O livro',
    steps: [
      {
        kicker: 'Fundamentos e prática',
        title: 'Concebido para ir dos fundamentos à prática.',
        body: 'Alia fundamentos teóricos à prática clínica, valorizando o raciocínio diagnóstico, a tomada de decisão e os princípios que orientam o tratamento do paciente traumatizado.',
        caption: 'Capa',
        variant: 'object',
        image: media(angle, 'O livro em perspectiva, mostrando a capa, a lombada com o título em dourado e a espessura do miolo.'),
      },
      {
        kicker: 'Organização',
        title: 'Uma obra sistematizada.',
        body: 'A organização dos capítulos busca facilitar a consulta e proporcionar uma leitura objetiva, sem perder a profundidade necessária à compreensão dos temas abordados.',
        caption: 'Lombada',
        variant: 'detail',
        image: media(front, 'Detalhe da lombada: título Traumatologia em dourado e o nome do editor.'),
      },
      {
        kicker: 'Autoria',
        title: 'Produzida por especialistas.',
        body: 'Elaborada por especialistas com experiência na assistência, no ensino e na pesquisa.',
        caption: 'Contracapa',
        variant: 'object',
        image: media(back, 'Contracapa verde-escura com linhas orbitais douradas e o selo da Conexão Editora.'),
      },
      {
        kicker: 'Consulta',
        title: 'Pensada para consulta e formação.',
        body: 'Uma fonte de consulta para quem deseja consolidar conhecimentos e aprimorar sua prática.',
        caption: 'Exemplar impresso',
        variant: 'photo',
        image: media(photo, 'Fotografia do exemplar impresso em capa dura, em pé sobre uma mesa branca.'),
      },
    ],
  },
  stats: {
    kicker: 'A obra em números',
    title: 'A traumatologia em sua amplitude, do geral à face.',
    chaptersLabel: 'capítulos',
    modulesLabel: 'módulos',
    authorsLabel: 'autores',
    editionLabel: 'edição',
    editionWord: 'Primeira',
    chaptersValue: '',
    modulesValue: '',
    authorsValue: '',
  },
  modules: {
    kicker: 'Conteúdo',
    title: 'Organizado para facilitar a consulta.',
    lede: '{capitulos} capítulos distribuídos em {modulos} módulos. Abra um módulo para ver seus capítulos e autores.',
    expandAll: 'Ver sumário completo',
    collapseAll: 'Recolher todos',
    chapterSingular: 'capítulo',
    chapterPlural: 'capítulos',
    list: toc,
  },
  audience: {
    kicker: 'Para quem é',
    title: 'Da formação à prática clínica.',
    groups: ['Estudantes', 'Residentes', 'Médicos em formação', 'Profissionais do atendimento ao trauma'],
    body: 'Leitura objetiva para quem está em formação. Fonte de consulta para quem já atua no atendimento ao trauma.',
  },
  editor: {
    kicker: 'Editor da obra',
    honorific: 'Prof. Dr.',
    nameLine1: 'Marcos Rassi',
    nameLine2: 'Fernandes',
    credentials: [
      { term: 'Professor Associado III', detail: 'Departamento de Ortopedia e Traumatologia' },
      { term: 'Docente orientador', detail: 'Programa de Pós-Graduação Stricto Sensu' },
      { term: 'Faculdade de Medicina', detail: 'Universidade Federal de Goiás' },
    ],
    note: 'Além da edição, assina os capítulos 7, 16, 17 e 50.',
  },
  contributors: {
    kicker: 'Autores',
    title: 'Conhecimento construído por especialistas.',
    lede: '{autores} autores, com experiência na assistência, no ensino e na pesquisa, assinam os {capitulos} capítulos da obra.',
    featured: [
      'Vincenzo Giordano',
      'Rames Mattar Júnior',
      'Fernando Baldy dos Reis',
      'Susana dos Reis Braga',
      'Jamil Faissal Soni',
      'Robert Meves',
      'Pedro José Labronici',
      'Arnaldo Amado Ferreira Neto',
      'Benno Ejnisman',
      'Ricardo Gomes Gobbi',
      'Alexandre Leme Godoy-Santos',
      'Nivaldo Alonso',
    ],
    othersLabel: 'e outros {n}',
    button: 'Ver todos os autores',
    drawerTitle: '{n} autores',
    drawerKicker: 'Princípios Gerais da Traumatologia',
    close: 'Fechar',
    chapterSingular: 'Cap.',
    chapterPlural: 'Caps.',
  },
  printed: {
    kicker: 'Primeira edição',
    title: 'A obra, impressa.',
    caption: 'Exemplares da primeira edição.',
    play: 'Reproduzir vídeo',
    pause: 'Pausar vídeo',
    video: {
      mp4: withBase('/media/printed.mp4'),
      webm: withBase('/media/printed.webm'),
      poster: withBase('/media/printed-poster.jpg'),
      label: 'Exemplares da primeira edição de Princípios Gerais da Traumatologia dispostos sobre uma mesa.',
    },
  },
  closing: {
    title: 'Uma base sólida para a tomada de decisões diante do trauma.',
    body: 'Para uma assistência segura, sistematizada e fundamentada no conhecimento científico.',
    primaryCta: 'Adquirir o livro',
    secondaryCta: 'Rever o sumário',
    soon: 'Canal de aquisição em breve.',
    image: media(front, 'Capa de Princípios Gerais da Traumatologia, primeira edição.'),
  },
  footer: {
    title: 'Princípios Gerais da Traumatologia',
    titleSuffix: 'Primeira edição',
    credit: 'Editor: Prof. Dr. Marcos Rassi Fernandes · Conexão Editora',
    backToTop: 'Voltar ao início',
  },
};
