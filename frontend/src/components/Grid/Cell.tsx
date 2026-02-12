import { useRef, useEffect, useState } from 'react';
import { useGridStore } from '../../stores/gridStore';
import { cellIdToCoords, coordsToCellId } from '../../utils/cellUtils';
import { evaluateFormula } from '../../utils/formulaEvaluator';

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
  const allCells = useGridStore((s) => s.cells);
  const isEditing = useGridStore((s) => s.editingCell === cellId);
  const isSelected = useGridStore((s) => s.selectedCell === cellId);
  const setCell = useGridStore((s) => s.setCell);
  const startEditing = useGridStore((s) => s.startEditing);
  const stopEditing = useGridStore((s) => s.stopEditing);
  const selectCell = useGridStore((s) => s.selectCell);

  const inputRef = useRef<HTMLInputElement>(null);
  const [inputValue, setInputValue] = useState('');

  useEffect(() => {
    if (isEditing && inputRef.current) {
      // When editing, show the formula if present, otherwise show the value
      const editValue = cellFormula || (cellValue !== null ? String(cellValue) : '');
      setInputValue(editValue);
      inputRef.current.focus();
    }
  }, [isEditing, cellValue, cellFormula]);

  const handleSave = () => {
    // If input starts with '=', treat it as a formula
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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
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

  if (isEditing) {
    return (
      <div className="w-full h-full border border-gray-200 p-0">
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          className="w-full h-full border-2 border-blue-500 outline-none px-1 text-sm"
          data-testid={`cell-input-${cellId}`}
        />
      </div>
    );
  }

  // Determine what to display: evaluated formula or raw value
  const displayValue = (() => {
    if (cellFormula) {
      // If cell has a formula, evaluate it
      const result = evaluateFormula(cellFormula, allCells);
      return result !== null ? String(result) : '';
    }
    return cellValue !== null ? String(cellValue) : '';
  })();

  return (
    <div
      className={`w-full h-full px-1 text-sm truncate cursor-default leading-8 ${
        isSelected ? 'ring-2 ring-blue-500 ring-inset border border-transparent' : 'border border-gray-200'
      }`}
      onClick={() => selectCell(cellId)}
      onDoubleClick={() => startEditing(cellId)}
      data-testid={`cell-${cellId}`}
    >
      {displayValue}
    </div>
  );
}
