import { useCallback, useRef, useState } from 'react';
import { useGridStore } from '../../stores/gridStore';

export function GridHeader() {
  const headers = useGridStore((s) => s.headers);
  const colWidths = useGridStore((s) => s.colWidths);
  const setColWidth = useGridStore((s) => s.setColWidth);
  const setHeader = useGridStore((s) => s.setHeader);
  const dragRef = useRef<{ colIndex: number; startX: number; startWidth: number } | null>(null);
  const [editingCol, setEditingCol] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent, colIndex: number) => {
      e.preventDefault();
      const startWidth = colWidths[colIndex] ?? 100;
      dragRef.current = { colIndex, startX: e.clientX, startWidth };

      const handleMouseMove = (moveEvent: MouseEvent) => {
        if (!dragRef.current) return;
        const delta = moveEvent.clientX - dragRef.current.startX;
        setColWidth(dragRef.current.colIndex, dragRef.current.startWidth + delta);
      };

      const handleMouseUp = () => {
        dragRef.current = null;
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    },
    [colWidths, setColWidth]
  );

  const startEditingHeader = (colIndex: number) => {
    setEditingCol(colIndex);
    setEditValue(headers[colIndex]);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const saveHeader = () => {
    if (editingCol !== null) {
      const trimmed = editValue.trim();
      if (trimmed) {
        setHeader(editingCol, trimmed);
      }
      setEditingCol(null);
    }
  };

  const handleHeaderKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      saveHeader();
    } else if (e.key === 'Escape') {
      setEditingCol(null);
    }
  };

  return (
    <div className="flex">
      {headers.map((name, i) => (
        <div
          key={i}
          data-col-header={i}
          className="relative shrink-0 h-8 bg-gray-100 font-medium text-center text-sm border border-gray-200 leading-8"
          style={{ width: colWidths[i] ?? 100 }}
          onDoubleClick={() => startEditingHeader(i)}
        >
          {editingCol === i ? (
            <input
              ref={inputRef}
              type="text"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={saveHeader}
              onKeyDown={handleHeaderKeyDown}
              className="w-full h-full text-center text-sm font-medium outline-none border-2 border-blue-500 bg-white"
            />
          ) : (
            name
          )}
          {/* Resize handle */}
          <div
            className="absolute top-0 right-0 w-1.5 h-full cursor-col-resize hover:bg-blue-400 z-10"
            onMouseDown={(e) => handleMouseDown(e, i)}
          />
        </div>
      ))}
    </div>
  );
}
