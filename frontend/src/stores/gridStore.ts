import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { Grid, CellFormat } from '../types/cell';
import type { GridPersistData } from '../utils/persistence';
import { cellIdToCoords, coordsToCellId, columnIndexToLetter } from '../utils/cellUtils';

const DEFAULT_COL_WIDTH = 100;
const DEFAULT_ROW_HEIGHT = 32;

function defaultHeaders(count: number): string[] {
  return Array.from({ length: count }, (_, i) => columnIndexToLetter(i));
}

function defaultColWidths(count: number): number[] {
  return Array.from({ length: count }, () => DEFAULT_COL_WIDTH);
}

function defaultRowHeights(count: number): number[] {
  return Array.from({ length: count }, () => DEFAULT_ROW_HEIGHT);
}

interface GridState {
  cells: Grid;
  rowCount: number;
  colCount: number;
  headers: string[];
  colWidths: number[];
  rowHeights: number[];
  editingCell: string | null;
  selectedCell: string | null;
}

interface GridActions {
  initializeGrid: (rows: number, cols: number) => void;
  setCell: (
    id: string,
    value: string | number | null,
    options?: { formula?: string; format?: CellFormat }
  ) => void;
  startEditing: (id: string) => void;
  stopEditing: () => void;
  selectCell: (id: string | null) => void;
  insertRow: (afterRow: number) => void;
  deleteRow: (row: number) => void;
  insertColumn: (afterCol: number) => void;
  deleteColumn: (col: number) => void;
  setHeader: (colIndex: number, name: string) => void;
  setColWidth: (colIndex: number, width: number) => void;
  setRowHeight: (rowIndex: number, height: number) => void;
  loadGrid: (data: GridPersistData) => void;
}

export const useGridStore = create<GridState & GridActions>()(
  immer((set) => ({
    cells: {},
    rowCount: 100,
    colCount: 26,
    headers: defaultHeaders(26),
    colWidths: defaultColWidths(26),
    rowHeights: defaultRowHeights(100),
    editingCell: null,
    selectedCell: null,

    initializeGrid: (rows, cols) =>
      set((state) => {
        state.cells = {};
        state.rowCount = rows;
        state.colCount = cols;
        state.headers = defaultHeaders(cols);
        state.colWidths = defaultColWidths(cols);
        state.rowHeights = defaultRowHeights(rows);
      }),

    setCell: (id, value, options) =>
      set((state) => {
        // Only delete if value is empty AND no format/formula
        if ((value === null || value === '') && !options?.formula && !options?.format) {
          delete state.cells[id];
        } else {
          state.cells[id] = {
            id,
            value: value ?? '',
            ...(options?.formula && { formula: options.formula }),
            ...(options?.format && { format: options.format }),
          };
        }
      }),

    startEditing: (id) =>
      set((state) => {
        state.editingCell = id;
      }),

    stopEditing: () =>
      set((state) => {
        state.editingCell = null;
      }),

    selectCell: (id) =>
      set((state) => {
        state.selectedCell = id;
      }),

    insertRow: (afterRow) =>
      set((state) => {
        const newCells: Grid = {};
        for (const [id, cell] of Object.entries(state.cells)) {
          const { row, col } = cellIdToCoords(id);
          if (row > afterRow) {
            const newId = coordsToCellId(row + 1, col);
            newCells[newId] = { ...cell, id: newId };
          } else {
            newCells[id] = { ...cell };
          }
        }
        state.cells = newCells;
        state.rowCount += 1;
        state.rowHeights.splice(afterRow, 0, DEFAULT_ROW_HEIGHT);

        if (state.selectedCell) {
          const { row, col } = cellIdToCoords(state.selectedCell);
          if (row > afterRow) {
            state.selectedCell = coordsToCellId(row + 1, col);
          }
        }
        if (state.editingCell) {
          const { row, col } = cellIdToCoords(state.editingCell);
          if (row > afterRow) {
            state.editingCell = coordsToCellId(row + 1, col);
          }
        }
      }),

    deleteRow: (targetRow) =>
      set((state) => {
        if (state.rowCount <= 1) return;

        const newCells: Grid = {};
        for (const [id, cell] of Object.entries(state.cells)) {
          const { row, col } = cellIdToCoords(id);
          if (row === targetRow) continue;
          if (row > targetRow) {
            const newId = coordsToCellId(row - 1, col);
            newCells[newId] = { ...cell, id: newId };
          } else {
            newCells[id] = { ...cell };
          }
        }
        state.cells = newCells;
        state.rowCount -= 1;
        state.rowHeights.splice(targetRow - 1, 1);

        if (state.selectedCell) {
          const { row, col } = cellIdToCoords(state.selectedCell);
          if (row === targetRow) {
            state.selectedCell = null;
          } else if (row > targetRow) {
            state.selectedCell = coordsToCellId(row - 1, col);
          }
        }
        if (state.editingCell) {
          const { row, col } = cellIdToCoords(state.editingCell);
          if (row === targetRow) {
            state.editingCell = null;
          } else if (row > targetRow) {
            state.editingCell = coordsToCellId(row - 1, col);
          }
        }
      }),

    insertColumn: (afterCol) =>
      set((state) => {
        // Allow inserting beyond 26 columns for AI operations
        // (Note: Display is limited to A-Z, but operations can work beyond)
        const newCells: Grid = {};
        for (const [id, cell] of Object.entries(state.cells)) {
          const { row, col } = cellIdToCoords(id);
          if (col > afterCol) {
            const newId = coordsToCellId(row, col + 1);
            newCells[newId] = { ...cell, id: newId };
          } else {
            newCells[id] = { ...cell };
          }
        }
        state.cells = newCells;
        state.colCount += 1;
        state.headers.splice(afterCol + 1, 0, columnIndexToLetter(state.colCount - 1));
        state.colWidths.splice(afterCol + 1, 0, DEFAULT_COL_WIDTH);

        if (state.selectedCell) {
          const { row, col } = cellIdToCoords(state.selectedCell);
          if (col > afterCol) {
            state.selectedCell = coordsToCellId(row, col + 1);
          }
        }
        if (state.editingCell) {
          const { row, col } = cellIdToCoords(state.editingCell);
          if (col > afterCol) {
            state.editingCell = coordsToCellId(row, col + 1);
          }
        }
      }),

    deleteColumn: (targetCol) =>
      set((state) => {
        if (state.colCount <= 1) return;

        const newCells: Grid = {};
        for (const [id, cell] of Object.entries(state.cells)) {
          const { row, col } = cellIdToCoords(id);
          if (col === targetCol) continue;
          if (col > targetCol) {
            const newId = coordsToCellId(row, col - 1);
            newCells[newId] = { ...cell, id: newId };
          } else {
            newCells[id] = { ...cell };
          }
        }
        state.cells = newCells;
        state.colCount -= 1;
        state.headers.splice(targetCol, 1);
        state.colWidths.splice(targetCol, 1);

        if (state.selectedCell) {
          const { row, col } = cellIdToCoords(state.selectedCell);
          if (col === targetCol) {
            state.selectedCell = null;
          } else if (col > targetCol) {
            state.selectedCell = coordsToCellId(row, col - 1);
          }
        }
        if (state.editingCell) {
          const { row, col } = cellIdToCoords(state.editingCell);
          if (col === targetCol) {
            state.editingCell = null;
          } else if (col > targetCol) {
            state.editingCell = coordsToCellId(row, col - 1);
          }
        }
      }),

    setHeader: (colIndex, name) =>
      set((state) => {
        if (colIndex >= 0 && colIndex < state.headers.length) {
          state.headers[colIndex] = name;
        }
      }),

    setColWidth: (colIndex, width) =>
      set((state) => {
        if (colIndex >= 0 && colIndex < state.colWidths.length) {
          state.colWidths[colIndex] = Math.max(40, width);
        }
      }),

    setRowHeight: (rowIndex, height) =>
      set((state) => {
        if (rowIndex >= 0 && rowIndex < state.rowHeights.length) {
          state.rowHeights[rowIndex] = Math.max(20, height);
        }
      }),

    loadGrid: (data) =>
      set((state) => {
        state.cells = data.cells;
        state.rowCount = data.rowCount;
        state.colCount = data.colCount;
        state.headers = data.headers ?? defaultHeaders(data.colCount);
        state.colWidths = data.colWidths ?? defaultColWidths(data.colCount);
        state.rowHeights = data.rowHeights ?? defaultRowHeights(data.rowCount);
        state.editingCell = null;
        state.selectedCell = null;
      }),
  }))
);
