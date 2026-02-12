import { openDB } from 'idb';
import type { DBSchema, IDBPDatabase } from 'idb';
import type { Snapshot } from '../types/version';

interface CelliumDB extends DBSchema {
  gridData: {
    key: string;
    value: any;
  };
  versionHistory: {
    key: string; // snapshot.id
    value: Snapshot;
    indexes: { 'by-timestamp': string };
  };
}

let dbInstance: IDBPDatabase<CelliumDB> | null = null;

async function getDB(): Promise<IDBPDatabase<CelliumDB>> {
  if (dbInstance) return dbInstance;

  dbInstance = await openDB<CelliumDB>('cellium-db', 1, {
    upgrade(db) {
      // Create gridData store (already exists from Story 1.6)
      if (!db.objectStoreNames.contains('gridData')) {
        db.createObjectStore('gridData');
      }

      // Create versionHistory store
      if (!db.objectStoreNames.contains('versionHistory')) {
        const store = db.createObjectStore('versionHistory', { keyPath: 'id' });
        store.createIndex('by-timestamp', 'timestamp');
      }
    },
  });

  return dbInstance;
}

export async function saveSnapshotToDB(snapshot: Snapshot): Promise<void> {
  const db = await getDB();
  await db.put('versionHistory', snapshot);
}

export async function loadSnapshotsFromDB(): Promise<Snapshot[]> {
  const db = await getDB();
  const snapshots = await db.getAll('versionHistory');

  // Sort by timestamp ascending (oldest first)
  return snapshots.sort((a, b) =>
    new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );
}

export async function clearSnapshotsFromDB(): Promise<void> {
  const db = await getDB();
  await db.clear('versionHistory');
}
