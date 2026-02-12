/**
 * ActionBar - Validate/Reject buttons for AI operation approval
 *
 * Displays action buttons to accept or reject pending AI operations.
 * Provides user control guarantee - no changes applied without explicit approval.
 */

import { useDiffStore } from '../../stores/diffStore';

export function ActionBar() {
  const {
    description,
    diffPreview,
    isApplying,
    applyError,
    applyPendingOperations,
    rejectPendingOperations,
    clearApplyError,
  } = useDiffStore();

  // Hide if no diff preview
  if (!diffPreview) return null;

  // Calculate summary
  const totalAdditions = diffPreview.additions.size;
  const totalModifications = diffPreview.modifications.size;
  const totalDeletions = diffPreview.deletions.size;

  return (
    <div className="border-t border-gray-300 p-4 bg-white">
      {/* Summary */}
      <div className="mb-3">
        <p className="font-semibold text-gray-800">{description}</p>
        <p className="text-sm text-gray-600">
          {totalAdditions} ajout{totalAdditions > 1 ? 's' : ''},{' '}
          {totalModifications} modification{totalModifications > 1 ? 's' : ''},{' '}
          {totalDeletions} suppression{totalDeletions > 1 ? 's' : ''}
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 justify-end">
        <button
          onClick={rejectPendingOperations}
          disabled={isApplying}
          className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Refuser les changements"
          data-testid="reject-button"
        >
          Refuser
        </button>
        <button
          onClick={applyPendingOperations}
          disabled={isApplying}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          aria-label="Valider les changements"
          data-testid="validate-button"
        >
          {isApplying ? 'Application...' : 'Valider'}
        </button>
      </div>

      {/* Error Display */}
      {applyError && (
        <div
          role="alert"
          className="mt-3 p-3 bg-red-50 border border-red-300 rounded text-red-800 flex justify-between items-center"
        >
          <span>{applyError}</span>
          <button
            onClick={clearApplyError}
            className="ml-2 text-red-600 hover:text-red-800 font-bold"
            aria-label="Fermer l'erreur"
            data-testid="clear-error-button"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
