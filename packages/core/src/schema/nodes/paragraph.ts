/**
 * Paragraph node specification.
 *
 * The basic text block. Supports inline content with marks.
 *
 * @module
 */

import type { NodeSpec, DOMOutputSpec, Node as PMNode } from 'prosemirror-model';

import { blockIdAttr, getBlockIdAttrs, blockIdToDOM } from '../blockIdAttrs';

/**
 * Valid text alignment values.
 */
export type TextAlignment = 'left' | 'center' | 'right';

/**
 * Paragraph node spec.
 *
 * A basic text block that can contain inline content (text with formatting).
 * Each paragraph has a unique `id` attribute for block-level operations.
 *
 * @example
 * ```typescript
 * // JSON block representation:
 * {
 *   id: 'abc123',
 *   type: 'paragraph',
 *   props: { textAlign: 'center' },
 *   content: [{ type: 'text', text: 'Hello world', styles: {} }]
 * }
 * ```
 */
export const paragraphNode: NodeSpec = {
  content: 'inline*',
  group: 'block',
  attrs: {
    ...blockIdAttr(),
    textAlign: { default: 'left' },
  },
  parseDOM: [{
    tag: 'p',
    getAttrs(dom) {
      const element = dom as HTMLElement;
      return {
        ...getBlockIdAttrs(element),
        textAlign: element.style.textAlign || 'left',
      };
    },
  }],
  toDOM(node: PMNode): DOMOutputSpec {
    const attrs: Record<string, string> = { ...blockIdToDOM(node) };
    if (node.attrs.textAlign && node.attrs.textAlign !== 'left') {
      attrs.style = `text-align: ${node.attrs.textAlign}`;
    }
    return ['p', attrs, 0];
  },
};
