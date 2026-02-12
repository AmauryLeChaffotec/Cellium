// @vitest-environment happy-dom
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDiffStore } from './diffStore';
import { useVersionStore } from './versionStore';
import { useGridStore } from './gridStore';
import * as versionPersistence from '../utils/versionPersistence';

vi.mock('../utils/versionPersistence', () => ({
  saveSnapshotToDB: vi.fn(() => Promise.resolve()),
  loadSnapshotsFromDB: vi.fn(() => Promise.resolve([])),
  clearSnapshotsFromDB: vi.fn(() => Promise.resolve()),
}));

describe('diffStore + versionStore Integration', () => {
  beforeEach(() => {
    useGridStore.setState({ cells: {}, rowCount: 100, colCount: 26, editingCell: null, selectedCell: null });
    useDiffStore.setState({ pendingOperations: [], description: null, diffPreview: null, isApplying: false, applyError: null });
    useVersionStore.setState({ snapshots: [], isLoading: false });
    vi.clearAllMocks();
  });

  it('should create snapshot automatically after validation', () => {
    const { result: diffResult } = renderHook(() => useDiffStore());
    const { result: versionResult } = renderHook(() => useVersionStore());

    // Set pending operations
    act(() => {
      diffResult.current.setPendingOperations(
        [{ type: 'SET_VALUE', cellId: 'A1', value: 42 }],
        'Ajout valeur A1'
      );
    });

    expect(versionResult.current.snapshots).toHaveLength(0);

    // Apply operations (validate)
    act(() => {
      diffResult.current.applyPendingOperations();
    });

    // Snapshot should be created
    expect(versionResult.current.snapshots).toHaveLength(1);
    expect(versionResult.current.snapshots[0].description).toBe('Ajout valeur A1');
    expect(versionResult.current.snapshots[0].operations).toEqual([
      { type: 'SET_VALUE', cellId: 'A1', value: 42 },
    ]);
    expect(versionPersistence.saveSnapshotToDB).toHaveBeenCalled();
  });

  it('should NOT create snapshot if validation fails', () => {
    const { result: diffResult } = renderHook(() => useDiffStore());
    const { result: versionResult } = renderHook(() => useVersionStore());

    // Set invalid operation that will throw
    act(() => {
      diffResult.current.setPendingOperations(
        [{ type: 'SET_VALUE', cellId: 'INVALID_ID', value: 42 }],
        'Invalid operation'
      );
    });

    // Apply operations (will throw)
    act(() => {
      diffResult.current.applyPendingOperations();
    });

    // Snapshot should NOT be created
    expect(versionResult.current.snapshots).toHaveLength(0);
    expect(versionPersistence.saveSnapshotToDB).not.toHaveBeenCalled();
  });

  it('should create multiple snapshots for sequential validations', () => {
    const { result: diffResult } = renderHook(() => useDiffStore());
    const { result: versionResult } = renderHook(() => useVersionStore());

    // First validation
    act(() => {
      diffResult.current.setPendingOperations(
        [{ type: 'SET_VALUE', cellId: 'A1', value: 10 }],
        'First operation'
      );
      diffResult.current.applyPendingOperations();
    });

    // Second validation
    act(() => {
      diffResult.current.setPendingOperations(
        [{ type: 'SET_VALUE', cellId: 'B1', value: 20 }],
        'Second operation'
      );
      diffResult.current.applyPendingOperations();
    });

    // Two distinct snapshots
    expect(versionResult.current.snapshots).toHaveLength(2);
    expect(versionResult.current.snapshots[0].description).toBe('First operation');
    expect(versionResult.current.snapshots[1].description).toBe('Second operation');
    // Verify distinct snapshots by checking IDs (timestamps may be equal if tests run fast)
    expect(versionResult.current.snapshots[0].id).not.toBe(
      versionResult.current.snapshots[1].id
    );
  });
});
