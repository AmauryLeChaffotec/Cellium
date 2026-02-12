# Story 2.2: Barre de Commande IA

Status: ready-for-dev

## Story

As a utilisateur,
I want saisir une commande en langage naturel et voir un retour de l'IA,
So that je peux demander des manipulations de données sans écrire de formules.

## Acceptance Criteria

1. **Given** l'application est ouverte **When** l'utilisateur regarde l'interface **Then** une barre de commande est visible avec le placeholder "Décrivez ce que vous voulez faire..." (FR7)
2. **Given** l'utilisateur a saisi une commande **When** il appuie sur Enter ou clique sur Envoyer **Then** le commandStore passe en `isLoading: true` **And** un indicateur de chargement s'affiche **And** la requête est envoyée au backend avec la commande et le GridMetadata (FR7)
3. **Given** le backend retourne des opérations **When** la réponse arrive **Then** le commandStore passe en `isLoading: false` **And** les opérations sont transmises au diffStore (FR8)
4. **Given** le backend retourne une clarification **When** la commande est ambiguë **Then** le message de clarification s'affiche dans l'UI en français (FR9)
5. **Given** le backend retourne une erreur **When** le LLM échoue **Then** un message d'erreur user-friendly s'affiche en français (NFR12)
6. **Given** une requête est envoyée **When** la réponse arrive **Then** la réponse arrive en < 3 secondes pour P50 (NFR1)

## Tasks / Subtasks

- [ ] Task 1: Créer `commandStore.ts` — Zustand store pour l'état de la barre de commande (AC: #2, #3, #4, #5)
  - [ ] 1.1 Définir l'interface `CommandStore` avec : `isLoading`, `error`, `clarification`, `commandHistory`
  - [ ] 1.2 Ajouter action `sendCommand(command: string)` qui appelle l'API `/api/ai/command`
  - [ ] 1.3 Construire `GridMetadata` depuis le gridStore (headers, columnTypes, rowCount, sampleRows limité à 5)
  - [ ] 1.4 Gérer les 3 cas de réponse : succès (opérations → diffStore), clarification (afficher message), erreur (afficher erreur)
  - [ ] 1.5 Ajouter action `clearError()` et `clearClarification()` pour réinitialiser les messages
- [ ] Task 2: Créer `commandStore.test.ts` — Tests unitaires du store (AC: #2-5)
  - [ ] 2.1 Mocker `fetch` pour isoler les tests de l'API réelle
  - [ ] 2.2 Tester `sendCommand()` avec succès → isLoading: true puis false, opérations passées au diffStore
  - [ ] 2.3 Tester `sendCommand()` avec clarification → clarification stockée, pas d'opérations
  - [ ] 2.4 Tester `sendCommand()` avec erreur réseau → error stockée avec message user-friendly
  - [ ] 2.5 Tester `sendCommand()` avec erreur 503 LLM → error stockée avec message approprié
  - [ ] 2.6 Tester que GridMetadata contient bien headers, columnTypes, rowCount, sampleRows (max 5)
- [ ] Task 3: Créer composant `CommandBar.tsx` — UI de la barre de commande (AC: #1, #2, #4, #5)
  - [ ] 3.1 Input avec placeholder "Décrivez ce que vous voulez faire..."
  - [ ] 3.2 Bouton "Envoyer" (ou Enter pour soumettre)
  - [ ] 3.3 Indicateur de chargement (spinner) quand `isLoading: true`
  - [ ] 3.4 Affichage message clarification en jaune si `clarification` existe
  - [ ] 3.5 Affichage message erreur en rouge si `error` existe
  - [ ] 3.6 Désactiver input et bouton pendant `isLoading`
- [ ] Task 4: Créer `CommandBar.test.tsx` — Tests du composant (AC: #1-5)
  - [ ] 4.1 Tester rendu initial : input visible avec placeholder correct
  - [ ] 4.2 Tester soumission commande via bouton → `sendCommand` appelé
  - [ ] 4.3 Tester soumission commande via Enter → `sendCommand` appelé
  - [ ] 4.4 Tester affichage spinner pendant isLoading
  - [ ] 4.5 Tester affichage message clarification
  - [ ] 4.6 Tester affichage message erreur
  - [ ] 4.7 Tester désactivation input/bouton pendant isLoading
- [ ] Task 5: Intégrer CommandBar dans `App.tsx` (AC: #1)
  - [ ] 5.1 Importer et rendre `<CommandBar />` en haut de l'application
  - [ ] 5.2 Vérifier visuellement que la barre s'affiche correctement
- [ ] Task 6: Validation finale (AC: #1-6)
  - [ ] 6.1 Tous les tests passent (`npm test`)
  - [ ] 6.2 Build TypeScript compile sans erreur (`npm run build`)
  - [ ] 6.3 Test manuel : taper commande → voir spinner → recevoir clarification ou erreur (backend doit être démarré)
  - [ ] 6.4 Vérifier que GridMetadata n'envoie que 5 sampleRows max (pas la grille complète)

## Dev Notes

### Architecture Compliance

**Source : [architecture.md](../../_bmad-output/planning-artifacts/architecture.md)**

Cette story implémente la barre de commande IA qui est le point d'entrée utilisateur pour l'interaction NLP. Le commandStore DOIT appeler le backend POST /api/ai/command (créé dans Story 2.1) et gérer les 3 cas de réponse. Le GridMetadata envoyé au backend DOIT contenir uniquement les métadonnées (NFR15 : pas la grille complète).

### CommandStore — Zustand avec Immer

**Fichier `src/stores/commandStore.ts` :**

```typescript
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { Operation } from '../types/operations';
import type { CommandRequest, CommandResponse, ErrorResponse } from '../types/api';
import { useGridStore } from './gridStore';
import { useDiffStore } from './diffStore';

interface CommandStore {
  isLoading: boolean;
  error: string | null;
  clarification: string | null;
  commandHistory: string[];

  sendCommand: (command: string) => Promise<void>;
  clearError: () => void;
  clearClarification: () => void;
}

export const useCommandStore = create<CommandStore>()(
  immer((set, get) => ({
    isLoading: false,
    error: null,
    clarification: null,
    commandHistory: [],

    sendCommand: async (command: string) => {
      // Clear previous messages
      set((state) => {
        state.error = null;
        state.clarification = null;
        state.isLoading = true;
      });

      // Build GridMetadata from gridStore
      const { cells, rowCount, colCount } = useGridStore.getState();

      // Extract headers (A-Z based on colCount)
      const headers = Array.from({ length: colCount }, (_, i) =>
        String.fromCharCode(65 + i)
      );

      // Extract column types (simplified: all "text" for now)
      const columnTypes: Record<string, string> = {};
      headers.forEach((h) => {
        columnTypes[h] = 'text';
      });

      // Extract sample rows (max 5)
      const sampleRows: Record<string, any>[] = [];
      for (let row = 1; row <= Math.min(5, rowCount); row++) {
        const rowData: Record<string, any> = {};
        headers.forEach((col) => {
          const cellId = `${col}${row}`;
          if (cells[cellId]) {
            rowData[cellId] = cells[cellId];
          }
        });
        if (Object.keys(rowData).length > 0) {
          sampleRows.push(rowData);
        }
      }

      const requestBody: CommandRequest = {
        command,
        gridContext: {
          headers,
          columnTypes,
          rowCount,
          sampleRows,
        },
      };

      try {
        const response = await fetch('/api/ai/command', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        });

        const data = await response.json();

        if (!response.ok) {
          // HTTP error (400, 503, etc.)
          const errorData = data as ErrorResponse;
          set((state) => {
            state.isLoading = false;
            state.error = `Erreur: ${errorData.error || 'Erreur inconnue'}`;
          });
          return;
        }

        // Check if clarification
        if (data.operations.length === 0 && data.clarification) {
          set((state) => {
            state.isLoading = false;
            state.clarification = data.clarification;
          });
          return;
        }

        // Success: send operations to diffStore
        const diffStore = useDiffStore.getState();
        diffStore.setPendingOperations(data.operations, data.description);

        set((state) => {
          state.isLoading = false;
          state.commandHistory.push(command);
        });
      } catch (error) {
        // Network error
        set((state) => {
          state.isLoading = false;
          state.error = 'Erreur réseau: impossible de contacter le serveur';
        });
      }
    },

    clearError: () =>
      set((state) => {
        state.error = null;
      }),

    clearClarification: () =>
      set((state) => {
        state.clarification = null;
      }),
  }))
);
```

### CommandBar Component — React + Tailwind

**Fichier `src/components/CommandBar/CommandBar.tsx` :**

```typescript
import { useState } from 'react';
import { useCommandStore } from '../../stores/commandStore';

export function CommandBar() {
  const [input, setInput] = useState('');

  const isLoading = useCommandStore((s) => s.isLoading);
  const error = useCommandStore((s) => s.error);
  const clarification = useCommandStore((s) => s.clarification);
  const sendCommand = useCommandStore((s) => s.sendCommand);
  const clearError = useCommandStore((s) => s.clearError);
  const clearClarification = useCommandStore((s) => s.clearClarification);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    sendCommand(input);
    setInput(''); // Clear input after send
  };

  const handleDismissError = () => {
    clearError();
  };

  const handleDismissClarification = () => {
    clearClarification();
  };

  return (
    <div className="p-4 border-b border-gray-300">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Décrivez ce que vous voulez faire..."
          disabled={isLoading}
          className="flex-1 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Envoi...' : 'Envoyer'}
        </button>
      </form>

      {/* Loading indicator */}
      {isLoading && (
        <div className="mt-2 text-sm text-gray-600">
          <span className="inline-block animate-spin mr-2">⏳</span>
          Traitement de votre commande...
        </div>
      )}

      {/* Clarification message */}
      {clarification && (
        <div className="mt-2 p-3 bg-yellow-100 border border-yellow-400 text-yellow-800 rounded">
          <div className="flex justify-between items-start">
            <div>
              <strong>Clarification nécessaire:</strong>
              <p className="mt-1">{clarification}</p>
            </div>
            <button
              onClick={handleDismissClarification}
              className="ml-2 text-yellow-600 hover:text-yellow-800"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="mt-2 p-3 bg-red-100 border border-red-400 text-red-800 rounded">
          <div className="flex justify-between items-start">
            <div>
              <strong>Erreur:</strong>
              <p className="mt-1">{error}</p>
            </div>
            <button
              onClick={handleDismissError}
              className="ml-2 text-red-600 hover:text-red-800"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
```

### DiffStore Stub — À créer pour l'intégration

**Note:** Le diffStore n'existe pas encore (Story 2.4), donc pour cette story, nous devons créer un **stub minimal** pour que commandStore puisse compiler.

**Fichier `src/stores/diffStore.ts` (stub minimal) :**

```typescript
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { Operation } from '../types/operations';

interface DiffStore {
  pendingOperations: Operation[];
  description: string | null;

  setPendingOperations: (operations: Operation[], description: string) => void;
  clearPending: () => void;
}

export const useDiffStore = create<DiffStore>()(
  immer((set) => ({
    pendingOperations: [],
    description: null,

    setPendingOperations: (operations, description) =>
      set((state) => {
        state.pendingOperations = operations;
        state.description = description;
      }),

    clearPending: () =>
      set((state) => {
        state.pendingOperations = [];
        state.description = null;
      }),
  }))
);
```

### Testing Strategy

**Mocking fetch dans les tests :**

```typescript
// Mock global fetch
global.fetch = vi.fn();

// Mock successful response
(global.fetch as jest.Mock).mockResolvedValue({
  ok: true,
  json: async () => ({
    operations: [{ type: 'SET_VALUE', cellId: 'A1', value: 123 }],
    description: 'Test',
  }),
});
```

**Testing avec happy-dom :**

```typescript
// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCommandStore } from './commandStore';
```

### API Integration

**Endpoint backend (déjà créé dans Story 2.1) :**

```
POST /api/ai/command
```

**Request format (CommandRequest) :**

```typescript
{
  command: string,
  gridContext: {
    headers: string[],
    columnTypes: Record<string, string>,
    rowCount: number,
    sampleRows: Record<string, any>[]  // Max 5 rows
  }
}
```

**Response formats :**

```typescript
// Success
{ operations: Operation[], description: string }

// Clarification
{ operations: [], clarification: string }

// Error
{ error: string, code: 'INVALID_COMMAND' | 'MISSING_CONTEXT' | 'LLM_TIMEOUT' | 'LLM_ERROR' }
```

### Previous Story Intelligence (Stories 1.1 → 2.1)

**Learnings critiques des stories précédentes :**

1. **Story 1.1 — Types TypeScript :**
   - `Operation`, `CommandRequest`, `CommandResponse`, `ErrorResponse` déjà définis dans `src/types/api.ts` et `src/types/operations.ts`
   - Utiliser ces types existants, ne pas les redéfinir

2. **Story 1.6 — Zustand Patterns :**
   - Zustand v5 avec Immer: `create<T>()(immer((set, get) => ({...})))` — double parenthèses
   - Sélecteurs atomiques: `useCommandStore((s) => s.isLoading)`
   - Actions async dans le store: permis (contrairement à Redux)

3. **Story 2.1 — Backend API :**
   - POST /api/ai/command déjà implémenté et testé (12 tests passent)
   - Retourne JSON en camelCase (operations, description, clarification, error)
   - 3 cas de réponse: succès, clarification, erreur

4. **Story 1.2-1.6 — Component Patterns :**
   - Tailwind CSS v4 via `@tailwindcss/vite` plugin
   - Tests co-localisés: `Component.test.tsx` à côté de `Component.tsx`
   - happy-dom (PAS jsdom): `// @vitest-environment happy-dom`
   - @testing-library/react pour les tests de composants

5. **Story 1.5 — React 19 :**
   - Hooks refs: `useRef(null)` avec argument initial requis
   - act() pour wrapper les state updates dans les tests

### Contraintes et Points d'Attention

1. **GridMetadata limité à 5 sampleRows** — NFR15 : ne pas envoyer la grille complète au backend. Limiter à 5 lignes d'exemple max.
2. **DiffStore stub** — Le diffStore complet sera créé dans Story 2.4. Pour l'instant, créer un stub minimal avec `setPendingOperations()` pour que commandStore compile.
3. **Error messages en français** — Tous les messages UI doivent être en français (clarification, erreurs).
4. **Timeout 3s** — NFR1 demande < 3s. Le backend a déjà un timeout 10s. L'UI doit juste afficher un spinner pendant l'attente.
5. **Désactiver input pendant isLoading** — Empêcher l'utilisateur d'envoyer plusieurs commandes simultanément.
6. **Tests mocks fetch** — Mocker `fetch` globalement pour isoler les tests de l'API réelle.

### Scope — Ce qui est HORS de cette story

- **DiffStore complet** → Story 2.4 (cette story crée juste un stub minimal)
- **DiffOverlay visuel** → Story 2.4 (affichage des modifications vert/orange/rouge)
- **Moteur d'application des opérations** → Story 2.3
- **Validation/Refus des opérations** → Story 2.5
- **Historique des commandes** → Post-MVP (commandHistory existe dans le store mais pas d'UI)

### Project Structure Notes

Fichiers créés/modifiés par cette story :

```
frontend/src/
├── stores/
│   ├── commandStore.ts           (new — Zustand store pour barre de commande)
│   ├── commandStore.test.ts      (new — tests commandStore)
│   └── diffStore.ts               (new — stub minimal pour l'intégration)
├── components/CommandBar/
│   ├── CommandBar.tsx             (new — composant UI barre de commande)
│   ├── CommandBar.test.tsx        (new — tests CommandBar)
│   └── index.ts                   (new — re-export)
└── App.tsx                        (modified — ajout <CommandBar />)
```

### References

- [Source: architecture.md#Frontend Architecture] — commandStore, fetch /api/ai/command
- [Source: architecture.md#API & Communication Patterns] — CommandRequest, CommandResponse
- [Source: epics.md#Story 2.2] — User story, acceptance criteria
- [Source: Story 2.1] — Backend POST /api/ai/command implémenté
- [Source: Story 1.6] — Zustand v5 + Immer patterns

## Dev Agent Record

### Agent Model Used

Claude Sonnet 4.5

### Debug Log References

### Completion Notes List

### File List
