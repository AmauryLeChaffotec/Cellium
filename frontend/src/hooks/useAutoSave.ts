import { useEffect, useRef } from 'react';
import { useGridStore } from '../stores/gridStore';
import { saveGridData, loadGridData, getLastModified } from '../utils/persistence';

const SAVE_INTERVAL_MS = 5_000;
const POLL_INTERVAL_MS = 2_000;

export function useAutoSave() {
  const loadGrid = useGridStore((s) => s.loadGrid);
  const initializeGrid = useGridStore((s) => s.initializeGrid);
  const dirtyRef = useRef(false);
  const lastModRef = useRef(0);
  const savingRef = useRef(false);

  // Load from backend on mount
  useEffect(() => {
    loadGridData().then((data) => {
      if (data) {
        loadGrid(data);
      } else {
        initializeGrid(100, 26);
      }
    });
    // Store initial lastmod
    getLastModified().then((t) => {
      lastModRef.current = t;
    });
  }, [loadGrid, initializeGrid]);

  // Subscribe to changes + auto-save every 5s
  useEffect(() => {
    const unsubscribe = useGridStore.subscribe(() => {
      dirtyRef.current = true;
    });

    const saveInterval = setInterval(async () => {
      if (dirtyRef.current && !savingRef.current) {
        savingRef.current = true;
        const { cells, rowCount, colCount, headers, colWidths, rowHeights } = useGridStore.getState();
        await saveGridData({ cells, rowCount, colCount, headers, colWidths, rowHeights });
        dirtyRef.current = false;
        // Update lastmod after our own save so polling doesn't trigger a reload
        const t = await getLastModified();
        lastModRef.current = t;
        savingRef.current = false;
      }
    }, SAVE_INTERVAL_MS);

    return () => {
      unsubscribe();
      clearInterval(saveInterval);
    };
  }, []);

  // Poll for external changes (agent terminal modifying the file)
  useEffect(() => {
    const pollInterval = setInterval(async () => {
      if (savingRef.current) return; // Don't poll while saving
      const t = await getLastModified();
      if (t > lastModRef.current) {
        lastModRef.current = t;
        const data = await loadGridData();
        if (data) {
          loadGrid(data);
          dirtyRef.current = false;
        }
      }
    }, POLL_INTERVAL_MS);

    return () => clearInterval(pollInterval);
  }, [loadGrid]);
}
