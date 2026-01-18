/**
 * Editor Configuration.
 *
 * All configuration options for OpenBlockEditor.
 *
 * @module
 */

import type { Plugin } from 'prosemirror-state';
import type { NodeViewConstructor } from 'prosemirror-view';
import type { Block } from '../blocks/types';
import type { InputRulesConfig } from '../plugins/inputRules';

/**
 * Editor event types.
 */
export interface EditorEvents {
  /** Document changed */
  change: { blocks: Block[] };
  /** Selection changed */
  selectionChange: { blocks: Block[] };
  /** Editor focused */
  focus: undefined;
  /** Editor blurred */
  blur: undefined;
  /** Transaction applied */
  transaction: { transaction: unknown };
}

/**
 * Event handler type.
 */
export type EventHandler<T> = (data: T) => void;

/**
 * Configuration for the OpenBlock editor.
 *
 * @example
 * ```typescript
 * const config: EditorConfig = {
 *   element: document.getElementById('editor'),
 *   initialContent: [
 *     { id: '1', type: 'paragraph', props: {}, content: [] }
 *   ],
 *   editable: true,
 *   autoFocus: 'end',
 * };
 * ```
 */
export interface EditorConfig {
  /**
   * DOM element to mount the editor into.
   * If not provided, you must call editor.mount(element) later.
   */
  element?: HTMLElement;

  /**
   * Initial document content as blocks.
   * If not provided, starts with an empty paragraph.
   */
  initialContent?: Block[];

  /**
   * Whether the editor is editable.
   * @default true
   */
  editable?: boolean;

  /**
   * Auto-focus behavior when the editor mounts.
   * - true or 'end': Focus at end of document
   * - 'start': Focus at start of document
   * - false: Don't auto-focus
   * @default false
   */
  autoFocus?: boolean | 'start' | 'end';

  /**
   * Placeholder text to show when the editor is empty.
   * Can be a string or a function that returns a string based on the block.
   */
  placeholder?: string | ((block: Block) => string);

  /**
   * Configuration for input rules (markdown-style shortcuts).
   *
   * Enable/disable specific shortcuts like:
   * - `# ` → Heading 1, `## ` → Heading 2, etc.
   * - `- `, `* ` → Bullet list
   * - `1. ` → Ordered list
   * - `> ` → Blockquote
   * - ``` → Code block
   * - `---` → Divider
   *
   * Set to false to disable all input rules.
   * @default true (all rules enabled)
   *
   * @example
   * ```typescript
   * // Enable only headings and lists
   * inputRules: { headings: true, bulletLists: true, orderedLists: true }
   *
   * // Disable all input rules
   * inputRules: false
   * ```
   */
  inputRules?: InputRulesConfig | false;

  /**
   * Whether to auto-inject CSS styles into the document head.
   *
   * When true (default), OpenBlock will automatically inject all required
   * CSS styles, so you don't need to import any CSS files manually.
   *
   * Set to false if you want to provide your own styles or import the
   * CSS file manually.
   *
   * @default true
   */
  injectStyles?: boolean;

  /**
   * Direct ProseMirror configuration.
   * Use this for advanced customization.
   * ALL PROSEMIRROR OPTIONS ARE PUBLIC - this is OpenBlock's philosophy.
   */
  prosemirror?: {
    /** Additional ProseMirror plugins to load. */
    plugins?: Plugin[];
    /** Custom node views. */
    nodeViews?: Record<string, NodeViewConstructor>;
  };

  /**
   * Event callbacks.
   */
  onUpdate?: (blocks: Block[]) => void;
  onSelectionChange?: (blocks: Block[]) => void;
  onFocus?: () => void;
  onBlur?: () => void;
}

/**
 * Default configuration values.
 */
export const defaultConfig: Partial<EditorConfig> = {
  editable: true,
  autoFocus: false,
  injectStyles: true,
};
