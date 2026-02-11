---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8]
lastStep: 8
status: 'complete'
completedAt: '2026-02-11'
inputDocuments:
  - 'prd.md'
  - 'product-brief-Cellium-2026-02-11.md'
  - '_bmad-output/brainstorming/brainstorming-session-2026-02-11.md'
workflowType: 'architecture'
project_name: 'Cellium'
user_name: 'Amaurylechaffotec'
date: '2026-02-11'
---

# Architecture Decision Document

_This document builds collaboratively through step-by-step discovery. Sections are appended as we work through each architectural decision together._

## Project Context Analysis

### Requirements Overview

**Functional Requirements (29 FRs, 6 domaines) :**

| Domaine | FRs | Implication architecturale |
|---------|-----|---------------------------|
| Tableur & Saisie (FR1-6) | Grille interactive, édition manuelle, navigation clavier | Composant Grid avec virtualisation, gestion de focus et sélection |
| Commande IA NLP (FR7-9) | Barre de commande, interprétation, feedback erreurs | Module NLP → API LLM, parser de réponse structurée, composant UI commande |
| Opérations IA (FR10-16) | Ajout/suppression colonnes/lignes, formules, tri, format, remplissage | Engine d'opérations typées, dispatcher d'actions, moteur de calcul |
| Diff & Validation (FR17-21) | Affichage diff, distinction types, valider/refuser, garantie contrôle | Couche diff overlay sur la grille, state machine pending/applied/rejected |
| Architecture Données (FR22-25) | Cellules JSON indépendantes, patches atomiques, persistence locale, capacité | Store de données cellulaire, moteur de patches, adapter LocalStorage/IndexedDB |
| Gestion Versions (FR26-29) | Snapshots auto, historique, restauration, stockage incrémental | Module versioning avec delta-based snapshots, store immuable |

**Non-Functional Requirements (18 NFRs, 4 catégories) :**

| Catégorie | NFRs critiques | Impact architectural |
|-----------|---------------|---------------------|
| Performance | < 3s réponse IA, 1000 lignes < 500ms, diff < 200ms | Virtualisation grid, optimisation state updates, async API |
| Sécurité | Clé API jamais client-side, HTTPS, données minimales au LLM | Backend proxy obligatoire, filtrage contexte avant envoi |
| Intégration LLM | JSON structuré, gestion erreurs, > 80% précision | Schéma validation réponse, retry logic, prompt engineering |
| Fiabilité | Auto-save 30s, récupération crash, snapshots immuables | Persistence layer robuste, transaction-like writes |

### Scale & Complexity

- **Domaine primaire :** Frontend SPA avec intégration LLM
- **Niveau de complexité :** Moyen — frontend riche mais backend minimal
- **Composants architecturaux estimés :** 8-10 modules

### Technical Constraints & Dependencies

1. **Proxy backend obligatoire** — La clé API LLM ne doit jamais être exposée côté client (NFR8)
2. **Réponse LLM structurée** — Le modèle doit retourner des opérations JSON typées, pas du texte libre (NFR14)
3. **Virtualisation dès le départ** — 26 000 cellules potentielles imposent un rendu virtuel (NFR2)
4. **Persistence locale fiable** — Auto-save + crash recovery côté client (NFR16-17)
5. **Delta snapshots** — Stockage incrémental des versions, pas de copies complètes (FR29, NFR18)

### Cross-Cutting Concerns

| Concern | Composants affectés | Description |
|---------|-------------------|-------------|
| **Performance rendu** | Grid, Diff overlay, Version restore | Toute interaction doit rester fluide à 60fps |
| **Intégrité des données** | Store cellulaire, Versioning, Persistence | Aucune perte de données, snapshots immuables |
| **Sécurité API** | Backend proxy, LLM integration | Clé API protégée, données minimales envoyées |
| **Gestion d'état multi-couches** | Grid state, Pending diffs, Version history, Command state | 4 couches d'état qui doivent coexister sans conflits |

## Starter Template Evaluation

### Primary Technology Domain

Frontend SPA (React TypeScript) + Backend API minimal (Flask Python) — architecture split justifiée par la nature du projet : frontend riche, backend proxy léger.

### Starter Options Considered

| Option | Pour | Contre | Verdict |
|--------|------|--------|---------|
| **Vite + react-ts** (officiel) | Rapide, minimal, standard | Rien inclus (state, styling) | **Sélectionné** |
| Next.js | SSR, routing, API routes | Overkill pour SPA pure, complexité inutile | Rejeté |
| T3 Stack | Full-stack TypeScript | Pas de Flask, trop opinionated | Rejeté |
| CRA (Create React App) | Familier | Déprécié, lent | Rejeté |

### Selected Starter: Vite + React TypeScript (Frontend)

**Commande d'initialisation :**

```bash
npm create vite@latest cellium-app -- --template react-ts
```

**Décisions architecturales du starter :**

- **Langage :** TypeScript (strict mode)
- **Runtime :** React 19+
- **Build :** Vite 6.x (ESBuild + Rollup)
- **Dev Server :** HMR instantané
- **Linting :** ESLint préconfiguré

**À ajouter après scaffold :**

| Besoin | Choix recommandé | Justification |
|--------|------------------|---------------|
| State Management | Zustand | Léger, adapté au multi-store (grid, diffs, versions, command) |
| Virtualisation grille | react-window | Mature, performant, API simple pour grille |
| Styling | Tailwind CSS | Prototypage rapide, classes utilitaires, petit bundle |
| Tests | Vitest | Natif Vite, rapide, compatible Jest API |
| HTTP Client | fetch natif | Suffisant pour 1 endpoint API |

### Selected Starter: Flask minimal (Backend)

**Commande d'initialisation :**

```bash
pip install flask flask-cors openai python-dotenv
```

**Structure backend MVP :**

```
backend/
├── app.py              # Flask app, route POST /api/ai/command
├── requirements.txt    # flask, flask-cors, openai, python-dotenv
└── .env               # OPENAI_API_KEY (ou équivalent)
```

**Responsabilité unique du backend MVP :** Proxy LLM — reçoit commande + contexte grille, appelle l'API LLM, retourne opérations JSON structurées.

## Core Architectural Decisions

### Decision Priority Analysis

**Décisions critiques (bloquent l'implémentation) :**
1. Modèle de données Cell (JSON schema)
2. Format des opérations IA (8 types structurés)
3. Contrat API backend (request/response)
4. Structure des Zustand stores (4 stores)
5. Stratégie de persistence (IndexedDB)

**Décisions importantes (façonnent l'architecture) :**
6. Hiérarchie des composants React
7. Format des delta snapshots pour le versioning
8. Stratégie d'envoi du contexte grille au LLM (métadonnées seulement)

**Décisions différées (post-MVP) :**
- Authentification utilisateur
- CI/CD pipeline
- Monitoring / logging
- Scaling strategy

### Data Architecture

**Cell Model :**

```typescript
interface CellFormat {
  bold?: boolean;
  currency?: string;
  decimals?: number;
}

interface Cell {
  id: string;                      // "A1", "B3"
  value: string | number | null;
  formula?: string;                // "=SUM(A1:A10)"
  format?: CellFormat;
}

type Grid = Record<string, Cell>;  // Map clé=id → Cell
```

**Operations Schema (8 types) :**

```typescript
type Operation =
  | { type: 'SET_VALUE'; cellId: string; value: string | number }
  | { type: 'SET_FORMULA'; cellId: string; formula: string }
  | { type: 'INSERT_ROW'; afterRow: number; cells: Cell[] }
  | { type: 'INSERT_COLUMN'; afterCol: string; header: string; cells: Cell[] }
  | { type: 'DELETE_ROW'; row: number }
  | { type: 'DELETE_COLUMN'; col: string }
  | { type: 'SORT'; column: string; direction: 'asc' | 'desc' }
  | { type: 'FORMAT'; cellIds: string[]; format: CellFormat }
```

**Persistence :** IndexedDB via `idb` (wrapper léger) — supporte données structurées volumineuses, pas de limite 5MB.

**Versioning (delta snapshots) :** Chaque version stocke la liste d'opérations appliquées depuis la version précédente + timestamp + description auto-générée. Restauration = replay des opérations depuis la version initiale.

### Authentication & Security

Pas d'authentification MVP. Sécurité limitée au proxy backend : clé API LLM protégée, HTTPS, données minimales envoyées au LLM.

### API & Communication Patterns

**Endpoint unique :**

```
POST /api/ai/command
Request:  { command: string, gridContext: GridMetadata }
Response: { operations: Operation[], description: string }
```

**GridMetadata** (envoyé au LLM — PAS toute la grille) :
- Headers des colonnes
- Types de données par colonne
- Nombre de lignes
- 3-5 lignes d'exemple représentatives

**Gestion d'erreurs :**
- LLM timeout/erreur → HTTP 503 + message user-friendly
- Commande ambiguë → HTTP 200 + `{ operations: [], clarification: string }`
- Commande invalide → HTTP 400 + description de l'erreur

### Frontend Architecture

**State Management — 4 Zustand stores indépendants :**

| Store | Responsabilité | Données clés |
|-------|---------------|--------------|
| `gridStore` | Données grille courante | cells, rows, columns, selectedCell |
| `diffStore` | Opérations en attente de validation | pendingOps, diffType, isActive |
| `versionStore` | Historique des snapshots | versions[], currentVersionIndex |
| `commandStore` | État barre de commande | isLoading, error, commandHistory |

**Component Hierarchy :**

```
<App>
  <CommandBar />
  <SpreadsheetGrid>
    <GridHeader />
    <VirtualizedRows>       # react-window FixedSizeGrid
      <Cell />
      <DiffOverlay />
    </VirtualizedRows>
  </SpreadsheetGrid>
  <DiffActionBar />         # Valider/Refuser (si diff actif)
  <VersionPanel />          # Historique versions
</App>
```

### Infrastructure & Deployment

| Composant | Solution MVP | Justification |
|-----------|-------------|---------------|
| Frontend hosting | Vercel | Gratuit, auto-deploy, CDN global |
| Backend hosting | Railway ou Render | Gratuit tier, Flask simple |
| LLM Provider | OpenAI API (ou Anthropic) | API mature, JSON mode disponible |
| Env config | `.env` backend uniquement | Clé API jamais côté client |

### Decision Impact — Séquence d'Implémentation

1. Scaffold Vite + React TS + dépendances (Zustand, react-window, Tailwind)
2. Types TypeScript (Cell, Grid, Operation, GridMetadata)
3. gridStore + composant SpreadsheetGrid avec virtualisation
4. Flask backend proxy LLM (POST /api/ai/command)
5. CommandBar + commandStore → appel API → réception opérations
6. diffStore + DiffOverlay + DiffActionBar (Valider/Refuser)
7. versionStore + VersionPanel (snapshots, historique, restauration)

## Implementation Patterns & Consistency Rules

### Points de Conflit Identifiés

**18 zones** où des agents IA pourraient faire des choix divergents — toutes résolues ci-dessous.

### Naming Patterns

**Code Naming — Frontend (TypeScript/React) :**

| Élément | Convention | Exemple |
|---------|-----------|---------|
| Composants React | PascalCase | `CommandBar`, `DiffOverlay` |
| Fichiers composants | PascalCase.tsx | `CommandBar.tsx`, `Cell.tsx` |
| Hooks custom | camelCase avec `use` | `useGridStore`, `useDiffActions` |
| Fonctions/variables | camelCase | `applyOperations`, `pendingOps` |
| Constantes | UPPER_SNAKE_CASE | `MAX_ROWS`, `DEFAULT_CELL_FORMAT` |
| Types/Interfaces | PascalCase (sans préfixe I) | `Cell`, `Operation`, `GridMetadata` |
| Fichiers stores | camelCase.ts | `gridStore.ts`, `diffStore.ts` |
| Fichiers utilitaires | camelCase.ts | `formulaEngine.ts`, `cellUtils.ts` |

**Code Naming — Backend (Python/Flask) :**

| Élément | Convention | Exemple |
|---------|-----------|---------|
| Fonctions | snake_case | `parse_command`, `call_llm` |
| Variables | snake_case | `grid_context`, `api_key` |
| Constantes | UPPER_SNAKE_CASE | `MAX_RETRIES`, `LLM_TIMEOUT` |
| Fichiers | snake_case.py | `app.py`, `llm_service.py` |
| Classes | PascalCase | `CommandParser`, `LLMResponse` |

**API Naming :**

| Élément | Convention | Exemple |
|---------|-----------|---------|
| Endpoints | kebab-case, verbe HTTP | `POST /api/ai/command` |
| JSON fields (request/response) | camelCase | `gridContext`, `cellId`, `operations` |

**IndexedDB Naming :**

| Élément | Convention | Exemple |
|---------|-----------|---------|
| Database name | kebab-case | `cellium-db` |
| Object stores | camelCase | `gridData`, `versionHistory` |
| Index names | camelCase | `byTimestamp`, `byDescription` |

### Structure Patterns

**Organisation projet frontend :**

```
src/
├── components/           # Composants React par feature
│   ├── CommandBar/
│   │   ├── CommandBar.tsx
│   │   ├── CommandBar.test.tsx    # Tests co-localisés
│   │   └── index.ts               # Re-export
│   ├── Grid/
│   │   ├── SpreadsheetGrid.tsx
│   │   ├── Cell.tsx
│   │   ├── GridHeader.tsx
│   │   ├── VirtualizedRows.tsx
│   │   └── index.ts
│   ├── Diff/
│   │   ├── DiffOverlay.tsx
│   │   ├── DiffActionBar.tsx
│   │   └── index.ts
│   └── Version/
│       ├── VersionPanel.tsx
│       └── index.ts
├── stores/               # Zustand stores
│   ├── gridStore.ts
│   ├── diffStore.ts
│   ├── versionStore.ts
│   └── commandStore.ts
├── types/                # Types TypeScript partagés
│   ├── cell.ts           # Cell, Grid, CellFormat
│   ├── operations.ts     # Operation (8 types)
│   └── api.ts            # Request/Response types
├── utils/                # Utilitaires purs
│   ├── cellUtils.ts      # Helpers conversion cellId ↔ row/col
│   ├── formulaEngine.ts  # Évaluation formules
│   └── persistence.ts    # Wrapper IndexedDB
├── hooks/                # Hooks custom partagés
│   └── useKeyboardNav.ts
├── App.tsx
├── main.tsx
└── index.css             # Tailwind directives
```

**Règles de structure :**
- Tests **co-localisés** : `Component.test.tsx` à côté de `Component.tsx`
- **1 composant principal = 1 dossier** avec `index.ts` pour re-export
- **Pas de fichier barrel** global — imports directs
- Stores dans `/stores`, types dans `/types`, utils dans `/utils`

### Format Patterns

**API Response Formats :**

```typescript
// Succès
{ operations: Operation[], description: string }

// Clarification nécessaire
{ operations: [], clarification: string }

// Erreur client
{ error: string, code: 'INVALID_COMMAND' | 'MISSING_CONTEXT' }

// Erreur serveur (HTTP 503)
{ error: string, code: 'LLM_TIMEOUT' | 'LLM_ERROR' }
```

**Conventions format :**
- **JSON :** camelCase partout (frontend ET backend). Flask convertit snake_case → camelCase dans la réponse
- **Dates :** ISO 8601 strings (`"2026-02-11T14:30:00Z"`) partout
- **Null handling :** `null` explicite en JSON, `undefined` pour champs optionnels TypeScript (`formula?`, `format?`)

### Communication Patterns (State Management)

**Zustand Store Pattern standard :**

```typescript
interface GridStore {
  // State
  cells: Grid;
  selectedCell: string | null;
  rowCount: number;
  colCount: number;

  // Actions (verbeNom en camelCase)
  setCell: (id: string, cell: Cell) => void;
  selectCell: (id: string | null) => void;
  applyOperations: (ops: Operation[]) => void;
  resetGrid: () => void;
}
```

**Conventions Zustand :**
- Actions nommées `verbeNom` en camelCase (`setCell`, `applyOperations`, `addVersion`)
- Actions **synchrones** dans le store, logique async dans composants/hooks
- **Pas de stores imbriqués** — chaque store est indépendant
- Accès cross-store via `getState()` hors contexte React si nécessaire
- **Immer** pour les updates complexes de `Grid` (Record imbriqué)

### Process Patterns

**Error Handling :**

| Niveau | Pattern | Exemple |
|--------|---------|---------|
| Composant | `try/catch` + state local `error` | CommandBar catch API errors |
| Store | Action `setError(msg)` dans `commandStore` | Erreur LLM affichée dans UI |
| Global | ErrorBoundary React au niveau `<App>` | Crash recovery gracieux |

- Messages user-friendly en **français** dans l'UI
- Messages techniques en **anglais** dans les logs console

**Loading States :**

```typescript
// Pattern standard dans commandStore
isLoading: boolean;       // true pendant l'appel API
error: string | null;     // message d'erreur ou null
```

**Validation :**
- **Frontend :** Validation commande non-vide avant envoi API
- **Backend :** Validation JSON schema de la requête Flask
- **Réponse LLM :** Validation que `operations` est un array d'`Operation` valides

### Enforcement Guidelines

**Tous les agents IA DOIVENT :**
1. Suivre les conventions de nommage ci-dessus — aucune exception
2. Placer les fichiers dans les dossiers spécifiés par la structure projet
3. Utiliser camelCase pour TOUT le JSON échangé entre frontend/backend
4. Co-localiser les tests avec les composants
5. Utiliser le pattern Zustand standard (state + actions verbeNom)
6. ISO 8601 pour toutes les dates
7. Messages UI en français, logs console en anglais

**Anti-Patterns à éviter :**
- `ICell`, `IGrid` (pas de préfixe I pour les interfaces)
- Fichier composant directement à la racine de `src/components/` (toujours dans un dossier feature)
- `snake_case` dans le JSON API (toujours camelCase)
- État async dans les stores (logique async dans hooks/composants)
- `any` en TypeScript (utiliser les types définis dans `/types`)

## Project Structure & Boundaries

### Complete Project Directory Structure

```
cellium/
├── frontend/                          # Vite + React TS SPA
│   ├── package.json
│   ├── vite.config.ts
│   ├── tsconfig.json
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── index.html
│   ├── .env.example                   # VITE_API_URL=http://localhost:5000
│   ├── public/
│   │   └── favicon.svg
│   └── src/
│       ├── main.tsx                   # Entry point React
│       ├── App.tsx                    # Layout principal
│       ├── index.css                  # Tailwind directives
│       ├── components/
│       │   ├── CommandBar/
│       │   │   ├── CommandBar.tsx     # FR7-9 : Barre commande IA
│       │   │   ├── CommandBar.test.tsx
│       │   │   └── index.ts
│       │   ├── Grid/
│       │   │   ├── SpreadsheetGrid.tsx  # FR1-6 : Grille interactive
│       │   │   ├── Cell.tsx             # FR1 : Cellule éditable
│       │   │   ├── GridHeader.tsx       # En-têtes colonnes A-Z
│       │   │   ├── VirtualizedRows.tsx  # NFR2 : react-window
│       │   │   ├── SpreadsheetGrid.test.tsx
│       │   │   ├── Cell.test.tsx
│       │   │   └── index.ts
│       │   ├── Diff/
│       │   │   ├── DiffOverlay.tsx      # FR17-21 : Overlay vert/orange/rouge
│       │   │   ├── DiffActionBar.tsx    # FR20 : Boutons Valider/Refuser
│       │   │   ├── DiffOverlay.test.tsx
│       │   │   └── index.ts
│       │   └── Version/
│       │       ├── VersionPanel.tsx     # FR26-29 : Historique versions
│       │       ├── VersionPanel.test.tsx
│       │       └── index.ts
│       ├── stores/
│       │   ├── gridStore.ts           # FR22-25 : Données grille
│       │   ├── diffStore.ts           # FR17-21 : Opérations pendantes
│       │   ├── versionStore.ts        # FR26-29 : Snapshots delta
│       │   └── commandStore.ts        # FR7-9 : État commande IA
│       ├── types/
│       │   ├── cell.ts                # Cell, Grid, CellFormat
│       │   ├── operations.ts          # Operation (8 types)
│       │   └── api.ts                 # CommandRequest, CommandResponse
│       ├── utils/
│       │   ├── cellUtils.ts           # Conversion cellId ↔ row/col
│       │   ├── formulaEngine.ts       # FR13 : Évaluation formules
│       │   └── persistence.ts         # NFR16-17 : Wrapper IndexedDB (idb)
│       └── hooks/
│           └── useKeyboardNav.ts      # FR5 : Navigation clavier
│
├── backend/                           # Flask Python — proxy LLM
│   ├── app.py                         # Flask app + route POST /api/ai/command
│   ├── llm_service.py                 # Appel API LLM + prompt engineering
│   ├── validators.py                  # Validation request JSON
│   ├── requirements.txt               # flask, flask-cors, openai, python-dotenv
│   ├── .env                           # OPENAI_API_KEY (gitignored)
│   └── .env.example                   # Template sans secrets
│
├── .gitignore
└── README.md
```

### Architectural Boundaries

**Boundary API (Frontend ↔ Backend) :**

```
Frontend (fetch)  →  POST /api/ai/command  →  Backend (Flask)  →  LLM API
                  ←  { operations, description }  ←
```

- **Seul point de contact** : `POST /api/ai/command`
- Le frontend n'a JAMAIS accès à la clé API LLM
- Le backend ne connaît PAS l'état complet de la grille — uniquement `GridMetadata`

**Boundary State (4 stores indépendants) :**

```
commandStore → (API call) → diffStore → (validate) → gridStore
                                                    → versionStore
```

- `commandStore` : déclenche l'appel API, reçoit les opérations
- `diffStore` : stocke les opérations en attente, gère le preview
- `gridStore` : applique les opérations validées à la grille
- `versionStore` : crée un snapshot delta après validation

**Boundary Persistence (IndexedDB) :**

| Object Store | Contenu | Accès depuis |
|-------------|---------|-------------|
| `gridData` | État courant de la grille (Grid) | `gridStore` via `persistence.ts` |
| `versionHistory` | Array de delta snapshots | `versionStore` via `persistence.ts` |

- Toutes les opérations IndexedDB passent par `persistence.ts` (adapter unique)
- Auto-save toutes les 30 secondes (NFR16)

### Requirements to Structure Mapping

| Domaine FR | Fichiers principaux | Stores impliqués |
|-----------|-------------------|-----------------|
| Tableur & Saisie (FR1-6) | `Grid/SpreadsheetGrid.tsx`, `Grid/Cell.tsx`, `hooks/useKeyboardNav.ts` | `gridStore` |
| Commande IA NLP (FR7-9) | `CommandBar/CommandBar.tsx`, `backend/app.py`, `backend/llm_service.py` | `commandStore` |
| Opérations IA (FR10-16) | `types/operations.ts`, `utils/formulaEngine.ts`, `gridStore.ts` | `gridStore`, `diffStore` |
| Diff & Validation (FR17-21) | `Diff/DiffOverlay.tsx`, `Diff/DiffActionBar.tsx` | `diffStore`, `gridStore` |
| Architecture Données (FR22-25) | `types/cell.ts`, `stores/gridStore.ts`, `utils/persistence.ts` | `gridStore` |
| Gestion Versions (FR26-29) | `Version/VersionPanel.tsx`, `stores/versionStore.ts` | `versionStore` |

### Cross-Cutting Concerns Mapping

| Concern | Fichiers impliqués |
|---------|-------------------|
| Performance rendu (NFR2) | `VirtualizedRows.tsx` (react-window), `gridStore.ts` (Immer) |
| Intégrité données (NFR16-17) | `persistence.ts`, `versionStore.ts`, `gridStore.ts` |
| Sécurité API (NFR8) | `backend/app.py` (proxy), `.env` (secrets) |
| Gestion erreurs | `commandStore.ts` (setError), `App.tsx` (ErrorBoundary) |

### Data Flow Complet

```
1. User tape commande     → CommandBar → commandStore.sendCommand()
2. fetch POST /api/ai/command { command, gridContext }
3. Flask → llm_service    → OpenAI API → opérations JSON
4. Response               → commandStore → diffStore.setPendingOps(operations)
5. DiffOverlay affiche preview (vert/orange/rouge)
6. User clique Valider    → diffStore → gridStore.applyOperations()
7. gridStore              → versionStore.addVersion(delta snapshot)
8. gridStore              → persistence.saveGrid() (IndexedDB)
```

### Development Workflow

**Dev Server :**
- Frontend : `cd frontend && npm run dev` → Vite HMR sur `localhost:5173`
- Backend : `cd backend && flask run` → Flask sur `localhost:5000`
- Proxy Vite configuré dans `vite.config.ts` pour `/api` → `localhost:5000`

**Build :**
- Frontend : `npm run build` → `frontend/dist/` (Vite production build)
- Backend : déployé tel quel (Flask)

**Deployment :**
- Frontend `dist/` → Vercel (auto-deploy depuis git)
- Backend → Railway ou Render (auto-deploy depuis git)

## Architecture Validation Results

### Coherence Validation ✅

**Compatibilité des décisions :**
- Vite 6.x + React 19+ + TypeScript — stack officielle, pleinement compatible
- Zustand + Immer — pattern standard, Immer intégré comme middleware Zustand
- react-window + React 19 — compatible, API stable
- Tailwind CSS + Vite — PostCSS pipeline natif
- Flask 3.1.x + flask-cors + openai SDK — stack Python standard
- IndexedDB (idb) — browser natif, pas de conflit

**Consistance des patterns :**
- Naming camelCase (TS) / snake_case (Python) / camelCase (JSON) — frontière claire au niveau Flask
- Tests co-localisés — cohérent avec Vitest + Vite
- 4 stores indépendants — alignés avec la hiérarchie de composants
- Structure par feature — cohérente avec la complexité du projet

**Alignement structure :**
- Chaque domaine FR a un dossier composant dédié
- Les boundaries sont clairement définies (API, State, Persistence)
- Le data flow est linéaire et prévisible

### Requirements Coverage ✅

**Couverture des 29 FRs :**

| Domaine | FRs | Couverture architecturale | Status |
|---------|-----|--------------------------|--------|
| Tableur & Saisie | FR1-6 | Grid/, gridStore, useKeyboardNav | ✅ 6/6 |
| Commande IA NLP | FR7-9 | CommandBar/, commandStore, backend/ | ✅ 3/3 |
| Opérations IA | FR10-16 | types/operations.ts, formulaEngine, gridStore | ✅ 7/7 |
| Diff & Validation | FR17-21 | Diff/, diffStore | ✅ 5/5 |
| Architecture Données | FR22-25 | types/cell.ts, gridStore, persistence | ✅ 4/4 |
| Gestion Versions | FR26-29 | Version/, versionStore | ✅ 4/4 |

**29/29 FRs couverts architecturalement.**

**Couverture des 18 NFRs :**

| NFR | Exigence | Solution architecturale | Status |
|-----|---------|------------------------|--------|
| Performance IA | < 3s réponse | Async fetch, commandStore.isLoading | ✅ |
| Performance grille | 1000 lignes < 500ms | react-window virtualisation | ✅ |
| Performance diff | < 200ms affichage | DiffOverlay léger, Zustand selector | ✅ |
| Sécurité API | Clé jamais client-side | Flask proxy backend, .env | ✅ |
| Sécurité données | Données minimales au LLM | GridMetadata (pas Grid complète) | ✅ |
| HTTPS | Chiffrement transport | Vercel + Railway (HTTPS par défaut) | ✅ |
| JSON structuré | Réponse LLM typée | Operation types + validation | ✅ |
| Précision IA | > 80% | Prompt engineering dans llm_service.py | ✅ |
| Auto-save | Toutes les 30s | persistence.ts (IndexedDB) | ✅ |
| Crash recovery | Récupération données | IndexedDB persistent | ✅ |
| Snapshots immuables | Stockage incrémental | versionStore delta snapshots | ✅ |

**18/18 NFRs couverts.**

### Implementation Readiness ✅

**Complétude des décisions :** Toutes les décisions critiques documentées avec types TypeScript concrets, contrat API défini, stores spécifiés.

**Complétude structure :** Arborescence complète avec 30+ fichiers mappés aux FRs.

**Complétude patterns :** Naming, structure, format, communication et process patterns tous définis avec exemples.

### Gap Analysis

**Gaps critiques : 0**

**Gaps importants résolus :**

1. **Immer** ajouté aux dépendances frontend (manquait dans le tableau initial) :

| Besoin | Choix | Justification |
|--------|-------|---------------|
| Immutable updates | immer | Middleware Zustand pour updates complexes de Grid (Record imbriqué) |

2. **Proxy Vite** — configuration à ajouter dans `vite.config.ts` :

```typescript
server: {
  proxy: {
    '/api': 'http://localhost:5000'
  }
}
```

**Gaps mineurs documentés :**

3. **Scope formulaEngine MVP** : Formules basiques uniquement (`SUM`, `AVERAGE`, `COUNT`, `MIN`, `MAX`), évaluation côté client.

### Architecture Completeness Checklist

**✅ Requirements Analysis**
- [x] Project context analysé (29 FRs, 18 NFRs)
- [x] Scale et complexité évalués (moyen)
- [x] Contraintes techniques identifiées (5)
- [x] Cross-cutting concerns mappés (4)

**✅ Architectural Decisions**
- [x] Décisions critiques documentées avec types TypeScript
- [x] Stack technologique complètement spécifié
- [x] Patterns d'intégration définis (API unique, 4 stores)
- [x] Considérations performance adressées (virtualisation, async)

**✅ Implementation Patterns**
- [x] Conventions de nommage établies (frontend, backend, API, IndexedDB)
- [x] Patterns de structure définis (par feature, co-located tests)
- [x] Patterns de communication spécifiés (Zustand + Immer)
- [x] Patterns de process documentés (error handling, loading, validation)

**✅ Project Structure**
- [x] Arborescence complète définie (frontend + backend)
- [x] Boundaries composants établies (API, State, Persistence)
- [x] Points d'intégration mappés
- [x] Mapping FRs → structure complet

### Architecture Readiness Assessment

**Overall Status : READY FOR IMPLEMENTATION**

**Niveau de confiance : ÉLEVÉ**

**Forces clés :**
- Architecture simple et linéaire — data flow prévisible en 8 étapes
- Séparation nette frontend/backend avec un seul point de contact API
- Types TypeScript concrets qui servent de contrat entre composants
- Patterns explicites qui éliminent l'ambiguïté pour les agents IA

**Améliorations futures (post-MVP) :**
- Authentification utilisateur
- CI/CD pipeline (GitHub Actions)
- Monitoring et logging structuré
- Formules avancées (références croisées, fonctions complexes)
- Export/import CSV, XLSX

### Implementation Handoff

**Directives pour les agents IA :**
- Suivre TOUTES les décisions architecturales exactement comme documentées
- Utiliser les implementation patterns de façon consistante
- Respecter la structure projet et les boundaries
- Se référer à ce document pour toute question architecturale

**Première priorité d'implémentation :**

```bash
# 1. Frontend scaffold
npm create vite@latest cellium-app -- --template react-ts
cd cellium-app
npm install zustand immer react-window tailwindcss postcss autoprefixer idb
npm install -D vitest @testing-library/react @types/react-window

# 2. Backend scaffold
mkdir backend && cd backend
pip install flask flask-cors openai python-dotenv
```
