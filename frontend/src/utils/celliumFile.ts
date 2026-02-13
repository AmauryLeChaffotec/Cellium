import type { GridPersistData } from './persistence';
import type { Snapshot } from '../types/version';

const FORMAT_ID = 'cellium';
const FORMAT_VERSION = 1;

export interface CelliumFile {
  format: string;
  version: number;
  exportDate: string;
  grid: GridPersistData;
  snapshots: Snapshot[];
}

export function exportCelliumFile(grid: GridPersistData, snapshots: Snapshot[]): void {
  const data: CelliumFile = {
    format: FORMAT_ID,
    version: FORMAT_VERSION,
    exportDate: new Date().toISOString(),
    grid,
    snapshots,
  };

  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = `spreadsheet-${new Date().toISOString().slice(0, 10)}.cellium`;
  a.click();
  URL.revokeObjectURL(url);
}

export function parseCelliumFile(content: string): CelliumFile {
  const data = JSON.parse(content);

  if (data.format !== FORMAT_ID) {
    throw new Error('Ce fichier n\'est pas un fichier Cellium valide.');
  }

  if (!data.grid || typeof data.grid.rowCount !== 'number' || typeof data.grid.colCount !== 'number') {
    throw new Error('Le fichier Cellium est corrompu : données de grille manquantes.');
  }

  return data as CelliumFile;
}

export function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Erreur de lecture du fichier.'));
    reader.readAsText(file);
  });
}
