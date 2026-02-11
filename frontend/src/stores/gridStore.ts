import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { Grid } from '../types/cell';
import type { GridPersistData } from '../utils/persistence';
import { cellIdToCoords, coordsToCellId } from '../utils/cellUtils';

interface GridState {
  cells: Grid;
  rowCount: number;
  colCount: number;
  editingCell: string | null;
  selectedCell: string | null;
}

interface GridActions {
  initializeGrid: (rows: number, cols: number) => void;
  setCell: (id: string, value: string | number | null) => void;
  startEditing: (id: string) => void;
  stopEditing: () => void;
  selectCell: (id: string | null) => void;
  insertRow: (afterRow: number) => void;
  deleteRow: (row: number) => void;
  insertColumn: (afterCol: number) => void;
  deleteColumn: (col: number) => void;
  loadGrid: (data: GridPersistData) => void;
}

export const useGridStore = create<GridState & GridActions>()(
  immer((set) => ({
    cells: {},
    rowCount: 100,
    colCount: 26,
    editingCell: null,
    selectedCell: null,

    initializeGrid: (rows, cols) =>
      set((state) => {
        state.cells = {};
        state.rowCount = rows;
        state.colCount = cols;
      }),

    setCell: (id, value) =>
      set((state) => {
        if (value === null || value === '') {
          delete state.cells[id];
        } else {
          state.cells[id] = { id, value };
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
        if (state.colCount >= 26) return;

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

    loadGrid: (data) =>
      set((state) => {
        state.cells = data.cells;
        state.rowCount = data.rowCount;
        state.colCount = data.colCount;
        state.editingCell = null;
        state.selectedCell = null;
      }),
  }))
);
