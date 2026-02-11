// @vitest-environment happy-dom
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Cell } from './Cell';
import { useGridStore } from '../../stores/gridStore';

describe('Cell', () => {
  beforeEach(() => {
    useGridStore.setState({
      cells: {},
      rowCount: 100,
      colCount: 26,
      editingCell: null,
      selectedCell: null,
    });
  });

  it('should display empty cell when no value', () => {
    render(<Cell cellId="A1" />);
    const cell = screen.getByTestId('cell-A1');
    expect(cell).toBeInTheDocument();
    expect(cell.textContent).toBe('');
  });

  it('should display cell value', () => {
    useGridStore.getState().setCell('A1', 'Hello');
    render(<Cell cellId="A1" />);
    expect(screen.getByTestId('cell-A1').textContent).toBe('Hello');
  });

  it('should display number value', () => {
    useGridStore.getState().setCell('B2', 42);
    render(<Cell cellId="B2" />);
    expect(screen.getByTestId('cell-B2').textContent).toBe('42');
  });

  it('should enter edit mode on double-click', () => {
    render(<Cell cellId="A1" />);
    fireEvent.doubleClick(screen.getByTestId('cell-A1'));
    expect(screen.getByTestId('cell-input-A1')).toBeInTheDocument();
  });

  it('should save value on Enter', () => {
    useGridStore.getState().startEditing('A1');
    render(<Cell cellId="A1" />);
    const input = screen.getByTestId('cell-input-A1');
    fireEvent.change(input, { target: { value: 'Test' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(useGridStore.getState().cells['A1']?.value).toBe('Test');
    expect(useGridStore.getState().editingCell).toBeNull();
  });

  it('should save numeric value as number on Enter', () => {
    useGridStore.getState().startEditing('A1');
    render(<Cell cellId="A1" />);
    const input = screen.getByTestId('cell-input-A1');
    fireEvent.change(input, { target: { value: '123' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(useGridStore.getState().cells['A1']?.value).toBe(123);
  });

  it('should save value on blur', () => {
    useGridStore.getState().startEditing('A1');
    render(<Cell cellId="A1" />);
    const input = screen.getByTestId('cell-input-A1');
    fireEvent.change(input, { target: { value: 'Blur test' } });
    fireEvent.blur(input);
    expect(useGridStore.getState().cells['A1']?.value).toBe('Blur test');
    expect(useGridStore.getState().editingCell).toBeNull();
  });

  it('should cancel editing on Escape without saving', () => {
    useGridStore.getState().setCell('A1', 'Original');
    useGridStore.getState().startEditing('A1');
    render(<Cell cellId="A1" />);
    const input = screen.getByTestId('cell-input-A1');
    fireEvent.change(input, { target: { value: 'Changed' } });
    fireEvent.keyDown(input, { key: 'Escape' });
    expect(useGridStore.getState().cells['A1']?.value).toBe('Original');
    expect(useGridStore.getState().editingCell).toBeNull();
  });

  it('should remove cell when saving empty value', () => {
    useGridStore.getState().setCell('A1', 'Hello');
    useGridStore.getState().startEditing('A1');
    render(<Cell cellId="A1" />);
    const input = screen.getByTestId('cell-input-A1');
    fireEvent.change(input, { target: { value: '' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(useGridStore.getState().cells['A1']).toBeUndefined();
  });

  it('should call selectCell on click', () => {
    render(<Cell cellId="A1" />);
    fireEvent.click(screen.getByTestId('cell-A1'));
    expect(useGridStore.getState().selectedCell).toBe('A1');
  });

  it('should apply ring-2 style when selected', () => {
    useGridStore.setState({ selectedCell: 'A1' });
    render(<Cell cellId="A1" />);
    const cell = screen.getByTestId('cell-A1');
    expect(cell.className).toContain('ring-2');
    expect(cell.className).toContain('ring-blue-500');
  });

  it('should not apply ring style when not selected', () => {
    useGridStore.setState({ selectedCell: 'B2' });
    render(<Cell cellId="A1" />);
    const cell = screen.getByTestId('cell-A1');
    expect(cell.className).not.toContain('ring-2');
    expect(cell.className).toContain('border-gray-200');
  });

  it('should move selection down on Enter in edit mode', () => {
    useGridStore.setState({ selectedCell: 'A3' });
    useGridStore.getState().startEditing('A3');
    render(<Cell cellId="A3" />);
    const input = screen.getByTestId('cell-input-A3');
    fireEvent.change(input, { target: { value: 'test' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(useGridStore.getState().editingCell).toBeNull();
    expect(useGridStore.getState().selectedCell).toBe('A4');
  });

  it('should move selection right on Tab in edit mode', () => {
    useGridStore.setState({ selectedCell: 'B2' });
    useGridStore.getState().startEditing('B2');
    render(<Cell cellId="B2" />);
    const input = screen.getByTestId('cell-input-B2');
    fireEvent.change(input, { target: { value: 'test' } });
    fireEvent.keyDown(input, { key: 'Tab' });
    expect(useGridStore.getState().editingCell).toBeNull();
    expect(useGridStore.getState().selectedCell).toBe('C2');
  });

  it('should move selection left on Shift+Tab in edit mode', () => {
    useGridStore.setState({ selectedCell: 'C2' });
    useGridStore.getState().startEditing('C2');
    render(<Cell cellId="C2" />);
    const input = screen.getByTestId('cell-input-C2');
    fireEvent.change(input, { target: { value: 'test' } });
    fireEvent.keyDown(input, { key: 'Tab', shiftKey: true });
    expect(useGridStore.getState().editingCell).toBeNull();
    expect(useGridStore.getState().selectedCell).toBe('B2');
  });
});
