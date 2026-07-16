/**
 * URL sanitization helpers for the OpenBlock schema.
 *
 * Prevents XSS via `javascript:` (and other dangerous protocols) in
 * user-provided URLs (link hrefs, image sources, embed URLs).
 *
 * @module
 */

/**
 * Base URL used to resolve relative URLs during validation.
 * The host is irrelevant - it only lets `new URL()` parse relative paths.
 */
const DUMMY_BASE = 'https://x.invalid';

/**
 * Protocols allowed for link hrefs.
 */
const LINK_PROTOCOLS = new Set(['http:', 'https:', 'mailto:', 'tel:']);

/**
 * Returns the protocol of a URL, resolving relative URLs against a dummy
 * https base (so relative URLs report `https:`). Returns null if the URL
 * cannot be parsed at all.
 */
function getProtocol(url: string): string | null {
  try {
    return new URL(url, DUMMY_BASE).protocol.toLowerCase();
  } catch {
    return null;
  }
}

/**
 * Validates a link href.
 *
 * Allows http:, https:, mailto:, tel: and relative URLs.
 *
 * @returns The href unchanged if safe, or null if it must be rejected.
 */
export function sanitizeLinkHref(href: unknown): string | null {
  if (typeof href !== 'string' || href.length === 0) return null;
  const protocol = getProtocol(href);
  if (protocol === null || !LINK_PROTOCOLS.has(protocol)) return null;
  return href;
}

/**
 * Validates an embed URL (used as iframe src).
 *
 * Only absolute http: / https: URLs are allowed.
 *
 * @returns The URL unchanged if safe, or null if it must be rejected.
 */
export function sanitizeEmbedUrl(url: unknown): string | null {
  if (typeof url !== 'string' || url.length === 0) return null;
  try {
    // No base: embed URLs must be absolute.
    const protocol = new URL(url).protocol.toLowerCase();
    if (protocol !== 'http:' && protocol !== 'https:') return null;
    return url;
  } catch {
    return null;
  }
}

/**
 * Validates an image src.
 *
 * Allows http:, https:, relative URLs, `blob:` object URLs and
 * `data:image/*` data URLs.
 *
 * @returns The src unchanged if safe, or null if it must be rejected.
 */
export function sanitizeImageSrc(src: unknown): string | null {
  if (typeof src !== 'string' || src.length === 0) return null;
  const protocol = getProtocol(src);
  if (protocol === null) return null;
  if (protocol === 'http:' || protocol === 'https:' || protocol === 'blob:') return src;
  if (protocol === 'data:' && /^data:image\//i.test(src.trim())) return src;
  return null;
}
