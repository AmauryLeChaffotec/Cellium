import { useEffect } from 'react';
import { useGridStore } from '../stores/gridStore';
import { cellIdToCoords, coordsToCellId } from '../utils/cellUtils';

export function useKeyboardNav(containerRef: React.RefObject<HTMLElement | null>) {
  const selectedCell = useGridStore((s) => s.selectedCell);
  const editingCell = useGridStore((s) => s.editingCell);
  const rowCount = useGridStore((s) => s.rowCount);
  const colCount = useGridStore((s) => s.colCount);
  const selectCell = useGridStore((s) => s.selectCell);
  const startEditing = useGridStore((s) => s.startEditing);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (editingCell) return;
      if (!selectedCell) return;

      const { row, col } = cellIdToCoords(selectedCell);
      let nextRow = row;
      let nextCol = col;

      switch (e.key) {
        case 'ArrowUp':    nextRow = Math.max(1, row - 1); break;
        case 'ArrowDown':  nextRow = Math.min(rowCount, row + 1); break;
        case 'ArrowLeft':  nextCol = Math.max(0, col - 1); break;
        case 'ArrowRight': nextCol = Math.min(colCount - 1, col + 1); break;
        case 'Tab':
          if (e.shiftKey) {
            nextCol = Math.max(0, col - 1);
          } else {
            nextCol = Math.min(colCount - 1, col + 1);
          }
          break;
        case 'Enter':
          startEditing(selectedCell);
          e.preventDefault();
          return;
        default:
          return;
      }

      e.preventDefault();
      selectCell(coordsToCellId(nextRow, nextCol));
    };

    container.addEventListener('keydown', handleKeyDown);
    return () => container.removeEventListener('keydown', handleKeyDown);
  }, [containerRef, selectedCell, editingCell, rowCount, colCount, selectCell, startEditing]);
}
