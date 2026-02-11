import { useEffect, useRef } from 'react';

export interface ContextMenuItem {
  label: string;
  action: () => void;
  separator?: boolean;
}

interface ContextMenuProps {
  x: number;
  y: number;
  items: ContextMenuItem[];
  onClose: () => void;
}

export function ContextMenu({ x, y, items, onClose }: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  return (
    <div
      ref={menuRef}
      data-testid="context-menu"
      className="fixed bg-white shadow-lg rounded-md border border-gray-200 py-1 z-50 min-w-[200px]"
      style={{ left: x, top: y }}
    >
      {items.map((item, idx) => (
        item.separator ? (
          <hr key={idx} className="border-t border-gray-200 my-1" />
        ) : (
          <button
            key={idx}
            className="w-full text-left px-3 py-1.5 text-sm hover:bg-blue-50 cursor-pointer"
            onClick={() => {
              item.action();
              onClose();
            }}
            data-testid={`context-menu-item-${idx}`}
          >
            {item.label}
          </button>
        )
      ))}
    </div>
  );
}
