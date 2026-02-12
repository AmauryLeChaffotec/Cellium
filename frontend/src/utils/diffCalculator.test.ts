import { describe, it, expect } from 'vitest';
import { calculateDiff } from './diffCalculator';
import type { Operation } from '../types/operations';
import type { Grid } from '../types/cell';

describe('diffCalculator', () => {
  describe('SET_VALUE', () => {
    it('should detect addition when setting value in empty cell', () => {
      const ops: Operation[] = [{ type: 'SET_VALUE', cellId: 'A1', value: 42 }];
      const grid: Grid = {};

      const diff = calculateDiff(ops, grid);

      expect(diff.additions.has('A1')).toBe(true);
      expect(diff.additions.get('A1')?.before).toBeNull();
      expect(diff.additions.get('A1')?.after).toBe(42);
      expect(diff.modifications.size).toBe(0);
      expect(diff.deletions.size).toBe(0);
    });

    it('should detect modification when setting value in existing cell', () => {
      const ops: Operation[] = [{ type: 'SET_VALUE', cellId: 'A1', value: 100 }];
      const grid: Grid = { A1: { id: 'A1', value: 50 } };

      const diff = calculateDiff(ops, grid);

      expect(diff.modifications.has('A1')).toBe(true);
      expect(diff.modifications.get('A1')?.before).toBe(50);
      expect(diff.modifications.get('A1')?.after).toBe(100);
      expect(diff.additions.size).toBe(0);
      expect(diff.deletions.size).toBe(0);
    });

    it('should detect deletion when setting null value', () => {
      const ops: Operation[] = [{ type: 'SET_VALUE', cellId: 'A1', value: null }];
      const grid: Grid = { A1: { id: 'A1', value: 'Delete me' } };

      const diff = calculateDiff(ops, grid);

      expect(diff.deletions.has('A1')).toBe(true);
      expect(diff.deletions.get('A1')?.before).toBe('Delete me');
      expect(diff.deletions.get('A1')?.after).toBeNull();
      expect(diff.additions.size).toBe(0);
      expect(diff.modifications.size).toBe(0);
    });

    it('should detect deletion when setting empty string value', () => {
      const ops: Operation[] = [{ type: 'SET_VALUE', cellId: 'B2', value: '' }];
      const grid: Grid = { B2: { id: 'B2', value: 'Remove' } };

      const diff = calculateDiff(ops, grid);

      expect(diff.deletions.has('B2')).toBe(true);
      expect(diff.deletions.get('B2')?.before).toBe('Remove');
    });
  });

  describe('SET_FORMULA', () => {
    it('should mark formula as addition for new cell', () => {
      const ops: Operation[] = [{ type: 'SET_FORMULA', cellId: 'C3', formula: '=A1+B2' }];
      const grid: Grid = {};

      const diff = calculateDiff(ops, grid);

      expect(diff.additions.has('C3')).toBe(true);
      expect(diff.additions.get('C3')?.after).toBe('=A1+B2');
    });

    it('should mark formula as modification for existing cell', () => {
      const ops: Operation[] = [{ type: 'SET_FORMULA', cellId: 'C3', formula: '=SUM(A1:B2)' }];
      const grid: Grid = { C3: { id: 'C3', value: '=A1+B2' } };

      const diff = calculateDiff(ops, grid);

      expect(diff.modifications.has('C3')).toBe(true);
      expect(diff.modifications.get('C3')?.before).toBe('=A1+B2');
      expect(diff.modifications.get('C3')?.after).toBe('=SUM(A1:B2)');
    });
  });

  describe('INSERT_ROW', () => {
    it('should mark all new row cells as additions', () => {
      const ops: Operation[] = [
        {
          type: 'INSERT_ROW',
          afterRow: 1,
          cells: [
            { id: 'A2', value: 'New1' },
            { id: 'B2', value: 'New2' },
          ],
        },
      ];
      const grid: Grid = {};

      const diff = calculateDiff(ops, grid);

      expect(diff.additions.has('A2')).toBe(true);
      expect(diff.additions.has('B2')).toBe(true);
      expect(diff.additions.get('A2')?.after).toBe('New1');
      expect(diff.additions.get('B2')?.after).toBe('New2');
    });

    it('should mark formatted new row cells as additions with format', () => {
      const ops: Operation[] = [
        {
          type: 'INSERT_ROW',
          afterRow: 1,
          cells: [{ id: 'A2', value: 100, format: { bold: true } }],
        },
      ];
      const grid: Grid = {};

      const diff = calculateDiff(ops, grid);

      expect(diff.additions.has('A2')).toBe(true);
      expect(diff.additions.get('A2')?.formatAfter?.bold).toBe(true);
    });
  });

  describe('INSERT_COLUMN', () => {
    it('should mark all new column cells as additions', () => {
      const ops: Operation[] = [
        {
          type: 'INSERT_COLUMN',
          afterCol: 'A',
          header: 'NewCol',
          cells: [
            { id: 'B1', value: 'ColCell1' },
            { id: 'B2', value: 'ColCell2' },
          ],
        },
      ];
      const grid: Grid = {};

      const diff = calculateDiff(ops, grid);

      expect(diff.additions.has('B1')).toBe(true);
      expect(diff.additions.has('B2')).toBe(true);
    });
  });

  describe('DELETE_ROW', () => {
    it('should mark all deleted row cells as deletions', () => {
      const ops: Operation[] = [{ type: 'DELETE_ROW', row: 2 }];
      const grid: Grid = {
        A2: { id: 'A2', value: 'Del1' },
        B2: { id: 'B2', value: 'Del2' },
        A3: { id: 'A3', value: 'Keep' },
      };

      const diff = calculateDiff(ops, grid);

      expect(diff.deletions.has('A2')).toBe(true);
      expect(diff.deletions.has('B2')).toBe(true);
      expect(diff.deletions.has('A3')).toBe(false);
      expect(diff.deletions.get('A2')?.before).toBe('Del1');
    });
  });

  describe('DELETE_COLUMN', () => {
    it('should mark all deleted column cells as deletions', () => {
      const ops: Operation[] = [{ type: 'DELETE_COLUMN', col: 'B' }];
      const grid: Grid = {
        A1: { id: 'A1', value: 'KeepA' },
        B1: { id: 'B1', value: 'DelB1' },
        B2: { id: 'B2', value: 'DelB2' },
        C1: { id: 'C1', value: 'KeepC' },
      };

      const diff = calculateDiff(ops, grid);

      expect(diff.deletions.has('B1')).toBe(true);
      expect(diff.deletions.has('B2')).toBe(true);
      expect(diff.deletions.has('A1')).toBe(false);
      expect(diff.deletions.has('C1')).toBe(false);
    });
  });

  describe('SORT', () => {
    it('should mark all cells as modifications when sorting', () => {
      const ops: Operation[] = [{ type: 'SORT', column: 'A', direction: 'asc' }];
      const grid: Grid = {
        A1: { id: 'A1', value: 3 },
        A2: { id: 'A2', value: 1 },
        B1: { id: 'B1', value: 'X' },
      };

      const diff = calculateDiff(ops, grid);

      // SORT marks all cells as modified (they may reorder)
      expect(diff.modifications.size).toBeGreaterThan(0);
      expect(diff.modifications.has('A1')).toBe(true);
      expect(diff.modifications.has('A2')).toBe(true);
    });
  });

  describe('FORMAT', () => {
    it('should mark formatted cells as modifications', () => {
      const ops: Operation[] = [
        {
          type: 'FORMAT',
          cellIds: ['A1'],
          format: { bold: true, currency: 'USD' },
        },
      ];
      const grid: Grid = { A1: { id: 'A1', value: 100 } };

      const diff = calculateDiff(ops, grid);

      expect(diff.modifications.has('A1')).toBe(true);
      expect(diff.modifications.get('A1')?.formatAfter?.bold).toBe(true);
      expect(diff.modifications.get('A1')?.formatAfter?.currency).toBe('USD');
    });

    it('should create addition for formatted empty cell', () => {
      const ops: Operation[] = [
        {
          type: 'FORMAT',
          cellIds: ['A1'],
          format: { bold: true },
        },
      ];
      const grid: Grid = {};

      const diff = calculateDiff(ops, grid);

      expect(diff.additions.has('A1')).toBe(true);
      expect(diff.additions.get('A1')?.formatAfter?.bold).toBe(true);
    });

    it('should merge format with existing format', () => {
      const ops: Operation[] = [
        {
          type: 'FORMAT',
          cellIds: ['A1'],
          format: { currency: 'EUR' },
        },
      ];
      const grid: Grid = { A1: { id: 'A1', value: 100, format: { bold: true } } };

      const diff = calculateDiff(ops, grid);

      const modCell = diff.modifications.get('A1');
      expect(modCell?.formatBefore?.bold).toBe(true);
      expect(modCell?.formatAfter?.bold).toBe(true); // Preserved
      expect(modCell?.formatAfter?.currency).toBe('EUR'); // Added
    });
  });

  describe('Multiple operations', () => {
    it('should handle sequential operations correctly', () => {
      const ops: Operation[] = [
        { type: 'SET_VALUE', cellId: 'A1', value: 10 },
        { type: 'SET_VALUE', cellId: 'B1', value: 20 },
        { type: 'SET_FORMULA', cellId: 'C1', formula: '=A1+B1' },
      ];
      const grid: Grid = {};

      const diff = calculateDiff(ops, grid);

      expect(diff.additions.has('A1')).toBe(true);
      expect(diff.additions.has('B1')).toBe(true);
      expect(diff.additions.has('C1')).toBe(true);
      expect(diff.additions.size).toBe(3);
    });
  });
});
