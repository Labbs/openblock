/**
 * Background color mark specification.
 *
 * @module
 */

import type { MarkSpec, DOMOutputSpec, Mark } from 'prosemirror-model';

import { sanitizeCssColor } from '../sanitizeStyle';

/**
 * Background color mark spec.
 *
 * Renders as `<span style="background-color: ...">` in HTML.
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
 *   text: 'Highlighted text',
 *   styles: {
 *     backgroundColor: '#ffff00'
 *   }
 * }
 * ```
 */
export const backgroundColorMark: MarkSpec = {
  attrs: {
    color: {},
  },
  parseDOM: [
    {
      style: 'background-color',
      getAttrs(value: string) {
        const color = sanitizeCssColor(value);
        return color === null ? false : { color };
      },
    },
    {
      tag: 'span[data-background-color]',
      getAttrs(dom: HTMLElement) {
        const color = sanitizeCssColor(dom.getAttribute('data-background-color'));
        return color === null ? false : { color };
      },
    },
    {
      tag: 'mark',
      getAttrs(dom: HTMLElement) {
        return { color: sanitizeCssColor(dom.style.backgroundColor) ?? '#ffff00' };
      },
    },
  ],
  toDOM(mark: Mark): DOMOutputSpec {
    const color = sanitizeCssColor(mark.attrs.color);
    if (color === null) return ['span', 0];
    return [
      'span',
      {
        'data-background-color': color,
        style: `background-color: ${color}; border-radius: 2px; padding: 0 2px;`,
      },
      0,
    ];
  },
};
