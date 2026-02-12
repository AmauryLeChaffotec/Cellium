// @vitest-environment happy-dom
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DiffOverlay } from './DiffOverlay';
import { useDiffStore } from '../../stores/diffStore';
import type { DiffResult } from '../../types/diff';

describe('DiffOverlay', () => {
  beforeEach(() => {
    // Reset diffStore
    useDiffStore.setState({
      pendingOperations: [],
      description: null,
      diffPreview: null,
    });
  });

  it('should render nothing when no diff preview', () => {
    useDiffStore.setState({ diffPreview: null });
    const { container } = render(<DiffOverlay />);
    expect(container.firstChild).toBeNull();
  });

  it('should render additions in green', () => {
    const diffPreview: DiffResult = {
      additions: new Map([['A1', { cellId: 'A1', before: null, after: 42 }]]),
      modifications: new Map(),
      deletions: new Map(),
    };

    useDiffStore.setState({ diffPreview });
    render(<DiffOverlay />);

    const additionCell = screen.getByTestId('diff-cell-addition-A1');
    expect(additionCell).toBeInTheDocument();
    expect(additionCell).toHaveClass('bg-green-100');
    expect(additionCell).toHaveClass('border-green-400');
    expect(additionCell).toHaveTextContent('42');
  });

  it('should render modifications in orange', () => {
    const diffPreview: DiffResult = {
      additions: new Map(),
      modifications: new Map([['B2', { cellId: 'B2', before: 10, after: 20 }]]),
      deletions: new Map(),
    };

    useDiffStore.setState({ diffPreview });
    render(<DiffOverlay />);

    const modCell = screen.getByTestId('diff-cell-modification-B2');
    expect(modCell).toBeInTheDocument();
    expect(modCell).toHaveClass('bg-orange-100');
    expect(modCell).toHaveClass('border-orange-400');
    expect(modCell).toHaveTextContent('20');
  });

  it('should render deletions in red with strikethrough', () => {
    const diffPreview: DiffResult = {
      additions: new Map(),
      modifications: new Map(),
      deletions: new Map([['C3', { cellId: 'C3', before: 'Delete', after: null }]]),
    };

    useDiffStore.setState({ diffPreview });
    render(<DiffOverlay />);

    const delCell = screen.getByTestId('diff-cell-deletion-C3');
    expect(delCell).toBeInTheDocument();
    expect(delCell).toHaveClass('bg-red-100');
    expect(delCell).toHaveClass('border-red-400');
    expect(delCell).toHaveTextContent('Delete');

    // Check for line-through on the value span
    const valueSpan = delCell.querySelector('.line-through');
    expect(valueSpan).toBeInTheDocument();
  });

  it('should display icon for each type', () => {
    const diffPreview: DiffResult = {
      additions: new Map([['A1', { cellId: 'A1', before: null, after: 'new' }]]),
      modifications: new Map([['B2', { cellId: 'B2', before: 'old', after: 'modified' }]]),
      deletions: new Map([['C3', { cellId: 'C3', before: 'deleted', after: null }]]),
    };

    useDiffStore.setState({ diffPreview });
    render(<DiffOverlay />);

    const addCell = screen.getByTestId('diff-cell-addition-A1');
    const modCell = screen.getByTestId('diff-cell-modification-B2');
    const delCell = screen.getByTestId('diff-cell-deletion-C3');

    expect(addCell).toHaveTextContent('+');
    expect(modCell).toHaveTextContent('~');
    expect(delCell).toHaveTextContent('-');
  });

  it('should render multiple cells of different types', () => {
    const diffPreview: DiffResult = {
      additions: new Map([
        ['A1', { cellId: 'A1', before: null, after: 1 }],
        ['A2', { cellId: 'A2', before: null, after: 2 }],
      ]),
      modifications: new Map([['B1', { cellId: 'B1', before: 'old', after: 'new' }]]),
      deletions: new Map([['C1', { cellId: 'C1', before: 'del', after: null }]]),
    };

    useDiffStore.setState({ diffPreview });
    render(<DiffOverlay />);

    expect(screen.getByTestId('diff-cell-addition-A1')).toBeInTheDocument();
    expect(screen.getByTestId('diff-cell-addition-A2')).toBeInTheDocument();
    expect(screen.getByTestId('diff-cell-modification-B1')).toBeInTheDocument();
    expect(screen.getByTestId('diff-cell-deletion-C1')).toBeInTheDocument();
  });

  it('should show warning when more than 500 changes', () => {
    const additions = new Map();
    for (let i = 1; i <= 501; i++) {
      additions.set(`A${i}`, { cellId: `A${i}`, before: null, after: i });
    }

    const diffPreview: DiffResult = {
      additions,
      modifications: new Map(),
      deletions: new Map(),
    };

    useDiffStore.setState({ diffPreview });
    render(<DiffOverlay />);

    expect(screen.getByText(/Plus de 500 changements/i)).toBeInTheDocument();
  });

  it('should truncate long values in display', () => {
    const longValue = 'This is a very long value that should be truncated';
    const diffPreview: DiffResult = {
      additions: new Map([['A1', { cellId: 'A1', before: null, after: longValue }]]),
      modifications: new Map(),
      deletions: new Map(),
    };

    useDiffStore.setState({ diffPreview });
    render(<DiffOverlay />);

    const cell = screen.getByTestId('diff-cell-addition-A1');
    expect(cell.textContent).toContain('...');
    expect(cell.textContent!.length).toBeLessThan(longValue.length);
  });

  it('should have tooltip with change details', () => {
    const diffPreview: DiffResult = {
      additions: new Map(),
      modifications: new Map([['B2', { cellId: 'B2', before: 10, after: 20 }]]),
      deletions: new Map(),
    };

    useDiffStore.setState({ diffPreview });
    render(<DiffOverlay />);

    const modCell = screen.getByTestId('diff-cell-modification-B2');
    expect(modCell).toHaveAttribute('title', 'Modification: 10 → 20');
  });
});
