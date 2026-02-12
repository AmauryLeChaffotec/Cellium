/**
 * Diff Calculator - Calculates visual diff for AI operations
 *
 * This module calculates what changes AI operations would make WITHOUT applying them.
 * Used for visual preview before user validation.
 */

import type { Operation } from '../types/operations';
import type { Grid } from '../types/cell';
import type { DiffResult, CellDiff } from '../types/diff';
import { cellIdToCoords, letterToColumnIndex } from './cellUtils';

/**
 * Calculate visual diff for AI operations without applying them.
 * Returns categorized cell changes: additions, modifications, deletions.
 *
 * @param operations - Array of operations from AI
 * @param currentGrid - Current grid state (read-only)
 * @returns DiffResult with additions, modifications, deletions
 */
export function calculateDiff(
  operations: Operation[],
  currentGrid: Grid
): DiffResult {
  const additions = new Map<string, CellDiff>();
  const modifications = new Map<string, CellDiff>();
  const deletions = new Map<string, CellDiff>();

  // Create a shallow copy for simulation
  let simulatedGrid = { ...currentGrid };

  for (const operation of operations) {
    switch (operation.type) {
      case 'SET_VALUE':
        handleSetValueDiff(operation, simulatedGrid, currentGrid, additions, modifications, deletions);
        break;
      case 'SET_FORMULA':
        handleSetFormulaDiff(operation, simulatedGrid, currentGrid, additions, modifications);
        break;
      case 'INSERT_ROW':
        handleInsertRowDiff(operation, additions);
        break;
      case 'INSERT_COLUMN':
        handleInsertColumnDiff(operation, additions);
        break;
      case 'DELETE_ROW':
        handleDeleteRowDiff(operation, currentGrid, deletions);
        break;
      case 'DELETE_COLUMN':
        handleDeleteColumnDiff(operation, currentGrid, deletions);
        break;
      case 'SORT':
        handleSortDiff(operation, currentGrid, modifications);
        break;
      case 'FORMAT':
        handleFormatDiff(operation, currentGrid, modifications, additions);
        break;
      default:
        const _exhaustive: never = operation;
        console.warn(`Unknown operation type in diff: ${(_exhaustive as any).type}`);
    }
  }

  return { additions, modifications, deletions };
}

function handleSetValueDiff(
  op: Extract<Operation, { type: 'SET_VALUE' }>,
  simulatedGrid: Grid,
  currentGrid: Grid,
  additions: Map<string, CellDiff>,
  modifications: Map<string, CellDiff>,
  deletions: Map<string, CellDiff>
): void {
  const existingCell = currentGrid[op.cellId];

  if (op.value === null || op.value === '') {
    // Deletion
    if (existingCell) {
      deletions.set(op.cellId, {
        cellId: op.cellId,
        before: existingCell.value,
        after: null,
        formatBefore: existingCell.format,
      });
      delete simulatedGrid[op.cellId];
    }
  } else {
    // Addition or Modification
    if (existingCell) {
      modifications.set(op.cellId, {
        cellId: op.cellId,
        before: existingCell.value,
        after: op.value,
        formatBefore: existingCell.format,
        formatAfter: existingCell.format,
      });
    } else {
      additions.set(op.cellId, {
        cellId: op.cellId,
        before: null,
        after: op.value,
      });
    }
    simulatedGrid[op.cellId] = { id: op.cellId, value: op.value };
  }
}

function handleSetFormulaDiff(
  op: Extract<Operation, { type: 'SET_FORMULA' }>,
  simulatedGrid: Grid,
  currentGrid: Grid,
  additions: Map<string, CellDiff>,
  modifications: Map<string, CellDiff>
): void {
  const existingCell = currentGrid[op.cellId];

  if (existingCell) {
    modifications.set(op.cellId, {
      cellId: op.cellId,
      before: existingCell.value,
      after: op.formula,
      formatBefore: existingCell.format,
      formatAfter: existingCell.format,
    });
  } else {
    additions.set(op.cellId, {
      cellId: op.cellId,
      before: null,
      after: op.formula,
    });
  }

  simulatedGrid[op.cellId] = { id: op.cellId, value: op.formula, formula: op.formula };
}

function handleInsertRowDiff(
  op: Extract<Operation, { type: 'INSERT_ROW' }>,
  additions: Map<string, CellDiff>
): void {
  // All cells in the new row are additions
  op.cells?.forEach((cell) => {
    additions.set(cell.id, {
      cellId: cell.id,
      before: null,
      after: cell.value,
      formatAfter: cell.format,
    });
  });
}

function handleInsertColumnDiff(
  op: Extract<Operation, { type: 'INSERT_COLUMN' }>,
  additions: Map<string, CellDiff>
): void {
  // All cells in the new column are additions
  op.cells?.forEach((cell) => {
    additions.set(cell.id, {
      cellId: cell.id,
      before: null,
      after: cell.value,
      formatAfter: cell.format,
    });
  });
}

function handleDeleteRowDiff(
  op: Extract<Operation, { type: 'DELETE_ROW' }>,
  currentGrid: Grid,
  deletions: Map<string, CellDiff>
): void {
  // All cells in the deleted row are deletions
  Object.entries(currentGrid).forEach(([cellId, cell]) => {
    const coords = cellIdToCoords(cellId);
    if (coords && coords.row === op.row) {
      deletions.set(cellId, {
        cellId,
        before: cell.value,
        after: null,
        formatBefore: cell.format,
      });
    }
  });
}

function handleDeleteColumnDiff(
  op: Extract<Operation, { type: 'DELETE_COLUMN' }>,
  currentGrid: Grid,
  deletions: Map<string, CellDiff>
): void {
  // All cells in the deleted column are deletions
  const colIndex = letterToColumnIndex(op.col);
  if (colIndex < 0) return;

  Object.entries(currentGrid).forEach(([cellId, cell]) => {
    const coords = cellIdToCoords(cellId);
    if (coords && coords.col === colIndex) {
      deletions.set(cellId, {
        cellId,
        before: cell.value,
        after: null,
        formatBefore: cell.format,
      });
    }
  });
}

function handleSortDiff(
  _op: Extract<Operation, { type: 'SORT' }>,
  currentGrid: Grid,
  modifications: Map<string, CellDiff>
): void {
  // SORT reorders rows - mark all cells as potentially modified
  // In a real implementation, we would only mark cells that actually move
  // For now, mark all non-empty cells as modified to show the sort happened
  Object.entries(currentGrid).forEach(([cellId, cell]) => {
    modifications.set(cellId, {
      cellId,
      before: cell.value,
      after: cell.value, // Value doesn't change, just position
      formatBefore: cell.format,
      formatAfter: cell.format,
    });
  });
}

function handleFormatDiff(
  op: Extract<Operation, { type: 'FORMAT' }>,
  currentGrid: Grid,
  modifications: Map<string, CellDiff>,
  additions: Map<string, CellDiff>
): void {
  // FORMAT changes cell styling
  op.cellIds.forEach((cellId) => {
    const existingCell = currentGrid[cellId];
    const currentFormat = existingCell?.format ?? {};
    const newFormat = { ...currentFormat, ...op.format };

    if (existingCell) {
      modifications.set(cellId, {
        cellId,
        before: existingCell.value,
        after: existingCell.value,
        formatBefore: currentFormat,
        formatAfter: newFormat,
      });
    } else {
      // Create cell with format if it doesn't exist
      additions.set(cellId, {
        cellId,
        before: null,
        after: '',
        formatAfter: newFormat,
      });
    }
  });
}
