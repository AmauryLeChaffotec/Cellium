import { cellIdToCoords, coordsToCellId } from './cellUtils';

/**
 * Normalise un rectangle de sélection pour que start soit le coin supérieur-gauche
 * et end le coin inférieur-droit.
 */
export function normalizeRange(startCell: string, endCell: string) {
  const s = cellIdToCoords(startCell);
  const e = cellIdToCoords(endCell);
  return {
    minRow: Math.min(s.row, e.row),
    maxRow: Math.max(s.row, e.row),
    minCol: Math.min(s.col, e.col),
    maxCol: Math.max(s.col, e.col),
  };
}

/**
 * Vérifie si un cellId est dans un rectangle défini par startCell → endCell.
 */
export function isCellInRange(cellId: string, startCell: string, endCell: string): boolean {
  const { row, col } = cellIdToCoords(cellId);
  const { minRow, maxRow, minCol, maxCol } = normalizeRange(startCell, endCell);
  return row >= minRow && row <= maxRow && col >= minCol && col <= maxCol;
}

/**
 * Retourne toutes les cellules IDs dans le rectangle startCell → endCell.
 */
export function getCellsInRange(startCell: string, endCell: string): string[] {
  const { minRow, maxRow, minCol, maxCol } = normalizeRange(startCell, endCell);
  const cells: string[] = [];
  for (let r = minRow; r <= maxRow; r++) {
    for (let c = minCol; c <= maxCol; c++) {
      cells.push(coordsToCellId(r, c));
    }
  }
  return cells;
}

/**
 * Retourne la notation range normalisée (ex: "B2:B10").
 */
export function rangeToString(startCell: string, endCell: string): string {
  const { minRow, maxRow, minCol, maxCol } = normalizeRange(startCell, endCell);
  return `${coordsToCellId(minRow, minCol)}:${coordsToCellId(maxRow, maxCol)}`;
}

/**
 * Retourne les lignes min/max d'un rectangle de sélection.
 */
export function getSelectionRows(startCell: string, endCell: string): { minRow: number; maxRow: number } {
  const { minRow, maxRow } = normalizeRange(startCell, endCell);
  return { minRow, maxRow };
}
