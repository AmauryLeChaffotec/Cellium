# Story 1.5: Virtualisation et Capacité 1000 Lignes

Status: review

## Story

As a utilisateur,
I want un tableau qui reste fluide même avec 1000 lignes de données,
so that je peux travailler sur de grands jeux de données sans ralentissement.

## Acceptance Criteria

1. **Given** la grille contient 1000 lignes et 26 colonnes **When** l'utilisateur scrolle verticalement **Then** le scroll est fluide à 60fps grâce à react-window (NFR2, FR25) **And** seules les lignes visibles sont rendues dans le DOM
2. **Given** la grille contient 1000 lignes **When** la grille se charge **Then** le rendu initial prend < 500ms (NFR2)

## Tasks / Subtasks

- [x] Task 1: Refactorer Cell.tsx — `<td>` → `<div>` (AC: #1)
  - [x] 1.1 Modifier `Cell.tsx` : remplacer les `<td>` par des `<div>` (mode affichage + mode édition)
  - [x] 1.2 Adapter les styles Tailwind (remplacer `min-w-[100px] h-8` par `w-full h-full`, ajouter `leading-8`)
  - [x] 1.3 Mettre à jour `Cell.test.tsx` : retirer les wrappers `<table><tbody><tr>` devenus inutiles
- [x] Task 2: Refactorer GridHeader.tsx — `<thead>/<th>` → `<div>` (AC: #1)
  - [x] 2.1 Remplacer la structure `<thead>/<tr>/<th>` par un layout `<div>` flex
  - [x] 2.2 Conserver `data-col-header={i}` sur chaque en-tête de colonne
- [x] Task 3: Créer le composant VirtualCell (AC: #1)
  - [x] 3.1 Créer `src/components/Grid/VirtualCell.tsx` — cellComponent pour react-window Grid
  - [x] 3.2 Mapper `rowIndex`/`columnIndex` → `cellId`, rendre `<Cell>` à l'intérieur
  - [x] 3.3 Appliquer le `style` de react-window pour le positionnement absolu
- [x] Task 4: Refactorer SpreadsheetGrid.tsx avec react-window Grid (AC: #1, #2)
  - [x] 4.1 Remplacer la structure `<table>/<tbody>/<tr>` par un layout CSS Grid avec 4 zones
  - [x] 4.2 Intégrer `Grid` de react-window pour la zone des cellules
  - [x] 4.3 Synchroniser le scroll horizontal → en-têtes de colonnes
  - [x] 4.4 Synchroniser le scroll vertical → numéros de lignes
  - [x] 4.5 Conserver le menu contextuel, la navigation clavier, `data-grid-container`
  - [x] 4.6 Passer `initializeGrid(1000, 26)` au lieu de `(100, 26)`
- [x] Task 5: Ajouter auto-scroll sur changement de sélection (AC: #1)
  - [x] 5.1 Appeler `gridRef.scrollToCell()` quand `selectedCell` change pour garantir sa visibilité
- [x] Task 6: Mettre à jour les tests (AC: #1, #2)
  - [x] 6.1 Mocker `ResizeObserver` pour happy-dom (react-window v2 l'utilise)
  - [x] 6.2 Mettre à jour `Cell.test.tsx` — retirer wrappers table
  - [x] 6.3 Mettre à jour `SpreadsheetGrid.test.tsx` — adapter au layout virtualisé
  - [x] 6.4 S'assurer que les tests existants (gridStore, useKeyboardNav, ContextMenu) passent toujours
- [x] Task 7: Validation finale (AC: #1, #2)
  - [x] 7.1 `npm run build` compile sans erreur
  - [x] 7.2 Tous les tests passent (`npx vitest run`)
  - [x] 7.3 Vérification : 1000 lignes, scroll fluide, seules les lignes visibles dans le DOM

## Dev Notes

### Architecture Compliance

**Source : [architecture.md](../../_bmad-output/planning-artifacts/architecture.md)**

Cette story implémente la virtualisation prévue dans l'architecture (`VirtualizedRows` → react-window). Le composant `VirtualCell` remplace le rendu direct des cellules par un rendu virtualisé. Le layout passe de `<table>` à `<div>` (CSS Grid + react-window Grid).

### react-window v2 — API Clé

**Version installée : `react-window@2.2.6`** (compatible React 19)

**Changements majeurs v1 → v2 :**
- `FixedSizeGrid` → `Grid` (passer `number` pour `rowHeight`/`columnWidth`)
- `children` (render function) → `cellComponent` (named component prop)
- `itemData` → `cellProps` (props additionnelles passées à chaque cellule)
- `width`/`height` → `style={{ width, height }}` (auto-dimensionnement via ResizeObserver)
- `ref` → `gridRef` (API impérative dédiée)

**API `Grid` utilisée :**

```typescript
import { Grid, useGridRef } from 'react-window';

<Grid
  gridRef={rwGridRef}
  cellComponent={VirtualCell}         // Composant qui rend chaque cellule
  cellProps={{ colCount }}            // Props additionnelles passées à VirtualCell
  columnCount={colCount}
  columnWidth={100}                   // Largeur fixe 100px par colonne
  rowCount={rowCount}
  rowHeight={32}                      // Hauteur fixe 32px par ligne
  overscanCount={5}                   // 5 lignes de marge hors écran
  style={{ height: '100%', width: '100%' }}
/>
```

**`cellComponent` reçoit :**
```typescript
{
  ariaAttributes: { "aria-colindex": number; role: "gridcell" };
  columnIndex: number;
  rowIndex: number;
  style: CSSProperties;  // Position absolue calculée par react-window
  // + toutes les props de cellProps
}
```

**API impérative (`useGridRef`) :**
```typescript
const rwGridRef = useGridRef();
rwGridRef.current?.scrollToCell({
  rowIndex: number,
  columnIndex: number,
  rowAlign: 'smart',    // 'auto' | 'center' | 'end' | 'smart' | 'start'
  columnAlign: 'smart',
});
```

### Layout — Structure Cible

Remplacement de la structure `<table>` par un layout CSS Grid à 4 zones :

```
┌──────────┬────────────────────────────────────────────┐
│  Corner   │  Column Headers (overflow-x: hidden)       │  h=32px
│  (40×32)  │  → scrollLeft synced avec Grid             │
├──────────┼────────────────────────────────────────────┤
│ Row Nums  │                                            │
│ (40px)    │  react-window <Grid>                       │  flex: 1
│ overflow-y│  cellComponent={VirtualCell}                │
│ hidden    │  Seuls les cellules visibles sont rendues   │
│ scrollTop │                                            │
│ synced    │                                            │
└──────────┴────────────────────────────────────────────┘
```

**CSS Grid container :**
```css
display: grid;
grid-template-columns: 40px 1fr;
grid-template-rows: 32px 1fr;
height: calc(100vh - 80px);
```

### SpreadsheetGrid.tsx — Structure Cible

```typescript
import { Grid, useGridRef } from 'react-window';

export function SpreadsheetGrid() {
  const rwGridRef = useGridRef();
  const headerRef = useRef<HTMLDivElement>(null);
  const rowNumbersRef = useRef<HTMLDivElement>(null);

  // Sync scroll entre Grid et headers/row numbers
  const handleGridScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const { scrollLeft, scrollTop } = e.currentTarget;
    if (headerRef.current) headerRef.current.scrollLeft = scrollLeft;
    if (rowNumbersRef.current) rowNumbersRef.current.scrollTop = scrollTop;
  }, []);

  // Auto-scroll vers la cellule sélectionnée
  useEffect(() => {
    if (selectedCell && rwGridRef.current) {
      const { row, col } = cellIdToCoords(selectedCell);
      rwGridRef.current.scrollToCell({
        rowIndex: row - 1,
        columnIndex: col,
        rowAlign: 'smart',
        columnAlign: 'smart',
      });
    }
  }, [selectedCell]);

  return (
    <div
      ref={gridRef}
      tabIndex={0}
      data-grid-container
      className="outline-none grid"
      style={{ gridTemplateColumns: '40px 1fr', gridTemplateRows: '32px 1fr', height: 'calc(100vh - 80px)' }}
      onContextMenu={handleContextMenu}
    >
      {/* Corner */}
      <div className="bg-gray-100 border border-gray-200 z-20" />

      {/* Column headers - scroll horizontal synced */}
      <div ref={headerRef} className="overflow-hidden z-10">
        <GridHeader colCount={colCount} />
      </div>

      {/* Row numbers - scroll vertical synced */}
      <div ref={rowNumbersRef} className="overflow-hidden z-10">
        {Array.from({ length: rowCount }, (_, i) => (
          <div
            key={i + 1}
            data-row-header={i + 1}
            className="h-8 bg-gray-50 text-center text-gray-500 text-sm border border-gray-200 leading-8"
          >
            {i + 1}
          </div>
        ))}
      </div>

      {/* Virtualized cell grid */}
      <Grid
        gridRef={rwGridRef}
        cellComponent={VirtualCell}
        cellProps={{}}
        columnCount={colCount}
        columnWidth={100}
        rowCount={rowCount}
        rowHeight={32}
        overscanCount={5}
        style={{ height: '100%', width: '100%' }}
        onScroll={handleGridScroll}
      />

      {/* Context menu */}
      {contextMenu && <ContextMenu ... />}
    </div>
  );
}
```

### VirtualCell — Composant cellComponent

**Fichier `src/components/Grid/VirtualCell.tsx` :**

```typescript
import type { CSSProperties } from 'react';
import { coordsToCellId } from '../../utils/cellUtils';
import { Cell } from './Cell';

interface VirtualCellProps {
  ariaAttributes: Record<string, unknown>;
  columnIndex: number;
  rowIndex: number;
  style: CSSProperties;
}

export function VirtualCell({ columnIndex, rowIndex, style }: VirtualCellProps) {
  const row = rowIndex + 1;
  const cellId = coordsToCellId(row, columnIndex);

  return (
    <div style={style}>
      <Cell cellId={cellId} />
    </div>
  );
}
```

### Cell.tsx — Changements `<td>` → `<div>`

**Mode affichage :**
```typescript
// Avant (story 1.2-1.4)
<td className={`min-w-[100px] h-8 px-1 text-sm truncate cursor-default ${...}`}
  onClick={...} onDoubleClick={...} data-testid={`cell-${cellId}`}>
  {cellValue}
</td>

// Après (story 1.5)
<div className={`w-full h-full px-1 text-sm truncate cursor-default leading-8 ${...}`}
  onClick={...} onDoubleClick={...} data-testid={`cell-${cellId}`}>
  {cellValue}
</div>
```

**Mode édition :**
```typescript
// Avant
<td className="min-w-[100px] h-8 border border-gray-200 p-0">
  <input ... />
</td>

// Après
<div className="w-full h-full border border-gray-200 p-0">
  <input ... />
</div>
```

Les dimensions (`100px × 32px`) sont maintenant contrôlées par react-window via le `style` de VirtualCell, pas par la Cell elle-même.

### GridHeader.tsx — Changements `<thead>` → `<div>`

```typescript
// Avant
<thead>
  <tr>
    <th>...</th>
    {columns.map(th => <th>...</th>)}
  </tr>
</thead>

// Après — layout flex, sans coin (le coin est dans SpreadsheetGrid)
<div className="flex">
  {Array.from({ length: colCount }, (_, i) => (
    <div
      key={i}
      data-col-header={i}
      className="w-[100px] shrink-0 h-8 bg-gray-100 font-medium text-center text-sm border border-gray-200 leading-8"
    >
      {columnIndexToLetter(i)}
    </div>
  ))}
</div>
```

### Scroll Sync — Détail

Le scroll est géré par la `Grid` de react-window. Les headers (colonne + ligne) doivent rester synchronisés :

1. **`onScroll` sur le `Grid`** (via HTML attribute) → récupère `scrollLeft` et `scrollTop`
2. **`headerRef.current.scrollLeft = scrollLeft`** → synchronise les en-têtes de colonnes
3. **`rowNumbersRef.current.scrollTop = scrollTop`** → synchronise les numéros de lignes

Note : Les divs header/row-numbers ont `overflow: hidden` pour masquer le contenu hors cadre sans afficher de scrollbar.

### Auto-Scroll sur Sélection — scrollToCell

Quand l'utilisateur navigue au clavier et que la cellule sélectionnée sort de la zone visible, le Grid doit scroller pour la montrer :

```typescript
useEffect(() => {
  if (selectedCell && rwGridRef.current) {
    const { row, col } = cellIdToCoords(selectedCell);
    rwGridRef.current.scrollToCell({
      rowIndex: row - 1,    // react-window est 0-indexed
      columnIndex: col,
      rowAlign: 'smart',     // Scroll seulement si nécessaire
      columnAlign: 'smart',
    });
  }
}, [selectedCell]);
```

### Tests — ResizeObserver Mock

react-window v2 utilise `ResizeObserver` pour l'auto-dimensionnement. happy-dom ne le fournit pas par défaut. **Mock nécessaire dans les tests SpreadsheetGrid :**

```typescript
beforeAll(() => {
  global.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
});
```

### Changement de Taille Grille — 100 → 1000 Lignes

Modifier `initializeGrid(100, 26)` → `initializeGrid(1000, 26)` dans SpreadsheetGrid.tsx pour la capacité 1000 lignes par défaut.

**Impact sur les tests existants :** Les tests qui vérifient `rowCount === 100` doivent être mis à jour pour `rowCount === 1000`.

### Contraintes et Points d'Attention

1. **react-window positionnement absolu** : Les cellules sont positionnées en `position: absolute` par react-window. Le `style` passé au cellComponent DOIT être appliqué sur la div racine.
2. **Cell.test.tsx** : Retirer les wrappers `<table><tbody><tr>` puisque Cell rend maintenant un `<div>`.
3. **SpreadsheetGrid tests** : react-window peut ne pas rendre les cellules en test si le container n'a pas de dimensions. Utiliser `defaultHeight`/`defaultWidth` ou mocker ResizeObserver.
4. **Context menu** : Le `onContextMenu` reste sur le div conteneur. Les data-attributes `data-row-header`, `data-col-header`, `data-testid="cell-..."` doivent être présents sur les éléments du nouveau layout.
5. **useKeyboardNav** : Pas de modification nécessaire — il écoute les événements sur le conteneur via ref, qui reste le même div `data-grid-container`.
6. **1000 row numbers** rendus dans un div : 1000 divs légers (juste un numéro) — performance négligeable. Pas besoin de virtualiser séparément.

### Previous Story Intelligence (Stories 1.1 → 1.4)

**Learnings critiques :**
1. **happy-dom** : `// @vitest-environment happy-dom` (PAS jsdom)
2. **Zustand v5 sélecteurs** : Atomiques `(s) => s.prop`
3. **act() wrapper** : Wrapper dispatches d'événements et mises à jour store dans `act()`
4. **rerender pattern** : `const { rerender } = render(...)` + `rerender(...)` après changement de store
5. **data-testid pattern** : `cell-{cellId}` display, `cell-input-{cellId}` edit
6. **Immer state replacement** : `state.cells = newCells` fonctionne dans callback Immer
7. **react-window v2** : Import nommé `Grid` (pas `FixedSizeGrid`), `cellComponent` (pas `children`), `cellProps` (pas `itemData`), `style` pour dimensionnement (pas `width`/`height`)

### Scope — Ce qui est HORS de cette story

- **Virtualisation horizontale des colonnes** → Non nécessaire (max 26 colonnes)
- **Taille dynamique des lignes/colonnes (resize)** → Post-MVP
- **Persistence IndexedDB** → Story 1.6
- **DiffOverlay** → Epic 2

### Project Structure Notes

Fichiers créés/modifiés par cette story :
```
frontend/src/
├── components/Grid/
│   ├── VirtualCell.tsx             (new — cellComponent react-window)
│   ├── Cell.tsx                    (modified — <td> → <div>)
│   ├── Cell.test.tsx               (modified — retrait wrappers table)
│   ├── GridHeader.tsx              (modified — <thead> → <div> flex)
│   ├── SpreadsheetGrid.tsx         (modified — react-window Grid, layout CSS Grid, scroll sync)
│   ├── SpreadsheetGrid.test.tsx    (modified — mock ResizeObserver, adapter tests)
│   └── index.ts                    (modified — export VirtualCell)
```

### References

- [Source: architecture.md#Frontend Architecture] — VirtualizedRows, react-window FixedSizeGrid
- [Source: architecture.md#Performance] — NFR2: 1000 lignes < 500ms, scroll 60fps
- [Source: epics.md#Story 1.5] — User story, acceptance criteria
- [Source: react-window v2 API] — Grid, useGridRef, cellComponent, cellProps, scrollToCell

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

- Build error: `useGridRef()` requires argument in React 19 → fixed with `useGridRef(null)`
- Build error: `ExcludeForbiddenKeys<VirtualCellProps>` rejected `cellProps={}` → fixed with explicit generic `Grid<Record<string, never>>`
- Build error: `global.ResizeObserver` not recognized by tsc → fixed with `globalThis.ResizeObserver`

### Completion Notes List

- Cell.tsx refactored: `<td>` → `<div>`, dimensions now controlled by react-window via VirtualCell style
- GridHeader.tsx refactored: `<thead>/<tr>/<th>` → `<div className="flex">` with `w-[100px] shrink-0` children
- VirtualCell.tsx created: maps react-window rowIndex/columnIndex to cellId, wraps Cell in positioned div
- SpreadsheetGrid.tsx refactored: `<table>` → CSS Grid 4-zone layout + react-window Grid
- Scroll sync: onScroll on Grid div → headerRef.scrollLeft + rowNumbersRef.scrollTop
- Auto-scroll: useEffect on selectedCell → scrollToCell with 'smart' alignment
- Grid initialized to 1000 rows (was 100)
- defaultHeight=600, defaultWidth=2600 for initial render and test compatibility
- Cell.test.tsx: removed `<table><tbody><tr>` wrappers (Cell now renders `<div>`)
- SpreadsheetGrid.test.tsx: ResizeObserver mock, rowCount 1000, adapted for virtualization
- 125/125 tests pass, build clean

### File List

- frontend/src/components/Grid/Cell.tsx (modified)
- frontend/src/components/Grid/Cell.test.tsx (modified)
- frontend/src/components/Grid/GridHeader.tsx (modified)
- frontend/src/components/Grid/VirtualCell.tsx (new)
- frontend/src/components/Grid/SpreadsheetGrid.tsx (modified)
- frontend/src/components/Grid/SpreadsheetGrid.test.tsx (modified)
- frontend/src/components/Grid/index.ts (modified)

