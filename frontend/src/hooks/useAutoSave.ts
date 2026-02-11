import { useEffect, useRef } from 'react';
import { useGridStore } from '../stores/gridStore';
import { saveGridData, loadGridData } from '../utils/persistence';

const SAVE_INTERVAL_MS = 30_000;

export function useAutoSave() {
  const loadGrid = useGridStore((s) => s.loadGrid);
  const initializeGrid = useGridStore((s) => s.initializeGrid);
  const dirtyRef = useRef(false);

  // Load from IndexedDB on mount
  useEffect(() => {
    loadGridData().then((data) => {
      if (data) {
        loadGrid(data);
      } else {
        initializeGrid(1000, 26);
      }
    });
  }, [loadGrid, initializeGrid]);

  // Subscribe to changes + auto-save every 30s
  useEffect(() => {
    const unsubscribe = useGridStore.subscribe(() => {
      dirtyRef.current = true;
    });

    const intervalId = setInterval(() => {
      if (dirtyRef.current) {
        const { cells, rowCount, colCount } = useGridStore.getState();
        saveGridData({ cells, rowCount, colCount });
        dirtyRef.current = false;
      }
    }, SAVE_INTERVAL_MS);

    return () => {
      unsubscribe();
      clearInterval(intervalId);
    };
  }, []);
}
