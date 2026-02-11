# Story 1.1: Scaffold Projet & Types Fondamentaux

Status: review

## Story

As a développeur,
I want un projet Vite + React TS + Flask scaffoldé avec toutes les dépendances et les types TypeScript fondamentaux,
so that la base technique est prête pour construire les features.

## Acceptance Criteria

1. Le frontend Vite + React TS compile sans erreur avec toutes les dépendances (zustand, immer, react-window, tailwindcss, idb, vitest)
2. Le backend Flask démarre avec flask-cors et python-dotenv
3. Le proxy Vite `/api` → `localhost:5000` est configuré et fonctionnel
4. Les types TypeScript sont définis : `Cell`, `CellFormat`, `Grid`, `Operation` (8 types), `GridMetadata`, `CommandRequest`, `CommandResponse`
5. La structure de dossiers correspond à l'architecture (components/, stores/, types/, utils/, hooks/)

## Tasks / Subtasks

- [x] Task 1: Scaffold frontend Vite + React TS (AC: #1, #5)
  - [x] 1.1 Créer `frontend/` via `npm create vite@latest -- --template react-ts`
  - [x] 1.2 Installer dépendances production : `zustand immer react-window idb`
  - [x] 1.3 Installer dépendances dev : `tailwindcss @tailwindcss/vite vitest @testing-library/react @testing-library/jest-dom jsdom @types/react-window`
  - [x] 1.4 Configurer Tailwind CSS v4 (plugin Vite + directives CSS)
  - [x] 1.5 Configurer Vitest dans `vite.config.ts`
  - [x] 1.6 Vérifier `npm run build` passe sans erreur
- [x] Task 2: Configurer proxy Vite (AC: #3)
  - [x] 2.1 Ajouter `server.proxy` dans `vite.config.ts` : `/api` → `http://localhost:5000`
- [x] Task 3: Créer structure de dossiers frontend (AC: #5)
  - [x] 3.1 Créer `src/components/CommandBar/`, `src/components/Grid/`, `src/components/Diff/`, `src/components/Version/`
  - [x] 3.2 Créer `src/stores/`, `src/types/`, `src/utils/`, `src/hooks/`
  - [x] 3.3 Ajouter `.gitkeep` ou `index.ts` dans chaque dossier pour les tracker dans git
- [x] Task 4: Définir types TypeScript (AC: #4)
  - [x] 4.1 Créer `src/types/cell.ts` avec `CellFormat`, `Cell`, `Grid`
  - [x] 4.2 Créer `src/types/operations.ts` avec `Operation` (8 types union)
  - [x] 4.3 Créer `src/types/api.ts` avec `GridMetadata`, `CommandRequest`, `CommandResponse`
  - [x] 4.4 Créer `src/types/index.ts` pour re-exports
- [x] Task 5: Scaffold backend Flask (AC: #2)
  - [x] 5.1 Créer `backend/` avec `app.py`, `requirements.txt`, `.env.example`
  - [x] 5.2 `app.py` : Flask app minimale avec route health check `GET /api/health`
  - [x] 5.3 `requirements.txt` : flask, flask-cors, openai, python-dotenv
  - [x] 5.4 Configurer CORS pour le dev local
- [x] Task 6: Configuration projet racine (AC: #1, #2)
  - [x] 6.1 Créer `.gitignore` (node_modules, dist, __pycache__, .env, .venv)
  - [x] 6.2 Créer `frontend/.env.example` avec `VITE_API_URL=http://localhost:5000`
  - [x] 6.3 Créer `backend/.env.example` avec `OPENAI_API_KEY=your-key-here`
- [x] Task 7: Validation finale (AC: #1-5)
  - [x] 7.1 `cd frontend && npm run build` compile sans erreur
  - [x] 7.2 `cd frontend && npm run dev` lance le dev server
  - [x] 7.3 `cd backend && flask run` démarre sans erreur
  - [x] 7.4 Les types TypeScript n'ont pas d'erreurs de compilation

## Dev Notes

### Architecture Compliance

**Source : [architecture.md](../../_bmad-output/planning-artifacts/architecture.md)**

Ce scaffold DOIT respecter exactement la structure et les conventions du document d'architecture. Pas de liberté créative — chaque fichier et convention est spécifié.

### TypeScript Types — Définitions Exactes

**Fichier `src/types/cell.ts` :**

```typescript
interface CellFormat {
  bold?: boolean;
  currency?: string;
  decimals?: number;
}

interface Cell {
  id: string;                      // Format: "A1", "B3", "Z100"
  value: string | number | null;
  formula?: string;                // "=SUM(A1:A10)"
  format?: CellFormat;
}

type Grid = Record<string, Cell>;  // Clé = cellId (ex: "A1")
```

**Fichier `src/types/operations.ts` :**

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

**Fichier `src/types/api.ts` :**

```typescript
interface GridMetadata {
  headers: string[];
  columnTypes: Record<string, string>;
  rowCount: number;
  sampleRows: Record<string, Cell>[];
}

interface CommandRequest {
  command: string;
  gridContext: GridMetadata;
}

interface CommandResponse {
  operations: Operation[];
  description: string;
}

interface ClarificationResponse {
  operations: [];
  clarification: string;
}

interface ErrorResponse {
  error: string;
  code: 'INVALID_COMMAND' | 'MISSING_CONTEXT' | 'LLM_TIMEOUT' | 'LLM_ERROR';
}
```

### Vite Config Complète

**Fichier `vite.config.ts` :**

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api': 'http://localhost:5000'
    }
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test-setup.ts',
  },
})
```

### Tailwind CSS v4 — Configuration

Tailwind v4 utilise le plugin Vite natif, pas PostCSS. Configuration minimale :

**Fichier `src/index.css` :**

```css
@import "tailwindcss";
```

Pas besoin de `tailwind.config.js` ni `postcss.config.js` avec Tailwind v4 + plugin Vite.

### Backend Flask Minimal

**Fichier `backend/app.py` :**

```python
from flask import Flask
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

@app.route('/api/health')
def health():
    return {'status': 'ok'}
```

**Fichier `backend/requirements.txt` :**

```
flask
flask-cors
openai
python-dotenv
```

### Naming Conventions — OBLIGATOIRES

| Élément | Convention | Exemple |
|---------|-----------|---------|
| Composants React | PascalCase | `CommandBar.tsx` |
| Fichiers composants | PascalCase.tsx | `Cell.tsx` |
| Hooks custom | camelCase avec `use` | `useGridStore` |
| Fonctions/variables | camelCase | `applyOperations` |
| Constantes | UPPER_SNAKE_CASE | `MAX_ROWS` |
| Types/Interfaces | PascalCase sans préfixe I | `Cell`, `Grid` |
| Fichiers stores | camelCase.ts | `gridStore.ts` |
| Fichiers utils | camelCase.ts | `cellUtils.ts` |
| Python fonctions | snake_case | `parse_command` |

**Anti-patterns interdits :**
- `ICell`, `IGrid` — pas de préfixe I
- `any` en TypeScript — utiliser les types définis
- Composant directement à la racine de `src/components/` — toujours dans un sous-dossier feature

### Project Structure Notes

Structure cible exacte après scaffold :

```
cellium/
├── frontend/
│   ├── package.json
│   ├── vite.config.ts
│   ├── tsconfig.json
│   ├── index.html
│   ├── .env.example
│   └── src/
│       ├── main.tsx
│       ├── App.tsx
│       ├── index.css                  # @import "tailwindcss"
│       ├── test-setup.ts              # Vitest setup
│       ├── components/
│       │   ├── CommandBar/
│       │   │   └── index.ts
│       │   ├── Grid/
│       │   │   └── index.ts
│       │   ├── Diff/
│       │   │   └── index.ts
│       │   └── Version/
│       │       └── index.ts
│       ├── stores/                    # Vide — créés dans stories futures
│       ├── types/
│       │   ├── cell.ts
│       │   ├── operations.ts
│       │   ├── api.ts
│       │   └── index.ts
│       ├── utils/                     # Vide — créés dans stories futures
│       └── hooks/                     # Vide — créés dans stories futures
├── backend/
│   ├── app.py
│   ├── requirements.txt
│   ├── .env.example
│   └── .env                           # gitignored
├── .gitignore
└── README.md
```

### References

- [Source: architecture.md#Starter Template Evaluation] — Commandes scaffold et choix technologiques
- [Source: architecture.md#Core Architectural Decisions] — Types TypeScript Cell, Grid, Operation
- [Source: architecture.md#Implementation Patterns] — Conventions naming, structure, format
- [Source: architecture.md#Project Structure & Boundaries] — Arborescence complète du projet
- [Source: epics.md#Story 1.1] — User story et acceptance criteria
- [Source: prd.md#Web App Technical Requirements] — Architecture SPA, stack technique

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

- Vitest jsdom incompatibility with Node 22.7 — resolved by using default node environment for type tests. Component tests will use `// @vitest-environment jsdom` per-file annotation when needed.
- macOS `._` resource fork files interfering with Vitest — resolved by adding `**/._*` to vitest exclude pattern.

### Completion Notes List

- Frontend scaffolded with Vite 7.3.1 + React 19 + TypeScript (strict mode)
- All production deps installed: zustand, immer, react-window, idb
- All dev deps installed: tailwindcss v4, @tailwindcss/vite, vitest, @testing-library/react, @testing-library/jest-dom, jsdom, @types/react-window
- Tailwind CSS v4 configured via Vite plugin (no postcss.config needed)
- Vitest configured with globals and vitest/config reference
- Proxy /api → localhost:5000 configured in vite.config.ts
- 7 TypeScript types defined: CellFormat, Cell, Grid, Operation (8 union types), GridMetadata, CommandRequest, CommandResponse + ClarificationResponse, ErrorResponse
- 16 unit tests written and passing (cell.test.ts, operations.test.ts, api.test.ts)
- Backend Flask with health check endpoint, CORS, dotenv
- Directory structure matches architecture exactly
- `npm run build` passes (tsc -b + vite build)
- Flask health check returns 200 OK

### File List

- frontend/vite.config.ts (modified — added tailwindcss plugin, proxy, vitest config)
- frontend/src/index.css (modified — replaced with Tailwind import)
- frontend/src/App.tsx (modified — minimal Cellium placeholder with Tailwind classes)
- frontend/src/App.css (deleted — replaced by Tailwind)
- frontend/src/test-setup.ts (new)
- frontend/src/types/cell.ts (new)
- frontend/src/types/operations.ts (new)
- frontend/src/types/api.ts (new)
- frontend/src/types/index.ts (new)
- frontend/src/types/cell.test.ts (new)
- frontend/src/types/operations.test.ts (new)
- frontend/src/types/api.test.ts (new)
- frontend/src/components/CommandBar/index.ts (new)
- frontend/src/components/Grid/index.ts (new)
- frontend/src/components/Diff/index.ts (new)
- frontend/src/components/Version/index.ts (new)
- frontend/src/stores/.gitkeep (new)
- frontend/src/utils/.gitkeep (new)
- frontend/src/hooks/.gitkeep (new)
- frontend/.env.example (new)
- frontend/.gitignore (modified — added .env entries)
- backend/app.py (new)
- backend/requirements.txt (new)
- backend/.env.example (new)
- backend/.gitignore (new)
