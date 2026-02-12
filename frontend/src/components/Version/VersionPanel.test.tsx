// @vitest-environment happy-dom
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { VersionPanel } from './VersionPanel';
import { useVersionStore } from '../../stores/versionStore';
import type { Snapshot } from '../../types/version';

describe('VersionPanel', () => {
  beforeEach(() => {
    useVersionStore.setState({
      snapshots: [],
      isLoading: false,
    });
  });

  it('should not render when closed', () => {
    const { container } = render(<VersionPanel isOpen={false} onClose={() => {}} />);
    expect(container.firstChild).toBeNull();
  });

  it('should render when open', () => {
    render(<VersionPanel isOpen={true} onClose={() => {}} />);
    expect(screen.getByText('Historique des Versions')).toBeInTheDocument();
  });

  it('should display empty state when no snapshots', () => {
    useVersionStore.setState({ snapshots: [], isLoading: false });

    render(<VersionPanel isOpen={true} onClose={() => {}} />);
    expect(screen.getByText('Aucune version enregistrée')).toBeInTheDocument();
  });

  it('should display loading state', () => {
    useVersionStore.setState({ snapshots: [], isLoading: true });

    render(<VersionPanel isOpen={true} onClose={() => {}} />);
    expect(screen.getByText('Chargement...')).toBeInTheDocument();
  });

  it('should display snapshots in reverse chronological order', () => {
    const mockSnapshots: Snapshot[] = [
      {
        id: '1',
        timestamp: '2026-02-12T10:00:00.000Z',
        description: 'First snapshot',
        operations: [],
      },
      {
        id: '2',
        timestamp: '2026-02-12T11:00:00.000Z',
        description: 'Second snapshot',
        operations: [],
      },
    ];

    useVersionStore.setState({ snapshots: mockSnapshots, isLoading: false });

    render(<VersionPanel isOpen={true} onClose={() => {}} />);

    const descriptions = screen.getAllByText(/snapshot/i);
    // Most recent first
    expect(descriptions[0]).toHaveTextContent('Second snapshot');
    expect(descriptions[1]).toHaveTextContent('First snapshot');
  });

  it('should call onClose when close button is clicked', () => {
    const mockOnClose = vi.fn();

    render(<VersionPanel isOpen={true} onClose={mockOnClose} />);

    const closeButton = screen.getByLabelText('Fermer l\'historique');
    closeButton.click();

    expect(mockOnClose).toHaveBeenCalled();
  });
});
