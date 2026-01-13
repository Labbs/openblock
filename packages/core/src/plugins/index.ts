/**
 * Plugins module for OpenBlock.
 *
 * @module
 */

export { createBlockIdPlugin, BLOCK_ID_PLUGIN_KEY } from './blockIdPlugin';
export { createPlugins } from './createPlugins';
export type { CreatePluginsOptions } from './createPlugins';

export {
  createInputRulesPlugin,
  // Block rules
  headingRule,
  bulletListRule,
  orderedListRule,
  blockquoteRule,
  codeBlockRule,
  dividerRule,
  // Inline formatting rules
  boldRule,
  italicRule,
  inlineCodeRule,
  strikethroughRule,
} from './inputRules';
export type { InputRulesConfig } from './inputRules';

export {
  createDragDropPlugin,
  DRAG_DROP_PLUGIN_KEY,
  getBlockPosFromHandle,
  moveBlock,
} from './dragDropPlugin';
export type { DragDropConfig, DragDropState } from './dragDropPlugin';

export {
  createSlashMenuPlugin,
  SLASH_MENU_PLUGIN_KEY,
  closeSlashMenu,
  executeSlashCommand,
  getDefaultSlashMenuItems,
  filterSlashMenuItems,
} from './slashMenuPlugin';
export type { SlashMenuConfig, SlashMenuState, SlashMenuItem } from './slashMenuPlugin';

export {
  createBubbleMenuPlugin,
  BUBBLE_MENU_PLUGIN_KEY,
  hideBubbleMenu,
  isMarkActive,
} from './bubbleMenuPlugin';
export type { BubbleMenuConfig, BubbleMenuState, BlockTypeInfo, TextAlign } from './bubbleMenuPlugin';

export {
  createMultiBlockSelectionPlugin,
  MULTI_BLOCK_SELECTION_KEY,
  selectBlock,
  clearBlockSelection,
  getSelectedBlocks,
  isMultiBlockSelectionActive,
} from './multiBlockSelectionPlugin';
export type { MultiBlockSelectionConfig, MultiBlockSelectionState } from './multiBlockSelectionPlugin';

