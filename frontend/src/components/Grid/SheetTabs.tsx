import { useState, useRef, useEffect, useCallback } from 'react';
import { useGridStore } from '../../stores/gridStore';

export function SheetTabs() {
  const sheets = useGridStore((s) => s.sheets);
  const activeSheetIndex = useGridStore((s) => s.activeSheetIndex);
  const switchSheet = useGridStore((s) => s.switchSheet);
  const addSheet = useGridStore((s) => s.addSheet);
  const deleteSheet = useGridStore((s) => s.deleteSheet);
  const renameSheet = useGridStore((s) => s.renameSheet);
  const duplicateSheet = useGridStore((s) => s.duplicateSheet);

  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; index: number } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingIndex !== null && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingIndex]);

  // Close context menu on click outside
  useEffect(() => {
    if (!contextMenu) return;
    const handler = () => setContextMenu(null);
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, [contextMenu]);

  const startRename = useCallback((index: number) => {
    setEditingIndex(index);
    setEditName(sheets[index].name);
    setContextMenu(null);
  }, [sheets]);

  const commitRename = useCallback(() => {
    if (editingIndex !== null && editName.trim()) {
      renameSheet(editingIndex, editName.trim());
    }
    setEditingIndex(null);
  }, [editingIndex, editName, renameSheet]);

  const handleContextMenu = useCallback((e: React.MouseEvent, index: number) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, index });
  }, []);

  return (
    <div className="flex items-center bg-gray-100 border-t border-gray-200 px-1 py-0.5 shrink-0 gap-0.5 overflow-x-auto">
      {sheets.map((sheet, i) => (
        <div
          key={i}
          className={`relative flex items-center gap-1 px-3 py-1 text-xs font-medium cursor-pointer rounded-t select-none whitespace-nowrap transition-colors ${
            i === activeSheetIndex
              ? 'bg-white text-indigo-700 border border-gray-200 border-b-white -mb-px z-10'
              : 'text-gray-500 hover:text-gray-800 hover:bg-gray-200/60'
          }`}
          onClick={() => {
            if (editingIndex !== i) switchSheet(i);
          }}
          onDoubleClick={() => startRename(i)}
          onContextMenu={(e) => handleContextMenu(e, i)}
        >
          {editingIndex === i ? (
            <input
              ref={inputRef}
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onBlur={commitRename}
              onKeyDown={(e) => {
                if (e.key === 'Enter') commitRename();
                if (e.key === 'Escape') setEditingIndex(null);
              }}
              className="w-20 px-1 py-0 text-xs border border-indigo-300 rounded outline-none focus:ring-1 focus:ring-indigo-400 bg-white"
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <span>{sheet.name}</span>
          )}
        </div>
      ))}

      {/* Add sheet button */}
      <button
        onClick={() => addSheet()}
        className="flex items-center justify-center w-6 h-6 ml-1 text-gray-400 hover:text-indigo-600 hover:bg-gray-200 rounded transition-colors"
        title="Ajouter une feuille"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
      </button>

      {/* Context menu */}
      {contextMenu && (
        <div
          className="fixed bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50 min-w-[140px]"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            className="w-full text-left px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-100"
            onClick={() => startRename(contextMenu.index)}
          >
            Renommer
          </button>
          <button
            className="w-full text-left px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-100"
            onClick={() => {
              duplicateSheet(contextMenu.index);
              setContextMenu(null);
            }}
          >
            Dupliquer
          </button>
          <div className="border-t border-gray-100 my-0.5" />
          <button
            className={`w-full text-left px-3 py-1.5 text-xs ${
              sheets.length <= 1
                ? 'text-gray-300 cursor-not-allowed'
                : 'text-red-600 hover:bg-red-50'
            }`}
            disabled={sheets.length <= 1}
            onClick={() => {
              if (sheets.length > 1) {
                deleteSheet(contextMenu.index);
                setContextMenu(null);
              }
            }}
          >
            Supprimer
          </button>
        </div>
      )}
    </div>
  );
}
