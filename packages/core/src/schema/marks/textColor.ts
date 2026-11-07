/**
 * Text color mark specification.
 *
 * @module
 */

import type { MarkSpec, DOMOutputSpec, Mark } from 'prosemirror-model';

import { sanitizeCssColor } from '../sanitizeStyle';

/**
 * Text color mark spec.
 *
 * Renders as `<span style="color: ...">` in HTML.
 *
 * The color is validated (hex, color functions, named colors and
 * `var(--x)` only): invalid colors are ignored when parsing DOM and not
 * rendered (attrs can also arrive through JSON, bypassing parseDOM).
 *
 * @example
 * ```typescript
 * // In block content:
 * {
 *   type: 'text',
 *   text: 'Red text',
 *   styles: {
 *     textColor: '#ff0000'
 *   }
 * }
 * ```
 */
export const textColorMark: MarkSpec = {
  attrs: {
    color: {},
  },
  parseDOM: [
    {
      style: 'color',
      getAttrs(value: string) {
        const color = sanitizeCssColor(value);
        return color === null ? false : { color };
      },
    },
    {
      tag: 'span[data-text-color]',
      getAttrs(dom: HTMLElement) {
        const color = sanitizeCssColor(dom.getAttribute('data-text-color'));
        return color === null ? false : { color };
      },
    },
  ],
  toDOM(mark: Mark): DOMOutputSpec {
    const color = sanitizeCssColor(mark.attrs.color);
    if (color === null) return ['span', 0];
    return [
      'span',
      {
        'data-text-color': color,
        style: `color: ${color}`,
      },
      0,
    ];
  },
};
