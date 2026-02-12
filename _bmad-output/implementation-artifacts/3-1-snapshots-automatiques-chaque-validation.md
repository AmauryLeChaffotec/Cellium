---
story_id: 3-1-snapshots-automatiques-chaque-validation
epic: epic-3
title: Snapshots Automatiques à Chaque Validation
status: ready-for-dev
created: 2026-02-12
---

# Story 3.1: Snapshots Automatiques à Chaque Validation

## User Story

**As a** utilisateur,
**I want** qu'un snapshot soit créé automatiquement chaque fois que je valide une proposition IA,
**So that** chaque modification est traçable sans effort de ma part.

## Context

Cette story démarre **Epic 3: Gestion de Versions**. Elle crée la fondation du système de versioning en capturant automatiquement chaque validation utilisateur sous forme de snapshot delta dans IndexedDB.

**Dépendances:**
- ✅ Story 2.5 (Validation et Refus) — Le hook de validation `applyPendingOperations()` doit déclencher la création de snapshot

**Ce que cette story NE fait PAS:**
- N'inclut PAS l'UI de consultation de l'historique (Story 3.2)
- N'inclut PAS la restauration de version (Story 3.3)

Cette story se concentre uniquement sur la **capture automatique et la persistence** des snapshots.

## Acceptance Criteria

### AC1: Snapshot Créé à Chaque Validation

**Given** l'utilisateur clique "Valider" sur un diff (Story 2.5)
**When** les opérations sont appliquées au gridStore
**Then** le versionStore crée automatiquement un nouveau snapshot delta (FR26)
**And** le snapshot contient :
  - La liste des opérations appliquées (Operation[])
  - Un timestamp ISO 8601 (ex: `2026-02-12T14:30:00.000Z`)
  - Une description auto-générée à partir de la commande IA (ex: "Ajout colonne avec calcul")

### AC2: Stockage Incrémental par Deltas

**Given** un snapshot est créé
**When** il est persisté
**Then** seules les opérations (delta) sont stockées, PAS une copie complète de la grille (FR29)
**And** le snapshot est sauvegardé dans IndexedDB (object store `versionHistory`)

### AC3: Snapshots Distincts pour Chaque Validation

**Given** plusieurs validations successives
**When** le versionStore est consulté
**Then** chaque validation a produit un snapshot distinct avec son propre timestamp
**And** les snapshots sont ordonnés chronologiquement

### AC4: Intégrité et Persistence

**Given** un snapshot est persisté dans IndexedDB
**When** l'application est fermée puis réouverte
**Then** les snapshots sont récupérés depuis IndexedDB
**And** tous les snapshots sont intacts (timestamp, description, operations)

## Technical Implementation

### Task Breakdown

#### Task 1: Créer les Types TypeScript pour Snapshot

**File:** `frontend/src/types/version.ts`

```typescript
import type { Operation } from './operations';

export interface Snapshot {
  id: string; // UUID v4
  timestamp: string; // ISO 8601
  description: string; // Description de la commande IA
  operations: Operation[]; // Delta des opérations appliquées
}

export interface VersionStore {
  snapshots: Snapshot[];
  createSnapshot: (operations: Operation[], description: string) => void;
  loadSnapshots: () => Promise<void>;
  clearSnapshots: () => void;
}
```

**Notes:**
- `id` est un UUID v4 généré côté client (utiliser `crypto.randomUUID()`)
- `timestamp` est généré avec `new Date().toISOString()`
- `operations` contient le delta, pas l'état complet de la grille (FR29)

#### Task 2: Créer le versionStore Zustand

**File:** `frontend/src/stores/versionStore.ts`

```typescript
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { Snapshot } from '../types/version';
import type { Operation } from '../types/operations';
import { saveSnapshotToDB, loadSnapshotsFromDB } from '../utils/versionPersistence';

interface VersionStore {
  snapshots: Snapshot[];
  isLoading: boolean;

  createSnapshot: (operations: Operation[], description: string) => void;
  loadSnapshots: () => Promise<void>;
  clearSnapshots: () => void;
}

export const useVersionStore = create<VersionStore>()(
  immer((set) => ({
    snapshots: [],
    isLoading: false,

    createSnapshot: (operations, description) => {
      const snapshot: Snapshot = {
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        description,
        operations,
      };

      set((state) => {
        state.snapshots.push(snapshot);
      });

      // Persist to IndexedDB
      saveSnapshotToDB(snapshot);
    },

    loadSnapshots: async () => {
      set((state) => {
        state.isLoading = true;
      });

      const snapshots = await loadSnapshotsFromDB();

      set((state) => {
        state.snapshots = snapshots;
        state.isLoading = false;
      });
    },

    clearSnapshots: () =>
      set((state) => {
        state.snapshots = [];
      }),
  }))
);
```

**Notes:**
- `createSnapshot()` est synchrone côté store, mais lance l'écriture IndexedDB en background
- `loadSnapshots()` est async et charge tous les snapshots au démarrage de l'app
- Les snapshots sont ordonnés chronologiquement (ordre d'insertion)

#### Task 3: Créer les Utilitaires de Persistence IndexedDB

**File:** `frontend/src/utils/versionPersistence.ts`

```typescript
import { openDB, DBSchema, IDBPDatabase } from 'idb';
import type { Snapshot } from '../types/version';

interface CelliumDB extends DBSchema {
  gridData: {
    key: string;
    value: any;
  };
  versionHistory: {
    key: string; // snapshot.id
    value: Snapshot;
    indexes: { 'by-timestamp': string };
  };
}

let dbInstance: IDBPDatabase<CelliumDB> | null = null;

async function getDB(): Promise<IDBPDatabase<CelliumDB>> {
  if (dbInstance) return dbInstance;

  dbInstance = await openDB<CelliumDB>('cellium-db', 1, {
    upgrade(db) {
      // Create gridData store (already exists from Story 1.6)
      if (!db.objectStoreNames.contains('gridData')) {
        db.createObjectStore('gridData');
      }

      // Create versionHistory store
      if (!db.objectStoreNames.contains('versionHistory')) {
        const store = db.createObjectStore('versionHistory', { keyPath: 'id' });
        store.createIndex('by-timestamp', 'timestamp');
      }
    },
  });

  return dbInstance;
}

export async function saveSnapshotToDB(snapshot: Snapshot): Promise<void> {
  const db = await getDB();
  await db.put('versionHistory', snapshot);
}

export async function loadSnapshotsFromDB(): Promise<Snapshot[]> {
  const db = await getDB();
  const snapshots = await db.getAll('versionHistory');

  // Sort by timestamp ascending (oldest first)
  return snapshots.sort((a, b) =>
    new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );
}

export async function clearSnapshotsFromDB(): Promise<void> {
  const db = await getDB();
  await db.clear('versionHistory');
}
```

**Notes:**
- Réutilise la même DB `cellium-db` créée dans Story 1.6
- L'object store `versionHistory` utilise `snapshot.id` comme clé primaire
- Index `by-timestamp` permet des requêtes chronologiques efficaces
- `loadSnapshotsFromDB()` trie par timestamp croissant

#### Task 4: Connecter versionStore au Hook de Validation

**File:** `frontend/src/stores/diffStore.ts` (Modifier)

Ajouter l'appel à `createSnapshot()` dans la méthode `applyPendingOperations()`:

```typescript
import { useVersionStore } from './versionStore';

// Dans applyPendingOperations():
applyPendingOperations: () => {
  const { pendingOperations, description } = get();
  if (pendingOperations.length === 0) return;

  set((state) => {
    state.isApplying = true;
    state.applyError = null;
  });

  try {
    // Apply operations to gridStore
    applyOperations(pendingOperations);

    // ✅ CREATE SNAPSHOT AFTER SUCCESSFUL APPLICATION
    if (description) {
      useVersionStore.getState().createSnapshot(pendingOperations, description);
    }

    // Clear pending and preview
    set((state) => {
      state.pendingOperations = [];
      state.description = null;
      state.diffPreview = null;
      state.isApplying = false;
    });
  } catch (error) {
    set((state) => {
      state.isApplying = false;
      state.applyError =
        error instanceof Error
          ? error.message
          : "Erreur lors de l'application des changements";
    });
  }
},
```

**Placement critique:**
- `createSnapshot()` est appelé **APRÈS** `applyOperations()` réussit
- **AVANT** de clear le diffStore
- Seulement si `description` existe (sanity check)

#### Task 5: Charger les Snapshots au Démarrage de l'App

**File:** `frontend/src/App.tsx` (Modifier)

Ajouter un `useEffect` pour charger les snapshots depuis IndexedDB au mount:

```typescript
import { useVersionStore } from './stores/versionStore';

function App() {
  useKeyboardShortcuts();

  useEffect(() => {
    // Load snapshots from IndexedDB on app mount
    useVersionStore.getState().loadSnapshots();
  }, []);

  return (
    <div className="min-h-screen bg-white">
      {/* ... */}
    </div>
  );
}
```

**Notes:**
- `loadSnapshots()` s'exécute une seule fois au mount
- Pas d'UI de chargement visible pour cette story (sera dans Story 3.2)

#### Task 6: Créer Tests pour versionStore

**File:** `frontend/src/stores/versionStore.test.ts`

```typescript
// @vitest-environment happy-dom
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useVersionStore } from './versionStore';
import * as versionPersistence from '../utils/versionPersistence';

// Mock IndexedDB persistence
vi.mock('../utils/versionPersistence', () => ({
  saveSnapshotToDB: vi.fn(() => Promise.resolve()),
  loadSnapshotsFromDB: vi.fn(() => Promise.resolve([])),
  clearSnapshotsFromDB: vi.fn(() => Promise.resolve()),
}));

describe('versionStore', () => {
  beforeEach(() => {
    useVersionStore.setState({
      snapshots: [],
      isLoading: false,
    });
    vi.clearAllMocks();
  });

  it('should create snapshot with UUID, timestamp, and description', () => {
    const { result } = renderHook(() => useVersionStore());

    const operations = [{ type: 'SET_VALUE', cellId: 'A1', value: 42 }];
    const description = 'Test operation';

    act(() => {
      result.current.createSnapshot(operations, description);
    });

    expect(result.current.snapshots).toHaveLength(1);
    expect(result.current.snapshots[0]).toMatchObject({
      description: 'Test operation',
      operations,
    });
    expect(result.current.snapshots[0].id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
    expect(result.current.snapshots[0].timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    expect(versionPersistence.saveSnapshotToDB).toHaveBeenCalledWith(result.current.snapshots[0]);
  });

  it('should create multiple distinct snapshots', () => {
    const { result } = renderHook(() => useVersionStore());

    act(() => {
      result.current.createSnapshot([{ type: 'SET_VALUE', cellId: 'A1', value: 10 }], 'First');
      result.current.createSnapshot([{ type: 'SET_VALUE', cellId: 'B1', value: 20 }], 'Second');
    });

    expect(result.current.snapshots).toHaveLength(2);
    expect(result.current.snapshots[0].description).toBe('First');
    expect(result.current.snapshots[1].description).toBe('Second');
    expect(result.current.snapshots[0].id).not.toBe(result.current.snapshots[1].id);
  });

  it('should load snapshots from IndexedDB', async () => {
    const mockSnapshots = [
      {
        id: '1',
        timestamp: '2026-02-12T10:00:00.000Z',
        description: 'Snapshot 1',
        operations: [],
      },
    ];

    vi.mocked(versionPersistence.loadSnapshotsFromDB).mockResolvedValue(mockSnapshots);

    const { result } = renderHook(() => useVersionStore());

    await act(async () => {
      await result.current.loadSnapshots();
    });

    expect(result.current.snapshots).toEqual(mockSnapshots);
    expect(result.current.isLoading).toBe(false);
  });

  it('should clear all snapshots', () => {
    const { result } = renderHook(() => useVersionStore());

    act(() => {
      result.current.createSnapshot([{ type: 'SET_VALUE', cellId: 'A1', value: 10 }], 'Test');
    });

    expect(result.current.snapshots).toHaveLength(1);

    act(() => {
      result.current.clearSnapshots();
    });

    expect(result.current.snapshots).toEqual([]);
  });
});
```

**Coverage:**
- ✅ Création de snapshot avec UUID, timestamp, description
- ✅ Snapshots distincts avec IDs uniques
- ✅ Chargement depuis IndexedDB
- ✅ Clear des snapshots

#### Task 7: Créer Tests d'Intégration pour le Hook de Validation

**File:** `frontend/src/stores/diffStore.integration.test.ts`

```typescript
// @vitest-environment happy-dom
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDiffStore } from './diffStore';
import { useVersionStore } from './versionStore';
import { useGridStore } from './gridStore';
import * as versionPersistence from '../utils/versionPersistence';

vi.mock('../utils/versionPersistence', () => ({
  saveSnapshotToDB: vi.fn(() => Promise.resolve()),
  loadSnapshotsFromDB: vi.fn(() => Promise.resolve([])),
  clearSnapshotsFromDB: vi.fn(() => Promise.resolve()),
}));

describe('diffStore + versionStore Integration', () => {
  beforeEach(() => {
    useGridStore.setState({ cells: {}, rowCount: 100, colCount: 26, editingCell: null, selectedCell: null });
    useDiffStore.setState({ pendingOperations: [], description: null, diffPreview: null, isApplying: false, applyError: null });
    useVersionStore.setState({ snapshots: [], isLoading: false });
    vi.clearAllMocks();
  });

  it('should create snapshot automatically after validation', () => {
    const { result: diffResult } = renderHook(() => useDiffStore());
    const { result: versionResult } = renderHook(() => useVersionStore());

    // Set pending operations
    act(() => {
      diffResult.current.setPendingOperations(
        [{ type: 'SET_VALUE', cellId: 'A1', value: 42 }],
        'Ajout valeur A1'
      );
    });

    expect(versionResult.current.snapshots).toHaveLength(0);

    // Apply operations (validate)
    act(() => {
      diffResult.current.applyPendingOperations();
    });

    // Snapshot should be created
    expect(versionResult.current.snapshots).toHaveLength(1);
    expect(versionResult.current.snapshots[0].description).toBe('Ajout valeur A1');
    expect(versionResult.current.snapshots[0].operations).toEqual([
      { type: 'SET_VALUE', cellId: 'A1', value: 42 },
    ]);
    expect(versionPersistence.saveSnapshotToDB).toHaveBeenCalled();
  });

  it('should NOT create snapshot if validation fails', () => {
    const { result: diffResult } = renderHook(() => useDiffStore());
    const { result: versionResult } = renderHook(() => useVersionStore());

    // Set invalid operation that will throw
    act(() => {
      diffResult.current.setPendingOperations(
        [{ type: 'SET_VALUE', cellId: 'INVALID_ID', value: 42 }],
        'Invalid operation'
      );
    });

    // Apply operations (will throw)
    act(() => {
      diffResult.current.applyPendingOperations();
    });

    // Snapshot should NOT be created
    expect(versionResult.current.snapshots).toHaveLength(0);
    expect(versionPersistence.saveSnapshotToDB).not.toHaveBeenCalled();
  });

  it('should create multiple snapshots for sequential validations', () => {
    const { result: diffResult } = renderHook(() => useDiffStore());
    const { result: versionResult } = renderHook(() => useVersionStore());

    // First validation
    act(() => {
      diffResult.current.setPendingOperations(
        [{ type: 'SET_VALUE', cellId: 'A1', value: 10 }],
        'First operation'
      );
      diffResult.current.applyPendingOperations();
    });

    // Second validation
    act(() => {
      diffResult.current.setPendingOperations(
        [{ type: 'SET_VALUE', cellId: 'B1', value: 20 }],
        'Second operation'
      );
      diffResult.current.applyPendingOperations();
    });

    // Two distinct snapshots
    expect(versionResult.current.snapshots).toHaveLength(2);
    expect(versionResult.current.snapshots[0].description).toBe('First operation');
    expect(versionResult.current.snapshots[1].description).toBe('Second operation');
    expect(versionResult.current.snapshots[0].timestamp).not.toBe(
      versionResult.current.snapshots[1].timestamp
    );
  });
});
```

**Coverage:**
- ✅ Snapshot créé automatiquement après validation réussie
- ✅ Pas de snapshot si validation échoue
- ✅ Snapshots distincts pour validations séquentielles

#### Task 8: Validation Finale

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
- ✅ Tous les tests passent (nouveau total: 236 + ~10 = 246 tests)
- ✅ Build réussit sans erreurs TypeScript
- ✅ IndexedDB contient l'object store `versionHistory`

## Dev Notes

### Architecture Decisions

**1. Stockage Incrémental par Deltas (FR29)**
- Chaque snapshot stocke uniquement les **opérations appliquées**, pas l'état complet de la grille
- Avantages:
  - Footprint mémoire minimal (quelques KB par snapshot vs plusieurs MB pour une grille complète)
  - Performance de sauvegarde optimale (< 10ms par snapshot)
  - Scalabilité: peut stocker 100+ snapshots sans problème de quota IndexedDB

**2. Snapshot = Opérations + Metadata**
```typescript
{
  id: "uuid-v4",
  timestamp: "2026-02-12T14:30:00.000Z",
  description: "Ajout colonne avec calcul de totaux",
  operations: [
    { type: 'INSERT_COLUMN', colIndex: 3, header: 'Total', cells: {...} },
    { type: 'SET_FORMULA', cellId: 'D1', formula: '=SUM(A1:C1)' }
  ]
}
```

**3. Hook de Création Automatique**
- Le snapshot est créé **dans `applyPendingOperations()`** (diffStore)
- Timing: APRÈS `applyOperations()` réussit, AVANT de clear le diffStore
- Garantit que le snapshot n'est créé que si les opérations sont appliquées avec succès

**4. Persistence en Background**
- `saveSnapshotToDB()` est appelé de façon asynchrone (fire-and-forget)
- N'impacte pas la réactivité de l'UI (NFR4: < 100ms pour la validation)
- En cas d'échec de persistence, le snapshot reste en mémoire dans le store

### Edge Cases

**1. Description Manquante**
- Si `description` est `null`, le snapshot n'est pas créé
- Sanity check: toutes les commandes IA incluent une description, mais on sécurise

**2. IndexedDB Indisponible (Mode Privé)**
- `saveSnapshotToDB()` échouera silencieusement
- Le snapshot reste en mémoire dans `versionStore.snapshots`
- L'utilisateur pourra consulter l'historique pendant la session, mais il sera perdu au refresh

**3. Quota IndexedDB Dépassé**
- Peu probable (snapshots = deltas légers)
- Si quota atteint: `saveSnapshotToDB()` throw → loggé en console, mais l'app continue

### Performance Targets

- **Création de snapshot**: < 5ms (génération UUID + timestamp + push dans array)
- **Sauvegarde IndexedDB**: < 20ms (asynchrone, non-bloquant)
- **Chargement au démarrage**: < 100ms pour 50 snapshots

### Testing Strategy

**Unit Tests:**
- versionStore: création, chargement, clear
- Mocking de `versionPersistence` pour isoler le store

**Integration Tests:**
- diffStore + versionStore: validation déclenche création de snapshot
- Vérifier que les échecs de validation ne créent pas de snapshot

**Manual Testing:**
1. Valider une commande IA → Vérifier dans DevTools (Application > IndexedDB > cellium-db > versionHistory) que le snapshot est présent
2. Valider 3 commandes successives → Vérifier 3 snapshots distincts avec timestamps différents
3. Refresh la page → Vérifier que les snapshots sont toujours présents

## Definition of Done

- [ ] Types TypeScript créés (`version.ts`)
- [ ] `versionStore` créé avec Zustand + Immer
- [ ] Utilitaires IndexedDB (`versionPersistence.ts`) implémentés
- [ ] Hook de validation modifié pour appeler `createSnapshot()`
- [ ] App.tsx charge les snapshots au mount
- [ ] Tests unitaires pour versionStore (10+ assertions)
- [ ] Tests d'intégration diffStore + versionStore (3+ scénarios)
- [ ] Tous les tests passent (246+ tests)
- [ ] Build production réussit sans erreurs TypeScript
- [ ] Vérification manuelle: snapshots persistés dans IndexedDB après validation

## Related Requirements

**Functional:**
- FR26: Le système crée automatiquement un snapshot à chaque validation de diff
- FR29: Le système stocke les versions de façon incrémentale (deltas, pas copies complètes)

**NonFunctional:**
- NFR4: Application ou annulation diff en < 100ms (ne doit pas être ralenti par la création de snapshot)
- NFR16: Auto-sauvegarde (snapshots doivent persister dans IndexedDB)
- NFR17: Récupération crash (snapshots doivent être récupérés après crash)
- NFR18: Intégrité versioning (snapshots immuables, restauration ne corrompt pas l'historique)

## Next Steps

After this story:
- **Story 3.2:** Créer le VersionPanel pour consulter l'historique
- **Story 3.3:** Implémenter la restauration de version en un clic
