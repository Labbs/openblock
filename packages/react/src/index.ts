/**
 * @openblock/react
 *
 * React bindings for OpenBlock editor.
 *
 * @example
 * ```tsx
 * import { useOpenBlock, OpenBlockView } from '@openblock/react';
 * import '@labbs/openblock-core/styles/editor.css';
 *
 * function MyEditor() {
 *   const editor = useOpenBlock({
 *     initialContent: [
 *       { type: 'heading', props: { level: 1 }, content: [{ type: 'text', text: 'Hello', styles: {} }] },
 *       { type: 'paragraph', content: [{ type: 'text', text: 'World', styles: {} }] },
 *     ],
 *   });
 *
 *   return <OpenBlockView editor={editor} />;
 * }
 * ```
 *
 * @packageDocumentation
 */

// Hooks
export {
  useOpenBlock,
  useEditorContent,
  useEditorSelection,
  useEditorFocus,
} from './hooks';
export type { UseOpenBlockOptions } from './hooks';

// Components
export { OpenBlockView, SlashMenu, BubbleMenu, TableMenu, TableHandles } from './components';
export type { OpenBlockViewProps, OpenBlockViewRef, SlashMenuProps, BubbleMenuProps, TableMenuProps, TableHandlesProps } from './components';

// Re-export core types for convenience
export type {
  OpenBlockEditor,
  EditorConfig,
  Block,
  PartialBlock,
  BlockIdentifier,
  BlockPlacement,
  TextStyles,
  StyledText,
  InlineContent,
} from '@labbs/openblock-core';
