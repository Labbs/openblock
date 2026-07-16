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
import { createTablePlugin, TablePluginConfig } from './tablePlugin';
import { createKeyboardShortcutsPlugin, KeyboardShortcutsConfig } from './keyboardShortcutsPlugin';
import { createChecklistPlugin, ChecklistPluginConfig } from './checklistPlugin';
import { createMediaMenuPlugin } from './mediaMenuPlugin';

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
   * Whether to include the history (undo/redo) plugin.
   * Set to false to disable history (e.g., when using y.js collaboration).
   * Can be toggled at runtime via editor.enableHistory() / editor.disableHistory().
   * @default true
   */
  history?: boolean;

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
   * Configuration for table editing (Tab navigation, row/column shortcuts).
   * Set to false to disable table editing.
   * @default true (enabled with default config)
   */
  table?: TablePluginConfig | false;

  /**
   * Configuration for keyboard shortcuts.
   * Set to false to disable the default keyboard shortcuts plugin.
   * @default true (enabled with all default shortcuts)
   */
  keyboardShortcuts?: KeyboardShortcutsConfig | false;

  /**
   * Configuration for checklist interactions (checkbox clicks).
   * Set to false to disable the checklist plugin.
   * @default true (enabled with default config)
   */
  checklist?: ChecklistPluginConfig | false;

  /**
   * Whether to enable the media menu plugin (image/embed selection toolbar).
   * Set to false to disable the media menu.
   * @default true (enabled)
   */
  mediaMenu?: boolean;

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
  const { schema, toggleMark, inputRules, dragDrop, slashMenu, bubbleMenu, multiBlockSelection, table, keyboardShortcuts, checklist, mediaMenu, additionalPlugins = [] } = options;
  const includeHistory = options.history !== false;

  // The plugin array is assembled from explicit, ordered sections.
  // Order matters for key handling: plugins listed before keymap(baseKeymap)
  // get to handle key events (Enter, Mod-A, ...) before the base commands.

  // --- Section 1: history ------------------------------------------------
  // Can be disabled for y.js collaboration
  const historyPlugins: Plugin[] = includeHistory ? [history()] : [];

  // --- Section 2: plugins that must run BEFORE baseKeymap ----------------
  const beforeBaseKeymap: Plugin[] = [];

  // Slash menu: handles Escape (and lets the menu intercept Enter) while active
  if (slashMenu !== false) {
    beforeBaseKeymap.push(createSlashMenuPlugin(typeof slashMenu === 'object' ? slashMenu : {}));
  }

  // Checklist: handles Enter/Shift+Enter inside checklists
  if (checklist !== false) {
    beforeBaseKeymap.push(createChecklistPlugin(typeof checklist === 'object' ? checklist : {}));
  }

  // Multi-block selection: must see Mod-A/Escape/Delete before baseKeymap,
  // otherwise selectAll consumes Mod-A and "select all blocks" is unreachable
  if (multiBlockSelection !== false) {
    const multiBlockConfig = typeof multiBlockSelection === 'object' ? multiBlockSelection : {};
    beforeBaseKeymap.push(createMultiBlockSelectionPlugin(multiBlockConfig));
  }

  // Table editing: Tab navigation must win over list indentation shortcuts
  if (table !== false) {
    beforeBaseKeymap.push(createTablePlugin(typeof table === 'object' ? table : {}));
  }

  // Keyboard shortcuts (formatting, undo/redo, block types)
  if (schema && keyboardShortcuts !== false) {
    const keyboardConfig = typeof keyboardShortcuts === 'object' ? keyboardShortcuts : {};
    beforeBaseKeymap.push(createKeyboardShortcutsPlugin(schema, keyboardConfig));
  } else if (toggleMark) {
    // Fallback: if no schema but toggleMark is provided, use the old formatting keymap
    if (includeHistory) {
      // Only bind undo/redo when history is enabled
      beforeBaseKeymap.push(keymap({
        'Mod-z': undo,
        'Mod-y': redo,
        'Mod-Shift-z': redo,
      }));
    }
    beforeBaseKeymap.push(keymap({
      'Mod-b': () => toggleMark('bold'),
      'Mod-i': () => toggleMark('italic'),
      'Mod-u': () => toggleMark('underline'),
    }));
  }

  // --- Section 3: base editing behavior ----------------------------------
  const basePlugins: Plugin[] = [
    // Standard editing commands
    keymap(baseKeymap),

    // Drop cursor visual feedback
    dropCursor(),

    // Gap cursor for block boundaries
    gapCursor(),

    // Automatic block ID assignment
    createBlockIdPlugin(),
  ];

  // --- Section 4: enhancements (order-insensitive) ------------------------
  const enhancementPlugins: Plugin[] = [];

  // Input rules for markdown shortcuts (requires schema)
  if (schema && inputRules !== false) {
    const rulesConfig = typeof inputRules === 'object' ? inputRules : {};
    enhancementPlugins.push(createInputRulesPlugin(schema, rulesConfig));
  }

  // Drag & drop
  if (dragDrop !== false) {
    const dragDropConfig = typeof dragDrop === 'object' ? dragDrop : {};
    enhancementPlugins.push(createDragDropPlugin(dragDropConfig));
  }

  // Bubble menu (formatting toolbar on selection)
  if (bubbleMenu !== false) {
    const bubbleMenuConfig = typeof bubbleMenu === 'object' ? bubbleMenu : {};
    enhancementPlugins.push(createBubbleMenuPlugin(bubbleMenuConfig));
  }

  // Media menu (image/embed selection toolbar)
  if (mediaMenu !== false) {
    enhancementPlugins.push(createMediaMenuPlugin());
  }

  return [
    ...historyPlugins,
    ...beforeBaseKeymap,
    ...basePlugins,
    ...enhancementPlugins,
    ...additionalPlugins,
  ];
}
