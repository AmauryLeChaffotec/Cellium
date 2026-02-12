// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCommandStore } from './commandStore';
import { useGridStore } from './gridStore';
import { useDiffStore } from './diffStore';

// Mock global fetch
globalThis.fetch = vi.fn() as any;

describe('commandStore', () => {
  beforeEach(() => {
    // Reset stores
    useCommandStore.setState({
      isLoading: false,
      error: null,
      clarification: null,
      commandHistory: [],
    });

    useGridStore.setState({
      cells: {
        A1: { id: 'A1', value: 'Test' },
        B1: { id: 'B1', value: 123 },
      },
      rowCount: 10,
      colCount: 3,
      editingCell: null,
      selectedCell: null,
    });

    useDiffStore.setState({
      pendingOperations: [],
      description: null,
    });

    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should set isLoading to true when sendCommand is called', async () => {
    // Mock fetch to delay response
    (globalThis.fetch as any).mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(
            () =>
              resolve({
                ok: true,
                json: async () => ({
                  operations: [],
                  description: 'Test',
                }),
              }),
            100
          )
        )
    );

    const { result } = renderHook(() => useCommandStore());

    act(() => {
      result.current.sendCommand('Test command');
    });

    // Should be loading immediately
    expect(result.current.isLoading).toBe(true);
  });

  it('should send operations to diffStore on success', async () => {
    const mockOperations = [
      { type: 'SET_VALUE', cellId: 'A1', value: 456 },
    ];

    (globalThis.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({
        operations: mockOperations,
        description: 'Value set',
      }),
    });

    const { result } = renderHook(() => useCommandStore());

    await act(async () => {
      await result.current.sendCommand('Set A1 to 456');
    });

    // Should not be loading after response
    expect(result.current.isLoading).toBe(false);

    // Should send operations to diffStore
    const diffState = useDiffStore.getState();
    expect(diffState.pendingOperations).toEqual(mockOperations);
    expect(diffState.description).toBe('Value set');

    // Should add to command history
    expect(result.current.commandHistory).toContain('Set A1 to 456');
  });

  it('should store clarification when operations array is empty', async () => {
    (globalThis.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({
        operations: [],
        clarification: 'Pouvez-vous préciser quelle colonne?',
      }),
    });

    const { result } = renderHook(() => useCommandStore());

    await act(async () => {
      await result.current.sendCommand('Trie les données');
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.clarification).toBe(
      'Pouvez-vous préciser quelle colonne?'
    );

    // Should NOT send to diffStore
    const diffState = useDiffStore.getState();
    expect(diffState.pendingOperations).toEqual([]);
  });

  it('should store error on HTTP error response', async () => {
    (globalThis.fetch as any).mockResolvedValue({
      ok: false,
      json: async () => ({
        error: 'Invalid command',
        code: 'INVALID_COMMAND',
      }),
    });

    const { result } = renderHook(() => useCommandStore());

    await act(async () => {
      await result.current.sendCommand('');
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toContain('Erreur');
    expect(result.current.error).toContain('Invalid command');
  });

  it('should store error on network error', async () => {
    (globalThis.fetch as any).mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useCommandStore());

    await act(async () => {
      await result.current.sendCommand('Test');
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBe(
      'Erreur réseau: impossible de contacter le serveur'
    );
  });

  it('should send GridMetadata with max 5 sample rows', async () => {
    // Set up 10 rows in gridStore
    const cells: Record<string, any> = {};
    for (let row = 1; row <= 10; row++) {
      cells[`A${row}`] = { id: `A${row}`, value: `Row${row}` };
    }

    useGridStore.setState({
      cells,
      rowCount: 10,
      colCount: 3,
      editingCell: null,
      selectedCell: null,
    });

    (globalThis.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({
        operations: [],
        description: 'Test',
      }),
    });

    const { result } = renderHook(() => useCommandStore());

    await act(async () => {
      await result.current.sendCommand('Test');
    });

    // Verify fetch was called with correct GridMetadata
    expect(globalThis.fetch).toHaveBeenCalled();
    const fetchCall = (globalThis.fetch as any).mock.calls[0];
    const requestBody = JSON.parse(fetchCall[1].body);

    expect(requestBody.gridContext.headers).toEqual(['A', 'B', 'C']);
    expect(requestBody.gridContext.rowCount).toBe(10);

    // Should only have max 5 sample rows
    expect(requestBody.gridContext.sampleRows.length).toBeLessThanOrEqual(5);
  });

  it('should clear error when clearError is called', () => {
    const { result } = renderHook(() => useCommandStore());

    act(() => {
      useCommandStore.setState({ error: 'Some error' });
    });

    expect(result.current.error).toBe('Some error');

    act(() => {
      result.current.clearError();
    });

    expect(result.current.error).toBeNull();
  });

  it('should clear clarification when clearClarification is called', () => {
    const { result } = renderHook(() => useCommandStore());

    act(() => {
      useCommandStore.setState({ clarification: 'Some clarification' });
    });

    expect(result.current.clarification).toBe('Some clarification');

    act(() => {
      result.current.clearClarification();
    });

    expect(result.current.clarification).toBeNull();
  });
});
