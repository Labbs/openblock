/**
 * ColumnList node specification - Container for multi-column layouts.
 *
 * A columnList contains multiple column nodes that are displayed side by side.
 * Each column can contain any block content.
 *
 * @example
 * ```json
 * {
 *   "type": "columnList",
 *   "content": [
 *     { "type": "column", "attrs": { "width": 50 }, "content": [...] },
 *     { "type": "column", "attrs": { "width": 50 }, "content": [...] }
 *   ]
 * }
 * ```
 *
 * @module
 */

import { NodeSpec, DOMOutputSpec, Node as PMNode } from 'prosemirror-model';

import { getBlockIdAttrs, blockIdToDOM, safeParseInt } from '../blockIdAttrs';

/**
 * ColumnList node spec for ProseMirror.
 *
 * Represents a horizontal container for columns.
 */
export const columnListNode: NodeSpec = {
  group: 'block',
  content: 'column+',
  defining: true,
  isolating: true,

  attrs: {
    /** Unique block identifier */
    id: { default: null },
    /** Gap between columns in pixels */
    gap: { default: 16 },
  },

  parseDOM: [
    {
      tag: 'div[data-column-list]',
      getAttrs(dom: HTMLElement): Record<string, unknown> {
        return {
          ...getBlockIdAttrs(dom),
          gap: safeParseInt(dom.getAttribute('data-gap'), 16),
        };
      },
    },
  ],

  toDOM(node: PMNode): DOMOutputSpec {
    const attrs: Record<string, string> = {
      'data-column-list': '',
      'data-gap': String(node.attrs.gap),
      class: 'ob-column-list',
      style: `gap: ${node.attrs.gap}px`,
      ...blockIdToDOM(node),
    };

    return ['div', attrs, 0];
  },
};
