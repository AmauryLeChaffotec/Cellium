# Story 2.4: Diff Visuel des Propositions IA

Status: ready-for-dev

## Story

As a utilisateur,
I want voir visuellement ce que l'IA propose de changer avant que ça soit appliqué,
So that je comprends exactement ce qui va se passer.

## Acceptance Criteria

1. **Given** des opérations IA sont reçues du backend **When** elles arrivent dans le diffStore **Then** un preview est calculé sans modifier le gridStore **And** le DiffOverlay s'affiche sur la grille (FR17)
2. **Given** une opération ajoute des cellules/lignes/colonnes **When** le diff est affiché **Then** les ajouts sont surlignés en vert (FR18)
3. **Given** une opération modifie des cellules existantes **When** le diff est affiché **Then** les modifications sont surlignées en orange (FR18)
4. **Given** une opération supprime des lignes/colonnes **When** le diff est affiché **Then** les suppressions sont surlignées en rouge (FR18)
5. **Given** le diff s'affiche **When** l'utilisateur consulte les changements **Then** l'affichage prend < 200ms après réception des opérations (NFR3)

## Tasks / Subtasks

- [ ] Task 1: Créer le calcul de diff (AC: #1)
  - [ ] 1.1 Créer `src/utils/diffCalculator.ts` avec fonction `calculateDiff(operations: Operation[], currentGrid: Grid): DiffResult`
  - [ ] 1.2 DiffResult contient trois maps: `additions`, `modifications`, `deletions`
  - [ ] 1.3 Pour chaque type d'opération, identifier les cellules affectées
  - [ ] 1.4 Calculer les valeurs "before" (depuis gridStore) et "after" (simulées)
  - [ ] 1.5 Classifier chaque changement: addition (nouvelle cellule), modification (cellule existante change), deletion (cellule supprimée)
- [ ] Task 2: Enrichir diffStore avec preview (AC: #1)
  - [ ] 2.1 Ajouter `diffPreview: DiffResult | null` au state de diffStore
  - [ ] 2.2 Modifier `setPendingOperations()` pour calculer automatiquement le diff via `calculateDiff()`
  - [ ] 2.3 Stocker le preview dans le state
  - [ ] 2.4 Vider le preview dans `clearPending()` et `applyPendingOperations()`
- [ ] Task 3: Créer DiffOverlay component (AC: #1-4)
  - [ ] 3.1 Créer `src/components/Diff/DiffOverlay.tsx` qui subscribe à `diffStore.diffPreview`
  - [ ] 3.2 Si `diffPreview` est null, ne rien afficher
  - [ ] 3.3 Si `diffPreview` existe, afficher un overlay au-dessus de SpreadsheetGrid
  - [ ] 3.4 Pour chaque cellule dans `additions`, afficher surbrillance verte avec valeur "after"
  - [ ] 3.5 Pour chaque cellule dans `modifications`, afficher surbrillance orange avec "before → after"
  - [ ] 3.6 Pour chaque cellule dans `deletions`, afficher surbrillance rouge avec valeur "before" barrée
- [ ] Task 4: Intégrer styling visuel (AC: #2-4)
  - [ ] 4.1 Ajout = vert clair (`bg-green-100 border-green-400`)
  - [ ] 4.2 Modification = orange clair (`bg-orange-100 border-orange-400`)
  - [ ] 4.3 Suppression = rouge clair (`bg-red-100 border-red-400`)
  - [ ] 4.4 Afficher icône pour chaque type: `+` (ajout), `~` (modif), `-` (suppression)
  - [ ] 4.5 Tooltip avec détails sur hover
- [ ] Task 5: Gérer cas spéciaux (AC: #1-4)
  - [ ] 5.1 INSERT_ROW/INSERT_COLUMN: toutes nouvelles cellules = additions vertes
  - [ ] 5.2 DELETE_ROW/DELETE_COLUMN: toutes cellules supprimées = deletions rouges
  - [ ] 5.3 SORT: cellules qui changent de position = modifications oranges (afficher "A1 → B2")
  - [ ] 5.4 FORMAT: cellules formatées = modifications oranges (afficher format change)
  - [ ] 5.5 SET_VALUE sur cellule existante = modification orange
  - [ ] 5.6 SET_VALUE sur cellule vide = addition verte
- [ ] Task 6: Optimiser performance (AC: #5)
  - [ ] 6.1 Calculer diff une seule fois dans `setPendingOperations()`, pas à chaque render
  - [ ] 6.2 Utiliser React.memo pour DiffOverlay si nécessaire
  - [ ] 6.3 Limiter le nombre de cellules affichées (max 500 changements visibles, avec message si dépassé)
  - [ ] 6.4 Mesurer perf avec `performance.now()` : < 200ms pour calcul + render
- [ ] Task 7: Créer tests (AC: #1-5)
  - [ ] 7.1 Tester `diffCalculator.ts` : SET_VALUE addition, modification
  - [ ] 7.2 Tester INSERT_ROW : toutes cellules nouvelles = additions
  - [ ] 7.3 Tester DELETE_ROW : toutes cellules supprimées = deletions
  - [ ] 7.4 Tester SORT : cellules réordonnées = modifications
  - [ ] 7.5 Tester FORMAT : cellules formatées = modifications
  - [ ] 7.6 Tester DiffOverlay component : affiche correctement additions, modifications, deletions
  - [ ] 7.7 Tester diffStore : `setPendingOperations()` calcule le preview
- [ ] Task 8: Intégrer avec CommandBar (AC: #1)
  - [ ] 8.1 Après réception des opérations, CommandBar appelle `diffStore.setPendingOperations()`
  - [ ] 8.2 DiffOverlay apparaît automatiquement (souscrit à diffStore)
  - [ ] 8.3 Vérifier que la grille reste interactive (lecture seule pendant le diff)
- [ ] Task 9: Validation finale (AC: #1-5)
  - [ ] 9.1 Tous les tests passent
  - [ ] 9.2 Build compile sans erreur
  - [ ] 9.3 Test manuel : commande "ajouter une colonne Total" → voir ajouts en vert
  - [ ] 9.4 Test manuel : commande "trier par colonne A" → voir modifications en orange
  - [ ] 9.5 Test manuel : commande "supprimer ligne 3" → voir suppressions en rouge
  - [ ] 9.6 Mesurer perf : diff s'affiche en < 200ms (NFR3)

## Dev Notes

### Architecture Compliance

**Source : [architecture.md](../../_bmad-output/planning-artifacts/architecture.md)**

Cette story implémente la visualisation des opérations IA avant application. Le diff visuel DOIT être calculé sans modifier le gridStore (read-only preview). Le composant DiffOverlay DOIT s'afficher par-dessus la grille existante et disparaître après validation/refus (Story 2.5).

**Architecture Pattern:**
- Diff calculation est une **fonction utilitaire pure** qui prend operations + currentGrid et retourne DiffResult
- Pattern: `calculateDiff(operations: Operation[], currentGrid: Grid): DiffResult`
- DiffStore stocke le preview calculé (`diffPreview: DiffResult | null`)
- DiffOverlay component subscribe à diffStore et affiche le preview en overlay
- Aucune modification du gridStore jusqu'à validation (Story 2.5)

### Diff Calculator — Pure Function Pattern

**Fichier `src/types/diff.ts` :**

```typescript
export interface CellDiff {
  cellId: string;
  before: string | number | null;
  after: string | number | null;
  formatBefore?: CellFormat;
  formatAfter?: CellFormat;
}

export interface DiffResult {
  additions: Map<string, CellDiff>;      // cellId → diff (nouvelle cellule)
  modifications: Map<string, CellDiff>;  // cellId → diff (cellule modifiée)
  deletions: Map<string, CellDiff>;      // cellId → diff (cellule supprimée)
}
```

**Fichier `src/utils/diffCalculator.ts` :**

```typescript
import type { Operation } from '../types/operations';
import type { Grid } from '../types/cell';
import type { DiffResult, CellDiff } from '../types/diff';
import { cellIdToCoords, coordsToCellId } from './cellUtils';

/**
 * Calculate visual diff for AI operations without applying them.
 * Returns categorized cell changes: additions, modifications, deletions.
 *
 * @param operations - Array of operations from AI
 * @param currentGrid - Current grid state (read-only)
 * @returns DiffResult with additions, modifications, deletions
 */
export function calculateDiff(
  operations: Operation[],
  currentGrid: Grid
): DiffResult {
  const additions = new Map<string, CellDiff>();
  const modifications = new Map<string, CellDiff>();
  const deletions = new Map<string, CellDiff>();

  // Simulate operations to build preview grid
  let simulatedGrid = { ...currentGrid };

  for (const operation of operations) {
    switch (operation.type) {
      case 'SET_VALUE':
        handleSetValueDiff(operation, simulatedGrid, additions, modifications, deletions);
        break;
      case 'SET_FORMULA':
        handleSetFormulaDiff(operation, simulatedGrid, additions, modifications);
        break;
      case 'INSERT_ROW':
        handleInsertRowDiff(operation, simulatedGrid, additions);
        break;
      case 'INSERT_COLUMN':
        handleInsertColumnDiff(operation, simulatedGrid, additions);
        break;
      case 'DELETE_ROW':
        handleDeleteRowDiff(operation, simulatedGrid, deletions);
        break;
      case 'DELETE_COLUMN':
        handleDeleteColumnDiff(operation, simulatedGrid, deletions);
        break;
      case 'SORT':
        handleSortDiff(operation, simulatedGrid, modifications);
        break;
      case 'FORMAT':
        handleFormatDiff(operation, simulatedGrid, modifications);
        break;
    }
  }

  return { additions, modifications, deletions };
}

function handleSetValueDiff(
  op: Extract<Operation, { type: 'SET_VALUE' }>,
  simulatedGrid: Grid,
  additions: Map<string, CellDiff>,
  modifications: Map<string, CellDiff>,
  deletions: Map<string, CellDiff>
): void {
  const existingCell = simulatedGrid[op.cellId];

  if (op.value === null || op.value === '') {
    // Deletion
    if (existingCell) {
      deletions.set(op.cellId, {
        cellId: op.cellId,
        before: existingCell.value,
        after: null,
        formatBefore: existingCell.format,
      });
      delete simulatedGrid[op.cellId];
    }
  } else {
    // Addition or Modification
    if (existingCell) {
      modifications.set(op.cellId, {
        cellId: op.cellId,
        before: existingCell.value,
        after: op.value,
        formatBefore: existingCell.format,
      });
    } else {
      additions.set(op.cellId, {
        cellId: op.cellId,
        before: null,
        after: op.value,
      });
    }
    simulatedGrid[op.cellId] = { id: op.cellId, value: op.value };
  }
}

function handleSetFormulaDiff(
  op: Extract<Operation, { type: 'SET_FORMULA' }>,
  simulatedGrid: Grid,
  additions: Map<string, CellDiff>,
  modifications: Map<string, CellDiff>
): void {
  const existingCell = simulatedGrid[op.cellId];

  if (existingCell) {
    modifications.set(op.cellId, {
      cellId: op.cellId,
      before: existingCell.value,
      after: op.formula,
      formatBefore: existingCell.format,
    });
  } else {
    additions.set(op.cellId, {
      cellId: op.cellId,
      before: null,
      after: op.formula,
    });
  }

  simulatedGrid[op.cellId] = { id: op.cellId, value: op.formula, formula: op.formula };
}

function handleInsertRowDiff(
  op: Extract<Operation, { type: 'INSERT_ROW' }>,
  simulatedGrid: Grid,
  additions: Map<string, CellDiff>
): void {
  // All cells in the new row are additions
  op.cells?.forEach((cell) => {
    additions.set(cell.id, {
      cellId: cell.id,
      before: null,
      after: cell.value,
      formatAfter: cell.format,
    });
  });
}

function handleInsertColumnDiff(
  op: Extract<Operation, { type: 'INSERT_COLUMN' }>,
  simulatedGrid: Grid,
  additions: Map<string, CellDiff>
): void {
  // All cells in the new column are additions
  op.cells?.forEach((cell) => {
    additions.set(cell.id, {
      cellId: cell.id,
      before: null,
      after: cell.value,
      formatAfter: cell.format,
    });
  });
}

function handleDeleteRowDiff(
  op: Extract<Operation, { type: 'DELETE_ROW' }>,
  simulatedGrid: Grid,
  deletions: Map<string, CellDiff>
): void {
  // All cells in the deleted row are deletions
  Object.entries(simulatedGrid).forEach(([cellId, cell]) => {
    const coords = cellIdToCoords(cellId);
    if (coords && coords.row === op.row) {
      deletions.set(cellId, {
        cellId,
        before: cell.value,
        after: null,
        formatBefore: cell.format,
      });
    }
  });
}

function handleDeleteColumnDiff(
  op: Extract<Operation, { type: 'DELETE_COLUMN' }>,
  simulatedGrid: Grid,
  deletions: Map<string, CellDiff>
): void {
  // All cells in the deleted column are deletions
  const colIndex = letterToColumnIndex(op.col);
  Object.entries(simulatedGrid).forEach(([cellId, cell]) => {
    const coords = cellIdToCoords(cellId);
    if (coords && coords.col === colIndex) {
      deletions.set(cellId, {
        cellId,
        before: cell.value,
        after: null,
        formatBefore: cell.format,
      });
    }
  });
}

function handleSortDiff(
  op: Extract<Operation, { type: 'SORT' }>,
  simulatedGrid: Grid,
  modifications: Map<string, CellDiff>
): void {
  // SORT reorders rows - all cells that change position are modifications
  // For simplicity, mark all cells as modified (optimization: only mark cells that actually move)
  Object.entries(simulatedGrid).forEach(([cellId, cell]) => {
    modifications.set(cellId, {
      cellId,
      before: cell.value,
      after: cell.value, // Value doesn't change, just position
      formatBefore: cell.format,
    });
  });
}

function handleFormatDiff(
  op: Extract<Operation, { type: 'FORMAT' }>,
  simulatedGrid: Grid,
  modifications: Map<string, CellDiff>
): void {
  // FORMAT changes cell styling
  op.cellIds.forEach((cellId) => {
    const existingCell = simulatedGrid[cellId];
    const currentFormat = existingCell?.format ?? {};
    const newFormat = { ...currentFormat, ...op.format };

    modifications.set(cellId, {
      cellId,
      before: existingCell?.value ?? '',
      after: existingCell?.value ?? '',
      formatBefore: currentFormat,
      formatAfter: newFormat,
    });
  });
}
```

### DiffStore Extensions

**Fichier `src/stores/diffStore.ts` (extensions pour preview) :**

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

  setPendingOperations: (operations: Operation[], description: string) => void;
  applyPendingOperations: () => void;
  clearPending: () => void;
}

export const useDiffStore = create<DiffStore>()(
  immer((set, get) => ({
    pendingOperations: [],
    description: null,
    diffPreview: null,

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

      // Apply all operations to gridStore
      applyOperations(pendingOperations);

      // Clear pending and preview
      set((state) => {
        state.pendingOperations = [];
        state.description = null;
        state.diffPreview = null;
      });
    },

    clearPending: () =>
      set((state) => {
        state.pendingOperations = [];
        state.description = null;
        state.diffPreview = null;
      }),
  }))
);
```

### DiffOverlay Component

**Fichier `src/components/Diff/DiffOverlay.tsx` :**

```typescript
import React from 'react';
import { useDiffStore } from '../../stores/diffStore';
import type { CellDiff } from '../../types/diff';

export function DiffOverlay() {
  const diffPreview = useDiffStore((s) => s.diffPreview);

  if (!diffPreview) return null;

  const { additions, modifications, deletions } = diffPreview;

  return (
    <div className="absolute inset-0 pointer-events-none z-10">
      {/* Render additions (green) */}
      {Array.from(additions.values()).map((diff) => (
        <DiffCell key={diff.cellId} diff={diff} type="addition" />
      ))}

      {/* Render modifications (orange) */}
      {Array.from(modifications.values()).map((diff) => (
        <DiffCell key={diff.cellId} diff={diff} type="modification" />
      ))}

      {/* Render deletions (red) */}
      {Array.from(deletions.values()).map((diff) => (
        <DiffCell key={diff.cellId} diff={diff} type="deletion" />
      ))}
    </div>
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

  const top = coords.row * 32; // rowHeight = 32
  const left = coords.col * 100; // columnWidth = 100

  const colorClasses = {
    addition: 'bg-green-100 border-green-400 text-green-800',
    modification: 'bg-orange-100 border-orange-400 text-orange-800',
    deletion: 'bg-red-100 border-red-400 text-red-800 line-through',
  };

  const icon = {
    addition: '+',
    modification: '~',
    deletion: '-',
  };

  return (
    <div
      className={`absolute border-2 ${colorClasses[type]} pointer-events-auto`}
      style={{ top, left, width: 100, height: 32 }}
      title={`${type}: ${before ?? '∅'} → ${after ?? '∅'}`}
    >
      <span className="text-xs font-bold">{icon[type]}</span>
      <span className="text-sm ml-1">
        {type === 'deletion' ? before : after}
      </span>
    </div>
  );
}
```

**Fichier `src/components/Diff/index.ts` :**

```typescript
export { DiffOverlay } from './DiffOverlay';
```

### Testing Strategy

**Fichier `src/utils/diffCalculator.test.ts` :**

```typescript
import { describe, it, expect } from 'vitest';
import { calculateDiff } from './diffCalculator';
import type { Operation } from '../types/operations';
import type { Grid } from '../types/cell';

describe('diffCalculator', () => {
  describe('SET_VALUE', () => {
    it('should detect addition when setting value in empty cell', () => {
      const ops: Operation[] = [{ type: 'SET_VALUE', cellId: 'A1', value: 42 }];
      const grid: Grid = {};

      const diff = calculateDiff(ops, grid);

      expect(diff.additions.has('A1')).toBe(true);
      expect(diff.additions.get('A1')?.before).toBeNull();
      expect(diff.additions.get('A1')?.after).toBe(42);
    });

    it('should detect modification when setting value in existing cell', () => {
      const ops: Operation[] = [{ type: 'SET_VALUE', cellId: 'A1', value: 100 }];
      const grid: Grid = { A1: { id: 'A1', value: 50 } };

      const diff = calculateDiff(ops, grid);

      expect(diff.modifications.has('A1')).toBe(true);
      expect(diff.modifications.get('A1')?.before).toBe(50);
      expect(diff.modifications.get('A1')?.after).toBe(100);
    });

    it('should detect deletion when setting null value', () => {
      const ops: Operation[] = [{ type: 'SET_VALUE', cellId: 'A1', value: null }];
      const grid: Grid = { A1: { id: 'A1', value: 'Delete me' } };

      const diff = calculateDiff(ops, grid);

      expect(diff.deletions.has('A1')).toBe(true);
      expect(diff.deletions.get('A1')?.before).toBe('Delete me');
      expect(diff.deletions.get('A1')?.after).toBeNull();
    });
  });

  describe('INSERT_ROW', () => {
    it('should mark all new row cells as additions', () => {
      const ops: Operation[] = [{
        type: 'INSERT_ROW',
        afterRow: 1,
        cells: [
          { id: 'A2', value: 'New1' },
          { id: 'B2', value: 'New2' },
        ]
      }];
      const grid: Grid = {};

      const diff = calculateDiff(ops, grid);

      expect(diff.additions.has('A2')).toBe(true);
      expect(diff.additions.has('B2')).toBe(true);
      expect(diff.additions.get('A2')?.after).toBe('New1');
      expect(diff.additions.get('B2')?.after).toBe('New2');
    });
  });

  describe('DELETE_ROW', () => {
    it('should mark all deleted row cells as deletions', () => {
      const ops: Operation[] = [{ type: 'DELETE_ROW', row: 2 }];
      const grid: Grid = {
        A2: { id: 'A2', value: 'Del1' },
        B2: { id: 'B2', value: 'Del2' },
        A3: { id: 'A3', value: 'Keep' },
      };

      const diff = calculateDiff(ops, grid);

      expect(diff.deletions.has('A2')).toBe(true);
      expect(diff.deletions.has('B2')).toBe(true);
      expect(diff.deletions.has('A3')).toBe(false);
    });
  });

  describe('FORMAT', () => {
    it('should mark formatted cells as modifications', () => {
      const ops: Operation[] = [{
        type: 'FORMAT',
        cellIds: ['A1'],
        format: { bold: true, currency: 'USD' }
      }];
      const grid: Grid = { A1: { id: 'A1', value: 100 } };

      const diff = calculateDiff(ops, grid);

      expect(diff.modifications.has('A1')).toBe(true);
      expect(diff.modifications.get('A1')?.formatAfter?.bold).toBe(true);
      expect(diff.modifications.get('A1')?.formatAfter?.currency).toBe('USD');
    });
  });
});
```

**Fichier `src/components/Diff/DiffOverlay.test.tsx` :**

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DiffOverlay } from './DiffOverlay';
import { useDiffStore } from '../../stores/diffStore';

describe('DiffOverlay', () => {
  it('should render nothing when no diff preview', () => {
    useDiffStore.setState({ diffPreview: null });
    const { container } = render(<DiffOverlay />);
    expect(container.firstChild).toBeNull();
  });

  it('should render additions in green', () => {
    const diffPreview = {
      additions: new Map([
        ['A1', { cellId: 'A1', before: null, after: 42 }]
      ]),
      modifications: new Map(),
      deletions: new Map(),
    };

    useDiffStore.setState({ diffPreview });
    render(<DiffOverlay />);

    const additionCell = screen.getByTitle(/addition/i);
    expect(additionCell).toHaveClass('bg-green-100');
    expect(additionCell).toHaveTextContent('42');
  });

  it('should render modifications in orange', () => {
    const diffPreview = {
      additions: new Map(),
      modifications: new Map([
        ['B2', { cellId: 'B2', before: 10, after: 20 }]
      ]),
      deletions: new Map(),
    };

    useDiffStore.setState({ diffPreview });
    render(<DiffOverlay />);

    const modCell = screen.getByTitle(/modification/i);
    expect(modCell).toHaveClass('bg-orange-100');
    expect(modCell).toHaveTextContent('20');
  });

  it('should render deletions in red', () => {
    const diffPreview = {
      additions: new Map(),
      modifications: new Map(),
      deletions: new Map([
        ['C3', { cellId: 'C3', before: 'Delete', after: null }]
      ]),
    };

    useDiffStore.setState({ diffPreview });
    render(<DiffOverlay />);

    const delCell = screen.getByTitle(/deletion/i);
    expect(delCell).toHaveClass('bg-red-100');
    expect(delCell).toHaveClass('line-through');
    expect(delCell).toHaveTextContent('Delete');
  });
});
```

### Previous Story Intelligence

**Learnings critiques des stories précédentes :**

1. **Story 2.3 — Operations Engine:**
   - `applyOperations()` applique opérations de façon séquentielle sur gridStore
   - 8 types d'opérations: SET_VALUE, SET_FORMULA, INSERT_ROW, INSERT_COLUMN, DELETE_ROW, DELETE_COLUMN, SORT, FORMAT
   - Pattern: fonctions handler typées avec `Extract<Operation, { type: 'X' }>`
   - DiffStore actuel appelle `applyOperations()` dans `applyPendingOperations()`

2. **Story 2.2 — CommandBar:**
   - CommandStore envoie opérations à diffStore via `setPendingOperations(operations, description)`
   - Pattern d'intégration: commandStore → diffStore → (Story 2.4: diff preview) → (Story 2.5: validation) → operationsEngine → gridStore

3. **Story 1.2-1.6 — GridStore & Virtualization:**
   - Grille virtualisée avec react-window (rowHeight=32, columnWidth=100)
   - Cell IDs format: `A1` (letter + number)
   - Conversions via `cellUtils.ts`: `cellIdToCoords()` ↔ `coordsToCellId()`
   - Grid state: `cells: Record<cellId, Cell>`

4. **Git Analysis — Component Patterns:**
   - Components subscribe sélectivement: `useDiffStore((s) => s.diffPreview)`
   - Overlay components: position absolute, z-index pour affichage par-dessus
   - Tailwind styling: `bg-{color}-100 border-{color}-400 text-{color}-800`
   - Performance: React.memo, calcul unique dans store, pas à chaque render

5. **Git Analysis — Testing Patterns:**
   - Store tests: `setState()` pour setup, `getState()` pour assertions
   - Component tests: `render()` + `screen.getByX()`
   - Use `beforeEach()` pour reset state
   - Co-location: tests à côté des fichiers source

### Contraintes et Points d'Attention

1. **Read-Only Preview** — Le diff DOIT être calculé sans modifier le gridStore. Utiliser simulation dans `calculateDiff()`, pas mutations réelles.

2. **Performance < 200ms (NFR3)** — Pour 1000 lignes, limiter le nombre de cellules diff affichées. Si > 500 changements, afficher message "Plus de 500 changements - aperçu partiel". Mesurer avec `performance.now()`.

3. **Overlay Positioning** — DiffOverlay doit être positionné par-dessus SpreadsheetGrid avec position absolute. Synchroniser avec scroll de la grille (ou rendre overlay scrollable).

4. **Cell ID Validation** — Toujours utiliser `cellUtils.cellIdToCoords()` pour parser cell IDs. Gérer les cas où coords est null (cellId invalide).

5. **SORT Visual Feedback** — Pour SORT, les cellules ne changent pas de valeur mais de position. Afficher "A1 → B2" pour indiquer le mouvement.

6. **FORMAT Visual Feedback** — Pour FORMAT, afficher le changement de format avec icônes (B pour bold, $ pour currency, etc.).

7. **Multiple Operations** — Plusieurs opérations peuvent affecter la même cellule. Gérer la priorité: deletion > modification > addition.

8. **Grid Dimensions** — Calculer positions des cellules diff en fonction de rowHeight et columnWidth de SpreadsheetGrid. Partager ces constantes dans un fichier config.

### Scope — Ce qui est HORS de cette story

- **Boutons Valider/Refuser** → Story 2.5 (cette story affiche seulement le diff, pas les actions)
- **Animation des changements** → Post-MVP (fade-in, transitions)
- **Diff détaillé par cellule** → Post-MVP (modal avec before/after détaillé)
- **Undo/Redo** → Post-MVP
- **Diff pour formulas evaluation** → Post-MVP (formules pas encore évaluées)

### Project Structure Notes

Fichiers créés/modifiés par cette story :

```
frontend/src/
├── components/
│   └── Diff/
│       ├── DiffOverlay.tsx           (new — overlay visuel pour diff)
│       ├── DiffOverlay.test.tsx      (new — tests du composant)
│       └── index.ts                  (new — barrel export)
├── utils/
│   ├── diffCalculator.ts             (new — calcul du diff sans mutation)
│   └── diffCalculator.test.ts       (new — tests du calculateur)
├── types/
│   └── diff.ts                       (new — types CellDiff, DiffResult)
├── stores/
│   └── diffStore.ts                  (modified — ajout diffPreview + calculateDiff call)
└── App.tsx                           (modified — import et render DiffOverlay)
```

### References

- [Source: architecture.md#Diff Visual] — Affichage vert/orange/rouge des changements
- [Source: epics.md#Story 2.4] — User story, acceptance criteria
- [Source: Story 2.3] — operationsEngine, Operation types
- [Source: Story 2.2] — commandStore → diffStore integration
- [Source: Story 1.2-1.6] — gridStore, cellUtils, SpreadsheetGrid dimensions
- [Source: Git Analysis] — Component patterns, overlay positioning, Tailwind styling

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
