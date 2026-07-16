/**
 * List item node specification.
 *
 * A single item within a bullet or ordered list.
 *
 * @module
 */

import type { NodeSpec, DOMOutputSpec, Node as PMNode } from 'prosemirror-model';

import { blockIdAttr, getBlockIdAttrs, blockIdToDOM } from '../blockIdAttrs';

/**
 * List item node spec.
 *
 * Renders as an `<li>` element. Can contain inline content directly,
 * or nested block content (including nested lists).
 *
 * @example
 * ```typescript
 * // JSON block representation (simple):
 * {
 *   id: 'item-1',
 *   type: 'listItem',
 *   props: {},
 *   content: [{ type: 'text', text: 'List item text', styles: {} }]
 * }
 *
 * // With nested list:
 * {
 *   id: 'item-1',
 *   type: 'listItem',
 *   props: {},
 *   content: [{ type: 'text', text: 'Parent item', styles: {} }],
 *   children: [
 *     { type: 'bulletList', children: [...] }
 *   ]
 * }
 * ```
 */
export const listItemNode: NodeSpec = {
  // Can contain a paragraph followed by optional nested lists
  content: 'paragraph block*',
  attrs: {
    ...blockIdAttr(),
  },
  // Allow list items to define their own boundary for operations
  defining: true,
  parseDOM: [{ tag: 'li', getAttrs: (dom: HTMLElement) => getBlockIdAttrs(dom) }],
  toDOM(node: PMNode): DOMOutputSpec {
    return ['li', { class: 'openblock-list-item', ...blockIdToDOM(node) }, 0];
  },
};
