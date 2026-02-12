// @vitest-environment happy-dom
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useVersionStore } from './versionStore';
import { useGridStore } from './gridStore';
import type { Operation } from '../types/operations';

vi.mock('../utils/versionPersistence', () => ({
  saveSnapshotToDB: vi.fn(() => Promise.resolve()),
  loadSnapshotsFromDB: vi.fn(() => Promise.resolve([])),
  clearSnapshotsFromDB: vi.fn(() => Promise.resolve()),
}));

describe('versionStore - Restore', () => {
  beforeEach(() => {
    useGridStore.setState({ cells: {}, rowCount: 100, colCount: 26, editingCell: null, selectedCell: null });
    useVersionStore.setState({ snapshots: [], isLoading: false, isRestoring: false });
    vi.clearAllMocks();
  });

  it('should restore grid to a previous snapshot', () => {
    const { result: versionResult } = renderHook(() => useVersionStore());
    const { result: gridResult } = renderHook(() => useGridStore());

    // Create 3 snapshots
    act(() => {
      versionResult.current.createSnapshot(
        [{ type: 'SET_VALUE', cellId: 'A1', value: 10 }] as Operation[],
        'First'
      );
      versionResult.current.createSnapshot(
        [{ type: 'SET_VALUE', cellId: 'B1', value: 20 }] as Operation[],
        'Second'
      );
      versionResult.current.createSnapshot(
        [{ type: 'SET_VALUE', cellId: 'C1', value: 30 }] as Operation[],
        'Third'
      );
    });

    expect(versionResult.current.snapshots).toHaveLength(3);

    // Apply all operations to simulate current state
    act(() => {
      gridResult.current.setCell('A1', 10);
      gridResult.current.setCell('B1', 20);
      gridResult.current.setCell('C1', 30);
    });

    // Restore to snapshot 1 (First + Second)
    const snapshot1Id = versionResult.current.snapshots[1].id;
    act(() => {
      versionResult.current.restoreFromSnapshot(snapshot1Id);
    });

    // Grid should have A1=10, B1=20, but NOT C1
    const gridState = useGridStore.getState();
    expect(gridState.cells['A1']?.value).toBe(10);
    expect(gridState.cells['B1']?.value).toBe(20);
    expect(gridState.cells['C1']).toBeUndefined();

    // A new restoration snapshot should be created
    expect(versionResult.current.snapshots).toHaveLength(4);
    expect(versionResult.current.snapshots[3].description).toMatch(/Restauration/);
  });

  it('should set isRestoring during restoration', () => {
    const { result } = renderHook(() => useVersionStore());

    act(() => {
      result.current.createSnapshot(
        [{ type: 'SET_VALUE', cellId: 'A1', value: 10 }] as Operation[],
        'Test'
      );
    });

    const snapshotId = result.current.snapshots[0].id;

    act(() => {
      result.current.restoreFromSnapshot(snapshotId);
    });

    // After restoration completes, isRestoring should be false
    expect(result.current.isRestoring).toBe(false);
  });

  it('should handle restore of non-existent snapshot', () => {
    const { result } = renderHook(() => useVersionStore());
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    act(() => {
      result.current.restoreFromSnapshot('non-existent-id');
    });

    expect(consoleErrorSpy).toHaveBeenCalledWith('Snapshot not found:', 'non-existent-id');
    expect(result.current.isRestoring).toBe(false);

    consoleErrorSpy.mockRestore();
  });

  it('should preserve history after restoration (NFR18)', () => {
    const { result } = renderHook(() => useVersionStore());

    // Create 2 snapshots
    act(() => {
      result.current.createSnapshot(
        [{ type: 'SET_VALUE', cellId: 'A1', value: 10 }] as Operation[],
        'First'
      );
      result.current.createSnapshot(
        [{ type: 'SET_VALUE', cellId: 'B1', value: 20 }] as Operation[],
        'Second'
      );
    });

    const originalSnapshotCount = result.current.snapshots.length;

    // Restore to first snapshot
    const snapshot0Id = result.current.snapshots[0].id;
    act(() => {
      result.current.restoreFromSnapshot(snapshot0Id);
    });

    // Original snapshots should still exist + 1 new restoration snapshot
    expect(result.current.snapshots).toHaveLength(originalSnapshotCount + 1);
    expect(result.current.snapshots[0].description).toBe('First');
    expect(result.current.snapshots[1].description).toBe('Second');
    expect(result.current.snapshots[2].description).toMatch(/Restauration/);
  });
});
