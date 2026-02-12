// @vitest-environment happy-dom
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { applyOperations } from './operationsEngine';
import { useGridStore } from '../stores/gridStore';
import type { Operation } from '../types/operations';

describe('operationsEngine', () => {
  beforeEach(() => {
    // Reset grid to clean state
    useGridStore.setState({
      cells: {},
      rowCount: 100,
      colCount: 26,
      editingCell: null,
      selectedCell: null,
    });
  });

  describe('SET_VALUE', () => {
    it('should set cell value with number', () => {
      const op: Operation = { type: 'SET_VALUE', cellId: 'A1', value: 42 };
      applyOperations([op]);

      const cell = useGridStore.getState().cells['A1'];
      expect(cell?.value).toBe(42);
      expect(cell?.id).toBe('A1');
    });

    it('should set cell value with string', () => {
      const op: Operation = { type: 'SET_VALUE', cellId: 'B2', value: 'Hello' };
      applyOperations([op]);

      const cell = useGridStore.getState().cells['B2'];
      expect(cell?.value).toBe('Hello');
    });

    it('should delete cell when value is null', () => {
      // Setup: create a cell first
      useGridStore.getState().setCell('C3', 'ToDelete');
      expect(useGridStore.getState().cells['C3']).toBeDefined();

      // Delete via SET_VALUE with null
      const op: Operation = { type: 'SET_VALUE', cellId: 'C3', value: null };
      applyOperations([op]);

      expect(useGridStore.getState().cells['C3']).toBeUndefined();
    });

    it('should throw error for invalid cell ID', () => {
      const op: Operation = { type: 'SET_VALUE', cellId: 'INVALID', value: 42 };
      expect(() => applyOperations([op])).toThrow('Invalid cell ID');
    });
  });

  describe('SET_FORMULA', () => {
    it('should set cell formula', () => {
      const op: Operation = {
        type: 'SET_FORMULA',
        cellId: 'C3',
        formula: '=A1+B2',
      };
      applyOperations([op]);

      const cell = useGridStore.getState().cells['C3'];
      expect(cell?.formula).toBe('=A1+B2');
      expect(cell?.value).toBe('=A1+B2'); // For now, formula is just stored as value
    });

    it('should throw error for invalid cell ID', () => {
      const op: Operation = {
        type: 'SET_FORMULA',
        cellId: 'XYZ',
        formula: '=1+1',
      };
      expect(() => applyOperations([op])).toThrow('Invalid cell ID');
    });
  });

  describe('INSERT_ROW', () => {
    it('should insert row and shift cells down', () => {
      // Setup: put cell at A2
      useGridStore.getState().setCell('A2', 'Original');

      // Insert row after row 1
      const op: Operation = {
        type: 'INSERT_ROW',
        afterRow: 1,
        cells: [{ id: 'A2', value: 'New' }],
      };
      applyOperations([op]);

      // Original A2 should now be at A3
      expect(useGridStore.getState().cells['A3']?.value).toBe('Original');
      // New row at A2
      expect(useGridStore.getState().cells['A2']?.value).toBe('New');
      // Row count incremented
      expect(useGridStore.getState().rowCount).toBe(101);
    });

    it('should insert row with multiple cells', () => {
      const op: Operation = {
        type: 'INSERT_ROW',
        afterRow: 1,
        cells: [
          { id: 'A2', value: 'Cell1' },
          { id: 'B2', value: 'Cell2' },
          { id: 'C2', value: 'Cell3' },
        ],
      };
      applyOperations([op]);

      expect(useGridStore.getState().cells['A2']?.value).toBe('Cell1');
      expect(useGridStore.getState().cells['B2']?.value).toBe('Cell2');
      expect(useGridStore.getState().cells['C2']?.value).toBe('Cell3');
    });

    it('should insert row with formatted cells', () => {
      const op: Operation = {
        type: 'INSERT_ROW',
        afterRow: 1,
        cells: [
          {
            id: 'A2',
            value: 100,
            format: { bold: true, currency: 'USD' },
          },
        ],
      };
      applyOperations([op]);

      const cell = useGridStore.getState().cells['A2'];
      expect(cell?.value).toBe(100);
      expect(cell?.format?.bold).toBe(true);
      expect(cell?.format?.currency).toBe('USD');
    });
  });

  describe('INSERT_COLUMN', () => {
    it('should insert column and shift cells right', () => {
      // Setup: put cell at B1
      useGridStore.getState().setCell('B1', 'Original');

      // Insert column after A
      const op: Operation = {
        type: 'INSERT_COLUMN',
        afterCol: 'A',
        header: 'NewCol',
        cells: [{ id: 'B1', value: 'New' }],
      };
      applyOperations([op]);

      // Original B1 should now be at C1
      expect(useGridStore.getState().cells['C1']?.value).toBe('Original');
      // New column at B1
      expect(useGridStore.getState().cells['B1']?.value).toBe('New');
      // Col count incremented
      expect(useGridStore.getState().colCount).toBe(27);
    });

    it('should throw error for invalid column', () => {
      const op: Operation = {
        type: 'INSERT_COLUMN',
        afterCol: '1', // Invalid: should be letter
        header: 'Test',
        cells: [],
      };
      expect(() => applyOperations([op])).toThrow('Invalid column');
    });
  });

  describe('DELETE_ROW', () => {
    it('should delete row and shift cells up', () => {
      // Setup
      useGridStore.getState().setCell('A2', 'Row2');
      useGridStore.getState().setCell('A3', 'Row3');

      // Delete row 2
      const op: Operation = { type: 'DELETE_ROW', row: 2 };
      applyOperations([op]);

      // A2 should now contain what was in A3
      expect(useGridStore.getState().cells['A2']?.value).toBe('Row3');
      // A3 should be empty
      expect(useGridStore.getState().cells['A3']).toBeUndefined();
      // Row count decremented
      expect(useGridStore.getState().rowCount).toBe(99);
    });

    it('should not delete when only one row remains', () => {
      useGridStore.setState({ rowCount: 1 });
      useGridStore.getState().setCell('A1', 'OnlyRow');

      const op: Operation = { type: 'DELETE_ROW', row: 1 };
      applyOperations([op]);

      // Row should still exist
      expect(useGridStore.getState().cells['A1']?.value).toBe('OnlyRow');
      expect(useGridStore.getState().rowCount).toBe(1);
    });
  });

  describe('DELETE_COLUMN', () => {
    it('should delete column and shift cells left', () => {
      // Setup
      useGridStore.getState().setCell('B1', 'ColB');
      useGridStore.getState().setCell('C1', 'ColC');

      // Delete column B
      const op: Operation = { type: 'DELETE_COLUMN', col: 'B' };
      applyOperations([op]);

      // B1 should now contain what was in C1
      expect(useGridStore.getState().cells['B1']?.value).toBe('ColC');
      // C1 should be empty
      expect(useGridStore.getState().cells['C1']).toBeUndefined();
      // Col count decremented
      expect(useGridStore.getState().colCount).toBe(25);
    });

    it('should throw error for invalid column', () => {
      const op: Operation = { type: 'DELETE_COLUMN', col: '9' };
      expect(() => applyOperations([op])).toThrow('Invalid column');
    });

    it('should not delete when only one column remains', () => {
      useGridStore.setState({ colCount: 1 });
      useGridStore.getState().setCell('A1', 'OnlyCol');

      const op: Operation = { type: 'DELETE_COLUMN', col: 'A' };
      applyOperations([op]);

      // Column should still exist
      expect(useGridStore.getState().cells['A1']?.value).toBe('OnlyCol');
      expect(useGridStore.getState().colCount).toBe(1);
    });
  });

  describe('SORT', () => {
    it('should sort rows by column ascending (numbers)', () => {
      // Setup
      useGridStore.getState().setCell('A1', 3);
      useGridStore.getState().setCell('A2', 1);
      useGridStore.getState().setCell('A3', 2);
      useGridStore.setState({ rowCount: 3 });

      const op: Operation = { type: 'SORT', column: 'A', direction: 'asc' };
      applyOperations([op]);

      // After sort: A1=1, A2=2, A3=3
      expect(useGridStore.getState().cells['A1']?.value).toBe(1);
      expect(useGridStore.getState().cells['A2']?.value).toBe(2);
      expect(useGridStore.getState().cells['A3']?.value).toBe(3);
    });

    it('should sort rows by column descending (numbers)', () => {
      // Setup
      useGridStore.getState().setCell('A1', 1);
      useGridStore.getState().setCell('A2', 3);
      useGridStore.getState().setCell('A3', 2);
      useGridStore.setState({ rowCount: 3 });

      const op: Operation = { type: 'SORT', column: 'A', direction: 'desc' };
      applyOperations([op]);

      // After sort: A1=3, A2=2, A3=1
      expect(useGridStore.getState().cells['A1']?.value).toBe(3);
      expect(useGridStore.getState().cells['A2']?.value).toBe(2);
      expect(useGridStore.getState().cells['A3']?.value).toBe(1);
    });

    it('should sort rows by column ascending (strings)', () => {
      // Setup
      useGridStore.getState().setCell('A1', 'Zebra');
      useGridStore.getState().setCell('A2', 'Apple');
      useGridStore.getState().setCell('A3', 'Mango');
      useGridStore.setState({ rowCount: 3 });

      const op: Operation = { type: 'SORT', column: 'A', direction: 'asc' };
      applyOperations([op]);

      // After sort: Apple, Mango, Zebra
      expect(useGridStore.getState().cells['A1']?.value).toBe('Apple');
      expect(useGridStore.getState().cells['A2']?.value).toBe('Mango');
      expect(useGridStore.getState().cells['A3']?.value).toBe('Zebra');
    });

    it('should sort with null values at the end', () => {
      // Setup
      useGridStore.getState().setCell('A1', 2);
      // A2 is empty (null)
      useGridStore.getState().setCell('A3', 1);
      useGridStore.setState({ rowCount: 3 });

      const op: Operation = { type: 'SORT', column: 'A', direction: 'asc' };
      applyOperations([op]);

      // After sort: 1, 2, null
      expect(useGridStore.getState().cells['A1']?.value).toBe(1);
      expect(useGridStore.getState().cells['A2']?.value).toBe(2);
      expect(useGridStore.getState().cells['A3']).toBeUndefined();
    });

    it('should maintain other column values when sorting', () => {
      // Setup
      useGridStore.getState().setCell('A1', 3);
      useGridStore.getState().setCell('B1', 'First');
      useGridStore.getState().setCell('A2', 1);
      useGridStore.getState().setCell('B2', 'Second');
      useGridStore.setState({ rowCount: 2 });

      const op: Operation = { type: 'SORT', column: 'A', direction: 'asc' };
      applyOperations([op]);

      // After sort: A1=1 (was A2), B1='Second' (was B2)
      expect(useGridStore.getState().cells['A1']?.value).toBe(1);
      expect(useGridStore.getState().cells['B1']?.value).toBe('Second');
      expect(useGridStore.getState().cells['A2']?.value).toBe(3);
      expect(useGridStore.getState().cells['B2']?.value).toBe('First');
    });
  });

  describe('FORMAT', () => {
    it('should apply format to single cell', () => {
      useGridStore.getState().setCell('A1', 100);

      const op: Operation = {
        type: 'FORMAT',
        cellIds: ['A1'],
        format: { bold: true, currency: 'USD', decimals: 2 },
      };
      applyOperations([op]);

      const cell = useGridStore.getState().cells['A1'];
      expect(cell?.format?.bold).toBe(true);
      expect(cell?.format?.currency).toBe('USD');
      expect(cell?.format?.decimals).toBe(2);
    });

    it('should apply format to multiple cells', () => {
      useGridStore.getState().setCell('A1', 100);
      useGridStore.getState().setCell('A2', 200);

      const op: Operation = {
        type: 'FORMAT',
        cellIds: ['A1', 'A2'],
        format: { bold: true },
      };
      applyOperations([op]);

      expect(useGridStore.getState().cells['A1']?.format?.bold).toBe(true);
      expect(useGridStore.getState().cells['A2']?.format?.bold).toBe(true);
    });

    it('should merge format with existing format', () => {
      useGridStore.getState().setCell('A1', 100, { format: { bold: true } });

      const op: Operation = {
        type: 'FORMAT',
        cellIds: ['A1'],
        format: { currency: 'EUR' },
      };
      applyOperations([op]);

      const cell = useGridStore.getState().cells['A1'];
      expect(cell?.format?.bold).toBe(true); // Preserved
      expect(cell?.format?.currency).toBe('EUR'); // Added
    });

    it('should create cell with format if cell does not exist', () => {
      const op: Operation = {
        type: 'FORMAT',
        cellIds: ['A1'],
        format: { bold: true },
      };
      applyOperations([op]);

      const cell = useGridStore.getState().cells['A1'];
      expect(cell).toBeDefined();
      expect(cell?.format?.bold).toBe(true);
      expect(cell?.value).toBe(''); // Empty value
    });

    it('should skip invalid cell IDs with warning', () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const op: Operation = {
        type: 'FORMAT',
        cellIds: ['INVALID', 'A1'],
        format: { bold: true },
      };
      applyOperations([op]);

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Invalid cell ID in FORMAT operation: INVALID')
      );
      // A1 should still be formatted
      expect(useGridStore.getState().cells['A1']?.format?.bold).toBe(true);

      consoleWarnSpy.mockRestore();
    });
  });

  describe('Multiple operations', () => {
    it('should apply operations sequentially', () => {
      const ops: Operation[] = [
        { type: 'SET_VALUE', cellId: 'A1', value: 10 },
        { type: 'SET_VALUE', cellId: 'B1', value: 20 },
        { type: 'SET_FORMULA', cellId: 'C1', formula: '=A1+B1' },
      ];

      applyOperations(ops);

      expect(useGridStore.getState().cells['A1']?.value).toBe(10);
      expect(useGridStore.getState().cells['B1']?.value).toBe(20);
      expect(useGridStore.getState().cells['C1']?.formula).toBe('=A1+B1');
    });

    it('should apply complex sequence of operations', () => {
      const ops: Operation[] = [
        { type: 'SET_VALUE', cellId: 'A1', value: 'First' },
        { type: 'SET_VALUE', cellId: 'A2', value: 'Second' },
        { type: 'INSERT_ROW', afterRow: 1, cells: [{ id: 'A2', value: 'Inserted' }] },
        { type: 'FORMAT', cellIds: ['A1', 'A2'], format: { bold: true } },
      ];

      applyOperations(ops);

      // A1 = 'First', A2 = 'Inserted', A3 = 'Second' (shifted)
      expect(useGridStore.getState().cells['A1']?.value).toBe('First');
      expect(useGridStore.getState().cells['A2']?.value).toBe('Inserted');
      expect(useGridStore.getState().cells['A3']?.value).toBe('Second');
      expect(useGridStore.getState().cells['A1']?.format?.bold).toBe(true);
      expect(useGridStore.getState().cells['A2']?.format?.bold).toBe(true);
    });
  });

  describe('Error handling', () => {
    it('should throw error for unknown operation type', () => {
      const op = { type: 'UNKNOWN' } as any;
      expect(() => applyOperations([op])).toThrow('Unknown operation type');
    });
  });
});
