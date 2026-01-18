/**
 * Slash Menu Plugin for OpenBlock.
 *
 * Detects when the user types "/" at the start of a block and provides
 * state for rendering a command menu to insert new block types.
 *
 * @module
 */

import { Plugin, PluginKey, EditorState, TextSelection } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';

/**
 * Plugin key for accessing slash menu state.
 */
export const SLASH_MENU_PLUGIN_KEY = new PluginKey<SlashMenuState>('slashMenu');

/**
 * State for the slash menu plugin.
 */
export interface SlashMenuState {
  /** Whether the slash menu is currently active */
  active: boolean;
  /** The search query after the "/" (e.g., "/hea" → "hea") */
  query: string;
  /** Position where the "/" was typed */
  triggerPos: number;
  /** Screen coordinates for positioning the menu */
  coords: { left: number; top: number; bottom: number } | null;
  /** If set, insert new block after this block position (for add button) */
  insertAfterBlock?: number;
}

/**
 * A menu item for the slash menu.
 */
export interface SlashMenuItem {
  /** Unique identifier for this item */
  id: string;
  /** Display title */
  title: string;
  /** Optional description */
  description?: string;
  /** Icon name or component key */
  icon?: string;
  /** Keywords for filtering (searched along with title) */
  keywords?: string[];
  /** Group/category for organizing items */
  group?: string;
  /** Action to execute when selected */
  action: (view: EditorView, state: SlashMenuState) => void;
}

/**
 * Configuration for the slash menu plugin.
 */
export interface SlashMenuConfig {
  /**
   * Character that triggers the menu.
   * @default '/'
   */
  trigger?: string;

  /**
   * Whether to only trigger at the start of a block.
   * @default true
   */
  onlyAtStart?: boolean;
}

/**
 * Creates the slash menu plugin.
 *
 * This plugin:
 * - Detects when "/" is typed (optionally only at block start)
 * - Tracks the search query as the user continues typing
 * - Provides coordinates for menu positioning
 * - Closes on Escape, click outside, or selection change
 *
 * The actual menu UI is rendered by the framework adapter (React/Vue).
 *
 * @example
 * ```typescript
 * import { createSlashMenuPlugin, SLASH_MENU_PLUGIN_KEY } from '@openblock/core';
 *
 * const plugin = createSlashMenuPlugin({ onlyAtStart: true });
 *
 * // In React component:
 * const state = SLASH_MENU_PLUGIN_KEY.getState(editor.pm.state);
 * if (state?.active) {
 *   // Render menu at state.coords
 * }
 * ```
 *
 * @param config - Plugin configuration
 * @returns A ProseMirror plugin
 */
export function createSlashMenuPlugin(config: SlashMenuConfig = {}): Plugin {
  const { trigger = '/', onlyAtStart = true } = config;

  return new Plugin<SlashMenuState>({
    key: SLASH_MENU_PLUGIN_KEY,

    state: {
      init(): SlashMenuState {
        return {
          active: false,
          query: '',
          triggerPos: 0,
          coords: null,
        };
      },

      apply(tr, state, _oldEditorState, newEditorState): SlashMenuState {
        // Check for explicit meta commands
        const meta = tr.getMeta(SLASH_MENU_PLUGIN_KEY);
        if (meta) {
          if (meta.close) {
            return { active: false, query: '', triggerPos: 0, coords: null };
          }
          return { ...state, ...meta };
        }

        // If menu is not active, check for trigger
        if (!state.active) {
          // Only check on text input
          if (!tr.docChanged) return state;

          const { $from } = newEditorState.selection;

          // Get the text before cursor in the current text block
          const textBefore = $from.parent.textContent.slice(0, $from.parentOffset);

          // Check if we just typed the trigger character
          if (textBefore.endsWith(trigger)) {
            // If onlyAtStart, check that it's at the start of the block
            if (onlyAtStart && textBefore !== trigger) {
              return state;
            }

            return {
              active: true,
              query: '',
              triggerPos: $from.pos - trigger.length,
              coords: null, // Will be set by the view
            };
          }

          return state;
        }

        // Menu is active - update query or close
        if (!tr.docChanged && tr.selectionSet) {
          // Selection changed without doc change - close menu
          return { active: false, query: '', triggerPos: 0, coords: null };
        }

        const { $from } = newEditorState.selection;
        const textBefore = $from.parent.textContent.slice(0, $from.parentOffset);

        // Find the trigger position relative to current text
        const triggerIndex = textBefore.lastIndexOf(trigger);

        if (triggerIndex === -1) {
          // Trigger was deleted - close menu
          return { active: false, query: '', triggerPos: 0, coords: null };
        }

        // Extract query (text after trigger)
        const query = textBefore.slice(triggerIndex + trigger.length);

        // Close if query contains spaces (user probably moved on)
        if (query.includes(' ')) {
          return { active: false, query: '', triggerPos: 0, coords: null };
        }

        return { ...state, query };
      },
    },

    props: {
      handleKeyDown(view, event) {
        const state = SLASH_MENU_PLUGIN_KEY.getState(view.state);
        if (!state?.active) return false;

        // Close on Escape
        if (event.key === 'Escape') {
          view.dispatch(view.state.tr.setMeta(SLASH_MENU_PLUGIN_KEY, { close: true }));
          return true;
        }

        // Let arrow keys and Enter be handled by the menu component
        // via DOM events, not here
        return false;
      },

      handleClick(view) {
        const state = SLASH_MENU_PLUGIN_KEY.getState(view.state);
        if (state?.active) {
          // Check if click is outside the trigger position
          const { from } = view.state.selection;
          if (from < state.triggerPos || from > state.triggerPos + state.query.length + 1) {
            view.dispatch(view.state.tr.setMeta(SLASH_MENU_PLUGIN_KEY, { close: true }));
          }
        }
        return false;
      },
    },

    view(_editorView) {
      return {
        update(view) {
          const state = SLASH_MENU_PLUGIN_KEY.getState(view.state);
          if (state?.active && !state.coords) {
            // Calculate coordinates for menu positioning
            const coords = view.coordsAtPos(state.triggerPos);
            view.dispatch(
              view.state.tr.setMeta(SLASH_MENU_PLUGIN_KEY, {
                coords: { left: coords.left, top: coords.top, bottom: coords.bottom },
              })
            );
          }
        },
      };
    },
  });
}

/**
 * Close the slash menu programmatically.
 *
 * @param view - The editor view
 */
export function closeSlashMenu(view: EditorView): void {
  view.dispatch(view.state.tr.setMeta(SLASH_MENU_PLUGIN_KEY, { close: true }));
}

/**
 * Execute a slash menu action and clean up.
 *
 * Removes the trigger text (e.g., "/heading") and executes the action.
 * Handles the case where the menu was opened programmatically (no "/" to delete).
 * When opened via add button (insertAfterBlock), inserts a new block after the current one.
 *
 * @param view - The editor view
 * @param state - Current slash menu state
 * @param action - The action to execute
 */
export function executeSlashCommand(
  view: EditorView,
  state: SlashMenuState,
  action: (view: EditorView, state: SlashMenuState) => void
): void {
  const { triggerPos, query, insertAfterBlock } = state;

  // If opened via add button, we need to insert after the block
  if (insertAfterBlock !== undefined) {
    const node = view.state.doc.nodeAt(insertAfterBlock);
    if (node) {
      // Calculate position after the current block
      const insertPos = insertAfterBlock + node.nodeSize;

      // Set selection to the insert position so action can use replaceSelectionWith
      const tr = view.state.tr;
      tr.setSelection(TextSelection.create(view.state.doc, insertPos));
      tr.setMeta(SLASH_MENU_PLUGIN_KEY, { close: true });
      view.dispatch(tr);

      // Execute the action (which will insert at the new position)
      action(view, state);
      return;
    }
  }

  // Normal case: delete the "/" and query, then execute action
  const tr = view.state.tr;

  // Check if there's actually a "/" at the trigger position
  // (menu might have been opened programmatically without inserting "/")
  const textAtTrigger = view.state.doc.textBetween(
    triggerPos,
    Math.min(triggerPos + 1, view.state.doc.content.size),
    ''
  );

  if (textAtTrigger === '/') {
    // Delete the trigger and query text
    tr.delete(triggerPos, triggerPos + 1 + query.length); // +1 for the "/" character
  }

  tr.setMeta(SLASH_MENU_PLUGIN_KEY, { close: true });
  view.dispatch(tr);

  // Execute the action
  action(view, state);
}

/**
 * Default menu items for the slash menu.
 *
 * @param schema - The ProseMirror schema
 * @returns Array of menu items
 */
export function getDefaultSlashMenuItems(schema: EditorState['schema']): SlashMenuItem[] {
  const items: SlashMenuItem[] = [];

  // Headings
  if (schema.nodes.heading) {
    items.push(
      {
        id: 'heading1',
        title: 'Heading 1',
        description: 'Large section heading',
        icon: 'heading1',
        keywords: ['h1', 'title', 'large'],
        group: 'Basic blocks',
        action: (view, _state) => {
          const node = schema.nodes.heading.create({ level: 1 });
          view.dispatch(view.state.tr.replaceSelectionWith(node));
        },
      },
      {
        id: 'heading2',
        title: 'Heading 2',
        description: 'Medium section heading',
        icon: 'heading2',
        keywords: ['h2', 'subtitle'],
        group: 'Basic blocks',
        action: (view, _state) => {
          const node = schema.nodes.heading.create({ level: 2 });
          view.dispatch(view.state.tr.replaceSelectionWith(node));
        },
      },
      {
        id: 'heading3',
        title: 'Heading 3',
        description: 'Small section heading',
        icon: 'heading3',
        keywords: ['h3'],
        group: 'Basic blocks',
        action: (view, _state) => {
          const node = schema.nodes.heading.create({ level: 3 });
          view.dispatch(view.state.tr.replaceSelectionWith(node));
        },
      }
    );
  }

  // Lists
  if (schema.nodes.bulletList && schema.nodes.listItem) {
    items.push({
      id: 'bulletList',
      title: 'Bullet List',
      description: 'Create a bulleted list',
      icon: 'list',
      keywords: ['ul', 'unordered', 'bullets'],
      group: 'Lists',
      action: (view, _state) => {
        const item = schema.nodes.listItem.create(
          null,
          schema.nodes.paragraph.create()
        );
        const list = schema.nodes.bulletList.create(null, item);
        view.dispatch(view.state.tr.replaceSelectionWith(list));
      },
    });
  }

  if (schema.nodes.orderedList && schema.nodes.listItem) {
    items.push({
      id: 'orderedList',
      title: 'Numbered List',
      description: 'Create a numbered list',
      icon: 'listOrdered',
      keywords: ['ol', 'ordered', 'numbers'],
      group: 'Lists',
      action: (view, _state) => {
        const item = schema.nodes.listItem.create(
          null,
          schema.nodes.paragraph.create()
        );
        const list = schema.nodes.orderedList.create(null, item);
        view.dispatch(view.state.tr.replaceSelectionWith(list));
      },
    });
  }

  // Quote
  if (schema.nodes.blockquote) {
    items.push({
      id: 'quote',
      title: 'Quote',
      description: 'Capture a quotation',
      icon: 'quote',
      keywords: ['blockquote', 'citation'],
      group: 'Basic blocks',
      action: (view, _state) => {
        const node = schema.nodes.blockquote.create();
        view.dispatch(view.state.tr.replaceSelectionWith(node));
      },
    });
  }

  // Callout
  if (schema.nodes.callout) {
    items.push(
      {
        id: 'calloutInfo',
        title: 'Callout',
        description: 'Highlight important information',
        icon: 'info',
        keywords: ['callout', 'alert', 'note', 'info', 'highlight'],
        group: 'Basic blocks',
        action: (view, _state) => {
          const node = schema.nodes.callout.create({ calloutType: 'info' });
          view.dispatch(view.state.tr.replaceSelectionWith(node));
        },
      },
      {
        id: 'calloutWarning',
        title: 'Warning',
        description: 'Show a warning message',
        icon: 'alertTriangle',
        keywords: ['callout', 'alert', 'warning', 'caution'],
        group: 'Basic blocks',
        action: (view, _state) => {
          const node = schema.nodes.callout.create({ calloutType: 'warning' });
          view.dispatch(view.state.tr.replaceSelectionWith(node));
        },
      },
      {
        id: 'calloutSuccess',
        title: 'Success',
        description: 'Show a success message',
        icon: 'checkCircle',
        keywords: ['callout', 'success', 'done', 'tip'],
        group: 'Basic blocks',
        action: (view, _state) => {
          const node = schema.nodes.callout.create({ calloutType: 'success' });
          view.dispatch(view.state.tr.replaceSelectionWith(node));
        },
      },
      {
        id: 'calloutError',
        title: 'Error',
        description: 'Show an error message',
        icon: 'xCircle',
        keywords: ['callout', 'error', 'danger', 'important'],
        group: 'Basic blocks',
        action: (view, _state) => {
          const node = schema.nodes.callout.create({ calloutType: 'error' });
          view.dispatch(view.state.tr.replaceSelectionWith(node));
        },
      }
    );
  }

  // Code block
  if (schema.nodes.codeBlock) {
    items.push({
      id: 'codeBlock',
      title: 'Code Block',
      description: 'Display code with syntax highlighting',
      icon: 'code',
      keywords: ['pre', 'programming', 'snippet'],
      group: 'Basic blocks',
      action: (view, _state) => {
        const node = schema.nodes.codeBlock.create();
        view.dispatch(view.state.tr.replaceSelectionWith(node));
      },
    });
  }

  // Divider
  if (schema.nodes.divider) {
    items.push({
      id: 'divider',
      title: 'Divider',
      description: 'Visual separator between sections',
      icon: 'minus',
      keywords: ['hr', 'horizontal', 'line', 'separator'],
      group: 'Basic blocks',
      action: (view, _state) => {
        const { tr, schema: s } = view.state;
        const divider = schema.nodes.divider.create();
        const paragraph = s.nodes.paragraph.create();
        // Insert divider and a new paragraph after it
        tr.replaceSelectionWith(divider);
        tr.insert(tr.selection.to, paragraph);
        view.dispatch(tr);
      },
    });
  }

  // Columns
  if (schema.nodes.columnList && schema.nodes.column) {
    items.push(
      {
        id: 'columns2',
        title: '2 Columns',
        description: 'Split into two columns',
        icon: 'columns',
        keywords: ['col', 'layout', 'split', 'two'],
        group: 'Layout',
        action: (view, _state) => {
          const col1 = schema.nodes.column.create(
            { width: 50 },
            schema.nodes.paragraph.create()
          );
          const col2 = schema.nodes.column.create(
            { width: 50 },
            schema.nodes.paragraph.create()
          );
          const columnList = schema.nodes.columnList.create(null, [col1, col2]);
          view.dispatch(view.state.tr.replaceSelectionWith(columnList));
        },
      },
      {
        id: 'columns3',
        title: '3 Columns',
        description: 'Split into three columns',
        icon: 'columns',
        keywords: ['col', 'layout', 'split', 'three'],
        group: 'Layout',
        action: (view, _state) => {
          const col1 = schema.nodes.column.create(
            { width: 33.33 },
            schema.nodes.paragraph.create()
          );
          const col2 = schema.nodes.column.create(
            { width: 33.33 },
            schema.nodes.paragraph.create()
          );
          const col3 = schema.nodes.column.create(
            { width: 33.34 },
            schema.nodes.paragraph.create()
          );
          const columnList = schema.nodes.columnList.create(null, [col1, col2, col3]);
          view.dispatch(view.state.tr.replaceSelectionWith(columnList));
        },
      },
      {
        id: 'columnsSidebar',
        title: 'Sidebar Left',
        description: 'Small sidebar with main content',
        icon: 'columns',
        keywords: ['col', 'layout', 'sidebar', 'aside'],
        group: 'Layout',
        action: (view, _state) => {
          const sidebar = schema.nodes.column.create(
            { width: 30 },
            schema.nodes.paragraph.create()
          );
          const main = schema.nodes.column.create(
            { width: 70 },
            schema.nodes.paragraph.create()
          );
          const columnList = schema.nodes.columnList.create(null, [sidebar, main]);
          view.dispatch(view.state.tr.replaceSelectionWith(columnList));
        },
      }
    );
  }

  // Tables
  if (schema.nodes.table && schema.nodes.tableRow && schema.nodes.tableCell) {
    items.push(
      {
        id: 'table',
        title: 'Table',
        description: 'Insert a table (3x3)',
        icon: 'table',
        keywords: ['grid', 'spreadsheet', 'rows', 'columns'],
        group: 'Layout',
        action: (view, _state) => {
          const createRow = (colCount: number) => {
            const cells = [];
            for (let i = 0; i < colCount; i++) {
              cells.push(
                schema.nodes.tableCell.create(null, schema.nodes.paragraph.create())
              );
            }
            return schema.nodes.tableRow.create(null, cells);
          };

          const rows = [];
          for (let i = 0; i < 3; i++) {
            rows.push(createRow(3));
          }

          const table = schema.nodes.table.create(null, rows);
          view.dispatch(view.state.tr.replaceSelectionWith(table));
        },
      },
      {
        id: 'table2x2',
        title: 'Table 2x2',
        description: 'Insert a small table (2x2)',
        icon: 'table',
        keywords: ['grid', 'small', 'simple'],
        group: 'Layout',
        action: (view, _state) => {
          const createRow = (colCount: number) => {
            const cells = [];
            for (let i = 0; i < colCount; i++) {
              cells.push(
                schema.nodes.tableCell.create(null, schema.nodes.paragraph.create())
              );
            }
            return schema.nodes.tableRow.create(null, cells);
          };

          const rows = [];
          for (let i = 0; i < 2; i++) {
            rows.push(createRow(2));
          }

          const table = schema.nodes.table.create(null, rows);
          view.dispatch(view.state.tr.replaceSelectionWith(table));
        },
      },
      {
        id: 'table4x4',
        title: 'Table 4x4',
        description: 'Insert a larger table (4x4)',
        icon: 'table',
        keywords: ['grid', 'large', 'big'],
        group: 'Layout',
        action: (view, _state) => {
          const createRow = (colCount: number) => {
            const cells = [];
            for (let i = 0; i < colCount; i++) {
              cells.push(
                schema.nodes.tableCell.create(null, schema.nodes.paragraph.create())
              );
            }
            return schema.nodes.tableRow.create(null, cells);
          };

          const rows = [];
          for (let i = 0; i < 4; i++) {
            rows.push(createRow(4));
          }

          const table = schema.nodes.table.create(null, rows);
          view.dispatch(view.state.tr.replaceSelectionWith(table));
        },
      }
    );
  }

  // Image
  if (schema.nodes.image) {
    items.push({
      id: 'image',
      title: 'Image',
      description: 'Insert an image',
      icon: 'image',
      keywords: ['img', 'picture', 'photo', 'media'],
      group: 'Media',
      action: (view) => {
        const node = schema.nodes.image.create({ src: '', alt: '' });
        view.dispatch(view.state.tr.replaceSelectionWith(node));
      },
    });
  }

  // Checklist / Todo
  if (schema.nodes.checkList && schema.nodes.checkListItem) {
    items.push({
      id: 'checklist',
      title: 'To-do list',
      description: 'Track tasks with checkboxes',
      icon: 'checkSquare',
      keywords: ['todo', 'task', 'checkbox', 'check', 'list'],
      group: 'Lists',
      action: (view) => {
        const item = schema.nodes.checkListItem.create({ checked: false });
        const list = schema.nodes.checkList.create(null, [item]);
        view.dispatch(view.state.tr.replaceSelectionWith(list));
      },
    });
  }

  // Embed
  if (schema.nodes.embed) {
    items.push(
      {
        id: 'embed',
        title: 'Embed',
        description: 'Embed external content (YouTube, etc.)',
        icon: 'embed',
        keywords: ['video', 'youtube', 'vimeo', 'iframe', 'external'],
        group: 'Media',
        action: (view) => {
          const node = schema.nodes.embed.create({ url: '', provider: 'generic' });
          view.dispatch(view.state.tr.replaceSelectionWith(node));
        },
      },
      {
        id: 'youtube',
        title: 'YouTube',
        description: 'Embed a YouTube video',
        icon: 'youtube',
        keywords: ['video', 'embed', 'media'],
        group: 'Media',
        action: (view) => {
          const node = schema.nodes.embed.create({ url: '', provider: 'youtube' });
          view.dispatch(view.state.tr.replaceSelectionWith(node));
        },
      }
    );
  }

  return items;
}

/**
 * Filter menu items based on query.
 *
 * @param items - All available menu items
 * @param query - Search query
 * @returns Filtered and sorted items
 */
export function filterSlashMenuItems(
  items: SlashMenuItem[],
  query: string
): SlashMenuItem[] {
  if (!query) return items;

  const lowerQuery = query.toLowerCase();

  return items
    .filter((item) => {
      // Match against title
      if (item.title.toLowerCase().includes(lowerQuery)) return true;
      // Match against keywords
      if (item.keywords?.some((kw) => kw.toLowerCase().includes(lowerQuery))) return true;
      return false;
    })
    .sort((a, b) => {
      // Prioritize exact title matches
      const aExact = a.title.toLowerCase().startsWith(lowerQuery);
      const bExact = b.title.toLowerCase().startsWith(lowerQuery);
      if (aExact && !bExact) return -1;
      if (!aExact && bExact) return 1;
      return 0;
    });
}
