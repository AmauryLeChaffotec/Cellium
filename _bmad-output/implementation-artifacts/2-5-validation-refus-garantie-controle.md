# Story 2.5: Validation et Refus avec Garantie de Contrôle

Status: ready-for-dev

## Story

As a utilisateur,
I want valider ou refuser chaque proposition de l'IA avec la garantie que rien ne change sans mon accord,
So that je garde le contrôle total sur mes données.

## Acceptance Criteria

1. **Given** un diff est affiché avec des opérations en attente **When** l'utilisateur regarde l'interface **Then** une barre d'action avec les boutons "Valider" et "Refuser" est visible (FR19, FR20)
2. **Given** l'utilisateur clique sur "Valider" **When** les opérations sont acceptées **Then** les opérations sont appliquées au gridStore via `applyOperations()` **And** le diffStore est vidé **And** le DiffOverlay disparaît **And** l'application en < 100ms (NFR4) (FR19)
3. **Given** l'utilisateur clique sur "Refuser" **When** les opérations sont rejetées **Then** le diffStore est vidé sans modifier le gridStore **And** le DiffOverlay disparaît **And** les données restent strictement identiques à avant la commande **And** l'annulation en < 100ms (NFR4) (FR20)
4. **Given** des opérations sont en attente dans le diffStore **When** l'utilisateur n'a pas encore cliqué Valider ou Refuser **Then** aucune modification n'est appliquée au gridStore **And** la barre de commande est désactivée tant qu'un diff est en attente (FR21)
5. **Given** l'utilisateur valide des opérations **When** une erreur survient **Then** un message d'erreur est affiché **And** l'utilisateur peut réessayer ou refuser

## Tasks / Subtasks

- [ ] Task 1: Créer ActionBar component (AC: #1)
  - [ ] 1.1 Créer `src/components/Diff/ActionBar.tsx` qui subscribe à `diffStore`
  - [ ] 1.2 Afficher la barre seulement si `diffPreview !== null`
  - [ ] 1.3 Layout: description + résumé des changements + boutons Valider/Refuser
  - [ ] 1.4 Résumé: "X ajouts, Y modifications, Z suppressions"
  - [ ] 1.5 Bouton Valider: bleu primary (`bg-blue-600`)
  - [ ] 1.6 Bouton Refuser: gris secondary (`border border-gray-300`)
- [ ] Task 2: Implémenter action Valider (AC: #2)
  - [ ] 2.1 Bouton Valider appelle `diffStore.applyPendingOperations()`
  - [ ] 2.2 Vérifier que l'action appelle `operationsEngine.applyOperations()`
  - [ ] 2.3 Vider `pendingOperations`, `description`, et `diffPreview` après succès
  - [ ] 2.4 DiffOverlay et ActionBar disparaissent automatiquement (car diffPreview devient null)
  - [ ] 2.5 Mesurer perf: application < 100ms (NFR4)
- [ ] Task 3: Implémenter action Refuser (AC: #3)
  - [ ] 3.1 Bouton Refuser appelle `diffStore.clearPending()`
  - [ ] 3.2 Vérifier que gridStore reste inchangé
  - [ ] 3.3 Vider `pendingOperations`, `description`, et `diffPreview`
  - [ ] 3.4 DiffOverlay et ActionBar disparaissent automatiquement
  - [ ] 3.5 Mesurer perf: annulation < 100ms (NFR4)
- [ ] Task 4: Gérer loading state pendant validation (AC: #2, #5)
  - [ ] 4.1 Ajouter `isApplying: boolean` au diffStore
  - [ ] 4.2 Passer isApplying à true au début de applyPendingOperations
  - [ ] 4.3 Désactiver les boutons pendant isApplying
  - [ ] 4.4 Afficher "Application..." pendant loading
  - [ ] 4.5 Repasser isApplying à false après succès ou erreur
- [ ] Task 5: Gérer erreurs d'application (AC: #5)
  - [ ] 5.1 Ajouter `applyError: string | null` au diffStore
  - [ ] 5.2 Wrapper applyOperations dans try/catch
  - [ ] 5.3 Stocker erreur dans applyError si échec
  - [ ] 5.4 Afficher erreur dans ActionBar avec bouton dismiss
  - [ ] 5.5 Créer action `clearApplyError()` pour dismiss
  - [ ] 5.6 Permettre réessai après erreur (bouton Valider reste actif)
- [ ] Task 6: Désactiver CommandBar pendant diff (AC: #4)
  - [ ] 6.1 CommandBar subscribe à `diffStore.diffPreview`
  - [ ] 6.2 Si diffPreview !== null, désactiver input et bouton
  - [ ] 6.3 Afficher message: "Veuillez valider ou refuser les changements en cours"
  - [ ] 6.4 Ré-activer après validation ou refus
- [ ] Task 7: Ajouter raccourcis clavier (AC: #1-3)
  - [ ] 7.1 Escape → Refuser (appelle clearPending)
  - [ ] 7.2 Ctrl+Enter ou Cmd+Enter → Valider (appelle applyPendingOperations)
  - [ ] 7.3 Désactiver raccourcis si isApplying === true
  - [ ] 7.4 Hook useKeyboardShortcuts pour gérer les événements
- [ ] Task 8: Créer tests (AC: #1-5)
  - [ ] 8.1 Tester ActionBar affichage conditionnel (visible si diffPreview)
  - [ ] 8.2 Tester clic Valider → applyPendingOperations() appelé
  - [ ] 8.3 Tester clic Refuser → clearPending() appelé
  - [ ] 8.4 Tester disabled state pendant isApplying
  - [ ] 8.5 Tester affichage erreur et dismiss
  - [ ] 8.6 Tester désactivation CommandBar pendant diff
  - [ ] 8.7 Tester raccourcis clavier (Escape, Ctrl+Enter)
  - [ ] 8.8 Tester store: applyPendingOperations vide diffStore après succès
  - [ ] 8.9 Tester store: clearPending vide diffStore sans modifier gridStore
- [ ] Task 9: Validation finale (AC: #1-5)
  - [ ] 9.1 Tous les tests passent
  - [ ] 9.2 Build compile sans erreur
  - [ ] 9.3 Test manuel: commande → diff affiché → Valider → changements appliqués
  - [ ] 9.4 Test manuel: commande → diff affiché → Refuser → aucun changement
  - [ ] 9.5 Test manuel: pendant diff, CommandBar désactivé
  - [ ] 9.6 Test manuel: Escape key pour refuser, Ctrl+Enter pour valider
  - [ ] 9.7 Mesurer perf: validation < 100ms, refus < 100ms (NFR4)

## Dev Notes

### Architecture Compliance

**Source : [architecture.md](../../_bmad-output/planning-artifacts/architecture.md)**

Cette story implémente la validation/refus des opérations IA avec garantie absolue de contrôle utilisateur. AUCUNE modification ne doit être appliquée au gridStore sans action explicite de l'utilisateur (clic Valider, raccourci clavier, ou API call).

**Architecture Pattern:**
- ActionBar component subscribe à diffStore et affiche boutons Valider/Refuser
- Pattern: L'utilisateur a TOUJOURS le dernier mot - pas de modification automatique
- Bouton Valider → `diffStore.applyPendingOperations()` → `operationsEngine.applyOperations()` → mutations gridStore
- Bouton Refuser → `diffStore.clearPending()` → pas de mutation gridStore
- CommandBar désactivé pendant qu'un diff est en attente (évite commandes concurrentes)

### ActionBar Component

**Fichier `src/components/Diff/ActionBar.tsx` :**

```typescript
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
  const totalChanges = totalAdditions + totalModifications + totalDeletions;

  return (
    <div className="border-t border-gray-300 p-4 bg-white">
      {/* Summary */}
      <div className="mb-3">
        <p className="font-semibold text-gray-800">{description}</p>
        <p className="text-sm text-gray-600">
          {totalAdditions} ajout{totalAdditions > 1 ? 's' : ''}, {totalModifications} modification
          {totalModifications > 1 ? 's' : ''}, {totalDeletions} suppression
          {totalDeletions > 1 ? 's' : ''}
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 justify-end">
        <button
          onClick={rejectPendingOperations}
          disabled={isApplying}
          className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Refuser les changements"
        >
          Refuser
        </button>
        <button
          onClick={applyPendingOperations}
          disabled={isApplying}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          aria-label="Valider les changements"
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
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
```

**Fichier `src/components/Diff/index.ts` (updated) :**

```typescript
export { DiffOverlay } from './DiffOverlay';
export { ActionBar } from './ActionBar';
```

### DiffStore Extensions

**Fichier `src/stores/diffStore.ts` (enrichir pour validation/refus) :**

```typescript
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { Operation } from '../types/operations';
import type { DiffResult } from '../types/diff';
import { applyOperations } from '../utils/operationsEngine';
import { calculateDiff } from '../utils/diffCalculator';
import { useGridStore } from './gridStore';

interface DiffStore {
  pendingOperations: Operation[];
  description: string | null;
  diffPreview: DiffResult | null;
  isApplying: boolean;
  applyError: string | null;

  setPendingOperations: (operations: Operation[], description: string) => void;
  applyPendingOperations: () => void;
  rejectPendingOperations: () => void; // Alias for clearPending
  clearPending: () => void;
  clearApplyError: () => void;
}

export const useDiffStore = create<DiffStore>()(
  immer((set, get) => ({
    pendingOperations: [],
    description: null,
    diffPreview: null,
    isApplying: false,
    applyError: null,

    setPendingOperations: (operations, description) =>
      set((state) => {
        state.pendingOperations = operations;
        state.description = description;

        // Calculate diff preview
        const currentGrid = useGridStore.getState().cells;
        state.diffPreview = calculateDiff(operations, currentGrid);
      }),

    applyPendingOperations: () => {
      const { pendingOperations } = get();
      if (pendingOperations.length === 0) return;

      set((state) => {
        state.isApplying = true;
        state.applyError = null;
      });

      try {
        // Apply all operations to gridStore
        applyOperations(pendingOperations);

        // Clear pending and preview after successful application
        set((state) => {
          state.pendingOperations = [];
          state.description = null;
          state.diffPreview = null;
          state.isApplying = false;
        });
      } catch (error) {
        // Store error for display
        set((state) => {
          state.isApplying = false;
          state.applyError =
            error instanceof Error
              ? error.message
              : 'Erreur lors de l\'application des changements';
        });
      }
    },

    rejectPendingOperations: () => {
      get().clearPending();
    },

    clearPending: () =>
      set((state) => {
        state.pendingOperations = [];
        state.description = null;
        state.diffPreview = null;
        state.isApplying = false;
        state.applyError = null;
      }),

    clearApplyError: () =>
      set((state) => {
        state.applyError = null;
      }),
  }))
);
```

### CommandBar Extensions

**Fichier `src/components/CommandBar.tsx` (modifications pour désactivation pendant diff) :**

```typescript
// Add subscription to diffPreview
const hasPendingDiff = useDiffStore((s) => s.diffPreview !== null);

// Disable input and button when diff is pending
<input
  disabled={isLoading || hasPendingDiff}
  // ... other props
/>

<button
  disabled={isLoading || !input.trim() || hasPendingDiff}
  // ... other props
>
  Envoyer
</button>

{/* Show message when diff is pending */}
{hasPendingDiff && (
  <div className="px-4 py-2 bg-yellow-50 border-b border-yellow-300 text-sm text-yellow-800">
    ⚠️ Veuillez valider ou refuser les changements en cours avant d'envoyer une nouvelle commande.
  </div>
)}
```

### Keyboard Shortcuts Hook

**Fichier `src/hooks/useKeyboardShortcuts.ts` (new) :**

```typescript
import { useEffect } from 'react';
import { useDiffStore } from '../stores/diffStore';

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
```

**Utilisation dans App.tsx :**

```typescript
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';

function App() {
  useKeyboardShortcuts(); // Activate keyboard shortcuts

  return (
    // ... existing JSX
  );
}
```

### Testing Strategy

**Fichier `src/components/Diff/ActionBar.test.tsx` :**

```typescript
// @vitest-environment happy-dom
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ActionBar } from './ActionBar';
import { useDiffStore } from '../../stores/diffStore';

describe('ActionBar', () => {
  beforeEach(() => {
    useDiffStore.setState({
      pendingOperations: [],
      description: null,
      diffPreview: null,
      isApplying: false,
      applyError: null,
    });
  });

  it('should not render when no diff preview', () => {
    useDiffStore.setState({ diffPreview: null });
    const { container } = render(<ActionBar />);
    expect(container.firstChild).toBeNull();
  });

  it('should render with summary and buttons when diff preview exists', () => {
    const diffPreview = {
      additions: new Map([['A1', { cellId: 'A1', before: null, after: 42 }]]),
      modifications: new Map([['B2', { cellId: 'B2', before: 10, after: 20 }]]),
      deletions: new Map([['C3', { cellId: 'C3', before: 'del', after: null }]]),
    };

    useDiffStore.setState({
      diffPreview,
      description: 'Test operation',
    });

    render(<ActionBar />);

    expect(screen.getByText('Test operation')).toBeInTheDocument();
    expect(screen.getByText(/1 ajout, 1 modification, 1 suppression/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /valider/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /refuser/i })).toBeInTheDocument();
  });

  it('should call applyPendingOperations when clicking Valider', async () => {
    const user = userEvent.setup();
    const mockApply = vi.fn();

    useDiffStore.setState({
      diffPreview: {
        additions: new Map([['A1', { cellId: 'A1', before: null, after: 42 }]]),
        modifications: new Map(),
        deletions: new Map(),
      },
      description: 'Test',
      applyPendingOperations: mockApply,
    });

    render(<ActionBar />);

    const validateButton = screen.getByRole('button', { name: /valider/i });
    await user.click(validateButton);

    expect(mockApply).toHaveBeenCalled();
  });

  it('should call clearPending when clicking Refuser', async () => {
    const user = userEvent.setup();
    const mockReject = vi.fn();

    useDiffStore.setState({
      diffPreview: {
        additions: new Map([['A1', { cellId: 'A1', before: null, after: 42 }]]),
        modifications: new Map(),
        deletions: new Map(),
      },
      description: 'Test',
      rejectPendingOperations: mockReject,
    });

    render(<ActionBar />);

    const rejectButton = screen.getByRole('button', { name: /refuser/i });
    await user.click(rejectButton);

    expect(mockReject).toHaveBeenCalled();
  });

  it('should disable buttons when applying', () => {
    useDiffStore.setState({
      diffPreview: {
        additions: new Map([['A1', { cellId: 'A1', before: null, after: 42 }]]),
        modifications: new Map(),
        deletions: new Map(),
      },
      description: 'Test',
      isApplying: true,
    });

    render(<ActionBar />);

    const validateButton = screen.getByRole('button', { name: /application/i });
    const rejectButton = screen.getByRole('button', { name: /refuser/i });

    expect(validateButton).toBeDisabled();
    expect(rejectButton).toBeDisabled();
  });

  it('should display error message', () => {
    useDiffStore.setState({
      diffPreview: {
        additions: new Map([['A1', { cellId: 'A1', before: null, after: 42 }]]),
        modifications: new Map(),
        deletions: new Map(),
      },
      description: 'Test',
      applyError: 'Test error message',
    });

    render(<ActionBar />);

    expect(screen.getByRole('alert')).toHaveTextContent('Test error message');
  });

  it('should dismiss error when clicking close button', async () => {
    const user = userEvent.setup();
    const mockClearError = vi.fn();

    useDiffStore.setState({
      diffPreview: {
        additions: new Map([['A1', { cellId: 'A1', before: null, after: 42 }]]),
        modifications: new Map(),
        deletions: new Map(),
      },
      description: 'Test',
      applyError: 'Test error',
      clearApplyError: mockClearError,
    });

    render(<ActionBar />);

    const closeButton = screen.getByRole('button', { name: /fermer l'erreur/i });
    await user.click(closeButton);

    expect(mockClearError).toHaveBeenCalled();
  });
});
```

**Fichier `src/stores/diffStore.test.ts` (new) :**

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDiffStore } from './diffStore';
import { useGridStore } from './gridStore';

describe('diffStore - Validation/Refusal', () => {
  beforeEach(() => {
    // Reset stores
    useGridStore.setState({
      cells: {},
      rowCount: 100,
      colCount: 26,
      editingCell: null,
      selectedCell: null,
    });

    useDiffStore.setState({
      pendingOperations: [],
      description: null,
      diffPreview: null,
      isApplying: false,
      applyError: null,
    });
  });

  it('should apply operations and clear pending state', () => {
    const { result } = renderHook(() => useDiffStore());

    // Set pending operations
    act(() => {
      result.current.setPendingOperations(
        [{ type: 'SET_VALUE', cellId: 'A1', value: 42 }],
        'Test operation'
      );
    });

    expect(result.current.diffPreview).not.toBeNull();

    // Apply operations
    act(() => {
      result.current.applyPendingOperations();
    });

    // Verify pending state is cleared
    expect(result.current.pendingOperations).toEqual([]);
    expect(result.current.description).toBeNull();
    expect(result.current.diffPreview).toBeNull();

    // Verify gridStore was updated
    const gridState = useGridStore.getState();
    expect(gridState.cells['A1']?.value).toBe(42);
  });

  it('should clear pending without modifying gridStore on reject', () => {
    const { result } = renderHook(() => useDiffStore());

    // Set pending operations
    act(() => {
      result.current.setPendingOperations(
        [{ type: 'SET_VALUE', cellId: 'A1', value: 42 }],
        'Test operation'
      );
    });

    // Reject operations
    act(() => {
      result.current.rejectPendingOperations();
    });

    // Verify pending state is cleared
    expect(result.current.pendingOperations).toEqual([]);
    expect(result.current.diffPreview).toBeNull();

    // Verify gridStore was NOT updated
    const gridState = useGridStore.getState();
    expect(gridState.cells['A1']).toBeUndefined();
  });

  it('should handle errors during apply', () => {
    const { result } = renderHook(() => useDiffStore());

    // Set invalid operation that will throw
    act(() => {
      result.current.setPendingOperations(
        [{ type: 'SET_VALUE', cellId: 'INVALID_ID', value: 42 }],
        'Invalid operation'
      );
    });

    // Apply operations (will throw)
    act(() => {
      result.current.applyPendingOperations();
    });

    // Verify error is stored
    expect(result.current.applyError).toBeTruthy();
    expect(result.current.isApplying).toBe(false);

    // Verify pending state is preserved (allows retry)
    expect(result.current.pendingOperations.length).toBeGreaterThan(0);
  });
});
```

### Previous Story Intelligence

**Learnings critiques des stories précédentes :**

1. **Story 2.4 — DiffOverlay Pattern:**
   - Components subscribe sélectivement: `useDiffStore((s) => s.diffPreview)`
   - Affichage conditionnel: `if (!diffPreview) return null;`
   - Calcul unique dans store, pas à chaque render
   - DiffOverlay et ActionBar disparaissent automatiquement quand diffPreview devient null

2. **Story 2.3 — Operations Engine:**
   - `applyOperations()` est la fonction centrale pour appliquer les mutations
   - Déjà wrapper dans try/catch si nécessaire
   - Atomique: toutes les opérations réussissent ou toutes échouent

3. **Story 2.2 — CommandBar Loading Pattern:**
   - Loading state: `isLoading: boolean`
   - Désactivation: `disabled={isLoading || !input.trim()}`
   - Affichage conditionnel: `{isLoading ? 'Traitement...' : 'Envoyer'}`
   - Error display: role="alert" avec bouton dismiss

4. **Story 1.3 — Keyboard Navigation:**
   - Hook pattern pour gérer événements clavier
   - `useEffect` avec cleanup pour addEventListener/removeEventListener
   - Vérification conditions avant action (e.g., isApplying)

5. **Git Analysis — Button Patterns:**
   - Primary action: `bg-blue-600 text-white rounded hover:bg-blue-700`
   - Secondary action: `border border-gray-300 rounded hover:bg-gray-50`
   - Disabled: `disabled:opacity-50 disabled:cursor-not-allowed`
   - ARIA labels pour accessibilité

### Contraintes et Points d'Attention

1. **Garantie Contrôle Utilisateur (FR21)** — CRITIQUE: Aucune modification du gridStore ne DOIT se produire sans action explicite de l'utilisateur. Pas de validation automatique, pas de timeout qui valide, pas d'événement externe qui trigger validation.

2. **Performance < 100ms (NFR4)** — Validation et refus doivent être instantanés. Mesurer avec `performance.now()`. `applyOperations()` est déjà optimisé (Story 2.3), mais vérifier temps total depuis clic jusqu'à disparition du diff.

3. **Gestion Concurrence** — Désactiver CommandBar pendant qu'un diff est en attente. Empêche l'utilisateur d'envoyer une nouvelle commande pendant qu'un diff est affiché.

4. **Error Recovery** — En cas d'erreur lors de validation, NE PAS vider pendingOperations. Permettre à l'utilisateur de réessayer Valider ou de Refuser.

5. **Keyboard Accessibility** — Escape et Ctrl+Enter sont des raccourcis standards. S'assurer qu'ils ne interfèrent pas avec d'autres fonctionnalités (édition de cellule, etc.).

6. **State Synchronization** — DiffOverlay, ActionBar, et CommandBar doivent tous réagir de façon cohérente aux changements de diffStore. Utiliser subscriptions sélectives pour éviter re-renders inutiles.

7. **Testing Focus** — Tester particulièrement:
   - GridStore reste inchangé après Refuser
   - GridStore est modifié après Valider
   - CommandBar désactivé pendant diff
   - Raccourcis clavier fonctionnent
   - Error handling avec retry

### Scope — Ce qui est HORS de cette story

- **Undo/Redo après validation** → Post-MVP (Story 3.x gère historique)
- **Confirmation dialog pour destructive actions** → Post-MVP (simplification UX)
- **Batch multiple validations** → Post-MVP (valider plusieurs diffs d'un coup)
- **Validation partielle** → Post-MVP (valider seulement certaines opérations)
- **Auto-save trigger après validation** → Déjà géré par Story 1.6 (auto-save toutes les 30s)

### Project Structure Notes

Fichiers créés/modifiés par cette story :

```
frontend/src/
├── components/
│   ├── Diff/
│   │   ├── ActionBar.tsx             (new — boutons Valider/Refuser)
│   │   ├── ActionBar.test.tsx        (new — tests du composant)
│   │   └── index.ts                  (modified — export ActionBar)
│   └── CommandBar.tsx                (modified — désactivation pendant diff)
├── hooks/
│   ├── useKeyboardShortcuts.ts       (new — Escape/Ctrl+Enter)
│   └── useKeyboardShortcuts.test.ts  (new — tests des shortcuts)
├── stores/
│   ├── diffStore.ts                  (modified — isApplying, applyError, clearApplyError)
│   └── diffStore.test.ts             (new — tests validation/refusal)
└── App.tsx                           (modified — import ActionBar + useKeyboardShortcuts)
```

### References

- [Source: architecture.md#Control & Safety] — Garantie contrôle utilisateur, pas de modifications automatiques
- [Source: epics.md#Story 2.5] — User story, acceptance criteria
- [Source: Story 2.4] — DiffOverlay, diffStore, conditional rendering pattern
- [Source: Story 2.3] — operationsEngine, applyOperations()
- [Source: Story 2.2] — CommandBar, loading states, error display
- [Source: Story 1.3] — Keyboard navigation patterns
- [Source: Git Analysis] — Button patterns, ARIA labels, testing patterns

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
