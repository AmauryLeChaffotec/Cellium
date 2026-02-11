import { describe, it, expect } from 'vitest';
import type { Cell, CellFormat, Grid } from './cell';

describe('Cell types', () => {
  it('should create a valid Cell object', () => {
    const cell: Cell = {
      id: 'A1',
      value: 42,
    };
    expect(cell.id).toBe('A1');
    expect(cell.value).toBe(42);
    expect(cell.formula).toBeUndefined();
    expect(cell.format).toBeUndefined();
  });

  it('should create a Cell with all optional fields', () => {
    const format: CellFormat = {
      bold: true,
      currency: 'EUR',
      decimals: 2,
    };
    const cell: Cell = {
      id: 'B3',
      value: 100.5,
      formula: '=SUM(A1:A10)',
      format,
    };
    expect(cell.formula).toBe('=SUM(A1:A10)');
    expect(cell.format?.bold).toBe(true);
    expect(cell.format?.currency).toBe('EUR');
  });

  it('should create a Grid as Record<string, Cell>', () => {
    const grid: Grid = {
      A1: { id: 'A1', value: 'Hello' },
      A2: { id: 'A2', value: 42 },
      B1: { id: 'B1', value: null },
    };
    expect(Object.keys(grid)).toHaveLength(3);
    expect(grid['A1'].value).toBe('Hello');
    expect(grid['B1'].value).toBeNull();
  });
});
