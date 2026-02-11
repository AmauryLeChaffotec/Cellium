// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useGridStore } from '../stores/gridStore';

vi.mock('../utils/persistence', () => ({
  loadGridData: vi.fn(),
  saveGridData: vi.fn(),
}));

const { loadGridData, saveGridData } = await import('../utils/persistence');
const { useAutoSave } = await import('./useAutoSave');

const mockLoadGridData = loadGridData as ReturnType<typeof vi.fn>;
const mockSaveGridData = saveGridData as ReturnType<typeof vi.fn>;

describe('useAutoSave', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    useGridStore.setState({
      cells: {},
      rowCount: 100,
      colCount: 26,
      editingCell: null,
      selectedCell: null,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should call loadGridData on mount', async () => {
    mockLoadGridData.mockResolvedValue(null);
    renderHook(() => useAutoSave());
    await act(async () => {
      await vi.runAllTimersAsync();
    });
    expect(mockLoadGridData).toHaveBeenCalledOnce();
  });

  it('should call loadGrid when data exists in IndexedDB', async () => {
    const storedData = {
      cells: { A1: { id: 'A1', value: 'saved' } },
      rowCount: 500,
      colCount: 10,
    };
    mockLoadGridData.mockResolvedValue(storedData);
    renderHook(() => useAutoSave());
    await act(async () => {
      await vi.runAllTimersAsync();
    });
    const state = useGridStore.getState();
    expect(state.cells['A1']?.value).toBe('saved');
    expect(state.rowCount).toBe(500);
    expect(state.colCount).toBe(10);
  });

  it('should call initializeGrid(1000, 26) when no data in IndexedDB', async () => {
    mockLoadGridData.mockResolvedValue(null);
    renderHook(() => useAutoSave());
    await act(async () => {
      await vi.runAllTimersAsync();
    });
    const state = useGridStore.getState();
    expect(state.rowCount).toBe(1000);
    expect(state.colCount).toBe(26);
    expect(state.cells).toEqual({});
  });

  it('should save after 30s when store has changed', async () => {
    mockLoadGridData.mockResolvedValue(null);
    renderHook(() => useAutoSave());
    await act(async () => {
      await vi.runAllTimersAsync();
    });

    // Trigger a change in the store
    act(() => {
      useGridStore.getState().setCell('A1', 'dirty');
    });

    // Advance 30 seconds
    await act(async () => {
      await vi.advanceTimersByTimeAsync(30_000);
    });

    expect(mockSaveGridData).toHaveBeenCalledOnce();
    expect(mockSaveGridData).toHaveBeenCalledWith(
      expect.objectContaining({
        cells: expect.objectContaining({ A1: expect.objectContaining({ value: 'dirty' }) }),
        rowCount: 1000,
        colCount: 26,
      }),
    );
  });

  it('should not save after 30s when store has not changed', async () => {
    mockLoadGridData.mockResolvedValue(null);
    renderHook(() => useAutoSave());
    await act(async () => {
      await vi.runAllTimersAsync();
    });

    // Clear any calls from initialization
    mockSaveGridData.mockClear();

    // Advance 30 seconds without changing store
    await act(async () => {
      await vi.advanceTimersByTimeAsync(30_000);
    });

    expect(mockSaveGridData).not.toHaveBeenCalled();
  });

  it('should cleanup interval on unmount', async () => {
    mockLoadGridData.mockResolvedValue(null);
    const { unmount } = renderHook(() => useAutoSave());
    await act(async () => {
      await vi.runAllTimersAsync();
    });

    // Trigger dirty
    act(() => {
      useGridStore.getState().setCell('A1', 'test');
    });

    unmount();

    // Clear any prior calls
    mockSaveGridData.mockClear();

    // Advance time — should NOT save after unmount
    await act(async () => {
      await vi.advanceTimersByTimeAsync(30_000);
    });

    expect(mockSaveGridData).not.toHaveBeenCalled();
  });
});
