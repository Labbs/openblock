/**
 * useOpenBlock - The main React hook for OpenBlock
 *
 * Creates and manages an OpenBlockEditor instance within React's lifecycle.
 *
 * @example
 * ```tsx
 * import { useOpenBlock, OpenBlockView } from '@openblock/react';
 *
 * function MyEditor() {
 *   const editor = useOpenBlock({
 *     initialContent: [
 *       { type: 'paragraph', content: [{ type: 'text', text: 'Hello!', styles: {} }] }
 *     ],
 *   });
 *
 *   return <OpenBlockView editor={editor} />;
 * }
 * ```
 */

import { useEffect, useRef, useState, useMemo } from 'react';
import { OpenBlockEditor, EditorConfig, Block, SlashMenuItem } from '@labbs/openblock-core';
import type { ReactBlockSpec, PropSchema } from '../blocks';

/**
 * Options for useOpenBlock hook
 */
export interface UseOpenBlockOptions extends Omit<EditorConfig, 'element'> {
  /**
   * Custom React block specifications to register with the editor.
   * These blocks will be rendered using React components.
   */
  customBlocks?: ReactBlockSpec<PropSchema>[];
}

/**
 * Create and manage an OpenBlockEditor instance
 *
 * @param options - Editor configuration options
 * @returns The OpenBlockEditor instance, or null during initialization
 *
 * @remarks
 * This hook properly handles React 18+ StrictMode, which mounts components twice
 * in development. The editor is created in useEffect to ensure a fresh instance
 * is created after each mount/unmount cycle.
 */
export function useOpenBlock(options: UseOpenBlockOptions = {}): OpenBlockEditor | null {
  const [editor, setEditor] = useState<OpenBlockEditor | null>(null);
  const optionsRef = useRef(options);
  // Store a reference to the editor that nodeViews can use
  const editorRef = useRef<OpenBlockEditor | null>(null);

  useEffect(() => {
    const { customBlocks, ...editorOptions } = optionsRef.current;

    // Build nodeViews from custom blocks
    // We use a closure that references editorRef so nodeViews can access the editor
    const nodeViews: Record<string, any> = {};

    if (customBlocks && customBlocks.length > 0) {
      for (const blockSpec of customBlocks) {
        // Create a wrapper that will use the editor from the ref
        nodeViews[blockSpec.type] = (node: any, view: any, getPos: any, decorations: any, innerDecorations: any) => {
          // editorRef.current will be set by the time this is called
          const nodeViewConstructor = blockSpec.createNodeView(editorRef.current!);
          return nodeViewConstructor(node, view, getPos, decorations, innerDecorations);
        };
      }
    }

    // Merge with existing prosemirror config
    const prosemirrorConfig = {
      ...editorOptions.prosemirror,
      nodeViews: {
        ...editorOptions.prosemirror?.nodeViews,
        ...nodeViews,
      },
    };

    // Create the editor with nodeViews
    const newEditor = new OpenBlockEditor({
      ...editorOptions,
      prosemirror: Object.keys(nodeViews).length > 0 ? prosemirrorConfig : editorOptions.prosemirror,
    });

    // Store in ref so nodeViews can access it
    editorRef.current = newEditor;
    setEditor(newEditor);

    return () => {
      newEditor.destroy();
      editorRef.current = null;
    };
  }, []);

  return editor;
}

/**
 * Hook to subscribe to editor document changes
 *
 * @param editor - The OpenBlockEditor instance
 * @returns The current document blocks
 */
export function useEditorContent(editor: OpenBlockEditor | null): Block[] {
  const [blocks, setBlocks] = useState<Block[]>([]);

  useEffect(() => {
    if (!editor || editor.isDestroyed) return;

    // Set initial content
    setBlocks(editor.getDocument());

    // Subscribe to changes
    const unsubscribe = editor.on('change', ({ blocks }) => {
      setBlocks(blocks);
    });

    return unsubscribe;
  }, [editor]);

  return blocks;
}

/**
 * Hook to subscribe to editor selection changes
 *
 * @param editor - The OpenBlockEditor instance
 * @returns The currently selected blocks
 */
export function useEditorSelection(editor: OpenBlockEditor | null): Block[] {
  const [selected, setSelected] = useState<Block[]>([]);

  useEffect(() => {
    if (!editor || editor.isDestroyed) return;

    // Set initial selection
    setSelected(editor.getSelectedBlocks());

    // Subscribe to selection changes
    const unsubscribe = editor.on('selectionChange', ({ blocks }) => {
      setSelected(blocks);
    });

    return unsubscribe;
  }, [editor]);

  return selected;
}

/**
 * Hook to track editor focus state
 *
 * @param editor - The OpenBlockEditor instance
 * @returns Whether the editor is focused
 */
export function useEditorFocus(editor: OpenBlockEditor | null): boolean {
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (!editor || editor.isDestroyed) return;

    // Set initial focus state
    setFocused(editor.hasFocus);

    // Subscribe to focus events
    const unsubscribeFocus = editor.on('focus', () => setFocused(true));
    const unsubscribeBlur = editor.on('blur', () => setFocused(false));

    return () => {
      unsubscribeFocus();
      unsubscribeBlur();
    };
  }, [editor]);

  return focused;
}

/**
 * Hook to generate slash menu items from custom React blocks
 *
 * @param editor - The OpenBlockEditor instance
 * @param customBlocks - Array of custom block specifications
 * @returns Array of SlashMenuItem for custom blocks that have slashMenu config
 *
 * @example
 * ```tsx
 * const customItems = useCustomSlashMenuItems(editor, [DatabaseBlock, EmbedBlock]);
 * return <SlashMenu editor={editor} additionalItems={customItems} />;
 * ```
 */
export function useCustomSlashMenuItems(
  editor: OpenBlockEditor | null,
  customBlocks: ReactBlockSpec<PropSchema>[]
): SlashMenuItem[] {
  return useMemo(() => {
    if (!editor || editor.isDestroyed) return [];

    return customBlocks
      .filter((block) => block.slashMenu)
      .map((block): SlashMenuItem => {
        const { slashMenu, type, propSchema } = block;
        return {
          id: type,
          title: slashMenu!.title,
          description: slashMenu!.description,
          icon: slashMenu!.icon,
          keywords: slashMenu!.aliases,
          group: slashMenu!.group || 'Custom',
          action: (view) => {
            // Build default attrs from propSchema
            const attrs: Record<string, unknown> = {};
            for (const [key, value] of Object.entries(propSchema)) {
              attrs[key] = value.default;
            }
            // Create and insert the node
            const nodeType = view.state.schema.nodes[type];
            if (nodeType) {
              const node = nodeType.create(attrs);
              view.dispatch(view.state.tr.replaceSelectionWith(node));
            }
          },
        };
      });
  }, [editor, customBlocks]);
}
