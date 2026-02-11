import type { Cell, CellFormat } from './cell';

export type Operation =
  | { type: 'SET_VALUE'; cellId: string; value: string | number }
  | { type: 'SET_FORMULA'; cellId: string; formula: string }
  | { type: 'INSERT_ROW'; afterRow: number; cells: Cell[] }
  | { type: 'INSERT_COLUMN'; afterCol: string; header: string; cells: Cell[] }
  | { type: 'DELETE_ROW'; row: number }
  | { type: 'DELETE_COLUMN'; col: string }
  | { type: 'SORT'; column: string; direction: 'asc' | 'desc' }
  | { type: 'FORMAT'; cellIds: string[]; format: CellFormat };
