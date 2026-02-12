import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { Snapshot } from '../types/version';
import type { Operation } from '../types/operations';
import { saveSnapshotToDB, loadSnapshotsFromDB } from '../utils/versionPersistence';
import { applyOperations } from '../utils/operationsEngine';
import { useGridStore } from './gridStore';

interface VersionStore {
  snapshots: Snapshot[];
  isLoading: boolean;
  isRestoring: boolean;

  createSnapshot: (operations: Operation[], description: string) => void;
  loadSnapshots: () => Promise<void>;
  clearSnapshots: () => void;
  restoreFromSnapshot: (snapshotId: string) => void;
}

export const useVersionStore = create<VersionStore>()(
  immer((set, get) => ({
    snapshots: [],
    isLoading: false,
    isRestoring: false,

    createSnapshot: (operations, description) => {
      const snapshot: Snapshot = {
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        description,
        operations,
      };

      set((state) => {
        state.snapshots.push(snapshot);
      });

      // Persist to IndexedDB (fire-and-forget)
      saveSnapshotToDB(snapshot).catch((error) => {
        console.error('Failed to save snapshot to IndexedDB:', error);
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
        console.error('Failed to load snapshots from IndexedDB:', error);
        set((state) => {
          state.isLoading = false;
        });
      }
    },

    clearSnapshots: () =>
      set((state) => {
        state.snapshots = [];
      }),

    restoreFromSnapshot: (snapshotId) => {
      const { snapshots } = get();
      const targetIndex = snapshots.findIndex((s) => s.id === snapshotId);

      if (targetIndex === -1) {
        console.error('Snapshot not found:', snapshotId);
        return;
      }

      set((state) => {
        state.isRestoring = true;
      });

      try {
        // Clear the grid
        useGridStore.setState({
          cells: {},
          rowCount: 100,
          colCount: 26,
          editingCell: null,
          selectedCell: null,
        });

        // Replay all operations from snapshot 0 to target snapshot
        for (let i = 0; i <= targetIndex; i++) {
          applyOperations(snapshots[i].operations);
        }

        // Create a NEW snapshot for the restoration
        const targetSnapshot = snapshots[targetIndex];
        const restoreDescription = `Restauration: ${targetSnapshot.description}`;

        // Store the operations from the target snapshot as the restoration snapshot
        get().createSnapshot(targetSnapshot.operations, restoreDescription);

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
