// @vitest-environment happy-dom
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useKeyboardShortcuts } from './useKeyboardShortcuts';
import { useDiffStore } from '../stores/diffStore';
import type { DiffResult } from '../types/diff';

describe('useKeyboardShortcuts', () => {
  beforeEach(() => {
    useDiffStore.setState({
      pendingOperations: [],
      description: null,
      diffPreview: null,
      isApplying: false,
      applyError: null,
    });
  });

  it('should call clearPending on Escape key', () => {
    const mockClearPending = vi.fn();

    const diffPreview: DiffResult = {
      additions: new Map([['A1', { cellId: 'A1', before: null, after: 42 }]]),
      modifications: new Map(),
      deletions: new Map(),
    };

    useDiffStore.setState({
      diffPreview,
    });

    // Mock clearPending
    const originalClear = useDiffStore.getState().clearPending;
    useDiffStore.getState().clearPending = mockClearPending;

    renderHook(() => useKeyboardShortcuts());

    // Simulate Escape key
    const event = new KeyboardEvent('keydown', { key: 'Escape' });
    window.dispatchEvent(event);

    expect(mockClearPending).toHaveBeenCalled();

    // Restore
    useDiffStore.getState().clearPending = originalClear;
  });

  it('should call applyPendingOperations on Ctrl+Enter', () => {
    const mockApply = vi.fn();

    const diffPreview: DiffResult = {
      additions: new Map([['A1', { cellId: 'A1', before: null, after: 42 }]]),
      modifications: new Map(),
      deletions: new Map(),
    };

    useDiffStore.setState({
      diffPreview,
    });

    // Mock applyPendingOperations
    const originalApply = useDiffStore.getState().applyPendingOperations;
    useDiffStore.getState().applyPendingOperations = mockApply;

    renderHook(() => useKeyboardShortcuts());

    // Simulate Ctrl+Enter
    const event = new KeyboardEvent('keydown', { key: 'Enter', ctrlKey: true });
    window.dispatchEvent(event);

    expect(mockApply).toHaveBeenCalled();

    // Restore
    useDiffStore.getState().applyPendingOperations = originalApply;
  });

  it('should call applyPendingOperations on Cmd+Enter (Mac)', () => {
    const mockApply = vi.fn();

    const diffPreview: DiffResult = {
      additions: new Map([['A1', { cellId: 'A1', before: null, after: 42 }]]),
      modifications: new Map(),
      deletions: new Map(),
    };

    useDiffStore.setState({
      diffPreview,
    });

    // Mock applyPendingOperations
    const originalApply = useDiffStore.getState().applyPendingOperations;
    useDiffStore.getState().applyPendingOperations = mockApply;

    renderHook(() => useKeyboardShortcuts());

    // Simulate Cmd+Enter
    const event = new KeyboardEvent('keydown', { key: 'Enter', metaKey: true });
    window.dispatchEvent(event);

    expect(mockApply).toHaveBeenCalled();

    // Restore
    useDiffStore.getState().applyPendingOperations = originalApply;
  });

  it('should not trigger shortcuts when no diff preview', () => {
    const mockApply = vi.fn();
    const mockClear = vi.fn();

    useDiffStore.setState({
      diffPreview: null,
    });

    // Mock actions
    useDiffStore.getState().applyPendingOperations = mockApply;
    useDiffStore.getState().clearPending = mockClear;

    renderHook(() => useKeyboardShortcuts());

    // Simulate keys
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', ctrlKey: true }));

    expect(mockApply).not.toHaveBeenCalled();
    expect(mockClear).not.toHaveBeenCalled();
  });

  it('should not trigger shortcuts when isApplying is true', () => {
    const mockApply = vi.fn();
    const mockClear = vi.fn();

    const diffPreview: DiffResult = {
      additions: new Map([['A1', { cellId: 'A1', before: null, after: 42 }]]),
      modifications: new Map(),
      deletions: new Map(),
    };

    useDiffStore.setState({
      diffPreview,
      isApplying: true,
    });

    // Mock actions
    useDiffStore.getState().applyPendingOperations = mockApply;
    useDiffStore.getState().clearPending = mockClear;

    renderHook(() => useKeyboardShortcuts());

    // Simulate keys
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', ctrlKey: true }));

    expect(mockApply).not.toHaveBeenCalled();
    expect(mockClear).not.toHaveBeenCalled();
  });
});
