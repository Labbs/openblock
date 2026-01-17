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

import { useEffect, useRef, useState } from 'react';
import { OpenBlockEditor, EditorConfig, Block } from '@labbs/openblock-core';

/**
 * Options for useOpenBlock hook
 */
export interface UseOpenBlockOptions extends Omit<EditorConfig, 'element'> {}

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

  useEffect(() => {
    const newEditor = new OpenBlockEditor(optionsRef.current);
    setEditor(newEditor);

    return () => {
      newEditor.destroy();
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
