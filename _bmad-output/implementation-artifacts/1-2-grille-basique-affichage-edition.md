# Story 1.2: Grille Basique avec Affichage et Édition

Status: review

## Story

As a utilisateur,
I want voir mes données dans une grille et modifier le contenu de chaque cellule,
so that je peux saisir et organiser mes données.

## Acceptance Criteria

1. **Given** l'application est ouverte **When** la grille s'affiche **Then** une grille de colonnes A-Z et de lignes 1-100 (défaut) est visible **And** chaque cellule affiche sa valeur (FR1, FR22)
2. **Given** une cellule est affichée **When** l'utilisateur double-clique sur la cellule **Then** la cellule passe en mode édition avec un input **And** l'utilisateur peut saisir du texte ou un nombre (FR2)
3. **Given** une cellule est en mode édition **When** l'utilisateur appuie sur Enter ou clique ailleurs **Then** la valeur est sauvegardée dans le gridStore **And** la cellule revient en mode affichage (FR23)

## Tasks / Subtasks

- [x] Task 1: Créer `cellUtils.ts` — utilitaires de conversion cellId (AC: #1)
  - [x] 1.1 Créer `src/utils/cellUtils.ts` avec fonctions : `columnIndexToLetter(index)`, `letterToColumnIndex(letter)`, `cellIdToCoords(id)`, `coordsToCellId(row, col)`
  - [x] 1.2 Créer `src/utils/cellUtils.test.ts` — tests pour chaque fonction utilitaire
- [x] Task 2: Créer `gridStore.ts` — Zustand store avec Immer (AC: #1, #3)
  - [x] 2.1 Créer `src/stores/gridStore.ts` avec state et actions (voir Dev Notes)
  - [x] 2.2 Créer `src/stores/gridStore.test.ts` — tests : initializeGrid, setCell, startEditing, stopEditing
- [x] Task 3: Créer composant `Cell.tsx` (AC: #1, #2, #3)
  - [x] 3.1 Créer `src/components/Grid/Cell.tsx` avec mode affichage/édition
  - [x] 3.2 Mode affichage : div affichant `cell.value` (ou vide si null)
  - [x] 3.3 Mode édition : input text, déclenché par double-clic
  - [x] 3.4 Sauvegarde sur Enter ou blur (clic ailleurs)
  - [x] 3.5 Créer `src/components/Grid/Cell.test.tsx` — tests : affichage valeur, double-clic → édition, Enter → sauvegarde, blur → sauvegarde
- [x] Task 4: Créer composant `GridHeader.tsx` (AC: #1)
  - [x] 4.1 Créer `src/components/Grid/GridHeader.tsx` — en-têtes A à Z avec colonne vide pour les numéros de ligne
- [x] Task 5: Créer composant `SpreadsheetGrid.tsx` (AC: #1)
  - [x] 5.1 Créer `src/components/Grid/SpreadsheetGrid.tsx` — rendu table HTML avec GridHeader + 100 lignes de Cell
  - [x] 5.2 Numéros de ligne en première colonne (1-100)
  - [x] 5.3 Initialise le gridStore au montage (26 colonnes × 100 lignes)
  - [x] 5.4 Créer `src/components/Grid/SpreadsheetGrid.test.tsx` — tests : rendu grille, présence en-têtes A-Z, présence numéros de ligne
- [x] Task 6: Mettre à jour `index.ts` du module Grid (AC: #1)
  - [x] 6.1 Modifier `src/components/Grid/index.ts` pour re-exporter SpreadsheetGrid, Cell, GridHeader
- [x] Task 7: Intégrer dans `App.tsx` (AC: #1)
  - [x] 7.1 Importer et afficher `<SpreadsheetGrid />` dans App.tsx
  - [x] 7.2 Supprimer le placeholder "Cellium"
- [x] Task 8: Validation finale (AC: #1-3)
  - [x] 8.1 `npm run build` compile sans erreur
  - [x] 8.2 Tous les tests passent (`npx vitest run`)
  - [x] 8.3 Vérification manuelle : grille visible, double-clic → édition, Enter/blur → sauvegarde

## Dev Notes

### Architecture Compliance

**Source : [architecture.md](../../_bmad-output/planning-artifacts/architecture.md)**

Cette story crée les premiers composants visuels et le premier Zustand store. Respecter exactement les conventions de nommage, structure de fichiers et patterns définis dans l'architecture.

### gridStore — Définition Exacte

**Fichier `src/stores/gridStore.ts` :**

```typescript
import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import type { Cell, Grid } from '../types/cell'

interface GridState {
  cells: Grid;
  rowCount: number;
  colCount: number;
  editingCell: string | null;    // cellId en cours d'édition (story 1.2)
  selectedCell: string | null;   // cellId sélectionnée (préparé pour story 1.3)
}

interface GridActions {
  initializeGrid: (rows: number, cols: number) => void;
  setCell: (id: string, value: string | number | null) => void;
  startEditing: (id: string) => void;
  stopEditing: () => void;
  selectCell: (id: string | null) => void;  // Préparé pour story 1.3
}

export const useGridStore = create<GridState & GridActions>()(
  immer((set) => ({
    // State
    cells: {},
    rowCount: 100,
    colCount: 26,
    editingCell: null,
    selectedCell: null,

    // Actions
    initializeGrid: (rows, cols) => set((state) => {
      state.cells = {};
      state.rowCount = rows;
      state.colCount = cols;
      // Pas de pré-remplissage — les cellules sont créées à la demande
    }),

    setCell: (id, value) => set((state) => {
      if (value === null || value === '') {
        delete state.cells[id];
      } else {
        state.cells[id] = { id, value: value === '' ? null : value };
      }
    }),

    startEditing: (id) => set((state) => {
      state.editingCell = id;
    }),

    stopEditing: () => set((state) => {
      state.editingCell = null;
    }),

    selectCell: (id) => set((state) => {
      state.selectedCell = id;
    }),
  }))
)
```

**Points critiques :**
- Zustand v5 : `create<T>()(...)` — double parenthèses obligatoires
- `immer` import depuis `zustand/middleware/immer` (PAS `zustand/middleware`)
- Actions synchrones uniquement dans le store
- Cellules créées à la demande (pas de Grid pré-remplie de 2600 cellules vides)
- Cellule vide = absente du Record (supprimée si valeur null/vide)

### cellUtils — Fonctions Utilitaires

**Fichier `src/utils/cellUtils.ts` :**

```typescript
// 0 → 'A', 25 → 'Z'
export function columnIndexToLetter(index: number): string {
  return String.fromCharCode(65 + index);
}

// 'A' → 0, 'Z' → 25
export function letterToColumnIndex(letter: string): number {
  return letter.charCodeAt(0) - 65;
}

// 'A1' → { row: 1, col: 0 }
export function cellIdToCoords(id: string): { row: number; col: number } {
  const letter = id.charAt(0);
  const row = parseInt(id.slice(1), 10);
  return { row, col: letterToColumnIndex(letter) };
}

// (1, 0) → 'A1'
export function coordsToCellId(row: number, col: number): string {
  return `${columnIndexToLetter(col)}${row}`;
}
```

### Cell Component — Comportement

**Fichier `src/components/Grid/Cell.tsx` :**

- Props : `cellId: string` (ex: "A1")
- Lit `cells[cellId]` et `editingCell` depuis `useGridStore`
- **Mode affichage** : `<div>` affichant `cell?.value ?? ''` — double-clic → `startEditing(cellId)`
- **Mode édition** : `<input>` avec la valeur courante
  - Enter → parse la valeur (nombre si possible, sinon string) → `setCell(cellId, value)` → `stopEditing()`
  - Blur → même logique que Enter
  - Escape → `stopEditing()` sans sauvegarder (bonus, pas dans AC mais bonne UX)
- **Parse valeur** : si la saisie est un nombre valide (`!isNaN` et non vide), stocker comme `number`, sinon comme `string`
- Utiliser des sélecteurs Zustand atomiques pour éviter re-renders inutiles :
  ```typescript
  const cellValue = useGridStore((s) => s.cells[cellId]?.value ?? null);
  const isEditing = useGridStore((s) => s.editingCell === cellId);
  ```

### SpreadsheetGrid Component

**Fichier `src/components/Grid/SpreadsheetGrid.tsx` :**

- Appelle `initializeGrid(100, 26)` au montage via `useEffect`
- Rendu : `<div>` conteneur avec overflow scroll
  - `<GridHeader />` — en-têtes A à Z
  - 100 lignes, chacune avec numéro de ligne + 26 `<Cell cellId={coordsToCellId(row, col)} />`
- Structure HTML : `<table>` avec `<thead>` (GridHeader) et `<tbody>` (lignes)
- **PAS de virtualisation** dans cette story (story 1.5)
- Styling Tailwind : `border-collapse`, bordures fines grises, cellules de taille fixe

### GridHeader Component

**Fichier `src/components/Grid/GridHeader.tsx` :**

- Rend une ligne `<tr>` dans `<thead>` avec :
  - Cellule vide en première position (angle supérieur gauche, correspond à la colonne des numéros de ligne)
  - 26 cellules A à Z avec `columnIndexToLetter(i)`
- Styling : fond gris clair, texte centré, bordures

### Styling Tailwind — Conventions

- Cellules : `min-w-[100px] h-8 border border-gray-200 px-1`
- Headers : `bg-gray-100 font-medium text-center text-sm`
- Input édition : `w-full h-full border-2 border-blue-500 outline-none px-1`
- Numéros de ligne : `bg-gray-50 text-center text-gray-500 text-sm w-10`
- Conteneur grille : `overflow-auto max-h-[calc(100vh-80px)]`

### Test Strategy

Tests unitaires avec Vitest. Les tests de composants utilisent `@testing-library/react` avec `jsdom`.

**Annotation obligatoire en haut de chaque fichier test de composant :**
```typescript
// @vitest-environment jsdom
```

Ceci est nécessaire car l'environnement par défaut est `node` (résolution du bug jsdom + Node 22.7 de story 1.1).

**Tests gridStore :** Pas besoin de jsdom — tests purs sur le store Zustand.

**Tests composants (Cell, SpreadsheetGrid) :**
- Utiliser `render` et `screen` de `@testing-library/react`
- `fireEvent.doubleClick` pour déclencher l'édition
- `fireEvent.change` pour saisir du texte
- `fireEvent.keyDown` avec `{ key: 'Enter' }` pour valider
- `fireEvent.blur` pour clic ailleurs

### Previous Story Intelligence (Story 1.1)

**Learnings critiques :**
1. **Vitest + jsdom** : Ne PAS mettre `environment: 'jsdom'` en global dans vite.config.ts. Utiliser `// @vitest-environment jsdom` par fichier test.
2. **macOS `._` files** : Déjà exclu dans vitest (`**/._*`), pas besoin d'action.
3. **Vite 7.3.1** : Fonctionne sur Node 22.7 avec des warnings — ignorer.
4. **Tailwind v4** : Utilise le plugin Vite, `@import "tailwindcss"` dans index.css. Pas de tailwind.config.js.
5. **Types existants** : `Cell`, `CellFormat`, `Grid`, `Operation` (8 types), `GridMetadata`, `CommandRequest`, `CommandResponse`, `ClarificationResponse`, `ErrorResponse` — tous dans `src/types/`.
6. **Structure existante** : `components/Grid/index.ts`, `stores/.gitkeep`, `utils/.gitkeep` — remplacer .gitkeep par vrais fichiers.

**Fichiers existants à NE PAS modifier** (sauf App.tsx et Grid/index.ts) :
- `vite.config.ts` — déjà configuré
- `src/types/*` — types définis en story 1.1
- `src/index.css` — Tailwind configuré
- `src/main.tsx` — entry point OK
- `backend/*` — non concerné par cette story

### Zustand v5 — Patterns Obligatoires

```typescript
// Import nommé (PAS de default import)
import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'

// Double parenthèses pour le typage
const useStore = create<State & Actions>()(immer((set) => ({ ... })))

// Sélecteurs atomiques (PAS de destructuration d'objet sans useShallow)
const value = useStore((s) => s.cells[cellId]?.value);  // OK
// const { cells, editingCell } = useStore((s) => ({ ... }))  // INTERDIT sans useShallow
```

### Scope — Ce qui est HORS de cette story

- **Sélection de cellules** (surbrillance au clic) → Story 1.3
- **Navigation clavier** (flèches, Tab) → Story 1.3
- **Ajout/suppression lignes/colonnes** → Story 1.4
- **Virtualisation react-window** → Story 1.5
- **Persistence IndexedDB** → Story 1.6
- **`applyOperations()`** → Story 2.3 (moteur d'opérations)

Ne pas implémenter ces fonctionnalités. Le gridStore expose `selectedCell` et `selectCell` comme stubs pour story 1.3 mais sans comportement UI.

### Project Structure Notes

Fichiers créés/modifiés par cette story :
```
frontend/src/
├── utils/
│   ├── cellUtils.ts              (new)
│   └── cellUtils.test.ts         (new)
├── stores/
│   ├── gridStore.ts              (new)
│   └── gridStore.test.ts         (new)
├── components/Grid/
│   ├── Cell.tsx                   (new)
│   ├── Cell.test.tsx              (new)
│   ├── GridHeader.tsx             (new)
│   ├── SpreadsheetGrid.tsx        (new)
│   ├── SpreadsheetGrid.test.tsx   (new)
│   └── index.ts                   (modified)
├── App.tsx                        (modified)
```

Supprimer `stores/.gitkeep` et `utils/.gitkeep` après création des vrais fichiers.

### References

- [Source: architecture.md#Core Architectural Decisions] — Data model Cell/Grid, Zustand stores
- [Source: architecture.md#Implementation Patterns] — Naming conventions, store patterns, error handling
- [Source: architecture.md#Project Structure & Boundaries] — Component hierarchy, file organization
- [Source: architecture.md#Frontend Architecture] — 4 stores, component hierarchy diagram
- [Source: epics.md#Story 1.2] — User story et acceptance criteria (FR1, FR2, FR22, FR23)
- [Source: 1-1-scaffold-projet-types-fondamentaux.md#Dev Agent Record] — Learnings jsdom, vitest, Tailwind v4

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

- jsdom ESM incompatibility persists on Node 22.7 — switched to `happy-dom` for component tests (lighter, no @csstools/css-calc dependency)
- SpreadsheetGrid test: `initializeGrid` in useEffect clears cells set before render — fixed by setting cells after initial render + using `rerender`
- SpreadsheetGrid test: wrapped external store update in `act()` to avoid React warning

### Completion Notes List

- cellUtils.ts: 4 pure functions for cellId <-> coords conversion (13 tests)
- gridStore.ts: Zustand v5 + Immer store with cells, editingCell, selectedCell, initializeGrid, setCell, startEditing, stopEditing, selectCell (15 tests)
- Cell.tsx: display/edit modes — double-click to edit, Enter/blur to save, Escape to cancel, auto-parses numbers (9 tests)
- GridHeader.tsx: A-Z column headers with sticky positioning
- SpreadsheetGrid.tsx: table-based grid 26 cols x 100 rows with GridHeader + row numbers + Cell components (5 tests)
- Grid/index.ts: re-exports SpreadsheetGrid, Cell, GridHeader
- App.tsx: integrated SpreadsheetGrid with Cellium header
- happy-dom added as dev dependency (replaces jsdom for component tests)
- .gitkeep files removed from stores/ and utils/ (replaced by real files)
- Build passes, 58/58 tests pass (42 new + 16 from story 1.1), 0 regressions

### File List

- frontend/src/utils/cellUtils.ts (new)
- frontend/src/utils/cellUtils.test.ts (new)
- frontend/src/stores/gridStore.ts (new)
- frontend/src/stores/gridStore.test.ts (new)
- frontend/src/components/Grid/Cell.tsx (new)
- frontend/src/components/Grid/Cell.test.tsx (new)
- frontend/src/components/Grid/GridHeader.tsx (new)
- frontend/src/components/Grid/SpreadsheetGrid.tsx (new)
- frontend/src/components/Grid/SpreadsheetGrid.test.tsx (new)
- frontend/src/components/Grid/index.ts (modified)
- frontend/src/App.tsx (modified)
- frontend/src/stores/.gitkeep (deleted)
- frontend/src/utils/.gitkeep (deleted)
- frontend/package.json (modified — added happy-dom)

