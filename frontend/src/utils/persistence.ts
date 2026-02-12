import type { Grid } from '../types/cell';

export interface GridPersistData {
  cells: Grid;
  rowCount: number;
  colCount: number;
}

export async function saveGridData(data: GridPersistData): Promise<void> {
  await fetch('/api/data', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ grid: data }),
  });
}

export async function loadGridData(): Promise<GridPersistData | null> {
  try {
    const res = await fetch('/api/data');
    if (!res.ok) return null;
    const data = await res.json();
    return data.grid ?? null;
  } catch {
    return null;
  }
}

export async function getLastModified(): Promise<number> {
  try {
    const res = await fetch('/api/data/lastmod');
    if (!res.ok) return 0;
    const data = await res.json();
    return data.lastmod ?? 0;
  } catch {
    return 0;
  }
}
