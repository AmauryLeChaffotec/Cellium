import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { Grid, CellFormat, ColumnType } from '../types/cell';
import type { Zone } from '../types/zone';
import type { GridPersistData } from '../utils/persistence';
import { cellIdToCoords, coordsToCellId, columnIndexToLetter } from '../utils/cellUtils';
import { normalizeRange } from '../utils/rangeUtils';
import { evaluateFormula } from '../utils/formulaEvaluator';

export type ZoneResizeHandle =
  | 'top-left' | 'top' | 'top-right'
  | 'left' | 'right'
  | 'bottom-left' | 'bottom' | 'bottom-right';

const DEFAULT_COL_WIDTH = 100;
const DEFAULT_ROW_HEIGHT = 32;

// ── Helpers: shift cell references in formulas and zones ──────────

/**
 * Update all cell references in a formula when a row is inserted or deleted.
 * For ranges (B1:B10), start and end are handled differently on delete:
 *   - start shifts only if row > refRow
 *   - end shifts if row >= refRow (to shrink the range when the last row is deleted)
 * For insert, both shift if row > refRow.
 */
function updateFormulaRowShift(formula: string | undefined, refRow: number, isInsert: boolean): string | undefined {
  if (!formula) return formula;
  return formula.replace(/([A-Z])(\d+)(?::([A-Z])(\d+))?/g, (_match, col1, row1Str, col2, row2Str) => {
    let row1 = parseInt(row1Str, 10);

    if (col2 && row2Str) {
      // Range: COL1ROW1:COL2ROW2
      let row2 = parseInt(row2Str, 10);
      if (isInsert) {
        if (row1 > refRow) row1 += 1;
        if (row2 > refRow) row2 += 1;
      } else {
        if (row1 > refRow) row1 = Math.max(1, row1 - 1);
        if (row2 >= refRow) row2 = Math.max(1, row2 - 1);
      }
      return `${col1}${row1}:${col2}${row2}`;
    } else {
      // Standalone ref: COL1ROW1
      if (isInsert) {
        if (row1 > refRow) row1 += 1;
      } else {
        if (row1 > refRow) row1 = Math.max(1, row1 - 1);
      }
      return `${col1}${row1}`;
    }
  });
}

/**
 * Update all cell references in a formula when a column is inserted or deleted.
 */
function updateFormulaColShift(formula: string | undefined, refCol: number, isInsert: boolean): string | undefined {
  if (!formula) return formula;
  return formula.replace(/([A-Z])(\d+)/g, (_match, colLetter, rowStr) => {
    let col = colLetter.charCodeAt(0) - 65;
    if (isInsert) {
      if (col > refCol) col += 1;
    } else {
      if (col > refCol) col = Math.max(0, col - 1);
    }
    return `${String.fromCharCode(65 + col)}${rowStr}`;
  });
}

/** Apply formula shift to all cells in a grid. */
function applyFormulaShift(cells: Grid, shiftFn: (f: string | undefined) => string | undefined, headers?: string[]) {
  for (const cell of Object.values(cells)) {
    if (cell.formula) {
      const updated = shiftFn(cell.formula);
      if (updated && updated !== cell.formula) {
        cell.formula = updated;
      }
    }
  }
  // Re-evaluate all formulas so `value` holds the real result
  reEvaluateFormulas(cells, headers);
}

/** Re-evaluate every formula cell so its `value` holds the computed result. */
function reEvaluateFormulas(cells: Grid, headers?: string[]) {
  for (const cell of Object.values(cells)) {
    if (cell.formula) {
      cell.value = evaluateFormula(cell.formula, cells, headers);
    }
  }
}

function defaultHeaders(count: number): string[] {
  return Array.from({ length: count }, (_, i) => columnIndexToLetter(i));
}

function defaultColWidths(count: number): number[] {
  return Array.from({ length: count }, () => DEFAULT_COL_WIDTH);
}

function defaultRowHeights(count: number): number[] {
  return Array.from({ length: count }, () => DEFAULT_ROW_HEIGHT);
}

function defaultColumnTypes(count: number): ColumnType[] {
  return Array.from({ length: count }, () => 'none' as ColumnType);
}

interface GridState {
  cells: Grid;
  rowCount: number;
  colCount: number;
  headers: string[];
  colWidths: number[];
  rowHeights: number[];
  columnTypes: ColumnType[];
  zones: Zone[];
  editingCell: string | null;
  selectedCell: string | null;
  selectionStart: string | null;
  selectionEnd: string | null;
  isDragging: boolean;
  activeZoneId: string | null;
  zoneResizing: {
    zoneId: string;
    handle: ZoneResizeHandle;
    originalStart: string;
    originalEnd: string;
  } | null;
}

interface GridActions {
  initializeGrid: (rows: number, cols: number) => void;
  setCell: (
    id: string,
    value: string | number | null,
    options?: { formula?: string; format?: CellFormat; name?: string; description?: string }
  ) => void;
  startEditing: (id: string) => void;
  stopEditing: () => void;
  selectCell: (id: string | null) => void;
  startSelection: (cellId: string) => void;
  extendSelection: (cellId: string) => void;
  endSelection: () => void;
  clearSelection: () => void;
  addZone: (zone: Zone) => void;
  updateZone: (zoneId: string, updates: Partial<Omit<Zone, 'id'>>) => void;
  deleteZone: (zoneId: string) => void;
  setActiveZone: (zoneId: string | null) => void;
  startZoneResize: (zoneId: string, handle: ZoneResizeHandle) => void;
  updateZoneResize: (cellId: string) => void;
  endZoneResize: (finalCellId?: string) => void;
  insertRow: (afterRow: number) => void;
  deleteRow: (row: number) => void;
  insertColumn: (afterCol: number) => void;
  deleteColumn: (col: number) => void;
  setColumnType: (colIndex: number, type: ColumnType) => void;
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
    columnTypes: defaultColumnTypes(26),
    zones: [],
    editingCell: null,
    selectedCell: null,
    selectionStart: null,
    selectionEnd: null,
    isDragging: false,
    activeZoneId: null,
    zoneResizing: null,

    initializeGrid: (rows, cols) =>
      set((state) => {
        state.cells = {};
        state.rowCount = rows;
        state.colCount = cols;
        state.headers = defaultHeaders(cols);
        state.colWidths = defaultColWidths(cols);
        state.rowHeights = defaultRowHeights(rows);
        state.columnTypes = defaultColumnTypes(cols);
        state.zones = [];
      }),

    setCell: (id, value, options) =>
      set((state) => {
        if ((value === null || value === '') && !options?.formula && !options?.format && !options?.name && !options?.description) {
          delete state.cells[id];
        } else {
          state.cells[id] = {
            id,
            value: value ?? '',
            ...(options?.formula && { formula: options.formula }),
            ...(options?.format && { format: options.format }),
            ...(options?.name && { name: options.name }),
            ...(options?.description && { description: options.description }),
          };
        }
        // Re-evaluate other formula cells that may depend on this cell
        reEvaluateFormulas(state.cells, state.headers);
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

    startSelection: (cellId) =>
      set((state) => {
        state.selectionStart = cellId;
        state.selectionEnd = cellId;
        state.isDragging = true;
        state.selectedCell = cellId;
        state.activeZoneId = null;
      }),

    extendSelection: (cellId) =>
      set((state) => {
        if (state.isDragging) {
          state.selectionEnd = cellId;
        }
      }),

    endSelection: () =>
      set((state) => {
        state.isDragging = false;
      }),

    clearSelection: () =>
      set((state) => {
        state.selectionStart = null;
        state.selectionEnd = null;
        state.isDragging = false;
      }),

    addZone: (zone) =>
      set((state) => {
        state.zones.push(zone);
      }),

    updateZone: (zoneId, updates) =>
      set((state) => {
        const zone = state.zones.find((z) => z.id === zoneId);
        if (zone) Object.assign(zone, updates);
      }),

    deleteZone: (zoneId) =>
      set((state) => {
        state.zones = state.zones.filter((z) => z.id !== zoneId);
        if (state.activeZoneId === zoneId) {
          state.activeZoneId = null;
          state.zoneResizing = null;
        }
      }),

    setActiveZone: (zoneId) =>
      set((state) => {
        state.activeZoneId = zoneId;
        if (zoneId) {
          state.selectionStart = null;
          state.selectionEnd = null;
        }
      }),

    startZoneResize: (zoneId, handle) =>
      set((state) => {
        const zone = state.zones.find((z) => z.id === zoneId);
        if (!zone) return;
        state.zoneResizing = {
          zoneId,
          handle,
          originalStart: zone.startCell,
          originalEnd: zone.endCell,
        };
      }),

    updateZoneResize: (cellId) =>
      set((state) => {
        if (!state.zoneResizing) return;
        const zone = state.zones.find((z) => z.id === state.zoneResizing!.zoneId);
        if (!zone) return;

        const { handle, originalStart, originalEnd } = state.zoneResizing;
        const orig = normalizeRange(originalStart, originalEnd);
        const target = cellIdToCoords(cellId);

        let { minRow, maxRow, minCol, maxCol } = orig;

        switch (handle) {
          case 'top-left':
            minRow = Math.min(target.row, maxRow);
            minCol = Math.min(target.col, maxCol);
            break;
          case 'top':
            minRow = Math.min(target.row, maxRow);
            break;
          case 'top-right':
            minRow = Math.min(target.row, maxRow);
            maxCol = Math.max(target.col, minCol);
            break;
          case 'left':
            minCol = Math.min(target.col, maxCol);
            break;
          case 'right':
            maxCol = Math.max(target.col, minCol);
            break;
          case 'bottom-left':
            maxRow = Math.max(target.row, minRow);
            minCol = Math.min(target.col, maxCol);
            break;
          case 'bottom':
            maxRow = Math.max(target.row, minRow);
            break;
          case 'bottom-right':
            maxRow = Math.max(target.row, minRow);
            maxCol = Math.max(target.col, minCol);
            break;
        }

        zone.startCell = coordsToCellId(minRow, minCol);
        zone.endCell = coordsToCellId(maxRow, maxCol);
      }),

    endZoneResize: (finalCellId) =>
      set((state) => {
        if (!state.zoneResizing) return;

        const { originalStart, originalEnd, zoneId, handle } = state.zoneResizing;
        const zone = state.zones.find((z) => z.id === zoneId);

        if (!zone) {
          state.zoneResizing = null;
          return;
        }

        // Apply final position in the SAME transaction (avoid timing issues)
        if (finalCellId) {
          const orig = normalizeRange(originalStart, originalEnd);
          const target = cellIdToCoords(finalCellId);
          let { minRow, maxRow, minCol, maxCol } = orig;

          switch (handle) {
            case 'top-left':     minRow = Math.min(target.row, maxRow); minCol = Math.min(target.col, maxCol); break;
            case 'top':          minRow = Math.min(target.row, maxRow); break;
            case 'top-right':    minRow = Math.min(target.row, maxRow); maxCol = Math.max(target.col, minCol); break;
            case 'left':         minCol = Math.min(target.col, maxCol); break;
            case 'right':        maxCol = Math.max(target.col, minCol); break;
            case 'bottom-left':  maxRow = Math.max(target.row, minRow); minCol = Math.min(target.col, maxCol); break;
            case 'bottom':       maxRow = Math.max(target.row, minRow); break;
            case 'bottom-right': maxRow = Math.max(target.row, minRow); maxCol = Math.max(target.col, minCol); break;
          }

          zone.startCell = coordsToCellId(minRow, minCol);
          zone.endCell = coordsToCellId(maxRow, maxCol);
        }

        const oldB = normalizeRange(originalStart, originalEnd);
        const newB = normalizeRange(zone.startCell, zone.endCell);

        const changed =
          oldB.minRow !== newB.minRow ||
          oldB.maxRow !== newB.maxRow ||
          oldB.minCol !== newB.minCol ||
          oldB.maxCol !== newB.maxCol;

        if (changed) {
          for (const key of Object.keys(state.cells)) {
            const cell = state.cells[key];
            if (!cell.formula) continue;

            const updated = cell.formula.replace(
              /([A-Z])(\d+):([A-Z])(\d+)/g,
              (match, c1Letter: string, r1Str: string, c2Letter: string, r2Str: string) => {
                const r1 = parseInt(r1Str, 10);
                const c1 = c1Letter.charCodeAt(0) - 65;
                const r2 = parseInt(r2Str, 10);
                const c2 = c2Letter.charCodeAt(0) - 65;

                const minR = Math.min(r1, r2);
                const maxR = Math.max(r1, r2);
                const minC = Math.min(c1, c2);
                const maxC = Math.max(c1, c2);

                // Range must be fully within old zone bounds
                if (minR < oldB.minRow || maxR > oldB.maxRow || minC < oldB.minCol || maxC > oldB.maxCol) {
                  return match;
                }

                let newMinR = minR, newMaxR = maxR, newMinC = minC, newMaxC = maxC;

                if (minR === oldB.minRow && maxR === oldB.maxRow) {
                  newMinR = newB.minRow;
                  newMaxR = newB.maxRow;
                }

                if (minC === oldB.minCol && maxC === oldB.maxCol) {
                  newMinC = newB.minCol;
                  newMaxC = newB.maxCol;
                }

                if (newMinR === minR && newMaxR === maxR && newMinC === minC && newMaxC === maxC) {
                  return match;
                }

                const startR = r1 <= r2 ? newMinR : newMaxR;
                const endR = r1 <= r2 ? newMaxR : newMinR;
                const startC = c1 <= c2 ? newMinC : newMaxC;
                const endC = c1 <= c2 ? newMaxC : newMinC;

                return `${String.fromCharCode(65 + startC)}${startR}:${String.fromCharCode(65 + endC)}${endR}`;
              }
            );

            if (updated !== cell.formula) {
              cell.formula = updated;
            }
          }
          // Re-evaluate all formulas so `value` holds the real result
          reEvaluateFormulas(state.cells, state.headers);
        }

        state.zoneResizing = null;
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

        // Update formula references in all cells
        applyFormulaShift(newCells, (f) => updateFormulaRowShift(f, afterRow, true), state.headers);

        state.cells = newCells;
        state.rowCount += 1;
        state.rowHeights.splice(afterRow, 0, DEFAULT_ROW_HEIGHT);

        // Update zone boundaries
        for (const zone of state.zones) {
          const sc = cellIdToCoords(zone.startCell);
          const ec = cellIdToCoords(zone.endCell);
          if (sc.row > afterRow) zone.startCell = coordsToCellId(sc.row + 1, sc.col);
          if (ec.row > afterRow) zone.endCell = coordsToCellId(ec.row + 1, ec.col);
        }

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

        // Update formula references in all cells
        applyFormulaShift(newCells, (f) => updateFormulaRowShift(f, targetRow, false), state.headers);

        state.cells = newCells;
        state.rowCount -= 1;
        state.rowHeights.splice(targetRow - 1, 1);

        // Update zone boundaries (remove zones that collapse)
        state.zones = state.zones.filter((zone) => {
          const sc = cellIdToCoords(zone.startCell);
          const ec = cellIdToCoords(zone.endCell);

          // Single-row zone on the deleted row → remove
          if (sc.row === targetRow && ec.row === targetRow) return false;

          // Shift start (only if strictly after deleted row)
          if (sc.row > targetRow) zone.startCell = coordsToCellId(sc.row - 1, sc.col);
          // Shift end (>= to shrink range when last row is deleted)
          if (ec.row >= targetRow) zone.endCell = coordsToCellId(Math.max(1, ec.row - 1), ec.col);

          // Check zone is still valid
          const newSc = cellIdToCoords(zone.startCell);
          const newEc = cellIdToCoords(zone.endCell);
          return newSc.row <= newEc.row;
        });

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

        // Update formula references in all cells
        applyFormulaShift(newCells, (f) => updateFormulaColShift(f, afterCol, true), state.headers);

        state.cells = newCells;
        state.colCount += 1;

        // Generate unique "nouvelle colonne" name
        const base = 'nouvelle colonne';
        let newName = base;
        let suffix = 1;
        while (state.headers.includes(newName)) {
          newName = `${base} ${suffix}`;
          suffix++;
        }
        state.headers.splice(afterCol + 1, 0, newName);
        state.colWidths.splice(afterCol + 1, 0, DEFAULT_COL_WIDTH);
        state.columnTypes.splice(afterCol + 1, 0, 'none');

        // Update zone boundaries
        for (const zone of state.zones) {
          const sc = cellIdToCoords(zone.startCell);
          const ec = cellIdToCoords(zone.endCell);
          if (sc.col > afterCol) zone.startCell = coordsToCellId(sc.row, sc.col + 1);
          if (ec.col > afterCol) zone.endCell = coordsToCellId(ec.row, ec.col + 1);
        }

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

        // Update formula references in all cells
        applyFormulaShift(newCells, (f) => updateFormulaColShift(f, targetCol, false), state.headers);

        state.cells = newCells;
        state.colCount -= 1;
        state.headers.splice(targetCol, 1);
        state.colWidths.splice(targetCol, 1);
        state.columnTypes.splice(targetCol, 1);

        // Update zone boundaries (remove zones that collapse)
        state.zones = state.zones.filter((zone) => {
          const sc = cellIdToCoords(zone.startCell);
          const ec = cellIdToCoords(zone.endCell);

          if (sc.col === targetCol && ec.col === targetCol) return false;

          if (sc.col > targetCol) zone.startCell = coordsToCellId(sc.row, sc.col - 1);
          if (ec.col >= targetCol) zone.endCell = coordsToCellId(ec.row, Math.max(0, ec.col - 1));

          const newSc = cellIdToCoords(zone.startCell);
          const newEc = cellIdToCoords(zone.endCell);
          return newSc.col <= newEc.col;
        });

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

    setColumnType: (colIndex, type) =>
      set((state) => {
        if (colIndex >= 0 && colIndex < state.columnTypes.length) {
          state.columnTypes[colIndex] = type;
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
        state.columnTypes = data.columnTypes ?? defaultColumnTypes(data.colCount);
        state.zones = data.zones ?? [];
        state.editingCell = null;
        state.selectedCell = null;
        state.selectionStart = null;
        state.selectionEnd = null;
        state.activeZoneId = null;
        state.zoneResizing = null;
        // Evaluate all formulas so `value` holds the real result
        reEvaluateFormulas(state.cells, state.headers);
      }),
  }))
);
