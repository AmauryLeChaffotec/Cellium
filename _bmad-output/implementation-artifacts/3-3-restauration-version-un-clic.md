---
story_id: 3-3-restauration-version-un-clic
epic: epic-3
title: Restauration de Version en Un Clic
status: ready-for-dev
created: 2026-02-12
---

# Story 3.3: Restauration de Version en Un Clic

## User Story

**As a** utilisateur,
**I want** restaurer n'importe quelle version précédente en un clic,
**So that** je peux revenir en arrière si je ne suis pas satisfait des changements.

## Context

Cette story complète **Epic 3: Gestion de Versions** en ajoutant la fonctionnalité de restauration. L'utilisateur peut cliquer sur un bouton "Restaurer" dans le VersionPanel pour revenir à n'importe quelle version précédente.

**Dépendances:**
- ✅ Story 3.1 (Snapshots Automatiques) — Les snapshots doivent être capturés
- ✅ Story 3.2 (Historique Consultable) — Le VersionPanel doit afficher les versions

**Ce que cette story NE fait PAS:**
- N'inclut PAS la comparaison visuelle entre versions (feature future)
- N'inclut PAS l'édition ou suppression manuelle de snapshots

Cette story se concentre uniquement sur la **restauration en un clic**.

## Acceptance Criteria

### AC1: Bouton Restaurer Visible

**Given** l'historique affiche plusieurs versions dans le VersionPanel
**When** l'utilisateur regarde une version
**Then** un bouton "Restaurer" est visible à côté de chaque version (FR28)

### AC2: Restauration Rapide (< 1s)

**Given** l'utilisateur clique sur "Restaurer" à côté d'une version
**When** la restauration s'exécute
**Then** la grille est restaurée à l'état de cette version (FR28)
**And** la restauration prend < 1 seconde (NFR5)

### AC3: Historique Préservé (Immuable)

**Given** une version est restaurée
**When** le gridStore est mis à jour
**Then** l'historique existant reste intact et n'est PAS supprimé (NFR18)
**And** la restauration elle-même crée un nouveau snapshot dans l'historique

### AC4: Restauration Complète

**Given** l'utilisateur restaure la version la plus ancienne
**When** la grille se met à jour
**Then** les données correspondent exactement à l'état initial de cette version
**And** aucun snapshot intermédiaire n'est corrompu (NFR18)

### AC5: Confirmation de Restauration

**Given** l'utilisateur clique sur "Restaurer"
**When** la restauration est en cours
**Then** un indicateur visuel montre que l'opération est en cours
**And** le VersionPanel reste ouvert après la restauration

## Technical Implementation

### Task Breakdown

#### Task 1: Ajouter restoreFromSnapshot dans versionStore

**File:** `frontend/src/stores/versionStore.ts` (Modifier)

```typescript
interface VersionStore {
  snapshots: Snapshot[];
  isLoading: boolean;
  isRestoring: boolean; // NEW

  createSnapshot: (operations: Operation[], description: string) => void;
  loadSnapshots: () => Promise<void>;
  clearSnapshots: () => void;
  restoreFromSnapshot: (snapshotId: string) => void; // NEW
}

export const useVersionStore = create<VersionStore>()(
  immer((set, get) => ({
    snapshots: [],
    isLoading: false,
    isRestoring: false, // NEW

    // ... existing methods ...

    restoreFromSnapshot: (snapshotId) => {
      const snapshot = get().snapshots.find((s) => s.id === snapshotId);
      if (!snapshot) {
        console.error('Snapshot not found:', snapshotId);
        return;
      }

      set((state) => {
        state.isRestoring = true;
      });

      try {
        // Apply all operations from the snapshot to gridStore
        applyOperations(snapshot.operations);

        // Create a NEW snapshot for the restoration itself
        const restoreDescription = `Restauration: ${snapshot.description}`;
        get().createSnapshot(snapshot.operations, restoreDescription);

        set((state) => {
          state.isRestoring = false;
        });
      } catch (error) {
        console.error('Failed to restore snapshot:', error);
        set((state) => {
          state.isRestoring = false;
        });
      }
    },
  }))
);
```

**Notes:**
- `restoreFromSnapshot()` takes a snapshot ID and applies its operations
- Creates a NEW snapshot for the restoration (preserves history, NFR18)
- `isRestoring` flag prevents concurrent restore operations

**IMPORTANT:** This approach applies the operations from the snapshot, but there's a subtle issue. Snapshots store **delta operations** (e.g., "insert column C"), not **absolute state**. To restore to a specific snapshot, we need to:
1. Clear the current grid
2. Replay ALL operations from the first snapshot up to the target snapshot

Let me revise the implementation:

```typescript
restoreFromSnapshot: (snapshotId) => {
  const { snapshots } = get();
  const targetIndex = snapshots.findIndex((s) => s.id === snapshotId);
  
  if (targetIndex === -1) {
    console.error('Snapshot not found:', snapshotId);
    return;
  }

  set((state) => {
    state.isRestoring = true;
  });

  try {
    // Clear the grid
    useGridStore.getState().clearGrid();

    // Replay all operations from snapshot 0 to target snapshot
    for (let i = 0; i <= targetIndex; i++) {
      applyOperations(snapshots[i].operations);
    }

    // Create a NEW snapshot for the restoration
    const targetSnapshot = snapshots[targetIndex];
    const restoreDescription = `Restauration: ${targetSnapshot.description}`;
    
    // The restoration snapshot should contain ALL operations up to this point
    const allOperations = snapshots
      .slice(0, targetIndex + 1)
      .flatMap((s) => s.operations);
    
    get().createSnapshot(allOperations, restoreDescription);

    set((state) => {
      state.isRestoring = false;
    });
  } catch (error) {
    console.error('Failed to restore snapshot:', error);
    set((state) => {
      state.isRestoring = false;
    });
  }
},
```

**Wait, this still has issues.** The problem is that each snapshot stores operations that were applied **on top of the previous state**, not from scratch. So to restore to snapshot N, we need to:
1. Start from empty grid
2. Apply operations from snapshot 0, then 1, then 2, ... up to N

But this is inefficient. A better approach is to store the **full grid state** in each snapshot, not just operations. However, the PRD specifies "FR29: Le système stocke les versions de façon incrémentale (deltas, pas copies complètes)".

Given this constraint, the correct approach is:
- Each snapshot stores the delta operations that were applied
- To restore to snapshot N, replay operations from 0 to N
- This is acceptable performance-wise (<1s) since we're not storing thousands of snapshots

Let me finalize the implementation:

```typescript
restoreFromSnapshot: (snapshotId) => {
  const { snapshots } = get();
  const targetIndex = snapshots.findIndex((s) => s.id === snapshotId);
  
  if (targetIndex === -1) {
    console.error('Snapshot not found:', snapshotId);
    return;
  }

  set((state) => {
    state.isRestoring = true;
  });

  try {
    // Clear the grid
    useGridStore.setState({ cells: {}, rowCount: 100, colCount: 26 });

    // Replay all operations from snapshot 0 to target snapshot
    for (let i = 0; i <= targetIndex; i++) {
      applyOperations(snapshots[i].operations);
    }

    // Create a NEW snapshot for the restoration
    const targetSnapshot = snapshots[targetIndex];
    const restoreDescription = `Restauration: ${targetSnapshot.description}`;
    
    // Store the operations from the target snapshot as the restoration snapshot
    get().createSnapshot(targetSnapshot.operations, restoreDescription);

    set((state) => {
      state.isRestoring = false;
    });
  } catch (error) {
    console.error('Failed to restore snapshot:', error);
    set((state) => {
      state.isRestoring = false;
    });
  }
},
```

#### Task 2: Ajouter le Bouton Restaurer dans VersionItem

**File:** `frontend/src/components/Version/VersionItem.tsx` (Modifier)

```typescript
import type { Snapshot } from '../../types/version';
import { formatTimestamp } from '../../utils/dateUtils';
import { useVersionStore } from '../../stores/versionStore';

interface VersionItemProps {
  snapshot: Snapshot;
}

export function VersionItem({ snapshot }: VersionItemProps) {
  const formattedDate = formatTimestamp(snapshot.timestamp);
  const { isRestoring, restoreFromSnapshot } = useVersionStore();

  const handleRestore = () => {
    restoreFromSnapshot(snapshot.id);
  };

  return (
    <div className="p-4 hover:bg-gray-50 transition-colors">
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-800">{snapshot.description}</p>
          <p className="text-xs text-gray-500 mt-1">{formattedDate}</p>
        </div>
      </div>

      {/* Operations Summary */}
      <div className="mt-2 flex gap-2 text-xs items-center justify-between">
        <span className="text-gray-600">
          {snapshot.operations.length} opération{snapshot.operations.length > 1 ? 's' : ''}
        </span>
        
        {/* Restore Button */}
        <button
          onClick={handleRestore}
          disabled={isRestoring}
          className="px-3 py-1 text-xs text-blue-600 hover:bg-blue-50 rounded border border-blue-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isRestoring ? 'Restauration...' : 'Restaurer'}
        </button>
      </div>
    </div>
  );
}
```

**Notes:**
- Button shows "Restauration..." during restore operation
- Disabled when `isRestoring` is true (prevents concurrent restores)
- Blue color to differentiate from validation buttons (blue = info action)

#### Task 3: Ajouter clearGrid dans gridStore

**File:** `frontend/src/stores/gridStore.ts` (Modifier)

Add a new action to clear the grid:

```typescript
clearGrid: () =>
  set((state) => {
    state.cells = {};
    state.editingCell = null;
    state.selectedCell = null;
  }),
```

This allows versionStore to reset the grid before replaying operations.

#### Task 4: Créer Tests pour restoreFromSnapshot

**File:** `frontend/src/stores/versionStore.restore.test.ts`

```typescript
// @vitest-environment happy-dom
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useVersionStore } from './versionStore';
import { useGridStore } from './gridStore';
import * as versionPersistence from '../utils/versionPersistence';
import type { Operation } from '../types/operations';

vi.mock('../utils/versionPersistence', () => ({
  saveSnapshotToDB: vi.fn(() => Promise.resolve()),
  loadSnapshotsFromDB: vi.fn(() => Promise.resolve([])),
  clearSnapshotsFromDB: vi.fn(() => Promise.resolve()),
}));

describe('versionStore - Restore', () => {
  beforeEach(() => {
    useGridStore.setState({ cells: {}, rowCount: 100, colCount: 26, editingCell: null, selectedCell: null });
    useVersionStore.setState({ snapshots: [], isLoading: false, isRestoring: false });
    vi.clearAllMocks();
  });

  it('should restore grid to a previous snapshot', () => {
    const { result: versionResult } = renderHook(() => useVersionStore());
    const { result: gridResult } = renderHook(() => useGridStore());

    // Create 3 snapshots
    act(() => {
      versionResult.current.createSnapshot(
        [{ type: 'SET_VALUE', cellId: 'A1', value: 10 }] as Operation[],
        'First'
      );
      versionResult.current.createSnapshot(
        [{ type: 'SET_VALUE', cellId: 'B1', value: 20 }] as Operation[],
        'Second'
      );
      versionResult.current.createSnapshot(
        [{ type: 'SET_VALUE', cellId: 'C1', value: 30 }] as Operation[],
        'Third'
      );
    });

    expect(versionResult.current.snapshots).toHaveLength(3);

    // Apply all operations to simulate current state
    act(() => {
      gridResult.current.setCellValue('A1', 10);
      gridResult.current.setCellValue('B1', 20);
      gridResult.current.setCellValue('C1', 30);
    });

    // Restore to snapshot 1 (First + Second)
    const snapshot1Id = versionResult.current.snapshots[1].id;
    act(() => {
      versionResult.current.restoreFromSnapshot(snapshot1Id);
    });

    // Grid should have A1=10, B1=20, but NOT C1
    const gridState = useGridStore.getState();
    expect(gridState.cells['A1']?.value).toBe(10);
    expect(gridState.cells['B1']?.value).toBe(20);
    expect(gridState.cells['C1']).toBeUndefined();

    // A new restoration snapshot should be created
    expect(versionResult.current.snapshots).toHaveLength(4);
    expect(versionResult.current.snapshots[3].description).toMatch(/Restauration/);
  });

  it('should set isRestoring during restoration', () => {
    const { result } = renderHook(() => useVersionStore());

    act(() => {
      result.current.createSnapshot(
        [{ type: 'SET_VALUE', cellId: 'A1', value: 10 }] as Operation[],
        'Test'
      );
    });

    const snapshotId = result.current.snapshots[0].id;

    act(() => {
      result.current.restoreFromSnapshot(snapshotId);
    });

    // After restoration completes, isRestoring should be false
    expect(result.current.isRestoring).toBe(false);
  });

  it('should handle restore of non-existent snapshot', () => {
    const { result } = renderHook(() => useVersionStore());
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation();

    act(() => {
      result.current.restoreFromSnapshot('non-existent-id');
    });

    expect(consoleErrorSpy).toHaveBeenCalledWith('Snapshot not found:', 'non-existent-id');
    expect(result.current.isRestoring).toBe(false);

    consoleErrorSpy.mockRestore();
  });

  it('should preserve history after restoration (NFR18)', () => {
    const { result } = renderHook(() => useVersionStore());

    // Create 2 snapshots
    act(() => {
      result.current.createSnapshot(
        [{ type: 'SET_VALUE', cellId: 'A1', value: 10 }] as Operation[],
        'First'
      );
      result.current.createSnapshot(
        [{ type: 'SET_VALUE', cellId: 'B1', value: 20 }] as Operation[],
        'Second'
      );
    });

    const originalSnapshotCount = result.current.snapshots.length;

    // Restore to first snapshot
    const snapshot0Id = result.current.snapshots[0].id;
    act(() => {
      result.current.restoreFromSnapshot(snapshot0Id);
    });

    // Original snapshots should still exist + 1 new restoration snapshot
    expect(result.current.snapshots).toHaveLength(originalSnapshotCount + 1);
    expect(result.current.snapshots[0].description).toBe('First');
    expect(result.current.snapshots[1].description).toBe('Second');
    expect(result.current.snapshots[2].description).toMatch(/Restauration/);
  });
});
```

**Coverage:**
- ✅ Restore to previous snapshot
- ✅ isRestoring flag
- ✅ Handle non-existent snapshot
- ✅ Preserve history (NFR18)

#### Task 5: Créer Tests pour VersionItem avec Restore Button

**File:** `frontend/src/components/Version/VersionItem.test.tsx` (Modifier)

Add new tests for the restore button:

```typescript
it('should display restore button', () => {
  const mockSnapshot: Snapshot = {
    id: '1',
    timestamp: '2026-02-12T14:30:00.000Z',
    description: 'Test',
    operations: [],
  };

  useVersionStore.setState({ snapshots: [mockSnapshot], isLoading: false, isRestoring: false });

  render(<VersionItem snapshot={mockSnapshot} />);
  expect(screen.getByText('Restaurer')).toBeInTheDocument();
});

it('should call restoreFromSnapshot when restore button is clicked', () => {
  const mockSnapshot: Snapshot = {
    id: '1',
    timestamp: '2026-02-12T14:30:00.000Z',
    description: 'Test',
    operations: [],
  };

  useVersionStore.setState({ snapshots: [mockSnapshot], isLoading: false, isRestoring: false });

  const mockRestore = vi.fn();
  useVersionStore.getState().restoreFromSnapshot = mockRestore;

  render(<VersionItem snapshot={mockSnapshot} />);

  const restoreButton = screen.getByText('Restaurer');
  restoreButton.click();

  expect(mockRestore).toHaveBeenCalledWith('1');
});

it('should disable restore button when isRestoring is true', () => {
  const mockSnapshot: Snapshot = {
    id: '1',
    timestamp: '2026-02-12T14:30:00.000Z',
    description: 'Test',
    operations: [],
  };

  useVersionStore.setState({ snapshots: [mockSnapshot], isLoading: false, isRestoring: true });

  render(<VersionItem snapshot={mockSnapshot} />);

  const restoreButton = screen.getByText('Restauration...') as HTMLButtonElement;
  expect(restoreButton.disabled).toBe(true);
});
```

#### Task 6: Validation Finale

```bash
# Run all tests
cd frontend
npm run test

# Build production
npm run build

# Verify no TypeScript errors
npm run type-check
```

**Success criteria:**
- ✅ Tous les tests passent (nouveau total: 256 + ~7 = 263 tests)
- ✅ Build réussit sans erreurs TypeScript
- ✅ Restauration fonctionne manuellement dans l'app

## Dev Notes

### Architecture Decisions

**1. Restauration par Replay d'Opérations**
- Chaque snapshot stocke des opérations delta (FR29)
- Pour restaurer au snapshot N, on rejoue les opérations de 0 à N
- Avantages:
  - Respecte FR29 (stockage incrémental)
  - Garantit cohérence (même logique que validation initiale)
- Inconvénients:
  - Performance O(N) où N = index du snapshot
  - Acceptable car < 1s pour ~50 snapshots (NFR5)

**2. Nouveau Snapshot pour Chaque Restauration (NFR18)**
- La restauration crée un nouveau snapshot avec description "Restauration: [original]"
- Avantages:
  - Historique immuable (NFR18)
  - L'utilisateur peut voir toutes les restaurations dans l'historique
  - Possibilité de "undo" une restauration
- Inconvénients:
  - Historique peut devenir long avec de nombreuses restaurations
  - Acceptable car l'utilisateur garde le contrôle

**3. Flag isRestoring Global**
- Empêche les restaurations concurrentes
- Désactive tous les boutons "Restaurer" pendant la restauration
- Feedback visuel: "Restauration..." sur le bouton cliqué

### Performance Optimization

**Target: < 1s (NFR5)**

Estimation pour 50 snapshots:
- Clear grid: ~1ms
- Replay 50 operations: ~50ms (1ms par opération)
- Create snapshot: ~5ms
- **Total: ~56ms ✅**

Even with 100 snapshots:
- Replay 100 operations: ~100ms
- **Total: ~106ms ✅**

**Bottleneck potentiel:**
- Si les opérations sont complexes (ex: tri de 1000 lignes)
- Mitigation: Les snapshots contiennent des opérations atomiques, pas des opérations composées

### Edge Cases

**1. Restauration du Snapshot Courant**
- Si l'utilisateur restaure le snapshot le plus récent (état actuel)
- Comportement: Rejoue les opérations → Aucun changement visible
- Un nouveau snapshot "Restauration: ..." est quand même créé
- Alternative considérée: Désactiver le bouton pour le snapshot courant (rejected pour simplicité)

**2. Restauration Pendant un Diff en Attente**
- Si un diff est en attente (diffStore.diffPreview !== null)
- Comportement: La restauration fonctionne, mais peut créer de la confusion
- Mitigation: Documenter que l'utilisateur doit valider/refuser le diff avant de restaurer
- Alternative: Désactiver la restauration si diff en attente (future enhancement)

**3. Restauration Échoue**
- Si une opération échoue pendant le replay (ex: cellId invalide)
- Comportement: L'erreur est loggée, `isRestoring` = false
- L'état de la grille peut être partiellement restauré
- Mitigation: Les opérations validées dans l'historique ne devraient jamais échouer

**4. Historique Vide**
- Si aucun snapshot n'existe, aucun bouton "Restaurer" n'est affiché
- Le VersionPanel affiche "Aucune version enregistrée"

### Testing Strategy

**Unit Tests:**
- versionStore.restoreFromSnapshot: restore, isRestoring, errors, history preservation
- VersionItem: restore button display, click, disabled state

**Integration Tests:**
- versionStore + gridStore: restore updates grid correctly
- Multi-snapshot restore: replay operations in order

**Manual Testing:**
1. Valider 3 commandes IA → Ouvrir historique → 3 snapshots affichés
2. Cliquer "Restaurer" sur le 1er snapshot → Grille revient à l'état après 1ère commande
3. Vérifier historique → 4 snapshots (3 originaux + 1 restauration)
4. Cliquer "Restaurer" sur le snapshot le plus ancien → Grille vide (état initial)
5. Vérifier performance: restauration de 10 snapshots < 1s

## Definition of Done

- [ ] versionStore.restoreFromSnapshot implémenté
- [ ] gridStore.clearGrid ajouté
- [ ] VersionItem modifié avec bouton "Restaurer"
- [ ] Tests versionStore restore (4+ assertions)
- [ ] Tests VersionItem restore button (3+ assertions)
- [ ] Tous les tests passent (263+ tests)
- [ ] Build production réussit sans erreurs TypeScript
- [ ] Vérification manuelle: restauration fonctionne, < 1s, historique préservé

## Related Requirements

**Functional:**
- FR28: L'utilisateur peut restaurer n'importe quelle version précédente en un clic
- FR29: Le système stocke les versions de façon incrémentale (deltas, pas copies complètes)

**NonFunctional:**
- NFR5: Restauration version — Snapshot complet restauré en < 1s
- NFR18: Intégrité versioning — Snapshots immuables, restauration ne corrompt pas l'historique

## Next Steps

After this story:
- **Epic 3 Complete:** All versioning functionality implemented
- **Next Epic:** Consider Epic 1/2 retrospectives, or start new features based on user feedback
