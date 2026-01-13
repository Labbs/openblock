/**
 * OpenBlockView - React component that renders the OpenBlock editor
 *
 * @example
 * ```tsx
 * import { useOpenBlock, OpenBlockView } from '@openblock/react';
 *
 * function MyEditor() {
 *   const editor = useOpenBlock({
 *     initialContent: [{ type: 'paragraph', content: [] }],
 *   });
 *
 *   return (
 *     <OpenBlockView
 *       editor={editor}
 *       className="my-editor"
 *     />
 *   );
 * }
 * ```
 */

import React, { useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { OpenBlockEditor } from '@openblock/core';

/**
 * Props for OpenBlockView component
 */
export interface OpenBlockViewProps {
  /**
   * The OpenBlockEditor instance to render
   */
  editor: OpenBlockEditor;

  /**
   * Additional class name(s) for the container
   */
  className?: string;

  /**
   * Inline styles for the container
   */
  style?: React.CSSProperties;

  /**
   * Children to render alongside the editor (e.g., menus, toolbars)
   */
  children?: React.ReactNode;
}

/**
 * Ref handle for OpenBlockView
 */
export interface OpenBlockViewRef {
  /**
   * The container DOM element
   */
  container: HTMLDivElement | null;

  /**
   * The OpenBlockEditor instance
   */
  editor: OpenBlockEditor;
}

/**
 * React component that renders the OpenBlock editor
 *
 * This component handles mounting the ProseMirror EditorView to the DOM
 * and cleaning up when unmounted.
 */
export const OpenBlockView = forwardRef<OpenBlockViewRef, OpenBlockViewProps>(
  function OpenBlockView({ editor, className, style, children }, ref) {
    const containerRef = useRef<HTMLDivElement>(null);
    const mountedRef = useRef(false);

    // Expose ref handle
    useImperativeHandle(
      ref,
      () => ({
        container: containerRef.current,
        editor,
      }),
      [editor]
    );

    // Mount editor to container
    useEffect(() => {
      const container = containerRef.current;
      if (!container || !editor || editor.isDestroyed) {
        return;
      }

      // Mount the editor view to the container
      editor.mount(container);
      mountedRef.current = true;

      // No cleanup - editor lifecycle is managed by useOpenBlock
    }, [editor]);

    return (
      <div
        ref={containerRef}
        className={className ? `openblock-container ${className}` : 'openblock-container'}
        style={{
          position: 'relative',
          ...style,
        }}
      >
        {children}
      </div>
    );
  }
);

OpenBlockView.displayName = 'OpenBlockView';
