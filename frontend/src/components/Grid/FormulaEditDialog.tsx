import { useState } from 'react';
import { useGridStore } from '../../stores/gridStore';
import { evaluateFormula, resolveColumnNames, formulaToReadable } from '../../utils/formulaEvaluator';

interface FormulaEditDialogProps {
  cellId: string;
  onClose: () => void;
}

export function FormulaEditDialog({ cellId, onClose }: FormulaEditDialogProps) {
  const cell = useGridStore((s) => s.cells[cellId]);
  const allCells = useGridStore((s) => s.cells);
  const setCell = useGridStore((s) => s.setCell);
  const headers = useGridStore((s) => s.headers);

  const [name, setName] = useState(cell?.name ?? '');
  const [description, setDescription] = useState(cell?.description ?? '');
  // Show formula with column names in the input
  const [formula, setFormula] = useState(
    cell?.formula ? formulaToReadable(cell.formula, headers) : ''
  );

  // Resolve to real formula for preview
  const resolvedFormula = resolveColumnNames(formula, headers);

  // Live preview of formula result
  const preview = resolvedFormula.startsWith('=')
    ? evaluateFormula(resolvedFormula, allCells, headers)
    : resolvedFormula;

  const handleSubmit = () => {
    if (!formula.trim()) return;

    const resolved = resolveColumnNames(formula, headers);
    const evaluated = resolved.startsWith('=')
      ? evaluateFormula(resolved, allCells, headers)
      : resolved;

    setCell(cellId, evaluated, {
      formula: resolved.startsWith('=') ? resolved : undefined,
      name: name.trim() || undefined,
      description: description.trim() || undefined,
    });
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-white rounded-lg shadow-xl p-6 w-[420px] space-y-4"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        <h3 className="text-lg font-semibold text-gray-800">
          Modifier la formule ({cellId})
        </h3>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nom</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex: Total prix"
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoFocus
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Ex: Somme de tous les prix"
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Formule</label>
          <input
            type="text"
            value={formula}
            onChange={(e) => setFormula(e.target.value)}
            placeholder="Ex: =SUM(Population1:Population10)"
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="bg-blue-50 px-3 py-2 rounded">
          <span className="text-xs text-gray-500">Resultat actuel : </span>
          <span className="text-sm font-semibold text-blue-700">{String(preview)}</span>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded hover:bg-gray-200"
          >
            Annuler
          </button>
          <button
            onClick={handleSubmit}
            disabled={!formula.trim()}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            Enregistrer
          </button>
        </div>
      </div>
    </div>
  );
}
