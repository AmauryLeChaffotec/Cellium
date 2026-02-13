import type { Snapshot } from '../types/version';
import { apiFetch } from './api';

export async function saveSnapshotToDB(snapshot: Snapshot): Promise<void> {
  await apiFetch('/api/data', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ snapshot }),
  });
}

export async function deleteSnapshotFromDB(snapshotId: string): Promise<void> {
  await apiFetch(`/api/data/snapshot/${snapshotId}`, { method: 'DELETE' });
}

export async function loadSnapshotsFromDB(): Promise<Snapshot[]> {
  try {
    const res = await apiFetch('/api/data');
    if (!res.ok) return [];
    const data = await res.json();
    const snapshots: Snapshot[] = data.snapshots ?? [];

    // Sort by timestamp ascending (oldest first)
    return snapshots.sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
  } catch {
    return [];
  }
}
