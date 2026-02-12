// @vitest-environment happy-dom
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ActionBar } from './ActionBar';
import { useDiffStore } from '../../stores/diffStore';
import type { DiffResult } from '../../types/diff';

describe('ActionBar', () => {
  beforeEach(() => {
    useDiffStore.setState({
      pendingOperations: [],
      description: null,
      diffPreview: null,
      isApplying: false,
      applyError: null,
    });
  });

  it('should not render when no diff preview', () => {
    useDiffStore.setState({ diffPreview: null });
    const { container } = render(<ActionBar />);
    expect(container.firstChild).toBeNull();
  });

  it('should render with summary and buttons when diff preview exists', () => {
    const diffPreview: DiffResult = {
      additions: new Map([['A1', { cellId: 'A1', before: null, after: 42 }]]),
      modifications: new Map([['B2', { cellId: 'B2', before: 10, after: 20 }]]),
      deletions: new Map([['C3', { cellId: 'C3', before: 'del', after: null }]]),
    };

    useDiffStore.setState({
      diffPreview,
      description: 'Test operation',
    });

    render(<ActionBar />);

    expect(screen.getByText('Test operation')).toBeInTheDocument();
    expect(screen.getByText(/1 ajout, 1 modification, 1 suppression/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /valider/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /refuser/i })).toBeInTheDocument();
  });

  it('should call applyPendingOperations when clicking Valider', async () => {
    const user = userEvent.setup();
    const mockApply = vi.fn();

    const diffPreview: DiffResult = {
      additions: new Map([['A1', { cellId: 'A1', before: null, after: 42 }]]),
      modifications: new Map(),
      deletions: new Map(),
    };

    useDiffStore.setState({
      diffPreview,
      description: 'Test',
    });

    // Mock the action
    const originalApply = useDiffStore.getState().applyPendingOperations;
    useDiffStore.getState().applyPendingOperations = mockApply;

    render(<ActionBar />);

    const validateButton = screen.getByTestId('validate-button');
    await user.click(validateButton);

    expect(mockApply).toHaveBeenCalled();

    // Restore
    useDiffStore.getState().applyPendingOperations = originalApply;
  });

  it('should call rejectPendingOperations when clicking Refuser', async () => {
    const user = userEvent.setup();
    const mockReject = vi.fn();

    const diffPreview: DiffResult = {
      additions: new Map([['A1', { cellId: 'A1', before: null, after: 42 }]]),
      modifications: new Map(),
      deletions: new Map(),
    };

    useDiffStore.setState({
      diffPreview,
      description: 'Test',
    });

    // Mock the action
    const originalReject = useDiffStore.getState().rejectPendingOperations;
    useDiffStore.getState().rejectPendingOperations = mockReject;

    render(<ActionBar />);

    const rejectButton = screen.getByTestId('reject-button');
    await user.click(rejectButton);

    expect(mockReject).toHaveBeenCalled();

    // Restore
    useDiffStore.getState().rejectPendingOperations = originalReject;
  });

  it('should disable buttons when applying', () => {
    const diffPreview: DiffResult = {
      additions: new Map([['A1', { cellId: 'A1', before: null, after: 42 }]]),
      modifications: new Map(),
      deletions: new Map(),
    };

    useDiffStore.setState({
      diffPreview,
      description: 'Test',
      isApplying: true,
    });

    render(<ActionBar />);

    const validateButton = screen.getByTestId('validate-button');
    const rejectButton = screen.getByTestId('reject-button');

    expect(validateButton).toBeDisabled();
    expect(rejectButton).toBeDisabled();
    expect(validateButton).toHaveTextContent('Application...');
  });

  it('should display error message', () => {
    const diffPreview: DiffResult = {
      additions: new Map([['A1', { cellId: 'A1', before: null, after: 42 }]]),
      modifications: new Map(),
      deletions: new Map(),
    };

    useDiffStore.setState({
      diffPreview,
      description: 'Test',
      applyError: 'Test error message',
    });

    render(<ActionBar />);

    expect(screen.getByRole('alert')).toHaveTextContent('Test error message');
  });

  it('should dismiss error when clicking close button', async () => {
    const user = userEvent.setup();
    const mockClearError = vi.fn();

    const diffPreview: DiffResult = {
      additions: new Map([['A1', { cellId: 'A1', before: null, after: 42 }]]),
      modifications: new Map(),
      deletions: new Map(),
    };

    useDiffStore.setState({
      diffPreview,
      description: 'Test',
      applyError: 'Test error',
    });

    // Mock the action
    const originalClear = useDiffStore.getState().clearApplyError;
    useDiffStore.getState().clearApplyError = mockClearError;

    render(<ActionBar />);

    const closeButton = screen.getByTestId('clear-error-button');
    await user.click(closeButton);

    expect(mockClearError).toHaveBeenCalled();

    // Restore
    useDiffStore.getState().clearApplyError = originalClear;
  });

  it('should handle plural forms correctly', () => {
    const diffPreview: DiffResult = {
      additions: new Map([
        ['A1', { cellId: 'A1', before: null, after: 1 }],
        ['A2', { cellId: 'A2', before: null, after: 2 }],
      ]),
      modifications: new Map([['B1', { cellId: 'B1', before: 10, after: 20 }]]),
      deletions: new Map(),
    };

    useDiffStore.setState({
      diffPreview,
      description: 'Test',
    });

    render(<ActionBar />);

    expect(screen.getByText(/2 ajouts, 1 modification, 0 suppression/)).toBeInTheDocument();
  });
});
