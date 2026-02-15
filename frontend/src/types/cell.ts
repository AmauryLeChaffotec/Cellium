export type ColumnType = 'none' | 'text' | 'number' | 'currency' | 'percentage' | 'date' | 'boolean';

export interface CellFormat {
  bold?: boolean;
  currency?: string;
  decimals?: number;
}

export interface Cell {
  id: string;
  value: string | number | null;
  formula?: string;
  format?: CellFormat;
  name?: string;
  description?: string;
}

export type Grid = Record<string, Cell>;

export interface RowStyle {
  type?: 'header' | 'separator';
  backgroundColor?: string;
}
