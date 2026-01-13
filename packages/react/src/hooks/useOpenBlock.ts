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

import { useEffect, useState } from 'react';
import { OpenBlockEditor, EditorConfig, Block } from '@openblock/core';

/**
 * Options for useOpenBlock hook
 */
export interface UseOpenBlockOptions extends Omit<EditorConfig, 'element'> {}

/**
 * Create and manage an OpenBlockEditor instance
 *
 * @param options - Editor configuration options
 * @returns The OpenBlockEditor instance
 */
export function useOpenBlock(options: UseOpenBlockOptions = {}): OpenBlockEditor {
  // Use useState with lazy initializer to create the editor exactly once
  // This is React 18+ safe and works with StrictMode
  const [editor] = useState(() => new OpenBlockEditor(options));

  // Cleanup on unmount only
  useEffect(() => {
    return () => {
      if (!editor.isDestroyed) {
        editor.destroy();
      }
    };
  }, [editor]);

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
