import { useState } from 'react';
import type { FormEvent, KeyboardEvent } from 'react';
import { useCommandStore } from '../stores/commandStore';
import { useDiffStore } from '../stores/diffStore';

/**
 * CommandBar - AI command input component
 *
 * Allows users to type natural language commands to manipulate the spreadsheet.
 * Displays loading state, error messages, and clarification requests.
 * Disabled when diff is pending (user must validate or reject first).
 */
export function CommandBar() {
  const [input, setInput] = useState('');
  const {
    isLoading,
    error,
    clarification,
    sendCommand,
    clearError,
    clearClarification,
  } = useCommandStore();

  // Disable when diff is pending
  const hasPendingDiff = useDiffStore((s) => s.diffPreview !== null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    await sendCommand(input);
    setInput(''); // Clear input after sending
  };

  const handleInputChange = (value: string) => {
    setInput(value);
    // Clear error/clarification when user starts typing
    if (error) clearError();
    if (clarification) clearClarification();
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as any);
    }
  };

  return (
    <div className="w-full p-4 border-b border-gray-300 bg-white">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => handleInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isLoading || hasPendingDiff}
          placeholder="Décrivez ce que vous voulez faire..."
          className="flex-1 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
          aria-label="Commande IA"
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim() || hasPendingDiff}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {isLoading ? (
            <>
              <span
                className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"
                aria-hidden="true"
              />
              <span>Traitement...</span>
            </>
          ) : (
            'Envoyer'
          )}
        </button>
      </form>

      {/* Warning when diff is pending */}
      {hasPendingDiff && (
        <div className="mt-3 p-3 bg-yellow-50 border border-yellow-300 rounded text-sm text-yellow-800">
          ⚠️ Veuillez valider ou refuser les changements en cours avant d'envoyer une nouvelle commande.
        </div>
      )}

      {/* Error message */}
      {error && (
        <div
          className="mt-3 p-3 bg-red-50 border border-red-300 rounded text-red-800 flex justify-between items-start"
          role="alert"
        >
          <p className="flex-1">{error}</p>
          <button
            onClick={clearError}
            className="ml-2 text-red-600 hover:text-red-800 font-bold"
            aria-label="Fermer l'erreur"
          >
            ✕
          </button>
        </div>
      )}

      {/* Clarification message */}
      {clarification && (
        <div
          className="mt-3 p-3 bg-yellow-50 border border-yellow-300 rounded text-yellow-900 flex justify-between items-start"
          role="status"
        >
          <p className="flex-1">{clarification}</p>
          <button
            onClick={clearClarification}
            className="ml-2 text-yellow-700 hover:text-yellow-900 font-bold"
            aria-label="Fermer la clarification"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
