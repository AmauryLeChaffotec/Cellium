/**
 * CommandStore — Zustand store pour la barre de commande IA
 *
 * Gère l'état de la barre de commande, les requêtes API, et les messages clarification/erreur.
 */

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { CommandRequest, ErrorResponse } from '../types/api';
import { useGridStore } from './gridStore';
import { useDiffStore } from './diffStore';

interface CommandStore {
  isLoading: boolean;
  error: string | null;
  clarification: string | null;
  commandHistory: string[];

  sendCommand: (command: string) => Promise<void>;
  clearError: () => void;
  clearClarification: () => void;
}

export const useCommandStore = create<CommandStore>()(
  immer((set) => ({
    isLoading: false,
    error: null,
    clarification: null,
    commandHistory: [],

    sendCommand: async (command: string) => {
      // Clear previous messages
      set((state) => {
        state.error = null;
        state.clarification = null;
        state.isLoading = true;
      });

      // Build GridMetadata from gridStore
      const { cells, rowCount, colCount } = useGridStore.getState();

      // Extract headers (A-Z based on colCount)
      const headers = Array.from({ length: colCount }, (_, i) =>
        String.fromCharCode(65 + i)
      );

      // Extract column types (simplified: all "text" for now)
      const columnTypes: Record<string, string> = {};
      headers.forEach((h) => {
        columnTypes[h] = 'text';
      });

      // Extract sample rows (max 5)
      const sampleRows: Record<string, any>[] = [];
      for (let row = 1; row <= Math.min(5, rowCount); row++) {
        const rowData: Record<string, any> = {};
        headers.forEach((col) => {
          const cellId = `${col}${row}`;
          if (cells[cellId]) {
            rowData[cellId] = cells[cellId];
          }
        });
        if (Object.keys(rowData).length > 0) {
          sampleRows.push(rowData);
        }
      }

      const requestBody: CommandRequest = {
        command,
        gridContext: {
          headers,
          columnTypes,
          rowCount,
          sampleRows,
        },
      };

      try {
        const response = await fetch('/api/ai/command', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        });

        const data = await response.json();

        if (!response.ok) {
          // HTTP error (400, 503, etc.)
          const errorData = data as ErrorResponse;
          set((state) => {
            state.isLoading = false;
            state.error = `Erreur: ${errorData.error || 'Erreur inconnue'}`;
          });
          return;
        }

        // Check if clarification
        if (data.operations.length === 0 && data.clarification) {
          set((state) => {
            state.isLoading = false;
            state.clarification = data.clarification;
          });
          return;
        }

        // Success: send operations to diffStore
        const diffStore = useDiffStore.getState();
        diffStore.setPendingOperations(data.operations, data.description);

        set((state) => {
          state.isLoading = false;
          state.commandHistory.push(command);
        });
      } catch (error) {
        // Network error
        set((state) => {
          state.isLoading = false;
          state.error = 'Erreur réseau: impossible de contacter le serveur';
        });
      }
    },

    clearError: () =>
      set((state) => {
        state.error = null;
      }),

    clearClarification: () =>
      set((state) => {
        state.clarification = null;
      }),
  }))
);
