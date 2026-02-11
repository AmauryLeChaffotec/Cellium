// @vitest-environment happy-dom
import { describe, it, expect, beforeEach, beforeAll, vi } from 'vitest';
import { render, screen, act, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { SpreadsheetGrid } from './SpreadsheetGrid';
import { useGridStore } from '../../stores/gridStore';

vi.mock('../../utils/persistence', () => ({
  loadGridData: vi.fn(() => Promise.resolve(null)),
  saveGridData: vi.fn(),
}));

beforeAll(() => {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
});

describe('SpreadsheetGrid', () => {
  beforeEach(() => {
    useGridStore.setState({
      cells: {},
      rowCount: 1000,
      colCount: 26,
      editingCell: null,
      selectedCell: null,
    });
  });

  it('should render column headers A through Z', () => {
    render(<SpreadsheetGrid />);
    expect(screen.getByText('A')).toBeInTheDocument();
    expect(screen.getByText('Z')).toBeInTheDocument();
    expect(screen.getByText('M')).toBeInTheDocument();
  });

  it('should render row numbers 1 through 1000', () => {
    render(<SpreadsheetGrid />);
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('500')).toBeInTheDocument();
    expect(screen.getByText('1000')).toBeInTheDocument();
  });

  it('should render visible cells via virtualization', () => {
    render(<SpreadsheetGrid />);
    expect(screen.getByTestId('cell-A1')).toBeInTheDocument();
    expect(screen.getByTestId('cell-B1')).toBeInTheDocument();
  });

  it('should display cell values from the store', () => {
    const { rerender } = render(<SpreadsheetGrid />);
    act(() => {
      useGridStore.getState().setCell('B3', 'Test Value');
    });
    rerender(<SpreadsheetGrid />);
    expect(screen.getByTestId('cell-B3').textContent).toBe('Test Value');
  });

  it('should initialize grid store on mount', () => {
    render(<SpreadsheetGrid />);
    const state = useGridStore.getState();
    expect(state.rowCount).toBe(1000);
    expect(state.colCount).toBe(26);
  });

  it('should have tabIndex and data-grid-container on the container', () => {
    render(<SpreadsheetGrid />);
    const container = document.querySelector('[data-grid-container]');
    expect(container).not.toBeNull();
    expect(container?.getAttribute('tabindex')).toBe('0');
  });

  it('should navigate with arrow keys when a cell is selected', () => {
    render(<SpreadsheetGrid />);
    const container = document.querySelector<HTMLElement>('[data-grid-container]')!;
    act(() => {
      useGridStore.getState().selectCell('B2');
    });
    fireEvent.keyDown(container, { key: 'ArrowDown' });
    expect(useGridStore.getState().selectedCell).toBe('B3');
  });

  it('should enter edit mode on Enter when a cell is selected', () => {
    render(<SpreadsheetGrid />);
    const container = document.querySelector<HTMLElement>('[data-grid-container]')!;
    act(() => {
      useGridStore.getState().selectCell('A1');
    });
    fireEvent.keyDown(container, { key: 'Enter' });
    expect(useGridStore.getState().editingCell).toBe('A1');
  });

  it('should navigate with Tab when a cell is selected', () => {
    render(<SpreadsheetGrid />);
    const container = document.querySelector<HTMLElement>('[data-grid-container]')!;
    act(() => {
      useGridStore.getState().selectCell('A1');
    });
    fireEvent.keyDown(container, { key: 'Tab' });
    expect(useGridStore.getState().selectedCell).toBe('B1');
  });

  it('should have data-row-header on row number cells', () => {
    render(<SpreadsheetGrid />);
    const rowHeader = document.querySelector('[data-row-header="1"]');
    expect(rowHeader).not.toBeNull();
    expect(rowHeader?.textContent).toBe('1');
  });

  it('should have data-col-header on column header cells', () => {
    render(<SpreadsheetGrid />);
    const colHeader = document.querySelector('[data-col-header="0"]');
    expect(colHeader).not.toBeNull();
    expect(colHeader?.textContent).toBe('A');
  });

  it('should show context menu on right-click on a row header', () => {
    render(<SpreadsheetGrid />);
    const rowHeader = document.querySelector('[data-row-header="3"]')!;
    fireEvent.contextMenu(rowHeader);
    expect(screen.getByTestId('context-menu')).toBeInTheDocument();
    expect(screen.getByText('Insérer une ligne au-dessus')).toBeInTheDocument();
    expect(screen.getByText('Supprimer la ligne')).toBeInTheDocument();
  });

  it('should show context menu on right-click on a column header', () => {
    render(<SpreadsheetGrid />);
    const colHeader = document.querySelector('[data-col-header="1"]')!;
    fireEvent.contextMenu(colHeader);
    expect(screen.getByTestId('context-menu')).toBeInTheDocument();
    expect(screen.getByText('Insérer une colonne à gauche')).toBeInTheDocument();
    expect(screen.getByText('Supprimer la colonne')).toBeInTheDocument();
  });

  it('should show context menu on right-click on a cell with row and column items', () => {
    render(<SpreadsheetGrid />);
    const cell = screen.getByTestId('cell-B2');
    fireEvent.contextMenu(cell);
    expect(screen.getByTestId('context-menu')).toBeInTheDocument();
    expect(screen.getByText('Insérer une ligne en-dessous')).toBeInTheDocument();
    expect(screen.getByText('Insérer une colonne à droite')).toBeInTheDocument();
  });

  it('should insert a row when clicking the insert row menu item', () => {
    render(<SpreadsheetGrid />);
    const rowHeader = document.querySelector('[data-row-header="3"]')!;
    fireEvent.contextMenu(rowHeader);
    fireEvent.click(screen.getByText('Insérer une ligne en-dessous'));
    expect(useGridStore.getState().rowCount).toBe(1001);
  });

  it('should delete a row when clicking the delete row menu item', () => {
    render(<SpreadsheetGrid />);
    const rowHeader = document.querySelector('[data-row-header="3"]')!;
    fireEvent.contextMenu(rowHeader);
    fireEvent.click(screen.getByText('Supprimer la ligne'));
    expect(useGridStore.getState().rowCount).toBe(999);
  });

  it('should close context menu after action', () => {
    render(<SpreadsheetGrid />);
    const rowHeader = document.querySelector('[data-row-header="3"]')!;
    fireEvent.contextMenu(rowHeader);
    expect(screen.getByTestId('context-menu')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Supprimer la ligne'));
    expect(screen.queryByTestId('context-menu')).not.toBeInTheDocument();
  });
});
