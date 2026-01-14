/**
 * SlashMenu - React component for the "/" command palette.
 *
 * Renders a floating menu when the user types "/" at the start of a block.
 * Allows inserting various block types (headings, lists, quotes, etc.).
 *
 * @example
 * ```tsx
 * import { useOpenBlock, OpenBlockView, SlashMenu } from '@openblock/react';
 *
 * function MyEditor() {
 *   const editor = useOpenBlock();
 *
 *   return (
 *     <OpenBlockView editor={editor}>
 *       <SlashMenu editor={editor} />
 *     </OpenBlockView>
 *   );
 * }
 * ```
 */

import React, { useEffect, useState, useCallback, useRef, useLayoutEffect } from 'react';
import {
  OpenBlockEditor,
  SLASH_MENU_PLUGIN_KEY,
  SlashMenuState,
  SlashMenuItem,
  getDefaultSlashMenuItems,
  filterSlashMenuItems,
  executeSlashCommand,
  closeSlashMenu,
} from '@labbs/openblock-core';

/**
 * Props for SlashMenu component.
 */
export interface SlashMenuProps {
  /**
   * The OpenBlockEditor instance.
   */
  editor: OpenBlockEditor;

  /**
   * Custom menu items (optional).
   * If not provided, uses default items based on schema.
   */
  items?: SlashMenuItem[];

  /**
   * Custom render function for menu items.
   */
  renderItem?: (item: SlashMenuItem, isSelected: boolean) => React.ReactNode;

  /**
   * Additional class name for the menu container.
   */
  className?: string;
}

/**
 * Default icons for menu items (simple SVG components).
 */
const Icons: Record<string, React.FC<{ className?: string }>> = {
  heading1: ({ className }) => (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 12h8M4 6v12M12 6v12M17 12l3-2v8" />
    </svg>
  ),
  heading2: ({ className }) => (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 12h8M4 6v12M12 6v12M17 10c1.5-1 3 0 3 2s-3 3-3 5h3" />
    </svg>
  ),
  heading3: ({ className }) => (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 12h8M4 6v12M12 6v12M17 10c1.5-1 3 0 3 1.5c0 1-1 1.5-1.5 1.5c.5 0 1.5.5 1.5 1.5c0 1.5-1.5 2.5-3 1.5" />
    </svg>
  ),
  list: ({ className }) => (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
    </svg>
  ),
  listOrdered: ({ className }) => (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M10 6h11M10 12h11M10 18h11M3 5v3h2M3 10v1c0 1 2 2 2 2s-2 1-2 2v1h4M3 17v4h2l2-2" />
    </svg>
  ),
  quote: ({ className }) => (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V21" />
      <path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v4" />
    </svg>
  ),
  code: ({ className }) => (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M16 18l6-6-6-6M8 6l-6 6 6 6" />
    </svg>
  ),
  minus: ({ className }) => (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M5 12h14" />
    </svg>
  ),
};

/**
 * SlashMenu component.
 *
 * Renders when the user types "/" and shows a filterable list of block types to insert.
 */
export function SlashMenu({
  editor,
  items: customItems,
  renderItem,
  className,
}: SlashMenuProps): React.ReactElement | null {
  const [menuState, setMenuState] = useState<SlashMenuState | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [openUpward, setOpenUpward] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Get menu items
  const allItems = customItems ?? getDefaultSlashMenuItems(editor.pm.state.schema);
  const filteredItems = menuState ? filterSlashMenuItems(allItems, menuState.query) : [];

  // Subscribe to plugin state changes
  useEffect(() => {
    const updateState = () => {
      const state = SLASH_MENU_PLUGIN_KEY.getState(editor.pm.state);
      setMenuState(state ?? null);
      setSelectedIndex(0); // Reset selection when menu opens/query changes
    };

    // Initial state
    updateState();

    // Subscribe to transactions
    const unsubscribe = editor.on('transaction', updateState);
    return unsubscribe;
  }, [editor]);

  // Handle keyboard navigation
  useEffect(() => {
    if (!menuState?.active) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault();
          setSelectedIndex((i) => Math.min(i + 1, filteredItems.length - 1));
          break;
        case 'ArrowUp':
          event.preventDefault();
          setSelectedIndex((i) => Math.max(i - 1, 0));
          break;
        case 'Enter':
          event.preventDefault();
          if (filteredItems[selectedIndex]) {
            handleSelect(filteredItems[selectedIndex]);
          }
          break;
        case 'Escape':
          event.preventDefault();
          closeSlashMenu(editor.pm.view);
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [menuState?.active, filteredItems, selectedIndex, editor]);

  // Handle item selection
  const handleSelect = useCallback(
    (item: SlashMenuItem) => {
      if (!menuState) return;
      executeSlashCommand(editor.pm.view, menuState, item.action);
      editor.pm.view.focus();
    },
    [editor, menuState]
  );

  // Determine if menu should open upward based on available space
  useLayoutEffect(() => {
    if (!menuState?.active || !menuState.coords || !menuRef.current) {
      return;
    }

    const menuHeight = menuRef.current.offsetHeight || 300; // Estimate if not yet rendered
    const spaceBelow = window.innerHeight - menuState.coords.bottom - 8;
    const spaceAbove = menuState.coords.top - 8;

    // Open upward if not enough space below but enough above
    setOpenUpward(spaceBelow < menuHeight && spaceAbove > spaceBelow);
  }, [menuState?.active, menuState?.coords, filteredItems.length]);

  // Don't render if menu is not active
  if (!menuState?.active || !menuState.coords) {
    return null;
  }

  // Position the menu - either below or above the cursor
  const style: React.CSSProperties = {
    position: 'fixed',
    left: menuState.coords.left,
    zIndex: 1000,
    ...(openUpward
      ? { bottom: window.innerHeight - menuState.coords.top + 4 }
      : { top: menuState.coords.bottom + 4 }),
  };

  return (
    <div
      ref={menuRef}
      className={`ob-slash-menu ${className || ''}`}
      style={style}
      role="listbox"
    >
      {filteredItems.length === 0 ? (
        <div className="ob-slash-menu-empty">No results</div>
      ) : (
        filteredItems.map((item, index) => {
          const isSelected = index === selectedIndex;
          const Icon = item.icon ? Icons[item.icon] : null;

          if (renderItem) {
            return (
              <div
                key={item.id}
                onClick={() => handleSelect(item)}
                role="option"
                aria-selected={isSelected}
              >
                {renderItem(item, isSelected)}
              </div>
            );
          }

          return (
            <div
              key={item.id}
              className={`ob-slash-menu-item ${isSelected ? 'ob-slash-menu-item--selected' : ''}`}
              onClick={() => handleSelect(item)}
              onMouseEnter={() => setSelectedIndex(index)}
              role="option"
              aria-selected={isSelected}
            >
              {Icon && (
                <span className="ob-slash-menu-item-icon">
                  <Icon />
                </span>
              )}
              <div className="ob-slash-menu-item-content">
                <span className="ob-slash-menu-item-title">{item.title}</span>
                {item.description && (
                  <span className="ob-slash-menu-item-description">{item.description}</span>
                )}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
