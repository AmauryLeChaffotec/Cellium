// @vitest-environment happy-dom
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { VersionItem } from './VersionItem';
import { useVersionStore } from '../../stores/versionStore';
import type { Snapshot } from '../../types/version';
import type { Operation } from '../../types/operations';

describe('VersionItem', () => {
  it('should display snapshot description', () => {
    const mockSnapshot: Snapshot = {
      id: '1',
      timestamp: '2026-02-12T14:30:00.000Z',
      description: 'Ajout colonne Total',
      operations: [{ type: 'INSERT_COLUMN', afterCol: 'C', header: 'Total', cells: [] }] as Operation[],
    };

    render(<VersionItem snapshot={mockSnapshot} />);
    expect(screen.getByText('Ajout colonne Total')).toBeInTheDocument();
  });

  it('should display formatted timestamp', () => {
    const mockSnapshot: Snapshot = {
      id: '1',
      timestamp: '2026-02-12T14:30:00.000Z',
      description: 'Test',
      operations: [],
    };

    render(<VersionItem snapshot={mockSnapshot} />);
    // Check for date components (day, month, year, time format)
    // Note: Time will vary based on timezone, so just check for time format HH:MM
    expect(screen.getByText(/12.*février.*2026.*à.*\d{2}:\d{2}/i)).toBeInTheDocument();
  });

  it('should display operations count (singular)', () => {
    const mockSnapshot: Snapshot = {
      id: '1',
      timestamp: '2026-02-12T14:30:00.000Z',
      description: 'Test',
      operations: [{ type: 'SET_VALUE', cellId: 'A1', value: 42 }] as Operation[],
    };

    render(<VersionItem snapshot={mockSnapshot} />);
    expect(screen.getByText('1 opération')).toBeInTheDocument();
  });

  it('should display operations count (plural)', () => {
    const mockSnapshot: Snapshot = {
      id: '1',
      timestamp: '2026-02-12T14:30:00.000Z',
      description: 'Test',
      operations: [
        { type: 'SET_VALUE', cellId: 'A1', value: 10 },
        { type: 'SET_VALUE', cellId: 'B1', value: 20 },
      ] as Operation[],
    };

    render(<VersionItem snapshot={mockSnapshot} />);
    expect(screen.getByText('2 opérations')).toBeInTheDocument();
  });

  it('should display restore button', () => {
    const mockSnapshot: Snapshot = {
      id: '1',
      timestamp: '2026-02-12T14:30:00.000Z',
      description: 'Test',
      operations: [],
    };

    useVersionStore.setState({ snapshots: [mockSnapshot], isLoading: false, isRestoring: false });

    render(<VersionItem snapshot={mockSnapshot} />);
    expect(screen.getByText('Restaurer')).toBeInTheDocument();
  });

  it('should call restoreFromSnapshot when restore button is clicked', () => {
    const mockSnapshot: Snapshot = {
      id: '1',
      timestamp: '2026-02-12T14:30:00.000Z',
      description: 'Test',
      operations: [],
    };

    useVersionStore.setState({ snapshots: [mockSnapshot], isLoading: false, isRestoring: false });

    const mockRestore = vi.fn();
    useVersionStore.getState().restoreFromSnapshot = mockRestore;

    render(<VersionItem snapshot={mockSnapshot} />);

    const restoreButton = screen.getByText('Restaurer');
    restoreButton.click();

    expect(mockRestore).toHaveBeenCalledWith('1');
  });

  it('should disable restore button when isRestoring is true', () => {
    const mockSnapshot: Snapshot = {
      id: '1',
      timestamp: '2026-02-12T14:30:00.000Z',
      description: 'Test',
      operations: [],
    };

    useVersionStore.setState({ snapshots: [mockSnapshot], isLoading: false, isRestoring: true });

    render(<VersionItem snapshot={mockSnapshot} />);

    const restoreButton = screen.getByText('Restauration...') as HTMLButtonElement;
    expect(restoreButton.disabled).toBe(true);
  });
});
