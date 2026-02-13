# Cellium

Cellium est un tableur collaboratif web avec un agent IA integre. L'application permet de manipuler des donnees dans une grille interactive, de creer des formules, de definir des zones nommees, et de piloter le tableur en langage naturel grace a un agent Claude Code connecte directement dans l'interface.

## Architecture globale

```
┌─────────────────────────────────────────────────────────────┐
│                     Navigateur (Frontend)                    │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────────┐  │
│  │ SpreadsheetGrid│ │ VersionPanel │ │   AgentChat       │  │
│  │ (react-window) │ │  (snapshots) │ │ (chat flottant)   │  │
│  └──────┬───────┘  └──────┬───────┘  └───────┬───────────┘  │
│         │                 │                   │              │
│  ┌──────┴─────────────────┴───────────────────┴──────────┐  │
│  │              Zustand Stores (gridStore, versionStore,  │  │
│  │                          agentStore)                   │  │
│  └──────────────────────────┬────────────────────────────┘  │
│                             │ HTTP (fetch)                   │
└─────────────────────────────┼───────────────────────────────┘
                              │
                    ┌─────────▼─────────┐
                    │   Flask Backend   │
                    │   (port 5001)     │
                    │                   │
                    │  /api/data        │──── Lecture/ecriture
                    │  /api/session     │     spreadsheet.json
                    │  /api/agent/chat  │─┐
                    └───────────────────┘ │
                                          │ subprocess
                              ┌───────────▼───────────┐
                              │   Claude Code CLI     │
                              │                       │
                              │  Lit le fichier JSON   │
                              │  Comprend la structure │
                              │  Modifie les cellules  │
                              │  avec Read/Edit        │
                              └───────────────────────┘
```

## Stack technique

| Composant | Technologie |
|-----------|-------------|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS |
| Etat global | Zustand (avec middleware Immer) |
| Grille virtualisee | react-window |
| Backend | Flask (Python), Flask-CORS |
| Persistance | Fichiers JSON par session |
| Agent IA | Claude Code CLI (subprocess) |
| Tests | Vitest + Testing Library (frontend), pytest (backend) |

## Structure du projet

```
cellium/
├── backend/
│   ├── app.py                  # Serveur Flask (API REST + agent)
│   ├── requirements.txt
│   └── tests/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Grid/           # Grille : SpreadsheetGrid, Cell, ContextMenu, ZoneDialog
│   │   │   ├── Agent/          # Chat IA : AgentChat
│   │   │   ├── Version/        # Historique : VersionPanel, VersionItem
│   │   │   └── Diff/           # Comparaison de versions
│   │   ├── stores/
│   │   │   ├── gridStore.ts    # Etat de la grille (cellules, zones, selection)
│   │   │   ├── versionStore.ts # Snapshots et import/export
│   │   │   ├── agentStore.ts   # Chat avec l'agent IA
│   │   │   └── diffStore.ts    # Comparaison de versions
│   │   ├── hooks/
│   │   │   ├── useAutoSave.ts  # Sauvegarde auto + polling des modifications externes
│   │   │   ├── useKeyboardNav.ts
│   │   │   └── useKeyboardShortcuts.ts
│   │   ├── utils/
│   │   │   ├── formulaEvaluator.ts  # Evaluation des formules (SUM, AVERAGE, etc.)
│   │   │   ├── persistence.ts       # Communication avec le backend
│   │   │   ├── celliumFile.ts       # Export/import .cellium
│   │   │   ├── rangeUtils.ts        # Selection multi-cellules
│   │   │   └── session.ts           # Gestion des sessions
│   │   └── types/
│   ├── package.json
│   └── vite.config.ts
├── data/
│   └── sessions/               # Un dossier par session
│       └── {uuid}/
│           └── spreadsheet.json
├── AGENT_GUIDE.md              # Instructions pour l'agent IA
└── README.md
```

## Lancer l'application

### Prerequis

- **Node.js** >= 18
- **Python** >= 3.10
- **Claude Code CLI** installe et authentifie (pour l'agent IA)

### 1. Installer Claude Code CLI

```bash
npm install -g @anthropic-ai/claude-code
```

Puis se connecter :

```bash
claude
# Suivre les instructions d'authentification (Max ou Pro)
```

### 2. Lancer le backend

```bash
cd backend
pip install -r requirements.txt
python app.py
```

Le serveur Flask demarre sur `http://localhost:5001`.

Au demarrage, le backend affiche :
- `Claude CLI found at ...` ou `Claude CLI available via npx` si le CLI est detecte
- `Neither claude nor npx found` si le CLI n'est pas disponible (l'agent IA sera desactive)

### 3. Lancer le frontend

```bash
cd frontend
npm install
npm run dev
```

Le serveur Vite demarre sur `http://localhost:5173`. Les appels `/api/*` sont proxies automatiquement vers le backend (port 5001) via la configuration Vite.

### 4. Ouvrir l'application

Aller sur `http://localhost:5173` dans le navigateur.

## Fonctionnalites

### Tableur interactif

- Grille virtualisee (26 colonnes x 101 lignes) performante meme avec beaucoup de donnees
- Edition des cellules par double-clic, validation par Shift+Enter ou Tab
- Redimensionnement des colonnes et des lignes par drag
- En-tetes de colonnes personnalisables (clic pour renommer)
- Navigation au clavier (fleches, Tab, Shift+Tab)

### Formules

Les cellules supportent des formules qui se recalculent automatiquement :

| Formule | Description |
|---------|-------------|
| `=SUM(B1:B10)` | Somme des valeurs |
| `=AVERAGE(B1:B10)` | Moyenne |
| `=MIN(B1:B10)` | Valeur minimale |
| `=MAX(B1:B10)` | Valeur maximale |
| `=COUNT(B1:B10)` | Nombre de valeurs numeriques |

Une cellule avec formule peut aussi avoir un **nom** (`name`) qui s'affiche comme label au-dessus de la valeur calculee.

### Selection multi-cellules et zones nommees

- **Selection** : clic + glisser pour selectionner un rectangle de cellules
- **Zones nommees** : clic droit sur une selection → "Creer une zone" pour definir une zone avec nom, description et couleur
- Les zones sont affichees visuellement (couleur de fond + badge sur la cellule de debut)
- Les zones sont sauvegardees dans le JSON et utilisees par l'agent IA pour comprendre la structure

### Gestion de versions

- **Creer un snapshot** : sauvegarde l'etat complet de la grille (cellules, zones, tailles, headers)
- **Restaurer** : revenir a un etat precedent
- **Supprimer** : effacer un snapshot
- **Export/Import** : fichier `.cellium` contenant la grille + tous les snapshots

### Sauvegarde automatique

- Sauvegarde toutes les 5 secondes si des modifications ont eu lieu
- Polling toutes les 2 secondes pour detecter les modifications externes (agent CLI, autre onglet)

## L'agent IA : la force de Claude Code

### Pourquoi un agent de code plutot qu'une simple API ?

Un appel classique a une API d'IA (comme l'API Anthropic Messages) se contente de generer du texte. L'agent Claude Code va beaucoup plus loin :

1. **Il lit les fichiers** : il utilise l'outil `Read` pour lire le contenu reel de `spreadsheet.json` avant de proposer des modifications
2. **Il edite les fichiers** : il utilise l'outil `Edit` pour modifier chirurgicalement le JSON, sans risque de corruption
3. **Il raisonne en contexte** : il comprend la structure du document (zones, headers, formules) grace au `AGENT_GUIDE.md` injecte dans le prompt
4. **Il est autonome** : en plusieurs tours (`--max-turns 10`), il peut lire, analyser, modifier, puis verifier son travail
5. **Pas de cle API** : il utilise l'authentification existante de l'utilisateur (abonnement Max/Pro)

Contrairement a une integration API classique ou il faut coder la logique de lecture/ecriture du fichier, ici Claude Code **fait tout lui-meme**. Le backend se contente de lancer le subprocess et retourner la reponse.

### Comment l'agent est connecte au frontend

```
Utilisateur tape : "Ajoute le total des prix"
         │
         ▼
┌─ AgentChat.tsx ──────────────────────────────────────────┐
│  Le composant envoie POST /api/agent/chat                │
│  avec { message: "Ajoute le total des prix" }            │
└──────────────────────────┬───────────────────────────────┘
                           │
         ▼
┌─ Flask app.py ───────────────────────────────────────────┐
│  1. Lit AGENT_GUIDE.md (regles pour modifier le JSON)    │
│  2. Construit le prompt complet :                        │
│     - Guide technique (invisible pour l'utilisateur)     │
│     - Chemin du fichier spreadsheet.json de la session   │
│     - Demande de l'utilisateur                           │
│  3. Lance : claude -p "prompt" --allowedTools Read,Edit  │
│     (en subprocess, sans CLAUDECODE ni ANTHROPIC_API_KEY │
│      pour utiliser l'auth Max/Pro)                        │
└──────────────────────────┬───────────────────────────────┘
                           │
         ▼
┌─ Claude Code CLI ────────────────────────────────────────┐
│  1. Lit spreadsheet.json avec l'outil Read               │
│  2. Analyse la structure (cellules, zones, headers)      │
│  3. Determine les modifications a faire                  │
│  4. Edite le fichier avec l'outil Edit                   │
│  5. Retourne un resume en francais                       │
└──────────────────────────┬───────────────────────────────┘
                           │
         ▼
┌─ Retour au frontend ────────────────────────────────────┐
│  1. Flask retourne { reply: "...", modified: true }      │
│  2. agentStore affiche la reponse dans le chat           │
│  3. Dispatche l'evenement 'cellium:agent-modified'       │
│  4. useAutoSave detecte l'evenement → recharge la grille │
│  5. Les modifications apparaissent instantanement        │
└─────────────────────────────────────────────────────────┘
```

### Le role de AGENT_GUIDE.md

Ce fichier est le **cerveau** de l'integration. Il enseigne a l'agent :

- La structure exacte du fichier JSON (cellules, formules, zones)
- Comment utiliser les formules (`=SUM`, `=AVERAGE`, etc.)
- La regle d'or : **toujours utiliser des formules**, jamais des valeurs statiques
- Comment combiner un label (`name`) et une formule dans une seule cellule
- Ou placer les resultats (en dehors des zones existantes)
- Ce qu'il ne doit pas toucher (snapshots, rowCount, colWidths, etc.)

Sans ce guide, l'agent pourrait ecrire des valeurs statiques, utiliser deux cellules pour un resultat, ou corrompre la structure du fichier.

### Exemples de commandes

Dans le chat de l'application :

- "Ajoute le total des prix" → l'agent cree une cellule avec `=SUM(B1:B10)` et le nom "Total prix"
- "Calcule la moyenne des prix" → `=AVERAGE(B1:B10)` avec le nom "Prix moyen"
- "Quel est le produit le plus cher ?" → l'agent lit les donnees et repond
- "Ajoute une colonne categorie avec les valeurs Plat, Poisson, Salade..." → l'agent modifie le JSON

## Sessions

Chaque utilisateur obtient une **session unique** (UUID v4) stockee dans `localStorage`. Les donnees sont isolees dans `data/sessions/{uuid}/spreadsheet.json`. Cela permet a plusieurs utilisateurs d'utiliser l'application simultanement sans conflit.

## API Backend

| Methode | Route | Description |
|---------|-------|-------------|
| POST | `/api/session` | Creer une nouvelle session |
| GET | `/api/session/:id` | Verifier qu'une session existe |
| GET | `/api/data` | Lire les donnees de la session |
| POST | `/api/data` | Sauvegarder la grille et/ou un snapshot |
| DELETE | `/api/data/snapshot/:id` | Supprimer un snapshot |
| GET | `/api/data/lastmod` | Timestamp de derniere modification |
| POST | `/api/agent/chat` | Envoyer un message a l'agent IA |

Toutes les routes (sauf `/api/session` POST et `/api/health`) necessitent le header `X-Session-Id`.

## Developpement

### Tests frontend

```bash
cd frontend
npm test          # Execution unique
npm run test:watch  # Mode watch
```

### Build de production

```bash
cd frontend
npm run build     # Output dans frontend/dist/
```

### Verification TypeScript

```bash
cd frontend
npx tsc --noEmit
```
