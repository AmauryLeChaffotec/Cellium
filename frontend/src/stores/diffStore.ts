/**
 * DiffStore (Enhanced in Story 2.5, Story 3.1)
 *
 * Manages pending AI operations, visual diff preview, and validation/rejection actions.
 * Automatically creates version snapshots on successful validation (Story 3.1).
 */

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { Operation } from '../types/operations';
import type { DiffResult } from '../types/diff';
import { applyOperations } from '../utils/operationsEngine';
import { calculateDiff } from '../utils/diffCalculator';
import { useGridStore } from './gridStore';
import { useVersionStore } from './versionStore';

interface DiffStore {
  pendingOperations: Operation[];
  description: string | null;
  diffPreview: DiffResult | null;
  isApplying: boolean;
  applyError: string | null;

  setPendingOperations: (operations: Operation[], description: string) => void;
  applyPendingOperations: () => void;
  rejectPendingOperations: () => void;
  clearPending: () => void;
  clearApplyError: () => void;
}

export const useDiffStore = create<DiffStore>()(
  immer((set, get) => ({
    pendingOperations: [],
    description: null,
    diffPreview: null,
    isApplying: false,
    applyError: null,

    setPendingOperations: (operations, description) =>
      set((state) => {
        state.pendingOperations = operations;
        state.description = description;

        // Calculate diff preview
        const currentGrid = useGridStore.getState().cells;
        state.diffPreview = calculateDiff(operations, currentGrid);
      }),

    applyPendingOperations: () => {
      const { pendingOperations, description } = get();
      if (pendingOperations.length === 0) return;

      set((state) => {
        state.isApplying = true;
        state.applyError = null;
      });

      try {
        // Apply all operations to gridStore
        applyOperations(pendingOperations);

        // ✅ CREATE SNAPSHOT AFTER SUCCESSFUL APPLICATION (Story 3.1)
        if (description) {
          useVersionStore.getState().createSnapshot(pendingOperations, description);
        }

        // Clear pending and preview after successful application
        set((state) => {
          state.pendingOperations = [];
          state.description = null;
          state.diffPreview = null;
          state.isApplying = false;
        });
      } catch (error) {
        // Store error for display
        set((state) => {
          state.isApplying = false;
          state.applyError =
            error instanceof Error
              ? error.message
              : "Erreur lors de l'application des changements";
        });
      }
    },

    rejectPendingOperations: () => {
      get().clearPending();
    },

    clearPending: () =>
      set((state) => {
        state.pendingOperations = [];
        state.description = null;
        state.diffPreview = null;
        state.isApplying = false;
        state.applyError = null;
      }),

    clearApplyError: () =>
      set((state) => {
        state.applyError = null;
      }),
  }))
);
