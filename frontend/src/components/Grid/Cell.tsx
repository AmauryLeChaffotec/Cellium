import { useRef, useEffect, useState, useMemo } from 'react';
import { useGridStore } from '../../stores/gridStore';
import type { ZoneResizeHandle } from '../../stores/gridStore';
import { cellIdToCoords, coordsToCellId } from '../../utils/cellUtils';
import { evaluateFormula, resolveColumnNames, formulaToReadable } from '../../utils/formulaEvaluator';
import { formatValue, isValueValidForType } from '../../utils/formatValue';
import { isCellInRange } from '../../utils/rangeUtils';

// ── HandleDot: resize handle rendered at zone edges ──────────

type HandlePosition =
  | 'top-left' | 'top-center' | 'top-right'
  | 'left-center' | 'right-center'
  | 'bottom-left' | 'bottom-center' | 'bottom-right';

const HANDLE_POSITION_STYLES: Record<HandlePosition, React.CSSProperties> = {
  'top-left':      { top: -4, left: -4, cursor: 'nwse-resize' },
  'top-center':    { top: -4, left: '50%', marginLeft: -4, cursor: 'ns-resize' },
  'top-right':     { top: -4, right: -4, cursor: 'nesw-resize' },
  'left-center':   { top: '50%', left: -4, marginTop: -4, cursor: 'ew-resize' },
  'right-center':  { top: '50%', right: -4, marginTop: -4, cursor: 'ew-resize' },
  'bottom-left':   { bottom: -4, left: -4, cursor: 'nesw-resize' },
  'bottom-center': { bottom: -4, left: '50%', marginLeft: -4, cursor: 'ns-resize' },
  'bottom-right':  { bottom: -4, right: -4, cursor: 'nwse-resize' },
};

function HandleDot({ position, handle, zoneId, color }: {
  position: HandlePosition;
  handle: ZoneResizeHandle;
  zoneId: string;
  color: string;
}) {
  return (
    <div
      style={{
        position: 'absolute',
        width: 8,
        height: 8,
        borderRadius: '50%',
        backgroundColor: color,
        border: '1px solid white',
        zIndex: 30,
        ...HANDLE_POSITION_STYLES[position],
      }}
      onMouseDown={(e) => {
        e.preventDefault();
        e.stopPropagation();
        window.dispatchEvent(
          new CustomEvent('cellium:zone-resize-start', {
            detail: { zoneId, handle },
          })
        );
      }}
    />
  );
}

interface CellProps {
  cellId: string;
}

function parseValue(input: string): string | number {
  if (input === '') return '';
  const num = Number(input);
  if (!isNaN(num) && input.trim() !== '') return num;
  return input;
}

export function Cell({ cellId }: CellProps) {
  const cell = useGridStore((s) => s.cells[cellId]);
  const cellValue = cell?.value ?? null;
  const cellFormula = cell?.formula;
  const cellName = cell?.name;
  const cellDescription = cell?.description;
  const allCells = useGridStore((s) => s.cells);
  const headers = useGridStore((s) => s.headers);
  const isEditing = useGridStore((s) => s.editingCell === cellId);
  const isSelected = useGridStore((s) => s.selectedCell === cellId);
  const setCell = useGridStore((s) => s.setCell);
  const startEditing = useGridStore((s) => s.startEditing);
  const stopEditing = useGridStore((s) => s.stopEditing);
  const selectCell = useGridStore((s) => s.selectCell);
  const startSelection = useGridStore((s) => s.startSelection);
  const extendSelection = useGridStore((s) => s.extendSelection);
  const selectionStart = useGridStore((s) => s.selectionStart);
  const selectionEnd = useGridStore((s) => s.selectionEnd);
  const zones = useGridStore((s) => s.zones);
  const activeZoneId = useGridStore((s) => s.activeZoneId);
  const setActiveZone = useGridStore((s) => s.setActiveZone);
  const columnTypes = useGridStore((s) => s.columnTypes);
  const zoneResizing = useGridStore((s) => s.zoneResizing);

  const colIndex = cellIdToCoords(cellId).col;
  const columnType = columnTypes[colIndex] ?? 'none';

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [inputValue, setInputValue] = useState('');

  // Check if cell is in the active drag selection
  const isInSelection = useMemo(() => {
    if (!selectionStart || !selectionEnd) return false;
    if (selectionStart === selectionEnd) return false;
    return isCellInRange(cellId, selectionStart, selectionEnd);
  }, [cellId, selectionStart, selectionEnd]);

  // Find zone info for this cell
  const zoneInfo = useMemo(() => {
    for (const zone of zones) {
      if (isCellInRange(cellId, zone.startCell, zone.endCell)) {
        return {
          id: zone.id,
          color: zone.color,
          name: zone.name,
          description: zone.description,
          isStartCell: zone.startCell === cellId,
        };
      }
    }
    return null;
  }, [cellId, zones]);

  const zoneColor = zoneInfo?.color ?? null;

  // Compute edge info for active zone highlight + resize handles
  const activeZoneEdges = useMemo(() => {
    if (!activeZoneId || !zoneInfo || zoneInfo.id !== activeZoneId) return null;

    const activeZone = zones.find((z) => z.id === activeZoneId);
    if (!activeZone) return null;

    const { row, col } = cellIdToCoords(cellId);
    const s = cellIdToCoords(activeZone.startCell);
    const e = cellIdToCoords(activeZone.endCell);
    const minRow = Math.min(s.row, e.row);
    const maxRow = Math.max(s.row, e.row);
    const minCol = Math.min(s.col, e.col);
    const maxCol = Math.max(s.col, e.col);

    const isTop = row === minRow;
    const isBottom = row === maxRow;
    const isLeft = col === minCol;
    const isRight = col === maxCol;

    if (!isTop && !isBottom && !isLeft && !isRight) return null;

    const midRow = Math.floor((minRow + maxRow) / 2);
    const midCol = Math.floor((minCol + maxCol) / 2);

    return {
      isTop, isBottom, isLeft, isRight,
      handleTopLeft: isTop && isLeft,
      handleTopRight: isTop && isRight,
      handleBottomLeft: isBottom && isLeft,
      handleBottomRight: isBottom && isRight,
      handleTop: isTop && col === midCol && !isLeft && !isRight,
      handleBottom: isBottom && col === midCol && !isLeft && !isRight,
      handleLeft: isLeft && row === midRow && !isTop && !isBottom,
      handleRight: isRight && row === midRow && !isTop && !isBottom,
    };
  }, [cellId, activeZoneId, zoneInfo, zones]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      // Show formula with column names when editing
      const rawFormula = cellFormula || (cellValue !== null ? String(cellValue) : '');
      const editValue = rawFormula.startsWith('=')
        ? formulaToReadable(rawFormula, useGridStore.getState().headers)
        : rawFormula;
      setInputValue(editValue);
      inputRef.current.focus();
    }
  }, [isEditing, cellValue, cellFormula]);

  const handleSave = () => {
    if (inputValue.startsWith('=')) {
      const currentHeaders = useGridStore.getState().headers;
      const currentCells = useGridStore.getState().cells;
      // Resolve column names (e.g. Population1 → B1) before storing
      const resolvedFormula = resolveColumnNames(inputValue, currentHeaders);
      const evaluated = evaluateFormula(resolvedFormula, currentCells, currentHeaders);
      setCell(cellId, evaluated, { formula: resolvedFormula });
    } else {
      const parsed = parseValue(inputValue);
      setCell(cellId, parsed === '' ? null : parsed);
    }
    stopEditing();
  };

  const focusGridContainer = () => {
    const container = document.querySelector<HTMLElement>('[data-grid-container]');
    container?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      return;
    } else if (e.key === 'Enter' && e.shiftKey) {
      e.preventDefault();
      handleSave();
      const { row, col } = cellIdToCoords(cellId);
      const rowCount = useGridStore.getState().rowCount;
      if (row < rowCount) {
        selectCell(coordsToCellId(row + 1, col));
      }
      focusGridContainer();
    } else if (e.key === 'Tab') {
      e.preventDefault();
      handleSave();
      const { row, col } = cellIdToCoords(cellId);
      const colCount = useGridStore.getState().colCount;
      if (e.shiftKey) {
        if (col > 0) selectCell(coordsToCellId(row, col - 1));
      } else {
        if (col < colCount - 1) selectCell(coordsToCellId(row, col + 1));
      }
      focusGridContainer();
    } else if (e.key === 'Escape') {
      stopEditing();
      focusGridContainer();
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    if (zoneResizing) return;
    startSelection(cellId);
  };

  const handleMouseEnter = (e: React.MouseEvent) => {
    if (e.buttons === 1) {
      extendSelection(cellId);
    }
  };

  if (isEditing) {
    return (
      <div className="w-full h-full border border-gray-200 p-0">
        <textarea
          ref={inputRef}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          className="w-full h-full border-2 border-indigo-500 outline-none px-1 text-sm resize-none bg-white"
          data-testid={`cell-input-${cellId}`}
        />
      </div>
    );
  }

  const displayValue = (() => {
    if (cellFormula) {
      const result = evaluateFormula(cellFormula, allCells, headers);
      return result !== null ? formatValue(result, columnType) : '';
    }
    return cellValue !== null ? formatValue(cellValue, columnType) : '';
  })();

  const isNumericType = columnType === 'number' || columnType === 'currency' || columnType === 'percentage';

  // Format validation: red background if value doesn't match type (skip formulas)
  const hasFormatError = !cellFormula && cellValue !== null && cellValue !== '' && !isValueValidForType(cellValue, columnType);

  // Build background style
  let bgStyle: React.CSSProperties = {};
  if (hasFormatError) {
    bgStyle = { backgroundColor: 'rgba(239, 68, 68, 0.15)' };
  } else if (zoneColor) {
    bgStyle = { backgroundColor: `${zoneColor}20` };
  }
  if (isInSelection) {
    bgStyle = { backgroundColor: 'rgba(99, 102, 241, 0.12)' };
  }

  // Build border style for active zone edges
  const borderStyle: React.CSSProperties = {};
  if (activeZoneEdges && zoneInfo) {
    const c = zoneInfo.color;
    if (activeZoneEdges.isTop)    { borderStyle.borderTopWidth = 2; borderStyle.borderTopStyle = 'solid'; borderStyle.borderTopColor = c; }
    if (activeZoneEdges.isBottom) { borderStyle.borderBottomWidth = 2; borderStyle.borderBottomStyle = 'solid'; borderStyle.borderBottomColor = c; }
    if (activeZoneEdges.isLeft)   { borderStyle.borderLeftWidth = 2; borderStyle.borderLeftStyle = 'solid'; borderStyle.borderLeftColor = c; }
    if (activeZoneEdges.isRight)  { borderStyle.borderRightWidth = 2; borderStyle.borderRightStyle = 'solid'; borderStyle.borderRightColor = c; }
  }

  const tooltip = hasFormatError
    ? 'Format incorrect pour ce type de colonne'
    : cellDescription
      ? cellDescription
      : zoneInfo
        ? `${zoneInfo.name}${zoneInfo.description ? ` — ${zoneInfo.description}` : ''}`
        : undefined;

  return (
    <div
      className={`relative w-full h-full px-1 py-1 text-sm cursor-default break-words select-none ${
        activeZoneEdges ? '' : 'overflow-hidden'
      } ${
        isSelected ? 'ring-2 ring-indigo-500 ring-inset border border-transparent' : 'border border-gray-200/80'
      } ${isNumericType ? 'text-right' : ''}`}
      style={{
        ...bgStyle,
        ...borderStyle,
        ...(hasFormatError ? { borderLeftWidth: 3, borderLeftStyle: 'solid', borderLeftColor: '#ef4444' } : {}),
      }}
      title={tooltip}
      onMouseDown={handleMouseDown}
      onMouseEnter={handleMouseEnter}
      onDoubleClick={() => startEditing(cellId)}
      data-testid={`cell-${cellId}`}
    >
      {zoneInfo?.isStartCell && (
        <span
          className="inline-block text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded mb-0.5 truncate max-w-full cursor-pointer hover:opacity-80"
          style={{ backgroundColor: zoneInfo.color, color: '#fff' }}
          onClick={(e) => {
            e.stopPropagation();
            window.dispatchEvent(new CustomEvent('cellium:edit-zone', { detail: { zoneId: zoneInfo.id } }));
          }}
          onContextMenu={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setActiveZone(activeZoneId === zoneInfo.id ? null : zoneInfo.id);
          }}
        >
          {zoneInfo.name}
        </span>
      )}
      {cellName ? (
        <div className="flex flex-col gap-0.5">
          <span className="text-xs font-bold uppercase tracking-wide text-blue-700 bg-blue-100 px-1.5 py-0.5 rounded w-fit truncate max-w-full">{cellName}</span>
          <span className="text-base font-semibold truncate">{displayValue}</span>
        </div>
      ) : (
        displayValue
      )}
      {activeZoneEdges && zoneInfo && (
        <>
          {activeZoneEdges.handleTopLeft && <HandleDot position="top-left" handle="top-left" zoneId={zoneInfo.id} color={zoneInfo.color} />}
          {activeZoneEdges.handleTop && <HandleDot position="top-center" handle="top" zoneId={zoneInfo.id} color={zoneInfo.color} />}
          {activeZoneEdges.handleTopRight && <HandleDot position="top-right" handle="top-right" zoneId={zoneInfo.id} color={zoneInfo.color} />}
          {activeZoneEdges.handleLeft && <HandleDot position="left-center" handle="left" zoneId={zoneInfo.id} color={zoneInfo.color} />}
          {activeZoneEdges.handleRight && <HandleDot position="right-center" handle="right" zoneId={zoneInfo.id} color={zoneInfo.color} />}
          {activeZoneEdges.handleBottomLeft && <HandleDot position="bottom-left" handle="bottom-left" zoneId={zoneInfo.id} color={zoneInfo.color} />}
          {activeZoneEdges.handleBottom && <HandleDot position="bottom-center" handle="bottom" zoneId={zoneInfo.id} color={zoneInfo.color} />}
          {activeZoneEdges.handleBottomRight && <HandleDot position="bottom-right" handle="bottom-right" zoneId={zoneInfo.id} color={zoneInfo.color} />}
        </>
      )}
    </div>
  );
}
