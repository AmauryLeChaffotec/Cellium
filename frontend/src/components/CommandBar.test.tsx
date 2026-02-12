// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { CommandBar } from './CommandBar';
import { useCommandStore } from '../stores/commandStore';

describe('CommandBar', () => {
  beforeEach(() => {
    // Reset command store
    useCommandStore.setState({
      isLoading: false,
      error: null,
      clarification: null,
      commandHistory: [],
    });

    // Mock sendCommand
    vi.spyOn(useCommandStore.getState(), 'sendCommand').mockResolvedValue();
  });

  it('should render input and submit button', () => {
    render(<CommandBar />);

    expect(
      screen.getByPlaceholderText('Décrivez ce que vous voulez faire...')
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /envoyer/i })).toBeInTheDocument();
  });

  it('should update input value when typing', async () => {
    const user = userEvent.setup();
    render(<CommandBar />);

    const input = screen.getByPlaceholderText(
      'Décrivez ce que vous voulez faire...'
    ) as HTMLInputElement;

    await user.type(input, 'Test command');

    expect(input.value).toBe('Test command');
  });

  it('should call sendCommand when clicking submit button', async () => {
    const user = userEvent.setup();
    const mockSendCommand = vi.fn().mockResolvedValue(undefined);
    useCommandStore.setState({ sendCommand: mockSendCommand });

    render(<CommandBar />);

    const input = screen.getByPlaceholderText(
      'Décrivez ce que vous voulez faire...'
    );
    const button = screen.getByRole('button', { name: /envoyer/i });

    await user.type(input, 'Set A1 to 100');
    await user.click(button);

    await waitFor(() => {
      expect(mockSendCommand).toHaveBeenCalledWith('Set A1 to 100');
    });
  });

  it('should call sendCommand when pressing Enter', async () => {
    const user = userEvent.setup();
    const mockSendCommand = vi.fn().mockResolvedValue(undefined);
    useCommandStore.setState({ sendCommand: mockSendCommand });

    render(<CommandBar />);

    const input = screen.getByPlaceholderText(
      'Décrivez ce que vous voulez faire...'
    );

    await user.type(input, 'Delete row 5{Enter}');

    await waitFor(() => {
      expect(mockSendCommand).toHaveBeenCalledWith('Delete row 5');
    });
  });

  it('should clear input after successful submit', async () => {
    const user = userEvent.setup();
    const mockSendCommand = vi.fn().mockResolvedValue(undefined);
    useCommandStore.setState({ sendCommand: mockSendCommand });

    render(<CommandBar />);

    const input = screen.getByPlaceholderText(
      'Décrivez ce que vous voulez faire...'
    ) as HTMLInputElement;
    const button = screen.getByRole('button', { name: /envoyer/i });

    await user.type(input, 'Test');
    await user.click(button);

    await waitFor(() => {
      expect(input.value).toBe('');
    });
  });

  it('should disable input and button when loading', () => {
    useCommandStore.setState({ isLoading: true });

    render(<CommandBar />);

    const input = screen.getByPlaceholderText(
      'Décrivez ce que vous voulez faire...'
    );
    const button = screen.getByRole('button', { name: /traitement/i });

    expect(input).toBeDisabled();
    expect(button).toBeDisabled();
  });

  it('should show spinner when loading', () => {
    useCommandStore.setState({ isLoading: true });

    render(<CommandBar />);

    expect(screen.getByText('Traitement...')).toBeInTheDocument();
    expect(screen.queryByText('Envoyer')).not.toBeInTheDocument();
  });

  it('should display error message when error exists', () => {
    useCommandStore.setState({ error: 'Erreur: commande invalide' });

    render(<CommandBar />);

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Erreur: commande invalide'
    );
  });

  it('should clear error when clicking close button', async () => {
    const user = userEvent.setup();
    const mockClearError = vi.fn();
    useCommandStore.setState({
      error: 'Some error',
      clearError: mockClearError,
    });

    render(<CommandBar />);

    const closeButton = screen.getByRole('button', {
      name: /fermer l'erreur/i,
    });
    await user.click(closeButton);

    expect(mockClearError).toHaveBeenCalled();
  });

  it('should display clarification message when clarification exists', () => {
    useCommandStore.setState({
      clarification: 'Pouvez-vous préciser quelle colonne?',
    });

    render(<CommandBar />);

    expect(screen.getByRole('status')).toHaveTextContent(
      'Pouvez-vous préciser quelle colonne?'
    );
  });

  it('should clear clarification when clicking close button', async () => {
    const user = userEvent.setup();
    const mockClearClarification = vi.fn();
    useCommandStore.setState({
      clarification: 'Some clarification',
      clearClarification: mockClearClarification,
    });

    render(<CommandBar />);

    const closeButton = screen.getByRole('button', {
      name: /fermer la clarification/i,
    });
    await user.click(closeButton);

    expect(mockClearClarification).toHaveBeenCalled();
  });

  it('should clear error when user starts typing', async () => {
    const user = userEvent.setup();
    const mockClearError = vi.fn();
    useCommandStore.setState({
      error: 'Some error',
      clearError: mockClearError,
    });

    render(<CommandBar />);

    const input = screen.getByPlaceholderText(
      'Décrivez ce que vous voulez faire...'
    );
    await user.type(input, 'a');

    expect(mockClearError).toHaveBeenCalled();
  });

  it('should clear clarification when user starts typing', async () => {
    const user = userEvent.setup();
    const mockClearClarification = vi.fn();
    useCommandStore.setState({
      clarification: 'Some clarification',
      clearClarification: mockClearClarification,
    });

    render(<CommandBar />);

    const input = screen.getByPlaceholderText(
      'Décrivez ce que vous voulez faire...'
    );
    await user.type(input, 'a');

    expect(mockClearClarification).toHaveBeenCalled();
  });

  it('should not submit when input is empty', async () => {
    const user = userEvent.setup();
    const mockSendCommand = vi.fn();
    useCommandStore.setState({ sendCommand: mockSendCommand });

    render(<CommandBar />);

    const button = screen.getByRole('button', { name: /envoyer/i });

    expect(button).toBeDisabled();

    await user.click(button);

    expect(mockSendCommand).not.toHaveBeenCalled();
  });

  it('should not submit when input contains only whitespace', async () => {
    const user = userEvent.setup();
    const mockSendCommand = vi.fn();
    useCommandStore.setState({ sendCommand: mockSendCommand });

    render(<CommandBar />);

    const input = screen.getByPlaceholderText(
      'Décrivez ce que vous voulez faire...'
    );
    const button = screen.getByRole('button', { name: /envoyer/i });

    await user.type(input, '   ');
    await user.click(button);

    expect(mockSendCommand).not.toHaveBeenCalled();
  });
});
