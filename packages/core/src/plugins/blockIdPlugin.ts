/**
 * Block ID Plugin.
 *
 * Ensures every block node has a unique ID attribute.
 *
 * @module
 */

import { Plugin, PluginKey } from 'prosemirror-state';
import { generateId } from '../utils/generateId';

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
 * import { createBlockIdPlugin } from '@labbs/openblock-core';
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
        // Ids only live on block nodes (columns included): inline nodes are
        // never reached since textblock content is skipped below.
        // Only assign an ID if the node type defines an id attribute.
        if (node.attrs.id === undefined) {
          return !node.inlineContent;
        }

        const id = node.attrs.id as string | null;

        // Assign a fresh ID when missing, or when duplicated in the doc
        if (!id || seenIds.has(id)) {
          nodesToUpdate.push({
            pos,
            attrs: { ...node.attrs, id: generateId() },
          });
        } else {
          seenIds.add(id);
        }

        // Ids only live on block nodes: skip inline content (text nodes are
        // the bulk of the document, and this runs on every edit)
        return !node.inlineContent;
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
