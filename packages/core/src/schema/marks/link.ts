/**
 * Link mark specification.
 *
 * @module
 */

import type { MarkSpec, DOMOutputSpec, Mark } from 'prosemirror-model';

import { sanitizeLinkHref } from '../sanitizeUrl';

/**
 * Link mark spec.
 *
 * Renders as `<a>` in HTML. Supports href, title, and target attributes.
 *
 * The href is validated (http:, https:, mailto:, tel: and relative URLs
 * only): unsafe hrefs are rejected when parsing DOM, and neutralized to `#`
 * when rendering (attrs can also arrive through JSON, bypassing parseDOM).
 * Links with `target="_blank"` get `rel="noopener noreferrer"`.
 *
 * @example
 * ```typescript
 * // In block content:
 * {
 *   type: 'text',
 *   text: 'Click here',
 *   styles: {
 *     link: { href: 'https://example.com', title: 'Example' }
 *   }
 * }
 * ```
 */
export const linkMark: MarkSpec = {
  attrs: {
    href: {},
    title: { default: null },
    target: { default: null },
  },
  // Links don't extend to adjacent text typed at link boundaries
  inclusive: false,
  parseDOM: [
    {
      tag: 'a[href]',
      getAttrs(dom: HTMLElement) {
        const href = sanitizeLinkHref(dom.getAttribute('href'));
        // Reject links with unsafe hrefs (e.g. javascript:) entirely
        if (href === null) return false;
        return {
          href,
          title: dom.getAttribute('title'),
          target: dom.getAttribute('target'),
        };
      },
    },
  ],
  toDOM(mark: Mark): DOMOutputSpec {
    // Attrs can come from JSON (not only parseDOM), so neutralize here too.
    const href = sanitizeLinkHref(mark.attrs.href) ?? '#';
    const target = mark.attrs.target;
    return [
      'a',
      {
        href,
        title: mark.attrs.title,
        target,
        ...(target === '_blank' ? { rel: 'noopener noreferrer' } : {}),
      },
      0,
    ];
  },
};
