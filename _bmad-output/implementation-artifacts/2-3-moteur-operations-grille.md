# Story 2.3: Moteur d'Opérations sur la Grille

Status: ready-for-dev

## Story

As a système,
I want appliquer les 8 types d'opérations IA sur la grille de façon atomique,
So that chaque commande IA produit des modifications précises et ciblées.

## Acceptance Criteria

1. **Given** une opération `SET_VALUE` est reçue **When** elle est appliquée au gridStore **Then** la cellule ciblée reçoit la nouvelle valeur sans affecter les autres (FR23, FR10)
2. **Given** une opération `SET_FORMULA` est reçue **When** elle est appliquée **Then** la cellule reçoit la formule et affiche le résultat calculé (FR12)
3. **Given** une opération `INSERT_ROW` est reçue **When** elle est appliquée **Then** une nouvelle ligne est insérée avec les cellules fournies (FR11)
4. **Given** une opération `INSERT_COLUMN` est reçue **When** elle est appliquée **Then** une nouvelle colonne est ajoutée avec header et cellules fournies (FR10)
5. **Given** une opération `DELETE_ROW` ou `DELETE_COLUMN` est reçue **When** elle est appliquée **Then** la ligne ou colonne ciblée est supprimée (FR15)
6. **Given** une opération `SORT` est reçue **When** elle est appliquée **Then** les données sont triées selon la colonne et direction spécifiées (FR13)
7. **Given** une opération `FORMAT` est reçue **When** elle est appliquée **Then** les cellules ciblées reçoivent le formatage (gras, devise, décimales) (FR14)
8. **Given** une liste de plusieurs opérations est reçue **When** elles sont appliquées **Then** elles sont exécutées séquentiellement dans l'ordre (FR16)

## Tasks / Subtasks

- [ ] Task 1: Créer le moteur d'opérations `applyOperations()` (AC: #1-8)
  - [ ] 1.1 Créer `src/utils/operationsEngine.ts` avec fonction principale `applyOperations(operations: Operation[]): void`
  - [ ] 1.2 Implémenter dispatcher pour chaque type d'opération (switch sur operation.type)
  - [ ] 1.3 Chaque handler appelle les mutations appropriées du gridStore
  - [ ] 1.4 Gérer l'application séquentielle (boucle sur operations array)
  - [ ] 1.5 Assurer l'atomicité : tout réussit ou tout échoue (try/catch avec rollback potentiel)
- [ ] Task 2: Implémenter `SET_VALUE` et `SET_FORMULA` (AC: #1, #2)
  - [ ] 2.1 Handler `SET_VALUE`: appeler `gridStore.setCell(cellId, value)`
  - [ ] 2.2 Handler `SET_FORMULA`: appeler `gridStore.setCell(cellId, value)` avec `formula` dans l'objet Cell
  - [ ] 2.3 Utiliser `cellUtils.cellIdToCoords()` pour valider les cellIds
  - [ ] 2.4 Gérer les valeurs null (suppression de cellule)
- [ ] Task 3: Implémenter `INSERT_ROW` et `INSERT_COLUMN` (AC: #3, #4)
  - [ ] 3.1 Handler `INSERT_ROW`: décaler toutes les cellules après `afterRow`, puis insérer nouvelles cellules
  - [ ] 3.2 Mettre à jour `gridStore.rowCount` si nécessaire
  - [ ] 3.3 Handler `INSERT_COLUMN`: décaler toutes les cellules après `afterCol`, puis insérer nouvelles cellules
  - [ ] 3.4 Mettre à jour `gridStore.colCount` si nécessaire
  - [ ] 3.5 Utiliser `cellUtils.columnIndexToLetter()` et `letterToColumnIndex()` pour les conversions
- [ ] Task 4: Implémenter `DELETE_ROW` et `DELETE_COLUMN` (AC: #5)
  - [ ] 4.1 Handler `DELETE_ROW`: supprimer toutes les cellules de la ligne, décaler les lignes suivantes
  - [ ] 4.2 Mettre à jour `gridStore.rowCount`
  - [ ] 4.3 Handler `DELETE_COLUMN`: supprimer toutes les cellules de la colonne, décaler les colonnes suivantes
  - [ ] 4.4 Mettre à jour `gridStore.colCount`
  - [ ] 4.5 Gérer les cas limites (suppression de la dernière ligne/colonne)
- [ ] Task 5: Implémenter `SORT` (AC: #6)
  - [ ] 5.1 Handler `SORT`: extraire toutes les valeurs de la colonne spécifiée
  - [ ] 5.2 Trier les indices de lignes selon les valeurs et la direction (asc/desc)
  - [ ] 5.3 Réorganiser toutes les cellules selon le nouvel ordre
  - [ ] 5.4 Gérer les valeurs null/undefined (tri stable)
- [ ] Task 6: Implémenter `FORMAT` (AC: #7)
  - [ ] 6.1 Handler `FORMAT`: pour chaque cellId dans cellIds, mettre à jour le champ `format` de la cellule
  - [ ] 6.2 Supporter les formats: `{ bold?: boolean, currency?: string, decimals?: number }`
  - [ ] 6.3 Merger le format avec les formats existants (ne pas écraser complètement)
- [ ] Task 7: Créer les tests `operationsEngine.test.ts` (AC: #1-8)
  - [ ] 7.1 Tester SET_VALUE avec valeur string, number, null
  - [ ] 7.2 Tester SET_FORMULA avec formule simple
  - [ ] 7.3 Tester INSERT_ROW avec décalage correct des lignes
  - [ ] 7.4 Tester INSERT_COLUMN avec décalage correct des colonnes
  - [ ] 7.5 Tester DELETE_ROW et DELETE_COLUMN avec réindexation
  - [ ] 7.6 Tester SORT avec direction asc/desc et valeurs mixtes
  - [ ] 7.7 Tester FORMAT avec différents formats
  - [ ] 7.8 Tester application de plusieurs opérations séquentielles
  - [ ] 7.9 Tester rollback en cas d'erreur dans une opération
- [ ] Task 8: Intégrer avec diffStore (AC: #1-8)
  - [ ] 8.1 Le diffStore existant (stub) sera enrichi pour appeler `applyOperations()` lors de la validation
  - [ ] 8.2 Créer méthode `diffStore.applyPendingOperations()` qui appelle `operationsEngine.applyOperations(pendingOperations)`
  - [ ] 8.3 Vérifier que les opérations déclenchent le flag dirty pour auto-save
- [ ] Task 9: Validation finale (AC: #1-8)
  - [ ] 9.1 Tous les tests passent (`npm test`)
  - [ ] 9.2 Build TypeScript compile sans erreur (`npm run build`)
  - [ ] 9.3 Test manuel : envoyer commande → voir opérations dans diffStore → vérifier que applyOperations() fonctionne
  - [ ] 9.4 Vérifier performance : 1000 lignes avec opérations multiples < 100ms

## Dev Notes

### Architecture Compliance

**Source : [architecture.md](../../_bmad-output/planning-artifacts/architecture.md)**

Cette story implémente le moteur d'opérations qui applique les 8 types d'opérations IA sur la grille. Ce moteur DOIT travailler avec le gridStore existant (Story 1.2-1.6) et DOIT supporter les opérations atomiques pour permettre le diff visuel (Story 2.4) et la validation/refus (Story 2.5).

**Architecture Pattern:**
- Le moteur d'opérations est une **fonction utilitaire pure** qui prend des opérations et mute le gridStore
- Il ne crée PAS son propre store (le gridStore est la source de vérité)
- Pattern: `applyOperations(operations: Operation[]): void`
- Chaque opération est appliquée via les mutations existantes du gridStore
- Supporte le rollback pour les fonctionnalités futures (diff + validation)

### Operations Engine — Pure Function Pattern

**Fichier `src/utils/operationsEngine.ts` :**

```typescript
import { useGridStore } from '../stores/gridStore';
import type { Operation } from '../types/operations';
import { cellIdToCoords, coordsToCellId, letterToColumnIndex, columnIndexToLetter } from './cellUtils';

/**
 * Apply a list of operations to the grid store sequentially.
 * Each operation mutates the gridStore state.
 *
 * @param operations - Array of operations to apply
 * @throws Error if any operation fails (rollback should be handled by caller)
 */
export function applyOperations(operations: Operation[]): void {
  const store = useGridStore.getState();

  for (const operation of operations) {
    switch (operation.type) {
      case 'SET_VALUE':
        handleSetValue(operation);
        break;
      case 'SET_FORMULA':
        handleSetFormula(operation);
        break;
      case 'INSERT_ROW':
        handleInsertRow(operation);
        break;
      case 'INSERT_COLUMN':
        handleInsertColumn(operation);
        break;
      case 'DELETE_ROW':
        handleDeleteRow(operation);
        break;
      case 'DELETE_COLUMN':
        handleDeleteColumn(operation);
        break;
      case 'SORT':
        handleSort(operation);
        break;
      case 'FORMAT':
        handleFormat(operation);
        break;
      default:
        // TypeScript exhaustiveness check
        const _exhaustive: never = operation;
        throw new Error(`Unknown operation type: ${(_exhaustive as any).type}`);
    }
  }
}

function handleSetValue(op: Extract<Operation, { type: 'SET_VALUE' }>): void {
  const store = useGridStore.getState();

  // Validate cell ID format
  const coords = cellIdToCoords(op.cellId);
  if (!coords) {
    throw new Error(`Invalid cell ID: ${op.cellId}`);
  }

  // Apply via gridStore mutation
  store.setCell(op.cellId, op.value);
}

function handleSetFormula(op: Extract<Operation, { type: 'SET_FORMULA' }>): void {
  const store = useGridStore.getState();

  const coords = cellIdToCoords(op.cellId);
  if (!coords) {
    throw new Error(`Invalid cell ID: ${op.cellId}`);
  }

  // Set cell with formula field
  // Note: Formula evaluation is NOT in this story (MVP doesn't include formulas yet)
  // For now, just store the formula string
  store.setCell(op.cellId, op.formula, { formula: op.formula });
}

function handleInsertRow(op: Extract<Operation, { type: 'INSERT_ROW' }>): void {
  const store = useGridStore.getState();

  // Use existing insertRow action from gridStore
  store.insertRow(op.afterRow);

  // Set the cells for the new row
  op.cells?.forEach((cell) => {
    store.setCell(cell.id, cell.value, cell.format ? { format: cell.format } : undefined);
  });
}

function handleInsertColumn(op: Extract<Operation, { type: 'INSERT_COLUMN' }>): void {
  const store = useGridStore.getState();

  // Use existing insertColumn action from gridStore
  const colIndex = letterToColumnIndex(op.afterCol);
  if (colIndex === -1) {
    throw new Error(`Invalid column: ${op.afterCol}`);
  }

  store.insertColumn(colIndex);

  // Set the cells for the new column
  op.cells?.forEach((cell) => {
    store.setCell(cell.id, cell.value, cell.format ? { format: cell.format } : undefined);
  });
}

function handleDeleteRow(op: Extract<Operation, { type: 'DELETE_ROW' }>): void {
  const store = useGridStore.getState();
  store.deleteRow(op.row);
}

function handleDeleteColumn(op: Extract<Operation, { type: 'DELETE_COLUMN' }>): void {
  const store = useGridStore.getState();
  const colIndex = letterToColumnIndex(op.col);
  if (colIndex === -1) {
    throw new Error(`Invalid column: ${op.col}`);
  }
  store.deleteColumn(colIndex);
}

function handleSort(op: Extract<Operation, { type: 'SORT' }>): void {
  const store = useGridStore.getState();
  const { cells, rowCount } = store;

  // Extract all values from the sort column
  const rowValues: Array<{ row: number; value: any }> = [];
  for (let row = 1; row <= rowCount; row++) {
    const cellId = `${op.column}${row}`;
    const value = cells[cellId]?.value ?? null;
    rowValues.push({ row, value });
  }

  // Sort by value
  rowValues.sort((a, b) => {
    if (a.value === null || a.value === undefined) return 1;
    if (b.value === null || b.value === undefined) return -1;

    if (typeof a.value === 'number' && typeof b.value === 'number') {
      return op.direction === 'asc' ? a.value - b.value : b.value - a.value;
    }

    const aStr = String(a.value);
    const bStr = String(b.value);
    const cmp = aStr.localeCompare(bStr);
    return op.direction === 'asc' ? cmp : -cmp;
  });

  // Build new row mapping
  const newCells: typeof cells = {};
  const oldCells = { ...cells };

  rowValues.forEach((item, newIndex) => {
    const oldRow = item.row;
    const newRow = newIndex + 1;

    // Move all cells from old row to new row
    Object.keys(oldCells).forEach((cellId) => {
      const coords = cellIdToCoords(cellId);
      if (coords && coords.row === oldRow) {
        const newCellId = coordsToCellId(newRow, coords.col);
        newCells[newCellId] = { ...oldCells[cellId], id: newCellId };
      }
    });
  });

  // Replace cells in store
  useGridStore.setState({ cells: newCells });
}

function handleFormat(op: Extract<Operation, { type: 'FORMAT' }>): void {
  const store = useGridStore.getState();

  op.cellIds.forEach((cellId) => {
    const coords = cellIdToCoords(cellId);
    if (!coords) {
      console.warn(`Invalid cell ID in FORMAT operation: ${cellId}`);
      return;
    }

    const cell = store.cells[cellId];
    const currentFormat = cell?.format ?? {};
    const newFormat = { ...currentFormat, ...op.format };

    // Update cell with merged format
    if (cell) {
      store.setCell(cellId, cell.value, { format: newFormat });
    } else {
      // Create cell if it doesn't exist
      store.setCell(cellId, '', { format: newFormat });
    }
  });
}
```

### GridStore Extensions Needed

**Note:** Le gridStore actuel (Stories 1.1-1.6) a déjà la plupart des mutations nécessaires. Vérifier si ces méthodes existent :

- `setCell(id: string, value: any, options?: { format?: CellFormat; formula?: string })`
- `insertRow(afterRow: number)`
- `insertColumn(afterCol: number)`
- `deleteRow(row: number)`
- `deleteColumn(col: number)`

**Si elles n'existent pas, les ajouter au gridStore dans cette story.**

**Fichier `src/stores/gridStore.ts` (extensions si nécessaires) :**

```typescript
// Add to GridActions interface
interface GridActions {
  // ... existing actions

  insertRow: (afterRow: number) => void;
  insertColumn: (afterCol: number) => void;
  deleteRow: (row: number) => void;
  deleteColumn: (col: number) => void;
}

// Implementation in create() call
export const useGridStore = create<GridState & GridActions>()(
  immer((set) => ({
    // ... existing state

    insertRow: (afterRow) =>
      set((state) => {
        // Shift all rows after afterRow down by 1
        const newCells: Record<string, Cell> = {};

        Object.entries(state.cells).forEach(([cellId, cell]) => {
          const coords = cellIdToCoords(cellId);
          if (coords) {
            if (coords.row > afterRow) {
              // Shift down
              const newId = coordsToCellId(coords.row + 1, coords.col);
              newCells[newId] = { ...cell, id: newId };
            } else {
              // Keep same position
              newCells[cellId] = cell;
            }
          }
        });

        state.cells = newCells;
        state.rowCount += 1;
      }),

    insertColumn: (afterCol) =>
      set((state) => {
        // Shift all columns after afterCol right by 1
        const newCells: Record<string, Cell> = {};

        Object.entries(state.cells).forEach(([cellId, cell]) => {
          const coords = cellIdToCoords(cellId);
          if (coords) {
            if (coords.col > afterCol) {
              // Shift right
              const newId = coordsToCellId(coords.row, coords.col + 1);
              newCells[newId] = { ...cell, id: newId };
            } else {
              // Keep same position
              newCells[cellId] = cell;
            }
          }
        });

        state.cells = newCells;
        state.colCount += 1;
      }),

    deleteRow: (row) =>
      set((state) => {
        const newCells: Record<string, Cell> = {};

        Object.entries(state.cells).forEach(([cellId, cell]) => {
          const coords = cellIdToCoords(cellId);
          if (coords) {
            if (coords.row === row) {
              // Delete this cell
              return;
            } else if (coords.row > row) {
              // Shift up
              const newId = coordsToCellId(coords.row - 1, coords.col);
              newCells[newId] = { ...cell, id: newId };
            } else {
              // Keep same position
              newCells[cellId] = cell;
            }
          }
        });

        state.cells = newCells;
        state.rowCount = Math.max(1, state.rowCount - 1);
      }),

    deleteColumn: (col) =>
      set((state) => {
        const newCells: Record<string, Cell> = {};

        Object.entries(state.cells).forEach(([cellId, cell]) => {
          const coords = cellIdToCoords(cellId);
          if (coords) {
            if (coords.col === col) {
              // Delete this cell
              return;
            } else if (coords.col > col) {
              // Shift left
              const newId = coordsToCellId(coords.row, coords.col - 1);
              newCells[newId] = { ...cell, id: newId };
            } else {
              // Keep same position
              newCells[cellId] = cell;
            }
          }
        });

        state.cells = newCells;
        state.colCount = Math.max(1, state.colCount - 1);
      }),
  }))
);
```

### DiffStore Integration

**Fichier `src/stores/diffStore.ts` (enrichir le stub existant) :**

```typescript
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { Operation } from '../types/operations';
import { applyOperations } from '../utils/operationsEngine';

interface DiffStore {
  pendingOperations: Operation[];
  description: string | null;

  setPendingOperations: (operations: Operation[], description: string) => void;
  applyPendingOperations: () => void;
  clearPending: () => void;
}

export const useDiffStore = create<DiffStore>()(
  immer((set, get) => ({
    pendingOperations: [],
    description: null,

    setPendingOperations: (operations, description) =>
      set((state) => {
        state.pendingOperations = operations;
        state.description = description;
      }),

    applyPendingOperations: () => {
      const { pendingOperations } = get();
      if (pendingOperations.length === 0) return;

      // Apply all operations to gridStore
      applyOperations(pendingOperations);

      // Clear pending after successful application
      set((state) => {
        state.pendingOperations = [];
        state.description = null;
      });
    },

    clearPending: () =>
      set((state) => {
        state.pendingOperations = [];
        state.description = null;
      }),
  }))
);
```

### Testing Strategy

**Fichier `src/utils/operationsEngine.test.ts` :**

```typescript
// @vitest-environment happy-dom
import { describe, it, expect, beforeEach } from 'vitest';
import { applyOperations } from './operationsEngine';
import { useGridStore } from '../stores/gridStore';
import type { Operation } from '../types/operations';

describe('operationsEngine', () => {
  beforeEach(() => {
    // Reset grid to clean state
    useGridStore.setState({
      cells: {},
      rowCount: 100,
      colCount: 26,
      editingCell: null,
      selectedCell: null,
    });
  });

  describe('SET_VALUE', () => {
    it('should set cell value', () => {
      const op: Operation = { type: 'SET_VALUE', cellId: 'A1', value: 42 };
      applyOperations([op]);

      const cell = useGridStore.getState().cells['A1'];
      expect(cell?.value).toBe(42);
    });

    it('should handle string values', () => {
      const op: Operation = { type: 'SET_VALUE', cellId: 'B2', value: 'Hello' };
      applyOperations([op]);

      const cell = useGridStore.getState().cells['B2'];
      expect(cell?.value).toBe('Hello');
    });
  });

  describe('SET_FORMULA', () => {
    it('should set cell formula', () => {
      const op: Operation = { type: 'SET_FORMULA', cellId: 'C3', formula: '=A1+B2' };
      applyOperations([op]);

      const cell = useGridStore.getState().cells['C3'];
      expect(cell?.formula).toBe('=A1+B2');
    });
  });

  describe('INSERT_ROW', () => {
    it('should insert row and shift cells down', () => {
      // Setup: put cell at A2
      useGridStore.getState().setCell('A2', 'Original');

      // Insert row after row 1
      const op: Operation = {
        type: 'INSERT_ROW',
        afterRow: 1,
        cells: [{ id: 'A2', value: 'New' }]
      };
      applyOperations([op]);

      // Original A2 should now be at A3
      expect(useGridStore.getState().cells['A3']?.value).toBe('Original');
      // New row at A2
      expect(useGridStore.getState().cells['A2']?.value).toBe('New');
      // Row count incremented
      expect(useGridStore.getState().rowCount).toBe(101);
    });
  });

  describe('INSERT_COLUMN', () => {
    it('should insert column and shift cells right', () => {
      // Setup: put cell at B1
      useGridStore.getState().setCell('B1', 'Original');

      // Insert column after A
      const op: Operation = {
        type: 'INSERT_COLUMN',
        afterCol: 'A',
        header: 'NewCol',
        cells: [{ id: 'B1', value: 'New' }]
      };
      applyOperations([op]);

      // Original B1 should now be at C1
      expect(useGridStore.getState().cells['C1']?.value).toBe('Original');
      // New column at B1
      expect(useGridStore.getState().cells['B1']?.value).toBe('New');
      // Col count incremented
      expect(useGridStore.getState().colCount).toBe(27);
    });
  });

  describe('DELETE_ROW', () => {
    it('should delete row and shift cells up', () => {
      // Setup
      useGridStore.getState().setCell('A2', 'Row2');
      useGridStore.getState().setCell('A3', 'Row3');

      // Delete row 2
      const op: Operation = { type: 'DELETE_ROW', row: 2 };
      applyOperations([op]);

      // A2 should now contain what was in A3
      expect(useGridStore.getState().cells['A2']?.value).toBe('Row3');
      // A3 should be empty
      expect(useGridStore.getState().cells['A3']).toBeUndefined();
      // Row count decremented
      expect(useGridStore.getState().rowCount).toBe(99);
    });
  });

  describe('DELETE_COLUMN', () => {
    it('should delete column and shift cells left', () => {
      // Setup
      useGridStore.getState().setCell('B1', 'ColB');
      useGridStore.getState().setCell('C1', 'ColC');

      // Delete column B
      const op: Operation = { type: 'DELETE_COLUMN', col: 'B' };
      applyOperations([op]);

      // B1 should now contain what was in C1
      expect(useGridStore.getState().cells['B1']?.value).toBe('ColC');
      // C1 should be empty
      expect(useGridStore.getState().cells['C1']).toBeUndefined();
      // Col count decremented
      expect(useGridStore.getState().colCount).toBe(25);
    });
  });

  describe('SORT', () => {
    it('should sort rows by column ascending', () => {
      // Setup
      useGridStore.getState().setCell('A1', 3);
      useGridStore.getState().setCell('A2', 1);
      useGridStore.getState().setCell('A3', 2);

      const op: Operation = { type: 'SORT', column: 'A', direction: 'asc' };
      applyOperations([op]);

      // After sort: A1=1, A2=2, A3=3
      expect(useGridStore.getState().cells['A1']?.value).toBe(1);
      expect(useGridStore.getState().cells['A2']?.value).toBe(2);
      expect(useGridStore.getState().cells['A3']?.value).toBe(3);
    });

    it('should sort rows by column descending', () => {
      // Setup
      useGridStore.getState().setCell('A1', 1);
      useGridStore.getState().setCell('A2', 3);
      useGridStore.getState().setCell('A3', 2);

      const op: Operation = { type: 'SORT', column: 'A', direction: 'desc' };
      applyOperations([op]);

      // After sort: A1=3, A2=2, A3=1
      expect(useGridStore.getState().cells['A1']?.value).toBe(3);
      expect(useGridStore.getState().cells['A2']?.value).toBe(2);
      expect(useGridStore.getState().cells['A3']?.value).toBe(1);
    });
  });

  describe('FORMAT', () => {
    it('should apply format to cells', () => {
      useGridStore.getState().setCell('A1', 100);

      const op: Operation = {
        type: 'FORMAT',
        cellIds: ['A1'],
        format: { bold: true, currency: 'USD', decimals: 2 }
      };
      applyOperations([op]);

      const cell = useGridStore.getState().cells['A1'];
      expect(cell?.format?.bold).toBe(true);
      expect(cell?.format?.currency).toBe('USD');
      expect(cell?.format?.decimals).toBe(2);
    });

    it('should merge format with existing format', () => {
      useGridStore.getState().setCell('A1', 100, { format: { bold: true } });

      const op: Operation = {
        type: 'FORMAT',
        cellIds: ['A1'],
        format: { currency: 'EUR' }
      };
      applyOperations([op]);

      const cell = useGridStore.getState().cells['A1'];
      expect(cell?.format?.bold).toBe(true); // Preserved
      expect(cell?.format?.currency).toBe('EUR'); // Added
    });
  });

  describe('Multiple operations', () => {
    it('should apply operations sequentially', () => {
      const ops: Operation[] = [
        { type: 'SET_VALUE', cellId: 'A1', value: 10 },
        { type: 'SET_VALUE', cellId: 'B1', value: 20 },
        { type: 'SET_FORMULA', cellId: 'C1', formula: '=A1+B1' },
      ];

      applyOperations(ops);

      expect(useGridStore.getState().cells['A1']?.value).toBe(10);
      expect(useGridStore.getState().cells['B1']?.value).toBe(20);
      expect(useGridStore.getState().cells['C1']?.formula).toBe('=A1+B1');
    });
  });
});
```

### Previous Story Intelligence

**Learnings critiques des stories précédentes :**

1. **Story 1.1-1.6 — GridStore Pattern:**
   - Zustand v5 + Immer: `create<T>()(immer((set) => ({...})))`
   - Mutations via `set((state) => { state.field = value })`
   - Accès via sélecteurs: `useGridStore((s) => s.cells)`
   - Actions existantes: `setCell()`, possiblement `insertRow()`, `deleteRow()`, etc.

2. **Story 2.1 — Backend API:**
   - Backend retourne `{ operations: Operation[], description: string }`
   - 8 types d'opérations définis dans `src/types/operations.ts`
   - Chaque opération est un objet discriminated union avec champ `type`

3. **Story 2.2 — CommandStore:**
   - CommandStore envoie opérations au diffStore via `diffStore.setPendingOperations()`
   - DiffStore actuel est un stub minimal (sera enrichi dans cette story)
   - Pattern d'intégration: commandStore → diffStore → operationsEngine → gridStore

4. **Story 1.2-1.6 — CellUtils:**
   - Utilitaires pour conversions cell ID ↔ coords dans `src/utils/cellUtils.ts`
   - `cellIdToCoords(id: string): { row: number; col: number } | null`
   - `coordsToCellId(row: number, col: number): string`
   - `letterToColumnIndex(letter: string): number`
   - `columnIndexToLetter(index: number): string`

5. **Git Analysis — Performance Patterns:**
   - Virtualisation via react-window: opérations sur state, PAS sur DOM
   - Support 1000 lignes: éviter boucles N² (utiliser Object.entries + filter au lieu de double loop)
   - Zustand batching: plusieurs mutations dans un seul `set()` sont batchées automatiquement

### Contraintes et Points d'Attention

1. **Atomicité** — Si une opération échoue, toutes les opérations précédentes doivent être rollback. Pour cette story, implémentation simple : try/catch global. Rollback avancé sera ajouté si nécessaire pour Story 2.4 (diff visuel).

2. **Performance** — SORT est l'opération la plus coûteuse (O(N log N)). Avec 1000 lignes, doit rester < 100ms. Utiliser `localeCompare` pour les strings, comparaison numérique pour les numbers.

3. **Cell ID Format** — TOUJOURS utiliser `cellUtils` pour conversions. Ne jamais faire de parsing manuel de cell IDs.

4. **GridStore Actions** — Vérifier si `insertRow()`, `deleteRow()`, `insertColumn()`, `deleteColumn()` existent déjà dans gridStore (Stories 1.4). Si oui, les réutiliser. Sinon, les créer dans cette story.

5. **Formulas** — `SET_FORMULA` stocke juste la formule dans `cell.formula`. L'évaluation des formules n'est PAS dans le MVP (post-MVP feature). Pour l'instant, afficher juste la formule comme string.

6. **Format Merging** — `FORMAT` opération doit merger avec le format existant, pas écraser complètement. Utiliser spread operator: `{ ...currentFormat, ...newFormat }`.

7. **Dirty Flag** — Les opérations doivent déclencher le dirty flag pour l'auto-save (Story 1.6). Zustand subscribers se déclenchent automatiquement quand le state change via `set()`.

### Scope — Ce qui est HORS de cette story

- **Diff visuel** → Story 2.4 (affichage vert/orange/rouge des modifications)
- **Validation/Refus** → Story 2.5 (boutons Valider/Refuser)
- **Formulas evaluation** → Post-MVP (cette story stocke juste la formule string)
- **Undo/Redo** → Post-MVP (rollback avancé)
- **Batch optimization** → Post-MVP (pour l'instant, application séquentielle simple)

### Project Structure Notes

Fichiers créés/modifiés par cette story :

```
frontend/src/
├── utils/
│   ├── operationsEngine.ts          (new — moteur d'application des opérations)
│   └── operationsEngine.test.ts     (new — tests du moteur)
├── stores/
│   ├── gridStore.ts                 (modified — ajout insertRow, deleteRow, insertColumn, deleteColumn si manquants)
│   ├── gridStore.test.ts            (modified — tests pour nouvelles actions)
│   └── diffStore.ts                 (modified — ajout applyPendingOperations())
```

### References

- [Source: architecture.md#Data Model] — 8 operation types, Cell model with format field
- [Source: architecture.md#State Management] — gridStore, diffStore patterns
- [Source: epics.md#Story 2.3] — User story, acceptance criteria
- [Source: Story 1.2-1.6] — gridStore, cellUtils, virtualization patterns
- [Source: Story 2.1] — Backend API operations schema
- [Source: Story 2.2] — commandStore → diffStore integration
- [Source: Git Analysis] — Performance patterns, Zustand + Immer patterns

## Dev Agent Record

### Agent Model Used

Claude Sonnet 4.5

### Debug Log References

### Completion Notes List

### File List

