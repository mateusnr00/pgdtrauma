/** Human names for what the tracker records, so the dashboard reads in plain Portuguese. */

export const SECTION_LABELS: Record<string, string> = {
  topo: 'Abertura',
  visao: 'Apresentação',
  obra: 'O livro',
  numeros: 'A obra em números',
  conteudo: 'Sumário',
  publico: 'Para quem é',
  editor: 'Editor',
  autores: 'Autores',
  impresso: 'Vídeo',
  adquirir: 'Fechamento (compra)',
};

/** The order sections appear on the page: the funnel follows it. */
export const SECTION_ORDER = ['topo', 'visao', 'obra', 'numeros', 'conteudo', 'publico', 'editor', 'autores', 'impresso', 'adquirir'];

export const POSITION_LABELS: Record<string, string> = {
  topo: 'Botão do topo (menu fixo)',
  menu: 'Menu do celular',
  final: 'Seção final',
  flutuante: 'Botão flutuante (acompanha a rolagem)',
  outro: 'Link direto / outro',
};

export function clickLabel(name: string) {
  if (name.startsWith('link:#')) {
    const id = name.slice(6);
    return `Menu → ${SECTION_LABELS[id] ?? id}`;
  }
  if (name.startsWith('saida:')) return `Link externo: ${name.slice(6)}`;
  if (name.startsWith('sumario:modulo-')) return `Sumário: abriu o módulo ${name.slice(15)}`;
  const known: Record<string, string> = {
    'sumario:abrir-todos': 'Sumário: abrir todos',
    'sumario:recolher-todos': 'Sumário: recolher todos',
    'autores:ver-todos': 'Autores: ver lista completa',
    'video:assistir': 'Vídeo: reproduzir',
    'video:pausar': 'Vídeo: pausar',
  };
  return known[name] ?? name;
}

export const DEVICE_LABELS: Record<string, string> = {
  celular: 'Celular',
  computador: 'Computador',
  tablet: 'Tablet',
  desconhecido: 'Desconhecido',
};

const regionNames = typeof Intl !== 'undefined' && 'DisplayNames' in Intl ? new Intl.DisplayNames(['pt-BR'], { type: 'region' }) : null;

export function countryLabel(code: string) {
  if (!code || code === '??') return 'Desconhecido';
  try {
    return regionNames?.of(code.toUpperCase()) ?? code;
  } catch {
    return code;
  }
}

const SOURCE_NAMES: Record<string, string> = {
  instagram: 'Instagram',
  'instagram.com': 'Instagram',
  facebook: 'Facebook',
  'facebook.com': 'Facebook',
  whatsapp: 'WhatsApp',
  'wa.me': 'WhatsApp',
  'google.com': 'Google',
  'google.com.br': 'Google',
  google: 'Google',
  'linkedin.com': 'LinkedIn',
  linkedin: 'LinkedIn',
  'youtube.com': 'YouTube',
  youtube: 'YouTube',
  'tiktok.com': 'TikTok',
  tiktok: 'TikTok',
  'bing.com': 'Bing',
  email: 'E-mail',
  'drmarcosrassi.com.br': 'Site do Dr. Marcos Rassi',
  'away.vk.com': 'VK',
  't.co': 'X (Twitter)',
};

export const sourceLabel = (s: string) => SOURCE_NAMES[s.toLowerCase()] ?? s;
