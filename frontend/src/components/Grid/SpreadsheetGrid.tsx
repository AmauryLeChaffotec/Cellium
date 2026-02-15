import { useEffect, useRef, useState, useCallback } from 'react';
import { Grid, useGridRef } from 'react-window';
import { useGridStore } from '../../stores/gridStore';
import { cellIdToCoords, coordsToCellId, columnIndexToLetter } from '../../utils/cellUtils';
import { getSelectionRows, isCellInRange, rangeToString } from '../../utils/rangeUtils';
import { useKeyboardNav } from '../../hooks/useKeyboardNav';
import { useAutoSave } from '../../hooks/useAutoSave';
import { GridHeader } from './GridHeader';
import { VirtualCell } from './VirtualCell';
import { ContextMenu } from './ContextMenu';
import type { ContextMenuItem } from './ContextMenu';
import { ZoneDialog } from './ZoneDialog';
import { FormulaEditDialog } from './FormulaEditDialog';
import type { Zone } from '../../types/zone';
import type { ColumnType } from '../../types/cell';
import { generateUUID } from '../../utils/uuid';

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
  const updateZone = useGridStore((s) => s.updateZone);
  const deleteZone = useGridStore((s) => s.deleteZone);
  const zones = useGridStore((s) => s.zones);
  const clearSelection = useGridStore((s) => s.clearSelection);
  const activeZoneId = useGridStore((s) => s.activeZoneId);
  const setActiveZone = useGridStore((s) => s.setActiveZone);
  const startZoneResize = useGridStore((s) => s.startZoneResize);
  const updateZoneResize = useGridStore((s) => s.updateZoneResize);
  const endZoneResize = useGridStore((s) => s.endZoneResize);
  const columnTypes = useGridStore((s) => s.columnTypes);
  const setColumnType = useGridStore((s) => s.setColumnType);
  const containerRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const rowNumbersRef = useRef<HTMLDivElement>(null);
  const rwGridRef = useGridRef(null);
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const [showZoneDialog, setShowZoneDialog] = useState(false);
  const [editingZone, setEditingZone] = useState<Zone | null>(null);
  const [editingFormulaCellId, setEditingFormulaCellId] = useState<string | null>(null);
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

  // Listen for zone edit events from Cell badge clicks
  useEffect(() => {
    const handleEditZoneEvent = (e: Event) => {
      const { zoneId } = (e as CustomEvent).detail;
      const zone = useGridStore.getState().zones.find((z) => z.id === zoneId);
      if (zone) setEditingZone(zone);
    };
    window.addEventListener('cellium:edit-zone', handleEditZoneEvent);
    return () => window.removeEventListener('cellium:edit-zone', handleEditZoneEvent);
  }, []);

  // Listen for zone resize events from HandleDot mousedowns
  useEffect(() => {
    const handleResizeStart = (e: Event) => {
      const { zoneId, handle } = (e as CustomEvent).detail;
      startZoneResize(zoneId, handle);

      let rafId: number | null = null;

      const handleMouseMove = (moveEvent: MouseEvent) => {
        if (rafId) return;
        rafId = requestAnimationFrame(() => {
          rafId = null;
          const el = document.elementFromPoint(moveEvent.clientX, moveEvent.clientY);
          if (!el) return;
          const cellEl = (el as HTMLElement).closest<HTMLElement>('[data-testid^="cell-"]');
          if (!cellEl) return;
          const testId = cellEl.dataset.testid!;
          const cellId = testId.replace('cell-input-', '').replace('cell-', '');
          updateZoneResize(cellId);
        });
      };

      const handleMouseUp = (mouseUpEvent: MouseEvent) => {
        if (rafId) cancelAnimationFrame(rafId);
        // Find final cell under cursor and pass to endZoneResize (single transaction)
        let finalCellId: string | undefined;
        const finalEl = document.elementFromPoint(mouseUpEvent.clientX, mouseUpEvent.clientY);
        if (finalEl) {
          const finalCellEl = (finalEl as HTMLElement).closest<HTMLElement>('[data-testid^="cell-"]');
          if (finalCellEl) {
            const tid = finalCellEl.dataset.testid!;
            finalCellId = tid.replace('cell-input-', '').replace('cell-', '');
          }
        }
        endZoneResize(finalCellId);
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'grabbing';
      document.body.style.userSelect = 'none';
    };

    window.addEventListener('cellium:zone-resize-start', handleResizeStart);
    return () => window.removeEventListener('cellium:zone-resize-start', handleResizeStart);
  }, [startZoneResize, updateZoneResize, endZoneResize]);

  // Click outside active zone → deactivate
  const handleContainerClick = useCallback((e: React.MouseEvent) => {
    if (!activeZoneId) return;

    const target = e.target as HTMLElement;
    const cellEl = target.closest<HTMLElement>('[data-testid^="cell-"]');
    if (cellEl) {
      const testId = cellEl.dataset.testid!;
      const cellId = testId.replace('cell-input-', '').replace('cell-', '');
      const activeZone = zones.find((z) => z.id === activeZoneId);
      if (activeZone && isCellInRange(cellId, activeZone.startCell, activeZone.endCell)) {
        return;
      }
    }

    setActiveZone(null);
  }, [activeZoneId, zones, setActiveZone]);

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
        id: generateUUID(),
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

  const handleEditZone = useCallback(
    (name: string, description: string, color: string) => {
      if (!editingZone) return;
      updateZone(editingZone.id, { name, description, color });
      setEditingZone(null);
    },
    [editingZone, updateZone]
  );

  const handleDeleteEditingZone = useCallback(() => {
    if (!editingZone) return;
    deleteZone(editingZone.id);
    setEditingZone(null);
  }, [editingZone, deleteZone]);

  // Find the zone that a cell belongs to (for context menu)
  function findZoneForCell(row: number, col: number): Zone | undefined {
    const cellId = coordsToCellId(row, col);
    return zones.find((z) => isCellInRange(cellId, z.startCell, z.endCell));
  }

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

    // Formula items
    if (targetRow !== null && targetCol !== null) {
      const cellId = coordsToCellId(targetRow, targetCol);
      const cell = useGridStore.getState().cells[cellId];
      if (cell?.formula) {
        const currentHeaders = useGridStore.getState().headers;
        const funcMatch = cell.formula.match(/^=(\w+)\(([A-Z])(\d+):([A-Z])(\d+)\)$/i);
        let formulaDisplay: string;
        if (funcMatch) {
          const funcName = funcMatch[1].toUpperCase();
          const col1 = funcMatch[2].toUpperCase().charCodeAt(0) - 65;
          const row1 = funcMatch[3];
          const col2 = funcMatch[4].toUpperCase().charCodeAt(0) - 65;
          const row2 = funcMatch[5];
          const colNames: string[] = [];
          for (let c = Math.min(col1, col2); c <= Math.max(col1, col2); c++) {
            colNames.push(currentHeaders[c] ?? columnIndexToLetter(c));
          }
          formulaDisplay = `${funcName}(${colNames.join(', ')}, lignes ${row1}-${row2})`;
        } else {
          formulaDisplay = cell.formula;
        }
        items.push({
          label: `Formule : ${formulaDisplay}`,
          action: () => {},
        });
        items.push({
          label: 'Modifier la formule',
          action: () => setEditingFormulaCellId(cellId),
        });
        items.push({ label: '', action: () => {}, separator: true });
      } else {
        items.push({
          label: 'Creer une formule',
          action: () => setEditingFormulaCellId(cellId),
        });
        items.push({ label: '', action: () => {}, separator: true });
      }
    }

    // Zone items (if the cell belongs to a zone)
    if (targetRow !== null && targetCol !== null) {
      const cellZone = findZoneForCell(targetRow, targetCol);
      if (cellZone) {
        items.push({
          label: `Modifier la zone "${cellZone.name}"`,
          action: () => setEditingZone(cellZone),
        });
        items.push({
          label: `Supprimer la zone "${cellZone.name}"`,
          action: () => deleteZone(cellZone.id),
        });
        items.push({ label: '', action: () => {}, separator: true });
      }
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

      // Column type submenu
      const currentType = columnTypes[targetCol] ?? 'none';
      const typeOptions: { label: string; value: ColumnType }[] = [
        { label: 'Pas de type', value: 'none' },
        { label: 'Texte', value: 'text' },
        { label: 'Nombre', value: 'number' },
        { label: 'Monnaie (EUR)', value: 'currency' },
        { label: 'Pourcentage', value: 'percentage' },
        { label: 'Date', value: 'date' },
        { label: 'Boolean', value: 'boolean' },
      ];
      items.push({ label: '', action: () => {}, separator: true });
      items.push({
        label: 'Type de colonne',
        action: () => {},
        children: typeOptions.map((opt) => ({
          label: `${opt.label}${currentType === opt.value ? ' \u2713' : ''}`,
          action: () => setColumnType(targetCol, opt.value),
        })),
      });
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
      onClick={handleContainerClick}
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

      {/* Zone edit dialog */}
      {editingZone && (
        <ZoneDialog
          zone={editingZone}
          onConfirm={handleEditZone}
          onDelete={handleDeleteEditingZone}
          onCancel={() => setEditingZone(null)}
        />
      )}

      {/* Formula edit dialog */}
      {editingFormulaCellId && (
        <FormulaEditDialog
          cellId={editingFormulaCellId}
          onClose={() => setEditingFormulaCellId(null)}
        />
      )}
    </div>
  );
}
