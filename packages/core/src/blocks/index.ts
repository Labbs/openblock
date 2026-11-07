/**
 * Blocks module for OpenBlock.
 *
 * Handles block types and conversion between JSON blocks and ProseMirror nodes.
 *
 * @module
 */

// Types
export type {
  TextStyles,
  StyledText,
  LinkContent,
  HardBreakContent,
  InlineContent,
  Block,
  PartialBlock,
  BlockIdentifier,
  BlockPlacement,
} from './types';

// Conversion functions
export { blockToNode, blocksToDoc } from './blockToNode';
export { nodeToBlock, docToBlocks } from './nodeToBlock';
export { findBlockById } from './findBlock';
