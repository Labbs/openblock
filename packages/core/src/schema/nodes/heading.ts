/**
 * Heading node specification.
 *
 * Supports levels 1-6 (h1-h6).
 *
 * @module
 */

import type { NodeSpec, DOMOutputSpec, Node as PMNode } from 'prosemirror-model';

import { blockIdAttr, getBlockIdAttrs, blockIdToDOM } from '../blockIdAttrs';
import { sanitizeTextAlign } from '../sanitizeStyle';

/**
 * Clamps a heading level to an integer in 1-6 (defaults to 1).
 */
function sanitizeLevel(value: unknown): number {
  const level = Number(value);
  return Number.isInteger(level) && level >= 1 && level <= 6 ? level : 1;
}

/**
 * Heading node spec.
 *
 * A heading block with configurable level (1-6).
 * Each heading has a unique `id` attribute for block-level operations.
 *
 * @example
 * ```typescript
 * // JSON block representation:
 * {
 *   id: 'xyz789',
 *   type: 'heading',
 *   props: { level: 2, textAlign: 'center' },
 *   content: [{ type: 'text', text: 'My Title', styles: { bold: true } }]
 * }
 * ```
 */
export const headingNode: NodeSpec = {
  content: 'inline*',
  group: 'block',
  attrs: {
    ...blockIdAttr(),
    level: { default: 1 },
    textAlign: { default: 'left' },
  },
  parseDOM: [1, 2, 3, 4, 5, 6].map((level) => ({
    tag: `h${level}`,
    getAttrs: (dom: HTMLElement) => ({
      ...getBlockIdAttrs(dom),
      level,
      textAlign: sanitizeTextAlign(dom.style.textAlign),
    }),
  })),
  toDOM(node: PMNode): DOMOutputSpec {
    const attrs: Record<string, string> = { ...blockIdToDOM(node) };
    // Attrs can come from JSON / collaboration, so re-validate here.
    const textAlign = sanitizeTextAlign(node.attrs.textAlign);
    if (textAlign !== 'left') {
      attrs.style = `text-align: ${textAlign}`;
    }
    return [`h${sanitizeLevel(node.attrs.level)}`, attrs, 0];
  },
};
