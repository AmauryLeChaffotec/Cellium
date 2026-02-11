# Story 1.4: Ajout et Suppression Manuels de Lignes et Colonnes

Status: review

## Story

As a utilisateur,
I want ajouter et supprimer des lignes et colonnes manuellement,
so that je peux structurer mon tableau librement.

## Acceptance Criteria

1. **Given** la grille est affichée **When** l'utilisateur effectue une action "ajouter ligne" (clic droit) **Then** une nouvelle ligne vide est insérée après la ligne sélectionnée (FR4) **And** le gridStore est mis à jour
2. **Given** une ligne existe **When** l'utilisateur effectue une action "supprimer ligne" **Then** la ligne est retirée de la grille (FR4) **And** les lignes suivantes se réindexent
3. **Given** la grille est affichée **When** l'utilisateur effectue une action "ajouter colonne" **Then** une nouvelle colonne vide est insérée après la colonne sélectionnée (FR5)
4. **Given** une colonne existe **When** l'utilisateur effectue une action "supprimer colonne" **Then** la colonne et toutes ses cellules sont retirées (FR5)

## Tasks / Subtasks

- [x] Task 1: Ajouter les actions gridStore pour lignes (AC: #1, #2)
  - [x] 1.1 Ajouter `insertRow(afterRow: number)` — insère une ligne vide après `afterRow`, décale toutes les cellules des lignes > afterRow
  - [x] 1.2 Ajouter `deleteRow(row: number)` — supprime la ligne et décale les lignes > row vers le haut
  - [x] 1.3 Mettre à jour `gridStore.test.ts` avec tests pour insertRow et deleteRow (y compris edge cases)
- [x] Task 2: Ajouter les actions gridStore pour colonnes (AC: #3, #4)
  - [x] 2.1 Ajouter `insertColumn(afterCol: number)` — insère une colonne vide, décale les colonnes > afterCol. No-op si colCount >= 26
  - [x] 2.2 Ajouter `deleteColumn(col: number)` — supprime la colonne et décale les colonnes > col vers la gauche. No-op si colCount <= 1
  - [x] 2.3 Mettre à jour `gridStore.test.ts` avec tests pour insertColumn et deleteColumn
- [x] Task 3: Créer le composant ContextMenu (AC: #1-4)
  - [x] 3.1 Créer `src/components/Grid/ContextMenu.tsx` — menu générique positionné en absolu
  - [x] 3.2 Se ferme sur clic extérieur ou touche Escape
  - [x] 3.3 Créer `ContextMenu.test.tsx` — tests affichage, fermeture, click action
- [x] Task 4: Intégrer le menu contextuel dans SpreadsheetGrid (AC: #1-4)
  - [x] 4.1 Ajouter `data-row-header` sur les `<td>` de numéro de ligne
  - [x] 4.2 Ajouter `data-col-header` sur les `<th>` de lettre de colonne
  - [x] 4.3 Gérer `onContextMenu` sur le conteneur grille — identifier la cible (cellule, header ligne, header colonne)
  - [x] 4.4 Afficher le ContextMenu avec les items appropriés selon le contexte
  - [x] 4.5 Déclencher les actions gridStore correspondantes
- [x] Task 5: Mettre à jour les tests d'intégration (AC: #1-4)
  - [x] 5.1 Mettre à jour `SpreadsheetGrid.test.tsx` avec tests clic droit → menu → action
  - [x] 5.2 S'assurer que les tests existants passent toujours
- [x] Task 6: Validation finale (AC: #1-4)
  - [x] 6.1 `npm run build` compile sans erreur
  - [x] 6.2 Tous les tests passent (`npx vitest run`)
  - [x] 6.3 Vérification : clic droit → menu contextuel → insertion/suppression fonctionne

## Dev Notes

### Architecture Compliance

**Source : [architecture.md](../../_bmad-output/planning-artifacts/architecture.md)**

Cette story ajoute les actions `insertRow`, `deleteRow`, `insertColumn`, `deleteColumn` au `gridStore` existant et crée un composant `ContextMenu` dans le dossier `Grid/`. Le pattern reste cohérent avec la hiérarchie de composants définie dans l'architecture.

### Existing Code — Éléments à Modifier

**`gridStore.ts` — Ajouter 4 nouvelles actions :**
- `insertRow: (afterRow: number) => void`
- `deleteRow: (row: number) => void`
- `insertColumn: (afterCol: number) => void`
- `deleteColumn: (col: number) => void`

**`SpreadsheetGrid.tsx` — Modifications :**
- Ajouter état local `contextMenu` (position + contexte)
- Gérer `onContextMenu` pour identifier la cible cliquée
- Rendre le composant `ContextMenu` conditionnellement
- Ajouter `data-row-header` sur les `<td>` de numéros de ligne
- Ajouter `data-col-header` sur les `<th>` d'en-têtes de colonnes (dans GridHeader)

**`GridHeader.tsx` — Modification mineure :**
- Ajouter `data-col-header={i}` sur chaque `<th>` d'en-tête de colonne

**`Grid/index.ts` — Ajouter re-export :**
- Exporter `ContextMenu`

### gridStore — Logique de Ré-indexation des Cellules

Le cœur de cette story est la ré-indexation des cellules lors de l'insertion/suppression. Les cellules sont stockées dans un `Record<string, Cell>` avec des clés comme "A1", "B3". Insérer/supprimer une ligne ou colonne nécessite de recalculer tous les IDs des cellules affectées.

**Pattern Immer — Remplacement complet de `state.cells` :**

Avec Immer, on peut remplacer `state.cells` par un nouvel objet. C'est plus simple et plus sûr que de modifier les clés in-place.

#### `insertRow(afterRow: number)`

```typescript
insertRow: (afterRow: number) =>
  set((state) => {
    const newCells: Record<string, { id: string; value: string | number | null }> = {};
    for (const [id, cell] of Object.entries(state.cells)) {
      const { row, col } = cellIdToCoords(id);
      if (row > afterRow) {
        const newId = coordsToCellId(row + 1, col);
        newCells[newId] = { ...cell, id: newId };
      } else {
        newCells[id] = { ...cell };
      }
    }
    state.cells = newCells as Grid;
    state.rowCount += 1;

    // Mettre à jour selectedCell si affectée
    if (state.selectedCell) {
      const { row, col } = cellIdToCoords(state.selectedCell);
      if (row > afterRow) {
        state.selectedCell = coordsToCellId(row + 1, col);
      }
    }
    // Annuler editing si affecté
    if (state.editingCell) {
      const { row, col } = cellIdToCoords(state.editingCell);
      if (row > afterRow) {
        state.editingCell = coordsToCellId(row + 1, col);
      }
    }
  }),
```

#### `deleteRow(row: number)`

```typescript
deleteRow: (targetRow: number) =>
  set((state) => {
    if (state.rowCount <= 1) return; // Ne pas supprimer la dernière ligne

    const newCells: Record<string, { id: string; value: string | number | null }> = {};
    for (const [id, cell] of Object.entries(state.cells)) {
      const { row, col } = cellIdToCoords(id);
      if (row === targetRow) continue; // Supprimer les cellules de cette ligne
      if (row > targetRow) {
        const newId = coordsToCellId(row - 1, col);
        newCells[newId] = { ...cell, id: newId };
      } else {
        newCells[id] = { ...cell };
      }
    }
    state.cells = newCells as Grid;
    state.rowCount -= 1;

    // Mettre à jour selectedCell
    if (state.selectedCell) {
      const { row, col } = cellIdToCoords(state.selectedCell);
      if (row === targetRow) {
        state.selectedCell = null;
      } else if (row > targetRow) {
        state.selectedCell = coordsToCellId(row - 1, col);
      }
    }
    // Annuler editing si la cellule est dans la ligne supprimée
    if (state.editingCell) {
      const { row, col } = cellIdToCoords(state.editingCell);
      if (row === targetRow) {
        state.editingCell = null;
      } else if (row > targetRow) {
        state.editingCell = coordsToCellId(row - 1, col);
      }
    }
  }),
```

#### `insertColumn(afterCol: number)`

```typescript
insertColumn: (afterCol: number) =>
  set((state) => {
    if (state.colCount >= 26) return; // Max 26 colonnes (A-Z, single letter)

    const newCells: Record<string, { id: string; value: string | number | null }> = {};
    for (const [id, cell] of Object.entries(state.cells)) {
      const { row, col } = cellIdToCoords(id);
      if (col > afterCol) {
        const newId = coordsToCellId(row, col + 1);
        newCells[newId] = { ...cell, id: newId };
      } else {
        newCells[id] = { ...cell };
      }
    }
    state.cells = newCells as Grid;
    state.colCount += 1;

    if (state.selectedCell) {
      const { row, col } = cellIdToCoords(state.selectedCell);
      if (col > afterCol) {
        state.selectedCell = coordsToCellId(row, col + 1);
      }
    }
    if (state.editingCell) {
      const { row, col } = cellIdToCoords(state.editingCell);
      if (col > afterCol) {
        state.editingCell = coordsToCellId(row, col + 1);
      }
    }
  }),
```

#### `deleteColumn(col: number)`

```typescript
deleteColumn: (targetCol: number) =>
  set((state) => {
    if (state.colCount <= 1) return; // Ne pas supprimer la dernière colonne

    const newCells: Record<string, { id: string; value: string | number | null }> = {};
    for (const [id, cell] of Object.entries(state.cells)) {
      const { row, col } = cellIdToCoords(id);
      if (col === targetCol) continue;
      if (col > targetCol) {
        const newId = coordsToCellId(row, col - 1);
        newCells[newId] = { ...cell, id: newId };
      } else {
        newCells[id] = { ...cell };
      }
    }
    state.cells = newCells as Grid;
    state.colCount -= 1;

    if (state.selectedCell) {
      const { row, col } = cellIdToCoords(state.selectedCell);
      if (col === targetCol) {
        state.selectedCell = null;
      } else if (col > targetCol) {
        state.selectedCell = coordsToCellId(row, col - 1);
      }
    }
    if (state.editingCell) {
      const { row, col } = cellIdToCoords(state.editingCell);
      if (col === targetCol) {
        state.editingCell = null;
      } else if (col > targetCol) {
        state.editingCell = coordsToCellId(row, col - 1);
      }
    }
  }),
```

### ContextMenu — Spécification Complète

**Fichier `src/components/Grid/ContextMenu.tsx` :**

```typescript
interface ContextMenuItem {
  label: string;
  action: () => void;
  separator?: boolean; // Afficher un séparateur avant cet item
}

interface ContextMenuProps {
  x: number;
  y: number;
  items: ContextMenuItem[];
  onClose: () => void;
}
```

**Comportement :**
- Rendu en `position: fixed` à `(x, y)` (coordonnées viewport)
- Fond blanc, ombre portée, bord arrondi
- Chaque item est un `<button>` cliquable
- Séparateur optionnel (`<hr>`) entre groupes
- Se ferme : clic sur un item (après exécution de l'action), clic extérieur, touche Escape
- `useEffect` avec `mousedown` listener sur `document` pour détecter clic extérieur
- `useEffect` avec `keydown` listener pour Escape

**Styling Tailwind :**
```
bg-white shadow-lg rounded-md border border-gray-200 py-1 z-50 min-w-[200px]
```

Item :
```
w-full text-left px-3 py-1.5 text-sm hover:bg-blue-50 cursor-pointer
```

Séparateur :
```
border-t border-gray-200 my-1
```

### Intégration SpreadsheetGrid — Menu Contextuel

**État local dans SpreadsheetGrid :**

```typescript
interface ContextMenuState {
  x: number;
  y: number;
  targetRow: number | null;
  targetCol: number | null;
}

const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
```

**Handler `onContextMenu` sur le div conteneur :**

```typescript
const handleContextMenu = (e: React.MouseEvent) => {
  e.preventDefault();

  const target = e.target as HTMLElement;

  // Identifier la cible via data attributes
  const rowHeader = target.closest<HTMLElement>('[data-row-header]');
  const colHeader = target.closest<HTMLElement>('[data-col-header]');
  const cellEl = target.closest<HTMLElement>('[data-testid^="cell-"]');

  let targetRow: number | null = null;
  let targetCol: number | null = null;

  if (rowHeader) {
    targetRow = Number(rowHeader.dataset.rowHeader);
  } else if (colHeader) {
    targetCol = Number(colHeader.dataset.colHeader);
  } else if (cellEl) {
    const testId = cellEl.dataset.testid!;
    const cellId = testId.replace('cell-', '').replace('cell-input-', '');
    const coords = cellIdToCoords(cellId);
    targetRow = coords.row;
    targetCol = coords.col;
  } else {
    return; // Clic hors zone pertinente
  }

  setContextMenu({ x: e.clientX, y: e.clientY, targetRow, targetCol });
};
```

**Construction des items du menu :**

```typescript
function buildMenuItems(targetRow: number | null, targetCol: number | null): ContextMenuItem[] {
  const items: ContextMenuItem[] = [];

  if (targetRow !== null) {
    items.push(
      { label: 'Insérer une ligne au-dessus', action: () => insertRow(targetRow - 1) },
      { label: 'Insérer une ligne en-dessous', action: () => insertRow(targetRow) },
      { label: 'Supprimer la ligne', action: () => deleteRow(targetRow) },
    );
  }

  if (targetCol !== null) {
    if (items.length > 0) {
      items.push({ label: '', action: () => {}, separator: true });
    }
    items.push(
      { label: 'Insérer une colonne à gauche', action: () => insertColumn(targetCol - 1) },
      { label: 'Insérer une colonne à droite', action: () => insertColumn(targetCol) },
      { label: 'Supprimer la colonne', action: () => deleteColumn(targetCol) },
    );
  }

  return items;
}
```

**Note sur `insertRow(afterRow)` :**
- "Insérer au-dessus de la ligne 3" = `insertRow(2)` (afterRow = row - 1, la nouvelle ligne prend la position 3)
- "Insérer en-dessous de la ligne 3" = `insertRow(3)` (afterRow = row, la nouvelle ligne prend la position 4)

**Note sur `insertColumn(afterCol)` :**
- "Insérer à gauche de la colonne B (index 1)" = `insertColumn(0)` (afterCol = col - 1)
- "Insérer à droite de la colonne B (index 1)" = `insertColumn(1)` (afterCol = col)

### GridHeader.tsx — Modification

Ajouter `data-col-header={i}` sur chaque `<th>` :

```tsx
<th
  key={i}
  data-col-header={i}
  className="bg-gray-100 font-medium text-center text-sm border border-gray-200 min-w-[100px] h-8 sticky top-0 z-10"
>
  {columnIndexToLetter(i)}
</th>
```

### SpreadsheetGrid.tsx — Modification Row Headers

Ajouter `data-row-header={row}` sur les `<td>` de numéros de ligne :

```tsx
<td
  data-row-header={row}
  className="bg-gray-50 text-center text-gray-500 text-sm w-10 border border-gray-200 sticky left-0"
>
  {row}
</td>
```

### Contraintes et Edge Cases

**Limites :**
- **Max 26 colonnes** — `insertColumn` est un no-op si `colCount >= 26` (limitation single-letter A-Z)
- **Min 1 ligne** — `deleteRow` est un no-op si `rowCount <= 1`
- **Min 1 colonne** — `deleteColumn` est un no-op si `colCount <= 1`

**Edge cases à tester :**
1. Insertion ligne quand des cellules existent dans les lignes suivantes → les cellules sont correctement décalées
2. Suppression ligne avec des cellules → les cellules sont supprimées ET les suivantes décalées
3. Insertion colonne quand colCount = 26 → no-op
4. Suppression colonne avec des cellules → cellules supprimées + décalage
5. Suppression ligne/colonne contenant la cellule sélectionnée → selectedCell = null
6. Suppression ligne/colonne contenant la cellule en édition → editingCell = null
7. Insertion ligne quand selectedCell est dans une ligne après → selectedCell décalée

### Test Strategy

**happy-dom** pour tous les tests de composants (annotation `// @vitest-environment happy-dom`).

**Tests gridStore (pur — pas besoin de happy-dom) :**
- `insertRow` : insère une ligne, décale les cellules, met à jour rowCount et selectedCell
- `deleteRow` : supprime la ligne, décale les cellules, met à jour rowCount
- `insertColumn` : insère une colonne, décale les cellules, met à jour colCount
- `deleteColumn` : supprime la colonne, décale les cellules, met à jour colCount
- Edge cases : min/max limites, selectedCell/editingCell affectés

**Tests ContextMenu :**
- Affichage correct des items
- Clic sur un item exécute l'action + ferme le menu
- Clic extérieur ferme le menu
- Touche Escape ferme le menu

**Tests SpreadsheetGrid (intégration) :**
- Clic droit sur cellule → menu contextuel affiché
- Menu contient les items row + column
- Clic sur "Insérer une ligne en-dessous" → rowCount augmente
- Clic droit sur header colonne → menu colonne affiché

### Previous Story Intelligence (Stories 1.1 + 1.2 + 1.3)

**Learnings critiques :**
1. **happy-dom** : Utiliser `// @vitest-environment happy-dom` (PAS jsdom — ESM incompatible avec Node 22.7)
2. **Zustand v5 sélecteurs** : Toujours atomiques `(s) => s.prop` — pas de destructuration d'objet
3. **act() wrapper** : Wrapper les dispatches d'événements et mises à jour du store dans `act()` dans les tests
4. **rerender pattern** : Utiliser `const { rerender } = render(...)` + `rerender(...)` pour forcer le re-rendu après changement de store
5. **data-testid pattern** : `cell-{cellId}` pour display mode, `cell-input-{cellId}` pour edit mode
6. **cellUtils** : `cellIdToCoords`, `coordsToCellId`, `columnIndexToLetter`, `letterToColumnIndex` — utilitaires disponibles
7. **Immer state replacement** : On peut remplacer `state.cells = newCells` dans un callback Immer — pas besoin de muter chaque clé individuellement
8. **gridStore.test.ts** : Tests purs sans happy-dom, utilisent `useGridStore.setState()` et `useGridStore.getState()`

### Scope — Ce qui est HORS de cette story

- **Multi-letter columns (AA, AB, etc.)** → Post-MVP, si besoin de > 26 colonnes
- **Undo/Redo** → Post-MVP
- **Sélection multiple / opérations sur plages** → Post-MVP
- **Toolbar buttons pour insert/delete** → Pourraient être ajoutés plus tard, le clic droit suffit pour cette story
- **Virtualisation react-window** → Story 1.5
- **Persistence IndexedDB** → Story 1.6

### Project Structure Notes

Fichiers créés/modifiés par cette story :
```
frontend/src/
├── stores/
│   ├── gridStore.ts                (modified — +4 actions)
│   └── gridStore.test.ts           (modified — +tests insert/delete)
├── components/Grid/
│   ├── ContextMenu.tsx             (new)
│   ├── ContextMenu.test.tsx        (new)
│   ├── GridHeader.tsx              (modified — data-col-header)
│   ├── SpreadsheetGrid.tsx         (modified — contextMenu state, onContextMenu handler)
│   ├── SpreadsheetGrid.test.tsx    (modified — tests context menu)
│   └── index.ts                    (modified — export ContextMenu)
```

### References

- [Source: architecture.md#Frontend Architecture] — Component hierarchy, gridStore actions
- [Source: architecture.md#Data Architecture] — Cell model, Grid Record
- [Source: architecture.md#Implementation Patterns] — Naming conventions, Zustand + Immer pattern
- [Source: epics.md#Story 1.4] — User story, acceptance criteria (FR4, FR5)
- [Source: 1-3-selection-cellules-navigation-clavier.md#Dev Agent Record] — Learnings act(), happy-dom, Immer patterns

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

- No issues encountered — all tests passed on first run

### Completion Notes List

- gridStore.ts: Added 4 actions (insertRow, deleteRow, insertColumn, deleteColumn) with full cell re-indexing via Immer state.cells replacement
- gridStore.ts: All 4 actions update selectedCell and editingCell when affected by the operation
- gridStore.ts: Edge case guards — deleteRow no-op if rowCount <= 1, deleteColumn no-op if colCount <= 1, insertColumn no-op if colCount >= 26
- ContextMenu.tsx: Generic reusable component — fixed positioning, separator support, close on outside click or Escape
- SpreadsheetGrid.tsx: Context menu integration via onContextMenu handler — identifies target via data attributes (data-row-header, data-col-header, data-testid)
- SpreadsheetGrid.tsx: Menu items adapt to context — row-only for row headers, col-only for column headers, both for cells
- GridHeader.tsx: Added data-col-header={i} attribute on column header <th> elements
- 125/125 tests pass, build compiles without errors
- 42 new tests added (28 gridStore insert/delete, 6 ContextMenu, 8 SpreadsheetGrid integration)

### File List

- `frontend/src/stores/gridStore.ts` (modified — +4 actions, +import cellUtils)
- `frontend/src/stores/gridStore.test.ts` (modified — +28 tests)
- `frontend/src/components/Grid/ContextMenu.tsx` (new)
- `frontend/src/components/Grid/ContextMenu.test.tsx` (new)
- `frontend/src/components/Grid/GridHeader.tsx` (modified — data-col-header)
- `frontend/src/components/Grid/SpreadsheetGrid.tsx` (modified — context menu integration)
- `frontend/src/components/Grid/SpreadsheetGrid.test.tsx` (modified — +8 tests)
- `frontend/src/components/Grid/index.ts` (modified — export ContextMenu)

