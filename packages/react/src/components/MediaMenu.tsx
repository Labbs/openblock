/**
 * MediaMenu - React component for the floating media editing toolbar.
 *
 * Renders a floating menu when an image or embed is selected, allowing users to
 * modify attributes like alignment, URL, caption, or delete the media.
 *
 * @example
 * ```tsx
 * import { useOpenBlock, OpenBlockView, MediaMenu } from '@openblock/react';
 *
 * function MyEditor() {
 *   const editor = useOpenBlock();
 *
 *   return (
 *     <OpenBlockView editor={editor}>
 *       <MediaMenu editor={editor} />
 *     </OpenBlockView>
 *   );
 * }
 * ```
 */

import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  OpenBlockEditor,
  MEDIA_MENU_PLUGIN_KEY,
  MediaMenuState,
  updateMediaAttrs,
  deleteMediaNode,
  ImageAttrs,
  EmbedAttrs,
} from '@labbs/openblock-core';
import { usePluginState } from '../hooks/usePluginState';
import { useClickOutside } from '../hooks/useClickOutside';
import { LinkIcon } from './icons';

/**
 * Props for MediaMenu component.
 */
export interface MediaMenuProps {
  /**
   * The OpenBlockEditor instance (can be null during initialization).
   */
  editor: OpenBlockEditor | null;

  /**
   * Additional class name for the menu container.
   */
  className?: string;
}

/**
 * Alignment button component.
 */
interface AlignmentButtonProps {
  active: boolean;
  onClick: () => void;
  title: string;
  children: React.ReactNode;
}

function AlignmentButton({ active, onClick, title, children }: AlignmentButtonProps) {
  return (
    <button
      type="button"
      className={`ob-media-menu-btn ${active ? 'ob-media-menu-btn--active' : ''}`}
      onClick={onClick}
      onMouseDown={(e) => e.preventDefault()}
      title={title}
    >
      {children}
    </button>
  );
}

/**
 * Small popover with a single text input, used for both URL and caption editing.
 */
interface TextInputPopoverProps {
  /** Label displayed above the input. */
  label: string;
  /** Initial value of the input. */
  initialValue: string;
  /** HTML input type. */
  inputType?: 'url' | 'text';
  /** Placeholder text. */
  placeholder?: string;
  /** Called with the input value when the form is submitted. */
  onSave: (value: string) => void;
  /** Called when the popover should close (Cancel button or Escape). */
  onClose: () => void;
}

function TextInputPopover({
  label,
  initialValue,
  inputType = 'text',
  placeholder,
  onSave,
  onClose,
}: TextInputPopoverProps) {
  const [value, setValue] = useState(initialValue);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(value);
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div
      className="ob-media-url-popover"
      onKeyDown={handleKeyDown}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <form onSubmit={handleSubmit}>
        <label className="ob-media-url-label">{label}</label>
        <input
          ref={inputRef}
          type={inputType}
          className="ob-media-url-input"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
        />
        <div className="ob-media-url-actions">
          <button
            type="button"
            className="ob-media-url-btn ob-media-url-btn--cancel"
            onClick={onClose}
          >
            Cancel
          </button>
          <button type="submit" className="ob-media-url-btn ob-media-url-btn--save">
            Save
          </button>
        </div>
      </form>
    </div>
  );
}

/**
 * MediaMenu component.
 *
 * Renders a floating toolbar when an image or embed is selected.
 */
export function MediaMenu({ editor, className }: MediaMenuProps): React.ReactElement | null {
  const menuState = usePluginState(editor, MEDIA_MENU_PLUGIN_KEY);
  const [showUrlEdit, setShowUrlEdit] = useState(false);
  const [showCaptionEdit, setShowCaptionEdit] = useState(false);
  // Keep a stable reference to the last valid menu state for when popovers are open
  const lastValidStateRef = useRef<MediaMenuState | null>(null);

  const isPopoverOpen = showUrlEdit || showCaptionEdit;

  // Track the last visible state (so an open popover survives the menu
  // hiding), and drop it as soon as the menu is hidden with no popover open.
  if (menuState?.visible) {
    lastValidStateRef.current = menuState;
  } else if (!isPopoverOpen) {
    lastValidStateRef.current = null;
  }

  // Hide menu on scroll
  useEffect(() => {
    if (!editor || !menuState?.visible) return;

    const handleScroll = () => {
      // Hide the menu by dispatching a transaction
      editor.pm.view.dispatch(
        editor.pm.view.state.tr.setMeta(MEDIA_MENU_PLUGIN_KEY, { hide: true })
      );
    };

    // Listen to scroll on the editor container and window
    const editorElement = editor.pm.view.dom;
    const scrollContainer = editorElement.closest('.openblock-container') || editorElement.parentElement;

    window.addEventListener('scroll', handleScroll, true);
    scrollContainer?.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('scroll', handleScroll, true);
      scrollContainer?.removeEventListener('scroll', handleScroll);
    };
  }, [editor, menuState?.visible]);

  // Close popovers when clicking outside the menu, the popovers,
  // and the media element itself
  useClickOutside(
    [],
    () => {
      setShowUrlEdit(false);
      setShowCaptionEdit(false);
      lastValidStateRef.current = null;
    },
    Boolean(editor && (menuState?.visible || isPopoverOpen)),
    {
      ignoreSelectors: [
        '.ob-media-menu',
        '.ob-media-url-popover',
        '.openblock-image',
        '.openblock-embed',
      ],
    }
  );

  /**
   * Re-resolve the media node position at action time: the captured nodePos
   * may be stale if the document changed since the menu state was computed.
   * Verifies the node at nodePos is the expected media node, otherwise finds
   * it again by its id. Returns null when the node cannot be found.
   */
  const resolveMediaPos = useCallback(
    (state: MediaMenuState): number | null => {
      if (!editor || editor.isDestroyed) return null;
      if (state.nodePos === null || !state.mediaType) return null;

      const doc = editor.pm.state.doc;
      const expectedType = state.mediaType;
      const expectedId = (state.attrs as { id?: string | null } | null)?.id ?? null;

      // Fast path: the node at the captured position is still the right one
      if (state.nodePos >= 0 && state.nodePos < doc.content.size) {
        const node = doc.nodeAt(state.nodePos);
        if (
          node &&
          node.type.name === expectedType &&
          (expectedId === null || node.attrs.id === expectedId)
        ) {
          return state.nodePos;
        }
      }

      // Fallback: find the node again by its id
      if (expectedId !== null) {
        let found: number | null = null;
        doc.descendants((node, pos) => {
          if (found !== null) return false;
          if (node.type.name === expectedType && node.attrs.id === expectedId) {
            found = pos;
            return false;
          }
          return true;
        });
        return found;
      }

      return null;
    },
    [editor]
  );

  // Get the current state to use (prefer current, fallback to last valid)
  const getActiveState = useCallback(() => {
    return menuState?.visible ? menuState : lastValidStateRef.current;
  }, [menuState]);

  /** Cleanly abort an action whose target node no longer exists. */
  const cancelAction = useCallback(() => {
    setShowUrlEdit(false);
    setShowCaptionEdit(false);
    lastValidStateRef.current = null;
  }, []);

  const handleAlignmentChange = useCallback(
    (alignment: 'left' | 'center' | 'right') => {
      const state = getActiveState();
      if (!editor || !state) return;
      const pos = resolveMediaPos(state);
      if (pos === null) {
        cancelAction();
        return;
      }
      updateMediaAttrs(editor.pm.view, pos, { alignment });
      editor.pm.view.focus();
    },
    [editor, getActiveState, resolveMediaPos, cancelAction]
  );

  const handleUrlSave = useCallback(
    (url: string) => {
      const state = getActiveState();
      if (!editor || !state) return;
      const pos = resolveMediaPos(state);
      if (pos === null) {
        cancelAction();
        return;
      }
      if (state.mediaType === 'image') {
        updateMediaAttrs(editor.pm.view, pos, { src: url });
      } else {
        updateMediaAttrs(editor.pm.view, pos, { url });
      }
      setShowUrlEdit(false);
      editor.pm.view.focus();
    },
    [editor, getActiveState, resolveMediaPos, cancelAction]
  );

  const handleCaptionSave = useCallback(
    (caption: string) => {
      const state = getActiveState();
      if (!editor || !state) return;
      const pos = resolveMediaPos(state);
      if (pos === null) {
        cancelAction();
        return;
      }
      updateMediaAttrs(editor.pm.view, pos, { caption });
      setShowCaptionEdit(false);
      editor.pm.view.focus();
    },
    [editor, getActiveState, resolveMediaPos, cancelAction]
  );

  const handleDelete = useCallback(() => {
    const state = getActiveState();
    if (!editor || !state) return;
    const pos = resolveMediaPos(state);
    if (pos === null) {
      cancelAction();
      return;
    }
    deleteMediaNode(editor.pm.view, pos);
    editor.pm.view.focus();
  }, [editor, getActiveState, resolveMediaPos, cancelAction]);

  // Use the last valid state if a popover is open
  const activeState = menuState?.visible ? menuState : (isPopoverOpen ? lastValidStateRef.current : null);

  if (!editor || editor.isDestroyed || !activeState || !activeState.coords) {
    return null;
  }

  const { mediaType, attrs, coords } = activeState;
  const isImage = mediaType === 'image';
  const imageAttrs = isImage ? (attrs as ImageAttrs) : null;
  const embedAttrs = !isImage ? (attrs as EmbedAttrs) : null;
  const alignment = imageAttrs?.alignment || 'center';
  const currentUrl = isImage ? imageAttrs?.src || '' : embedAttrs?.url || '';
  const currentCaption = attrs?.caption || '';

  // Position menu above the media element
  const menuHeight = 44;
  const style: React.CSSProperties = {
    position: 'fixed',
    left: coords.left + (coords.right - coords.left) / 2,
    top: coords.top - menuHeight - 8,
    transform: 'translateX(-50%)',
    zIndex: 1000,
  };

  return (
    <div
      className={`ob-media-menu ${className || ''}`}
      style={style}
      role="toolbar"
      aria-label={`${isImage ? 'Image' : 'Embed'} options`}
    >
      {/* Alignment buttons (for images) */}
      {isImage && (
        <>
          <AlignmentButton
            active={alignment === 'left'}
            onClick={() => handleAlignmentChange('left')}
            title="Align left"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <rect x="3" y="5" width="10" height="14" rx="1" />
              <path d="M17 8h4M17 12h4M17 16h4" />
            </svg>
          </AlignmentButton>
          <AlignmentButton
            active={alignment === 'center'}
            onClick={() => handleAlignmentChange('center')}
            title="Align center"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <rect x="7" y="5" width="10" height="14" rx="1" />
            </svg>
          </AlignmentButton>
          <AlignmentButton
            active={alignment === 'right'}
            onClick={() => handleAlignmentChange('right')}
            title="Align right"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <rect x="11" y="5" width="10" height="14" rx="1" />
              <path d="M3 8h4M3 12h4M3 16h4" />
            </svg>
          </AlignmentButton>
          <span className="ob-media-menu-divider" />
        </>
      )}

      {/* Edit URL button */}
      <button
        type="button"
        className={`ob-media-menu-btn ${showUrlEdit ? 'ob-media-menu-btn--active' : ''}`}
        onClick={() => {
          setShowUrlEdit(!showUrlEdit);
          setShowCaptionEdit(false);
        }}
        onMouseDown={(e) => e.preventDefault()}
        title={isImage ? 'Edit image URL' : 'Edit embed URL'}
      >
        <LinkIcon />
      </button>

      {/* Edit Caption button */}
      <button
        type="button"
        className={`ob-media-menu-btn ${showCaptionEdit ? 'ob-media-menu-btn--active' : ''}`}
        onClick={() => {
          setShowCaptionEdit(!showCaptionEdit);
          setShowUrlEdit(false);
        }}
        onMouseDown={(e) => e.preventDefault()}
        title="Edit caption"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <path d="M7 15h10M7 11h4" />
        </svg>
      </button>

      <span className="ob-media-menu-divider" />

      {/* Delete button */}
      <button
        type="button"
        className="ob-media-menu-btn ob-media-menu-btn--danger"
        onClick={handleDelete}
        onMouseDown={(e) => e.preventDefault()}
        title="Delete"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
          <line x1="10" y1="11" x2="10" y2="17" />
          <line x1="14" y1="11" x2="14" y2="17" />
        </svg>
      </button>

      {/* URL Edit Popover */}
      {showUrlEdit && (
        <TextInputPopover
          label={isImage ? 'Image URL' : 'Embed URL'}
          initialValue={currentUrl}
          inputType="url"
          placeholder="https://..."
          onSave={handleUrlSave}
          onClose={() => setShowUrlEdit(false)}
        />
      )}

      {/* Caption Edit Popover */}
      {showCaptionEdit && (
        <TextInputPopover
          label="Caption"
          initialValue={currentCaption}
          inputType="text"
          placeholder="Enter caption..."
          onSave={handleCaptionSave}
          onClose={() => setShowCaptionEdit(false)}
        />
      )}
    </div>
  );
}
