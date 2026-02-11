---
stepsCompleted: ['step-01-init', 'step-02-discovery', 'step-03-success', 'step-04-journeys', 'step-05-domain', 'step-06-innovation', 'step-07-project-type', 'step-08-scoping', 'step-09-functional', 'step-10-nonfunctional', 'step-11-polish', 'step-12-complete']
workflow_completed: true
inputDocuments:
  - 'product-brief-Cellium-2026-02-11.md'
  - '_bmad-output/brainstorming/brainstorming-session-2026-02-11.md'
workflowType: 'prd'
briefCount: 1
researchCount: 0
brainstormingCount: 1
projectDocsCount: 0
classification:
  projectType: 'web_app'
  domain: 'general'
  complexity: 'low'
  projectContext: 'greenfield'
---

# Product Requirements Document - Cellium

**Author:** Amaurylechaffotec
**Date:** 2026-02-11
**Classification:** Web App | General Domain | Low Complexity | Greenfield

## Executive Summary

**Cellium** est un tableur IA où l'intelligence artificielle manipule les données sous contrôle total de l'utilisateur.

**Problème :** Les utilisateurs non-techniques passent trop de temps sur des manipulations de données répétitives dans Excel/Sheets. Les outils IA existants manquent de transparence — l'utilisateur ne voit pas ce qui va changer avant que ce soit fait.

**Solution :** Un tableur minimaliste piloté par commandes en langage naturel. Chaque modification proposée par l'IA est affichée comme un diff visuel (vert = ajout, orange = modification, rouge = suppression) que l'utilisateur valide ou refuse avant application. Un versioning automatique crée un snapshot à chaque validation.

**Différenciateur :** Architecture de mutations atomiques JSON — l'IA envoie des patches ciblés cellule par cellule, jamais de régénération de fichier. Le seul tableur où l'IA est transparente, réversible et contrôlée à chaque étape.

**Cible :** Utilisateurs non-techniques (comptables, étudiants, analystes) qui veulent exploiter leurs données sans apprendre de formules.

**Business Model :** Freemium

## Success Criteria

### User Success

- Première commande IA validée en < 5 minutes après ouverture
- Manipulation de données sans écrire une seule formule
- Sentiment de contrôle permanent grâce au diff visuel
- Confiance pour expérimenter grâce au versioning

### Business Success

| Horizon | Critère mesurable |
|---------|-------------------|
| **Semaine 1** | MVP fonctionnel déployé, 6 features core opérationnelles |
| **Mois 1** | Premiers beta testeurs, feedback collecté, taux d'acceptation des diffs mesuré |
| **Mois 3** | 100+ utilisateurs actifs, validation du concept |
| **Mois 6** | Conversion freemium mesurable, rétention J30 > 25% |

### Technical Success

| Critère | Cible MVP |
|---------|-----------|
| Temps de réponse IA | < 3 secondes par commande |
| Taux de précision IA | > 80% commandes correctement interprétées |
| Capacité grille | 1 000 lignes x 26 colonnes (A-Z) |
| Taille snapshot | Delta < 10% de la taille du document |
| Temps de restauration | < 1 seconde |
| Disponibilité | 99% uptime |

### Measurable Outcomes

- **North Star :** Commandes IA validées / utilisateur / semaine > 10
- **Activation :** > 70% des nouveaux utilisateurs valident au moins 1 diff dans les 5 premières minutes
- **Rétention :** J7 > 40%, J30 > 25%
- **Qualité IA :** Taux d'acceptation des diffs > 80%
- **Performance :** P95 temps de réponse IA < 5 secondes

## Product Scope & Phased Development

### MVP (Phase 1 — 1 semaine)

**Approche :** Problem-Solving MVP — prouver que l'IA peut manipuler un tableur de façon transparente, contrôlée et réversible.

**Ressources :** 1 développeur full-stack, 1 semaine. Stack légère.

| # | Feature | Justification |
|---|---------|---------------|
| 1 | **Grille tableur** — affichage, sélection, édition manuelle | Sans grille, pas de produit |
| 2 | **Barre de commande IA** — input NLP, interprétation par LLM | Différenciateur core |
| 3 | **Moteur IA → Actions** — colonnes, lignes, formules, tri, formatage, remplissage | Valeur utilisateur directe |
| 4 | **Diff visuel + Validation** — surbrillance vert/orange/rouge + Valider/Refuser | Innovation #1 — contrôle utilisateur |
| 5 | **Architecture JSON cellulaire** — objets indépendants par cellule, patches atomiques | Innovation #2 — efficacité IA |
| 6 | **Versioning simplifié** — snapshots auto, historique timestamps, restauration 1 clic | Exigence utilisateur prioritaire |

**Hors MVP :** Import/export CSV, Chat sidebar, Graphiques, Collaboration, Mobile

### Growth (Phase 2 — Mois 1-3)

| Feature | Valeur ajoutée |
|---------|---------------|
| Import/export CSV et multi-format | Données existantes → Cellium |
| Chat sidebar contextuel | Interactions IA plus riches |
| Graphiques et visualisations auto | Analyse visuelle |
| Annotations IA sur les diffs | Comprendre le "pourquoi" des propositions |
| Versioning avancé (branches, tags, comparaison) | Power users |
| Diff multi-niveaux (rapide/détaillé/impact) | Granularité de contrôle |
| Détection d'erreurs proactive | IA qui anticipe |

### Vision (Phase 3 — Mois 6+)

| Feature | Valeur ajoutée |
|---------|---------------|
| Collaboration multi-utilisateurs (branches + merge) | Travail d'équipe |
| Permissions granulaires par zone | Sécurité entreprise |
| Templates métier et plugins | Extensibilité |
| Connexion API / données externes | Temps réel |
| Commande vocale + multilingue | Accessibilité avancée |
| IA prédictive + automatisation | Intelligence proactive |
| Marketplace communautaire | Écosystème |

## User Journeys

### Journey 1 : Marie découvre Cellium — "Enfin !"

**Persona :** Marie, 35 ans, comptable PME. Utilise Excel depuis 10 ans.

**Opening Scene :**
Marie ouvre Cellium. Grille vide, épurée — pas de ruban. Juste une grille et une barre de commande : _"Décrivez ce que vous voulez faire..."_. Elle saisit manuellement un mini-extrait bancaire : date, libellé, montant, catégorie. 8 lignes.

**Rising Action :**
Commande 1 : _"Ajoute une colonne Total qui fait la somme cumulative des montants"_ → Diff vert, nouvelle colonne avec valeurs calculées → Valide. Snapshot créé.
Commande 2 : _"Trie par date décroissante"_ → Diff orange, lignes réorganisées → Valide.
Commande 3 : _"Formate la colonne montant en euros avec 2 décimales"_ → Diff orange → Valide.

**Climax :**
Commande 4 : _"Ajoute une ligne total en bas avec la somme de chaque colonne numérique"_ → L'IA comprend, crée la ligne, calcule les sommes → Valide. Marie consulte l'historique : 4 versions, descriptions lisibles. Elle restaure la version 1, puis revient à la version 4. Tout est intact.

**Resolution :**
_"J'ai fait en 3 minutes ce qui me prend 45 minutes dans Excel."_

### Journey 2 : Lucas débute — "Je comprends enfin"

**Persona :** Lucas, 22 ans, étudiant. N'a jamais utilisé de tableur. Doit rendre un projet avec des stats.

**Opening Scene :**
Lucas ouvre Cellium. Il saisit manuellement 15 réponses de sondage : âge, genre, score de satisfaction, ville.

**Rising Action :**
Commande 1 : _"Calcule la moyenne du score de satisfaction"_ → Diff vert, cellule avec "3.7" → Valide.
Commande 2 : _"Calcule la moyenne de satisfaction par genre"_ → Diff vert, deux nouvelles cellules → Valide.
Commande 3 : _"Trie par score décroissant et mets en gras les scores > 4"_ → Diff orange → Valide.

**Climax :**
Commande 4 : _"Supprime la colonne ville"_ → Diff rouge. Lucas réalise qu'il en a besoin. Il clique **Refuser**. Rien ne se passe. Données intactes. _"Je peux tout essayer sans risque."_

**Resolution :**
Lucas a ses statistiques sans avoir appris une seule formule.

### Journey 3 : L'IA se trompe — "Pas de panique"

**Persona :** Marie, même comptable. Tableau de 50 lignes de ventes par produit.

**Opening Scene :**
Marie tape : _"Ajoute une colonne marge qui calcule prix de vente moins coût"_

**Rising Action :**
L'IA interprète mal : formule inversée (coût - prix). Diff vert avec valeurs négatives. Marie voit immédiatement le problème.

**Climax :**
Marie clique **Refuser**. Diff disparaît. Données intactes. Elle reformule : _"Ajoute une colonne marge = prix de vente - coût d'achat"_. Cette fois les valeurs sont positives. Elle vérifie : 50€ - 30€ = 20€. Correct. **Valide**.

**Resolution :**
Le système de diff l'a protégée. Même si l'IA se trompe, rien ne change sans consentement. Le versioning est le filet ultime.

### Journey → Requirements Traceability

| Capability | J1 (Marie) | J2 (Lucas) | J3 (Erreur) | FRs |
|------------|:--:|:--:|:--:|-----|
| Grille tableur + saisie manuelle | x | x | x | FR1-FR6 |
| Barre de commande NLP | x | x | x | FR7-FR9 |
| Ajout colonnes avec formules | x | x | x | FR10-FR12 |
| Tri de données | x | x | | FR13 |
| Formatage (devises, gras) | x | x | | FR14 |
| Ligne totaux/agrégats | x | x | | FR11 |
| Diff visuel (vert/orange/rouge) | x | x | x | FR17-FR18 |
| Bouton Valider | x | x | x | FR19, FR21 |
| Bouton Refuser | | | x | FR20-FR21 |
| Versioning (snapshots auto) | x | | x | FR26 |
| Historique consultable | x | | | FR27 |
| Restauration de version | x | | | FR28 |

## Innovation & Novel Patterns

### Detected Innovation Areas

1. **Architecture de mutations atomiques JSON** — L'IA envoie des patches ciblés cellule par cellule via des objets JSON indépendants `{id, value, formula, format}`. Réduction drastique des erreurs vs régénération complète de fichier.

2. **Système de diff visuel Human-in-the-loop** — Affichage vert/orange/rouge de chaque proposition IA AVANT application. Aucun changement sans consentement explicite.

3. **Combinaison unique : Tableur + NLP + Versioning automatique** — Chaque validation crée un snapshot. L'IA est transparente et réversible. Aucun tableur existant ne combine ces trois éléments.

4. **Accessibilité IA pour non-techniques** — Langage naturel en entrée, validation visuelle en sortie. Pas de formules, pas de syntaxe.

### Competitive Landscape

| Concurrent | Ce qu'il fait | Ce qui manque |
|------------|---------------|---------------|
| Google Sheets | Smart Fill, IA basique | Pas de diff, pas de validation granulaire |
| Excel Copilot | Actions IA proposées | Pas de transparence cellule par cellule |
| Rows.com / Airtable + IA | IA intégrée | Pas de mutations atomiques, pas de diff visuel |
| **Cellium** | **Diff + Validation + Versioning + Patches atomiques** | **Unique** |

### Innovation Validation

- Tester compréhension intuitive du système vert/orange/rouge par les non-techniques
- Valider perception de fiabilité des mutations atomiques vs régénération complète
- Mesurer réduction d'anxiété grâce au versioning automatique
- Comparer temps de complétion vs Excel/Sheets pour les mêmes opérations

## Web App Technical Requirements

### Architecture

Cellium est une **SPA (Single Page Application)** orientée productivité : interface unique grille + barre de commande IA, rendu côté client performant.

| Aspect | Décision MVP | Justification |
|--------|-------------|---------------|
| Architecture | SPA (CSR) | Fluidité requise pour interactions tableur continues |
| State Management | Store centralisé (grille + historique + diffs) | État complexe multi-couches |
| Communication API | REST (HTTP) | Appels IA asynchrones, pas de WebSocket en V1 |
| Stockage local | LocalStorage / IndexedDB | Persistance document côté client |
| Framework | React ou équivalent | Rendu dynamique de grille performant |
| Virtualisation | Rendu virtuel des lignes | Support 1000+ lignes sans lag |

### Browser Support

| Navigateur | Support MVP |
|------------|:-----------:|
| Chrome (dernières 2 versions) | Complet |
| Firefox (dernières 2 versions) | Complet |
| Edge (dernières 2 versions) | Complet |
| Safari (dernière version) | Basique |
| Mobile browsers | Non ciblé MVP |

### Design Constraints

- **Desktop-first** — largeur minimale 1024px, pas de mobile en MVP
- **Navigation clavier** — flèches, Tab, Enter dans la grille
- **Labels ARIA** — boutons Valider/Refuser accessibles
- **Contraste** — couleurs de diff lisibles pour daltoniens (à vérifier)
- **Focus visible** — éléments interactifs clairement identifiables

## Functional Requirements

### Tableur & Saisie de Données

- **FR1:** L'utilisateur peut visualiser ses données dans une grille à lignes et colonnes
- **FR2:** L'utilisateur peut saisir et modifier manuellement le contenu d'une cellule
- **FR3:** L'utilisateur peut sélectionner une ou plusieurs cellules
- **FR4:** L'utilisateur peut ajouter et supprimer des lignes manuellement
- **FR5:** L'utilisateur peut ajouter et supprimer des colonnes manuellement
- **FR6:** L'utilisateur peut naviguer dans la grille au clavier (flèches, Tab, Enter)

### Commande IA (NLP)

- **FR7:** L'utilisateur peut saisir une commande en langage naturel via une barre de commande dédiée
- **FR8:** Le système interprète une commande NLP et la convertit en opérations structurées sur la grille
- **FR9:** Le système communique à l'utilisateur lorsqu'une commande n'est pas comprise ou ambiguë

### Opérations IA sur les Données

- **FR10:** L'IA peut ajouter une ou plusieurs colonnes avec des valeurs calculées
- **FR11:** L'IA peut ajouter une ou plusieurs lignes avec du contenu généré (totaux, agrégats)
- **FR12:** L'IA peut appliquer des formules à des cellules ou plages de cellules
- **FR13:** L'IA peut trier les données selon un critère spécifié
- **FR14:** L'IA peut formater des cellules (devise, décimales, gras, etc.)
- **FR15:** L'IA peut supprimer des lignes ou colonnes
- **FR16:** L'IA peut remplir automatiquement des cellules basées sur le contexte existant

### Diff Visuel & Validation

- **FR17:** Le système affiche visuellement les modifications proposées par l'IA avant application (ajout, modification, suppression)
- **FR18:** L'utilisateur peut distinguer visuellement les types de modifications (ajout vs modification vs suppression)
- **FR19:** L'utilisateur peut valider une proposition de l'IA pour l'appliquer à ses données
- **FR20:** L'utilisateur peut refuser une proposition de l'IA sans aucun impact sur ses données
- **FR21:** Aucune modification IA n'est appliquée sans validation explicite de l'utilisateur

### Architecture de Données

- **FR22:** Le système représente chaque cellule comme un objet indépendant (valeur, formule, format)
- **FR23:** Le système applique des modifications ciblées sur des cellules individuelles sans affecter les autres
- **FR24:** Le système persiste le document en cours localement (côté client)
- **FR25:** Le système supporte une grille d'au moins 1000 lignes et 26 colonnes

### Gestion de Versions

- **FR26:** Le système crée automatiquement un snapshot à chaque validation de diff
- **FR27:** L'utilisateur peut consulter l'historique des versions avec timestamps et descriptions
- **FR28:** L'utilisateur peut restaurer une version précédente en un clic
- **FR29:** Le système stocke les versions de façon incrémentale (deltas, pas copies complètes)

## Non-Functional Requirements

### Performance

| NFR | Critère mesurable |
|-----|-------------------|
| **NFR1:** Temps de réponse IA | Commande NLP → réponse structurée en < 3s (P95 < 5s) |
| **NFR2:** Rendu grille | 1000 lignes en < 500ms, scroll fluide 60fps |
| **NFR3:** Application diff | Surbrillance changements en < 200ms |
| **NFR4:** Validation/Refus | Application ou annulation diff en < 100ms |
| **NFR5:** Restauration version | Snapshot complet restauré en < 1s |
| **NFR6:** Chargement initial | FCP < 2s, TTI < 3s |
| **NFR7:** Taille bundle | < 500KB gzipped |

### Sécurité & Données

| NFR | Critère mesurable |
|-----|-------------------|
| **NFR8:** Clé API LLM | Jamais exposée côté client (proxy backend obligatoire) |
| **NFR9:** Données utilisateur | Données grille restent locales sauf appels IA |
| **NFR10:** Appels IA | Données envoyées limitées au contexte nécessaire |
| **NFR11:** HTTPS | Toutes communications API chiffrées |

### Intégration LLM

| NFR | Critère mesurable |
|-----|-------------------|
| **NFR12:** Disponibilité API | Gestion gracieuse des erreurs (timeout, rate limit, indisponibilité) |
| **NFR13:** Taux de précision | > 80% commandes NLP correctement interprétées |
| **NFR14:** Format réponse | LLM retourne des opérations structurées JSON |
| **NFR15:** Contexte minimal | Prompt IA inclut uniquement métadonnées nécessaires |

### Fiabilité & Résilience

| NFR | Critère mesurable |
|-----|-------------------|
| **NFR16:** Auto-sauvegarde | Données grille sauvegardées toutes les 30s en LocalStorage |
| **NFR17:** Récupération crash | Données retrouvées après crash/fermeture navigateur |
| **NFR18:** Intégrité versioning | Snapshots immuables, restauration ne corrompt pas l'historique |

## Risk Analysis

| Type | Risque | Mitigation |
|------|--------|------------|
| **Technique** | LLM pas assez précis pour commandes tableur | Opérations MVP simples et bien définies. Prompt engineering ciblé. Le diff protège : refuser et reformuler. |
| **Technique** | Performances grille avec beaucoup de cellules | Virtualisation dès le départ. Limite 1000 lignes MVP. |
| **Technique** | Mutations atomiques ne couvrent pas tous les cas | Fallback vers opérations plus larges si nécessaire. |
| **Technique** | Diff visuel surcharge sur gros changements | Regroupement intelligent des diffs (V2). |
| **Marché** | Utilisateurs préfèrent rester sur Excel/Sheets | "Wow moment" d'activation en < 5 min. Diff visuel comme différenciateur unique. |
| **Marché** | Concurrence Google/Microsoft | Avantage first-mover sur le modèle diff + validation + versioning. |
| **Ressource** | 1 semaine trop court pour tout livrer | Prioriser features 1-4 d'abord. Features 5-6 en semaine 2 si nécessaire. |
