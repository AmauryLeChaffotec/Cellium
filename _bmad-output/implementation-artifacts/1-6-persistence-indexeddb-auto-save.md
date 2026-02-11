# Story 1.6: Persistence IndexedDB et Auto-Save

Status: ready-for-dev

## Story

As a utilisateur,
I want que mes données soient sauvegardées automatiquement et récupérées après un crash,
so that je ne perds jamais mon travail.

## Acceptance Criteria

1. **Given** l'utilisateur travaille dans la grille **When** 30 secondes s'écoulent depuis le dernier save **Then** le gridStore est persisté dans IndexedDB (object store `gridData`) (FR24, NFR16)
2. **Given** l'application est fermée puis réouverte **When** l'application charge **Then** les données sont restaurées depuis IndexedDB (NFR17) **And** l'état de la grille est identique à la dernière sauvegarde
3. **Given** le navigateur crash **When** l'application est réouverte **Then** les données sont récupérées depuis IndexedDB (NFR17)

## Tasks / Subtasks

- [ ] Task 1: Créer `src/utils/persistence.ts` — adapter IndexedDB via `idb` (AC: #1, #2, #3)
  - [ ] 1.1 Définir l'interface `CelliumDB` (extends `DBSchema`) avec object store `gridData`
  - [ ] 1.2 Implémenter `getDB()` — singleton qui ouvre/crée la base `cellium` v1
  - [ ] 1.3 Implémenter `saveGridData(data: GridPersistData)` — sauvegarde l'état grille
  - [ ] 1.4 Implémenter `loadGridData()` — charge l'état grille (retourne `null` si aucune donnée)
- [ ] Task 2: Créer `src/utils/persistence.test.ts` — tests unitaires adapter (AC: #1, #2)
  - [ ] 2.1 Mocker `idb` (`openDB`) avec un objet DB fake in-memory
  - [ ] 2.2 Tester `saveGridData` — appelle `db.put('gridData', data, 'current')`
  - [ ] 2.3 Tester `loadGridData` — retourne données sauvegardées ou `null`
  - [ ] 2.4 Tester `getDB` — appelle `openDB` une seule fois (singleton)
- [ ] Task 3: Ajouter l'action `loadGrid` au gridStore (AC: #2, #3)
  - [ ] 3.1 Ajouter `loadGrid(data: GridPersistData)` au store — set cells, rowCount, colCount
  - [ ] 3.2 Ajouter tests pour `loadGrid` dans `gridStore.test.ts`
- [ ] Task 4: Créer `src/hooks/useAutoSave.ts` — hook de chargement + auto-save (AC: #1, #2, #3)
  - [ ] 4.1 Au mount : charger depuis IndexedDB, si données → `loadGrid()`, sinon → `initializeGrid(1000, 26)`
  - [ ] 4.2 Abonner aux changements du store via `useGridStore.subscribe`, marquer dirty
  - [ ] 4.3 Intervalle 30s : si dirty → `saveGridData()`, reset dirty
  - [ ] 4.4 Cleanup : clearInterval au unmount
- [ ] Task 5: Créer `src/hooks/useAutoSave.test.ts` — tests du hook (AC: #1, #2)
  - [ ] 5.1 Mocker `persistence.ts` (`vi.mock`)
  - [ ] 5.2 Tester chargement initial — loadGridData appelé, loadGrid si données
  - [ ] 5.3 Tester chargement initial — initializeGrid si pas de données
  - [ ] 5.4 Tester auto-save — save déclenché après 30s si dirty
  - [ ] 5.5 Tester cleanup — intervalle nettoyé au unmount
- [ ] Task 6: Intégrer dans SpreadsheetGrid.tsx (AC: #1, #2, #3)
  - [ ] 6.1 Remplacer le `useEffect` d'initialisation par `useAutoSave()`
  - [ ] 6.2 Le hook gère tout : chargement, initialisation, et auto-save
- [ ] Task 7: Mettre à jour `SpreadsheetGrid.test.tsx` (AC: #1, #2)
  - [ ] 7.1 Mocker `persistence.ts` dans les tests existants pour éviter les appels IndexedDB
  - [ ] 7.2 S'assurer que tous les tests existants passent
- [ ] Task 8: Validation finale (AC: #1, #2, #3)
  - [ ] 8.1 `npm run build` compile sans erreur
  - [ ] 8.2 Tous les tests passent (`npx vitest run`)

## Dev Notes

### Architecture Compliance

**Source : [architecture.md](../../_bmad-output/planning-artifacts/architecture.md)**

Cette story implémente la couche de persistence prévue dans l'architecture. L'adapter `persistence.ts` est le point d'accès unique à IndexedDB. L'auto-save s'active toutes les 30s (NFR16). La récupération après crash est garantie par la nature persistante d'IndexedDB (NFR17).

### `idb` v8.0.3 — API Utilisée

**Déjà installé dans `package.json` :** `"idb": "^8.0.3"`

**Imports :**
```typescript
import { openDB } from 'idb';
import type { DBSchema, IDBPDatabase } from 'idb';
```

**Ouverture/Création de la base :**
```typescript
const db = await openDB<CelliumDB>('cellium', 1, {
  upgrade(db) {
    db.createObjectStore('gridData');
  },
});
```

**Lecture/Écriture (shortcuts sans transaction explicite) :**
```typescript
// Écriture
await db.put('gridData', data, 'current');

// Lecture
const data = await db.get('gridData', 'current');
// Retourne GridPersistData | undefined
```

### persistence.ts — Implémentation Cible

**Fichier `src/utils/persistence.ts` :**

```typescript
import { openDB } from 'idb';
import type { DBSchema, IDBPDatabase } from 'idb';
import type { Grid } from '../types/cell';

export interface GridPersistData {
  cells: Grid;
  rowCount: number;
  colCount: number;
}

interface CelliumDB extends DBSchema {
  gridData: {
    key: string;
    value: GridPersistData;
  };
}

let dbPromise: Promise<IDBPDatabase<CelliumDB>> | null = null;

function getDB(): Promise<IDBPDatabase<CelliumDB>> {
  if (!dbPromise) {
    dbPromise = openDB<CelliumDB>('cellium', 1, {
      upgrade(db) {
        db.createObjectStore('gridData');
      },
    });
  }
  return dbPromise;
}

export async function saveGridData(data: GridPersistData): Promise<void> {
  const db = await getDB();
  await db.put('gridData', data, 'current');
}

export async function loadGridData(): Promise<GridPersistData | null> {
  const db = await getDB();
  const data = await db.get('gridData', 'current');
  return data ?? null;
}
```

**Points clés :**
- `getDB()` est un singleton — une seule connexion ouverte
- La clé `'current'` est utilisée pour l'unique enregistrement de l'état courant
- `GridPersistData` ne contient que les données persistables (PAS `editingCell`/`selectedCell` qui sont de l'état UI transient)

### gridStore.ts — Action `loadGrid`

```typescript
// Nouvelle interface
interface GridActions {
  // ... actions existantes
  loadGrid: (data: GridPersistData) => void;
}

// Nouvelle action dans le store
loadGrid: (data) =>
  set((state) => {
    state.cells = data.cells;
    state.rowCount = data.rowCount;
    state.colCount = data.colCount;
    state.editingCell = null;
    state.selectedCell = null;
  }),
```

### useAutoSave.ts — Hook Cible

```typescript
import { useEffect, useRef } from 'react';
import { useGridStore } from '../stores/gridStore';
import { saveGridData, loadGridData } from '../utils/persistence';

const SAVE_INTERVAL_MS = 30_000; // 30 secondes

export function useAutoSave() {
  const loadGrid = useGridStore((s) => s.loadGrid);
  const initializeGrid = useGridStore((s) => s.initializeGrid);
  const dirtyRef = useRef(false);

  // Chargement initial
  useEffect(() => {
    loadGridData().then((data) => {
      if (data) {
        loadGrid(data);
      } else {
        initializeGrid(1000, 26);
      }
    });
  }, [loadGrid, initializeGrid]);

  // Souscription aux changements + auto-save
  useEffect(() => {
    const unsubscribe = useGridStore.subscribe(() => {
      dirtyRef.current = true;
    });

    const intervalId = setInterval(() => {
      if (dirtyRef.current) {
        const { cells, rowCount, colCount } = useGridStore.getState();
        saveGridData({ cells, rowCount, colCount });
        dirtyRef.current = false;
      }
    }, SAVE_INTERVAL_MS);

    return () => {
      unsubscribe();
      clearInterval(intervalId);
    };
  }, []);

  return null;
}
```

### SpreadsheetGrid.tsx — Changements

```typescript
// Avant (Story 1.5)
useEffect(() => {
  initializeGrid(1000, 26);
}, [initializeGrid]);

// Après (Story 1.6)
useAutoSave(); // Remplace l'effet d'initialisation
// Suppression de initializeGrid du destructuring
```

Le hook `useAutoSave` gère tout le cycle : chargement → initialisation → auto-save.

### Données Persistées vs Transientes

| Propriété | Persistée ? | Raison |
|-----------|:-----------:|--------|
| `cells` | Oui | Données utilisateur |
| `rowCount` | Oui | Dimension grille |
| `colCount` | Oui | Dimension grille |
| `editingCell` | Non | État UI transient |
| `selectedCell` | Non | État UI transient |

### Tests — Stratégie de Mocking

**persistence.test.ts** — Mock `idb` :
```typescript
import { vi } from 'vitest';

const mockDB = {
  put: vi.fn(),
  get: vi.fn(),
};

vi.mock('idb', () => ({
  openDB: vi.fn(() => Promise.resolve(mockDB)),
}));
```

**useAutoSave.test.ts** — Mock `persistence.ts` :
```typescript
vi.mock('../utils/persistence', () => ({
  loadGridData: vi.fn(),
  saveGridData: vi.fn(),
}));
```

**SpreadsheetGrid.test.tsx** — Mock `persistence.ts` (pour éviter IndexedDB en test) :
```typescript
vi.mock('../../utils/persistence', () => ({
  loadGridData: vi.fn(() => Promise.resolve(null)),
  saveGridData: vi.fn(),
}));
```

### Contraintes et Points d'Attention

1. **Singleton `getDB()`** : Ne pas ouvrir la DB à chaque opération — réutiliser la connexion.
2. **État transient** : Ne PAS persister `editingCell` et `selectedCell` — ils sont nuls au rechargement.
3. **Race condition au mount** : `useAutoSave` doit charger les données AVANT que le composant ne rende des cellules. Le loadGrid/initializeGrid dans useEffect s'exécute avant le premier paint interactif, mais après le premier render. Les cellules se rendent vides puis se remplissent — acceptable pour le MVP.
4. **Intervalle 30s** : Pas de save à chaque keystroke (performance). Le dirty flag évite les saves inutiles.
5. **Tests happy-dom** : IndexedDB n'est pas disponible dans happy-dom → mocker `persistence.ts` ou `idb` dans tous les tests.
6. **Import type** : `GridPersistData` est exporté depuis `persistence.ts` et importé dans gridStore via `import type`.

### Previous Story Intelligence (Stories 1.1 → 1.5)

**Learnings critiques :**
1. **happy-dom** : `// @vitest-environment happy-dom` (PAS jsdom)
2. **Zustand v5 sélecteurs** : Atomiques `(s) => s.prop`
3. **act() wrapper** : Wrapper dispatches d'événements et mises à jour store dans `act()`
4. **Immer state replacement** : `state.cells = newCells` fonctionne dans callback Immer
5. **react-window v2** : ResizeObserver mock nécessaire dans tests SpreadsheetGrid
6. **vi.mock()** : Doit être au top-level du fichier (hoisted automatiquement par vitest)
7. **vi.useFakeTimers()** : Pour tester les intervalles — ne pas oublier `vi.useRealTimers()` en cleanup

### Scope — Ce qui est HORS de cette story

- **Versioning / snapshots** → Epic 3 (Story 3.1)
- **Export/Import fichiers** → Post-MVP
- **Sync multi-onglet** → Post-MVP
- **Compression des données** → Post-MVP
- **Migration de schéma IndexedDB** → Si nécessaire dans une future story

### Project Structure Notes

Fichiers créés/modifiés par cette story :
```
frontend/src/
├── utils/
│   ├── persistence.ts              (new — adapter IndexedDB)
│   └── persistence.test.ts         (new — tests adapter)
├── stores/
│   ├── gridStore.ts                (modified — ajout loadGrid)
│   └── gridStore.test.ts           (modified — tests loadGrid)
├── hooks/
│   ├── useAutoSave.ts              (new — hook chargement + auto-save)
│   └── useAutoSave.test.ts         (new — tests hook)
├── components/Grid/
│   ├── SpreadsheetGrid.tsx         (modified — useAutoSave remplace initializeGrid)
│   └── SpreadsheetGrid.test.tsx    (modified — mock persistence)
```

### References

- [Source: architecture.md#Data Architecture] — persistence.ts, IndexedDB via idb
- [Source: architecture.md#Boundary Persistence] — gridData object store, auto-save 30s
- [Source: epics.md#Story 1.6] — User story, acceptance criteria
- [Source: idb v8.0.3 API] — openDB, DBSchema, put, get

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List

