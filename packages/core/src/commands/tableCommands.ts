/**
 * Table commands for OpenBlock.
 *
 * Provides commands for manipulating tables: adding/removing rows and columns,
 * navigating between cells, etc.
 *
 * Note: the OpenBlock table model does not support merged cells - tables are
 * strictly rectangular grids, and the cell specs carry no colspan/rowspan
 * attributes (see schema/nodes/tableCell.ts).
 *
 * @module
 */

import { EditorState, Transaction, TextSelection } from 'prosemirror-state';
import type { Command } from 'prosemirror-state';
import { Node as PMNode } from 'prosemirror-model';

type Dispatch = ((tr: Transaction) => void) | undefined;

/**
 * Find the table, row, and cell at the current selection.
 * Returns null if not inside a table.
 */
export interface TableContext {
  table: PMNode;
  tablePos: number;
  row: PMNode;
  rowPos: number;
  rowIndex: number;
  cell: PMNode;
  cellPos: number;
  cellIndex: number;
  colCount: number;
  rowCount: number;
}

export function findTableContext(state: EditorState): TableContext | null {
  const { $from } = state.selection;

  // Find the innermost table around the selection
  for (let depth = $from.depth; depth > 0; depth--) {
    if ($from.node(depth).type.name !== 'table') continue;

    // Selection must be inside a cell: table > tableRow > cell > content
    if ($from.depth < depth + 2) return null;

    const table = $from.node(depth);
    const row = $from.node(depth + 1);
    const cell = $from.node(depth + 2);

    if (row.type.name !== 'tableRow') return null;
    if (cell.type.name !== 'tableCell' && cell.type.name !== 'tableHeader') return null;

    return {
      table,
      tablePos: $from.before(depth),
      row,
      rowPos: $from.before(depth + 1),
      rowIndex: $from.index(depth),
      cell,
      cellPos: $from.before(depth + 2),
      cellIndex: $from.index(depth + 1),
      colCount: row.childCount,
      rowCount: table.childCount,
    };
  }

  return null;
}

// ---------------------------------------------------------------------------
// Internal position helpers
// ---------------------------------------------------------------------------

/**
 * Position just before row `rowIndex` (== end of table content when
 * rowIndex === table.childCount).
 */
function rowStartPos(tablePos: number, table: PMNode, rowIndex: number): number {
  let pos = tablePos + 1;
  for (let i = 0; i < rowIndex; i++) {
    pos += table.child(i).nodeSize;
  }
  return pos;
}

/**
 * Position just before cell `cellIndex` of row `rowIndex` (== end of row
 * content when cellIndex === row.childCount).
 */
function cellStartPos(tablePos: number, table: PMNode, rowIndex: number, cellIndex: number): number {
  const row = table.child(rowIndex);
  let pos = rowStartPos(tablePos, table, rowIndex) + 1;
  for (let c = 0; c < cellIndex; c++) {
    pos += row.child(c).nodeSize;
  }
  return pos;
}

/**
 * Create an empty cell of the given type (same type as a reference cell).
 */
function createEmptyCell(state: EditorState, refCell: PMNode): PMNode {
  return (
    refCell.type.createAndFill() ??
    refCell.type.create(null, state.schema.nodes.paragraph.create())
  );
}

/**
 * Create a new row whose cells have the same types as the reference row's
 * cells (so inserting next to a header row creates header cells).
 */
function createRowLike(state: EditorState, refRow: PMNode): PMNode {
  const cells: PMNode[] = [];
  refRow.forEach((cell) => {
    cells.push(createEmptyCell(state, cell));
  });
  return state.schema.nodes.tableRow.create(null, cells);
}

/**
 * Move the selection into the cell at (rowIndex, cellIndex), based on the
 * table layout in `tr.doc` (positions must already be up to date).
 */
function selectCell(
  tr: Transaction,
  tablePos: number,
  table: PMNode,
  rowIndex: number,
  cellIndex: number
): Transaction {
  // +2: enter the cell, then its first content node
  const pos = cellStartPos(tablePos, table, rowIndex, cellIndex) + 2;
  return tr.setSelection(TextSelection.near(tr.doc.resolve(pos)));
}

// ---------------------------------------------------------------------------
// Internal row/column operations (shared by cursor-based and index-based APIs)
// ---------------------------------------------------------------------------

/**
 * Insert a new row (modeled on `refRow`) before row `rowIndex`.
 */
function insertRowAt(
  state: EditorState,
  dispatch: Dispatch,
  tablePos: number,
  table: PMNode,
  rowIndex: number,
  refRow: PMNode
): boolean {
  if (dispatch) {
    const index = Math.max(0, Math.min(rowIndex, table.childCount));
    const insertPos = rowStartPos(tablePos, table, index);
    dispatch(state.tr.insert(insertPos, createRowLike(state, refRow)));
  }
  return true;
}

/**
 * Delete the row at `rowIndex`.
 */
function removeRowAt(
  state: EditorState,
  dispatch: Dispatch,
  tablePos: number,
  table: PMNode,
  rowIndex: number
): boolean {
  if (table.childCount <= 1) return false;
  if (rowIndex < 0 || rowIndex >= table.childCount) return false;

  if (dispatch) {
    const rowStart = rowStartPos(tablePos, table, rowIndex);
    const rowEnd = rowStart + table.child(rowIndex).nodeSize;
    dispatch(state.tr.delete(rowStart, rowEnd));
  }

  return true;
}

/**
 * Insert a new cell in every row, before column `colIndex` (clamped per
 * row). Uses targeted `tr.insert` per row instead of rebuilding the table,
 * so the selection and undo history are preserved.
 */
function insertColumnAt(
  state: EditorState,
  dispatch: Dispatch,
  tablePos: number,
  table: PMNode,
  colIndex: number
): boolean {
  if (dispatch) {
    const tr = state.tr;

    // Iterate rows bottom-up so positions computed on the original doc
    // remain valid as we insert.
    for (let r = table.childCount - 1; r >= 0; r--) {
      const row = table.child(r);
      const index = Math.max(0, Math.min(colIndex, row.childCount));
      // Cell type mirrors the neighboring cell in this row
      const refCell = row.child(Math.min(index, row.childCount - 1));
      tr.insert(cellStartPos(tablePos, table, r, index), createEmptyCell(state, refCell));
    }

    dispatch(tr);
  }

  return true;
}

/**
 * Delete the cell at column `colIndex` in every row. Uses targeted
 * `tr.delete` per row instead of rebuilding the table, then repositions the
 * selection near its (mapped) original position.
 */
function removeColumnAt(
  state: EditorState,
  dispatch: Dispatch,
  tablePos: number,
  table: PMNode,
  colIndex: number
): boolean {
  if (table.childCount === 0) return false;
  if (table.child(0).childCount <= 1) return false;
  if (colIndex < 0) return false;

  if (dispatch) {
    const tr = state.tr;

    // Iterate rows bottom-up so positions computed on the original doc
    // remain valid as we delete.
    for (let r = table.childCount - 1; r >= 0; r--) {
      const row = table.child(r);
      if (colIndex >= row.childCount) continue;
      const cellStart = cellStartPos(tablePos, table, r, colIndex);
      tr.delete(cellStart, cellStart + row.child(colIndex).nodeSize);
    }

    // Reposition the selection (it may have been inside a deleted cell)
    const mapped = Math.min(tr.mapping.map(state.selection.from), tr.doc.content.size);
    tr.setSelection(TextSelection.near(tr.doc.resolve(mapped)));

    dispatch(tr);
  }

  return true;
}

/**
 * Resolve a table node at a given document position (for the index-based
 * command variants).
 */
function tableAt(state: EditorState, tablePos: number): PMNode | null {
  const table = state.doc.nodeAt(tablePos);
  return table && table.type.name === 'table' ? table : null;
}

// ---------------------------------------------------------------------------
// Cursor-based commands
// ---------------------------------------------------------------------------

/**
 * Add a row after the current row.
 * The new row's cells have the same types as the current row's cells.
 */
export const addRowAfter: Command = (state, dispatch) => {
  const ctx = findTableContext(state);
  if (!ctx) return false;
  return insertRowAt(state, dispatch, ctx.tablePos, ctx.table, ctx.rowIndex + 1, ctx.row);
};

/**
 * Add a row before the current row.
 * The new row's cells have the same types as the current row's cells.
 */
export const addRowBefore: Command = (state, dispatch) => {
  const ctx = findTableContext(state);
  if (!ctx) return false;
  return insertRowAt(state, dispatch, ctx.tablePos, ctx.table, ctx.rowIndex, ctx.row);
};

/**
 * Delete the current row.
 */
export const deleteRow: Command = (state, dispatch) => {
  const ctx = findTableContext(state);
  if (!ctx) return false;
  return removeRowAt(state, dispatch, ctx.tablePos, ctx.table, ctx.rowIndex);
};

/**
 * Add a column after the current column.
 */
export const addColumnAfter: Command = (state, dispatch) => {
  const ctx = findTableContext(state);
  if (!ctx) return false;
  return insertColumnAt(state, dispatch, ctx.tablePos, ctx.table, ctx.cellIndex + 1);
};

/**
 * Add a column before the current column.
 */
export const addColumnBefore: Command = (state, dispatch) => {
  const ctx = findTableContext(state);
  if (!ctx) return false;
  return insertColumnAt(state, dispatch, ctx.tablePos, ctx.table, ctx.cellIndex);
};

/**
 * Delete the current column.
 */
export const deleteColumn: Command = (state, dispatch) => {
  const ctx = findTableContext(state);
  if (!ctx) return false;
  return removeColumnAt(state, dispatch, ctx.tablePos, ctx.table, ctx.cellIndex);
};

/**
 * Delete the entire table.
 */
export const deleteTable: Command = (state, dispatch) => {
  const ctx = findTableContext(state);
  if (!ctx) return false;

  if (dispatch) {
    const { tablePos, table } = ctx;
    dispatch(state.tr.delete(tablePos, tablePos + table.nodeSize));
  }

  return true;
};

/**
 * Move to the next cell (or create a new row if at the end).
 * Typically bound to Tab.
 */
export const goToNextCell: Command = (state, dispatch) => {
  const ctx = findTableContext(state);
  if (!ctx) return false;

  const { tablePos, rowIndex, cellIndex, colCount, rowCount, table, row } = ctx;

  const isLastCell = cellIndex === colCount - 1;
  const isLastRow = rowIndex === rowCount - 1;

  if (dispatch) {
    let tr = state.tr;

    if (isLastCell && isLastRow) {
      // Create a new row (same cell types as the current row)
      const newRow = createRowLike(state, row);

      // Insert at the end of the table (before closing tag)
      const insertPos = tablePos + table.nodeSize - 1;
      tr = tr.insert(insertPos, newRow);

      // Move selection to first cell of new row
      tr = tr.setSelection(TextSelection.near(tr.doc.resolve(insertPos + 3)));
    } else {
      // Move to next cell
      const nextRow = isLastCell ? rowIndex + 1 : rowIndex;
      const nextCell = isLastCell ? 0 : cellIndex + 1;
      tr = selectCell(tr, tablePos, table, nextRow, nextCell);
    }

    dispatch(tr);
  }

  return true;
};

/**
 * Move to the previous cell.
 * Typically bound to Shift+Tab.
 */
export const goToPreviousCell: Command = (state, dispatch) => {
  const ctx = findTableContext(state);
  if (!ctx) return false;

  const { tablePos, rowIndex, cellIndex, colCount, table } = ctx;

  // If at the first cell, do nothing
  if (rowIndex === 0 && cellIndex === 0) return false;

  if (dispatch) {
    const prevRow = cellIndex === 0 ? rowIndex - 1 : rowIndex;
    const prevCell = cellIndex === 0 ? colCount - 1 : cellIndex - 1;
    dispatch(selectCell(state.tr, tablePos, table, prevRow, prevCell));
  }

  return true;
};

/**
 * Check if the selection is inside a table.
 */
export function isInTable(state: EditorState): boolean {
  return findTableContext(state) !== null;
}

/**
 * Get information about the current table context.
 */
export function getTableInfo(state: EditorState): {
  rowIndex: number;
  cellIndex: number;
  rowCount: number;
  colCount: number;
} | null {
  const ctx = findTableContext(state);
  if (!ctx) return null;

  return {
    rowIndex: ctx.rowIndex,
    cellIndex: ctx.cellIndex,
    rowCount: ctx.rowCount,
    colCount: ctx.colCount,
  };
}

// ---------------------------------------------------------------------------
// Index-based commands
// ---------------------------------------------------------------------------

/**
 * Add a row at a specific index.
 * The new row's cells have the same types as the row currently at that
 * index (or the last row when appending).
 */
export function addRowAtIndex(
  state: EditorState,
  dispatch: Dispatch,
  tablePos: number,
  rowIndex: number
): boolean {
  const table = tableAt(state, tablePos);
  if (!table || table.childCount === 0) return false;

  const refRow = table.child(Math.max(0, Math.min(rowIndex, table.childCount - 1)));
  return insertRowAt(state, dispatch, tablePos, table, rowIndex, refRow);
}

/**
 * Add a column at a specific index.
 */
export function addColumnAtIndex(
  state: EditorState,
  dispatch: Dispatch,
  tablePos: number,
  colIndex: number
): boolean {
  const table = tableAt(state, tablePos);
  if (!table) return false;
  return insertColumnAt(state, dispatch, tablePos, table, colIndex);
}

/**
 * Delete a row at a specific index.
 */
export function deleteRowAtIndex(
  state: EditorState,
  dispatch: Dispatch,
  tablePos: number,
  rowIndex: number
): boolean {
  const table = tableAt(state, tablePos);
  if (!table) return false;
  return removeRowAt(state, dispatch, tablePos, table, rowIndex);
}

/**
 * Delete a column at a specific index.
 */
export function deleteColumnAtIndex(
  state: EditorState,
  dispatch: Dispatch,
  tablePos: number,
  colIndex: number
): boolean {
  const table = tableAt(state, tablePos);
  if (!table) return false;
  return removeColumnAt(state, dispatch, tablePos, table, colIndex);
}
