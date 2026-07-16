/**
 * OpenBlockEditor - The Main Editor Class.
 *
 * This is the primary entry point for OpenBlock.
 * All APIs are PUBLIC - this is a core principle of OpenBlock.
 *
 * @example
 * ```typescript
 * import { OpenBlockEditor } from '@openblock/core';
 *
 * const editor = new OpenBlockEditor({
 *   element: document.getElementById('editor'),
 *   initialContent: [{ type: 'paragraph', content: [] }],
 * });
 *
 * // Access ProseMirror directly - no private API hacking!
 * editor.pm.view        // EditorView
 * editor.pm.state       // EditorState
 * editor.pm.dispatch(tr) // Dispatch transaction
 * ```
 *
 * @module
 */

import { EditorView } from 'prosemirror-view';
import { EditorState, Transaction, Plugin, Selection } from 'prosemirror-state';
import { Schema } from 'prosemirror-model';
import { history as createHistoryPlugin } from 'prosemirror-history';
import { v4 as uuid } from 'uuid';

import { ProseMirrorAPI } from '../pm/ProseMirrorAPI';
import { EditorConfig, defaultConfig, EditorEvents, EventHandler, CollaborationConfig } from './EditorConfig';
import { createSchema } from '../schema';
import { createPlugins, undo, redo } from '../plugins';
import { injectStyles } from '../styles/injectStyles';
import { createPlaceholderPlugin } from '../plugins/placeholderPlugin';
import {
  Block,
  PartialBlock,
  BlockIdentifier,
  BlockPlacement,
  blocksToDoc,
  blockToNode,
  nodeToBlock,
  docToBlocks,
} from '../blocks';

/**
 * OpenBlockEditor - The main editor class.
 *
 * Provides a high-level API for block-based editing while exposing
 * all ProseMirror internals through the `pm` property.
 */
export class OpenBlockEditor {
  /**
   * The ProseMirror API - PUBLIC ACCESS to all PM functionality.
   *
   * This is THE KEY DIFFERENTIATOR of OpenBlock.
   * Unlike BlockNote/Tiptap, everything is accessible here.
   */
  public readonly pm: ProseMirrorAPI;

  /** Internal ProseMirror view */
  private _pmView!: EditorView;

  /** Internal schema */
  private _schema!: Schema;

  /** Configuration */
  private _config: EditorConfig;

  /** Event listeners */
  private _listeners: Map<keyof EditorEvents, Set<EventHandler<unknown>>> = new Map();

  /** Whether the built-in history plugin is currently active */
  private _historyEnabled = true;

  /** Reference to the history plugin instance for dynamic toggling */
  private _historyPlugin: Plugin | null = null;

  /** Collaboration plugins currently active */
  private _collaborationPlugins: Plugin[] = [];

  /** Whether history was enabled before collaboration turned it off */
  private _historyEnabledBeforeCollab = false;

  /** Destroyed flag */
  private _destroyed = false;

  constructor(config: EditorConfig = {}) {
    this._config = { ...defaultConfig, ...config };
    this.pm = new ProseMirrorAPI(this);

    // Auto-inject styles unless explicitly disabled
    if (this._config.injectStyles !== false) {
      injectStyles();
    }

    this._schema = createSchema(this._config.customNodes, this._config.customMarks);
    this._createEditor();

    if (this._config.autoFocus) {
      this.focus(this._config.autoFocus === 'start' ? 'start' : 'end');
    }
  }

  // ===========================================================================
  // EDITOR LIFECYCLE
  // ===========================================================================

  private _createEditor(): void {
    const doc = blocksToDoc(this._schema, this._config.initialContent);
    this._historyEnabled = this._config.history !== false;

    // Create the history plugin separately so we can toggle it at runtime
    this._historyPlugin = this._historyEnabled ? createHistoryPlugin() : null;

    const plugins = createPlugins({
      schema: this._schema,
      toggleMark: (name) => this.pm.toggleMark(name),
      inputRules: this._config.inputRules,
      history: false, // We manage history ourselves
      additionalPlugins: [
        ...(this._historyPlugin ? [this._historyPlugin] : []),
        ...(this._config.placeholder ? [createPlaceholderPlugin(this._config.placeholder)] : []),
        ...(this._config.prosemirror?.plugins ?? []),
      ],
    });

    const state = EditorState.create({ doc, schema: this._schema, plugins });

    this._pmView = new EditorView(this._config.element ?? null, {
      state,
      editable: () => this._config.editable !== false,
      dispatchTransaction: this._handleTransaction.bind(this),
      attributes: {
        class: 'openblock-editor',
        role: 'textbox',
        'aria-multiline': 'true',
      },
      handleDOMEvents: {
        focus: () => {
          this._emit('focus', undefined);
          this._config.onFocus?.();
          return false;
        },
        blur: () => {
          this._emit('blur', undefined);
          this._config.onBlur?.();
          return false;
        },
      },
      // Only nodeViews may be passed as direct view props. User plugins are
      // injected into the state above — passing them here too would register
      // them twice, and prosemirror-view throws on direct plugins with state.
      nodeViews: this._config.prosemirror?.nodeViews,
    });
  }

  private _handleTransaction(tr: Transaction): void {
    if (this._destroyed) return;

    const newState = this._pmView.state.apply(tr);
    this._pmView.updateState(newState);

    // Only pay for the doc -> blocks conversion when someone is listening:
    // it walks and allocates the whole tree, and this is the editor's hot path.
    if (tr.docChanged && (this._listeners.get('change')?.size || this._config.onUpdate)) {
      const blocks = this.getDocument();
      this._emit('change', { blocks });
      this._config.onUpdate?.(blocks);
    }

    if (
      tr.selectionSet &&
      (this._listeners.get('selectionChange')?.size || this._config.onSelectionChange)
    ) {
      const blocks = this.getSelectedBlocks();
      this._emit('selectionChange', { blocks });
      this._config.onSelectionChange?.(blocks);
    }

    this._emit('transaction', { transaction: tr });
  }

  // ===========================================================================
  // DOCUMENT OPERATIONS
  // ===========================================================================

  /**
   * Get the entire document as an array of blocks.
   *
   * @example
   * ```typescript
   * const blocks = editor.getDocument();
   * console.log(JSON.stringify(blocks, null, 2));
   * ```
   */
  getDocument(): Block[] {
    return docToBlocks(this.pm.doc);
  }

  /**
   * Replace the entire document content.
   *
   * @example
   * ```typescript
   * editor.setDocument([
   *   { id: '1', type: 'heading', props: { level: 1 }, content: [{ type: 'text', text: 'Title', styles: {} }] },
   *   { id: '2', type: 'paragraph', props: {}, content: [{ type: 'text', text: 'Content', styles: {} }] },
   * ]);
   * ```
   */
  setDocument(blocks: Block[]): void {
    const doc = blocksToDoc(this._schema, blocks);
    const tr = this.pm.createTransaction();
    tr.replaceWith(0, this.pm.doc.content.size, doc.content);
    this.pm.dispatch(tr);
  }

  /**
   * Find a block by its ID.
   *
   * @param id - The block's unique identifier
   * @returns The block if found, undefined otherwise
   *
   * @example
   * ```typescript
   * const block = editor.getBlock('my-block-id');
   * if (block) {
   *   console.log(block.type, block.props);
   * }
   * ```
   */
  getBlock(id: string): Block | undefined {
    const found = this._findBlockById(id);
    return found ? nodeToBlock(found.node) : undefined;
  }

  /**
   * Locate a block node by id. Stops traversing as soon as it is found
   * (returning false from `descendants` only skips children, so we also
   * short-circuit siblings with a flag).
   */
  private _findBlockById(
    id: string
  ): { node: import('prosemirror-model').Node; pos: number } | null {
    let result: { node: import('prosemirror-model').Node; pos: number } | null = null;
    this.pm.doc.descendants((node, pos) => {
      if (result) return false;
      if (node.attrs.id === id) {
        result = { node, pos };
        return false;
      }
    });
    return result;
  }

  /**
   * Get blocks that overlap with the current selection.
   *
   * Only outermost blocks are returned: a block's children are available
   * through its `children`/`content`, not as separate entries.
   *
   * @returns Array of blocks within the selection range
   */
  getSelectedBlocks(): Block[] {
    const { from, to } = this.pm.selection;
    const blocks: Block[] = [];
    this.pm.doc.nodesBetween(from, to, (node, _pos) => {
      if (node.isBlock && node.type.name !== 'doc') {
        blocks.push(nodeToBlock(node));
        // Don't descend: children are already inside the converted block
        return false;
      }
    });
    return blocks;
  }

  // ===========================================================================
  // BLOCK OPERATIONS
  // ===========================================================================

  /**
   * Insert new blocks relative to an existing block.
   *
   * @param blocks - Blocks to insert (IDs will be generated if not provided)
   * @param referenceBlock - The block ID or block object to position relative to
   * @param placement - Insert 'before' or 'after' the reference block
   *
   * @example
   * ```typescript
   * // Insert a paragraph after block with id 'intro'
   * editor.insertBlocks(
   *   [{ type: 'paragraph', content: [{ type: 'text', text: 'New paragraph', styles: {} }] }],
   *   'intro',
   *   'after'
   * );
   * ```
   */
  insertBlocks(
    blocks: PartialBlock[],
    referenceBlock: BlockIdentifier,
    placement: BlockPlacement = 'after'
  ): void {
    const refId = typeof referenceBlock === 'string' ? referenceBlock : referenceBlock.id;
    const found = refId ? this._findBlockById(refId) : null;

    if (!found) {
      console.warn(`Reference block not found: ${refId}`);
      return;
    }

    const insertPos = placement === 'before' ? found.pos : found.pos + found.node.nodeSize;

    const nodes = blocks.map((block) =>
      blockToNode(this._schema, { ...block, id: block.id || uuid() } as Block)
    );

    const tr = this.pm.createTransaction();
    tr.insert(insertPos, nodes);
    this.pm.dispatch(tr);
  }

  /**
   * Update a block.
   *
   * Updating only `props` patches the node attributes in place. Updating
   * `type`, `content` or `children` rebuilds the block and replaces it.
   *
   * @param block - The block ID or block object to update
   * @param update - Partial block with the new values
   *
   * @example
   * ```typescript
   * // Change a heading's level
   * editor.updateBlock('my-heading', { props: { level: 2 } });
   *
   * // Replace a block's content
   * editor.updateBlock('my-paragraph', {
   *   content: [{ type: 'text', text: 'New text', styles: {} }],
   * });
   * ```
   */
  updateBlock(block: BlockIdentifier, update: Partial<Block>): void {
    const id = typeof block === 'string' ? block : block.id;
    if (!id) return;
    const found = this._findBlockById(id);
    if (!found) return;

    // Props-only update: patch attrs in place (cheap, keeps the selection)
    if (update.type === undefined && update.content === undefined && update.children === undefined) {
      this.pm.setNodeAttrs(found.pos, { ...found.node.attrs, ...update.props });
      return;
    }

    // Structural update: rebuild the block from its serialized form + update
    const merged: Block = { ...nodeToBlock(found.node), ...update, id };
    const newNode = blockToNode(this._schema, merged);
    const tr = this.pm.createTransaction();
    tr.replaceWith(found.pos, found.pos + found.node.nodeSize, newNode);
    this.pm.dispatch(tr);
  }

  /**
   * Remove blocks from the document.
   *
   * @param blocks - Array of block IDs or block objects to remove
   *
   * @example
   * ```typescript
   * editor.removeBlocks(['block-1', 'block-2']);
   * ```
   */
  removeBlocks(blocks: BlockIdentifier[]): void {
    // Use Set for O(1) lookups when checking block IDs
    const ids = new Set(blocks.map((b) => (typeof b === 'string' ? b : b.id)));
    const tr = this.pm.createTransaction();
    const toDelete: Array<{ from: number; to: number }> = [];

    this.pm.doc.descendants((node, pos) => {
      if (ids.has(node.attrs.id)) {
        toDelete.push({ from: pos, to: pos + node.nodeSize });
        // Don't descend: a matching descendant would create a nested range,
        // and deleting it first would invalidate this ancestor's range.
        return false;
      }
    });

    // Delete in reverse order to preserve positions during iteration
    toDelete.reverse().forEach(({ from, to }) => tr.delete(from, to));
    this.pm.dispatch(tr);
  }

  // ===========================================================================
  // HISTORY (UNDO/REDO)
  // ===========================================================================

  /**
   * Undo the last change.
   *
   * @returns True if undo was performed, false if nothing to undo
   *
   * @example
   * ```typescript
   * editor.undo();
   * ```
   */
  undo(): boolean {
    return undo(this._pmView.state, this._pmView.dispatch);
  }

  /**
   * Redo the last undone change.
   *
   * @returns True if redo was performed, false if nothing to redo
   *
   * @example
   * ```typescript
   * editor.redo();
   * ```
   */
  redo(): boolean {
    return redo(this._pmView.state, this._pmView.dispatch);
  }

  /**
   * Whether the history (undo/redo) plugin is currently enabled.
   */
  get isHistoryEnabled(): boolean {
    return this._historyEnabled;
  }

  /**
   * Disable the history plugin at runtime.
   *
   * This is required when using y.js collaboration, as y-prosemirror
   * provides its own undo manager that conflicts with prosemirror-history.
   * The editor is reconfigured in place — no reload needed.
   *
   * @example
   * ```typescript
   * editor.disableHistory();
   * ```
   */
  disableHistory(): void {
    if (!this._historyEnabled || !this._historyPlugin) return;
    this._historyEnabled = false;

    const plugins = this._pmView.state.plugins.filter(p => p !== this._historyPlugin);
    const newState = this._pmView.state.reconfigure({ plugins });
    this._pmView.updateState(newState);
  }

  /**
   * Re-enable the history plugin at runtime.
   *
   * Restores the prosemirror-history plugin after it was disabled.
   * A fresh history plugin is created (previous undo stack is lost).
   *
   * @example
   * ```typescript
   * editor.enableHistory();
   * ```
   */
  enableHistory(): void {
    if (this._historyEnabled) return;
    this._historyEnabled = true;

    // Create a fresh history plugin (old undo stack is gone)
    this._historyPlugin = createHistoryPlugin();

    const plugins = [this._historyPlugin, ...this._pmView.state.plugins];
    const newState = this._pmView.state.reconfigure({ plugins });
    this._pmView.updateState(newState);
  }

  // ===========================================================================
  // COLLABORATION (Y.js)
  // ===========================================================================

  /**
   * Whether collaboration is currently enabled.
   */
  get isCollaborating(): boolean {
    return this._collaborationPlugins.length > 0;
  }

  /**
   * Enable real-time collaboration using y.js.
   *
   * This automatically disables the built-in history plugin
   * (y-prosemirror provides its own undo manager).
   * The editor is reconfigured in place — no reload needed.
   *
   * @param config - Collaboration configuration with y-prosemirror plugins
   *
   * @example
   * ```typescript
   * import * as Y from 'yjs';
   * import { WebsocketProvider } from 'y-websocket';
   * import { ySyncPlugin, yCursorPlugin, yUndoPlugin } from 'y-prosemirror';
   *
   * const ydoc = new Y.Doc();
   * const provider = new WebsocketProvider('ws://localhost:1234', 'room', ydoc);
   * const fragment = ydoc.getXmlFragment('prosemirror');
   *
   * editor.enableCollaboration({
   *   plugins: [
   *     ySyncPlugin(fragment),
   *     yCursorPlugin(provider.awareness),
   *     yUndoPlugin(),
   *   ],
   * });
   * ```
   */
  enableCollaboration(config: CollaborationConfig): void {
    if (this._collaborationPlugins.length > 0) {
      this.disableCollaboration();
    }

    // Disable history — y-prosemirror has its own undo manager.
    // Remember whether it was on, so disableCollaboration() can restore it.
    this._historyEnabledBeforeCollab = this._historyEnabled;
    this.disableHistory();

    // Store and add collaboration plugins
    this._collaborationPlugins = [...config.plugins];

    const plugins = [...this._collaborationPlugins, ...this._pmView.state.plugins];
    const newState = this._pmView.state.reconfigure({ plugins });
    this._pmView.updateState(newState);
  }

  /**
   * Disable real-time collaboration.
   *
   * Removes all collaboration plugins and re-enables the built-in
   * history plugin. The editor is reconfigured in place — no reload needed.
   *
   * @example
   * ```typescript
   * editor.disableCollaboration();
   * ```
   */
  disableCollaboration(): void {
    if (this._collaborationPlugins.length === 0) return;

    const collabSet = new Set(this._collaborationPlugins);
    const plugins = this._pmView.state.plugins.filter(p => !collabSet.has(p));
    this._collaborationPlugins = [];

    const newState = this._pmView.state.reconfigure({ plugins });
    this._pmView.updateState(newState);

    // Restore built-in history only if it was enabled before collaboration
    if (this._historyEnabledBeforeCollab) {
      this.enableHistory();
    }
  }

  // ===========================================================================
  // FORMATTING
  // ===========================================================================

  /** Toggle bold formatting on the current selection. */
  toggleBold(): boolean { return this.pm.toggleMark('bold'); }

  /** Toggle italic formatting on the current selection. */
  toggleItalic(): boolean { return this.pm.toggleMark('italic'); }

  /** Toggle underline formatting on the current selection. */
  toggleUnderline(): boolean { return this.pm.toggleMark('underline'); }

  /** Toggle strikethrough formatting on the current selection. */
  toggleStrikethrough(): boolean { return this.pm.toggleMark('strikethrough'); }

  /** Toggle inline code formatting on the current selection. */
  toggleCode(): boolean { return this.pm.toggleMark('code'); }

  /**
   * Add a link to the current selection.
   *
   * @param href - The URL for the link
   * @param title - Optional title attribute
   */
  setLink(href: string, title?: string): void {
    this.pm.addMark('link', { href, title });
  }

  /** Remove link from the current selection. */
  removeLink(): void { this.pm.removeMark('link'); }

  /**
   * Set text color on the current selection.
   *
   * @param color - CSS color value (hex, rgb, hsl, etc.)
   *
   * @example
   * ```typescript
   * editor.setTextColor('#ff0000');
   * editor.setTextColor('rgb(255, 0, 0)');
   * ```
   */
  setTextColor(color: string): void {
    this.pm.addMark('textColor', { color });
  }

  /** Remove text color from the current selection. */
  removeTextColor(): void { this.pm.removeMark('textColor'); }

  /**
   * Set background color on the current selection.
   *
   * @param color - CSS color value (hex, rgb, hsl, etc.)
   *
   * @example
   * ```typescript
   * editor.setBackgroundColor('#ffff00');
   * editor.setBackgroundColor('rgb(255, 255, 0)');
   * ```
   */
  setBackgroundColor(color: string): void {
    this.pm.addMark('backgroundColor', { color });
  }

  /** Remove background color from the current selection. */
  removeBackgroundColor(): void { this.pm.removeMark('backgroundColor'); }

  // ===========================================================================
  // TEXT ALIGNMENT
  // ===========================================================================

  /**
   * Set text alignment for the current block.
   *
   * @param alignment - The alignment value: 'left', 'center', or 'right'
   *
   * @example
   * ```typescript
   * editor.setTextAlign('center');
   * ```
   */
  setTextAlign(alignment: 'left' | 'center' | 'right'): void {
    const { $from } = this.pm.selection;

    // Find the block to align
    for (let depth = $from.depth; depth > 0; depth--) {
      const node = $from.node(depth);
      // Only align blocks that support textAlign (paragraph, heading)
      if (node.isBlock && node.type.spec.attrs?.textAlign !== undefined) {
        const pos = $from.before(depth);
        const tr = this.pm.createTransaction();
        tr.setNodeMarkup(pos, undefined, { ...node.attrs, textAlign: alignment });
        this.pm.dispatch(tr);
        return;
      }
    }
  }

  /**
   * Get the current text alignment of the block at selection.
   *
   * @returns The current alignment or 'left' as default
   */
  getTextAlign(): 'left' | 'center' | 'right' {
    const { $from } = this.pm.selection;

    for (let depth = $from.depth; depth > 0; depth--) {
      const node = $from.node(depth);
      if (node.isBlock && node.type.spec.attrs?.textAlign !== undefined) {
        return node.attrs.textAlign || 'left';
      }
    }

    return 'left';
  }

  // ===========================================================================
  // BLOCK TYPE CONVERSION
  // ===========================================================================

  /**
   * Convert the block at the current selection to a different type.
   *
   * @param type - The target block type (e.g., 'paragraph', 'heading')
   * @param attrs - Additional attributes for the new block type
   *
   * @example
   * ```typescript
   * // Convert current block to heading level 2
   * editor.setBlockType('heading', { level: 2 });
   *
   * // Convert back to paragraph
   * editor.setBlockType('paragraph');
   * ```
   */
  setBlockType(type: string, attrs: Record<string, unknown> = {}): void {
    const { $from } = this.pm.selection;
    const nodeType = this._schema.nodes[type];

    if (!nodeType) {
      console.warn(`Unknown block type: ${type}`);
      return;
    }

    // Handle list types specially - they need to wrap content in listItem
    if (type === 'bulletList' || type === 'orderedList') {
      this._wrapInList(type);
      return;
    }

    // Find the block to convert
    let pos: number | null = null;
    let blockNode = null;

    for (let depth = $from.depth; depth > 0; depth--) {
      const node = $from.node(depth);
      if (node.isBlock && node.type.name !== 'doc' && node.type.name !== 'listItem') {
        pos = $from.before(depth);
        blockNode = node;
        break;
      }
    }

    if (pos === null || !blockNode) return;

    // If converting from a list to a non-list type, we need to lift the content out
    if (blockNode.type.name === 'bulletList' || blockNode.type.name === 'orderedList') {
      this._unwrapList(type, attrs);
      return;
    }

    // For codeBlock, we need to convert all inline content to plain text
    if (type === 'codeBlock') {
      this._convertToCodeBlock(pos, blockNode);
      return;
    }

    // For simple block type conversions (paragraph, heading, blockquote)
    const newAttrs = {
      id: blockNode.attrs.id,
      ...attrs,
    };

    const tr = this.pm.createTransaction();
    tr.setNodeMarkup(pos, nodeType, newAttrs);
    this.pm.dispatch(tr);
  }

  /**
   * Wrap the current block in a list.
   */
  private _wrapInList(listType: 'bulletList' | 'orderedList'): void {
    const { $from } = this.pm.selection;
    const listNodeType = this._schema.nodes[listType];
    const listItemType = this._schema.nodes.listItem;
    const paragraphType = this._schema.nodes.paragraph;

    if (!listNodeType || !listItemType) return;

    // Find the current block
    let blockPos: number | null = null;
    let blockNode = null;

    for (let depth = $from.depth; depth > 0; depth--) {
      const node = $from.node(depth);
      if (node.isBlock && node.type.name !== 'doc' && node.type.name !== 'listItem') {
        blockPos = $from.before(depth);
        blockNode = node;
        break;
      }
    }

    if (blockPos === null || !blockNode) return;

    // If already in a list, just change the list type
    if (blockNode.type.name === 'bulletList' || blockNode.type.name === 'orderedList') {
      if (blockNode.type.name !== listType) {
        const tr = this.pm.createTransaction();
        tr.setNodeMarkup(blockPos, listNodeType, { id: blockNode.attrs.id });
        this.pm.dispatch(tr);
      }
      return;
    }

    // Get the content of the current block
    const content = blockNode.content;
    const blockId = blockNode.attrs.id;

    // Create the list structure: list > listItem > paragraph
    const paragraph = paragraphType.create({ id: uuid() }, content);
    const listItem = listItemType.create({ id: uuid() }, paragraph);
    const list = listNodeType.create({ id: blockId }, listItem);

    const tr = this.pm.createTransaction();
    tr.replaceWith(blockPos, blockPos + blockNode.nodeSize, list);
    this.pm.dispatch(tr);
  }

  /**
   * Unwrap list content to a different block type.
   */
  private _unwrapList(targetType: string, attrs: Record<string, unknown>): void {
    const { $from } = this.pm.selection;
    const targetNodeType = this._schema.nodes[targetType];

    if (!targetNodeType) return;

    // Find the list node
    let listPos: number | null = null;
    let listNode = null;

    for (let depth = $from.depth; depth > 0; depth--) {
      const node = $from.node(depth);
      if (node.type.name === 'bulletList' || node.type.name === 'orderedList') {
        listPos = $from.before(depth);
        listNode = node;
        break;
      }
    }

    if (listPos === null || !listNode) return;

    // Extract content from the first list item's first paragraph
    let content = this._schema.nodes.paragraph.create().content;
    if (listNode.firstChild && listNode.firstChild.firstChild) {
      content = listNode.firstChild.firstChild.content;
    }

    const newBlock = targetNodeType.create({ id: listNode.attrs.id, ...attrs }, content);

    const tr = this.pm.createTransaction();
    tr.replaceWith(listPos, listPos + listNode.nodeSize, newBlock);
    this.pm.dispatch(tr);
  }

  /**
   * Convert a block to a code block.
   */
  private _convertToCodeBlock(pos: number, node: import('prosemirror-model').Node): void {
    const codeBlockType = this._schema.nodes.codeBlock;
    if (!codeBlockType) return;

    // Get text content (strip marks)
    let text = '';
    node.content.forEach((child) => {
      if (child.isText) {
        text += child.text || '';
      }
    });

    // Create code block with text node (no marks allowed in code)
    const textNode = text ? this._schema.text(text) : null;
    const codeBlock = codeBlockType.create(
      { id: node.attrs.id },
      textNode ? [textNode] : []
    );

    const tr = this.pm.createTransaction();
    tr.replaceWith(pos, pos + node.nodeSize, codeBlock);
    this.pm.dispatch(tr);
  }

  // ===========================================================================
  // COLUMNS
  // ===========================================================================

  /**
   * Insert a column layout at the current position.
   *
   * @param columns - Number of columns or array of widths (percentages)
   *
   * @example
   * ```typescript
   * // Insert 2 equal columns
   * editor.insertColumns(2);
   *
   * // Insert 3 columns with custom widths
   * editor.insertColumns([30, 40, 30]);
   * ```
   */
  insertColumns(columns: number | number[]): void {
    const columnListType = this._schema.nodes.columnList;
    const columnType = this._schema.nodes.column;
    const paragraphType = this._schema.nodes.paragraph;

    if (!columnListType || !columnType || !paragraphType) {
      console.warn('Column nodes not available in schema');
      return;
    }

    let widths: number[];
    if (typeof columns === 'number') {
      // Equal distribution
      widths = Array(columns).fill(100 / columns);
    } else {
      widths = columns;
    }

    const columnNodes = widths.map((width) =>
      columnType.create({ width }, paragraphType.create())
    );

    const columnList = columnListType.create(null, columnNodes);

    // Insert after the current top-level block ($from.end would be an
    // inline position inside the textblock, not a valid block position)
    const { $from } = this.pm.selection;
    const insertPos = $from.depth > 0 ? $from.after(1) : $from.pos;

    const tr = this.pm.createTransaction();
    tr.insert(insertPos, columnList);
    this.pm.dispatch(tr);
  }

  /**
   * Add a column to an existing column layout.
   *
   * @param columnListPos - Position of the columnList node
   * @param position - Where to add: 'start', 'end', or an index
   * @param width - Width for the new column (optional, will redistribute if not provided)
   */
  addColumn(
    columnListPos: number,
    position: 'start' | 'end' | number = 'end',
    width?: number
  ): void {
    const columnType = this._schema.nodes.column;
    const paragraphType = this._schema.nodes.paragraph;
    const columnList = this.pm.doc.nodeAt(columnListPos);

    if (!columnType || !paragraphType || !columnList || columnList.type.name !== 'columnList') {
      return;
    }

    const tr = this.pm.createTransaction();

    // Calculate insert position within columnList
    let insertOffset: number;
    if (position === 'start') {
      insertOffset = 1; // After columnList opening
    } else if (position === 'end') {
      insertOffset = columnList.nodeSize - 1; // Before columnList closing
    } else {
      // Find position after the nth column
      let offset = 1;
      for (let i = 0; i < position && i < columnList.childCount; i++) {
        offset += columnList.child(i).nodeSize;
      }
      insertOffset = offset;
    }

    // Default width: even distribution
    const newWidth = width ?? 100 / (columnList.childCount + 1);
    const newColumn = columnType.create({ width: newWidth }, paragraphType.create());

    tr.insert(columnListPos + insertOffset, newColumn);

    // Optionally redistribute widths evenly
    if (!width) {
      this._setColumnWidthsEvenly(tr, columnListPos, columnList, {
        columnCount: columnList.childCount + 1,
      });
    }

    this.pm.dispatch(tr);
  }

  /**
   * Set every column of a columnList to an even width.
   *
   * Positions are mapped through the transaction, so this can be called
   * after an insert/delete already recorded on `tr`.
   *
   * @param options.skipPos - Position of a column to leave untouched (e.g. one being deleted)
   * @param options.columnCount - Column count to divide by (defaults to current childCount)
   */
  private _setColumnWidthsEvenly(
    tr: Transaction,
    columnListPos: number,
    columnList: import('prosemirror-model').Node,
    options: { skipPos?: number; columnCount?: number } = {}
  ): void {
    const count = options.columnCount ?? columnList.childCount;
    if (count <= 0) return;

    const evenWidth = 100 / count;
    let pos = columnListPos + 1;
    columnList.forEach((col) => {
      if (pos !== options.skipPos) {
        tr.setNodeMarkup(tr.mapping.map(pos), undefined, { ...col.attrs, width: evenWidth });
      }
      pos += col.nodeSize;
    });
  }

  /**
   * Remove a column from a column layout.
   *
   * @param columnPos - Position of the column to remove
   */
  removeColumn(columnPos: number): void {
    const column = this.pm.doc.nodeAt(columnPos);
    if (!column || column.type.name !== 'column') return;

    // Find parent columnList
    const $pos = this.pm.doc.resolve(columnPos);
    const columnListPos = $pos.before($pos.depth);
    const columnList = this.pm.doc.nodeAt(columnListPos);

    if (!columnList || columnList.type.name !== 'columnList') return;

    const tr = this.pm.createTransaction();

    // Going down to one (or zero) column: unwrap the columnList and keep content
    if (columnList.childCount <= 2) {
      const remainingContent: import('prosemirror-model').Node[] = [];
      columnList.forEach((col, offset) => {
        const colPos = columnListPos + 1 + offset;
        // Keep the other columns' content — or this column's own content
        // when it is the only one (removing it just unwraps the layout)
        if (colPos !== columnPos || columnList.childCount === 1) {
          col.forEach((child) => remainingContent.push(child));
        }
      });

      tr.replaceWith(columnListPos, columnListPos + columnList.nodeSize, remainingContent);
    } else {
      // Just remove the column and redistribute widths
      tr.delete(columnPos, columnPos + column.nodeSize);
      this._setColumnWidthsEvenly(tr, columnListPos, columnList, {
        skipPos: columnPos,
        columnCount: columnList.childCount - 1,
      });
    }

    this.pm.dispatch(tr);
  }

  /**
   * Distribute column widths evenly in a column layout.
   *
   * @param columnListPos - Position of the columnList node
   */
  distributeColumns(columnListPos: number): void {
    const columnList = this.pm.doc.nodeAt(columnListPos);
    if (!columnList || columnList.type.name !== 'columnList') return;

    const tr = this.pm.createTransaction();
    this._setColumnWidthsEvenly(tr, columnListPos, columnList);
    this.pm.dispatch(tr);
  }

  // ===========================================================================
  // FOCUS & SELECTION
  // ===========================================================================

  /**
   * Focus the editor.
   *
   * @param position - Where to place the cursor: 'start', 'end', or a specific position
   */
  focus(position: 'start' | 'end' | number = 'end'): void {
    this._pmView.focus();
    // Selection.atStart/atEnd find the nearest valid selection — a raw
    // position like doc.content.size - 1 is invalid when the first/last
    // block is a leaf (divider, image) or a nested structure (list)
    if (position === 'start') {
      this.pm.setSelection(Selection.atStart(this.pm.doc));
    } else if (position === 'end') {
      this.pm.setSelection(Selection.atEnd(this.pm.doc));
    } else {
      this.pm.setSelection(this.pm.createTextSelection(position));
    }
  }

  /** Remove focus from the editor. */
  blur(): void { (this._pmView.dom as HTMLElement).blur(); }

  /** Whether the editor currently has focus. */
  get hasFocus(): boolean { return this._pmView.hasFocus(); }

  // ===========================================================================
  // SERIALIZATION
  // ===========================================================================

  /** Serialize the document to JSON (alias for getDocument). */
  toJSON(): Block[] { return this.getDocument(); }

  /** Load document from JSON (alias for setDocument). */
  fromJSON(blocks: Block[]): void { this.setDocument(blocks); }

  // ===========================================================================
  // EVENTS
  // ===========================================================================

  /**
   * Subscribe to editor events.
   *
   * @param event - Event name: 'change', 'selectionChange', 'focus', 'blur', 'transaction'
   * @param handler - Callback function
   * @returns Unsubscribe function
   *
   * @example
   * ```typescript
   * const unsubscribe = editor.on('change', ({ blocks }) => {
   *   console.log('Document changed:', blocks);
   * });
   *
   * // Later: unsubscribe()
   * ```
   */
  on<K extends keyof EditorEvents>(event: K, handler: EventHandler<EditorEvents[K]>): () => void {
    let listeners = this._listeners.get(event);
    if (!listeners) {
      listeners = new Set();
      this._listeners.set(event, listeners);
    }
    listeners.add(handler as EventHandler<unknown>);
    return () => this.off(event, handler);
  }

  /** Unsubscribe from an editor event. */
  off<K extends keyof EditorEvents>(event: K, handler: EventHandler<EditorEvents[K]>): void {
    this._listeners.get(event)?.delete(handler as EventHandler<unknown>);
  }

  private _emit<K extends keyof EditorEvents>(event: K, data: EditorEvents[K]): void {
    this._listeners.get(event)?.forEach((handler) => handler(data));
  }

  // ===========================================================================
  // LIFECYCLE
  // ===========================================================================

  /**
   * Mount the editor to a DOM element.
   *
   * Used by React/Vue adapters to attach the ProseMirror view to a container.
   * If the editor was created without an element, this must be called to render it.
   *
   * @param element - The container element to mount into
   */
  mount(element: HTMLElement): void {
    if (this._destroyed) {
      return;
    }
    if (this._pmView.dom.parentElement) {
      this._pmView.dom.parentElement.removeChild(this._pmView.dom);
    }
    element.appendChild(this._pmView.dom);
  }

  /**
   * Destroy the editor and clean up resources.
   *
   * After calling this, the editor instance cannot be reused.
   */
  destroy(): void {
    if (this._destroyed) return;
    this._destroyed = true;
    this._pmView.destroy();
    this._listeners.clear();
  }

  /** Whether the editor has been destroyed. */
  get isDestroyed(): boolean { return this._destroyed; }

  /** Whether the editor is in editable mode. */
  get isEditable(): boolean { return this._config.editable !== false; }

  /**
   * Enable or disable editing.
   *
   * @param editable - True to allow editing, false for read-only mode
   */
  setEditable(editable: boolean): void {
    this._config.editable = editable;
    this._pmView.setProps({ editable: () => editable });
  }
}
