/**
 * Simple formula evaluator for spreadsheet formulas
 * Supports basic functions like SUM, AVERAGE, MIN, MAX
 * Supports column names in formulas (e.g., "=SUM(Population1:Population66)")
 */

import type { Grid } from '../types/cell';
import { cellIdToCoords } from './cellUtils';

/**
 * Resolve column names in a formula to column letters.
 * e.g. "=MIN(Population1:Population66)" → "=MIN(B1:B66)" if headers[1] === "Population"
 */
export function resolveColumnNames(formula: string, headers: string[]): string {
  if (!formula || !formula.startsWith('=')) return formula;

  // Build name → letter map (longest names first to avoid partial matches)
  const entries: { name: string; letter: string }[] = [];
  for (let i = 0; i < headers.length; i++) {
    const h = headers[i];
    // Skip default single-letter headers (A, B, C…)
    if (h.length === 1 && h >= 'A' && h <= 'Z') continue;
    entries.push({ name: h, letter: String.fromCharCode(65 + i) });
  }
  // Sort longest first
  entries.sort((a, b) => b.name.length - a.name.length);

  let result = formula;
  for (const { name, letter } of entries) {
    // Escape regex special chars in name, then match name followed by digits
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escaped + '(\\d+)', 'gi');
    result = result.replace(regex, letter + '$1');
  }
  return result;
}

/**
 * Convert a formula from column letters to column names for display.
 * e.g. "=MIN(B1:B66)" → "=MIN(Population1:Population66)" if headers[1] === "Population"
 */
export function formulaToReadable(formula: string, headers: string[]): string {
  if (!formula || !formula.startsWith('=')) return formula;

  return formula.replace(/([A-Z])(\d+)/g, (_match, letter: string, row: string) => {
    const colIndex = letter.charCodeAt(0) - 65;
    const headerName = headers[colIndex];
    if (headerName && headerName !== letter) {
      return headerName + row;
    }
    return _match;
  });
}

/**
 * Evaluate a formula and return the result
 * @param formula - The formula string (e.g., "=SUM(A1:A10)" or "=SUM(Population1:Population10)")
 * @param cells - The current grid cells
 * @param headers - Optional column headers for resolving column names
 * @returns The evaluated result or the formula string if evaluation fails
 */
export function evaluateFormula(formula: string, cells: Grid, headers?: string[]): string | number {
  if (!formula || !formula.startsWith('=')) {
    return formula;
  }

  try {
    // Resolve column names to letters if headers are provided
    const resolved = headers ? resolveColumnNames(formula, headers) : formula;

    // Remove the leading '='
    const expression = resolved.substring(1);

    // Handle AVERAGE function
    if (expression.match(/^AVERAGE\(/i)) {
      const range = extractRange(expression, 'AVERAGE');
      if (!range) return formula;
      const values = getRangeValues(range, cells);
      if (values.length === 0) return 0;
      const sum = values.reduce((a, b) => a + b, 0);
      return Number((sum / values.length).toFixed(2));
    }

    // Handle SUM function
    if (expression.match(/^SUM\(/i)) {
      const range = extractRange(expression, 'SUM');
      if (!range) return formula;
      const values = getRangeValues(range, cells);
      return values.reduce((a, b) => a + b, 0);
    }

    // Handle MIN function
    if (expression.match(/^MIN\(/i)) {
      const range = extractRange(expression, 'MIN');
      if (!range) return formula;
      const values = getRangeValues(range, cells);
      if (values.length === 0) return 0;
      return Math.min(...values);
    }

    // Handle MAX function
    if (expression.match(/^MAX\(/i)) {
      const range = extractRange(expression, 'MAX');
      if (!range) return formula;
      const values = getRangeValues(range, cells);
      if (values.length === 0) return 0;
      return Math.max(...values);
    }

    // Handle COUNT function
    if (expression.match(/^COUNT\(/i)) {
      const range = extractRange(expression, 'COUNT');
      if (!range) return formula;
      const values = getRangeValues(range, cells);
      return values.length;
    }

    // If no function matched, return the formula as-is
    return formula;
  } catch (error) {
    console.warn('Formula evaluation error:', error);
    return formula;
  }
}

/**
 * Extract the range from a function expression
 * @param expression - The expression (e.g., "SUM(A1:A10)")
 * @param funcName - The function name to extract
 * @returns The range string (e.g., "A1:A10") or null
 */
function extractRange(expression: string, funcName: string): string | null {
  const regex = new RegExp(`^${funcName}\\(([^)]+)\\)`, 'i');
  const match = expression.match(regex);
  return match ? match[1].trim() : null;
}

/**
 * Get numeric values from a cell range
 * @param range - The range string (e.g., "A1:A10" or "A1")
 * @param cells - The current grid cells
 * @returns Array of numeric values
 */
function getRangeValues(range: string, cells: Grid): number[] {
  const values: number[] = [];

  // Handle single cell reference (e.g., "A1")
  if (!range.includes(':')) {
    const cellValue = cells[range]?.value;
    if (typeof cellValue === 'number') {
      values.push(cellValue);
    } else if (typeof cellValue === 'string') {
      const num = Number(cellValue);
      if (!isNaN(num)) values.push(num);
    }
    return values;
  }

  // Handle range reference (e.g., "A1:A10")
  const [startCell, endCell] = range.split(':');
  const startCoords = cellIdToCoords(startCell);
  const endCoords = cellIdToCoords(endCell);

  // Determine the range bounds
  const minRow = Math.min(startCoords.row, endCoords.row);
  const maxRow = Math.max(startCoords.row, endCoords.row);
  const minCol = Math.min(startCoords.col, endCoords.col);
  const maxCol = Math.max(startCoords.col, endCoords.col);

  // Iterate through the range
  for (let row = minRow; row <= maxRow; row++) {
    for (let col = minCol; col <= maxCol; col++) {
      const cellId = columnIndexToLetter(col) + row;
      const cellValue = cells[cellId]?.value;

      if (typeof cellValue === 'number') {
        values.push(cellValue);
      } else if (typeof cellValue === 'string') {
        const num = Number(cellValue);
        if (!isNaN(num)) values.push(num);
      }
    }
  }

  return values;
}

/**
 * Convert column index to letter (0 -> A, 1 -> B, etc.)
 */
function columnIndexToLetter(index: number): string {
  return String.fromCharCode(65 + index);
}
