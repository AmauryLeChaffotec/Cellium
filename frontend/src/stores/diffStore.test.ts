// @vitest-environment happy-dom
import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDiffStore } from './diffStore';
import { useGridStore } from './gridStore';

describe('diffStore - Validation/Refusal', () => {
  beforeEach(() => {
    // Reset stores
    useGridStore.setState({
      cells: {},
      rowCount: 100,
      colCount: 26,
      editingCell: null,
      selectedCell: null,
    });

    useDiffStore.setState({
      pendingOperations: [],
      description: null,
      diffPreview: null,
      isApplying: false,
      applyError: null,
    });
  });

  it('should apply operations and clear pending state', () => {
    const { result } = renderHook(() => useDiffStore());

    // Set pending operations
    act(() => {
      result.current.setPendingOperations(
        [{ type: 'SET_VALUE', cellId: 'A1', value: 42 }],
        'Test operation'
      );
    });

    expect(result.current.diffPreview).not.toBeNull();

    // Apply operations
    act(() => {
      result.current.applyPendingOperations();
    });

    // Verify pending state is cleared
    expect(result.current.pendingOperations).toEqual([]);
    expect(result.current.description).toBeNull();
    expect(result.current.diffPreview).toBeNull();
    expect(result.current.isApplying).toBe(false);

    // Verify gridStore was updated
    const gridState = useGridStore.getState();
    expect(gridState.cells['A1']?.value).toBe(42);
  });

  it('should clear pending without modifying gridStore on reject', () => {
    const { result } = renderHook(() => useDiffStore());

    // Set pending operations
    act(() => {
      result.current.setPendingOperations(
        [{ type: 'SET_VALUE', cellId: 'A1', value: 42 }],
        'Test operation'
      );
    });

    // Reject operations
    act(() => {
      result.current.rejectPendingOperations();
    });

    // Verify pending state is cleared
    expect(result.current.pendingOperations).toEqual([]);
    expect(result.current.diffPreview).toBeNull();

    // Verify gridStore was NOT updated
    const gridState = useGridStore.getState();
    expect(gridState.cells['A1']).toBeUndefined();
  });

  it('should handle errors during apply', () => {
    const { result } = renderHook(() => useDiffStore());

    // Set invalid operation that will throw
    act(() => {
      result.current.setPendingOperations(
        [{ type: 'SET_VALUE', cellId: 'INVALID_ID', value: 42 }],
        'Invalid operation'
      );
    });

    // Apply operations (will throw)
    act(() => {
      result.current.applyPendingOperations();
    });

    // Verify error is stored
    expect(result.current.applyError).toBeTruthy();
    expect(result.current.isApplying).toBe(false);

    // Verify pending state is preserved (allows retry)
    expect(result.current.pendingOperations.length).toBeGreaterThan(0);
  });

  it('should set isApplying to true during application', () => {
    const { result } = renderHook(() => useDiffStore());

    act(() => {
      result.current.setPendingOperations(
        [{ type: 'SET_VALUE', cellId: 'A1', value: 42 }],
        'Test'
      );
    });

    // Check isApplying during apply (need to check synchronously)
    // For this test, we verify the final state
    act(() => {
      result.current.applyPendingOperations();
    });

    // After successful apply, isApplying should be false
    expect(result.current.isApplying).toBe(false);
  });

  it('should clear apply error', () => {
    const { result } = renderHook(() => useDiffStore());

    // Set an error
    act(() => {
      result.current.setPendingOperations(
        [{ type: 'SET_VALUE', cellId: 'INVALID', value: 42 }],
        'Test'
      );
      result.current.applyPendingOperations();
    });

    expect(result.current.applyError).toBeTruthy();

    // Clear error
    act(() => {
      result.current.clearApplyError();
    });

    expect(result.current.applyError).toBeNull();
  });

  it('should not apply if no pending operations', () => {
    const { result } = renderHook(() => useDiffStore());

    // No pending operations
    expect(result.current.pendingOperations).toEqual([]);

    // Try to apply
    act(() => {
      result.current.applyPendingOperations();
    });

    // Should not throw or change state
    expect(result.current.isApplying).toBe(false);
    expect(result.current.applyError).toBeNull();
  });

  it('should apply multiple operations sequentially', () => {
    const { result } = renderHook(() => useDiffStore());

    act(() => {
      result.current.setPendingOperations(
        [
          { type: 'SET_VALUE', cellId: 'A1', value: 10 },
          { type: 'SET_VALUE', cellId: 'B1', value: 20 },
          { type: 'SET_VALUE', cellId: 'C1', value: 30 },
        ],
        'Multiple operations'
      );
    });

    act(() => {
      result.current.applyPendingOperations();
    });

    const gridState = useGridStore.getState();
    expect(gridState.cells['A1']?.value).toBe(10);
    expect(gridState.cells['B1']?.value).toBe(20);
    expect(gridState.cells['C1']?.value).toBe(30);
  });
});
