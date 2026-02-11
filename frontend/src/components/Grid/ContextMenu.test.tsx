// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ContextMenu } from './ContextMenu';
import type { ContextMenuItem } from './ContextMenu';

describe('ContextMenu', () => {
  const mockClose = vi.fn();
  let items: ContextMenuItem[];

  beforeEach(() => {
    mockClose.mockClear();
    items = [
      { label: 'Action 1', action: vi.fn() },
      { label: 'Action 2', action: vi.fn() },
    ];
  });

  it('should render menu items', () => {
    render(<ContextMenu x={100} y={200} items={items} onClose={mockClose} />);
    expect(screen.getByText('Action 1')).toBeInTheDocument();
    expect(screen.getByText('Action 2')).toBeInTheDocument();
  });

  it('should be positioned at the specified coordinates', () => {
    render(<ContextMenu x={100} y={200} items={items} onClose={mockClose} />);
    const menu = screen.getByTestId('context-menu');
    expect(menu.style.left).toBe('100px');
    expect(menu.style.top).toBe('200px');
  });

  it('should call action and close when item clicked', () => {
    render(<ContextMenu x={0} y={0} items={items} onClose={mockClose} />);
    fireEvent.click(screen.getByText('Action 1'));
    expect(items[0].action).toHaveBeenCalled();
    expect(mockClose).toHaveBeenCalled();
  });

  it('should close on Escape key', () => {
    render(<ContextMenu x={0} y={0} items={items} onClose={mockClose} />);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(mockClose).toHaveBeenCalled();
  });

  it('should close on outside click', () => {
    render(
      <div>
        <div data-testid="outside">Outside</div>
        <ContextMenu x={0} y={0} items={items} onClose={mockClose} />
      </div>
    );
    fireEvent.mouseDown(screen.getByTestId('outside'));
    expect(mockClose).toHaveBeenCalled();
  });

  it('should render separator', () => {
    const itemsWithSep: ContextMenuItem[] = [
      { label: 'A', action: vi.fn() },
      { label: '', action: vi.fn(), separator: true },
      { label: 'B', action: vi.fn() },
    ];
    render(<ContextMenu x={0} y={0} items={itemsWithSep} onClose={mockClose} />);
    const menu = screen.getByTestId('context-menu');
    expect(menu.querySelector('hr')).toBeInTheDocument();
  });
});
