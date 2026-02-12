/**
 * Operations Engine - Applies AI operations to the grid
 *
 * This module provides the core functionality for applying the 8 types of AI operations
 * to the grid store. Each operation mutates the gridStore state atomically.
 */

import { useGridStore } from '../stores/gridStore';
import type { Operation } from '../types/operations';
import {
  cellIdToCoords,
  coordsToCellId,
  letterToColumnIndex,
} from './cellUtils';

/**
 * Apply a list of operations to the grid store sequentially.
 * Each operation mutates the gridStore state.
 *
 * @param operations - Array of operations to apply
 * @throws Error if any operation fails
 */
export function applyOperations(operations: Operation[]): void {
  for (const operation of operations) {
    switch (operation.type) {
      case 'SET_VALUE':
        handleSetValue(operation);
        break;
      case 'SET_FORMULA':
        handleSetFormula(operation);
        break;
      case 'INSERT_ROW':
        handleInsertRow(operation);
        break;
      case 'INSERT_COLUMN':
        handleInsertColumn(operation);
        break;
      case 'DELETE_ROW':
        handleDeleteRow(operation);
        break;
      case 'DELETE_COLUMN':
        handleDeleteColumn(operation);
        break;
      case 'SORT':
        handleSort(operation);
        break;
      case 'FORMAT':
        handleFormat(operation);
        break;
      default:
        // TypeScript exhaustiveness check
        const _exhaustive: never = operation;
        throw new Error(`Unknown operation type: ${(_exhaustive as any).type}`);
    }
  }
}

function handleSetValue(op: Extract<Operation, { type: 'SET_VALUE' }>): void {
  const store = useGridStore.getState();

  // Validate cell ID format
  const coords = cellIdToCoords(op.cellId);
  if (isNaN(coords.row) || coords.row < 1 || coords.col < 0 || coords.col >= 26) {
    throw new Error(`Invalid cell ID: ${op.cellId}`);
  }

  // Apply via gridStore mutation
  store.setCell(op.cellId, op.value);
}

function handleSetFormula(op: Extract<Operation, { type: 'SET_FORMULA' }>): void {
  const store = useGridStore.getState();

  const coords = cellIdToCoords(op.cellId);
  if (isNaN(coords.row) || coords.row < 1 || coords.col < 0 || coords.col >= 26) {
    throw new Error(`Invalid cell ID: ${op.cellId}`);
  }

  // Set cell with formula field
  // Note: Formula evaluation is NOT in this story (MVP doesn't include formulas yet)
  // For now, just store the formula string
  store.setCell(op.cellId, op.formula, { formula: op.formula });
}

function handleInsertRow(op: Extract<Operation, { type: 'INSERT_ROW' }>): void {
  const store = useGridStore.getState();

  // Use existing insertRow action from gridStore
  store.insertRow(op.afterRow);

  // Set the cells for the new row
  op.cells?.forEach((cell) => {
    store.setCell(cell.id, cell.value, {
      ...(cell.formula && { formula: cell.formula }),
      ...(cell.format && { format: cell.format }),
    });
  });
}

function handleInsertColumn(
  op: Extract<Operation, { type: 'INSERT_COLUMN' }>
): void {
  const store = useGridStore.getState();

  // Convert column letter to index
  const colIndex = letterToColumnIndex(op.afterCol);
  if (colIndex < 0 || colIndex >= 26 || isNaN(colIndex)) {
    throw new Error(`Invalid column: ${op.afterCol}`);
  }

  // Use existing insertColumn action from gridStore
  store.insertColumn(colIndex);

  // Set the cells for the new column
  op.cells?.forEach((cell) => {
    store.setCell(cell.id, cell.value, {
      ...(cell.formula && { formula: cell.formula }),
      ...(cell.format && { format: cell.format }),
    });
  });
}

function handleDeleteRow(op: Extract<Operation, { type: 'DELETE_ROW' }>): void {
  const store = useGridStore.getState();
  store.deleteRow(op.row);
}

function handleDeleteColumn(
  op: Extract<Operation, { type: 'DELETE_COLUMN' }>
): void {
  const store = useGridStore.getState();
  const colIndex = letterToColumnIndex(op.col);
  if (colIndex < 0 || colIndex >= 26 || isNaN(colIndex)) {
    throw new Error(`Invalid column: ${op.col}`);
  }
  store.deleteColumn(colIndex);
}

function handleSort(op: Extract<Operation, { type: 'SORT' }>): void {
  const store = useGridStore.getState();
  const { cells, rowCount } = store;

  // Extract all values from the sort column
  const rowValues: Array<{ row: number; value: any }> = [];
  for (let row = 1; row <= rowCount; row++) {
    const cellId = `${op.column}${row}`;
    const value = cells[cellId]?.value ?? null;
    rowValues.push({ row, value });
  }

  // Sort by value
  rowValues.sort((a, b) => {
    if (a.value === null || a.value === undefined) return 1;
    if (b.value === null || b.value === undefined) return -1;

    if (typeof a.value === 'number' && typeof b.value === 'number') {
      return op.direction === 'asc' ? a.value - b.value : b.value - a.value;
    }

    const aStr = String(a.value);
    const bStr = String(b.value);
    const cmp = aStr.localeCompare(bStr);
    return op.direction === 'asc' ? cmp : -cmp;
  });

  // Build new row mapping
  const newCells: typeof cells = {};
  const oldCells = { ...cells };

  rowValues.forEach((item, newIndex) => {
    const oldRow = item.row;
    const newRow = newIndex + 1;

    // Move all cells from old row to new row
    Object.keys(oldCells).forEach((cellId) => {
      const coords = cellIdToCoords(cellId);
      if (coords && coords.row === oldRow) {
        const newCellId = coordsToCellId(newRow, coords.col);
        newCells[newCellId] = { ...oldCells[cellId], id: newCellId };
      }
    });
  });

  // Replace cells in store
  useGridStore.setState({ cells: newCells });
}

function handleFormat(op: Extract<Operation, { type: 'FORMAT' }>): void {
  const store = useGridStore.getState();

  op.cellIds.forEach((cellId) => {
    const coords = cellIdToCoords(cellId);
    if (isNaN(coords.row) || coords.row < 1 || coords.col < 0 || coords.col >= 26) {
      console.warn(`Invalid cell ID in FORMAT operation: ${cellId}`);
      return;
    }

    const cell = store.cells[cellId];
    const currentFormat = cell?.format ?? {};
    const newFormat = { ...currentFormat, ...op.format };

    // Update cell with merged format
    if (cell) {
      store.setCell(cellId, cell.value, {
        format: newFormat,
        ...(cell.formula && { formula: cell.formula }),
      });
    } else {
      // Create cell if it doesn't exist
      store.setCell(cellId, '', { format: newFormat });
    }
  });
}
