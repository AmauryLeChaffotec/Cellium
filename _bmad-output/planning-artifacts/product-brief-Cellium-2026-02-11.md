---
stepsCompleted: [1, 2, 3, 4, 5, 6]
workflow_completed: true
inputDocuments:
  - '_bmad-output/brainstorming/brainstorming-session-2026-02-11.md'
date: 2026-02-11
author: Amaurylechaffotec
---

# Product Brief: Cellium

## Executive Summary

**Cellium** est un tableur intelligent piloté par IA qui permet aux utilisateurs de travailler sur leurs données en langage naturel, sans se soucier des formules, du formatage ou du nettoyage. L'IA exécute des actions complètes et instantanées directement dans le fichier — création de colonnes, remplissage automatique, transformations de données — le tout présenté sous forme de diff visuel que l'utilisateur valide ou refuse avant application. Avec un versioning intégré de type Git, Cellium garantit un contrôle total et une traçabilité complète. La philosophie : l'utilisateur pense et analyse, l'IA exécute la plomberie des données.

---

## Core Vision

### Problem Statement

La collaboration entre l'humain et l'IA sur des données tabulaires est aujourd'hui inefficace et frustrante. Les utilisateurs perdent un temps considérable sur des tâches mécaniques — nettoyage, standardisation, formatage, écriture de formules — au lieu de se concentrer sur l'analyse et les conclusions. Les outils existants (Excel, Google Sheets) n'intègrent pas l'IA de manière fluide, et quand une IA intervient, elle est obligée de régénérer des fichiers entiers, ce qui est lent, risqué et opaque.

### Problem Impact

- **Temps perdu :** La majorité du temps sur un tableur est consacrée à la préparation des données, pas à leur exploitation
- **Barrière technique :** Les formules complexes, les macros et le formatage excluent les utilisateurs non-techniques
- **Collaboration IA défaillante :** Le copier-coller entre un chat IA et un tableur est pénible, les modifications sont partielles ou incomplètes
- **Risque d'erreur :** Sans diff ni versioning, une modification IA peut casser un fichier sans possibilité de retour fiable

### Why Existing Solutions Fall Short

| Solution | Limitation |
|----------|-----------|
| **Excel / Google Sheets** | Pas de collaboration IA native, formules complexes, formatage manuel |
| **Copilot pour Excel** | Intégration superficielle, pas de diff, modifications opaques, régénération lente |
| **ChatGPT / Claude + copier-coller** | Workflow cassé, va-et-vient pénible, pas de vision du fichier en temps réel |
| **Airtable / Notion** | Pas de vraie puissance tableur, pas de formules avancées, pas de collaboration IA sur les données |
| **Outils no-code** | Complexes à configurer, pas conçus pour l'exploration de données |

Aucune solution n'offre aujourd'hui : actions IA instantanées et complètes + diff visuel + versioning + interface tableur familière.

### Proposed Solution

**Cellium** — un tableur à l'apparence familière (style Excel) dont le moteur interne est une architecture JSON cellulaire conçue pour la collaboration IA :

- **Langage naturel → Action :** L'utilisateur décrit ce qu'il veut ("ajoute une colonne marge et calcule prix - coût"), l'IA exécute instantanément via des patches chirurgicaux
- **Diff visuel systématique :** Chaque modification IA est affichée en surbrillance (vert/orange/rouge) avec annotations explicatives — rien ne change sans validation
- **Versioning Git-like :** Chaque validation crée un snapshot, navigation dans l'historique, comparaison de versions, tags nommés
- **Focus sur l'analyse :** L'IA gère le nettoyage, la standardisation, le formatage — l'utilisateur se concentre sur les conclusions et les décisions

### Key Differentiators

1. **Architecture JSON cellulaire + mutations atomiques :** L'IA modifie chirurgicalement les cellules ciblées sans jamais réécrire le fichier entier — rapide, fiable, précis
2. **Diff visuel + validation obligatoire :** L'utilisateur garde un contrôle total — chaque modification est transparente, expliquée et réversible
3. **Versioning natif :** Historique complet, branches, tags — fini le chaos des versions de fichiers
4. **IA complète et instantanée :** Pas de modifications partielles — quand l'IA agit, elle agit sur tous les éléments concernés en une seule opération

## Target Users

### Primary Users

**Persona 1 — Marie, Comptable PME (35 ans)**
- **Contexte :** Gère la comptabilité de 3 petites entreprises. Utilise Excel quotidiennement depuis 10 ans.
- **Compétences :** Maîtrise les formules basiques (SUM, VLOOKUP) mais bloquée dès que ça se complexifie. N'a jamais écrit une macro.
- **Motivation :** Gagner du temps pour se concentrer sur le conseil client plutôt que sur la saisie et le nettoyage.
- **Pain actuel :** Passe 2h à nettoyer des exports bancaires CSV avant de pouvoir analyser. Formate manuellement chaque tableau. Gère des fichiers "Budget_v3_FINAL.xlsx".
- **Moment Aha :** Elle dit "nettoie ces données et fais le rapprochement bancaire" — Cellium le fait en 30 secondes, elle voit le diff, valide, et passe directement à l'analyse.
- **Succès :** Marie divise par 3 son temps de préparation de données et ne touche plus jamais une formule complexe.

**Persona 2 — Sophie, Chef de projet / Manager (40 ans)**
- **Contexte :** Coordonne une équipe de 12 personnes. Utilise des tableurs pour le suivi de projet, les budgets et le reporting hebdomadaire.
- **Compétences :** Sait remplir un tableau mais ne maîtrise ni les tableaux croisés dynamiques ni les graphiques avancés. Demande souvent de l'aide à un collègue technique.
- **Motivation :** Produire des reportings clairs et visuels pour ses réunions sans dépendre de quelqu'un d'autre.
- **Pain actuel :** Passe du temps à formater des tableaux pour les rendre présentables. N'arrive pas à créer les visualisations qu'elle a en tête. Perd des modifications quand plusieurs personnes éditent le même fichier.
- **Moment Aha :** Elle dit "fais un résumé visuel du budget par département avec un graphique" — Cellium génère le tableau + graphique en diff, elle valide, c'est prêt pour la réunion.
- **Succès :** Sophie produit ses reportings en autonomie et en 10 minutes au lieu d'une heure.

**Persona 3 — Lucas, Étudiant / Débutant (22 ans)**
- **Contexte :** Étudiant en sciences sociales, premier vrai projet nécessitant des données chiffrées. N'a quasiment jamais utilisé Excel.
- **Compétences :** Zéro. Ne connaît aucune formule, intimidé par l'interface d'Excel.
- **Motivation :** Rendre un projet avec des statistiques et des graphiques sans passer des heures à apprendre Excel.
- **Pain actuel :** Bloqué dès qu'il faut faire un calcul ou un graphique. Passe plus de temps à chercher comment faire qu'à analyser ses données.
- **Moment Aha :** Il dit "calcule la moyenne par catégorie et fais un graphique en barres" — Cellium exécute, explique ce qu'il a fait (bouton "Pourquoi ?"), et Lucas apprend en même temps.
- **Succès :** Lucas rend un projet avec des stats et des visualisations professionnelles sans avoir appris une seule formule.

### Secondary Users

**Karim, Data Analyst (28 ans)**
- **Contexte :** Analyste dans une startup, jongle entre Python, SQL et Excel. Technique mais pressé.
- **Usage de Cellium :** Utilise Cellium pour les tâches rapides de nettoyage/transformation qui ne justifient pas un script Python. Partage des tableurs Cellium avec ses collègues non-techniques qui peuvent les manipuler via l'IA sans casser les données.
- **Valeur :** Pont entre le monde technique et non-technique — Karim prépare des structures que ses collègues exploitent en langage naturel.

### User Journey

| Étape | Marie (Comptable) | Sophie (Manager) | Lucas (Étudiant) |
|-------|-------------------|-------------------|-------------------|
| **Découverte** | Recommandation d'un collègue ou article spécialisé compta | Démonstration en réunion par un collègue | Recommandation d'un camarade ou d'un prof |
| **Onboarding** | Importe son premier CSV, dit "nettoie et formate", voit le diff — convaincue | Ouvre un tableur existant, demande "fais un graphique de ce tableau" — immédiat | Ouvre Cellium, tape "aide-moi à analyser ces données" — guidé pas à pas |
| **Usage quotidien** | Nettoyage d'exports, rapprochements, formules via chat | Reporting hebdo, suivi budget, visualisations pour réunions | Calculs statistiques, graphiques pour projets, exploration de données |
| **Moment Aha** | "J'ai fait en 30 sec ce qui me prenait 2h" | "J'ai fait mon reporting toute seule" | "Je comprends enfin mes données" |
| **Long terme** | Ne peut plus s'en passer, recommande à ses clients | Déploie dans son équipe, demande la version collaborative | Utilise pour tous ses cours, recommande à sa promo |

## Success Metrics

### North Star Metric

**Nombre de commandes IA validées par utilisateur par semaine** — La métrique qui prouve que Cellium crée de la valeur. Si l'utilisateur demande des actions à l'IA et valide les diffs, le produit fonctionne.

### User Success Metrics

| Métrique | Mesure | Cible |
|----------|--------|-------|
| **Activation** | L'utilisateur exécute sa 1ère commande IA et valide le diff | > 70% des nouveaux inscrits dans les 5 premières minutes |
| **Usage récurrent** | Sessions par semaine par utilisateur actif | > 3 sessions/semaine |
| **Commandes IA / session** | Nombre moyen de commandes IA par session | > 5 commandes/session |
| **Taux d'acceptation des diffs** | % de diffs validés vs refusés | > 80% (signe que l'IA est pertinente) |
| **Rétention J7 / J30** | % d'utilisateurs qui reviennent après 7 et 30 jours | J7 > 40%, J30 > 25% |

### Business Objectives — Modèle Freemium

| Horizon | Objectif |
|---------|----------|
| **3 mois** | MVP fonctionnel, premiers utilisateurs beta, validation du concept (les gens utilisent-ils l'IA dans le tableur ?) |
| **6 mois** | Croissance organique, premières conversions free → premium, feedback loop établie |
| **12 mois** | Base d'utilisateurs actifs stable, taux de conversion freemium viable, features premium validées par l'usage |

### Key Performance Indicators

| KPI | Description |
|-----|-------------|
| **MAU (Monthly Active Users)** | Nombre d'utilisateurs actifs mensuels |
| **Taux de conversion Free → Premium** | % d'utilisateurs gratuits qui passent payant |
| **Commandes IA totales / jour** | Volume total d'interactions IA (indicateur de santé produit) |
| **Time-to-value** | Temps entre l'inscription et la première commande IA validée (cible : < 5 min) |
| **NPS (Net Promoter Score)** | Recommandation utilisateur (cible : > 40) |
| **Churn mensuel** | % d'utilisateurs qui arrêtent d'utiliser Cellium (cible : < 8%) |

## MVP Scope

### Core Features (1 semaine)

| # | Feature | Description |
|---|---------|-------------|
| 1 | **Grille tableur** | Interface de grille style Excel — affichage, sélection, édition manuelle de cellules. Minimaliste, pas de ruban. |
| 2 | **Barre de commande IA** | Un input en langage naturel en haut ou en bas de l'écran. L'utilisateur tape sa commande, l'IA exécute. |
| 3 | **Moteur IA → Actions** | L'IA interprète les commandes et génère des opérations : ajouter/supprimer colonnes et lignes, écrire des formules, trier, formater, remplir automatiquement. |
| 4 | **Diff visuel + Validation** | Chaque action IA affiche un diff coloré (vert=ajout, orange=modif, rouge=suppression) avec boutons Valider / Refuser. Rien ne s'applique sans validation. |
| 5 | **Architecture JSON cellulaire** | Chaque cellule = objet JSON indépendant. L'IA envoie des patches ciblés (mutations atomiques), jamais de réécriture complète. |
| 6 | **Versioning simplifié** | Chaque validation de diff crée un snapshot automatique. Historique consultable avec timestamps + descriptions. Restauration en un clic. |

### Out of Scope for MVP

| Feature | Reporté à | Raison |
|---------|-----------|--------|
| Chat sidebar complet | V2 | La barre de commande suffit pour valider le concept |
| Graphiques / visualisations | V2 | Focus sur la manipulation de données d'abord |
| Import CSV / multi-format | V2 | Saisie manuelle ou données pré-chargées pour le MVP |
| Branches, tags, comparaison de versions | V2 | Versioning simplifié suffit pour le MVP |
| Annotations IA sur les diffs | V2 | Le diff visuel seul suffit pour la validation |
| Collaboration multi-utilisateurs | V3 | Nécessite infrastructure complexe |
| Commande vocale | V3+ | Nice-to-have, pas essentiel |
| Templates et plugins | V3+ | Nécessite un écosystème établi |
| Marketplace communautaire | V3+ | Nécessite une base d'utilisateurs |

### MVP Success Criteria

- Les utilisateurs peuvent taper une commande en langage naturel et obtenir un résultat correct
- Le diff s'affiche correctement et la validation/refus fonctionne
- Le versioning capture chaque état et permet la restauration
- Le time-to-value est < 5 minutes (de l'ouverture à la première commande IA validée)
- Le taux d'acceptation des diffs est > 70% (l'IA comprend ce qu'on lui demande)

### Future Vision

**V2 (mois 2-3) :** Import CSV, chat sidebar, graphiques auto, annotations IA, versioning avancé (branches, tags, comparaison), diff multi-niveaux

**V3 (mois 4-6) :** Collaboration multi-utilisateurs, permissions par zone, templates métier, connexion API, export multi-format

**V4+ (6 mois+) :** Marketplace communautaire, plugins métier, commande vocale, IA prédictive, automatisation par observation
