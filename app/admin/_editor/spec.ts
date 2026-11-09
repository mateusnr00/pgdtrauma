import type { SiteContent } from '@/content/schema';

/**
 * Declarative description of the admin form. The editor renders any field type recursively,
 * so every part of the content document is reachable from here.
 */

export type Field =
  | { kind: 'text'; key: string; label: string; hint?: string; long?: boolean; placeholder?: string }
  | { kind: 'image'; key: string; label: string; hint?: string }
  | { kind: 'video'; key: string; label: string }
  | { kind: 'select'; key: string; label: string; options: { value: string; label: string }[] }
  | { kind: 'strings'; key: string; label: string; itemLabel: string; hint?: string }
  | {
      kind: 'list';
      key: string;
      label: string;
      hint?: string;
      /** Field used to title each card; falls back to "itemLabel N". */
      titleKey?: string;
      itemLabel: string;
      fields: Field[];
      newItem: () => unknown;
    }
  | { kind: 'group'; key: string; label: string; fields: Field[] };

export type Section = { id: keyof SiteContent; title: string; description: string; fields: Field[] };

const t = (key: string, label: string, extra: Partial<{ hint: string; long: boolean; placeholder: string }> = {}): Field => ({
  kind: 'text',
  key,
  label,
  ...extra,
});

const emptyImage = () => ({ src: '', width: 1000, height: 1000, alt: '' });

const TOKENS = 'Use {capitulos}, {modulos} e {autores} para inserir os números automaticamente.';

export const sections: Section[] = [
  {
    id: 'meta',
    title: 'Geral e SEO',
    description: 'Título da aba, descrição no Google, imagem de compartilhamento e link de compra.',
    fields: [
      t('title', 'Título da página (aba do navegador e Google)'),
      t('description', 'Descrição (Google e compartilhamento)', { long: true }),
      t('siteName', 'Nome do site'),
      t('keywords', 'Palavras-chave', { hint: 'Separadas por vírgula.' }),
      t('publisher', 'Editora'),
      t('edition', 'Edição'),
      t('purchaseUrl', 'Link de compra', {
        hint: 'Endereço completo (https://…). Vazio: os botões de compra levam à seção final com o aviso "em breve".',
        placeholder: 'https://',
      }),
      { kind: 'image', key: 'shareImage', label: 'Imagem de compartilhamento (WhatsApp, redes sociais)', hint: 'Ideal: 1200 × 630 px.' },
    ],
  },
  {
    id: 'header',
    title: 'Menu',
    description: 'Barra fixa do topo e menu do celular.',
    fields: [
      t('brandLight', 'Nome — parte clara', { hint: 'Inclua o espaço final se o nome continuar na parte em destaque.' }),
      t('brandStrong', 'Nome — parte em destaque'),
      {
        kind: 'list',
        key: 'nav',
        label: 'Links do menu',
        itemLabel: 'Link',
        titleKey: 'label',
        hint: 'Destinos possíveis: #obra, #conteudo, #publico, #editor, #autores, #impresso, #adquirir.',
        fields: [t('label', 'Texto'), t('href', 'Destino')],
        newItem: () => ({ label: 'Novo link', href: '#obra' }),
      },
      t('cta', 'Botão de compra'),
      {
        kind: 'select',
        key: 'stickyEnabled',
        label: 'Botão de compra flutuante (acompanha a rolagem)',
        options: [
          { value: 'sim', label: 'Mostrar' },
          { value: 'nao', label: 'Esconder' },
        ],
      },
      t('stickyLabel', 'Botão flutuante — texto do botão'),
      t('stickyNote', 'Botão flutuante — frase ao lado', { hint: 'Aparece no computador e no celular, ao lado do botão. Pode deixar vazio.' }),
      t('menuOpen', 'Leitor de tela: abrir menu'),
      t('menuClose', 'Leitor de tela: fechar menu'),
      t('skipLink', 'Atalho de acessibilidade ("pular para o conteúdo")'),
    ],
  },
  {
    id: 'hero',
    title: 'Abertura (hero)',
    description: 'Primeira tela: título, texto, botões e imagens do livro.',
    fields: [
      t('eyebrowLeft', 'Linha superior — esquerda'),
      t('eyebrowRight', 'Linha superior — direita'),
      t('titleLine1', 'Título — linha 1'),
      t('titleLine2Prefix', 'Título — linha 2, início'),
      t('titleLine2Accent', 'Título — linha 2, em dourado'),
      t('lede', 'Texto de apoio', { long: true }),
      t('primaryCta', 'Botão principal'),
      t('secondaryCta', 'Link secundário'),
      { kind: 'image', key: 'imageDesktop', label: 'Imagem do livro — computador', hint: 'PNG com fundo transparente funciona melhor.' },
      { kind: 'image', key: 'imageMobile', label: 'Imagem do livro — celular', hint: 'Formato vertical; PNG transparente.' },
      t('creditLeft', 'Rodapé da abertura — esquerda'),
      t('creditRight', 'Rodapé da abertura — direita'),
    ],
  },
  {
    id: 'opening',
    title: 'Apresentação',
    description: 'Bloco logo após a abertura ("Uma visão integrada…").',
    fields: [
      t('titleLine1', 'Título — linha 1'),
      t('titleLine2', 'Título — linha 2 (itálico)'),
      t('body', 'Texto', { long: true }),
      t('indexLabel', 'Rótulo da lista'),
      { kind: 'strings', key: 'pillars', label: 'Itens da lista', itemLabel: 'Item' },
      t('note', 'Frase final (itálico)'),
    ],
  },
  {
    id: 'showcase',
    title: 'O livro',
    description: 'Narrativa com o livro fixo e o texto rolando. Cada etapa tem texto e imagem.',
    fields: [
      t('kicker', 'Rótulo da seção'),
      {
        kind: 'list',
        key: 'steps',
        label: 'Etapas',
        itemLabel: 'Etapa',
        titleKey: 'title',
        fields: [
          t('kicker', 'Rótulo'),
          t('title', 'Título'),
          t('body', 'Texto', { long: true }),
          t('caption', 'Legenda sob a imagem'),
          {
            kind: 'select',
            key: 'variant',
            label: 'Apresentação da imagem',
            options: [
              { value: 'object', label: 'Livro recortado (PNG transparente)' },
              { value: 'detail', label: 'Detalhe ampliado (lombada)' },
              { value: 'photo', label: 'Fotografia com cantos arredondados' },
            ],
          },
          { kind: 'image', key: 'image', label: 'Imagem' },
        ],
        newItem: () => ({ kicker: 'Novo', title: 'Nova etapa', body: '', caption: '', variant: 'object', image: emptyImage() }),
      },
    ],
  },
  {
    id: 'stats',
    title: 'A obra em números',
    description: 'Os números são contados automaticamente pelo sumário. Preencha só se quiser substituir.',
    fields: [
      t('kicker', 'Rótulo da seção'),
      t('title', 'Título', { long: true }),
      t('chaptersLabel', 'Rótulo — capítulos'),
      t('chaptersValue', 'Número de capítulos (manual)', { placeholder: 'Automático' }),
      t('modulesLabel', 'Rótulo — módulos'),
      t('modulesValue', 'Número de módulos (manual)', { placeholder: 'Automático' }),
      t('authorsLabel', 'Rótulo — autores'),
      t('authorsValue', 'Número de autores (manual)', { placeholder: 'Automático' }),
      t('editionLabel', 'Rótulo — edição'),
      t('editionWord', 'Edição (palavra em destaque)'),
    ],
  },
  {
    id: 'modules',
    title: 'Sumário',
    description: 'Módulos, capítulos e autores. Tudo aqui também alimenta os números e a lista de autores.',
    fields: [
      t('kicker', 'Rótulo da seção'),
      t('title', 'Título'),
      t('lede', 'Texto', { long: true, hint: TOKENS }),
      t('expandAll', 'Botão "abrir todos"'),
      t('collapseAll', 'Botão "recolher todos"'),
      t('chapterSingular', 'Palavra "capítulo" (singular)'),
      t('chapterPlural', 'Palavra "capítulos" (plural)'),
      {
        kind: 'list',
        key: 'list',
        label: 'Módulos',
        itemLabel: 'Módulo',
        titleKey: 'title',
        fields: [
          t('numeral', 'Numeral (I, II, III…)'),
          t('title', 'Título do módulo'),
          {
            kind: 'list',
            key: 'chapters',
            label: 'Capítulos',
            itemLabel: 'Capítulo',
            titleKey: 'title',
            fields: [
              t('number', 'Número'),
              t('title', 'Título do capítulo'),
              {
                kind: 'list',
                key: 'authors',
                label: 'Autores do capítulo',
                itemLabel: 'Autor',
                titleKey: 'name',
                fields: [t('title', 'Título (Dr., Prof. Dr.…)'), t('name', 'Nome'), t('affiliation', 'Instituição')],
                newItem: () => ({ title: 'Dr.', name: '', affiliation: '' }),
              },
            ],
            newItem: () => ({ number: '', title: 'Novo capítulo', authors: [] }),
          },
        ],
        newItem: () => ({ numeral: '', title: 'Novo módulo', chapters: [] }),
      },
    ],
  },
  {
    id: 'audience',
    title: 'Para quem é',
    description: 'Público da obra.',
    fields: [
      t('kicker', 'Rótulo da seção'),
      t('title', 'Título'),
      { kind: 'strings', key: 'groups', label: 'Públicos', itemLabel: 'Público' },
      t('body', 'Frase final (itálico)', { long: true }),
    ],
  },
  {
    id: 'editor',
    title: 'Editor',
    description: 'Seção do editor da obra.',
    fields: [
      t('kicker', 'Rótulo da seção'),
      { kind: 'image', key: 'photo', label: 'Foto do editor', hint: 'Retrato vertical (ideal 1200 × 1500 px). Sem foto, a seção mostra só o nome.' },
      t('honorific', 'Título (Prof. Dr.)'),
      t('nameLine1', 'Nome — linha 1'),
      t('nameLine2', 'Nome — linha 2'),
      {
        kind: 'list',
        key: 'credentials',
        label: 'Credenciais',
        itemLabel: 'Credencial',
        titleKey: 'term',
        fields: [t('term', 'Cargo / título'), t('detail', 'Detalhe')],
        newItem: () => ({ term: '', detail: '' }),
      },
      t('note', 'Observação', { long: true }),
    ],
  },
  {
    id: 'contributors',
    title: 'Autores',
    description: 'A lista completa vem do sumário. Aqui você escolhe os nomes em destaque e os textos.',
    fields: [
      t('kicker', 'Rótulo da seção'),
      t('title', 'Título'),
      t('lede', 'Texto', { long: true, hint: TOKENS }),
      { kind: 'strings', key: 'featured', label: 'Nomes em destaque', itemLabel: 'Nome' },
      t('othersLabel', 'Texto "e outros"', { hint: '{n} vira a quantidade de autores não destacados.' }),
      t('button', 'Botão "ver todos"'),
      t('drawerKicker', 'Lista completa — rótulo'),
      t('drawerTitle', 'Lista completa — título', { hint: '{n} vira o total de autores.' }),
      t('chapterSingular', 'Abreviação "Cap."'),
      t('chapterPlural', 'Abreviação "Caps."'),
      t('close', 'Leitor de tela: fechar'),
    ],
  },
  {
    id: 'printed',
    title: 'Vídeo',
    description: 'Seção com o vídeo dos exemplares impressos.',
    fields: [
      t('kicker', 'Rótulo da seção'),
      t('title', 'Título'),
      t('caption', 'Legenda'),
      { kind: 'video', key: 'video', label: 'Vídeo' },
      t('play', 'Leitor de tela: reproduzir'),
      t('pause', 'Leitor de tela: pausar'),
    ],
  },
  {
    id: 'closing',
    title: 'Fechamento',
    description: 'Chamada final para compra.',
    fields: [
      t('title', 'Título', { long: true }),
      t('body', 'Texto', { long: true }),
      t('primaryCta', 'Botão de compra'),
      t('secondaryCta', 'Link secundário'),
      t('soon', 'Aviso quando não há link de compra'),
      { kind: 'image', key: 'image', label: 'Imagem do livro' },
    ],
  },
  {
    id: 'cookies',
    title: 'Aviso de cookies',
    description: 'Aviso exibido na primeira visita. O Pixel da Meta só é ativado quando a pessoa aceita.',
    fields: [
      t('text', 'Texto do aviso', { long: true }),
      t('accept', 'Botão "aceitar"'),
      t('reject', 'Botão "só essenciais"'),
      t('manage', 'Link no rodapé para mudar a escolha'),
    ],
  },
  {
    id: 'footer',
    title: 'Rodapé',
    description: 'Última linha do site.',
    fields: [t('title', 'Título'), t('titleSuffix', 'Complemento'), t('credit', 'Créditos'), t('backToTop', 'Link "voltar ao início"')],
  },
];
