/**
 * Simple formula evaluator for spreadsheet formulas
 * Supports basic functions like SUM, AVERAGE, MIN, MAX
 */

import type { Grid } from '../types/cell';
import { cellIdToCoords } from './cellUtils';

/**
 * Evaluate a formula and return the result
 * @param formula - The formula string (e.g., "=SUM(A1:A10)")
 * @param cells - The current grid cells
 * @returns The evaluated result or the formula string if evaluation fails
 */
export function evaluateFormula(formula: string, cells: Grid): string | number {
  if (!formula || !formula.startsWith('=')) {
    return formula;
  }

  try {
    // Remove the leading '='
    const expression = formula.substring(1);

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
