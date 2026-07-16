/**
 * Table plugin for OpenBlock.
 *
 * Provides keyboard shortcuts for table manipulation:
 * - Tab: Move to next cell (creates new row if at end)
 * - Shift+Tab: Move to previous cell
 * - Mod+Alt+ArrowUp: Add row above
 * - Mod+Alt+ArrowDown: Add row below
 * - Mod+Alt+ArrowLeft: Add column before
 * - Mod+Alt+ArrowRight: Add column after
 * - Mod+Backspace: Delete row (when in table)
 *
 * @module
 */

import { Plugin, EditorState, Transaction } from 'prosemirror-state';
import { keymap } from 'prosemirror-keymap';
import {
  findTableContext,
  goToNextCell,
  goToPreviousCell,
  addRowAfter,
  addRowBefore,
  addColumnAfter,
  addColumnBefore,
  deleteRow,
} from '../commands/tableCommands';

/**
 * ProseMirror command type.
 */
type Command = (state: EditorState, dispatch?: (tr: Transaction) => void) => boolean;

/**
 * Configuration for the table plugin.
 */
export interface TablePluginConfig {
  /**
   * Whether Tab navigates between cells.
   * @default true
   */
  tabNavigation?: boolean;

  /**
   * Whether to add a new row when Tab is pressed in the last cell.
   * @default true
   */
  addRowOnTab?: boolean;
}

/**
 * Creates the table keymap plugin.
 *
 * @param config - Plugin configuration
 * @returns A ProseMirror plugin
 */
export function createTablePlugin(config: TablePluginConfig = {}): Plugin {
  const { tabNavigation = true, addRowOnTab = true } = config;

  const keys: Record<string, Command> = {};

  if (tabNavigation) {
    if (addRowOnTab) {
      // goToNextCell adds a new row when Tab is pressed in the last cell
      keys['Tab'] = goToNextCell;
    } else {
      // Same navigation, but stay put in the last cell instead of adding a row
      keys['Tab'] = (state, dispatch) => {
        const ctx = findTableContext(state);
        if (!ctx) return false;

        const isLastCell =
          ctx.rowIndex === ctx.rowCount - 1 && ctx.cellIndex === ctx.colCount - 1;
        if (isLastCell) {
          // Consume Tab (don't indent/lose focus) without adding a row
          return true;
        }

        return goToNextCell(state, dispatch);
      };
    }
    keys['Shift-Tab'] = goToPreviousCell;
  }

  // Row operations
  keys['Mod-Alt-ArrowDown'] = addRowAfter;
  keys['Mod-Alt-ArrowUp'] = addRowBefore;

  // Column operations
  keys['Mod-Alt-ArrowRight'] = addColumnAfter;
  keys['Mod-Alt-ArrowLeft'] = addColumnBefore;

  // Delete row with Mod+Shift+Backspace
  keys['Mod-Shift-Backspace'] = deleteRow;

  return keymap(keys);
}
