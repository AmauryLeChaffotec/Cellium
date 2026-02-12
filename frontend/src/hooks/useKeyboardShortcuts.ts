import { useEffect } from 'react';
import { useDiffStore } from '../stores/diffStore';

/**
 * useKeyboardShortcuts - Global keyboard shortcuts for diff validation/rejection
 *
 * Escape → Reject pending operations
 * Ctrl/Cmd+Enter → Validate pending operations
 *
 * Only active when diffPreview is present and not currently applying.
 */
export function useKeyboardShortcuts() {
  const {
    diffPreview,
    isApplying,
    applyPendingOperations,
    clearPending,
  } = useDiffStore();

  useEffect(() => {
    // Only activate shortcuts when diff is present and not applying
    if (!diffPreview || isApplying) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Escape → Reject
      if (event.key === 'Escape') {
        event.preventDefault();
        clearPending();
      }

      // Ctrl+Enter or Cmd+Enter → Validate
      if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
        event.preventDefault();
        applyPendingOperations();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [diffPreview, isApplying, applyPendingOperations, clearPending]);
}
