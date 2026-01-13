/**
 * Schema module for OpenBlock.
 *
 * Exports node specs, mark specs, and the schema factory.
 *
 * @module
 */

export { createSchema, DEFAULT_NODES, DEFAULT_MARKS } from './createSchema';

// Re-export individual node specs for extension authors
export {
  docNode,
  paragraphNode,
  headingNode,
  textNode,
  blockquoteNode,
  codeBlockNode,
  dividerNode,
  bulletListNode,
  orderedListNode,
  listItemNode,
} from './nodes';
export type { TextAlignment } from './nodes';

// Re-export individual mark specs for extension authors
export {
  boldMark,
  italicMark,
  underlineMark,
  strikethroughMark,
  codeMark,
  linkMark,
  textColorMark,
  backgroundColorMark,
} from './marks';
