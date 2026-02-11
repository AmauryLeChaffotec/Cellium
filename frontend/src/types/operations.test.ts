import { describe, it, expect } from 'vitest';
import type { Operation } from './operations';

describe('Operation types', () => {
  it('should create SET_VALUE operation', () => {
    const op: Operation = { type: 'SET_VALUE', cellId: 'A1', value: 42 };
    expect(op.type).toBe('SET_VALUE');
  });

  it('should create SET_FORMULA operation', () => {
    const op: Operation = { type: 'SET_FORMULA', cellId: 'A1', formula: '=SUM(B1:B10)' };
    expect(op.type).toBe('SET_FORMULA');
  });

  it('should create INSERT_ROW operation', () => {
    const op: Operation = {
      type: 'INSERT_ROW',
      afterRow: 5,
      cells: [{ id: 'A6', value: 'New' }],
    };
    expect(op.type).toBe('INSERT_ROW');
  });

  it('should create INSERT_COLUMN operation', () => {
    const op: Operation = {
      type: 'INSERT_COLUMN',
      afterCol: 'B',
      header: 'Total',
      cells: [{ id: 'C1', value: 100 }],
    };
    expect(op.type).toBe('INSERT_COLUMN');
  });

  it('should create DELETE_ROW operation', () => {
    const op: Operation = { type: 'DELETE_ROW', row: 3 };
    expect(op.type).toBe('DELETE_ROW');
  });

  it('should create DELETE_COLUMN operation', () => {
    const op: Operation = { type: 'DELETE_COLUMN', col: 'C' };
    expect(op.type).toBe('DELETE_COLUMN');
  });

  it('should create SORT operation', () => {
    const op: Operation = { type: 'SORT', column: 'A', direction: 'asc' };
    expect(op.type).toBe('SORT');
  });

  it('should create FORMAT operation', () => {
    const op: Operation = {
      type: 'FORMAT',
      cellIds: ['A1', 'A2'],
      format: { bold: true, currency: 'EUR' },
    };
    expect(op.type).toBe('FORMAT');
  });
});
