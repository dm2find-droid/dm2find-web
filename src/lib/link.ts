/**
 * Decide how a link should open.
 *
 * Anything that leaves DM2find opens in a new tab, so a visitor reading a
 * destination page never loses it by tapping a tourist office's website.
 * Our own hosts stay in the same tab: dm2find.ai and its subdomains, which
 * includes chat.dm2find.ai — the concierge is the product, not somewhere else.
 *
 * rel="noopener" always travels with target="_blank": without it the opened
 * page can reach back through window.opener.
 *
 * Usage:
 *   import { linkAttrs } from '../lib/link';
 *   <a href={url} {...linkAttrs(url)}>…</a>
 */
const OURS = /(^|\.)dm2find\.(ai|com)$/i;

export function isExternal(href: string | null | undefined): boolean {
  if (!href) return false;
  if (/^(mailto:|tel:|#|\/)/i.test(href)) return false;   // internal or not a page
  try {
    return !OURS.test(new URL(href).hostname);
  } catch {
    return false;                                          // relative path
  }
}

export function linkAttrs(href: string | null | undefined) {
  return isExternal(href)
    ? { target: '_blank', rel: 'noopener noreferrer' }
    : {};
}
