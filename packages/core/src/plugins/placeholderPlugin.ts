/**
 * Placeholder Plugin.
 *
 * Shows placeholder text on empty paragraphs. The text is rendered by CSS
 * (`.ProseMirror p.is-empty::before { content: attr(data-placeholder); }`),
 * this plugin only adds the `is-empty` class and `data-placeholder` attribute.
 *
 * The placeholder is shown on an empty paragraph when it is the only block
 * in the document, or when the cursor is inside it.
 *
 * @module
 */

import { Plugin, PluginKey } from 'prosemirror-state';
import { Decoration, DecorationSet } from 'prosemirror-view';
import type { Node } from 'prosemirror-model';
import type { Block } from '../blocks/types';
import { nodeToBlock } from '../blocks/nodeToBlock';

/** Placeholder text: a fixed string, or a function of the block it decorates. */
export type PlaceholderConfig = string | ((block: Block) => string);

export const PLACEHOLDER_PLUGIN_KEY = new PluginKey('placeholder');

/**
 * Create the placeholder plugin.
 *
 * @param placeholder - Static text or a function receiving the block
 */
export function createPlaceholderPlugin(placeholder: PlaceholderConfig): Plugin {
  const textFor = (node: Node): string =>
    typeof placeholder === 'string' ? placeholder : placeholder(nodeToBlock(node));

  return new Plugin({
    key: PLACEHOLDER_PLUGIN_KEY,
    props: {
      decorations(state) {
        const { doc, selection } = state;
        const decorations: Decoration[] = [];
        const decorate = (node: Node, pos: number) => {
          decorations.push(
            Decoration.node(pos, pos + node.nodeSize, {
              class: 'is-empty',
              'data-placeholder': textFor(node),
            })
          );
        };
        const isEmptyParagraph = (node: Node) =>
          node.type.name === 'paragraph' && node.content.size === 0;

        // Only block in the document
        const first = doc.firstChild;
        if (doc.childCount === 1 && first && isEmptyParagraph(first)) {
          decorate(first, 0);
        }

        // Empty paragraph containing the cursor (may be nested, e.g. in a column)
        const { $from, empty } = selection;
        if (empty && $from.depth > 0) {
          const parent = $from.parent;
          const pos = $from.before($from.depth);
          if (isEmptyParagraph(parent) && !(doc.childCount === 1 && pos === 0)) {
            decorate(parent, pos);
          }
        }

        return decorations.length ? DecorationSet.create(doc, decorations) : null;
      },
    },
  });
}
