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
}

export type Grid = Record<string, Cell>;
