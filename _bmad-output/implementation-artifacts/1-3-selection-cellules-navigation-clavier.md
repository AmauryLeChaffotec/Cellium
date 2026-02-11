# Story 1.3: Sélection de Cellules et Navigation Clavier

Status: review

## Story

As a utilisateur,
I want sélectionner des cellules et naviguer au clavier dans la grille,
so that je peux travailler efficacement sans la souris.

## Acceptance Criteria

1. **Given** la grille est affichée **When** l'utilisateur clique sur une cellule **Then** la cellule est visuellement sélectionnée (surbrillance) (FR3)
2. **Given** une cellule est sélectionnée **When** l'utilisateur appuie sur une flèche directionnelle **Then** la sélection se déplace vers la cellule adjacente (FR6)
3. **Given** une cellule est sélectionnée **When** l'utilisateur appuie sur Tab **Then** la sélection passe à la cellule suivante (droite) (FR6)
4. **Given** une cellule est sélectionnée **When** l'utilisateur appuie sur Enter **Then** la cellule entre en mode édition (FR6)

## Tasks / Subtasks

- [x] Task 1: Ajouter sélection visuelle au composant Cell (AC: #1)
  - [x] 1.1 Modifier `Cell.tsx` : ajouter `onClick` → `selectCell(cellId)`
  - [x] 1.2 Ajouter sélecteur Zustand `isSelected = useGridStore((s) => s.selectedCell === cellId)`
  - [x] 1.3 Appliquer style conditionnel : bordure bleue `ring-2 ring-blue-500` quand sélectionné
  - [x] 1.4 Mettre à jour `Cell.test.tsx` : tests clic → sélection, style conditionnel
- [x] Task 2: Créer le hook `useKeyboardNav` (AC: #2, #3, #4)
  - [x] 2.1 Créer `src/hooks/useKeyboardNav.ts` — hook acceptant un `RefObject<HTMLElement>` du conteneur grille
  - [x] 2.2 Gérer ArrowUp/Down/Left/Right : calcul cellule adjacente, appel `selectCell`
  - [x] 2.3 Gérer Tab (droite) et Shift+Tab (gauche)
  - [x] 2.4 Gérer Enter : appel `startEditing` sur la cellule sélectionnée
  - [x] 2.5 `preventDefault` sur Tab/Enter/Arrows pour éviter le comportement par défaut
  - [x] 2.6 Ignorer les événements clavier quand `editingCell !== null` (l'input gère ses propres events)
  - [x] 2.7 Créer `src/hooks/useKeyboardNav.test.ts` — tests pour chaque touche + boundary cases
- [x] Task 3: Intégrer le hook dans SpreadsheetGrid (AC: #2, #3, #4)
  - [x] 3.1 Modifier `SpreadsheetGrid.tsx` : ajouter `ref` sur le conteneur + `tabIndex={0}` pour le rendre focusable
  - [x] 3.2 Appeler `useKeyboardNav(gridRef)` dans le composant
  - [x] 3.3 Focus automatique du conteneur au montage
  - [x] 3.4 Retour du focus au conteneur après `stopEditing` (quand l'input perd le focus)
- [x] Task 4: Gérer la transition édition → sélection (AC: #1, #4)
  - [x] 4.1 Modifier `Cell.tsx` : après `stopEditing` (Enter/Escape/blur), redonner le focus au conteneur grille
  - [x] 4.2 Quand Enter est pressé en mode édition : sauvegarder + `selectCell` la cellule du dessous (comportement tableur standard)
  - [x] 4.3 Quand Tab est pressé en mode édition : sauvegarder + `selectCell` la cellule de droite
- [x] Task 5: Mettre à jour les re-exports et tests d'intégration (AC: #1-4)
  - [x] 5.1 Mettre à jour `SpreadsheetGrid.test.tsx` avec tests de navigation clavier
  - [x] 5.2 S'assurer que les tests existants (Cell, gridStore) passent toujours
- [x] Task 6: Validation finale (AC: #1-4)
  - [x] 6.1 `npm run build` compile sans erreur
  - [x] 6.2 Tous les tests passent (`npx vitest run`)
  - [x] 6.3 Vérification : clic → sélection bleue, flèches → déplacement, Tab → droite, Enter → édition

## Dev Notes

### Architecture Compliance

**Source : [architecture.md](../../_bmad-output/planning-artifacts/architecture.md)**

Cette story utilise le `gridStore` existant (story 1.2) et crée le hook `useKeyboardNav` prévu dans l'architecture (`src/hooks/useKeyboardNav.ts`).

### Existing Code — Éléments à Modifier

**`gridStore.ts` — Déjà prêt, pas de modification nécessaire :**
- `selectedCell: string | null` — déjà dans le state
- `selectCell: (id: string | null) => void` — déjà implémenté
- `startEditing: (id: string) => void` — déjà implémenté
- `editingCell: string | null` — utilisé pour ignorer la nav clavier en mode édition

**`Cell.tsx` — Modifications requises :**
- Ajouter `onClick` → `selectCell(cellId)` sur le `<td>` en mode affichage
- Ajouter sélecteur `isSelected` et style conditionnel
- Le double-clic (édition) doit continuer à fonctionner en plus du clic (sélection)
- Après arrêt de l'édition, redonner le focus au conteneur grille

**`SpreadsheetGrid.tsx` — Modifications requises :**
- Ajouter `ref` sur le `<div>` conteneur + `tabIndex={0}`
- Appeler `useKeyboardNav(gridRef)`
- Auto-focus au montage

### useKeyboardNav — Spécification Complète

**Fichier `src/hooks/useKeyboardNav.ts` :**

```typescript
import { useEffect } from 'react';
import { useGridStore } from '../stores/gridStore';
import { cellIdToCoords, coordsToCellId } from '../utils/cellUtils';

export function useKeyboardNav(containerRef: React.RefObject<HTMLElement | null>) {
  const selectedCell = useGridStore((s) => s.selectedCell);
  const editingCell = useGridStore((s) => s.editingCell);
  const rowCount = useGridStore((s) => s.rowCount);
  const colCount = useGridStore((s) => s.colCount);
  const selectCell = useGridStore((s) => s.selectCell);
  const startEditing = useGridStore((s) => s.startEditing);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignorer si en mode édition (l'input gère ses propres events)
      if (editingCell) return;
      // Ignorer si aucune cellule sélectionnée
      if (!selectedCell) return;

      const { row, col } = cellIdToCoords(selectedCell);
      let nextRow = row;
      let nextCol = col;

      switch (e.key) {
        case 'ArrowUp':    nextRow = Math.max(1, row - 1); break;
        case 'ArrowDown':  nextRow = Math.min(rowCount, row + 1); break;
        case 'ArrowLeft':  nextCol = Math.max(0, col - 1); break;
        case 'ArrowRight': nextCol = Math.min(colCount - 1, col + 1); break;
        case 'Tab':
          if (e.shiftKey) {
            nextCol = Math.max(0, col - 1);
          } else {
            nextCol = Math.min(colCount - 1, col + 1);
          }
          break;
        case 'Enter':
          startEditing(selectedCell);
          e.preventDefault();
          return;
        default:
          return; // Ne pas preventDefault sur les touches non gérées
      }

      e.preventDefault();
      selectCell(coordsToCellId(nextRow, nextCol));
    };

    container.addEventListener('keydown', handleKeyDown);
    return () => container.removeEventListener('keydown', handleKeyDown);
  }, [containerRef, selectedCell, editingCell, rowCount, colCount, selectCell, startEditing]);
}
```

**Points critiques :**
- Le hook écoute les événements sur le conteneur, PAS sur window/document
- Quand `editingCell !== null`, le hook ignore TOUS les événements clavier
- `preventDefault` obligatoire sur Tab (sinon le focus quitte la grille) et Enter
- Boundary checking : row min=1, row max=rowCount, col min=0, col max=colCount-1
- Sélecteurs Zustand atomiques dans le hook

### Cell.tsx — Modifications Détaillées

```typescript
// Ajouter ces sélecteurs
const isSelected = useGridStore((s) => s.selectedCell === cellId);
const selectCell = useGridStore((s) => s.selectCell);

// Mode affichage : ajouter onClick + style conditionnel
<td
  className={`min-w-[100px] h-8 border px-1 text-sm truncate cursor-default
    ${isSelected ? 'ring-2 ring-blue-500 ring-inset' : 'border-gray-200'}`}
  onClick={() => selectCell(cellId)}
  onDoubleClick={() => startEditing(cellId)}
  data-testid={`cell-${cellId}`}
>
```

**Le `onClick` et `onDoubleClick` coexistent :**
- Clic simple → `selectCell` (sélection visuelle)
- Double-clic → `startEditing` (mode édition) — React gère correctement les 2 events

### Focus Management — Flux Complet

```
1. Grille montée → auto-focus conteneur (tabIndex=0)
2. Clic sur cellule → selectCell → cellule surlignée
3. Flèches/Tab → navigation dans la grille (conteneur gardé focusé)
4. Enter → startEditing → focus passe à l'input de la cellule
5. Enter en édition → save + selectCell(cellule dessous) + focus retourne au conteneur
6. Escape en édition → cancel + focus retourne au conteneur
7. Tab en édition → save + selectCell(cellule droite) + focus retourne au conteneur
8. Blur en édition → save + focus retourne au conteneur
```

**Redonner le focus au conteneur :** Le composant Cell doit accéder au conteneur grille. Deux approches :
- **Approche recommandée** : Le Cell appelle `containerRef.current?.focus()` après stopEditing. Passer le containerRef via un Context ou une prop.
- **Approche alternative simple** : Utiliser `document.querySelector('[data-grid-container]')?.focus()` avec un `data-grid-container` sur le div du SpreadsheetGrid. Plus simple, moins couplé.

Utiliser l'**approche alternative** (data-attribute) pour éviter de créer un Context juste pour ça.

### Comportement Tab/Enter en Mode Édition

En mode édition (dans l'input de Cell.tsx), les touches Tab et Enter doivent :
1. Sauvegarder la valeur courante (`handleSave`)
2. Déplacer la sélection (Enter → bas, Tab → droite)
3. Redonner le focus au conteneur grille

**Modifier `handleKeyDown` dans Cell.tsx :**
```typescript
const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
  if (e.key === 'Enter') {
    handleSave();
    // Déplacer sélection vers le bas
    const { row, col } = cellIdToCoords(cellId);
    const rowCount = useGridStore.getState().rowCount;
    if (row < rowCount) {
      selectCell(coordsToCellId(row + 1, col));
    }
    focusGridContainer();
  } else if (e.key === 'Tab') {
    e.preventDefault();
    handleSave();
    // Déplacer sélection vers la droite (Shift+Tab = gauche)
    const { row, col } = cellIdToCoords(cellId);
    const colCount = useGridStore.getState().colCount;
    if (e.shiftKey) {
      if (col > 0) selectCell(coordsToCellId(row, col - 1));
    } else {
      if (col < colCount - 1) selectCell(coordsToCellId(row, col + 1));
    }
    focusGridContainer();
  } else if (e.key === 'Escape') {
    stopEditing();
    focusGridContainer();
  }
};

function focusGridContainer() {
  // Utilise data-attribute pour retrouver le conteneur
  const container = document.querySelector<HTMLElement>('[data-grid-container]');
  container?.focus();
}
```

### Styling Tailwind — Sélection

- Cellule sélectionnée : `ring-2 ring-blue-500 ring-inset` (anneau bleu interne, pas de border-shift)
- Cellule non sélectionnée : `border border-gray-200` (normal)
- Cellule en édition : `border-2 border-blue-500` (déjà dans story 1.2)
- Conteneur grille focusé : `outline-none` (pas d'outline par défaut, la sélection de cellule suffit)

### Test Strategy

**happy-dom** pour tous les tests de composants (annotation `// @vitest-environment happy-dom`).

**Tests useKeyboardNav (hook pur) :**
- Tester via un composant wrapper simple qui rend un div + le hook
- Simuler `keydown` events avec `fireEvent.keyDown`
- Vérifier que `selectedCell` change correctement
- Tester les boundary cases (haut de grille, bas, gauche, droite)
- Tester que les events sont ignorés quand `editingCell !== null`

**Tests Cell.tsx (mise à jour) :**
- Clic → `selectCell` appelé
- Style `ring-2` appliqué quand sélectionné
- Style normal quand non sélectionné

**Tests SpreadsheetGrid.tsx (mise à jour) :**
- Conteneur a `tabIndex={0}` et `data-grid-container`
- Navigation flèches fonctionne
- Enter déclenche édition

### Previous Story Intelligence (Stories 1.1 + 1.2)

**Learnings critiques :**
1. **happy-dom** : Utiliser `// @vitest-environment happy-dom` (PAS jsdom — ESM incompatible avec Node 22.7)
2. **Zustand v5 sélecteurs** : Toujours atomiques `(s) => s.prop` — pas de destructuration d'objet
3. **act() wrapper** : Wrapper les mises à jour du store Zustand dans `act()` dans les tests
4. **rerender pattern** : Utiliser `const { rerender } = render(...)` + `rerender(...)` pour forcer le re-rendu après changement de store
5. **gridStore déjà prêt** : `selectedCell`, `selectCell`, `editingCell`, `startEditing`, `stopEditing` — tout est en place
6. **cellUtils déjà prêt** : `cellIdToCoords`, `coordsToCellId`, `columnIndexToLetter`, `letterToColumnIndex` — utilitaires dispo
7. **data-testid pattern** : `cell-{cellId}` pour display mode, `cell-input-{cellId}` pour edit mode

### Scope — Ce qui est HORS de cette story

- **Sélection multiple** (Shift+clic, Ctrl+clic) → Post-MVP
- **Ajout/suppression lignes/colonnes** → Story 1.4
- **Virtualisation react-window** → Story 1.5
- **Persistence IndexedDB** → Story 1.6

### Project Structure Notes

Fichiers créés/modifiés par cette story :
```
frontend/src/
├── hooks/
│   ├── useKeyboardNav.ts          (new)
│   └── useKeyboardNav.test.ts     (new)
├── components/Grid/
│   ├── Cell.tsx                    (modified — onClick, isSelected, focus mgmt)
│   ├── Cell.test.tsx               (modified — tests sélection)
│   ├── SpreadsheetGrid.tsx         (modified — ref, tabIndex, useKeyboardNav)
│   └── SpreadsheetGrid.test.tsx    (modified — tests navigation)
```

Supprimer `hooks/.gitkeep` après création du vrai fichier.

### References

- [Source: architecture.md#Frontend Architecture] — Component hierarchy, useKeyboardNav.ts
- [Source: architecture.md#Implementation Patterns] — Naming conventions, hook patterns
- [Source: architecture.md#Project Structure & Boundaries] — hooks/ directory
- [Source: epics.md#Story 1.3] — User story, acceptance criteria (FR3, FR6)
- [Source: 1-2-grille-basique-affichage-edition.md#Dev Agent Record] — Learnings happy-dom, act(), Zustand patterns

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

- act() warnings on useKeyboardNav tests — fixed by wrapping `container.dispatchEvent` in `act()`

### Completion Notes List

- Cell.tsx: Added `isSelected` selector, `selectCell` action, `onClick` handler, conditional `ring-2 ring-blue-500 ring-inset` styling
- Cell.tsx: Added Tab/Enter/Escape focus management — Enter saves + moves down, Tab saves + moves right, Escape cancels, all refocus grid container via `[data-grid-container]`
- useKeyboardNav.ts: Created hook listening on container keydown — ArrowUp/Down/Left/Right, Tab/Shift+Tab, Enter for editing, with boundary checks and editingCell guard
- SpreadsheetGrid.tsx: Added `ref`, `tabIndex={0}`, `data-grid-container`, `outline-none`, auto-focus on mount, `useKeyboardNav(gridRef)` integration
- Removed `hooks/.gitkeep` (replaced by real hook file)
- 83/83 tests pass, build compiles without errors
- 25 new tests added (15 useKeyboardNav, 6 Cell selection/transition, 4 SpreadsheetGrid navigation)

### File List

- `frontend/src/hooks/useKeyboardNav.ts` (new)
- `frontend/src/hooks/useKeyboardNav.test.ts` (new)
- `frontend/src/components/Grid/Cell.tsx` (modified)
- `frontend/src/components/Grid/Cell.test.tsx` (modified)
- `frontend/src/components/Grid/SpreadsheetGrid.tsx` (modified)
- `frontend/src/components/Grid/SpreadsheetGrid.test.tsx` (modified)
- `frontend/src/hooks/.gitkeep` (deleted)

