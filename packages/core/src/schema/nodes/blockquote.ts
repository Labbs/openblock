/**
 * Blockquote node specification.
 *
 * A block-level quotation element for cited or highlighted text.
 *
 * @module
 */

import type { NodeSpec, DOMOutputSpec, Node as PMNode } from 'prosemirror-model';

import { blockIdAttr, getBlockIdAttrs, blockIdToDOM } from '../blockIdAttrs';

/**
 * Blockquote node spec.
 *
 * Renders as a `<blockquote>` element. Can contain inline content
 * with formatting marks.
 *
 * @example
 * ```typescript
 * // JSON block representation:
 * {
 *   id: 'quote-1',
 *   type: 'blockquote',
 *   props: {},
 *   content: [{ type: 'text', text: 'To be or not to be...', styles: { italic: true } }]
 * }
 * ```
 */
export const blockquoteNode: NodeSpec = {
  content: 'inline*',
  group: 'block',
  attrs: {
    ...blockIdAttr(),
  },
  parseDOM: [{ tag: 'blockquote', getAttrs: (dom: HTMLElement) => getBlockIdAttrs(dom) }],
  toDOM(node: PMNode): DOMOutputSpec {
    return ['blockquote', { class: 'openblock-blockquote', ...blockIdToDOM(node) }, 0];
  },
};
