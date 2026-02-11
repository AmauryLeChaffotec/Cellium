// @vitest-environment happy-dom
import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useGridStore } from '../stores/gridStore';
import { useKeyboardNav } from './useKeyboardNav';

function fireKeyDown(container: HTMLElement, key: string, opts?: { shiftKey?: boolean }) {
  const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...opts });
  act(() => {
    container.dispatchEvent(event);
  });
  return event;
}

describe('useKeyboardNav', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    useGridStore.setState({
      cells: {},
      rowCount: 10,
      colCount: 5,
      editingCell: null,
      selectedCell: 'C3',
    });
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  function renderNav() {
    const ref = { current: container };
    return renderHook(() => useKeyboardNav(ref));
  }

  it('should move selection up on ArrowUp', () => {
    renderNav();
    fireKeyDown(container, 'ArrowUp');
    expect(useGridStore.getState().selectedCell).toBe('C2');
  });

  it('should move selection down on ArrowDown', () => {
    renderNav();
    fireKeyDown(container, 'ArrowDown');
    expect(useGridStore.getState().selectedCell).toBe('C4');
  });

  it('should move selection left on ArrowLeft', () => {
    renderNav();
    fireKeyDown(container, 'ArrowLeft');
    expect(useGridStore.getState().selectedCell).toBe('B3');
  });

  it('should move selection right on ArrowRight', () => {
    renderNav();
    fireKeyDown(container, 'ArrowRight');
    expect(useGridStore.getState().selectedCell).toBe('D3');
  });

  it('should move right on Tab', () => {
    renderNav();
    fireKeyDown(container, 'Tab');
    expect(useGridStore.getState().selectedCell).toBe('D3');
  });

  it('should move left on Shift+Tab', () => {
    renderNav();
    fireKeyDown(container, 'Tab', { shiftKey: true });
    expect(useGridStore.getState().selectedCell).toBe('B3');
  });

  it('should start editing on Enter', () => {
    renderNav();
    fireKeyDown(container, 'Enter');
    expect(useGridStore.getState().editingCell).toBe('C3');
  });

  it('should not go above row 1', () => {
    useGridStore.setState({ selectedCell: 'A1' });
    renderNav();
    fireKeyDown(container, 'ArrowUp');
    expect(useGridStore.getState().selectedCell).toBe('A1');
  });

  it('should not go below rowCount', () => {
    useGridStore.setState({ selectedCell: 'A10' });
    renderNav();
    fireKeyDown(container, 'ArrowDown');
    expect(useGridStore.getState().selectedCell).toBe('A10');
  });

  it('should not go left of column 0', () => {
    useGridStore.setState({ selectedCell: 'A3' });
    renderNav();
    fireKeyDown(container, 'ArrowLeft');
    expect(useGridStore.getState().selectedCell).toBe('A3');
  });

  it('should not go right beyond colCount-1', () => {
    useGridStore.setState({ selectedCell: 'E3' });
    renderNav();
    fireKeyDown(container, 'ArrowRight');
    expect(useGridStore.getState().selectedCell).toBe('E3');
  });

  it('should ignore keyboard events when editing', () => {
    useGridStore.setState({ editingCell: 'C3' });
    renderNav();
    fireKeyDown(container, 'ArrowUp');
    expect(useGridStore.getState().selectedCell).toBe('C3');
  });

  it('should ignore keyboard events when no cell selected', () => {
    useGridStore.setState({ selectedCell: null });
    renderNav();
    fireKeyDown(container, 'ArrowUp');
    expect(useGridStore.getState().selectedCell).toBeNull();
  });

  it('should preventDefault on handled keys', () => {
    renderNav();
    const event = fireKeyDown(container, 'ArrowUp');
    expect(event.defaultPrevented).toBe(true);
  });

  it('should not preventDefault on unhandled keys', () => {
    renderNav();
    const event = fireKeyDown(container, 'a');
    expect(event.defaultPrevented).toBe(false);
  });
});
