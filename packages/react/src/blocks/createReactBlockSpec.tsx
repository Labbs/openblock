/**
 * createReactBlockSpec - Create custom React blocks for OpenBlock
 *
 * This allows you to create custom block types with React components
 * that integrate seamlessly with the OpenBlock editor.
 *
 * @example
 * ```tsx
 * import { createReactBlockSpec } from '@labbs/openblock-react';
 *
 * const MyCustomBlock = createReactBlockSpec({
 *   type: 'myBlock',
 *   propSchema: {
 *     title: { default: '' },
 *     color: { default: 'blue' },
 *   },
 *   content: 'none', // or 'inline' for editable content
 * }, {
 *   render: ({ block, editor }) => (
 *     <div style={{ background: block.props.color }}>
 *       <h3>{block.props.title}</h3>
 *     </div>
 *   ),
 * });
 * ```
 *
 * @module
 */

import React from 'react';
import { createRoot, Root } from 'react-dom/client';
import {
  type OpenBlockEditor,
  type NodeView,
  type NodeViewConstructor,
  Node as PMNode,
  EditorView,
} from '@labbs/openblock-core';

/**
 * Property schema definition for a block
 */
export interface PropSchema {
  [key: string]: {
    default: unknown;
  };
}

/**
 * Block spec configuration
 */
export interface BlockSpec<T extends PropSchema> {
  /** Unique block type identifier */
  type: string;
  /** Property schema with defaults */
  propSchema: T;
  /** Content type: 'none' for no content, 'inline' for text content */
  content: 'none' | 'inline';
}

/**
 * Props passed to the render component
 */
export interface BlockRenderProps<T extends PropSchema> {
  /** The block data */
  block: {
    id: string;
    type: string;
    props: { [K in keyof T]: T[K]['default'] };
  };
  /** The editor instance */
  editor: OpenBlockEditor;
  /** Whether the editor is in editable mode */
  isEditable: boolean;
  /**
   * Ref to attach to the element that should host the editable inline
   * content (only provided if content: 'inline'). Pass it as the `ref` of a
   * container element: `<div ref={contentRef} />`.
   */
  contentRef?: React.Ref<HTMLDivElement>;
}

/**
 * Slash menu configuration for a custom block
 */
export interface SlashMenuConfig {
  /** Display title in the menu */
  title: string;
  /** Description shown below the title */
  description?: string;
  /** Icon identifier (matches built-in icons) or 'custom' */
  icon?: string;
  /** Alternative search keywords */
  aliases?: string[];
  /** Group/category for the menu */
  group?: string;
}

/**
 * Block implementation with render function
 */
export interface BlockImplementation<T extends PropSchema> {
  render: React.ComponentType<BlockRenderProps<T>>;
  /** Slash menu configuration (optional - if not provided, block won't appear in slash menu) */
  slashMenu?: SlashMenuConfig;
}

/**
 * Return type of createReactBlockSpec
 */
export interface ReactBlockSpec<T extends PropSchema> {
  /** Block type identifier */
  type: string;
  /** Property schema */
  propSchema: T;
  /** Content type */
  content: 'none' | 'inline';
  /** ProseMirror node spec (simplified type for compatibility) */
  nodeSpec: Record<string, unknown>;
  /** NodeView constructor factory */
  createNodeView: (editor: OpenBlockEditor) => NodeViewConstructor;
  /** Slash menu configuration (optional - if not provided, block won't appear in slash menu) */
  slashMenu?: SlashMenuConfig;
}

/**
 * Context for React block components
 */
interface ReactBlockContext {
  editor: OpenBlockEditor;
}

const BlockContext = React.createContext<ReactBlockContext | null>(null);

/**
 * Hook to access the editor from within a block component
 */
export function useBlockEditor(): OpenBlockEditor | null {
  const context = React.useContext(BlockContext);
  return context?.editor ?? null;
}

/**
 * Create a custom React block specification for OpenBlock
 *
 * @param spec - Block specification with type, props, and content model
 * @param implementation - Block implementation with render component
 * @returns A block spec that can be registered with the editor
 */
export function createReactBlockSpec<T extends PropSchema>(
  spec: BlockSpec<T>,
  implementation: BlockImplementation<T>
): ReactBlockSpec<T> {
  const { type, propSchema, content } = spec;
  const { render: RenderComponent, slashMenu } = implementation;

  // Build ProseMirror attrs from prop schema
  const attrs: Record<string, { default: unknown }> = {
    id: { default: null },
  };
  for (const [key, value] of Object.entries(propSchema)) {
    attrs[key] = { default: value.default };
  }

  // Create the node spec
  const nodeSpec = {
    group: 'block',
    content: content === 'inline' ? 'inline*' : '',
    atom: content === 'none',
    attrs,
    parseDOM: [
      {
        tag: `div[data-block-type="${type}"]`,
        getAttrs: (dom: HTMLElement) => {
          const result: Record<string, unknown> = {
            id: dom.getAttribute('data-block-id'),
          };
          for (const key of Object.keys(propSchema)) {
            const attr = dom.getAttribute(`data-${key}`);
            if (attr !== null) {
              // Try to parse as JSON for complex values
              try {
                result[key] = JSON.parse(attr);
              } catch {
                result[key] = attr;
              }
            }
          }
          return result;
        },
      },
    ],
    toDOM: (node: PMNode) => {
      const domAttrs: Record<string, string> = {
        'data-block-type': type,
        'data-block-id': node.attrs.id || '',
        class: `openblock-custom-block openblock-${type}`,
        contenteditable: 'false',
      };
      // Add props as data attributes
      for (const key of Object.keys(propSchema)) {
        const value = node.attrs[key];
        if (value !== undefined && value !== null) {
          domAttrs[`data-${key}`] = typeof value === 'object' ? JSON.stringify(value) : String(value);
        }
      }
      if (content === 'inline') {
        return ['div', domAttrs, 0];
      }
      return ['div', domAttrs];
    },
  };

  // Create NodeView constructor
  const createNodeView = (editor: OpenBlockEditor): NodeViewConstructor => {
    return (node: PMNode, _view: EditorView, _getPos: () => number | undefined, _decorations, _innerDecorations): NodeView => {
      // Create container
      const dom = document.createElement('div');
      dom.className = `openblock-custom-block openblock-${type}`;
      dom.setAttribute('data-block-type', type);
      dom.setAttribute('data-block-id', node.attrs.id || '');
      dom.contentEditable = 'false';

      // Content DOM for inline content
      let contentDOM: HTMLElement | undefined;
      if (content === 'inline') {
        contentDOM = document.createElement('div');
        contentDOM.className = 'openblock-block-content';
        contentDOM.contentEditable = 'true';
      }

      // React root
      let root: Root | null = null;
      const reactContainer = document.createElement('div');
      reactContainer.className = 'openblock-react-container';
      dom.appendChild(reactContainer);

      // Stable callback ref that attaches the ProseMirror-managed contentDOM
      // to the element rendered by the React component. Created once per
      // node view so React only invokes it on mount/unmount, not on every
      // re-render.
      const contentRefCallback: React.RefCallback<HTMLDivElement> = (el) => {
        if (el && contentDOM && !el.contains(contentDOM)) {
          el.appendChild(contentDOM);
        }
      };

      // Render function
      const renderReact = (currentNode: PMNode) => {
        const block = {
          id: currentNode.attrs.id || '',
          type,
          props: {} as { [K in keyof T]: T[K]['default'] },
        };

        // Extract props from node attrs
        for (const key of Object.keys(propSchema)) {
          (block.props as Record<string, unknown>)[key] = currentNode.attrs[key];
        }

        const element = (
          <BlockContext.Provider value={{ editor }}>
            <RenderComponent
              block={block}
              editor={editor}
              isEditable={editor.isEditable}
              contentRef={content === 'inline' ? contentRefCallback : undefined}
            />
          </BlockContext.Provider>
        );

        if (!root) {
          root = createRoot(reactContainer);
        }
        root.render(element);
      };

      // Initial render
      renderReact(node);

      return {
        dom,
        contentDOM,
        update: (updatedNode: PMNode) => {
          if (updatedNode.type.name !== type) return false;
          renderReact(updatedNode);
          return true;
        },
        destroy: () => {
          const currentRoot = root;
          root = null;
          if (currentRoot) {
            // Defer the unmount: ProseMirror may call destroy() while React
            // is rendering, and unmounting a root synchronously during a
            // render is not allowed.
            queueMicrotask(() => currentRoot.unmount());
          }
        },
        stopEvent: (event: Event) => {
          const target = event.target as Node | null;
          if (!target) return false;
          // Never intercept events inside the editable content: ProseMirror
          // must receive them for inline editing to work.
          if (contentDOM && contentDOM.contains(target)) {
            return false;
          }
          // Only stop events originating from the React-rendered UI so
          // ProseMirror does not hijack interactions with it (buttons,
          // inputs, ...).
          return reactContainer.contains(target);
        },
        ignoreMutation: (mutation) => {
          // Let ProseMirror observe mutations inside the editable content,
          // ignore mutations caused by React in the rest of the node view.
          return !contentDOM || !contentDOM.contains(mutation.target);
        },
      };
    };
  };

  return {
    type,
    propSchema,
    content,
    nodeSpec,
    createNodeView,
    slashMenu,
  };
}

/**
 * Helper to update block props from within a block component
 */
export function useUpdateBlock<T extends PropSchema>(
  editor: OpenBlockEditor | null,
  blockId: string
) {
  return React.useCallback(
    (updates: Partial<{ [K in keyof T]: T[K]['default'] }>) => {
      if (!editor || editor.isDestroyed) return;

      // Find the block position
      let pos: number | null = null;
      editor.pm.doc.descendants((node, nodePos) => {
        if (node.attrs.id === blockId) {
          pos = nodePos;
          return false;
        }
      });

      if (pos !== null) {
        const node = editor.pm.doc.nodeAt(pos);
        if (node) {
          const tr = editor.pm.createTransaction();
          tr.setNodeMarkup(pos, undefined, { ...node.attrs, ...updates });
          editor.pm.dispatch(tr);
        }
      }
    },
    [editor, blockId]
  );
}
