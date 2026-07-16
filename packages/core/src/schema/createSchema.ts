/**
 * Schema factory for OpenBlock.
 *
 * Creates the ProseMirror schema from node and mark specifications.
 *
 * @module
 */

import { Schema, NodeSpec, MarkSpec } from 'prosemirror-model';

import {
  docNode,
  paragraphNode,
  headingNode,
  textNode,
  hardBreakNode,
  blockquoteNode,
  calloutNode,
  codeBlockNode,
  dividerNode,
  bulletListNode,
  orderedListNode,
  listItemNode,
  columnListNode,
  columnNode,
  tableNode,
  tableRowNode,
  tableCellNode,
  tableHeaderNode,
  imageNode,
  checkListNode,
  checkListItemNode,
  embedNode,
} from './nodes';
import {
  boldMark,
  italicMark,
  underlineMark,
  strikethroughMark,
  codeMark,
  linkMark,
  textColorMark,
  backgroundColorMark,
} from './marks';

/**
 * Default node specifications.
 *
 * Includes: doc, paragraph, heading, text, blockquote, callout, codeBlock, divider, lists, columns
 */
export const DEFAULT_NODES = {
  doc: docNode,
  paragraph: paragraphNode,
  heading: headingNode,
  text: textNode,
  hardBreak: hardBreakNode,
  blockquote: blockquoteNode,
  callout: calloutNode,
  codeBlock: codeBlockNode,
  divider: dividerNode,
  bulletList: bulletListNode,
  orderedList: orderedListNode,
  listItem: listItemNode,
  columnList: columnListNode,
  column: columnNode,
  table: tableNode,
  tableRow: tableRowNode,
  tableCell: tableCellNode,
  tableHeader: tableHeaderNode,
  image: imageNode,
  checkList: checkListNode,
  checkListItem: checkListItemNode,
  embed: embedNode,
};

/**
 * Default mark specifications.
 *
 * Includes: bold, italic, underline, strikethrough, code, link, textColor, backgroundColor
 */
export const DEFAULT_MARKS = {
  bold: boldMark,
  italic: italicMark,
  underline: underlineMark,
  strikethrough: strikethroughMark,
  code: codeMark,
  link: linkMark,
  textColor: textColorMark,
  backgroundColor: backgroundColorMark,
};

/**
 * Returns true when not running in a production build.
 */
function isDevEnvironment(): boolean {
  const env = (globalThis as { process?: { env?: { NODE_ENV?: string } } }).process?.env?.NODE_ENV;
  return env !== 'production';
}

/**
 * Warns (in dev) when a custom spec overrides one of the default specs.
 */
function warnOnDefaultOverrides(
  kind: 'node' | 'mark',
  defaults: Record<string, unknown>,
  custom: Record<string, unknown> | undefined
): void {
  if (!custom || !isDevEnvironment()) return;
  for (const name of Object.keys(custom)) {
    if (name in defaults) {
      console.warn(
        `[openblock] Custom ${kind} "${name}" overrides the default ${kind} spec. ` +
          'This may break editor behavior (especially "doc" and "text").'
      );
    }
  }
}

/**
 * Creates the default OpenBlock schema.
 *
 * Combines node and mark specifications into a ProseMirror Schema instance.
 * This is the schema used internally by the editor.
 *
 * @example
 * ```typescript
 * import { createSchema } from '@openblock/core';
 *
 * const schema = createSchema();
 * // schema.nodes.paragraph, schema.marks.bold, etc.
 * ```
 *
 * @param customNodes - Additional node specs (merged over the defaults)
 * @param customMarks - Additional mark specs (merged over the defaults)
 * @returns A ProseMirror Schema instance
 */
export function createSchema(
  customNodes?: Record<string, NodeSpec>,
  customMarks?: Record<string, MarkSpec>
): Schema {
  warnOnDefaultOverrides('node', DEFAULT_NODES, customNodes);
  warnOnDefaultOverrides('mark', DEFAULT_MARKS, customMarks);

  return new Schema({
    nodes: { ...DEFAULT_NODES, ...customNodes },
    marks: { ...DEFAULT_MARKS, ...customMarks },
  });
}
