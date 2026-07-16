/**
 * TableHandles - React component for table row/column manipulation.
 *
 * Renders handles on hover to add/remove rows and columns, similar to BlockNote.
 * - Row handle appears on the left of rows
 * - Column handle appears on top of columns
 * - "+" buttons at the end to add new rows/columns
 *
 * @example
 * ```tsx
 * import { useOpenBlock, OpenBlockView, TableHandles } from '@openblock/react';
 *
 * function MyEditor() {
 *   const editor = useOpenBlock();
 *
 *   return (
 *     <OpenBlockView editor={editor}>
 *       <TableHandles editor={editor} />
 *     </OpenBlockView>
 *   );
 * }
 * ```
 */

import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  OpenBlockEditor,
  Transaction,
  addRowAtIndex,
  addColumnAtIndex,
  deleteRowAtIndex,
  deleteColumnAtIndex,
} from '@labbs/openblock-core';
import { useClickOutside } from '../hooks/useClickOutside';
import { PlusIcon } from './icons';

/**
 * Props for TableHandles component.
 */
export interface TableHandlesProps {
  /**
   * The OpenBlockEditor instance (can be null during initialization).
   */
  editor: OpenBlockEditor | null;

  /**
   * Additional class name for the handles container.
   */
  className?: string;
}

interface TableRect {
  left: number;
  top: number;
  right: number;
  bottom: number;
  width: number;
  height: number;
}

interface TableState {
  tablePos: number;
  tableElement: HTMLElement;
  /** Bounding rect of the table, measured when the state was computed. */
  tableRect: TableRect;
  rowCount: number;
  colCount: number;
  rows: { top: number; height: number }[];
  cols: { left: number; width: number }[];
}

interface HoverState {
  type: 'row' | 'col' | null;
  index: number;
}

/**
 * Find table info from DOM and editor state.
 *
 * Measures the table geometry once; the result is cached by the component
 * and only recomputed when the hovered table element changes.
 */
function getTableState(
  editor: OpenBlockEditor,
  tableElement: HTMLElement
): TableState | null {
  // Find table position in document
  const view = editor.pm.view;
  let tablePos = -1;

  view.state.doc.descendants((node, pos) => {
    if (node.type.name === 'table' && tablePos === -1) {
      const domNode = view.nodeDOM(pos);
      if (domNode === tableElement || tableElement.contains(domNode as Node)) {
        tablePos = pos;
        return false;
      }
    }
    return true;
  });

  if (tablePos === -1) return null;

  const table = view.state.doc.nodeAt(tablePos);
  if (!table || table.type.name !== 'table') return null;

  // Get row elements and their positions
  const rowElements = tableElement.querySelectorAll(':scope > tr, :scope > tbody > tr, :scope > thead > tr');
  const rows: { top: number; height: number }[] = [];
  const rect = tableElement.getBoundingClientRect();
  const tableRect: TableRect = {
    left: rect.left,
    top: rect.top,
    right: rect.right,
    bottom: rect.bottom,
    width: rect.width,
    height: rect.height,
  };

  rowElements.forEach((row) => {
    const rowRect = row.getBoundingClientRect();
    rows.push({
      top: rowRect.top - tableRect.top,
      height: rowRect.height,
    });
  });

  // Get column positions from first row cells
  const cols: { left: number; width: number }[] = [];
  if (rowElements.length > 0) {
    const firstRowCells = rowElements[0].querySelectorAll(':scope > td, :scope > th');
    firstRowCells.forEach((cell) => {
      const cellRect = cell.getBoundingClientRect();
      cols.push({
        left: cellRect.left - tableRect.left,
        width: cellRect.width,
      });
    });
  }

  return {
    tablePos,
    tableElement,
    tableRect,
    rowCount: table.childCount,
    colCount: cols.length,
    rows,
    cols,
  };
}

/**
 * Check whether two table states are equivalent (same table, same geometry).
 */
function isSameTableState(a: TableState, b: TableState): boolean {
  return (
    a.tablePos === b.tablePos &&
    a.tableElement === b.tableElement &&
    a.rowCount === b.rowCount &&
    a.colCount === b.colCount &&
    a.tableRect.left === b.tableRect.left &&
    a.tableRect.top === b.tableRect.top &&
    a.tableRect.width === b.tableRect.width &&
    a.tableRect.height === b.tableRect.height
  );
}

/**
 * Handle (with its options menu) for a single row or column.
 */
interface TableAxisHandleProps {
  /** Which axis this handle manipulates. */
  axis: 'row' | 'col';
  /** Whether the handle is highlighted (hovered). */
  visible: boolean;
  /** Position style for the handle. */
  style: React.CSSProperties;
  /** Whether the options menu is open. */
  menuOpen: boolean;
  /** Fixed position of the options menu (measured when it opens). */
  menuPosition: { left: number; top: number } | null;
  /** Whether the delete action is available. */
  canDelete: boolean;
  /** Toggle the options menu; receives the button rect for positioning. */
  onToggleMenu: (buttonRect: DOMRect) => void;
  /** Insert before (above/left). */
  onInsertBefore: () => void;
  /** Insert after (below/right). */
  onInsertAfter: () => void;
  /** Delete this row/column. */
  onDelete: () => void;
}

const AXIS_LABELS = {
  row: {
    title: 'Row options',
    insertBefore: 'Insert above',
    insertAfter: 'Insert below',
    remove: 'Delete row',
  },
  col: {
    title: 'Column options',
    insertBefore: 'Insert left',
    insertAfter: 'Insert right',
    remove: 'Delete column',
  },
} as const;

function TableAxisHandle({
  axis,
  visible,
  style,
  menuOpen,
  menuPosition,
  canDelete,
  onToggleMenu,
  onInsertBefore,
  onInsertAfter,
  onDelete,
}: TableAxisHandleProps): React.ReactElement {
  const labels = AXIS_LABELS[axis];

  return (
    <div
      className={`ob-table-handle ob-table-handle--${axis} ${
        visible ? 'ob-table-handle--visible' : ''
      }`}
      style={style}
    >
      <button
        type="button"
        className="ob-table-handle-btn"
        onClick={(e) => onToggleMenu(e.currentTarget.getBoundingClientRect())}
        onMouseDown={(e) => e.preventDefault()}
        title={labels.title}
      >
        {axis === 'row' ? (
          <svg viewBox="0 0 24 24" fill="currentColor">
            <circle cx="12" cy="6" r="2" />
            <circle cx="12" cy="12" r="2" />
            <circle cx="12" cy="18" r="2" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" fill="currentColor">
            <circle cx="6" cy="12" r="2" />
            <circle cx="12" cy="12" r="2" />
            <circle cx="18" cy="12" r="2" />
          </svg>
        )}
      </button>

      {menuOpen && menuPosition && (
        <div
          className="ob-table-handle-menu"
          style={{ left: menuPosition.left, top: menuPosition.top }}
        >
          <button onClick={onInsertBefore}>
            <PlusIcon />
            {labels.insertBefore}
          </button>
          <button onClick={onInsertAfter}>
            <PlusIcon />
            {labels.insertAfter}
          </button>
          {canDelete && (
            <button className="ob-table-handle-menu-danger" onClick={onDelete}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
              {labels.remove}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * TableHandles component.
 *
 * Renders row/column handles when hovering over a table.
 */
export function TableHandles({
  editor,
  className,
}: TableHandlesProps): React.ReactElement | null {
  const [tableState, setTableState] = useState<TableState | null>(null);
  const [hoverState, setHoverState] = useState<HoverState>({ type: null, index: -1 });
  const [showRowMenu, setShowRowMenu] = useState<number | null>(null);
  const [showColMenu, setShowColMenu] = useState<number | null>(null);
  // Store fixed menu position when menu opens to prevent jumping on re-render
  const [menuPosition, setMenuPosition] = useState<{ left: number; top: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Mirror of tableState readable from stable event handlers.
  const tableStateRef = useRef<TableState | null>(null);
  tableStateRef.current = tableState;

  const hideAll = useCallback(() => {
    tableStateRef.current = null;
    setTableState(null);
    setHoverState((prev) => (prev.type === null ? prev : { type: null, index: -1 }));
    setShowRowMenu(null);
    setShowColMenu(null);
    setMenuPosition(null);
  }, []);

  // Track mouse position to detect which row/col is hovered.
  // The handler is stable (deps: [editor]) and reads the current state via refs.
  useEffect(() => {
    if (!editor || editor.isDestroyed) return;

    let hideTimeout: ReturnType<typeof setTimeout> | null = null;

    const clearHideTimeout = () => {
      if (hideTimeout) {
        clearTimeout(hideTimeout);
        hideTimeout = null;
      }
    };

    const scheduleHide = () => {
      clearHideTimeout();
      hideTimeout = setTimeout(() => {
        tableStateRef.current = null;
        setTableState(null);
        setHoverState((prev) => (prev.type === null ? prev : { type: null, index: -1 }));
      }, 100);
    };

    const setHover = (type: HoverState['type'], index: number) => {
      setHoverState((prev) =>
        prev.type === type && prev.index === index ? prev : { type, index }
      );
    };

    const handleMouseMove = (e: MouseEvent) => {
      const target = e.target as HTMLElement;

      // Check if we're over the handles container - keep visible
      if (containerRef.current?.contains(target)) {
        clearHideTimeout();
        return;
      }

      // Find if we're over a table
      const tableElement = target.closest('table');
      const current = tableStateRef.current;

      if (!tableElement) {
        // Not over a table, but check if we have a current table state
        // and mouse is near the table (in the handle zone)
        if (current) {
          const tableRect = current.tableRect;
          // Keep visible only if mouse is within the extend button zones (right and bottom)
          const isInExtendZone =
            (e.clientX >= tableRect.right && e.clientX <= tableRect.right + 30 &&
             e.clientY >= tableRect.top && e.clientY <= tableRect.bottom) ||
            (e.clientY >= tableRect.bottom && e.clientY <= tableRect.bottom + 30 &&
             e.clientX >= tableRect.left && e.clientX <= tableRect.right);

          if (isInExtendZone) {
            clearHideTimeout();
            return;
          }
        }
        scheduleHide();
        return;
      }

      clearHideTimeout();

      // Only recompute the (expensive) table state when the hovered table
      // element changes; otherwise reuse the cached geometry.
      let state = current;
      if (!state || state.tableElement !== tableElement) {
        state = getTableState(editor, tableElement as HTMLElement);
        if (!state) {
          scheduleHide();
          return;
        }
        tableStateRef.current = state;
        const next = state;
        setTableState((prev) => (prev && isSameTableState(prev, next) ? prev : next));
      }

      // Determine which row/col is hovered based on mouse position,
      // using the cached geometry (no DOM measurement per mousemove).
      const { tableRect, rows, cols } = state;
      const relX = e.clientX - tableRect.left;
      const relY = e.clientY - tableRect.top;

      // Check if in left margin (row handle area)
      if (relX < 0 && relX > -40) {
        const rowIndex = rows.findIndex(
          (row) => relY >= row.top && relY <= row.top + row.height
        );
        if (rowIndex !== -1) {
          setHover('row', rowIndex);
          return;
        }
      }

      // Check if in top margin (column handle area)
      if (relY < 0 && relY > -40) {
        const colIndex = cols.findIndex(
          (col) => relX >= col.left && relX <= col.left + col.width
        );
        if (colIndex !== -1) {
          setHover('col', colIndex);
          return;
        }
      }

      // Inside the table: find the hovered cell from the cached geometry
      if (relX >= 0 && relY >= 0) {
        const rowIndex = rows.findIndex(
          (row) => relY >= row.top && relY <= row.top + row.height
        );
        const colIndex = cols.findIndex(
          (col) => relX >= col.left && relX <= col.left + col.width
        );
        if (rowIndex === -1 || colIndex === -1) return;

        // Show row handle if near left edge of the cell
        if (relX - cols[colIndex].left < 20) {
          setHover('row', rowIndex);
        }
        // Show col handle if near top edge of the cell
        else if (relY - rows[rowIndex].top < 20) {
          setHover('col', colIndex);
        } else {
          setHover(null, -1);
        }
      }
    };

    const handleMouseLeave = () => {
      scheduleHide();
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      clearHideTimeout();
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [editor]);

  // Invalidate the handles when the document changes: the cached tablePos
  // and geometry may be stale after an edit.
  useEffect(() => {
    if (!editor || editor.isDestroyed) return;

    const unsubscribe = editor.on('transaction', ({ transaction }) => {
      if ((transaction as Transaction).docChanged) {
        hideAll();
      }
    });
    return unsubscribe;
  }, [editor, hideAll]);

  // The overlays use position: fixed and are never repositioned: hide them
  // on scroll/resize so they don't drift away from the table.
  useEffect(() => {
    if (!editor || !tableState) return;

    const handleScrollOrResize = () => {
      hideAll();
    };

    window.addEventListener('scroll', handleScrollOrResize, true);
    window.addEventListener('resize', handleScrollOrResize);

    return () => {
      window.removeEventListener('scroll', handleScrollOrResize, true);
      window.removeEventListener('resize', handleScrollOrResize);
    };
  }, [editor, tableState, hideAll]);

  // Close menus when clicking outside
  useClickOutside(
    [containerRef],
    () => {
      setShowRowMenu(null);
      setShowColMenu(null);
      setMenuPosition(null);
    },
    showRowMenu !== null || showColMenu !== null
  );

  const handleAddRow = useCallback(
    (index: number) => {
      if (!editor || editor.isDestroyed || !tableState) return;
      addRowAtIndex(editor.pm.state, editor.pm.view.dispatch, tableState.tablePos, index);
      editor.pm.view.focus();
      setShowRowMenu(null);
    },
    [editor, tableState]
  );

  const handleDeleteRow = useCallback(
    (index: number) => {
      if (!editor || editor.isDestroyed || !tableState) return;
      deleteRowAtIndex(editor.pm.state, editor.pm.view.dispatch, tableState.tablePos, index);
      editor.pm.view.focus();
      setShowRowMenu(null);
    },
    [editor, tableState]
  );

  const handleAddCol = useCallback(
    (index: number) => {
      if (!editor || editor.isDestroyed || !tableState) return;
      addColumnAtIndex(editor.pm.state, editor.pm.view.dispatch, tableState.tablePos, index);
      editor.pm.view.focus();
      setShowColMenu(null);
    },
    [editor, tableState]
  );

  const handleDeleteCol = useCallback(
    (index: number) => {
      if (!editor || editor.isDestroyed || !tableState) return;
      deleteColumnAtIndex(editor.pm.state, editor.pm.view.dispatch, tableState.tablePos, index);
      editor.pm.view.focus();
      setShowColMenu(null);
    },
    [editor, tableState]
  );

  if (!editor || editor.isDestroyed || !tableState) return null;

  // Geometry was measured in the mousemove handler; never measured in render.
  const { tableRect } = tableState;

  return (
    <div ref={containerRef} className={`ob-table-handles ${className || ''}`}>
      {/* Row handles */}
      {tableState.rows.map((row, index) => (
        <TableAxisHandle
          key={`row-${index}`}
          axis="row"
          visible={hoverState.type === 'row' && hoverState.index === index}
          style={{
            position: 'fixed',
            left: tableRect.left - 28,
            top: tableRect.top + row.top,
            height: row.height,
          }}
          menuOpen={showRowMenu === index}
          menuPosition={menuPosition}
          canDelete={tableState.rowCount > 1}
          onToggleMenu={(btnRect) => {
            if (showRowMenu === index) {
              setShowRowMenu(null);
              setMenuPosition(null);
            } else {
              setShowRowMenu(index);
              setShowColMenu(null);
              setMenuPosition({ left: btnRect.right + 4, top: btnRect.top });
            }
          }}
          onInsertBefore={() => handleAddRow(index)}
          onInsertAfter={() => handleAddRow(index + 1)}
          onDelete={() => handleDeleteRow(index)}
        />
      ))}

      {/* Column handles */}
      {tableState.cols.map((col, index) => (
        <TableAxisHandle
          key={`col-${index}`}
          axis="col"
          visible={hoverState.type === 'col' && hoverState.index === index}
          style={{
            position: 'fixed',
            left: tableRect.left + col.left,
            top: tableRect.top - 28,
            width: col.width,
          }}
          menuOpen={showColMenu === index}
          menuPosition={menuPosition}
          canDelete={tableState.colCount > 1}
          onToggleMenu={(btnRect) => {
            if (showColMenu === index) {
              setShowColMenu(null);
              setMenuPosition(null);
            } else {
              setShowColMenu(index);
              setShowRowMenu(null);
              setMenuPosition({ left: btnRect.left + btnRect.width / 2 - 75, top: btnRect.bottom + 4 });
            }
          }}
          onInsertBefore={() => handleAddCol(index)}
          onInsertAfter={() => handleAddCol(index + 1)}
          onDelete={() => handleDeleteCol(index)}
        />
      ))}

      {/* Add row button at bottom - full width bar */}
      <button
        type="button"
        className="ob-table-extend-btn ob-table-extend-btn--row ob-table-extend-btn--visible"
        style={{
          position: 'fixed',
          left: tableRect.left,
          top: tableRect.bottom + 4,
          width: tableRect.width,
        }}
        onClick={() => handleAddRow(tableState.rowCount)}
        onMouseDown={(e) => e.preventDefault()}
        title="Add row"
      >
        <PlusIcon />
      </button>

      {/* Add column button at right - full height bar */}
      <button
        type="button"
        className="ob-table-extend-btn ob-table-extend-btn--col ob-table-extend-btn--visible"
        style={{
          position: 'fixed',
          left: tableRect.right + 4,
          top: tableRect.top,
          height: tableRect.height,
        }}
        onClick={() => handleAddCol(tableState.colCount)}
        onMouseDown={(e) => e.preventDefault()}
        title="Add column"
      >
        <PlusIcon />
      </button>
    </div>
  );
}
