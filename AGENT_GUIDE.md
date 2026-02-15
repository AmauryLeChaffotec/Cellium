# Guide Agent — Modification du spreadsheet Cellium

Ce document explique comment modifier correctement un fichier `spreadsheet.json` de Cellium.

## Localisation des fichiers

Les données se trouvent dans :
```
data/sessions/{sessionId}/spreadsheet.json
```

## Structure du fichier

```json
{
  "grid": {
    "cells": { ... },
    "rowCount": 100,
    "colCount": 26,
    "headers": ["produit", "prix", "C", ...],
    "colWidths": [100, 100, ...],
    "rowHeights": [32, 32, ...],
    "zones": [ ... ]
  },
  "snapshots": [ ... ]
}
```

## Cellules

Chaque cellule est identifiee par une lettre de colonne + un numero de ligne (base 1).
- `A1` = colonne A, ligne 1
- `B10` = colonne B, ligne 10

### Cellule avec valeur simple

```json
"A1": { "id": "A1", "value": "Poulet roti" }
"B1": { "id": "B1", "value": 12.50 }
```

La valeur peut etre un `string` ou un `number`.

### Cellule avec nom et description (OBLIGATOIRE pour les formules)

Chaque cellule de formule **DOIT** avoir un champ `name` et un champ `description` :
- `name` : label court affiche dans la cellule, au-dessus de la valeur calculee
- `description` : phrase explicative qui apparait au survol de la souris (tooltip)

Cela permet de combiner un label et une valeur/formule dans une seule cellule. **Ne jamais utiliser une cellule separee pour le label.**

```json
"B11": {
  "id": "B11",
  "value": "=SUM(B1:B10)",
  "formula": "=SUM(B1:B10)",
  "name": "Total prix",
  "description": "Somme de tous les prix de la zone produit (B1:B10)"
}
```

Affichage dans le navigateur :
```
┌──────────────┐
│ Total prix   │  ← nom en petit (badge bleu)
│ 125.70       │  ← valeur calculee
└──────────────┘
   ↑ au survol : "Somme de tous les prix de la zone produit (B1:B10)"
```

**MAUVAIS** (formule sans name ni description) :
```json
"B11": { "id": "B11", "value": "=SUM(B1:B10)", "formula": "=SUM(B1:B10)" }
```

**BON** (formule avec name ET description) :
```json
"B11": {
  "id": "B11",
  "value": "=SUM(B1:B10)",
  "formula": "=SUM(B1:B10)",
  "name": "Total prix",
  "description": "Somme de tous les prix de la zone produit (B1:B10)"
}
```

### Cellule avec formule (IMPORTANT)

Pour que la valeur se recalcule automatiquement quand les donnees changent, il faut utiliser une **formule**. Une cellule avec formule doit avoir les champs `value` ET `formula` identiques :

```json
"B11": {
  "id": "B11",
  "value": "=SUM(B1:B10)",
  "formula": "=SUM(B1:B10)"
}
```

**ATTENTION** : Ne jamais mettre une valeur statique calculee a la main. Toujours utiliser une formule pour les totaux, moyennes, etc. Sinon la valeur ne se met pas a jour quand les donnees changent.

**MAUVAIS** (valeur statique, ne se met pas a jour) :
```json
"B11": { "id": "B11", "value": 125.7 }
```

**MAUVAIS** (formule sans name ni description) :
```json
"B11": { "id": "B11", "value": "=SUM(B1:B10)", "formula": "=SUM(B1:B10)" }
```

**BON** (formule avec name ET description, se recalcule automatiquement) :
```json
"B11": {
  "id": "B11",
  "value": "=SUM(B1:B10)",
  "formula": "=SUM(B1:B10)",
  "name": "Total prix",
  "description": "Somme de tous les prix de la zone produit (B1:B10)"
}
```

## Formules disponibles

Toutes les formules commencent par `=` et acceptent une plage `DEBUT:FIN` ou une cellule unique.

| Formule | Description | Exemple |
|---------|------------|---------|
| `=SUM(B1:B10)` | Somme des valeurs | Total des prix |
| `=AVERAGE(B1:B10)` | Moyenne des valeurs | Prix moyen |
| `=MIN(B1:B10)` | Valeur minimale | Prix le moins cher |
| `=MAX(B1:B10)` | Valeur maximale | Prix le plus cher |
| `=COUNT(B1:B10)` | Nombre de valeurs numeriques | Nombre de produits avec prix |

Les formules sont insensibles a la casse (`=sum(...)` fonctionne aussi).

## Zones nommees

Les zones permettent de comprendre la structure du document. Elles definissent un rectangle de cellules avec un nom et une description.

```json
"zones": [
  {
    "id": "uuid",
    "name": "produit",
    "description": "Liste des produits et prix",
    "color": "#4CAF50",
    "startCell": "A1",
    "endCell": "B10"
  }
]
```

### Comment utiliser les zones

1. **Lire les zones** pour comprendre quelles donnees sont ou
2. **Utiliser les plages des zones** pour construire les formules
3. Par exemple, si la zone "produit" va de `A1` a `B10`, la colonne B contient les prix de B1 a B10

## En-tetes de colonnes

Le tableau `headers` contient les noms des colonnes. Utiliser ces noms pour comprendre le contenu :
```json
"headers": ["produit", "prix", "C", "D", ...]
```
- Index 0 = colonne A = "produit"
- Index 1 = colonne B = "prix"

Les colonnes avec des noms par defaut ("C", "D", ...) sont vides/inutilisees.

## Regles importantes

1. **Toujours utiliser des formules** pour les calculs (totaux, moyennes, etc.), jamais des valeurs statiques
2. **Un resultat = une seule cellule** avec `name` ET `description`. Ne pas utiliser une cellule pour le label et une autre pour la valeur
3. **Toujours ajouter `name` et `description`** a chaque cellule de formule. Le `name` est un label court, la `description` explique ce que la formule calcule et sur quelle plage
3. **Ne pas modifier** `rowCount`, `colCount`, `colWidths`, `rowHeights` sauf si on ajoute/supprime des lignes ou colonnes
4. **Ne pas modifier les zones** sauf si l'utilisateur le demande
5. **Ne pas toucher aux snapshots** sauf si l'utilisateur le demande
6. **Placer les totaux/resultats en dehors des zones** (ligne juste apres la derniere ligne de la zone)
7. **Conserver le champ `id`** identique a la cle de la cellule

## Exemple complet

L'utilisateur demande : "Ajoute le total des prix et le nombre de produits"

Zone existante : `A1:B10`, colonne A = produits, colonne B = prix.

Cellule a ajouter (une seule cellule par resultat, avec `name` + `description` + `formula`) :
```json
"B11": {
  "id": "B11",
  "value": "=SUM(B1:B10)",
  "formula": "=SUM(B1:B10)",
  "name": "Total prix",
  "description": "Somme de tous les prix de la colonne B, lignes 1 a 10"
},
"B12": {
  "id": "B12",
  "value": "=COUNT(B1:B10)",
  "formula": "=COUNT(B1:B10)",
  "name": "Nb produits",
  "description": "Nombre de produits avec un prix dans la colonne B, lignes 1 a 10"
}
```

Resultat affiche dans le navigateur :
- B11 affichera "Total prix" en petit + la somme calculee (ex: 125.70). Au survol : "Somme de tous les prix..."
- B12 affichera "Nb produits" en petit + le nombre (ex: 10). Au survol : "Nombre de produits..."
- Si on modifie un prix, les totaux se mettent a jour instantanement
- Chaque resultat tient dans une seule cellule
- L'utilisateur peut faire clic droit sur la cellule pour voir et modifier la formule
