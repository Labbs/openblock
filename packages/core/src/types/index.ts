/**
 * OpenBlock Core Types.
 *
 * Re-exports types from various modules for convenience.
 * All types are PUBLIC - this is a core principle of OpenBlock.
 *
 * @module
 */

// Block types - re-export from blocks module
export type {
  TextStyles,
  StyledText,
  LinkContent,
  InlineContent,
  Block,
  PartialBlock,
  BlockIdentifier,
  BlockPlacement,
} from '../blocks/types';

// Editor event types - re-export from editor module
export type { EditorEvents, EventHandler } from '../editor/EditorConfig';
