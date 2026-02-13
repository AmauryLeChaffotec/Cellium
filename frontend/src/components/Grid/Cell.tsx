import { useRef, useEffect, useState, useMemo } from 'react';
import { useGridStore } from '../../stores/gridStore';
import { cellIdToCoords, coordsToCellId } from '../../utils/cellUtils';
import { evaluateFormula } from '../../utils/formulaEvaluator';
import { isCellInRange } from '../../utils/rangeUtils';

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
  const allCells = useGridStore((s) => s.cells);
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

  useEffect(() => {
    if (isEditing && inputRef.current) {
      const editValue = cellFormula || (cellValue !== null ? String(cellValue) : '');
      setInputValue(editValue);
      inputRef.current.focus();
    }
  }, [isEditing, cellValue, cellFormula]);

  const handleSave = () => {
    if (inputValue.startsWith('=')) {
      setCell(cellId, inputValue, { formula: inputValue });
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
          className="w-full h-full border-2 border-blue-500 outline-none px-1 text-sm resize-none"
          data-testid={`cell-input-${cellId}`}
        />
      </div>
    );
  }

  const displayValue = (() => {
    if (cellFormula) {
      const result = evaluateFormula(cellFormula, allCells);
      return result !== null ? String(result) : '';
    }
    return cellValue !== null ? String(cellValue) : '';
  })();

  // Build background style
  let bgStyle: React.CSSProperties = {};
  if (zoneColor) {
    bgStyle = { backgroundColor: `${zoneColor}20` };
  }
  if (isInSelection) {
    bgStyle = { backgroundColor: 'rgba(59, 130, 246, 0.15)' };
  }

  const tooltip = zoneInfo
    ? `${zoneInfo.name}${zoneInfo.description ? ` — ${zoneInfo.description}` : ''}`
    : undefined;

  return (
    <div
      className={`w-full h-full px-1 py-1 text-sm cursor-default break-words overflow-hidden select-none ${
        isSelected ? 'ring-2 ring-blue-500 ring-inset border border-transparent' : 'border border-gray-200'
      }`}
      style={bgStyle}
      title={tooltip}
      onMouseDown={handleMouseDown}
      onMouseEnter={handleMouseEnter}
      onDoubleClick={() => startEditing(cellId)}
      data-testid={`cell-${cellId}`}
    >
      {zoneInfo?.isStartCell && (
        <span
          className="inline-block text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded mb-0.5 truncate max-w-full"
          style={{ backgroundColor: zoneInfo.color, color: '#fff' }}
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
    </div>
  );
}
