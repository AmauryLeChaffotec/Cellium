import { useEffect, useRef, useState, useCallback } from 'react';
import { Grid, useGridRef } from 'react-window';
import { useGridStore } from '../../stores/gridStore';
import { cellIdToCoords } from '../../utils/cellUtils';
import { getSelectionRows, rangeToString } from '../../utils/rangeUtils';
import { useKeyboardNav } from '../../hooks/useKeyboardNav';
import { useAutoSave } from '../../hooks/useAutoSave';
import { GridHeader } from './GridHeader';
import { VirtualCell } from './VirtualCell';
import { ContextMenu } from './ContextMenu';
import type { ContextMenuItem } from './ContextMenu';
import { ZoneDialog } from './ZoneDialog';

interface ContextMenuState {
  x: number;
  y: number;
  targetRow: number | null;
  targetCol: number | null;
}

export function SpreadsheetGrid() {
  const rowCount = useGridStore((s) => s.rowCount);
  const colCount = useGridStore((s) => s.colCount);
  const colWidths = useGridStore((s) => s.colWidths);
  const rowHeights = useGridStore((s) => s.rowHeights);
  const selectedCell = useGridStore((s) => s.selectedCell);
  const insertRow = useGridStore((s) => s.insertRow);
  const deleteRow = useGridStore((s) => s.deleteRow);
  const insertColumn = useGridStore((s) => s.insertColumn);
  const deleteColumn = useGridStore((s) => s.deleteColumn);
  const setRowHeight = useGridStore((s) => s.setRowHeight);
  const endSelection = useGridStore((s) => s.endSelection);
  const selectionStart = useGridStore((s) => s.selectionStart);
  const selectionEnd = useGridStore((s) => s.selectionEnd);
  const addZone = useGridStore((s) => s.addZone);
  const clearSelection = useGridStore((s) => s.clearSelection);
  const containerRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const rowNumbersRef = useRef<HTMLDivElement>(null);
  const rwGridRef = useGridRef(null);
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const [showZoneDialog, setShowZoneDialog] = useState(false);
  const rowDragRef = useRef<{ rowIndex: number; startY: number; startHeight: number } | null>(null);

  const hasRangeSelection = selectionStart && selectionEnd && selectionStart !== selectionEnd;

  useKeyboardNav(containerRef);
  useAutoSave();

  useEffect(() => {
    containerRef.current?.focus();
  }, []);

  // Auto-scroll to selected cell
  useEffect(() => {
    if (selectedCell && rwGridRef.current) {
      const { row, col } = cellIdToCoords(selectedCell);
      rwGridRef.current.scrollToCell({
        rowIndex: row - 1,
        columnIndex: col,
        rowAlign: 'smart',
        columnAlign: 'smart',
      });
    }
  }, [selectedCell, rwGridRef]);

  const handleGridScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const { scrollLeft, scrollTop } = e.currentTarget;
    if (headerRef.current) headerRef.current.scrollLeft = scrollLeft;
    if (rowNumbersRef.current) rowNumbersRef.current.scrollTop = scrollTop;
  }, []);

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();

    const target = e.target as HTMLElement;
    const rowHeader = target.closest<HTMLElement>('[data-row-header]');
    const colHeader = target.closest<HTMLElement>('[data-col-header]');
    const cellEl = target.closest<HTMLElement>('[data-testid^="cell-"]');

    let targetRow: number | null = null;
    let targetCol: number | null = null;

    if (rowHeader) {
      targetRow = Number(rowHeader.dataset.rowHeader);
    } else if (colHeader) {
      targetCol = Number(colHeader.dataset.colHeader);
    } else if (cellEl) {
      const testId = cellEl.dataset.testid!;
      const cellId = testId.replace('cell-input-', '').replace('cell-', '');
      const coords = cellIdToCoords(cellId);
      targetRow = coords.row;
      targetCol = coords.col;
    } else {
      return;
    }

    setContextMenu({ x: e.clientX, y: e.clientY, targetRow, targetCol });
  }, []);

  const closeContextMenu = useCallback(() => {
    setContextMenu(null);
  }, []);

  const handleRowResizeMouseDown = useCallback(
    (e: React.MouseEvent, rowIndex: number) => {
      e.preventDefault();
      e.stopPropagation();
      const startHeight = rowHeights[rowIndex] ?? 32;
      rowDragRef.current = { rowIndex, startY: e.clientY, startHeight };

      const handleMouseMove = (moveEvent: MouseEvent) => {
        if (!rowDragRef.current) return;
        const delta = moveEvent.clientY - rowDragRef.current.startY;
        setRowHeight(rowDragRef.current.rowIndex, rowDragRef.current.startHeight + delta);
      };

      const handleMouseUp = () => {
        rowDragRef.current = null;
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'row-resize';
      document.body.style.userSelect = 'none';
    },
    [rowHeights, setRowHeight]
  );

  const handleMouseUp = useCallback(() => {
    endSelection();
  }, [endSelection]);

  const handleCreateZone = useCallback(
    (name: string, description: string, color: string) => {
      if (!selectionStart || !selectionEnd) return;
      addZone({
        id: crypto.randomUUID(),
        name,
        description,
        color,
        startCell: selectionStart,
        endCell: selectionEnd,
      });
      setShowZoneDialog(false);
      clearSelection();
    },
    [selectionStart, selectionEnd, addZone, clearSelection]
  );

  function buildMenuItems(targetRow: number | null, targetCol: number | null): ContextMenuItem[] {
    const items: ContextMenuItem[] = [];

    // Selection-specific items
    if (hasRangeSelection) {
      const range = rangeToString(selectionStart!, selectionEnd!);
      items.push({
        label: `Créer une zone (${range})`,
        action: () => setShowZoneDialog(true),
      });

      const { minRow, maxRow } = getSelectionRows(selectionStart!, selectionEnd!);
      const rowCountInSelection = maxRow - minRow + 1;

      items.push({ label: '', action: () => {}, separator: true });
      items.push({
        label: `Insérer ${rowCountInSelection} ligne(s) au-dessus`,
        action: () => {
          for (let i = 0; i < rowCountInSelection; i++) {
            insertRow(minRow - 1);
          }
        },
      });
      items.push({
        label: `Insérer ${rowCountInSelection} ligne(s) en-dessous`,
        action: () => {
          for (let i = 0; i < rowCountInSelection; i++) {
            insertRow(maxRow + i);
          }
        },
      });
      items.push({
        label: `Supprimer ${rowCountInSelection} ligne(s) sélectionnée(s)`,
        action: () => {
          for (let i = maxRow; i >= minRow; i--) {
            deleteRow(i);
          }
          clearSelection();
        },
      });

      return items;
    }

    // Single cell / row / column items
    if (targetRow !== null) {
      items.push(
        { label: 'Insérer une ligne au-dessus', action: () => insertRow(targetRow - 1) },
        { label: 'Insérer une ligne en-dessous', action: () => insertRow(targetRow) },
        { label: 'Supprimer la ligne', action: () => deleteRow(targetRow) },
      );
    }

    if (targetCol !== null) {
      if (items.length > 0) {
        items.push({ label: '', action: () => {}, separator: true });
      }
      items.push(
        { label: 'Insérer une colonne à gauche', action: () => insertColumn(targetCol - 1) },
        { label: 'Insérer une colonne à droite', action: () => insertColumn(targetCol) },
        { label: 'Supprimer la colonne', action: () => deleteColumn(targetCol) },
      );
    }

    return items;
  }

  const columnWidth = useCallback((index: number) => colWidths[index] ?? 100, [colWidths]);
  const rowHeight = useCallback((index: number) => rowHeights[index] ?? 32, [rowHeights]);

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      data-grid-container
      className="outline-none grid"
      style={{
        gridTemplateColumns: '40px 1fr',
        gridTemplateRows: '32px 1fr',
        height: 'calc(100vh - 80px)',
      }}
      onContextMenu={handleContextMenu}
      onMouseUp={handleMouseUp}
    >
      {/* Corner cell */}
      <div className="bg-gray-100 border border-gray-200 z-20" />

      {/* Column headers — scroll horizontal synced */}
      <div ref={headerRef} className="overflow-hidden z-10">
        <GridHeader />
      </div>

      {/* Row numbers — scroll vertical synced */}
      <div ref={rowNumbersRef} className="overflow-hidden z-10">
        {Array.from({ length: rowCount }, (_, i) => (
          <div
            key={i + 1}
            data-row-header={i + 1}
            className="relative bg-gray-50 text-center text-gray-500 text-sm border border-gray-200 flex items-center justify-center"
            style={{ height: rowHeights[i] ?? 32 }}
          >
            {i + 1}
            {/* Row resize handle */}
            <div
              className="absolute bottom-0 left-0 w-full h-1 cursor-row-resize hover:bg-blue-400 z-10"
              onMouseDown={(e) => handleRowResizeMouseDown(e, i)}
            />
          </div>
        ))}
      </div>

      {/* Virtualized cell grid */}
      <Grid<Record<string, never>>
        gridRef={rwGridRef}
        cellComponent={VirtualCell}
        cellProps={{} as Record<string, never>}
        columnCount={colCount}
        columnWidth={columnWidth}
        rowCount={rowCount}
        rowHeight={rowHeight}
        overscanCount={5}
        defaultHeight={600}
        defaultWidth={2600}
        style={{ height: '100%', width: '100%' }}
        onScroll={handleGridScroll}
      />

      {/* Context menu */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          items={buildMenuItems(contextMenu.targetRow, contextMenu.targetCol)}
          onClose={closeContextMenu}
        />
      )}

      {/* Zone creation dialog */}
      {showZoneDialog && (
        <ZoneDialog
          onConfirm={handleCreateZone}
          onCancel={() => setShowZoneDialog(false)}
        />
      )}
    </div>
  );
}
