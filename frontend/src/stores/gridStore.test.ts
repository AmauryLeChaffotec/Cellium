import { describe, it, expect, beforeEach } from 'vitest';
import { useGridStore } from './gridStore';

describe('gridStore', () => {
  beforeEach(() => {
    // Reset store to initial state before each test
    useGridStore.setState({
      cells: {},
      rowCount: 100,
      colCount: 26,
      editingCell: null,
      selectedCell: null,
    });
  });

  describe('initial state', () => {
    it('should have empty cells', () => {
      expect(useGridStore.getState().cells).toEqual({});
    });

    it('should have 100 rows and 26 columns by default', () => {
      const state = useGridStore.getState();
      expect(state.rowCount).toBe(100);
      expect(state.colCount).toBe(26);
    });

    it('should have no editing or selected cell', () => {
      const state = useGridStore.getState();
      expect(state.editingCell).toBeNull();
      expect(state.selectedCell).toBeNull();
    });
  });

  describe('initializeGrid', () => {
    it('should set row and column counts', () => {
      useGridStore.getState().initializeGrid(50, 10);
      const state = useGridStore.getState();
      expect(state.rowCount).toBe(50);
      expect(state.colCount).toBe(10);
    });

    it('should clear existing cells', () => {
      useGridStore.getState().setCell('A1', 'hello');
      useGridStore.getState().initializeGrid(50, 10);
      expect(useGridStore.getState().cells).toEqual({});
    });
  });

  describe('setCell', () => {
    it('should create a cell with string value', () => {
      useGridStore.getState().setCell('A1', 'hello');
      const cell = useGridStore.getState().cells['A1'];
      expect(cell).toEqual({ id: 'A1', value: 'hello' });
    });

    it('should create a cell with number value', () => {
      useGridStore.getState().setCell('B2', 42);
      const cell = useGridStore.getState().cells['B2'];
      expect(cell).toEqual({ id: 'B2', value: 42 });
    });

    it('should remove cell when value is null', () => {
      useGridStore.getState().setCell('A1', 'hello');
      useGridStore.getState().setCell('A1', null);
      expect(useGridStore.getState().cells['A1']).toBeUndefined();
    });

    it('should remove cell when value is empty string', () => {
      useGridStore.getState().setCell('A1', 'hello');
      useGridStore.getState().setCell('A1', '');
      expect(useGridStore.getState().cells['A1']).toBeUndefined();
    });

    it('should overwrite existing cell value', () => {
      useGridStore.getState().setCell('A1', 'old');
      useGridStore.getState().setCell('A1', 'new');
      expect(useGridStore.getState().cells['A1']?.value).toBe('new');
    });
  });

  describe('startEditing / stopEditing', () => {
    it('should set editingCell on startEditing', () => {
      useGridStore.getState().startEditing('A1');
      expect(useGridStore.getState().editingCell).toBe('A1');
    });

    it('should clear editingCell on stopEditing', () => {
      useGridStore.getState().startEditing('A1');
      useGridStore.getState().stopEditing();
      expect(useGridStore.getState().editingCell).toBeNull();
    });

    it('should allow changing editing cell directly', () => {
      useGridStore.getState().startEditing('A1');
      useGridStore.getState().startEditing('B2');
      expect(useGridStore.getState().editingCell).toBe('B2');
    });
  });

  describe('selectCell', () => {
    it('should set selectedCell', () => {
      useGridStore.getState().selectCell('C3');
      expect(useGridStore.getState().selectedCell).toBe('C3');
    });

    it('should clear selectedCell with null', () => {
      useGridStore.getState().selectCell('C3');
      useGridStore.getState().selectCell(null);
      expect(useGridStore.getState().selectedCell).toBeNull();
    });
  });

  describe('insertRow', () => {
    it('should increment rowCount', () => {
      useGridStore.getState().insertRow(5);
      expect(useGridStore.getState().rowCount).toBe(101);
    });

    it('should shift cells below the inserted row', () => {
      useGridStore.getState().setCell('A3', 'stay');
      useGridStore.getState().setCell('B5', 'shift');
      useGridStore.getState().insertRow(3);
      expect(useGridStore.getState().cells['A3']?.value).toBe('stay');
      expect(useGridStore.getState().cells['B5']).toBeUndefined();
      expect(useGridStore.getState().cells['B6']?.value).toBe('shift');
    });

    it('should not shift cells at or above afterRow', () => {
      useGridStore.getState().setCell('A2', 'above');
      useGridStore.getState().setCell('A3', 'at');
      useGridStore.getState().insertRow(3);
      expect(useGridStore.getState().cells['A2']?.value).toBe('above');
      expect(useGridStore.getState().cells['A3']?.value).toBe('at');
    });

    it('should shift selectedCell if below afterRow', () => {
      useGridStore.getState().selectCell('B5');
      useGridStore.getState().insertRow(3);
      expect(useGridStore.getState().selectedCell).toBe('B6');
    });

    it('should not shift selectedCell if at or above afterRow', () => {
      useGridStore.getState().selectCell('B3');
      useGridStore.getState().insertRow(3);
      expect(useGridStore.getState().selectedCell).toBe('B3');
    });

    it('should shift editingCell if below afterRow', () => {
      useGridStore.getState().startEditing('C4');
      useGridStore.getState().insertRow(2);
      expect(useGridStore.getState().editingCell).toBe('C5');
    });
  });

  describe('deleteRow', () => {
    it('should decrement rowCount', () => {
      useGridStore.getState().deleteRow(5);
      expect(useGridStore.getState().rowCount).toBe(99);
    });

    it('should remove cells in the deleted row', () => {
      useGridStore.getState().setCell('A3', 'delete-me');
      useGridStore.getState().setCell('B3', 'also-delete');
      useGridStore.getState().deleteRow(3);
      expect(useGridStore.getState().cells['A3']).toBeUndefined();
      expect(useGridStore.getState().cells['B3']).toBeUndefined();
    });

    it('should shift cells below the deleted row up', () => {
      useGridStore.getState().setCell('A5', 'shift-up');
      useGridStore.getState().deleteRow(3);
      expect(useGridStore.getState().cells['A5']).toBeUndefined();
      expect(useGridStore.getState().cells['A4']?.value).toBe('shift-up');
    });

    it('should not shift cells above the deleted row', () => {
      useGridStore.getState().setCell('A1', 'stay');
      useGridStore.getState().deleteRow(3);
      expect(useGridStore.getState().cells['A1']?.value).toBe('stay');
    });

    it('should deselect if selectedCell is in deleted row', () => {
      useGridStore.getState().selectCell('B3');
      useGridStore.getState().deleteRow(3);
      expect(useGridStore.getState().selectedCell).toBeNull();
    });

    it('should shift selectedCell up if below deleted row', () => {
      useGridStore.getState().selectCell('B5');
      useGridStore.getState().deleteRow(3);
      expect(useGridStore.getState().selectedCell).toBe('B4');
    });

    it('should clear editingCell if in deleted row', () => {
      useGridStore.getState().startEditing('A3');
      useGridStore.getState().deleteRow(3);
      expect(useGridStore.getState().editingCell).toBeNull();
    });

    it('should not delete if rowCount is 1', () => {
      useGridStore.setState({ rowCount: 1 });
      useGridStore.getState().setCell('A1', 'keep');
      useGridStore.getState().deleteRow(1);
      expect(useGridStore.getState().rowCount).toBe(1);
      expect(useGridStore.getState().cells['A1']?.value).toBe('keep');
    });
  });

  describe('insertColumn', () => {
    it('should increment colCount', () => {
      useGridStore.setState({ colCount: 5 });
      useGridStore.getState().insertColumn(2);
      expect(useGridStore.getState().colCount).toBe(6);
    });

    it('should shift cells to the right of afterCol', () => {
      useGridStore.setState({ colCount: 5 });
      useGridStore.getState().setCell('B1', 'stay');  // col 1
      useGridStore.getState().setCell('D1', 'shift'); // col 3
      useGridStore.getState().insertColumn(1); // after col B
      expect(useGridStore.getState().cells['B1']?.value).toBe('stay');
      expect(useGridStore.getState().cells['D1']).toBeUndefined();
      expect(useGridStore.getState().cells['E1']?.value).toBe('shift');
    });

    it('should not shift cells at or left of afterCol', () => {
      useGridStore.setState({ colCount: 5 });
      useGridStore.getState().setCell('A1', 'left');
      useGridStore.getState().setCell('B1', 'at');
      useGridStore.getState().insertColumn(1);
      expect(useGridStore.getState().cells['A1']?.value).toBe('left');
      expect(useGridStore.getState().cells['B1']?.value).toBe('at');
    });

    it('should be no-op if colCount is 26', () => {
      useGridStore.setState({ colCount: 26 });
      useGridStore.getState().insertColumn(5);
      expect(useGridStore.getState().colCount).toBe(26);
    });

    it('should shift selectedCell if to the right of afterCol', () => {
      useGridStore.setState({ colCount: 5 });
      useGridStore.getState().selectCell('D2'); // col 3
      useGridStore.getState().insertColumn(1);
      expect(useGridStore.getState().selectedCell).toBe('E2');
    });

    it('should shift editingCell if to the right of afterCol', () => {
      useGridStore.setState({ colCount: 5 });
      useGridStore.getState().startEditing('C3'); // col 2
      useGridStore.getState().insertColumn(0);
      expect(useGridStore.getState().editingCell).toBe('D3');
    });
  });

  describe('deleteColumn', () => {
    it('should decrement colCount', () => {
      useGridStore.setState({ colCount: 5 });
      useGridStore.getState().deleteColumn(2);
      expect(useGridStore.getState().colCount).toBe(4);
    });

    it('should remove cells in the deleted column', () => {
      useGridStore.setState({ colCount: 5 });
      useGridStore.getState().setCell('C1', 'delete-me'); // col 2
      useGridStore.getState().setCell('C5', 'also-delete');
      useGridStore.getState().deleteColumn(2);
      expect(useGridStore.getState().cells['C1']).toBeUndefined();
      expect(useGridStore.getState().cells['C5']).toBeUndefined();
    });

    it('should shift cells to the right of deleted column left', () => {
      useGridStore.setState({ colCount: 5 });
      useGridStore.getState().setCell('D1', 'shift-left'); // col 3
      useGridStore.getState().deleteColumn(2);
      expect(useGridStore.getState().cells['D1']).toBeUndefined();
      expect(useGridStore.getState().cells['C1']?.value).toBe('shift-left');
    });

    it('should not shift cells to the left of deleted column', () => {
      useGridStore.setState({ colCount: 5 });
      useGridStore.getState().setCell('A1', 'stay');
      useGridStore.getState().deleteColumn(2);
      expect(useGridStore.getState().cells['A1']?.value).toBe('stay');
    });

    it('should deselect if selectedCell is in deleted column', () => {
      useGridStore.setState({ colCount: 5 });
      useGridStore.getState().selectCell('C3'); // col 2
      useGridStore.getState().deleteColumn(2);
      expect(useGridStore.getState().selectedCell).toBeNull();
    });

    it('should shift selectedCell left if to the right of deleted column', () => {
      useGridStore.setState({ colCount: 5 });
      useGridStore.getState().selectCell('D2'); // col 3
      useGridStore.getState().deleteColumn(1);
      expect(useGridStore.getState().selectedCell).toBe('C2');
    });

    it('should clear editingCell if in deleted column', () => {
      useGridStore.setState({ colCount: 5 });
      useGridStore.getState().startEditing('C1'); // col 2
      useGridStore.getState().deleteColumn(2);
      expect(useGridStore.getState().editingCell).toBeNull();
    });

    it('should not delete if colCount is 1', () => {
      useGridStore.setState({ colCount: 1 });
      useGridStore.getState().setCell('A1', 'keep');
      useGridStore.getState().deleteColumn(0);
      expect(useGridStore.getState().colCount).toBe(1);
      expect(useGridStore.getState().cells['A1']?.value).toBe('keep');
    });
  });

  describe('loadGrid', () => {
    it('should set cells, rowCount, colCount from loaded data', () => {
      const data = {
        cells: { A1: { id: 'A1', value: 'loaded' }, B2: { id: 'B2', value: 42 } },
        rowCount: 500,
        colCount: 10,
      };
      useGridStore.getState().loadGrid(data);
      expect(useGridStore.getState().cells['A1']?.value).toBe('loaded');
      expect(useGridStore.getState().cells['B2']?.value).toBe(42);
      expect(useGridStore.getState().rowCount).toBe(500);
      expect(useGridStore.getState().colCount).toBe(10);
    });

    it('should reset editingCell and selectedCell to null', () => {
      useGridStore.setState({ editingCell: 'A1', selectedCell: 'B2' });
      useGridStore.getState().loadGrid({ cells: {}, rowCount: 100, colCount: 26 });
      expect(useGridStore.getState().editingCell).toBeNull();
      expect(useGridStore.getState().selectedCell).toBeNull();
    });

    it('should replace existing cells completely', () => {
      useGridStore.getState().setCell('A1', 'old');
      useGridStore.getState().setCell('C3', 'old2');
      useGridStore.getState().loadGrid({
        cells: { B2: { id: 'B2', value: 'new' } },
        rowCount: 200,
        colCount: 5,
      });
      expect(useGridStore.getState().cells['A1']).toBeUndefined();
      expect(useGridStore.getState().cells['C3']).toBeUndefined();
      expect(useGridStore.getState().cells['B2']?.value).toBe('new');
    });
  });
});
