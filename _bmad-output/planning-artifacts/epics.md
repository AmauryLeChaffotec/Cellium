---
stepsCompleted: [1, 2, 3, 4]
workflow_completed: true
inputDocuments:
  - 'prd.md'
  - 'architecture.md'
---

# Cellium - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for Cellium, decomposing the requirements from the PRD and Architecture requirements into implementable stories.

## Requirements Inventory

### Functional Requirements

- **FR1:** L'utilisateur peut visualiser ses données dans une grille à lignes et colonnes
- **FR2:** L'utilisateur peut saisir et modifier manuellement le contenu d'une cellule
- **FR3:** L'utilisateur peut sélectionner une ou plusieurs cellules
- **FR4:** L'utilisateur peut ajouter et supprimer des lignes manuellement
- **FR5:** L'utilisateur peut ajouter et supprimer des colonnes manuellement
- **FR6:** L'utilisateur peut naviguer dans la grille au clavier (flèches, Tab, Enter)
- **FR7:** L'utilisateur peut saisir une commande en langage naturel via une barre de commande dédiée
- **FR8:** Le système interprète une commande NLP et la convertit en opérations structurées sur la grille
- **FR9:** Le système communique à l'utilisateur lorsqu'une commande n'est pas comprise ou ambiguë
- **FR10:** L'IA peut ajouter une ou plusieurs colonnes avec des valeurs calculées
- **FR11:** L'IA peut ajouter une ou plusieurs lignes avec du contenu généré (totaux, agrégats)
- **FR12:** L'IA peut appliquer des formules à des cellules ou plages de cellules
- **FR13:** L'IA peut trier les données selon un critère spécifié
- **FR14:** L'IA peut formater des cellules (devise, décimales, gras, etc.)
- **FR15:** L'IA peut supprimer des lignes ou colonnes
- **FR16:** L'IA peut remplir automatiquement des cellules basées sur le contexte existant
- **FR17:** Le système affiche visuellement les modifications proposées par l'IA avant application (ajout, modification, suppression)
- **FR18:** L'utilisateur peut distinguer visuellement les types de modifications (ajout vs modification vs suppression)
- **FR19:** L'utilisateur peut valider une proposition de l'IA pour l'appliquer à ses données
- **FR20:** L'utilisateur peut refuser une proposition de l'IA sans aucun impact sur ses données
- **FR21:** Aucune modification IA n'est appliquée sans validation explicite de l'utilisateur
- **FR22:** Le système représente chaque cellule comme un objet indépendant (valeur, formule, format)
- **FR23:** Le système applique des modifications ciblées sur des cellules individuelles sans affecter les autres
- **FR24:** Le système persiste le document en cours localement (côté client)
- **FR25:** Le système supporte une grille d'au moins 1000 lignes et 26 colonnes
- **FR26:** Le système crée automatiquement un snapshot à chaque validation de diff
- **FR27:** L'utilisateur peut consulter l'historique des versions avec timestamps et descriptions
- **FR28:** L'utilisateur peut restaurer une version précédente en un clic
- **FR29:** Le système stocke les versions de façon incrémentale (deltas, pas copies complètes)

### NonFunctional Requirements

- **NFR1:** Temps de réponse IA — Commande NLP → réponse structurée en < 3s (P95 < 5s)
- **NFR2:** Rendu grille — 1000 lignes en < 500ms, scroll fluide 60fps
- **NFR3:** Application diff — Surbrillance changements en < 200ms
- **NFR4:** Validation/Refus — Application ou annulation diff en < 100ms
- **NFR5:** Restauration version — Snapshot complet restauré en < 1s
- **NFR6:** Chargement initial — FCP < 2s, TTI < 3s
- **NFR7:** Taille bundle — < 500KB gzipped
- **NFR8:** Clé API LLM — Jamais exposée côté client (proxy backend obligatoire)
- **NFR9:** Données utilisateur — Données grille restent locales sauf appels IA
- **NFR10:** Appels IA — Données envoyées limitées au contexte nécessaire
- **NFR11:** HTTPS — Toutes communications API chiffrées
- **NFR12:** Disponibilité API — Gestion gracieuse des erreurs (timeout, rate limit, indisponibilité)
- **NFR13:** Taux de précision — > 80% commandes NLP correctement interprétées
- **NFR14:** Format réponse — LLM retourne des opérations structurées JSON
- **NFR15:** Contexte minimal — Prompt IA inclut uniquement métadonnées nécessaires
- **NFR16:** Auto-sauvegarde — Données grille sauvegardées toutes les 30s en IndexedDB
- **NFR17:** Récupération crash — Données retrouvées après crash/fermeture navigateur
- **NFR18:** Intégrité versioning — Snapshots immuables, restauration ne corrompt pas l'historique

### Additional Requirements

**From Architecture — Starter Template (Epic 1 Story 1):**
- Scaffold frontend: `npm create vite@latest cellium-app -- --template react-ts`
- Dépendances frontend: zustand, immer, react-window, tailwindcss, postcss, autoprefixer, idb, vitest, @testing-library/react
- Scaffold backend: Flask + flask-cors + openai + python-dotenv
- Proxy Vite configuré pour `/api` → `localhost:5000`

**From Architecture — Data Model:**
- Cell model: `{ id, value, formula?, format? }` avec types TypeScript
- Grid: `Record<string, Cell>`
- 8 types d'opérations structurées (SET_VALUE, SET_FORMULA, INSERT_ROW, INSERT_COLUMN, DELETE_ROW, DELETE_COLUMN, SORT, FORMAT)
- IndexedDB via `idb` pour persistence (2 object stores: gridData, versionHistory)

**From Architecture — API Contract:**
- Endpoint unique: `POST /api/ai/command`
- Request: `{ command: string, gridContext: GridMetadata }`
- Response: `{ operations: Operation[], description: string }`
- Gestion erreurs: 503 (LLM timeout), 200 + clarification, 400 (invalide)

**From Architecture — State Management:**
- 4 Zustand stores indépendants: gridStore, diffStore, versionStore, commandStore
- Immer pour updates complexes
- Actions synchrones, logique async dans hooks/composants

**From Architecture — Infrastructure:**
- Frontend: Vercel (auto-deploy)
- Backend: Railway ou Render
- HTTPS par défaut sur les deux

### FR Coverage Map

- FR1: Epic 1 — Visualisation grille à lignes et colonnes
- FR2: Epic 1 — Édition manuelle du contenu d'une cellule
- FR3: Epic 1 — Sélection de cellules
- FR4: Epic 1 — Ajout/suppression lignes manuellement
- FR5: Epic 1 — Ajout/suppression colonnes manuellement
- FR6: Epic 1 — Navigation clavier (flèches, Tab, Enter)
- FR7: Epic 2 — Barre de commande NLP
- FR8: Epic 2 — Interprétation commande → opérations structurées
- FR9: Epic 2 — Feedback commande incomprise ou ambiguë
- FR10: Epic 2 — IA ajout colonnes avec valeurs calculées
- FR11: Epic 2 — IA ajout lignes (totaux, agrégats)
- FR12: Epic 2 — IA formules sur cellules/plages
- FR13: Epic 2 — IA tri données
- FR14: Epic 2 — IA formatage cellules
- FR15: Epic 2 — IA suppression lignes/colonnes
- FR16: Epic 2 — IA remplissage automatique
- FR17: Epic 2 — Diff visuel des modifications proposées
- FR18: Epic 2 — Distinction visuelle ajout/modification/suppression
- FR19: Epic 2 — Bouton Valider pour appliquer
- FR20: Epic 2 — Bouton Refuser sans impact
- FR21: Epic 2 — Garantie aucune modification sans validation
- FR22: Epic 1 — Cellules objets JSON indépendants
- FR23: Epic 1 — Modifications ciblées atomiques
- FR24: Epic 1 — Persistence locale IndexedDB
- FR25: Epic 1 — Support 1000 lignes x 26 colonnes
- FR26: Epic 3 — Snapshot automatique à chaque validation
- FR27: Epic 3 — Historique versions avec timestamps et descriptions
- FR28: Epic 3 — Restauration version en 1 clic
- FR29: Epic 3 — Stockage incrémental (deltas)

## Epic List

### Epic 1: Tableur Interactif
L'utilisateur peut saisir, éditer et naviguer dans un tableur fonctionnel avec persistence locale. Inclut le scaffold du projet (Vite + React TS + Flask), les types TypeScript fondamentaux, le gridStore, la grille virtualisée et la persistence IndexedDB.
**FRs covered:** FR1, FR2, FR3, FR4, FR5, FR6, FR22, FR23, FR24, FR25

### Epic 2: Intelligence Artificielle & Contrôle Utilisateur
L'utilisateur peut commander l'IA en langage naturel, voir les modifications proposées en diff visuel (vert/orange/rouge), et valider ou refuser chaque proposition. Inclut le backend Flask proxy LLM, la barre de commande, les 7 types d'opérations IA, et le système complet de diff + validation.
**FRs covered:** FR7, FR8, FR9, FR10, FR11, FR12, FR13, FR14, FR15, FR16, FR17, FR18, FR19, FR20, FR21

### Epic 3: Gestion de Versions
L'utilisateur peut consulter l'historique de toutes ses validations avec timestamps et descriptions, et restaurer n'importe quelle version en un clic. Stockage incrémental par deltas.
**FRs covered:** FR26, FR27, FR28, FR29

## Epic 1: Tableur Interactif

L'utilisateur peut saisir, éditer et naviguer dans un tableur fonctionnel avec persistence locale.

### Story 1.1: Scaffold Projet & Types Fondamentaux

As a développeur,
I want un projet Vite + React TS + Flask scaffoldé avec toutes les dépendances et les types TypeScript fondamentaux,
So that la base technique est prête pour construire les features.

**Acceptance Criteria:**

**Given** le dépôt est vide
**When** le scaffold est exécuté
**Then** le frontend Vite + React TS compile sans erreur avec toutes les dépendances (zustand, immer, react-window, tailwindcss, idb, vitest)
**And** le backend Flask démarre avec flask-cors et python-dotenv
**And** le proxy Vite `/api` → `localhost:5000` est configuré
**And** les types TypeScript sont définis : `Cell`, `CellFormat`, `Grid`, `Operation` (8 types), `GridMetadata`, `CommandRequest`, `CommandResponse`
**And** la structure de dossiers correspond à l'architecture (components/, stores/, types/, utils/, hooks/)

### Story 1.2: Grille Basique avec Affichage et Édition

As a utilisateur,
I want voir mes données dans une grille et modifier le contenu de chaque cellule,
So that je peux saisir et organiser mes données.

**Acceptance Criteria:**

**Given** l'application est ouverte
**When** la grille s'affiche
**Then** une grille de colonnes A-Z et de lignes 1-100 (défaut) est visible
**And** chaque cellule affiche sa valeur (FR1, FR22)

**Given** une cellule est affichée
**When** l'utilisateur double-clique sur la cellule
**Then** la cellule passe en mode édition avec un input
**And** l'utilisateur peut saisir du texte ou un nombre (FR2)

**Given** une cellule est en mode édition
**When** l'utilisateur appuie sur Enter ou clique ailleurs
**Then** la valeur est sauvegardée dans le gridStore
**And** la cellule revient en mode affichage (FR23)

### Story 1.3: Sélection de Cellules et Navigation Clavier

As a utilisateur,
I want sélectionner des cellules et naviguer au clavier dans la grille,
So that je peux travailler efficacement sans la souris.

**Acceptance Criteria:**

**Given** la grille est affichée
**When** l'utilisateur clique sur une cellule
**Then** la cellule est visuellement sélectionnée (surbrillance) (FR3)

**Given** une cellule est sélectionnée
**When** l'utilisateur appuie sur une flèche directionnelle
**Then** la sélection se déplace vers la cellule adjacente (FR6)

**Given** une cellule est sélectionnée
**When** l'utilisateur appuie sur Tab
**Then** la sélection passe à la cellule suivante (droite) (FR6)

**Given** une cellule est sélectionnée
**When** l'utilisateur appuie sur Enter
**Then** la cellule entre en mode édition (FR6)

### Story 1.4: Ajout et Suppression Manuels de Lignes et Colonnes

As a utilisateur,
I want ajouter et supprimer des lignes et colonnes manuellement,
So that je peux structurer mon tableau librement.

**Acceptance Criteria:**

**Given** la grille est affichée
**When** l'utilisateur effectue une action "ajouter ligne" (clic droit ou bouton)
**Then** une nouvelle ligne vide est insérée après la ligne sélectionnée (FR4)
**And** le gridStore est mis à jour

**Given** une ligne existe
**When** l'utilisateur effectue une action "supprimer ligne"
**Then** la ligne est retirée de la grille (FR4)
**And** les lignes suivantes se réindexent

**Given** la grille est affichée
**When** l'utilisateur effectue une action "ajouter colonne"
**Then** une nouvelle colonne vide est insérée après la colonne sélectionnée (FR5)

**Given** une colonne existe
**When** l'utilisateur effectue une action "supprimer colonne"
**Then** la colonne et toutes ses cellules sont retirées (FR5)

### Story 1.5: Virtualisation et Capacité 1000 Lignes

As a utilisateur,
I want un tableau qui reste fluide même avec 1000 lignes de données,
So that je peux travailler sur de grands jeux de données sans ralentissement.

**Acceptance Criteria:**

**Given** la grille contient 1000 lignes et 26 colonnes
**When** l'utilisateur scrolle verticalement
**Then** le scroll est fluide à 60fps grâce à react-window (NFR2, FR25)
**And** seules les lignes visibles sont rendues dans le DOM

**Given** la grille contient 1000 lignes
**When** la grille se charge
**Then** le rendu initial prend < 500ms (NFR2)

### Story 1.6: Persistence IndexedDB et Auto-Save

As a utilisateur,
I want que mes données soient sauvegardées automatiquement et récupérées après un crash,
So that je ne perds jamais mon travail.

**Acceptance Criteria:**

**Given** l'utilisateur travaille dans la grille
**When** 30 secondes s'écoulent depuis le dernier save
**Then** le gridStore est persisté dans IndexedDB (object store `gridData`) (FR24, NFR16)

**Given** l'application est fermée puis réouverte
**When** l'application charge
**Then** les données sont restaurées depuis IndexedDB (NFR17)
**And** l'état de la grille est identique à la dernière sauvegarde

**Given** le navigateur crash
**When** l'application est réouverte
**Then** les données sont récupérées depuis IndexedDB (NFR17)

## Epic 2: Intelligence Artificielle & Contrôle Utilisateur

L'utilisateur peut commander l'IA en langage naturel, voir les modifications proposées en diff visuel, et valider ou refuser chaque proposition.

### Story 2.1: Backend Flask Proxy LLM

As a système,
I want un backend Flask qui reçoit une commande NLP avec le contexte grille et retourne des opérations JSON structurées via l'API LLM,
So that la clé API LLM est protégée et les réponses sont structurées.

**Acceptance Criteria:**

**Given** le backend Flask est démarré
**When** une requête `POST /api/ai/command` arrive avec `{ command: string, gridContext: GridMetadata }`
**Then** le backend appelle l'API LLM avec un prompt incluant la commande et le contexte grille
**And** retourne `{ operations: Operation[], description: string }` en JSON camelCase (FR8, NFR14)

**Given** la commande est ambiguë
**When** le LLM ne peut pas générer d'opérations claires
**Then** le backend retourne HTTP 200 avec `{ operations: [], clarification: string }` (FR9)

**Given** l'API LLM est indisponible ou timeout
**When** la requête échoue
**Then** le backend retourne HTTP 503 avec `{ error: string, code: 'LLM_TIMEOUT' | 'LLM_ERROR' }` (NFR12)

**Given** la requête est invalide (command vide, contexte manquant)
**When** la validation échoue
**Then** le backend retourne HTTP 400 avec `{ error: string, code: 'INVALID_COMMAND' | 'MISSING_CONTEXT' }` (NFR8)

**And** la clé API LLM n'est JAMAIS exposée dans la réponse (NFR8)
**And** seules les métadonnées grille sont envoyées au LLM, pas la grille complète (NFR15)

### Story 2.2: Barre de Commande IA

As a utilisateur,
I want saisir une commande en langage naturel et voir un retour de l'IA,
So that je peux demander des manipulations de données sans écrire de formules.

**Acceptance Criteria:**

**Given** l'application est ouverte
**When** l'utilisateur regarde l'interface
**Then** une barre de commande est visible avec le placeholder "Décrivez ce que vous voulez faire..." (FR7)

**Given** l'utilisateur a saisi une commande
**When** il appuie sur Enter ou clique sur Envoyer
**Then** le commandStore passe en `isLoading: true`
**And** un indicateur de chargement s'affiche
**And** la requête est envoyée au backend avec la commande et le GridMetadata (FR7)

**Given** le backend retourne des opérations
**When** la réponse arrive
**Then** le commandStore passe en `isLoading: false`
**And** les opérations sont transmises au diffStore (FR8)

**Given** le backend retourne une clarification
**When** la commande est ambiguë
**Then** le message de clarification s'affiche dans l'UI en français (FR9)

**Given** le backend retourne une erreur
**When** le LLM échoue
**Then** un message d'erreur user-friendly s'affiche en français (NFR12)

**And** la réponse arrive en < 3 secondes pour P50 (NFR1)

### Story 2.3: Moteur d'Opérations sur la Grille

As a système,
I want appliquer les 8 types d'opérations IA sur la grille de façon atomique,
So that chaque commande IA produit des modifications précises et ciblées.

**Acceptance Criteria:**

**Given** une opération `SET_VALUE` est reçue
**When** elle est appliquée au gridStore
**Then** la cellule ciblée reçoit la nouvelle valeur sans affecter les autres (FR23, FR10)

**Given** une opération `SET_FORMULA` est reçue
**When** elle est appliquée
**Then** la cellule reçoit la formule et affiche le résultat calculé (FR12)

**Given** une opération `INSERT_ROW` est reçue
**When** elle est appliquée
**Then** une nouvelle ligne est insérée avec les cellules fournies (FR11)

**Given** une opération `INSERT_COLUMN` est reçue
**When** elle est appliquée
**Then** une nouvelle colonne est ajoutée avec header et cellules fournies (FR10)

**Given** une opération `DELETE_ROW` ou `DELETE_COLUMN` est reçue
**When** elle est appliquée
**Then** la ligne ou colonne ciblée est supprimée (FR15)

**Given** une opération `SORT` est reçue
**When** elle est appliquée
**Then** les données sont triées selon la colonne et direction spécifiées (FR13)

**Given** une opération `FORMAT` est reçue
**When** elle est appliquée
**Then** les cellules ciblées reçoivent le formatage (gras, devise, décimales) (FR14)

**And** une liste de plusieurs opérations est appliquée séquentiellement dans l'ordre (FR16)

### Story 2.4: Diff Visuel des Propositions IA

As a utilisateur,
I want voir visuellement ce que l'IA propose de changer avant que ça soit appliqué,
So that je comprends exactement ce qui va se passer.

**Acceptance Criteria:**

**Given** des opérations IA sont reçues du backend
**When** elles arrivent dans le diffStore
**Then** un preview est calculé sans modifier le gridStore
**And** le DiffOverlay s'affiche sur la grille (FR17)

**Given** une opération ajoute des cellules/lignes/colonnes
**When** le diff est affiché
**Then** les ajouts sont surlignés en vert (FR18)

**Given** une opération modifie des cellules existantes
**When** le diff est affiché
**Then** les modifications sont surlignées en orange (FR18)

**Given** une opération supprime des lignes/colonnes
**When** le diff est affiché
**Then** les suppressions sont surlignées en rouge (FR18)

**And** le diff s'affiche en < 200ms après réception des opérations (NFR3)

### Story 2.5: Validation et Refus avec Garantie de Contrôle

As a utilisateur,
I want valider ou refuser chaque proposition de l'IA avec la garantie que rien ne change sans mon accord,
So that je garde le contrôle total sur mes données.

**Acceptance Criteria:**

**Given** un diff est affiché avec des opérations en attente
**When** l'utilisateur regarde l'interface
**Then** une barre d'action avec les boutons "Valider" et "Refuser" est visible (FR19, FR20)

**Given** l'utilisateur clique sur "Valider"
**When** les opérations sont acceptées
**Then** les opérations sont appliquées au gridStore via `applyOperations()` (FR19)
**And** le diffStore est vidé
**And** le DiffOverlay disparaît
**And** l'application en < 100ms (NFR4)

**Given** l'utilisateur clique sur "Refuser"
**When** les opérations sont rejetées
**Then** le diffStore est vidé sans modifier le gridStore (FR20)
**And** le DiffOverlay disparaît
**And** les données restent strictement identiques à avant la commande (FR20)
**And** l'annulation en < 100ms (NFR4)

**Given** des opérations sont en attente dans le diffStore
**When** l'utilisateur n'a pas encore cliqué Valider ou Refuser
**Then** aucune modification n'est appliquée au gridStore (FR21)
**And** la barre de commande est désactivée tant qu'un diff est en attente

## Epic 3: Gestion de Versions

L'utilisateur peut consulter l'historique de toutes ses validations et restaurer n'importe quelle version en un clic.

### Story 3.1: Snapshots Automatiques à Chaque Validation

As a utilisateur,
I want qu'un snapshot soit créé automatiquement chaque fois que je valide une proposition IA,
So that chaque modification est traçable sans effort de ma part.

**Acceptance Criteria:**

**Given** l'utilisateur clique "Valider" sur un diff (Story 2.5)
**When** les opérations sont appliquées au gridStore
**Then** le versionStore crée automatiquement un nouveau snapshot delta (FR26)
**And** le snapshot contient : la liste des opérations appliquées, un timestamp ISO 8601, et une description auto-générée à partir de la commande IA

**Given** un snapshot est créé
**When** il est persisté
**Then** seules les opérations (delta) sont stockées, pas une copie complète de la grille (FR29)
**And** le snapshot est sauvegardé dans IndexedDB (object store `versionHistory`)

**Given** plusieurs validations successives
**When** le versionStore est consulté
**Then** chaque validation a produit un snapshot distinct avec son propre timestamp

### Story 3.2: Historique des Versions Consultable

As a utilisateur,
I want consulter l'historique de toutes mes versions avec leurs dates et descriptions,
So that je peux comprendre l'évolution de mes données.

**Acceptance Criteria:**

**Given** des snapshots existent dans le versionStore
**When** l'utilisateur ouvre le VersionPanel
**Then** la liste des versions s'affiche en ordre chronologique inverse (plus récent en haut) (FR27)
**And** chaque version affiche son timestamp formaté en français et sa description

**Given** aucun snapshot n'existe
**When** l'utilisateur ouvre le VersionPanel
**Then** un message indique "Aucune version enregistrée"

**Given** l'historique contient 10+ versions
**When** l'utilisateur parcourt la liste
**Then** le scrolling est fluide et toutes les versions sont accessibles

### Story 3.3: Restauration de Version en Un Clic

As a utilisateur,
I want restaurer n'importe quelle version précédente en un clic,
So that je peux revenir en arrière si je ne suis pas satisfait des changements.

**Acceptance Criteria:**

**Given** l'historique affiche plusieurs versions
**When** l'utilisateur clique sur "Restaurer" à côté d'une version
**Then** la grille est restaurée à l'état de cette version (FR28)
**And** la restauration prend < 1 seconde (NFR5)

**Given** une version est restaurée
**When** le gridStore est mis à jour
**Then** l'historique existant reste intact et n'est PAS supprimé (NFR18)
**And** la restauration elle-même crée un nouveau snapshot dans l'historique

**Given** l'utilisateur restaure la version la plus ancienne
**When** la grille se met à jour
**Then** les données correspondent exactement à l'état initial de cette version
**And** aucun snapshot intermédiaire n'est corrompu (NFR18)
