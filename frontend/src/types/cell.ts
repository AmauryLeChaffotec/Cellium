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
}

export type Grid = Record<string, Cell>;
