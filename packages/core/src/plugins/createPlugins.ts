/**
 * Default plugin factory for OpenBlock.
 *
 * @module
 */

import { Schema } from 'prosemirror-model';
import { Plugin } from 'prosemirror-state';
import { history, undo, redo } from 'prosemirror-history';
import { keymap } from 'prosemirror-keymap';
import { baseKeymap } from 'prosemirror-commands';
import { dropCursor } from 'prosemirror-dropcursor';
import { gapCursor } from 'prosemirror-gapcursor';

import { createBlockIdPlugin } from './blockIdPlugin';
import { createInputRulesPlugin, InputRulesConfig } from './inputRules';
import { createDragDropPlugin, DragDropConfig } from './dragDropPlugin';
import { createSlashMenuPlugin, SlashMenuConfig } from './slashMenuPlugin';
import { createBubbleMenuPlugin, BubbleMenuConfig } from './bubbleMenuPlugin';
import { createMultiBlockSelectionPlugin, MultiBlockSelectionConfig } from './multiBlockSelectionPlugin';

/**
 * Options for creating plugins.
 */
export interface CreatePluginsOptions {
  /**
   * The ProseMirror schema.
   * Required for input rules to work correctly.
   */
  schema?: Schema;

  /**
   * Function to toggle a mark by name.
   * Used for formatting keyboard shortcuts.
   */
  toggleMark?: (markName: string) => boolean;

  /**
   * Configuration for input rules (markdown shortcuts).
   * Set to false to disable all input rules.
   * @default true (all rules enabled)
   */
  inputRules?: InputRulesConfig | false;

  /**
   * Configuration for drag & drop.
   * Set to false to disable drag & drop entirely.
   * @default true (enabled with default config)
   */
  dragDrop?: DragDropConfig | false;

  /**
   * Configuration for slash menu (/ command palette).
   * Set to false to disable the slash menu.
   * @default true (enabled with default config)
   */
  slashMenu?: SlashMenuConfig | false;

  /**
   * Configuration for bubble menu (formatting toolbar on selection).
   * Set to false to disable the bubble menu.
   * @default true (enabled with default config)
   */
  bubbleMenu?: BubbleMenuConfig | false;

  /**
   * Configuration for multi-block selection.
   * Set to false to disable multi-block selection.
   * @default true (enabled with default config)
   */
  multiBlockSelection?: MultiBlockSelectionConfig | false;

  /**
   * Additional plugins to include.
   */
  additionalPlugins?: Plugin[];
}

/**
 * Creates the default set of plugins for OpenBlock.
 *
 * Includes:
 * - History (undo/redo)
 * - Base keymap (standard editing commands)
 * - Formatting keymap (Mod-b, Mod-i, Mod-u)
 * - Input rules (markdown shortcuts like # for headings)
 * - Drag & drop (block-level drag with handles)
 * - Slash menu (/ command palette for inserting blocks)
 * - Bubble menu (formatting toolbar on text selection)
 * - Drop cursor (visual feedback during drag)
 * - Gap cursor (cursor at block boundaries)
 * - Block ID plugin (automatic ID assignment)
 *
 * @example
 * ```typescript
 * import { createPlugins } from '@openblock/core';
 *
 * const plugins = createPlugins({
 *   schema: mySchema,
 *   toggleMark: (name) => editor.pm.toggleMark(name),
 *   inputRules: { headings: true, bulletLists: true },
 *   additionalPlugins: [myCustomPlugin],
 * });
 * ```
 *
 * @param options - Plugin creation options
 * @returns Array of ProseMirror plugins
 */
export function createPlugins(options: CreatePluginsOptions = {}): Plugin[] {
  const { schema, toggleMark, inputRules, dragDrop, slashMenu, bubbleMenu, multiBlockSelection, additionalPlugins = [] } = options;

  const plugins: Plugin[] = [
    // History for undo/redo
    history(),

    // Standard editing commands
    keymap(baseKeymap),

    // Undo/redo keyboard shortcuts
    keymap({
      'Mod-z': undo,
      'Mod-y': redo,
      'Mod-Shift-z': redo,
    }),

    // Drop cursor visual feedback
    dropCursor(),

    // Gap cursor for block boundaries
    gapCursor(),

    // Automatic block ID assignment
    createBlockIdPlugin(),
  ];

  // Add formatting keymap if toggleMark is provided
  if (toggleMark) {
    plugins.splice(3, 0, keymap({
      'Mod-b': () => toggleMark('bold'),
      'Mod-i': () => toggleMark('italic'),
      'Mod-u': () => toggleMark('underline'),
    }));
  }

  // Add input rules for markdown shortcuts (requires schema)
  if (schema && inputRules !== false) {
    const rulesConfig = typeof inputRules === 'object' ? inputRules : {};
    plugins.push(createInputRulesPlugin(schema, rulesConfig));
  }

  // Add drag & drop plugin
  if (dragDrop !== false) {
    const dragDropConfig = typeof dragDrop === 'object' ? dragDrop : {};
    plugins.push(createDragDropPlugin(dragDropConfig));
  }

  // Add slash menu plugin
  if (slashMenu !== false) {
    const slashMenuConfig = typeof slashMenu === 'object' ? slashMenu : {};
    plugins.push(createSlashMenuPlugin(slashMenuConfig));
  }

  // Add bubble menu plugin
  if (bubbleMenu !== false) {
    const bubbleMenuConfig = typeof bubbleMenu === 'object' ? bubbleMenu : {};
    plugins.push(createBubbleMenuPlugin(bubbleMenuConfig));
  }

  // Add multi-block selection plugin
  if (multiBlockSelection !== false) {
    const multiBlockConfig = typeof multiBlockSelection === 'object' ? multiBlockSelection : {};
    plugins.push(createMultiBlockSelectionPlugin(multiBlockConfig));
  }

  // Add user plugins
  plugins.push(...additionalPlugins);

  return plugins;
}
