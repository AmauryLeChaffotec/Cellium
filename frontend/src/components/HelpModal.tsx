interface HelpModalProps {
  onClose: () => void;
}

const formulaSections = [
  {
    title: 'Mathematiques / Statistiques (plage)',
    formulas: [
      { name: 'SUM', syntax: '=SUM(B1:B10)', desc: 'Somme des valeurs de la plage' },
      { name: 'AVERAGE', syntax: '=AVERAGE(B1:B10)', desc: 'Moyenne des valeurs' },
      { name: 'MIN', syntax: '=MIN(B1:B10)', desc: 'Valeur minimale' },
      { name: 'MAX', syntax: '=MAX(B1:B10)', desc: 'Valeur maximale' },
      { name: 'COUNT', syntax: '=COUNT(B1:B10)', desc: 'Nombre de valeurs numeriques' },
      { name: 'COUNTA', syntax: '=COUNTA(B1:B10)', desc: 'Nombre de cellules non vides' },
      { name: 'COUNTBLANK', syntax: '=COUNTBLANK(B1:B10)', desc: 'Nombre de cellules vides' },
      { name: 'MEDIAN', syntax: '=MEDIAN(B1:B10)', desc: 'Mediane des valeurs' },
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
              Manipulez vos donnees dans la grille, utilisez des formules,
              ou <strong>demandez a l'agent IA</strong> de le faire pour vous en langage naturel.
            </p>
          </section>

          {/* Prise en main */}
          <section>
            <h3 className="text-base font-semibold text-gray-800 mb-3">Prise en main</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Card title="Editer une cellule" desc="Double-cliquez sur une cellule pour la modifier. Validez avec Shift+Enter ou Tab." />
              <Card title="Renommer une colonne" desc="Cliquez sur l'en-tete d'une colonne (A, B, C...) pour la renommer." />
              <Card title="Creer une zone" desc="Selectionnez des cellules (clic + glisser), puis clic droit pour creer une zone nommee." />
              <Card title="Modifier une formule" desc="Clic droit sur une cellule avec formule pour voir sa plage et la modifier." />
            </div>
          </section>

          {/* Agent IA */}
          <section className="bg-blue-50 rounded-lg p-5 border border-blue-100">
            <h3 className="text-base font-semibold text-blue-900 mb-2">L'agent IA</h3>
            <p className="text-sm text-blue-800 mb-3">
              Utilisez le <strong>chat en bas a droite</strong> pour demander a l'agent de modifier votre tableur.
              Il peut :
            </p>
            <ul className="space-y-1.5 text-sm text-blue-800">
              <li><strong>Ajouter des formules</strong> : "Calcule le total de la colonne Prix"</li>
              <li><strong>Analyser vos donnees</strong> : "Quel est le produit le plus cher ?"</li>
              <li><strong>Remplir des cellules</strong> : "Ajoute une colonne categorie"</li>
              <li><strong>Creer des zones</strong> : "Cree une zone Produits sur A et B"</li>
            </ul>
            <p className="text-blue-600 text-xs mt-3 italic">
              L'agent ajoute automatiquement un nom et une description a chaque formule.
            </p>
          </section>

          {/* Noms de colonnes */}
          <section>
            <h3 className="text-base font-semibold text-gray-800 mb-2">Noms de colonnes dans les formules</h3>
            <p className="text-sm text-gray-600 mb-2">
              Utilisez le nom de la colonne au lieu de la lettre :
            </p>
            <div className="bg-gray-50 rounded-lg p-3 font-mono text-xs space-y-1 border border-gray-200">
              <p><span className="text-green-700">=SUM(Prix1:Prix10)</span> au lieu de =SUM(B1:B10)</p>
              <p><span className="text-green-700">=MIN(Population1:Population66)</span> au lieu de =MIN(B1:B66)</p>
            </div>
            <p className="text-gray-400 text-xs mt-1.5">
              Insensible a la casse : sum, SUM, Sum fonctionnent tous.
            </p>
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
              Utilisez le bouton <strong>Historique</strong> pour sauvegarder des snapshots
              et restaurer un etat precedent. L'export au
              format <code className="bg-gray-100 px-1 rounded text-xs">.cellium</code> inclut
              la grille et tous les snapshots.
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
