# Guide d'utilisation de Cellium

## Qu'est-ce que Cellium ?

Cellium est un tableur intelligent qui vous permet de manipuler vos données simplement en décrivant ce que vous voulez faire en français. Plus besoin de connaître des formules complexes ou de manipuler manuellement vos données : demandez simplement à Cellium ce que vous souhaitez et il le fera pour vous.

---

## Démarrage rapide

### 1. Accéder à l'application

Une fois l'application lancée, vous verrez :
- **En haut** : Le titre "Cellium" et un bouton "Historique"
- **Juste en dessous** : Une barre de commande avec un champ de texte
- **Au centre** : Votre tableur (grille de cellules)

### 2. Votre première commande

Dans la barre de commande, tapez simplement ce que vous voulez faire, par exemple :
- "Ajoute une colonne nommée Prix"
- "Supprime la ligne 5"
- "Trie les données par ordre alphabétique"
- "Calcule la moyenne de la colonne B"

Appuyez sur le bouton **"Envoyer"** ou sur la touche **Entrée**.

---

## Fonctionnalités principales

### 🤖 Commandes en langage naturel

C'est la fonctionnalité principale de Cellium. Au lieu d'utiliser des formules ou des menus complexes, vous décrivez simplement ce que vous voulez faire.

#### Exemples de commandes

**Ajout de données :**
- "Ajoute une nouvelle colonne appelée Email"
- "Insère une ligne en haut du tableau"
- "Crée une colonne Total qui multiplie Prix par Quantité"

**Modification de données :**
- "Remplace tous les tirets par des espaces"
- "Mets la première colonne en majuscules"
- "Arrondis les nombres de la colonne Prix à 2 décimales"

**Tri et filtrage :**
- "Trie par date croissante"
- "Classe les lignes par ordre alphabétique du nom"
- "Supprime les lignes vides"

**Calculs :**
- "Calcule la somme de la colonne Montant"
- "Trouve la valeur maximale dans la colonne Score"
- "Compte le nombre de lignes"

#### Comment ça marche ?

1. Tapez votre commande dans le champ de texte
2. Cliquez sur "Envoyer" ou appuyez sur Entrée
3. Cellium analyse votre demande grâce à l'intelligence artificielle
4. Les changements proposés s'affichent en prévisualisation
5. Vous validez ou refusez les changements

### ✅ Prévisualisation des changements (Diff)

Avant d'appliquer les modifications à votre tableur, Cellium vous montre exactement ce qui va changer.

**Légende des couleurs :**
- 🟢 **Vert** : Nouvelles données qui seront ajoutées
- 🔴 **Rouge** : Données qui seront supprimées
- 🟡 **Jaune** : Données qui seront modifiées

**Actions possibles :**
- **Valider** (Ctrl + Entrée) : Appliquer les changements
- **Refuser** (Échap) : Annuler les changements

⚠️ **Important** : Tant que vous n'avez pas validé ou refusé les changements en cours, vous ne pouvez pas envoyer de nouvelle commande.

### 📚 Historique des versions

Cellium garde automatiquement un historique de toutes les versions de votre tableur.

#### Comment accéder à l'historique ?

1. Cliquez sur le bouton **"Historique"** en haut à droite
2. Un panneau s'ouvre sur la droite avec la liste de toutes les versions

#### Que contient chaque version ?

- **Date et heure** de la modification
- **Description** de ce qui a été fait
- **Bouton Restaurer** pour revenir à cette version

#### Restaurer une version précédente

1. Ouvrez l'historique
2. Trouvez la version que vous souhaitez récupérer
3. Cliquez sur **"Restaurer"**
4. Votre tableur revient à l'état de cette version

⚠️ **Attention** : La restauration crée une nouvelle version. Vous ne perdez donc jamais vos données.

---

## Raccourcis clavier

Pour travailler plus rapidement, utilisez ces raccourcis :

| Touche(s) | Action |
|-----------|--------|
| **Entrée** | Envoyer la commande |
| **Ctrl + Entrée** | Valider les changements proposés |
| **Échap** | Refuser les changements proposés |

---

## Messages et notifications

### 🔄 "Traitement..."

L'application analyse votre commande. Patientez quelques instants.

### ⚠️ "Veuillez valider ou refuser les changements en cours..."

Vous devez d'abord accepter ou refuser les modifications proposées avant de pouvoir envoyer une nouvelle commande.

### ❌ Messages d'erreur (fond rouge)

Si quelque chose ne fonctionne pas :
- Vérifiez que votre commande est claire
- Assurez-vous que les données existent (ex: ne pas demander de trier une colonne qui n'existe pas)
- Cliquez sur le **✕** pour fermer le message d'erreur
- Reformulez votre commande

### 💬 Demandes de clarification (fond jaune)

Parfois, Cellium a besoin de plus d'informations :
- Lisez attentivement la question
- Reformulez votre commande avec plus de détails
- Exemple : Si vous dites "supprime les doublons", Cellium peut demander "Sur quelle colonne ?"

---

## Conseils d'utilisation

### ✍️ Comment bien formuler vos commandes

**Soyez précis :**
- ❌ "Change les données"
- ✅ "Remplace les virgules par des points dans la colonne Prix"

**Mentionnez les noms de colonnes :**
- ❌ "Trie les données"
- ✅ "Trie par ordre croissant de la colonne Date"

**Une action à la fois :**
- ❌ "Ajoute une colonne Total et trie par prix et supprime les doublons"
- ✅ "Ajoute une colonne Total"
- Puis : ✅ "Trie par prix croissant"
- Puis : ✅ "Supprime les doublons dans la colonne Nom"

### 🔒 Vérifiez avant de valider

Prenez toujours le temps de regarder la prévisualisation des changements avant de valider. C'est votre filet de sécurité pour éviter les erreurs.

### 💾 Sauvegardez vos données importantes

Bien que Cellium conserve un historique des versions, il est toujours prudent d'exporter régulièrement vos données importantes.

---

## Questions fréquentes

### L'application ne répond pas à ma commande, que faire ?

1. Vérifiez qu'il n'y a pas de changements en attente de validation
2. Attendez que le traitement précédent soit terminé
3. Reformulez votre commande de manière plus simple
4. Assurez-vous que votre connexion internet fonctionne

### Puis-je annuler une modification ?

Oui ! Utilisez l'historique des versions pour restaurer l'état précédent de votre tableur.

### Combien de versions sont conservées ?

Toutes vos versions sont sauvegardées localement dans votre navigateur. Elles persistent même si vous fermez et rouvrez l'application.

### Mes données sont-elles sécurisées ?

Vos données sont stockées localement dans votre navigateur. Seules les commandes sont envoyées au serveur d'intelligence artificielle pour être analysées, jamais l'intégralité de vos données.

---

## Limites et bonnes pratiques

### Ce que Cellium fait très bien :
- ✅ Manipulations simples et courantes de données
- ✅ Calculs basiques
- ✅ Tri et organisation
- ✅ Nettoyage de données

### Ce qui peut nécessiter plusieurs étapes :
- ⚠️ Opérations très complexes (décomposez-les en plusieurs commandes)
- ⚠️ Transformations inhabituelles (soyez très précis dans votre description)

---

## Besoin d'aide ?

Si vous rencontrez un problème :
1. Consultez la section "Messages et notifications" de ce guide
2. Vérifiez que votre commande est claire et précise
3. Regardez les exemples de commandes pour vous inspirer
4. N'hésitez pas à reformuler différemment

---

**Bon travail avec Cellium ! 🎉**
