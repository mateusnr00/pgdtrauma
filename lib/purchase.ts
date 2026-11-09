import { BASE_PATH } from '@/lib/base-path';

/**
 * Purchase buttons go through /comprar, which counts the click (with the button's position) and
 * redirects to the link set in the admin. Without a link, they scroll to the closing section.
 */
export const purchaseLink = (purchaseUrl: string, position: string) =>
  purchaseUrl ? `${BASE_PATH}/comprar?de=${encodeURIComponent(position)}` : '#adquirir';
