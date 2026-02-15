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
      className="fixed bg-white/95 backdrop-blur-lg shadow-xl shadow-gray-200/50 rounded-xl border border-gray-200/80 py-1.5 z-50 min-w-[220px]"
      style={{ left: x, top: y }}
    >
      {items.map((item, idx) => (
        item.separator ? (
          <hr key={idx} className="border-t border-gray-100 my-1 mx-2" />
        ) : item.children ? (
          <div
            key={idx}
            className="relative"
            onMouseEnter={() => setOpenSubIdx(idx)}
            onMouseLeave={() => setOpenSubIdx(null)}
          >
            <button
              className="w-full text-left px-3 py-1.5 text-[13px] text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 cursor-pointer flex items-center justify-between rounded-md mx-1 pr-2"
              style={{ width: 'calc(100% - 8px)' }}
              data-testid={`context-menu-item-${idx}`}
            >
              <span>{item.label}</span>
              <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </button>
            {openSubIdx === idx && (
              <div className="absolute left-full top-0 bg-white/95 backdrop-blur-lg shadow-xl shadow-gray-200/50 rounded-xl border border-gray-200/80 py-1.5 min-w-[170px] z-50 -ml-1">
                {item.children.map((child, childIdx) => (
                  child.separator ? (
                    <hr key={childIdx} className="border-t border-gray-100 my-1 mx-2" />
                  ) : (
                    <button
                      key={childIdx}
                      className="w-full text-left px-3 py-1.5 text-[13px] text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 cursor-pointer rounded-md mx-1"
                      style={{ width: 'calc(100% - 8px)' }}
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
            className="w-full text-left px-3 py-1.5 text-[13px] text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 cursor-pointer rounded-md mx-1"
            style={{ width: 'calc(100% - 8px)' }}
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
