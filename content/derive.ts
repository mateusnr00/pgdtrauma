import type { Module, SiteContent } from './schema';

export type AuthorEntry = { name: string; chapters: string[] };

/** Every person who signs a chapter, alphabetical, with the chapters they wrote. */
export function authorsOf(list: Module[]): AuthorEntry[] {
  const map = new Map<string, string[]>();
  for (const m of list) {
    for (const c of m.chapters) {
      for (const p of c.authors) {
        const name = p.name.trim();
        if (name) map.set(name, [...(map.get(name) ?? []), c.number]);
      }
    }
  }
  return [...map.entries()]
    .map(([name, chapters]) => ({ name, chapters }))
    .sort((x, y) => x.name.localeCompare(y.name, 'pt-BR'));
}

/** Counts shown on the page: automatic from the table of contents unless overridden in the admin. */
export function totalsOf(c: SiteContent) {
  const auto = {
    chapters: c.modules.list.reduce((n, m) => n + m.chapters.length, 0),
    modules: c.modules.list.length,
    authors: authorsOf(c.modules.list).length,
  };
  return {
    chapters: c.stats.chaptersValue.trim() || String(auto.chapters),
    modules: c.stats.modulesValue.trim() || String(auto.modules),
    authors: c.stats.authorsValue.trim() || String(auto.authors),
  };
}

/** Replaces {capitulos}, {modulos}, {autores} and {n} in editable text. */
export function fill(text: string, values: Record<string, string | number>) {
  return text.replace(/\{(\w+)\}/g, (match, key: string) => (key in values ? String(values[key]) : match));
}
