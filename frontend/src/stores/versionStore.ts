import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { Snapshot } from '../types/version';
import type { Grid } from '../types/cell';
import { saveSnapshotToDB, saveAllSnapshotsToDB, loadSnapshotsFromDB, deleteSnapshotFromDB } from '../utils/versionPersistence';
import { useGridStore } from './gridStore';
import { saveGridData } from '../utils/persistence';
import { exportCelliumFile, parseCelliumFile, readFileAsText } from '../utils/celliumFile';
import { evaluateFormula } from '../utils/formulaEvaluator';
import { generateUUID } from '../utils/uuid';

/** Re-evaluate every formula cell in a grid so `value` holds the computed result. */
function evaluateGridFormulas(cells: Grid, headers?: string[]): void {
  for (const cell of Object.values(cells)) {
    if (cell.formula) {
      cell.value = evaluateFormula(cell.formula, cells, headers);
    }
  }
}

interface VersionStore {
  snapshots: Snapshot[];
  isLoading: boolean;
  isRestoring: boolean;

  createSnapshot: (name: string, author: string) => void;
  deleteSnapshot: (snapshotId: string) => void;
  loadSnapshots: () => Promise<void>;
  restoreFromSnapshot: (snapshotId: string) => void;
  exportFile: () => void;
  importFile: (file: File) => Promise<void>;
}

export const useVersionStore = create<VersionStore>()(
  immer((set, get) => ({
    snapshots: [],
    isLoading: false,
    isRestoring: false,

    createSnapshot: (name, author) => {
      const { cells, rowCount, colCount, headers, colWidths, rowHeights, zones } = useGridStore.getState();

      // Ensure formula cells have their evaluated value in the snapshot
      const cellsCopy: Grid = {};
      for (const [id, cell] of Object.entries(cells)) {
        if (cell.formula) {
          cellsCopy[id] = { ...cell, value: evaluateFormula(cell.formula, cells, headers) };
        } else {
          cellsCopy[id] = cell;
        }
      }

      const snapshot: Snapshot = {
        id: generateUUID(),
        timestamp: new Date().toISOString(),
        name,
        author,
        gridData: { cells: cellsCopy, rowCount, colCount, headers, colWidths, rowHeights, zones },
      };

      set((state) => {
        state.snapshots.push(snapshot);
      });

      // Persist to backend (fire-and-forget)
      saveSnapshotToDB(snapshot).catch((error) => {
        console.error('Failed to save snapshot:', error);
      });
    },

    deleteSnapshot: (snapshotId) => {
      set((state) => {
        state.snapshots = state.snapshots.filter((s) => s.id !== snapshotId);
      });

      deleteSnapshotFromDB(snapshotId).catch((error) => {
        console.error('Failed to delete snapshot:', error);
      });
    },

    loadSnapshots: async () => {
      set((state) => {
        state.isLoading = true;
      });

      try {
        const snapshots = await loadSnapshotsFromDB();

        // Re-evaluate formulas in all loaded snapshots (fixes old snapshots
        // that stored the formula string instead of the computed value)
        let needsResave = false;
        for (const snap of snapshots) {
          if (snap.gridData?.cells) {
            for (const cell of Object.values(snap.gridData.cells)) {
              if (cell.formula && typeof cell.value === 'string' && cell.value.startsWith('=')) {
                needsResave = true;
                break;
              }
            }
            evaluateGridFormulas(snap.gridData.cells, snap.gridData.headers);
          }
        }

        set((state) => {
          state.snapshots = snapshots;
          state.isLoading = false;
        });

        // Re-save all corrected snapshots to backend (fire-and-forget)
        if (needsResave) {
          saveAllSnapshotsToDB(snapshots).catch(() => {});
        }
      } catch (error) {
        console.error('Failed to load snapshots:', error);
        set((state) => {
          state.isLoading = false;
        });
      }
    },

    restoreFromSnapshot: (snapshotId) => {
      const { snapshots } = get();
      const target = snapshots.find((s) => s.id === snapshotId);

      if (!target) {
        console.error('Snapshot not found:', snapshotId);
        return;
      }

      set((state) => {
        state.isRestoring = true;
      });

      try {
        useGridStore.getState().loadGrid(target.gridData);

        // Save with evaluated formula values
        const { cells, rowCount, colCount, headers, colWidths, rowHeights, zones } = useGridStore.getState();
        const cellsCopy: Grid = {};
        for (const [id, cell] of Object.entries(cells)) {
          if (cell.formula) {
            cellsCopy[id] = { ...cell, value: evaluateFormula(cell.formula, cells, headers) };
          } else {
            cellsCopy[id] = cell;
          }
        }
        saveGridData({ cells: cellsCopy, rowCount, colCount, headers, colWidths, rowHeights, zones }).catch((error) => {
          console.error('Failed to save restored data:', error);
        });

        set((state) => {
          state.isRestoring = false;
        });
      } catch (error) {
        console.error('Failed to restore snapshot:', error);
        set((state) => {
          state.isRestoring = false;
        });
      }
    },

    exportFile: () => {
      const { cells, rowCount, colCount, headers, colWidths, rowHeights, zones } = useGridStore.getState();
      const { snapshots } = get();
      // Ensure formula cells have evaluated values in the export
      const cellsCopy: Grid = {};
      for (const [id, cell] of Object.entries(cells)) {
        if (cell.formula) {
          cellsCopy[id] = { ...cell, value: evaluateFormula(cell.formula, cells, headers) };
        } else {
          cellsCopy[id] = cell;
        }
      }
      exportCelliumFile({ cells: cellsCopy, rowCount, colCount, headers, colWidths, rowHeights, zones }, snapshots);
    },

    importFile: async (file) => {
      try {
        const content = await readFileAsText(file);
        const celliumData = parseCelliumFile(content);

        // Load grid (loadGrid evaluates formulas in memory)
        useGridStore.getState().loadGrid(celliumData.grid);

        // Save with evaluated formula values
        const { cells, rowCount, colCount, headers, colWidths, rowHeights, zones } = useGridStore.getState();
        const cellsCopy: Grid = {};
        for (const [id, cell] of Object.entries(cells)) {
          if (cell.formula) {
            cellsCopy[id] = { ...cell, value: evaluateFormula(cell.formula, cells, headers) };
          } else {
            cellsCopy[id] = cell;
          }
        }
        await saveGridData({ cells: cellsCopy, rowCount, colCount, headers, colWidths, rowHeights, zones });

        // Evaluate formulas in imported snapshots
        for (const snap of celliumData.snapshots) {
          if (snap.gridData?.cells) {
            evaluateGridFormulas(snap.gridData.cells, snap.gridData.headers);
          }
        }

        // Load snapshots
        set((state) => {
          state.snapshots = celliumData.snapshots;
        });

        // Persist all corrected snapshots
        await saveAllSnapshotsToDB(celliumData.snapshots);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Erreur inconnue';
        alert(message);
      }
    },
  }))
);
