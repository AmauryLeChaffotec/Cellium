import { useState } from 'react';
import type { Chart, ChartType } from '../../types/chart';

const CHART_TYPES: { type: ChartType; label: string; icon: string }[] = [
  { type: 'bar', label: 'Barres', icon: '📊' },
  { type: 'line', label: 'Ligne', icon: '📈' },
  { type: 'pie', label: 'Camembert', icon: '🥧' },
  { type: 'area', label: 'Aire', icon: '📉' },
];

interface ChartDialogProps {
  dataRange?: string;
  chart?: Chart;
  onConfirm: (chart: Omit<Chart, 'id'> & { id?: string }) => void;
  onDelete?: () => void;
  onCancel: () => void;
}

export function ChartDialog({ dataRange, chart, onConfirm, onDelete, onCancel }: ChartDialogProps) {
  const isEdit = !!chart;
  const [name, setName] = useState(chart?.name ?? '');
  const [type, setType] = useState<ChartType>(chart?.type ?? 'bar');
  const [range, setRange] = useState(chart?.dataRange ?? dataRange ?? '');

  const handleSubmit = () => {
    const trimmed = name.trim();
    if (!trimmed || !range.trim()) return;
    onConfirm({
      ...(chart ? { id: chart.id } : {}),
      name: trimmed,
      type,
      dataRange: range.trim().toUpperCase(),
      left: chart?.left ?? 100,
      top: chart?.top ?? 100,
      width: chart?.width ?? 400,
      height: chart?.height ?? 300,
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    } else if (e.key === 'Escape') {
      onCancel();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50" onClick={onCancel}>
      <div
        className="bg-white rounded-lg shadow-xl p-6 w-[420px] space-y-4"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        <h3 className="text-lg font-semibold text-gray-800">
          {isEdit ? 'Modifier le graphique' : 'Créer un graphique'}
        </h3>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nom</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex: Ventes mensuelles"
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
            autoFocus
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Type de graphique</label>
          <div className="grid grid-cols-4 gap-2">
            {CHART_TYPES.map((ct) => (
              <button
                key={ct.type}
                type="button"
                className={`flex flex-col items-center gap-1 p-3 rounded-lg border-2 text-sm font-medium transition-colors ${
                  type === ct.type
                    ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                    : 'border-gray-200 hover:border-gray-300 text-gray-600'
                }`}
                onClick={() => setType(ct.type)}
              >
                <span className="text-xl">{ct.icon}</span>
                <span>{ct.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Plage de données</label>
          <input
            type="text"
            value={range}
            onChange={(e) => setRange(e.target.value)}
            placeholder="Ex: A1:C10"
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
          />
          <p className="text-xs text-gray-400 mt-1">
            Première colonne = labels, colonnes suivantes = séries de données
          </p>
        </div>

        <div className="flex items-center justify-between pt-2">
          {isEdit && onDelete ? (
            <button
              onClick={onDelete}
              className="px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded border border-red-300"
            >
              Supprimer
            </button>
          ) : (
            <div />
          )}
          <div className="flex gap-2">
            <button
              onClick={onCancel}
              className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded hover:bg-gray-200"
            >
              Annuler
            </button>
            <button
              onClick={handleSubmit}
              disabled={!name.trim() || !range.trim()}
              className="px-4 py-2 text-sm bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {isEdit ? 'Modifier' : 'Créer'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
