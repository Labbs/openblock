/**
 * Schema factory for OpenBlock.
 *
 * Creates the ProseMirror schema from node and mark specifications.
 *
 * @module
 */

import { Schema } from 'prosemirror-model';

import {
  docNode,
  paragraphNode,
  headingNode,
  textNode,
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
 * @returns A ProseMirror Schema instance
 */
export function createSchema(): Schema {
  return new Schema({
    nodes: DEFAULT_NODES,
    marks: DEFAULT_MARKS,
  });
}
