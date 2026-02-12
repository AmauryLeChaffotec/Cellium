/**
 * DiffOverlay - Visual preview of AI operation changes
 *
 * Displays color-coded overlays for additions (green), modifications (orange), and deletions (red)
 * over the spreadsheet grid before changes are applied.
 */

import { useDiffStore } from '../../stores/diffStore';
import { cellIdToCoords } from '../../utils/cellUtils';
import type { CellDiff } from '../../types/diff';

const COLUMN_WIDTH = 100;
const ROW_HEIGHT = 32;

export function DiffOverlay() {
  const diffPreview = useDiffStore((s) => s.diffPreview);

  if (!diffPreview) return null;

  const { additions, modifications, deletions } = diffPreview;

  // Limit to 500 changes for performance
  const totalChanges = additions.size + modifications.size + deletions.size;
  const showWarning = totalChanges > 500;

  return (
    <>
      <div className="absolute inset-0 pointer-events-none z-10">
        {/* Render additions (green) */}
        {Array.from(additions.entries())
          .slice(0, 500)
          .map(([cellId, diff]) => (
            <DiffCell key={`add-${cellId}`} diff={diff} type="addition" />
          ))}

        {/* Render modifications (orange) */}
        {Array.from(modifications.entries())
          .slice(0, 500)
          .map(([cellId, diff]) => (
            <DiffCell key={`mod-${cellId}`} diff={diff} type="modification" />
          ))}

        {/* Render deletions (red) */}
        {Array.from(deletions.entries())
          .slice(0, 500)
          .map(([cellId, diff]) => (
            <DiffCell key={`del-${cellId}`} diff={diff} type="deletion" />
          ))}
      </div>

      {/* Warning for too many changes */}
      {showWarning && (
        <div className="absolute top-0 left-0 right-0 bg-yellow-100 border-b border-yellow-400 p-2 text-sm text-yellow-800 pointer-events-auto z-20">
          ⚠️ Plus de 500 changements détectés. Aperçu partiel affiché.
        </div>
      )}
    </>
  );
}

interface DiffCellProps {
  diff: CellDiff;
  type: 'addition' | 'modification' | 'deletion';
}

function DiffCell({ diff, type }: DiffCellProps) {
  const { cellId, before, after, formatBefore, formatAfter } = diff;

  // Calculate cell position based on cellId
  const coords = cellIdToCoords(cellId);
  if (!coords) return null;

  // Position based on row/col (accounting for header row and row number column)
  const top = (coords.row + 1) * ROW_HEIGHT; // +1 for header row
  const left = (coords.col + 1) * COLUMN_WIDTH; // +1 for row number column

  const colorClasses = {
    addition: 'bg-green-100 border-green-400 text-green-800',
    modification: 'bg-orange-100 border-orange-400 text-orange-800',
    deletion: 'bg-red-100 border-red-400 text-red-800',
  };

  const icon = {
    addition: '+',
    modification: '~',
    deletion: '-',
  };

  // Format tooltip text
  const getTooltipText = () => {
    if (type === 'addition') {
      return `Ajout: ${after ?? '∅'}`;
    } else if (type === 'modification') {
      // Check if it's a format-only change
      if (before === after && formatBefore && formatAfter) {
        return `Format modifié: ${cellId}`;
      }
      return `Modification: ${before ?? '∅'} → ${after ?? '∅'}`;
    } else {
      return `Suppression: ${before ?? '∅'}`;
    }
  };

  // Display value
  const displayValue = type === 'deletion' ? before : after;
  const valueStr = String(displayValue ?? '');
  const truncated = valueStr.length > 10 ? valueStr.substring(0, 10) + '...' : valueStr;

  return (
    <div
      className={`absolute border-2 ${colorClasses[type]} pointer-events-auto flex items-center px-1 text-xs overflow-hidden`}
      style={{ top, left, width: COLUMN_WIDTH, height: ROW_HEIGHT }}
      title={getTooltipText()}
      data-testid={`diff-cell-${type}-${cellId}`}
    >
      <span className="font-bold mr-1">{icon[type]}</span>
      <span className={type === 'deletion' ? 'line-through' : ''}>
        {truncated}
      </span>
    </div>
  );
}
