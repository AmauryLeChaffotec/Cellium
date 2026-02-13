import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { Snapshot } from '../types/version';
import { saveSnapshotToDB, loadSnapshotsFromDB } from '../utils/versionPersistence';
import { useGridStore } from './gridStore';
import { saveGridData } from '../utils/persistence';

interface VersionStore {
  snapshots: Snapshot[];
  isLoading: boolean;
  isRestoring: boolean;

  createSnapshot: (name: string) => void;
  loadSnapshots: () => Promise<void>;
  restoreFromSnapshot: (snapshotId: string) => void;
}

export const useVersionStore = create<VersionStore>()(
  immer((set, get) => ({
    snapshots: [],
    isLoading: false,
    isRestoring: false,

    createSnapshot: (name) => {
      const { cells, rowCount, colCount, headers } = useGridStore.getState();

      const snapshot: Snapshot = {
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        name,
        gridData: { cells, rowCount, colCount, headers },
      };

      set((state) => {
        state.snapshots.push(snapshot);
      });

      // Persist to backend (fire-and-forget)
      saveSnapshotToDB(snapshot).catch((error) => {
        console.error('Failed to save snapshot:', error);
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
        // Load the saved grid state directly
        useGridStore.getState().loadGrid(target.gridData);

        // Save to file immediately
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
  }))
);
