/**
 * Block ID Plugin.
 *
 * Ensures every block node has a unique ID attribute.
 *
 * @module
 */

import { Plugin, PluginKey } from 'prosemirror-state';
import { v4 as uuid } from 'uuid';

/**
 * Plugin key for the block ID tracking plugin.
 */
export const BLOCK_ID_PLUGIN_KEY = new PluginKey('blockIds');

/**
 * Creates a plugin that automatically assigns IDs to block nodes.
 *
 * This plugin runs after every transaction and checks all block nodes.
 * Any node without an `id` attribute gets a UUID assigned.
 *
 * @example
 * ```typescript
 * import { createBlockIdPlugin } from '@openblock/core';
 *
 * const plugins = [
 *   createBlockIdPlugin(),
 *   // ... other plugins
 * ];
 * ```
 *
 * @returns A ProseMirror Plugin
 */
export function createBlockIdPlugin(): Plugin {
  return new Plugin({
    key: BLOCK_ID_PLUGIN_KEY,

    appendTransaction(transactions, _oldState, newState) {
      // Only scan the document when it actually changed
      if (!transactions.some((tr) => tr.docChanged)) {
        return null;
      }

      // Collect all nodes that need IDs first, then apply changes
      const nodesToUpdate: Array<{ pos: number; attrs: Record<string, unknown> }> = [];
      // Track IDs already seen to regenerate duplicates (e.g., copy/paste)
      const seenIds = new Set<string>();

      newState.doc.descendants((node, pos) => {
        // Only handle block nodes (plus column nodes, which need IDs too)
        if (!node.isBlock && node.type.name !== 'column') {
          return;
        }

        // Only assign ID if the node type has an id attribute defined
        if (node.attrs.id === undefined) {
          return;
        }

        const id = node.attrs.id as string | null;

        // Assign a fresh ID when missing, or when duplicated in the doc
        if (!id || seenIds.has(id)) {
          nodesToUpdate.push({
            pos,
            attrs: { ...node.attrs, id: uuid() },
          });
        } else {
          seenIds.add(id);
        }
      });

      // If no updates needed, return null
      if (nodesToUpdate.length === 0) {
        return null;
      }

      // Apply all updates in reverse order to avoid position shifts
      let tr = newState.tr;
      for (let i = nodesToUpdate.length - 1; i >= 0; i--) {
        const { pos, attrs } = nodesToUpdate[i];
        tr = tr.setNodeMarkup(pos, undefined, attrs);
      }

      return tr;
    },
  });
}
