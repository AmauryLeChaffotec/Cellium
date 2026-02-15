interface HelpModalProps {
  onClose: () => void;
}

const formulaSections = [
  {
    title: 'Mathematiques / Statistiques (plage)',
    formulas: [
      { name: 'SUM', syntax: '=SUM(B1:B10, C1:C10, D5)', desc: 'Somme — multi-plages, verticale ou horizontale' },
      { name: 'AVERAGE', syntax: '=AVERAGE(B1:B10, C1:C10)', desc: 'Moyenne — multi-plages' },
      { name: 'MIN', syntax: '=MIN(B1:B10, C1:C10)', desc: 'Valeur minimale — multi-plages' },
      { name: 'MAX', syntax: '=MAX(B1:B10, C1:C10)', desc: 'Valeur maximale — multi-plages' },
      { name: 'COUNT', syntax: '=COUNT(B1:B10, C1:C10)', desc: 'Nombre de valeurs numeriques — multi-plages' },
      { name: 'COUNTA', syntax: '=COUNTA(B1:B10, C1:C10)', desc: 'Cellules non vides — multi-plages' },
      { name: 'COUNTBLANK', syntax: '=COUNTBLANK(B1:B10)', desc: 'Nombre de cellules vides' },
      { name: 'MEDIAN', syntax: '=MEDIAN(B1:B10, C1:C10)', desc: 'Mediane — multi-plages' },
      { name: 'PRODUCT', syntax: '=PRODUCT(B1:B10)', desc: 'Produit de toutes les valeurs' },
      { name: 'STDEV', syntax: '=STDEV(B1:B10)', desc: 'Ecart-type (echantillon)' },
    ],
  },
  {
    title: 'Mathematiques (valeur)',
    formulas: [
      { name: 'ABS', syntax: '=ABS(A1)', desc: 'Valeur absolue' },
      { name: 'INT', syntax: '=INT(A1)', desc: 'Partie entiere (tronque les decimales)' },
      { name: 'SQRT', syntax: '=SQRT(A1)', desc: 'Racine carree' },
      { name: 'ROUND', syntax: '=ROUND(A1, 2)', desc: 'Arrondi a N decimales' },
      { name: 'ROUNDUP', syntax: '=ROUNDUP(A1, 0)', desc: 'Arrondi au superieur' },
      { name: 'ROUNDDOWN', syntax: '=ROUNDDOWN(A1, 0)', desc: "Arrondi a l'inferieur" },
      { name: 'MOD', syntax: '=MOD(A1, 3)', desc: 'Reste de la division (modulo)' },
      { name: 'POWER', syntax: '=POWER(A1, 2)', desc: 'Puissance (base, exposant)' },
    ],
  },
  {
    title: 'Logique',
    formulas: [
      { name: 'IF', syntax: '=IF(A1>5, "Oui", "Non")', desc: 'Condition : si vrai, valeur 1, sinon valeur 2' },
      { name: 'IFERROR', syntax: '=IFERROR(A1/B1, 0)', desc: 'Renvoie une valeur alternative en cas d\'erreur' },
      { name: 'AND', syntax: '=AND(A1>0, B1>0)', desc: 'Vrai si toutes les conditions sont vraies' },
      { name: 'OR', syntax: '=OR(A1>0, B1>0)', desc: 'Vrai si au moins une condition est vraie' },
      { name: 'COUNTIF', syntax: '=COUNTIF(B1:B10, ">5")', desc: 'Compte les cellules qui respectent un critere' },
      { name: 'SUMIF', syntax: '=SUMIF(B1:B10, ">5")', desc: 'Somme les cellules qui respectent un critere' },
      { name: 'COUNTIFS', syntax: '=COUNTIFS(A1:A10, ">5", B1:B10, "<10")', desc: 'Compte avec plusieurs criteres' },
      { name: 'SUMIFS', syntax: '=SUMIFS(C1:C10, A1:A10, ">5", B1:B10, "<10")', desc: 'Somme avec plusieurs criteres' },
    ],
  },
  {
    title: 'Texte',
    formulas: [
      { name: 'CONCAT', syntax: '=CONCAT(A1, " ", B1)', desc: 'Concatene (assemble) des textes' },
      { name: 'UPPER', syntax: '=UPPER(A1)', desc: 'Convertit en majuscules' },
      { name: 'LOWER', syntax: '=LOWER(A1)', desc: 'Convertit en minuscules' },
      { name: 'LEN', syntax: '=LEN(A1)', desc: 'Nombre de caracteres du texte' },
      { name: 'LEFT', syntax: '=LEFT(A1, 3)', desc: 'Premiers N caracteres' },
      { name: 'RIGHT', syntax: '=RIGHT(A1, 4)', desc: 'Derniers N caracteres' },
      { name: 'MID', syntax: '=MID(A1, 2, 3)', desc: 'Sous-chaine a partir de la position N' },
      { name: 'TRIM', syntax: '=TRIM(A1)', desc: 'Supprime les espaces en debut/fin' },
    ],
  },
  {
    title: 'Date',
    formulas: [
      { name: 'TODAY', syntax: '=TODAY()', desc: 'Date du jour (AAAA-MM-JJ)' },
      { name: 'NOW', syntax: '=NOW()', desc: 'Date et heure actuelles' },
      { name: 'DATE', syntax: '=DATE(2024, 1, 15)', desc: 'Cree une date a partir d\'annee, mois, jour' },
      { name: 'YEAR', syntax: '=YEAR(A1)', desc: 'Extrait l\'annee d\'une date' },
      { name: 'MONTH', syntax: '=MONTH(A1)', desc: 'Extrait le mois d\'une date' },
      { name: 'DAY', syntax: '=DAY(A1)', desc: 'Extrait le jour d\'une date' },
    ],
  },
  {
    title: 'Recherche',
    formulas: [
      { name: 'VLOOKUP', syntax: '=VLOOKUP("Paris", A1:C10, 3)', desc: 'Recherche verticale : cherche dans la 1ere colonne, retourne la Nieme' },
      { name: 'HLOOKUP', syntax: '=HLOOKUP("Prix", A1:Z3, 2)', desc: 'Recherche horizontale : cherche dans la 1ere ligne, retourne la Nieme' },
      { name: 'XLOOKUP', syntax: '=XLOOKUP("Paris", A1:A10, B1:B10, "N/A")', desc: 'Recherche flexible avec valeur par defaut' },
      { name: 'INDEX', syntax: '=INDEX(A1:C10, 2, 3)', desc: 'Retourne la valeur a la position (ligne, colonne)' },
      { name: 'MATCH', syntax: '=MATCH("Paris", A1:A10)', desc: 'Retourne la position d\'une valeur dans une plage' },
    ],
  },
];

export function HelpModal({ onClose }: HelpModalProps) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-white rounded-xl shadow-2xl w-[90vw] max-w-3xl max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 shrink-0">
          <h2 className="text-lg font-bold text-gray-900">Aide - Cellium</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition text-xl leading-none px-2"
          >
            &#x2715;
          </button>
        </div>

        {/* Scrollable content */}
        <div className="overflow-y-auto px-6 py-6 space-y-8">

          {/* Introduction */}
          <section>
            <p className="text-gray-600 leading-relaxed">
              Cellium est un tableur intelligent avec un <strong>agent IA integre</strong>.
              Manipule tes donnees dans la grille, utilise des formules,
              ou <strong>demande a l'agent IA</strong> de le faire pour toi en langage naturel.
            </p>
          </section>

          {/* Prise en main */}
          <section>
            <h3 className="text-base font-semibold text-gray-800 mb-3">Prise en main</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Card title="Editer une cellule" desc="Double-clique sur une cellule pour la modifier. Valide avec Shift+Enter ou Tab." />
              <Card title="Renommer une colonne" desc="Clique sur l'en-tete d'une colonne (A, B, C...) pour la renommer." />
              <Card title="Creer une zone" desc="Selectionne des cellules (clic + glisser), puis clic droit pour creer une zone nommee." />
              <Card title="Modifier une formule" desc="Clic droit sur une cellule avec formule pour voir sa plage et la modifier." />
              <Card title="Creer un graphique" desc="Selectionne une plage de donnees, clic droit, puis 'Creer un graphique' pour visualiser tes donnees." />
              <Card title="Styliser une ligne" desc="Clic droit sur une ligne pour ajouter un titre de section, un separateur ou une couleur." />
              <Card title="Type de colonne" desc="Clic droit sur une colonne pour definir son type : texte, nombre, monnaie, pourcentage, date..." />
              <Card title="Exporter" desc="Utilise les boutons .xlsx et .csv dans la barre d'outils pour exporter ton tableur." />
            </div>
          </section>

          {/* Agent IA */}
          <section className="bg-blue-50 rounded-lg p-5 border border-blue-100">
            <h3 className="text-base font-semibold text-blue-900 mb-2">L'agent IA</h3>
            <p className="text-sm text-blue-800 mb-3">
              Utilise le <strong>chat en bas a droite</strong> pour demander a l'agent de modifier ton tableur.
              Il peut :
            </p>
            <ul className="space-y-1.5 text-sm text-blue-800">
              <li><strong>Ajouter des formules</strong> : "Calcule le total de la colonne Prix"</li>
              <li><strong>Analyser vos donnees</strong> : "Quel est le produit le plus cher ?"</li>
              <li><strong>Remplir des cellules</strong> : "Ajoute une colonne categorie"</li>
              <li><strong>Creer des zones</strong> : "Cree une zone Produits sur A et B"</li>
              <li><strong>Organiser les lignes</strong> : "Ajoute un titre de section a la ligne 1"</li>
            </ul>
            <p className="text-blue-600 text-xs mt-3 italic">
              L'agent ajoute automatiquement un nom et une description a chaque formule.
            </p>
          </section>

          {/* Noms de colonnes */}
          <section>
            <h3 className="text-base font-semibold text-gray-800 mb-2">Noms de colonnes dans les formules</h3>
            <p className="text-sm text-gray-600 mb-2">
              Utilise le nom de la colonne au lieu de la lettre :
            </p>
            <div className="bg-gray-50 rounded-lg p-3 font-mono text-xs space-y-1 border border-gray-200">
              <p><span className="text-green-700">=SUM(Prix1:Prix10)</span> au lieu de =SUM(B1:B10)</p>
              <p><span className="text-green-700">=MIN(Population1:Population66)</span> au lieu de =MIN(B1:B66)</p>
            </div>
            <p className="text-gray-400 text-xs mt-1.5">
              Insensible a la casse : sum, SUM, Sum fonctionnent tous.
            </p>
          </section>

          {/* Types de plages */}
          <section>
            <h3 className="text-base font-semibold text-gray-800 mb-2">Types de plages</h3>
            <p className="text-sm text-gray-600 mb-2">
              Les formules supportent trois types de plages et peuvent combiner plusieurs plages :
            </p>
            <div className="bg-gray-50 rounded-lg p-3 font-mono text-xs space-y-2 border border-gray-200">
              <p><strong className="text-gray-700 font-sans">Verticale :</strong> <span className="text-green-700">=SUM(A1:A10)</span> — une colonne, plusieurs lignes</p>
              <p><strong className="text-gray-700 font-sans">Horizontale :</strong> <span className="text-green-700">=SUM(A1:Z1)</span> — une ligne, plusieurs colonnes</p>
              <p><strong className="text-gray-700 font-sans">2D :</strong> <span className="text-green-700">=SUM(A1:C10)</span> — bloc de cellules</p>
              <p><strong className="text-gray-700 font-sans">Multi-plages :</strong> <span className="text-green-700">=SUM(A1:A10, C1:C10, E5)</span> — combine plages et cellules</p>
            </div>
          </section>

          {/* Formules */}
          <section>
            <h3 className="text-base font-semibold text-gray-800 mb-4">Toutes les formules disponibles</h3>
            <div className="space-y-5">
              {formulaSections.map((section) => (
                <div key={section.title}>
                  <h4 className="text-sm font-medium text-gray-500 mb-2 uppercase tracking-wide">
                    {section.title}
                  </h4>
                  <div className="overflow-hidden rounded-lg border border-gray-200">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="text-left px-3 py-1.5 font-medium text-gray-500 text-xs w-24">Formule</th>
                          <th className="text-left px-3 py-1.5 font-medium text-gray-500 text-xs">Syntaxe</th>
                          <th className="text-left px-3 py-1.5 font-medium text-gray-500 text-xs">Description</th>
                        </tr>
                      </thead>
                      <tbody>
                        {section.formulas.map((f, i) => (
                          <tr key={f.name} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                            <td className="px-3 py-1.5 font-semibold text-blue-700 text-xs">{f.name}</td>
                            <td className="px-3 py-1.5 font-mono text-xs text-gray-600">{f.syntax}</td>
                            <td className="px-3 py-1.5 text-xs text-gray-500">{f.desc}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Graphiques */}
          <section>
            <h3 className="text-base font-semibold text-gray-800 mb-2">Graphiques</h3>
            <p className="text-sm text-gray-600 mb-3">
              Cree des graphiques interactifs a partir de tes donnees pour mieux les visualiser.
            </p>
            <div className="space-y-2">
              <div className="bg-gray-50 rounded-lg p-3 border border-gray-200 text-sm text-gray-600 space-y-2">
                <p><strong>Creer un graphique :</strong> Selectionne une plage de cellules (ex: A1:C10), fais un clic droit, puis "Creer un graphique".</p>
                <p><strong>Plage de donnees :</strong> La premiere colonne sert de labels (noms), les colonnes suivantes sont les series de donnees.</p>
                <p><strong>Types disponibles :</strong></p>
                <div className="grid grid-cols-2 gap-1.5 ml-2">
                  <span>Barres — comparaison de valeurs</span>
                  <span>Ligne — evolution / tendances</span>
                  <span>Camembert — repartition / parts</span>
                  <span>Aire — volumes cumules</span>
                </div>
                <p><strong>Interactions :</strong> Deplace le graphique en glissant la barre de titre. Redimensionne avec la poignee en bas a droite. Clique sur l'engrenage pour modifier, ou la croix pour supprimer.</p>
                <p><strong>Mise a jour :</strong> Les graphiques se mettent a jour automatiquement quand les donnees des cellules changent.</p>
              </div>
            </div>
          </section>

          {/* Styles de ligne */}
          <section>
            <h3 className="text-base font-semibold text-gray-800 mb-2">Styles de ligne</h3>
            <p className="text-sm text-gray-600 mb-3">
              Ameliore la lisibilite de ton tableur en stylisant les lignes.
              Clic droit sur une ligne, puis "Style de ligne".
            </p>
            <div className="bg-gray-50 rounded-lg p-3 border border-gray-200 text-sm text-gray-600 space-y-1.5">
              <p><strong>Titre de section :</strong> Transforme la ligne en bandeau de titre (fond colore, texte blanc, gras). Ideal pour separer les parties.</p>
              <p><strong>Separateur :</strong> Reduit la ligne a une barre fine coloree. Utile pour marquer une coupure visuelle.</p>
              <p><strong>Couleur de fond :</strong> Applique une couleur d'arriere-plan a la ligne (bleu, vert, jaune, orange, rouge, violet, gris). Combinable avec titre ou separateur.</p>
              <p><strong>Effacer le style :</strong> Remet la ligne a son apparence par defaut.</p>
            </div>
          </section>

          {/* Types de colonnes */}
          <section>
            <h3 className="text-base font-semibold text-gray-800 mb-2">Types de colonnes</h3>
            <p className="text-sm text-gray-600 mb-3">
              Definis un type pour chaque colonne afin de formater automatiquement les valeurs.
              Clic droit sur une colonne, puis "Type de colonne".
            </p>
            <div className="overflow-hidden rounded-lg border border-gray-200">
              <table className="w-full text-sm">
                <tbody>
                  {[
                    ['Texte', 'Affichage brut, aucun formatage'],
                    ['Nombre', 'Formatage numerique avec separateurs'],
                    ['Monnaie (EUR)', 'Affiche le montant suivi du symbole EUR'],
                    ['Pourcentage', 'Multiplie par 100 et ajoute le signe %'],
                    ['Date', 'Formate en date lisible'],
                    ['Boolean', 'Affiche vrai/faux ou une coche'],
                  ].map(([type, desc], i) => (
                    <tr key={type} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                      <td className="px-3 py-1.5 font-medium text-gray-700 text-xs w-36">{type}</td>
                      <td className="px-3 py-1.5 text-xs text-gray-500">{desc}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Export */}
          <section>
            <h3 className="text-base font-semibold text-gray-800 mb-2">Export</h3>
            <p className="text-sm text-gray-600 mb-3">
              Exporte ton tableur dans les formats suivants via les boutons dans la barre d'outils :
            </p>
            <div className="bg-gray-50 rounded-lg p-3 border border-gray-200 text-sm text-gray-600 space-y-1.5">
              <p><strong>.xlsx (Excel) :</strong> Format Microsoft Excel avec les largeurs de colonnes preservees. Compatible avec Excel, Google Sheets, LibreOffice.</p>
              <p><strong>.csv :</strong> Format texte avec separateurs virgule. Encodage UTF-8 avec BOM pour une compatibilite maximale. Les formules sont exportees avec leur valeur calculee.</p>
            </div>
          </section>

          {/* Raccourcis */}
          <section>
            <h3 className="text-base font-semibold text-gray-800 mb-3">Raccourcis clavier</h3>
            <div className="overflow-hidden rounded-lg border border-gray-200">
              <table className="w-full text-sm">
                <tbody>
                  {[
                    ['Double-clic', 'Editer une cellule'],
                    ['Shift + Enter', "Valider l'edition"],
                    ['Tab', 'Valider et passer a la cellule suivante'],
                    ['Echap', "Annuler l'edition"],
                    ['Fleches', 'Naviguer entre les cellules'],
                    ['Clic droit', 'Menu contextuel'],
                    ['Clic + glisser', 'Selectionner une plage'],
                  ].map(([key, desc], i) => (
                    <tr key={key} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                      <td className="px-3 py-1.5 w-36">
                        <kbd className="bg-gray-100 border border-gray-300 rounded px-1.5 py-0.5 text-xs text-gray-700">{key}</kbd>
                      </td>
                      <td className="px-3 py-1.5 text-xs text-gray-600">{desc}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Versions */}
          <section>
            <h3 className="text-base font-semibold text-gray-800 mb-2">Gestion de versions</h3>
            <p className="text-sm text-gray-600">
              Utilise le bouton <strong>Historique</strong> pour sauvegarder des snapshots
              et restaurer un etat precedent. Chaque snapshot capture l'integralite
              de ton tableur : cellules, formules, zones, graphiques et styles de ligne.
            </p>
          </section>

        </div>
      </div>
    </div>
  );
}

function Card({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="bg-gray-50 rounded-lg border border-gray-200 p-3">
      <h4 className="font-medium text-gray-800 text-sm mb-0.5">{title}</h4>
      <p className="text-xs text-gray-500">{desc}</p>
    </div>
  );
}
