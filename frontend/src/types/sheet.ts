import type { Grid, ColumnType, RowStyle } from './cell';
import type { Zone } from './zone';
import type { Chart } from './chart';

export interface SheetGrid {
  cells: Grid;
  rowCount: number;
  colCount: number;
  headers: string[];
  colWidths: number[];
  rowHeights: number[];
  columnTypes: ColumnType[];
  rowStyles: (RowStyle | null)[];
  zones: Zone[];
  charts: Chart[];
}

export interface Sheet {
  name: string;
  grid: SheetGrid;
}
