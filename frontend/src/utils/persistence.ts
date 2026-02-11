import { openDB } from 'idb';
import type { DBSchema, IDBPDatabase } from 'idb';
import type { Grid } from '../types/cell';

export interface GridPersistData {
  cells: Grid;
  rowCount: number;
  colCount: number;
}

interface CelliumDB extends DBSchema {
  gridData: {
    key: string;
    value: GridPersistData;
  };
}

let dbPromise: Promise<IDBPDatabase<CelliumDB>> | null = null;

export function getDB(): Promise<IDBPDatabase<CelliumDB>> {
  if (!dbPromise) {
    dbPromise = openDB<CelliumDB>('cellium', 1, {
      upgrade(db) {
        db.createObjectStore('gridData');
      },
    });
  }
  return dbPromise;
}

export async function saveGridData(data: GridPersistData): Promise<void> {
  const db = await getDB();
  await db.put('gridData', data, 'current');
}

export async function loadGridData(): Promise<GridPersistData | null> {
  const db = await getDB();
  const data = await db.get('gridData', 'current');
  return data ?? null;
}
