---
story_id: 3-2-historique-versions-consultable
epic: epic-3
title: Historique des Versions Consultable
status: ready-for-dev
created: 2026-02-12
---

# Story 3.2: Historique des Versions Consultable

## User Story

**As a** utilisateur,
**I want** consulter l'historique de toutes mes versions avec leurs dates et descriptions,
**So that** je peux comprendre l'évolution de mes données.

## Context

Cette story crée l'interface utilisateur pour consulter l'historique des snapshots capturés automatiquement dans Story 3.1.

**Dépendances:**
- ✅ Story 3.1 (Snapshots Automatiques) — Le versionStore et les snapshots doivent être disponibles

**Ce que cette story NE fait PAS:**
- N'inclut PAS la restauration de version (Story 3.3)
- N'inclut PAS d'édition ou suppression manuelle de snapshots

Cette story se concentre uniquement sur la **visualisation consultable** de l'historique.

## Acceptance Criteria

### AC1: Affichage de la Liste des Versions

**Given** des snapshots existent dans le versionStore
**When** l'utilisateur ouvre le VersionPanel
**Then** la liste des versions s'affiche en ordre chronologique inverse (plus récent en haut) (FR27)
**And** chaque version affiche son timestamp formaté en français et sa description

### AC2: Message "Aucune Version"

**Given** aucun snapshot n'existe
**When** l'utilisateur ouvre le VersionPanel
**Then** un message indique "Aucune version enregistrée"

### AC3: Scrolling Fluide

**Given** l'historique contient 10+ versions
**When** l'utilisateur parcourt la liste
**Then** le scrolling est fluide et toutes les versions sont accessibles

### AC4: Toggle du Panel

**Given** le VersionPanel est fermé
**When** l'utilisateur clique sur le bouton "Historique" dans le header
**Then** le VersionPanel s'ouvre en sidebar à droite

**Given** le VersionPanel est ouvert
**When** l'utilisateur clique sur le bouton "Fermer" ou sur le bouton "Historique" à nouveau
**Then** le VersionPanel se ferme

## Technical Implementation

### Task Breakdown

#### Task 1: Créer le Composant VersionPanel

**File:** `frontend/src/components/Version/VersionPanel.tsx`

```typescript
import { useVersionStore } from '../../stores/versionStore';
import { VersionItem } from './VersionItem';

interface VersionPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function VersionPanel({ isOpen, onClose }: VersionPanelProps) {
  const { snapshots, isLoading } = useVersionStore();

  if (!isOpen) return null;

  return (
    <div className="fixed top-0 right-0 h-full w-96 bg-white border-l border-gray-300 shadow-lg z-20 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-800">Historique des Versions</h2>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700"
          aria-label="Fermer l'historique"
        >
          ✕
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="p-4 text-center text-gray-500">Chargement...</div>
        ) : snapshots.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            Aucune version enregistrée
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {/* Reverse order: most recent first */}
            {[...snapshots].reverse().map((snapshot) => (
              <VersionItem key={snapshot.id} snapshot={snapshot} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
```

**Notes:**
- Fixed positioning with `z-20` to appear above grid (z-10)
- Reverse snapshots array for chronological inverse order (FR27)
- Empty state message when no snapshots
- Loading state while snapshots are being loaded from IndexedDB

#### Task 2: Créer le Composant VersionItem

**File:** `frontend/src/components/Version/VersionItem.tsx`

```typescript
import type { Snapshot } from '../../types/version';
import { formatTimestamp } from '../../utils/dateUtils';

interface VersionItemProps {
  snapshot: Snapshot;
}

export function VersionItem({ snapshot }: VersionItemProps) {
  const formattedDate = formatTimestamp(snapshot.timestamp);

  return (
    <div className="p-4 hover:bg-gray-50 transition-colors">
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-800">{snapshot.description}</p>
          <p className="text-xs text-gray-500 mt-1">{formattedDate}</p>
        </div>
      </div>

      {/* Operations Summary */}
      <div className="mt-2 flex gap-2 text-xs">
        <span className="text-gray-600">
          {snapshot.operations.length} opération{snapshot.operations.length > 1 ? 's' : ''}
        </span>
      </div>
    </div>
  );
}
```

**Notes:**
- Displays description, formatted timestamp, and operation count
- Hover effect for better UX
- Story 3.3 will add a "Restaurer" button here

#### Task 3: Créer l'Utilitaire de Formatage de Date

**File:** `frontend/src/utils/dateUtils.ts`

```typescript
/**
 * Formats an ISO 8601 timestamp to French locale
 * Example: "12 février 2026 à 14:30"
 */
export function formatTimestamp(isoTimestamp: string): string {
  const date = new Date(isoTimestamp);

  const dateFormatter = new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const timeFormatter = new Intl.DateTimeFormat('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return `${dateFormatter.format(date)} à ${timeFormatter.format(date)}`;
}
```

**Notes:**
- Uses `Intl.DateTimeFormat` for proper French localization
- Output: "12 février 2026 à 14:30"

#### Task 4: Créer le Barrel Export pour Version Components

**File:** `frontend/src/components/Version/index.ts`

```typescript
export { VersionPanel } from './VersionPanel';
export { VersionItem } from './VersionItem';
```

#### Task 5: Ajouter le Toggle du VersionPanel dans App.tsx

**File:** `frontend/src/App.tsx` (Modifier)

```typescript
import { useEffect, useState } from 'react';
import { SpreadsheetGrid } from './components/Grid';
import { CommandBar } from './components/CommandBar';
import { DiffOverlay, ActionBar } from './components/Diff';
import { VersionPanel } from './components/Version';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { useVersionStore } from './stores/versionStore';

function App() {
  const [isVersionPanelOpen, setIsVersionPanelOpen] = useState(false);

  useKeyboardShortcuts();

  useEffect(() => {
    useVersionStore.getState().loadSnapshots();
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-gray-200 px-4 py-2 flex items-center justify-between">
        <h1 className="text-lg font-semibold text-gray-800">Cellium</h1>
        <button
          onClick={() => setIsVersionPanelOpen(!isVersionPanelOpen)}
          className="px-3 py-1 text-sm text-gray-700 hover:bg-gray-100 rounded border border-gray-300"
        >
          Historique
        </button>
      </header>
      <CommandBar />
      <div className="relative">
        <SpreadsheetGrid />
        <DiffOverlay />
      </div>
      <ActionBar />
      <VersionPanel isOpen={isVersionPanelOpen} onClose={() => setIsVersionPanelOpen(false)} />
    </div>
  );
}

export default App;
```

**Notes:**
- `isVersionPanelOpen` state controls panel visibility
- "Historique" button in header toggles panel
- VersionPanel rendered at root level (fixed positioning)

#### Task 6: Créer Tests pour VersionPanel

**File:** `frontend/src/components/Version/VersionPanel.test.tsx`

```typescript
// @vitest-environment happy-dom
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { VersionPanel } from './VersionPanel';
import { useVersionStore } from '../../stores/versionStore';
import type { Snapshot } from '../../types/version';

describe('VersionPanel', () => {
  beforeEach(() => {
    useVersionStore.setState({
      snapshots: [],
      isLoading: false,
    });
  });

  it('should not render when closed', () => {
    const { container } = render(<VersionPanel isOpen={false} onClose={() => {}} />);
    expect(container.firstChild).toBeNull();
  });

  it('should render when open', () => {
    render(<VersionPanel isOpen={true} onClose={() => {}} />);
    expect(screen.getByText('Historique des Versions')).toBeInTheDocument();
  });

  it('should display empty state when no snapshots', () => {
    useVersionStore.setState({ snapshots: [], isLoading: false });

    render(<VersionPanel isOpen={true} onClose={() => {}} />);
    expect(screen.getByText('Aucune version enregistrée')).toBeInTheDocument();
  });

  it('should display loading state', () => {
    useVersionStore.setState({ snapshots: [], isLoading: true });

    render(<VersionPanel isOpen={true} onClose={() => {}} />);
    expect(screen.getByText('Chargement...')).toBeInTheDocument();
  });

  it('should display snapshots in reverse chronological order', () => {
    const mockSnapshots: Snapshot[] = [
      {
        id: '1',
        timestamp: '2026-02-12T10:00:00.000Z',
        description: 'First snapshot',
        operations: [],
      },
      {
        id: '2',
        timestamp: '2026-02-12T11:00:00.000Z',
        description: 'Second snapshot',
        operations: [],
      },
    ];

    useVersionStore.setState({ snapshots: mockSnapshots, isLoading: false });

    render(<VersionPanel isOpen={true} onClose={() => {}} />);

    const descriptions = screen.getAllByText(/snapshot/i);
    // Most recent first
    expect(descriptions[0]).toHaveTextContent('Second snapshot');
    expect(descriptions[1]).toHaveTextContent('First snapshot');
  });

  it('should call onClose when close button is clicked', () => {
    const mockOnClose = vi.fn();

    render(<VersionPanel isOpen={true} onClose={mockOnClose} />);

    const closeButton = screen.getByLabelText('Fermer l\'historique');
    closeButton.click();

    expect(mockOnClose).toHaveBeenCalled();
  });
});
```

**Coverage:**
- ✅ Render when open/closed
- ✅ Empty state
- ✅ Loading state
- ✅ Snapshots in reverse order (most recent first)
- ✅ Close button functionality

#### Task 7: Créer Tests pour VersionItem

**File:** `frontend/src/components/Version/VersionItem.test.tsx`

```typescript
// @vitest-environment happy-dom
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { VersionItem } from './VersionItem';
import type { Snapshot } from '../../types/version';

describe('VersionItem', () => {
  it('should display snapshot description', () => {
    const mockSnapshot: Snapshot = {
      id: '1',
      timestamp: '2026-02-12T14:30:00.000Z',
      description: 'Ajout colonne Total',
      operations: [{ type: 'INSERT_COLUMN', colIndex: 3, header: 'Total', cells: {} }],
    };

    render(<VersionItem snapshot={mockSnapshot} />);
    expect(screen.getByText('Ajout colonne Total')).toBeInTheDocument();
  });

  it('should display formatted timestamp', () => {
    const mockSnapshot: Snapshot = {
      id: '1',
      timestamp: '2026-02-12T14:30:00.000Z',
      description: 'Test',
      operations: [],
    };

    render(<VersionItem snapshot={mockSnapshot} />);
    // Check for date components (day, month, year, time)
    expect(screen.getByText(/12.*février.*2026.*14:30/i)).toBeInTheDocument();
  });

  it('should display operations count (singular)', () => {
    const mockSnapshot: Snapshot = {
      id: '1',
      timestamp: '2026-02-12T14:30:00.000Z',
      description: 'Test',
      operations: [{ type: 'SET_VALUE', cellId: 'A1', value: 42 }],
    };

    render(<VersionItem snapshot={mockSnapshot} />);
    expect(screen.getByText('1 opération')).toBeInTheDocument();
  });

  it('should display operations count (plural)', () => {
    const mockSnapshot: Snapshot = {
      id: '1',
      timestamp: '2026-02-12T14:30:00.000Z',
      description: 'Test',
      operations: [
        { type: 'SET_VALUE', cellId: 'A1', value: 10 },
        { type: 'SET_VALUE', cellId: 'B1', value: 20 },
      ],
    };

    render(<VersionItem snapshot={mockSnapshot} />);
    expect(screen.getByText('2 opérations')).toBeInTheDocument();
  });
});
```

**Coverage:**
- ✅ Description displayed
- ✅ Formatted timestamp in French
- ✅ Operations count (singular/plural)

#### Task 8: Créer Tests pour dateUtils

**File:** `frontend/src/utils/dateUtils.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { formatTimestamp } from './dateUtils';

describe('dateUtils', () => {
  describe('formatTimestamp', () => {
    it('should format ISO timestamp to French locale', () => {
      const isoTimestamp = '2026-02-12T14:30:00.000Z';
      const formatted = formatTimestamp(isoTimestamp);

      // Check for French month and proper format
      expect(formatted).toMatch(/12 février 2026 à \d{2}:\d{2}/);
    });

    it('should handle different months', () => {
      const isoTimestamp = '2026-07-25T09:15:00.000Z';
      const formatted = formatTimestamp(isoTimestamp);

      expect(formatted).toMatch(/25 juillet 2026 à \d{2}:\d{2}/);
    });

    it('should pad hours and minutes with leading zeros', () => {
      const isoTimestamp = '2026-01-05T03:05:00.000Z';
      const formatted = formatTimestamp(isoTimestamp);

      // Should have time format HH:MM
      expect(formatted).toMatch(/\d{2}:\d{2}$/);
    });
  });
});
```

**Coverage:**
- ✅ French locale formatting
- ✅ Different months
- ✅ Zero-padding for time

#### Task 9: Validation Finale

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
- ✅ Tous les tests passent (nouveau total: 243 + ~13 = 256 tests)
- ✅ Build réussit sans erreurs TypeScript
- ✅ VersionPanel toggle fonctionne dans l'app

## Dev Notes

### Architecture Decisions

**1. Panel en Sidebar Fixe**
- Fixed positioning à droite avec largeur fixe (384px / w-96)
- Z-index 20 pour apparaître au-dessus de la grille (z-10) et du DiffOverlay
- Permet de consulter l'historique sans quitter la vue de la grille

**2. Ordre Chronologique Inverse (FR27)**
- Snapshots affichés du plus récent au plus ancien
- Implémentation: `[...snapshots].reverse()` pour ne pas muter l'état
- Justification: l'utilisateur est généralement intéressé par les versions récentes

**3. Formatage French Locale**
- `Intl.DateTimeFormat` avec locale 'fr-FR'
- Format: "12 février 2026 à 14:30"
- Respecte les conventions françaises (jour avant mois, mois en toutes lettres)

**4. État Local pour Toggle**
- `isVersionPanelOpen` géré dans App.tsx
- Alternative considérée: store global (rejected pour simplicité)
- Le toggle du panel n'affecte pas les autres composants

### Edge Cases

**1. Aucun Snapshot**
- Empty state avec message "Aucune version enregistrée"
- Apparaît au premier démarrage de l'app ou si tous les snapshots sont supprimés

**2. Nombreux Snapshots (10+)**
- Overflow-y-auto sur le container pour scroll fluide
- Pas de pagination pour cette story (feature future si nécessaire)
- Performance OK jusqu'à ~100 snapshots (chaque item = ~100 bytes DOM)

**3. Timestamp Timezone**
- ISO 8601 stocké en UTC dans IndexedDB
- `Intl.DateTimeFormat` convertit automatiquement en timezone locale
- Utilisateur voit toujours l'heure locale

**4. Panel Ouvert Pendant Validation**
- Si l'utilisateur valide un diff pendant que le panel est ouvert, le nouveau snapshot apparaît automatiquement en haut de la liste
- Réactivité Zustand garantit la mise à jour automatique

### Performance Targets

- **Ouverture du panel**: < 50ms (simplement toggle CSS)
- **Affichage de 50 snapshots**: < 100ms (render React)
- **Scroll dans la liste**: 60fps (overflow-y-auto natif)

### Testing Strategy

**Unit Tests:**
- VersionPanel: render, empty state, loading, snapshots display, close button
- VersionItem: description, timestamp, operations count
- dateUtils: French formatting, different inputs

**Integration Tests:**
- Non nécessaire pour cette story (pas d'interaction avec d'autres stores)

**Manual Testing:**
1. Ouvrir l'app → Cliquer "Historique" → Panel s'ouvre vide avec "Aucune version enregistrée"
2. Valider 3 commandes IA → Ouvrir panel → 3 versions affichées (plus récente en haut)
3. Vérifier formatage French: "12 février 2026 à 14:30"
4. Scroll dans la liste avec 10+ versions → Fluide
5. Cliquer "✕" → Panel se ferme

## Definition of Done

- [ ] Composant VersionPanel créé avec toggle open/close
- [ ] Composant VersionItem créé avec description, timestamp, operations count
- [ ] Utilitaire dateUtils créé avec formatTimestamp()
- [ ] Barrel export créé (components/Version/index.ts)
- [ ] App.tsx modifié avec bouton "Historique" et toggle state
- [ ] Tests VersionPanel (6+ assertions)
- [ ] Tests VersionItem (4+ assertions)
- [ ] Tests dateUtils (3+ assertions)
- [ ] Tous les tests passent (256+ tests)
- [ ] Build production réussit sans erreurs TypeScript
- [ ] Vérification manuelle: panel toggle, snapshots affichés, formatage French

## Related Requirements

**Functional:**
- FR27: L'utilisateur peut consulter l'historique des versions avec timestamps et descriptions

**NonFunctional:**
- NFR2: Rendu grille — Scroll fluide 60fps (applique aussi au VersionPanel)

## Next Steps

After this story:
- **Story 3.3:** Restauration de Version en Un Clic (ajouter bouton "Restaurer" dans VersionItem)
