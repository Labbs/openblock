/**
 * Block lookup helpers.
 *
 * @module
 */

import type { Node as PMNode } from 'prosemirror-model';

/**
 * Finds a block node by its id.
 *
 * Block ids only live on block nodes, so inline content (text, hard breaks)
 * is never visited, and the search stops at the first match - unlike
 * `doc.descendants`, which cannot skip the remaining siblings.
 *
 * @param doc - The document (or any node) to search in
 * @param id - The block id to look for
 * @returns The node and its position, or null if not found
 */
export function findBlockById(doc: PMNode, id: string): { node: PMNode; pos: number } | null {
  return id ? searchChildren(doc, 0, id) : null;
}

function searchChildren(
  parent: PMNode,
  start: number,
  id: string
): { node: PMNode; pos: number } | null {
  let pos = start;
  for (let i = 0; i < parent.childCount; i++) {
    const child = parent.child(i);
    if (child.attrs.id === id) return { node: child, pos };
    if (!child.inlineContent && child.childCount > 0) {
      const found = searchChildren(child, pos + 1, id);
      if (found) return found;
    }
    pos += child.nodeSize;
  }
  return null;
}
