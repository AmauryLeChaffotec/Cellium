// @vitest-environment happy-dom
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useVersionStore } from './versionStore';
import type { Operation } from '../types/operations';
import * as versionPersistence from '../utils/versionPersistence';

// Mock IndexedDB persistence
vi.mock('../utils/versionPersistence', () => ({
  saveSnapshotToDB: vi.fn(() => Promise.resolve()),
  loadSnapshotsFromDB: vi.fn(() => Promise.resolve([])),
  clearSnapshotsFromDB: vi.fn(() => Promise.resolve()),
}));

describe('versionStore', () => {
  beforeEach(() => {
    useVersionStore.setState({
      snapshots: [],
      isLoading: false,
    });
    vi.clearAllMocks();
  });

  it('should create snapshot with UUID, timestamp, and description', () => {
    const { result } = renderHook(() => useVersionStore());

    const operations: Operation[] = [{ type: 'SET_VALUE', cellId: 'A1', value: 42 }];
    const description = 'Test operation';

    act(() => {
      result.current.createSnapshot(operations, description);
    });

    expect(result.current.snapshots).toHaveLength(1);
    expect(result.current.snapshots[0]).toMatchObject({
      description: 'Test operation',
      operations,
    });
    expect(result.current.snapshots[0].id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
    expect(result.current.snapshots[0].timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    expect(versionPersistence.saveSnapshotToDB).toHaveBeenCalledWith(result.current.snapshots[0]);
  });

  it('should create multiple distinct snapshots', () => {
    const { result } = renderHook(() => useVersionStore());

    act(() => {
      result.current.createSnapshot([{ type: 'SET_VALUE', cellId: 'A1', value: 10 }] as Operation[], 'First');
      result.current.createSnapshot([{ type: 'SET_VALUE', cellId: 'B1', value: 20 }] as Operation[], 'Second');
    });

    expect(result.current.snapshots).toHaveLength(2);
    expect(result.current.snapshots[0].description).toBe('First');
    expect(result.current.snapshots[1].description).toBe('Second');
    expect(result.current.snapshots[0].id).not.toBe(result.current.snapshots[1].id);
  });

  it('should load snapshots from IndexedDB', async () => {
    const mockSnapshots = [
      {
        id: '1',
        timestamp: '2026-02-12T10:00:00.000Z',
        description: 'Snapshot 1',
        operations: [],
      },
    ];

    vi.mocked(versionPersistence.loadSnapshotsFromDB).mockResolvedValue(mockSnapshots);

    const { result } = renderHook(() => useVersionStore());

    await act(async () => {
      await result.current.loadSnapshots();
    });

    expect(result.current.snapshots).toEqual(mockSnapshots);
    expect(result.current.isLoading).toBe(false);
  });

  it('should clear all snapshots', () => {
    const { result } = renderHook(() => useVersionStore());

    act(() => {
      result.current.createSnapshot([{ type: 'SET_VALUE', cellId: 'A1', value: 10 }] as Operation[], 'Test');
    });

    expect(result.current.snapshots).toHaveLength(1);

    act(() => {
      result.current.clearSnapshots();
    });

    expect(result.current.snapshots).toEqual([]);
  });
});
