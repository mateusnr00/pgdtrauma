/**
 * The landing page lives at drmarcosrassi.com.br/pgdtrauma: the WordPress site on the main domain
 * forwards that path to this app. Every route, asset and link is served under this prefix.
 */
export const BASE_PATH = '/pgdtrauma';

/** Prefixes a root-relative path ("/media/x.png") with the base path; leaves URLs and anchors alone. */
export function withBase(path: string) {
  if (!path.startsWith('/') || path.startsWith('//') || path === BASE_PATH || path.startsWith(`${BASE_PATH}/`)) return path;
  return `${BASE_PATH}${path}`;
}

/** The editing panel's own address. */
export const ADMIN_HOST = 'admin.drmarcosrassi.com.br';
