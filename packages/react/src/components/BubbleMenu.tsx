/**
 * BubbleMenu - React component for the floating formatting toolbar.
 *
 * Renders a floating menu when text is selected, allowing users to
 * apply formatting (bold, italic, underline, etc.) to the selection.
 *
 * @example
 * ```tsx
 * import { useOpenBlock, OpenBlockView, BubbleMenu } from '@openblock/react';
 *
 * function MyEditor() {
 *   const editor = useOpenBlock();
 *
 *   return (
 *     <OpenBlockView editor={editor}>
 *       <BubbleMenu editor={editor} />
 *     </OpenBlockView>
 *   );
 * }
 * ```
 */

import React, { useEffect, useState, useCallback, useRef, useLayoutEffect } from 'react';
import {
  OpenBlockEditor,
  BUBBLE_MENU_PLUGIN_KEY,
  BubbleMenuState,
  BlockTypeInfo,
  TextAlign,
} from '@openblock/core';
import { LinkPopover } from './LinkPopover';
import { ColorPicker } from './ColorPicker';

/**
 * Props for BubbleMenu component.
 */
export interface BubbleMenuProps {
  /**
   * The OpenBlockEditor instance.
   */
  editor: OpenBlockEditor;

  /**
   * Custom render function for the menu content.
   * If provided, replaces the default formatting buttons.
   */
  children?: (props: {
    editor: OpenBlockEditor;
    state: BubbleMenuState;
  }) => React.ReactNode;

  /**
   * Additional class name for the menu container.
   */
  className?: string;
}

/**
 * Formatting button component.
 */
interface FormatButtonProps {
  active: boolean;
  onClick: () => void;
  title: string;
  children: React.ReactNode;
}

function FormatButton({ active, onClick, title, children }: FormatButtonProps) {
  return (
    <button
      type="button"
      className={`ob-bubble-menu-btn ${active ? 'ob-bubble-menu-btn--active' : ''}`}
      onClick={onClick}
      title={title}
      onMouseDown={(e) => e.preventDefault()}
    >
      {children}
    </button>
  );
}

/**
 * Block type option definition.
 */
interface BlockTypeOption {
  type: string;
  label: string;
  props?: Record<string, unknown>;
  icon: React.ReactNode;
}

/**
 * Available block types for the selector.
 */
const BLOCK_TYPE_OPTIONS: BlockTypeOption[] = [
  {
    type: 'paragraph',
    label: 'Paragraph',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path d="M4 6h16M4 12h16M4 18h10" />
      </svg>
    ),
  },
  {
    type: 'heading',
    label: 'Heading 1',
    props: { level: 1 },
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path d="M4 12h8M4 6v12M12 6v12" />
        <path d="M20 8v8M17 8h6" strokeWidth="1.5" />
      </svg>
    ),
  },
  {
    type: 'heading',
    label: 'Heading 2',
    props: { level: 2 },
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path d="M4 12h8M4 6v12M12 6v12" />
        <path d="M16 12a3 3 0 1 1 6 0c0 1.5-3 3-3 3h3M16 18h6" strokeWidth="1.5" />
      </svg>
    ),
  },
  {
    type: 'heading',
    label: 'Heading 3',
    props: { level: 3 },
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path d="M4 12h8M4 6v12M12 6v12" />
        <path d="M16 9a2 2 0 1 1 4 1.5c-.5.5-2 1-2 1s1.5.5 2 1a2 2 0 1 1-4 1.5" strokeWidth="1.5" />
      </svg>
    ),
  },
  {
    type: 'blockquote',
    label: 'Quote',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V21z" />
        <path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v4z" />
      </svg>
    ),
  },
  {
    type: 'bulletList',
    label: 'Bullet List',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <circle cx="4" cy="7" r="1.5" fill="currentColor" stroke="none" />
        <circle cx="4" cy="12" r="1.5" fill="currentColor" stroke="none" />
        <circle cx="4" cy="17" r="1.5" fill="currentColor" stroke="none" />
        <path d="M9 7h11M9 12h11M9 17h11" />
      </svg>
    ),
  },
  {
    type: 'orderedList',
    label: 'Numbered List',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path d="M10 7h10M10 12h10M10 17h10" />
        <path d="M4 7h2M4 17h2M5 11v3h2" strokeWidth="1.5" />
      </svg>
    ),
  },
  {
    type: 'codeBlock',
    label: 'Code Block',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <path d="m9 9-3 3 3 3M15 9l3 3-3 3" />
      </svg>
    ),
  },
];

/**
 * Get display label for current block type.
 */
function getBlockTypeLabel(blockType: BlockTypeInfo): string {
  if (blockType.type === 'heading') {
    const level = blockType.props.level as number;
    return `Heading ${level}`;
  }

  const option = BLOCK_TYPE_OPTIONS.find((opt) => opt.type === blockType.type);
  return option?.label || 'Paragraph';
}

/**
 * Get icon for current block type.
 */
function getBlockTypeIcon(blockType: BlockTypeInfo): React.ReactNode {
  if (blockType.type === 'heading') {
    const level = blockType.props.level as number;
    const option = BLOCK_TYPE_OPTIONS.find(
      (opt) => opt.type === 'heading' && opt.props?.level === level
    );
    return option?.icon || BLOCK_TYPE_OPTIONS[0].icon;
  }

  const option = BLOCK_TYPE_OPTIONS.find((opt) => opt.type === blockType.type);
  return option?.icon || BLOCK_TYPE_OPTIONS[0].icon;
}

/**
 * Check if block type matches an option.
 */
function blockTypeMatches(blockType: BlockTypeInfo, option: BlockTypeOption): boolean {
  if (blockType.type !== option.type) return false;
  if (option.props?.level && blockType.props.level !== option.props.level) return false;
  return true;
}

/**
 * Block type selector dropdown component.
 */
interface BlockTypeSelectorProps {
  editor: OpenBlockEditor;
  blockType: BlockTypeInfo;
}

function BlockTypeSelector({ editor, blockType }: BlockTypeSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [openUpward, setOpenUpward] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Determine if dropdown should open upward based on available space
  useLayoutEffect(() => {
    if (!isOpen || !buttonRef.current || !dropdownRef.current) return;

    const buttonRect = buttonRef.current.getBoundingClientRect();
    const dropdownHeight = dropdownRef.current.offsetHeight || 300;
    const spaceBelow = window.innerHeight - buttonRect.bottom - 8;
    const spaceAbove = buttonRect.top - 8;

    setOpenUpward(spaceBelow < dropdownHeight && spaceAbove > spaceBelow);
  }, [isOpen]);

  const handleSelect = useCallback(
    (option: BlockTypeOption) => {
      editor.setBlockType(option.type, option.props || {});
      editor.pm.view.focus();
      setIsOpen(false);
    },
    [editor]
  );

  return (
    <div className="ob-block-type-selector" ref={containerRef}>
      <button
        ref={buttonRef}
        type="button"
        className="ob-block-type-selector-btn"
        onClick={() => setIsOpen(!isOpen)}
        onMouseDown={(e) => e.preventDefault()}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <span className="ob-block-type-selector-icon">{getBlockTypeIcon(blockType)}</span>
        <span className="ob-block-type-selector-label">{getBlockTypeLabel(blockType)}</span>
        <svg
          className={`ob-block-type-selector-chevron ${isOpen ? 'ob-block-type-selector-chevron--open' : ''}`}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {isOpen && (
        <div
          ref={dropdownRef}
          className={`ob-block-type-dropdown ${openUpward ? 'ob-block-type-dropdown--upward' : ''}`}
          role="listbox"
        >
          {BLOCK_TYPE_OPTIONS.map((option, index) => {
            const isActive = blockTypeMatches(blockType, option);
            return (
              <button
                key={`${option.type}-${option.props?.level || index}`}
                type="button"
                className={`ob-block-type-option ${isActive ? 'ob-block-type-option--active' : ''}`}
                onClick={() => handleSelect(option)}
                onMouseDown={(e) => e.preventDefault()}
                role="option"
                aria-selected={isActive}
              >
                <span className="ob-block-type-option-icon">{option.icon}</span>
                <span className="ob-block-type-option-label">{option.label}</span>
                {isActive && (
                  <svg
                    className="ob-block-type-option-check"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                  >
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/**
 * Text alignment buttons component.
 */
interface TextAlignButtonsProps {
  editor: OpenBlockEditor;
  currentAlign: TextAlign;
}

function TextAlignButtons({ editor, currentAlign }: TextAlignButtonsProps) {
  const setAlign = useCallback(
    (align: TextAlign) => {
      editor.setTextAlign(align);
      editor.pm.view.focus();
    },
    [editor]
  );

  return (
    <div className="ob-text-align-buttons">
      <button
        type="button"
        className={`ob-bubble-menu-btn ${currentAlign === 'left' ? 'ob-bubble-menu-btn--active' : ''}`}
        onClick={() => setAlign('left')}
        onMouseDown={(e) => e.preventDefault()}
        title="Align left"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M4 6h16M4 12h10M4 18h14" />
        </svg>
      </button>
      <button
        type="button"
        className={`ob-bubble-menu-btn ${currentAlign === 'center' ? 'ob-bubble-menu-btn--active' : ''}`}
        onClick={() => setAlign('center')}
        onMouseDown={(e) => e.preventDefault()}
        title="Align center"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M4 6h16M7 12h10M5 18h14" />
        </svg>
      </button>
      <button
        type="button"
        className={`ob-bubble-menu-btn ${currentAlign === 'right' ? 'ob-bubble-menu-btn--active' : ''}`}
        onClick={() => setAlign('right')}
        onMouseDown={(e) => e.preventDefault()}
        title="Align right"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M4 6h16M10 12h10M6 18h14" />
        </svg>
      </button>
    </div>
  );
}

/**
 * BubbleMenu component.
 *
 * Renders a floating toolbar when text is selected for quick formatting access.
 */
export function BubbleMenu({
  editor,
  children,
  className,
}: BubbleMenuProps): React.ReactElement | null {
  const [menuState, setMenuState] = useState<BubbleMenuState | null>(null);
  const [showLinkPopover, setShowLinkPopover] = useState(false);
  const linkButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const updateState = () => {
      const state = BUBBLE_MENU_PLUGIN_KEY.getState(editor.pm.state);
      setMenuState(state ?? null);
    };

    updateState();

    const unsubscribe = editor.on('transaction', updateState);
    return unsubscribe;
  }, [editor]);

  // Close link popover when menu hides
  useEffect(() => {
    if (!menuState?.visible) {
      setShowLinkPopover(false);
    }
  }, [menuState?.visible]);

  const toggleBold = useCallback(() => {
    editor.toggleBold();
    editor.pm.view.focus();
  }, [editor]);

  const toggleItalic = useCallback(() => {
    editor.toggleItalic();
    editor.pm.view.focus();
  }, [editor]);

  const toggleUnderline = useCallback(() => {
    editor.toggleUnderline();
    editor.pm.view.focus();
  }, [editor]);

  const toggleStrikethrough = useCallback(() => {
    editor.toggleStrikethrough();
    editor.pm.view.focus();
  }, [editor]);

  const toggleCode = useCallback(() => {
    editor.toggleCode();
    editor.pm.view.focus();
  }, [editor]);

  const handleLinkClick = useCallback(() => {
    setShowLinkPopover(true);
  }, []);

  const closeLinkPopover = useCallback(() => {
    setShowLinkPopover(false);
  }, []);

  if (!menuState?.visible || !menuState.coords) {
    return null;
  }

  const menuHeight = 36;
  const style: React.CSSProperties = {
    position: 'fixed',
    left: menuState.coords.left,
    top: menuState.coords.top - menuHeight - 8,
    zIndex: 1000,
  };

  if (children) {
    return (
      <div
        className={`ob-bubble-menu ${className || ''}`}
        style={style}
      >
        {children({ editor, state: menuState })}
      </div>
    );
  }

  const { activeMarks, blockType, textAlign } = menuState;

  return (
    <div
      className={`ob-bubble-menu ${className || ''}`}
      style={style}
      role="toolbar"
      aria-label="Text formatting"
    >
      <BlockTypeSelector editor={editor} blockType={blockType} />

      <span className="ob-bubble-menu-divider" />

      <TextAlignButtons editor={editor} currentAlign={textAlign} />

      <span className="ob-bubble-menu-divider" />

      <FormatButton
        active={activeMarks.bold}
        onClick={toggleBold}
        title="Bold (Cmd+B)"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z" />
          <path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z" />
        </svg>
      </FormatButton>

      <FormatButton
        active={activeMarks.italic}
        onClick={toggleItalic}
        title="Italic (Cmd+I)"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M19 4h-9M14 20H5M15 4L9 20" />
        </svg>
      </FormatButton>

      <FormatButton
        active={activeMarks.underline}
        onClick={toggleUnderline}
        title="Underline (Cmd+U)"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M6 4v6a6 6 0 0 0 12 0V4" />
          <path d="M4 20h16" />
        </svg>
      </FormatButton>

      <FormatButton
        active={activeMarks.strikethrough}
        onClick={toggleStrikethrough}
        title="Strikethrough"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M16 4c-1.5 0-3-.5-4.5-.5S8 4 6.5 5.5 5 9 6.5 10.5" />
          <path d="M8 20c1.5 0 3 .5 4.5.5s3.5-.5 5-2 1.5-4 0-5.5" />
          <path d="M4 12h16" />
        </svg>
      </FormatButton>

      <span className="ob-bubble-menu-divider" />

      <FormatButton
        active={activeMarks.code}
        onClick={toggleCode}
        title="Inline code"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="m16 18 6-6-6-6" />
          <path d="m8 6-6 6 6 6" />
        </svg>
      </FormatButton>

      <button
        ref={linkButtonRef}
        type="button"
        className={`ob-bubble-menu-btn ${activeMarks.link ? 'ob-bubble-menu-btn--active' : ''}`}
        onClick={handleLinkClick}
        onMouseDown={(e) => e.preventDefault()}
        title={activeMarks.link ? 'Edit link' : 'Add link'}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
        </svg>
      </button>

      <span className="ob-bubble-menu-divider" />

      <ColorPicker
        editor={editor}
        currentTextColor={activeMarks.textColor}
        currentBackgroundColor={activeMarks.backgroundColor}
      />

      {showLinkPopover && linkButtonRef.current && (
        <LinkPopover
          editor={editor}
          currentUrl={activeMarks.link}
          onClose={closeLinkPopover}
          triggerRef={linkButtonRef}
          position={{
            left: linkButtonRef.current.getBoundingClientRect().left,
            top: linkButtonRef.current.getBoundingClientRect().bottom + 8,
          }}
        />
      )}
    </div>
  );
}
