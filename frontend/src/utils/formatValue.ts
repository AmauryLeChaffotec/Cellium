import type { ColumnType } from '../types/cell';

/**
 * Format a cell value for display according to the column type.
 * The raw value is always stored unchanged; this only affects rendering.
 */
export function formatValue(value: string | number | null, type: ColumnType): string {
  if (value === null || value === '') return '';

  switch (type) {
    case 'none':
    case 'text':
      return String(value);

    case 'number': {
      const n = typeof value === 'number' ? value : parseFloat(String(value));
      if (isNaN(n)) return String(value);
      return n.toLocaleString('fr-FR');
    }

    case 'currency': {
      const n = typeof value === 'number' ? value : parseFloat(String(value));
      if (isNaN(n)) return String(value);
      return n.toLocaleString('fr-FR', {
        style: 'currency',
        currency: 'EUR',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    }

    case 'percentage': {
      const n = typeof value === 'number' ? value : parseFloat(String(value));
      if (isNaN(n)) return String(value);
      return (n * 100).toLocaleString('fr-FR') + ' %';
    }

    case 'date': {
      const s = String(value);
      const d = new Date(s);
      if (!isNaN(d.getTime()) && s.match(/\d{4}-\d{2}-\d{2}/)) {
        return d.toLocaleDateString('fr-FR');
      }
      return s;
    }

    case 'boolean': {
      const s = String(value).toLowerCase().trim();
      if (s === 'true' || s === 'vrai' || s === '1' || s === 'oui') return 'Vrai';
      if (s === 'false' || s === 'faux' || s === '0' || s === 'non') return 'Faux';
      return String(value);
    }

    default:
      return String(value);
  }
}

/**
 * Check whether a cell value matches the expected column type.
 * Returns true if the value is valid for the type, false otherwise.
 * Empty values and 'none' type always pass.
 */
export function isValueValidForType(value: string | number | null, type: ColumnType): boolean {
  if (value === null || value === '') return true;
  if (type === 'none') return true;

  const s = String(value).trim();
  if (s === '') return true;

  switch (type) {
    case 'text':
      return true;

    case 'number':
    case 'currency':
    case 'percentage': {
      const n = typeof value === 'number' ? value : parseFloat(s);
      return !isNaN(n);
    }

    case 'date': {
      const d = new Date(s);
      return !isNaN(d.getTime()) && /\d{4}-\d{2}-\d{2}/.test(s);
    }

    case 'boolean': {
      const lower = s.toLowerCase();
      return ['true', 'false', 'vrai', 'faux', '1', '0', 'oui', 'non'].includes(lower);
    }

    default:
      return true;
  }
}
