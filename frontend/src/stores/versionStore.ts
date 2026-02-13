import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { Snapshot } from '../types/version';
import { saveSnapshotToDB, loadSnapshotsFromDB, deleteSnapshotFromDB } from '../utils/versionPersistence';
import { useGridStore } from './gridStore';
import { saveGridData } from '../utils/persistence';
import { exportCelliumFile, parseCelliumFile, readFileAsText } from '../utils/celliumFile';

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

      const snapshot: Snapshot = {
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        name,
        author,
        gridData: { cells, rowCount, colCount, headers, colWidths, rowHeights, zones },
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
        set((state) => {
          state.snapshots = snapshots;
          state.isLoading = false;
        });
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

        saveGridData(target.gridData).catch((error) => {
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
      exportCelliumFile({ cells, rowCount, colCount, headers, colWidths, rowHeights, zones }, snapshots);
    },

    importFile: async (file) => {
      try {
        const content = await readFileAsText(file);
        const celliumData = parseCelliumFile(content);

        // Load grid
        useGridStore.getState().loadGrid(celliumData.grid);
        await saveGridData(celliumData.grid);

        // Load snapshots
        set((state) => {
          state.snapshots = celliumData.snapshots;
        });

        // Persist each imported snapshot
        for (const snapshot of celliumData.snapshots) {
          await saveSnapshotToDB(snapshot);
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Erreur inconnue';
        alert(message);
      }
    },
  }))
);
