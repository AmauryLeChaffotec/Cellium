import { useEffect, useRef, useState } from 'react';

export interface ContextMenuItem {
  label: string;
  action: () => void;
  separator?: boolean;
  children?: ContextMenuItem[];
}

interface ContextMenuProps {
  x: number;
  y: number;
  items: ContextMenuItem[];
  onClose: () => void;
}

export function ContextMenu({ x, y, items, onClose }: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [openSubIdx, setOpenSubIdx] = useState<number | null>(null);

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
        ) : item.children ? (
          <div
            key={idx}
            className="relative"
            onMouseEnter={() => setOpenSubIdx(idx)}
            onMouseLeave={() => setOpenSubIdx(null)}
          >
            <button
              className="w-full text-left px-3 py-1.5 text-sm hover:bg-blue-50 cursor-pointer flex items-center justify-between"
              data-testid={`context-menu-item-${idx}`}
            >
              <span>{item.label}</span>
              <span className="text-gray-400 ml-2">&#x25B6;</span>
            </button>
            {openSubIdx === idx && (
              <div className="absolute left-full top-0 bg-white shadow-lg rounded-md border border-gray-200 py-1 min-w-[160px] z-50">
                {item.children.map((child, childIdx) => (
                  child.separator ? (
                    <hr key={childIdx} className="border-t border-gray-200 my-1" />
                  ) : (
                    <button
                      key={childIdx}
                      className="w-full text-left px-3 py-1.5 text-sm hover:bg-blue-50 cursor-pointer"
                      onClick={() => {
                        child.action();
                        onClose();
                      }}
                    >
                      {child.label}
                    </button>
                  )
                ))}
              </div>
            )}
          </div>
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
