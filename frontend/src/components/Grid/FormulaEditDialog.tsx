import { useState } from 'react';
import { useGridStore } from '../../stores/gridStore';
import { evaluateFormula, resolveColumnNames, formulaToReadable } from '../../utils/formulaEvaluator';

interface FormulaEditDialogProps {
  cellId: string;
  onClose: () => void;
}

interface FormulaInfo {
  name: string;
  syntax: string;
  desc: string;
  template: string;
}

const formulaCatalog: { title: string; formulas: FormulaInfo[] }[] = [
  {
    title: 'Math / Stats (plage)',
    formulas: [
      { name: 'SUM', syntax: '=SUM(A1:A10, C1:C10, E5)', desc: 'Somme (multi-plages, verticale/horizontale)', template: '=SUM()' },
      { name: 'AVERAGE', syntax: '=AVERAGE(A1:A10, B1:B10)', desc: 'Moyenne (multi-plages)', template: '=AVERAGE()' },
      { name: 'MIN', syntax: '=MIN(A1:A10, C1:C10)', desc: 'Valeur minimale (multi-plages)', template: '=MIN()' },
      { name: 'MAX', syntax: '=MAX(A1:A10, C1:C10)', desc: 'Valeur maximale (multi-plages)', template: '=MAX()' },
      { name: 'COUNT', syntax: '=COUNT(A1:A10, B1:B10)', desc: 'Nombre de valeurs numeriques (multi-plages)', template: '=COUNT()' },
      { name: 'COUNTA', syntax: '=COUNTA(A1:A10, B1:B10)', desc: 'Cellules non vides (multi-plages)', template: '=COUNTA()' },
      { name: 'COUNTBLANK', syntax: '=COUNTBLANK(A1:A10)', desc: 'Nombre de cellules vides', template: '=COUNTBLANK()' },
      { name: 'MEDIAN', syntax: '=MEDIAN(A1:A10, B1:B10)', desc: 'Mediane (multi-plages)', template: '=MEDIAN()' },
      { name: 'PRODUCT', syntax: '=PRODUCT(A1:A10)', desc: 'Produit de toutes les valeurs', template: '=PRODUCT()' },
      { name: 'STDEV', syntax: '=STDEV(A1:A10)', desc: 'Ecart-type', template: '=STDEV()' },
    ],
  },
  {
    title: 'Math (valeur)',
    formulas: [
      { name: 'ABS', syntax: '=ABS(A1)', desc: 'Valeur absolue', template: '=ABS()' },
      { name: 'INT', syntax: '=INT(A1)', desc: 'Partie entiere', template: '=INT()' },
      { name: 'SQRT', syntax: '=SQRT(A1)', desc: 'Racine carree', template: '=SQRT()' },
      { name: 'ROUND', syntax: '=ROUND(A1, 2)', desc: 'Arrondi a N decimales', template: '=ROUND(, 2)' },
      { name: 'ROUNDUP', syntax: '=ROUNDUP(A1, 0)', desc: 'Arrondi superieur', template: '=ROUNDUP(, 0)' },
      { name: 'ROUNDDOWN', syntax: '=ROUNDDOWN(A1, 0)', desc: 'Arrondi inferieur', template: '=ROUNDDOWN(, 0)' },
      { name: 'MOD', syntax: '=MOD(A1, 3)', desc: 'Modulo (reste division)', template: '=MOD(, )' },
      { name: 'POWER', syntax: '=POWER(A1, 2)', desc: 'Puissance', template: '=POWER(, )' },
    ],
  },
  {
    title: 'Logique',
    formulas: [
      { name: 'IF', syntax: '=IF(A1>5, "Oui", "Non")', desc: 'Condition si/sinon', template: '=IF(, , )' },
      { name: 'IFERROR', syntax: '=IFERROR(A1/B1, 0)', desc: 'Valeur si erreur', template: '=IFERROR(, )' },
      { name: 'AND', syntax: '=AND(A1>0, B1>0)', desc: 'Vrai si toutes les conditions vraies', template: '=AND(, )' },
      { name: 'OR', syntax: '=OR(A1>0, B1>0)', desc: 'Vrai si au moins une condition vraie', template: '=OR(, )' },
      { name: 'COUNTIF', syntax: '=COUNTIF(A1:A10, ">5")', desc: 'Compter selon critere', template: '=COUNTIF(, ">")' },
      { name: 'SUMIF', syntax: '=SUMIF(A1:A10, ">5")', desc: 'Sommer selon critere', template: '=SUMIF(, ">")' },
      { name: 'COUNTIFS', syntax: '=COUNTIFS(A1:A10, ">5", B1:B10, "<10")', desc: 'Compter selon plusieurs criteres', template: '=COUNTIFS(, ">", , "<")' },
      { name: 'SUMIFS', syntax: '=SUMIFS(C1:C10, A1:A10, ">5", B1:B10, "<10")', desc: 'Sommer selon plusieurs criteres', template: '=SUMIFS(, , ">", , "<")' },
    ],
  },
  {
    title: 'Texte',
    formulas: [
      { name: 'CONCAT', syntax: '=CONCAT(A1, " ", B1)', desc: 'Assembler des textes', template: '=CONCAT(, )' },
      { name: 'UPPER', syntax: '=UPPER(A1)', desc: 'Majuscules', template: '=UPPER()' },
      { name: 'LOWER', syntax: '=LOWER(A1)', desc: 'Minuscules', template: '=LOWER()' },
      { name: 'LEN', syntax: '=LEN(A1)', desc: 'Longueur du texte', template: '=LEN()' },
      { name: 'LEFT', syntax: '=LEFT(A1, 3)', desc: 'Premiers N caracteres', template: '=LEFT(, )' },
      { name: 'RIGHT', syntax: '=RIGHT(A1, 4)', desc: 'Derniers N caracteres', template: '=RIGHT(, )' },
      { name: 'MID', syntax: '=MID(A1, 2, 3)', desc: 'Sous-chaine', template: '=MID(, , )' },
      { name: 'TRIM', syntax: '=TRIM(A1)', desc: 'Supprimer espaces', template: '=TRIM()' },
    ],
  },
  {
    title: 'Date',
    formulas: [
      { name: 'TODAY', syntax: '=TODAY()', desc: 'Date du jour', template: '=TODAY()' },
      { name: 'NOW', syntax: '=NOW()', desc: 'Date et heure actuelles', template: '=NOW()' },
      { name: 'DATE', syntax: '=DATE(2024, 1, 15)', desc: 'Creer une date', template: '=DATE(, , )' },
      { name: 'YEAR', syntax: '=YEAR(A1)', desc: 'Extraire l\'annee', template: '=YEAR()' },
      { name: 'MONTH', syntax: '=MONTH(A1)', desc: 'Extraire le mois', template: '=MONTH()' },
      { name: 'DAY', syntax: '=DAY(A1)', desc: 'Extraire le jour', template: '=DAY()' },
    ],
  },
  {
    title: 'Recherche',
    formulas: [
      { name: 'VLOOKUP', syntax: '=VLOOKUP(val, A1:C10, 3)', desc: 'Recherche verticale', template: '=VLOOKUP(, , )' },
      { name: 'HLOOKUP', syntax: '=HLOOKUP(val, A1:Z3, 2)', desc: 'Recherche horizontale', template: '=HLOOKUP(, , )' },
      { name: 'XLOOKUP', syntax: '=XLOOKUP(val, A1:A10, B1:B10, "N/A")', desc: 'Recherche flexible', template: '=XLOOKUP(, , , )' },
      { name: 'INDEX', syntax: '=INDEX(A1:C10, 2, 3)', desc: 'Valeur a une position', template: '=INDEX(, , )' },
      { name: 'MATCH', syntax: '=MATCH(val, A1:A10)', desc: 'Position d\'une valeur', template: '=MATCH(, )' },
    ],
  },
];

export function FormulaEditDialog({ cellId, onClose }: FormulaEditDialogProps) {
  const cell = useGridStore((s) => s.cells[cellId]);
  const allCells = useGridStore((s) => s.cells);
  const setCell = useGridStore((s) => s.setCell);
  const headers = useGridStore((s) => s.headers);

  const isNew = !cell?.formula;

  const [name, setName] = useState(cell?.name ?? '');
  const [description, setDescription] = useState(cell?.description ?? '');
  const [formula, setFormula] = useState(
    cell?.formula ? formulaToReadable(cell.formula, headers) : ''
  );
  const [showCatalog, setShowCatalog] = useState(isNew);
  const [expandedSection, setExpandedSection] = useState<string | null>(
    isNew ? formulaCatalog[0].title : null
  );

  // Resolve to real formula for preview
  const resolvedFormula = resolveColumnNames(formula, headers);

  // Live preview of formula result
  const preview = resolvedFormula.startsWith('=')
    ? evaluateFormula(resolvedFormula, allCells, headers)
    : resolvedFormula;

  const handleSelectFormula = (f: FormulaInfo) => {
    setFormula(f.template);
    setShowCatalog(false);
  };

  const handleSubmit = () => {
    if (!formula.trim()) return;

    const resolved = resolveColumnNames(formula, headers);
    const evaluated = resolved.startsWith('=')
      ? evaluateFormula(resolved, allCells, headers)
      : resolved;

    setCell(cellId, evaluated, {
      formula: resolved.startsWith('=') ? resolved : undefined,
      name: name.trim() || undefined,
      description: description.trim() || undefined,
    });
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-white rounded-lg shadow-xl w-[520px] max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Header */}
        <div className="px-6 pt-5 pb-3 border-b border-gray-100 shrink-0">
          <h3 className="text-lg font-semibold text-gray-800">
            {isNew ? `Creer une formule (${cellId})` : `Modifier la formule (${cellId})`}
          </h3>
        </div>

        {/* Scrollable content */}
        <div className="overflow-y-auto px-6 py-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nom</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Total prix"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus={!isNew}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex: Somme de tous les prix"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-gray-700">Formule</label>
              <button
                type="button"
                onClick={() => setShowCatalog(!showCatalog)}
                className="text-xs text-blue-600 hover:text-blue-800"
              >
                {showCatalog ? 'Masquer le catalogue' : 'Voir les formules disponibles'}
              </button>
            </div>
            <input
              type="text"
              value={formula}
              onChange={(e) => setFormula(e.target.value)}
              placeholder="Ex: =SUM(Prix1:Prix10)"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus={isNew && !showCatalog}
            />
          </div>

          {/* Preview */}
          {formula.trim() && (
            <div className="bg-blue-50 px-3 py-2 rounded">
              <span className="text-xs text-gray-500">Resultat actuel : </span>
              <span className="text-sm font-semibold text-blue-700">{String(preview)}</span>
            </div>
          )}

          {/* Formula Catalog */}
          {showCatalog && (
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="bg-gray-50 px-3 py-2 border-b border-gray-200">
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Catalogue des formules - cliquez pour inserer
                </span>
              </div>
              <div className="max-h-[300px] overflow-y-auto">
                {formulaCatalog.map((section) => (
                  <div key={section.title}>
                    <button
                      type="button"
                      className="w-full text-left px-3 py-2 text-sm font-medium text-gray-700 bg-gray-50/80 hover:bg-gray-100 border-b border-gray-100 flex items-center justify-between"
                      onClick={() =>
                        setExpandedSection(expandedSection === section.title ? null : section.title)
                      }
                    >
                      <span>{section.title}</span>
                      <span className="text-gray-400 text-xs">
                        {expandedSection === section.title ? '\u25B2' : '\u25BC'}
                      </span>
                    </button>
                    {expandedSection === section.title && (
                      <div>
                        {section.formulas.map((f) => (
                          <button
                            key={f.name}
                            type="button"
                            className="w-full text-left px-3 py-2 hover:bg-blue-50 border-b border-gray-50 transition group"
                            onClick={() => handleSelectFormula(f)}
                          >
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-blue-700 text-sm w-24 shrink-0">
                                {f.name}
                              </span>
                              <span className="text-xs text-gray-500 truncate">{f.desc}</span>
                            </div>
                            <div className="font-mono text-xs text-gray-400 mt-0.5 group-hover:text-gray-600">
                              {f.syntax}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-2 shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded hover:bg-gray-200"
          >
            Annuler
          </button>
          <button
            onClick={handleSubmit}
            disabled={!formula.trim()}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            Enregistrer
          </button>
        </div>
      </div>
    </div>
  );
}
