import type { CellFormat } from './cell';

/**
 * Represents a single cell change in a diff preview
 */
export interface CellDiff {
  cellId: string;
  before: string | number | null;
  after: string | number | null;
  formatBefore?: CellFormat;
  formatAfter?: CellFormat;
}

/**
 * Result of diff calculation, categorizing all changes
 */
export interface DiffResult {
  additions: Map<string, CellDiff>;      // cellId → diff (nouvelle cellule)
  modifications: Map<string, CellDiff>;  // cellId → diff (cellule modifiée)
  deletions: Map<string, CellDiff>;      // cellId → diff (cellule supprimée)
}
