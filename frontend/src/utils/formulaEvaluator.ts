/**
 * Formula evaluator for spreadsheet formulas
 * Supports: SUM, AVERAGE, MIN, MAX, COUNT, COUNTA, COUNTBLANK, MEDIAN,
 *           ABS, ROUND, ROUNDUP, ROUNDDOWN, INT, MOD, POWER, SQRT, PRODUCT, STDEV,
 *           IF, IFERROR, AND, OR, COUNTIF, SUMIF, COUNTIFS, SUMIFS,
 *           CONCAT, UPPER, LOWER, LEN, LEFT, RIGHT, MID, TRIM,
 *           TODAY, NOW, DATE, YEAR, MONTH, DAY,
 *           VLOOKUP, HLOOKUP, XLOOKUP, INDEX, MATCH
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

// ─── Argument Parsing Helpers ──────────────────────────────────────────

/**
 * Split top-level comma-separated arguments, respecting parentheses and quotes.
 * e.g. "A1:A10, 5, \"hello\"" → ["A1:A10", "5", "\"hello\""]
 */
function splitArgs(argsStr: string): string[] {
  const args: string[] = [];
  let depth = 0;
  let inQuote = false;
  let current = '';

  for (let i = 0; i < argsStr.length; i++) {
    const ch = argsStr[i];
    if (ch === '"' && (i === 0 || argsStr[i - 1] !== '\\')) {
      inQuote = !inQuote;
      current += ch;
    } else if (!inQuote && ch === '(') {
      depth++;
      current += ch;
    } else if (!inQuote && ch === ')') {
      depth--;
      current += ch;
    } else if (!inQuote && depth === 0 && ch === ',') {
      args.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  if (current.trim()) args.push(current.trim());
  return args;
}

/**
 * Extract function name and raw arguments string from an expression.
 * e.g. "SUM(A1:A10)" → { funcName: "SUM", argsStr: "A1:A10" }
 */
function parseFunc(expression: string): { funcName: string; argsStr: string } | null {
  const match = expression.match(/^([A-Z]+)\((.+)\)$/is);
  if (!match) return null;
  return { funcName: match[1].toUpperCase(), argsStr: match[2] };
}

/**
 * Check if a string looks like a cell reference (e.g., "A1", "Z99")
 */
function isCellRef(s: string): boolean {
  return /^[A-Z]\d+$/i.test(s);
}

/**
 * Check if a string looks like a range (e.g., "A1:A10")
 */
function isRange(s: string): boolean {
  return /^[A-Z]\d+:[A-Z]\d+$/i.test(s);
}

/**
 * Resolve a single argument to a value (number, string, or cell value)
 */
function resolveArg(arg: string, cells: Grid): string | number | null {
  // String literal
  if (arg.startsWith('"') && arg.endsWith('"')) {
    return arg.slice(1, -1);
  }
  // Number literal
  const num = Number(arg);
  if (!isNaN(num) && arg.trim() !== '') {
    return num;
  }
  // Cell reference
  if (isCellRef(arg)) {
    const val = cells[arg.toUpperCase()]?.value;
    return val ?? null;
  }
  // Return as string
  return arg;
}

/**
 * Resolve a single argument to a numeric value
 */
function resolveNumArg(arg: string, cells: Grid): number | null {
  const val = resolveArg(arg, cells);
  if (val === null) return null;
  const n = Number(val);
  return isNaN(n) ? null : n;
}

// ─── Range Value Helpers ───────────────────────────────────────────────

/**
 * Get numeric values from a cell range
 */
function getRangeValues(range: string, cells: Grid): number[] {
  const values: number[] = [];

  // Handle single cell reference
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

  // Handle range reference
  const [startCell, endCell] = range.split(':');
  const startCoords = cellIdToCoords(startCell);
  const endCoords = cellIdToCoords(endCell);

  const minRow = Math.min(startCoords.row, endCoords.row);
  const maxRow = Math.max(startCoords.row, endCoords.row);
  const minCol = Math.min(startCoords.col, endCoords.col);
  const maxCol = Math.max(startCoords.col, endCoords.col);

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
 * Get all raw cell values from a range (including strings and nulls)
 */
function getRangeRawValues(range: string, cells: Grid): (string | number | null)[] {
  const values: (string | number | null)[] = [];

  if (!range.includes(':')) {
    values.push(cells[range]?.value ?? null);
    return values;
  }

  const [startCell, endCell] = range.split(':');
  const startCoords = cellIdToCoords(startCell);
  const endCoords = cellIdToCoords(endCell);

  const minRow = Math.min(startCoords.row, endCoords.row);
  const maxRow = Math.max(startCoords.row, endCoords.row);
  const minCol = Math.min(startCoords.col, endCoords.col);
  const maxCol = Math.max(startCoords.col, endCoords.col);

  for (let row = minRow; row <= maxRow; row++) {
    for (let col = minCol; col <= maxCol; col++) {
      const cellId = columnIndexToLetter(col) + row;
      values.push(cells[cellId]?.value ?? null);
    }
  }

  return values;
}

/**
 * Parse a criteria string for COUNTIF/SUMIF
 * Supports: ">5", "<10", ">=3", "<=7", "<>0", "=5", "text", 5
 */
function matchesCriteria(value: string | number | null, criteria: string): boolean {
  if (value === null || value === undefined) return false;

  // Comparison operators
  const opMatch = criteria.match(/^(>=|<=|<>|>|<|=)(.+)$/);
  if (opMatch) {
    const op = opMatch[1];
    const cmpVal = Number(opMatch[2]);
    const numValue = Number(value);

    if (!isNaN(cmpVal) && !isNaN(numValue)) {
      switch (op) {
        case '>': return numValue > cmpVal;
        case '<': return numValue < cmpVal;
        case '>=': return numValue >= cmpVal;
        case '<=': return numValue <= cmpVal;
        case '<>': return numValue !== cmpVal;
        case '=': return numValue === cmpVal;
      }
    }
    // String comparison for <> and =
    if (op === '<>') return String(value) !== opMatch[2];
    if (op === '=') return String(value) === opMatch[2];
    return false;
  }

  // Plain number
  const criteriaNum = Number(criteria);
  if (!isNaN(criteriaNum)) {
    return Number(value) === criteriaNum;
  }

  // Plain text (case-insensitive)
  return String(value).toLowerCase() === criteria.toLowerCase();
}

/**
 * Evaluate a simple condition for IF: supports "A1>5", "A1=B1", etc.
 */
function evaluateCondition(condStr: string, cells: Grid): boolean {
  // Try to find a comparison operator
  const opMatch = condStr.match(/^(.+?)(>=|<=|<>|!=|>|<|=)(.+)$/);
  if (opMatch) {
    const leftRaw = opMatch[1].trim();
    const op = opMatch[2];
    const rightRaw = opMatch[3].trim();

    const leftVal = resolveArg(leftRaw, cells);
    const rightVal = resolveArg(rightRaw, cells);

    const leftNum = Number(leftVal);
    const rightNum = Number(rightVal);

    if (!isNaN(leftNum) && !isNaN(rightNum)) {
      switch (op) {
        case '>': return leftNum > rightNum;
        case '<': return leftNum < rightNum;
        case '>=': return leftNum >= rightNum;
        case '<=': return leftNum <= rightNum;
        case '<>': case '!=': return leftNum !== rightNum;
        case '=': return leftNum === rightNum;
      }
    }
    // String comparison
    const leftStr = String(leftVal ?? '');
    const rightStr = String(rightVal ?? '');
    switch (op) {
      case '=': return leftStr === rightStr;
      case '<>': case '!=': return leftStr !== rightStr;
      default: return false;
    }
  }

  // Boolean-like: a truthy value
  const val = resolveArg(condStr, cells);
  return !!val && val !== 0 && val !== '0' && val !== 'FALSE';
}

// ─── Column index to letter ────────────────────────────────────────────

function columnIndexToLetter(index: number): string {
  return String.fromCharCode(65 + index);
}

// ─── Main Evaluator ────────────────────────────────────────────────────

/**
 * Evaluate a formula and return the result
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

    // Parse function call
    const parsed = parseFunc(expression);

    // Handle no-argument functions
    if (expression.match(/^TODAY\(\s*\)$/i)) {
      const d = new Date();
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    }
    if (expression.match(/^NOW\(\s*\)$/i)) {
      const d = new Date();
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    }

    if (!parsed) return formula;

    const { funcName, argsStr } = parsed;
    const args = splitArgs(argsStr);

    switch (funcName) {
      // ─── Math / Stats (range-based) ────────────────────────────

      case 'SUM': {
        const values = getRangeValues(args[0], cells);
        return values.reduce((a, b) => a + b, 0);
      }

      case 'AVERAGE': {
        const values = getRangeValues(args[0], cells);
        if (values.length === 0) return 0;
        const sum = values.reduce((a, b) => a + b, 0);
        return Number((sum / values.length).toFixed(2));
      }

      case 'MIN': {
        const values = getRangeValues(args[0], cells);
        if (values.length === 0) return 0;
        return Math.min(...values);
      }

      case 'MAX': {
        const values = getRangeValues(args[0], cells);
        if (values.length === 0) return 0;
        return Math.max(...values);
      }

      case 'COUNT': {
        const values = getRangeValues(args[0], cells);
        return values.length;
      }

      case 'COUNTA': {
        const rawValues = getRangeRawValues(args[0], cells);
        return rawValues.filter(v => v !== null && v !== '' && v !== undefined).length;
      }

      case 'COUNTBLANK': {
        const rawValues = getRangeRawValues(args[0], cells);
        return rawValues.filter(v => v === null || v === '' || v === undefined).length;
      }

      case 'MEDIAN': {
        const values = getRangeValues(args[0], cells);
        if (values.length === 0) return 0;
        const sorted = [...values].sort((a, b) => a - b);
        const mid = Math.floor(sorted.length / 2);
        return sorted.length % 2 !== 0
          ? sorted[mid]
          : Number(((sorted[mid - 1] + sorted[mid]) / 2).toFixed(2));
      }

      case 'PRODUCT': {
        const values = getRangeValues(args[0], cells);
        if (values.length === 0) return 0;
        return values.reduce((a, b) => a * b, 1);
      }

      case 'STDEV': {
        const values = getRangeValues(args[0], cells);
        if (values.length < 2) return 0;
        const mean = values.reduce((a, b) => a + b, 0) / values.length;
        const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / (values.length - 1);
        return Number(Math.sqrt(variance).toFixed(2));
      }

      // ─── Math (value-based) ────────────────────────────────────

      case 'ABS': {
        const val = resolveNumArg(args[0], cells);
        return val !== null ? Math.abs(val) : formula;
      }

      case 'INT': {
        const val = resolveNumArg(args[0], cells);
        return val !== null ? Math.trunc(val) : formula;
      }

      case 'SQRT': {
        const val = resolveNumArg(args[0], cells);
        if (val === null || val < 0) return formula;
        return Number(Math.sqrt(val).toFixed(4));
      }

      case 'ROUND': {
        const val = resolveNumArg(args[0], cells);
        const decimals = args.length > 1 ? resolveNumArg(args[1], cells) : 0;
        if (val === null || decimals === null) return formula;
        return Number(val.toFixed(Math.max(0, decimals)));
      }

      case 'ROUNDUP': {
        const val = resolveNumArg(args[0], cells);
        const decimals = args.length > 1 ? resolveNumArg(args[1], cells) : 0;
        if (val === null || decimals === null) return formula;
        const factor = Math.pow(10, Math.max(0, decimals));
        return Math.ceil(val * factor) / factor;
      }

      case 'ROUNDDOWN': {
        const val = resolveNumArg(args[0], cells);
        const decimals = args.length > 1 ? resolveNumArg(args[1], cells) : 0;
        if (val === null || decimals === null) return formula;
        const factor = Math.pow(10, Math.max(0, decimals));
        return Math.floor(val * factor) / factor;
      }

      case 'MOD': {
        const val = resolveNumArg(args[0], cells);
        const divisor = resolveNumArg(args[1], cells);
        if (val === null || divisor === null || divisor === 0) return formula;
        return val % divisor;
      }

      case 'POWER': {
        const base = resolveNumArg(args[0], cells);
        const exp = resolveNumArg(args[1], cells);
        if (base === null || exp === null) return formula;
        return Math.pow(base, exp);
      }

      // ─── Logic ─────────────────────────────────────────────────

      case 'IF': {
        if (args.length < 3) return formula;
        const condition = evaluateCondition(args[0], cells);
        const trueVal = resolveArg(args[1], cells);
        const falseVal = resolveArg(args[2], cells);
        return (condition ? trueVal : falseVal) ?? '';
      }

      case 'IFERROR': {
        if (args.length < 2) return formula;
        // Evaluate the first argument as a sub-expression
        const testVal = resolveArg(args[0], cells);
        const testStr = String(testVal ?? '');
        // If the value is an error marker or the sub-formula itself (unevaluated), return fallback
        if (testStr.startsWith('#') || testStr.startsWith('=')) {
          return resolveArg(args[1], cells) ?? '';
        }
        return testVal ?? '';
      }

      case 'AND': {
        for (const arg of args) {
          if (!evaluateCondition(arg, cells)) return 'FALSE';
        }
        return 'TRUE';
      }

      case 'OR': {
        for (const arg of args) {
          if (evaluateCondition(arg, cells)) return 'TRUE';
        }
        return 'FALSE';
      }

      case 'COUNTIF': {
        if (args.length < 2) return formula;
        const rawValues = getRangeRawValues(args[0], cells);
        const criteria = args[1].replace(/^"|"$/g, '');
        return rawValues.filter(v => matchesCriteria(v, criteria)).length;
      }

      case 'SUMIF': {
        if (args.length < 2) return formula;
        const range = args[0];
        const criteria = args[1].replace(/^"|"$/g, '');
        // If 3rd arg, sum from that range; otherwise sum from the criteria range
        const sumRange = args.length >= 3 ? args[2] : range;

        const rawValues = getRangeRawValues(range, cells);
        const sumValues = getRangeRawValues(sumRange, cells);
        let total = 0;
        for (let i = 0; i < rawValues.length; i++) {
          if (matchesCriteria(rawValues[i], criteria)) {
            const n = Number(sumValues[i]);
            if (!isNaN(n)) total += n;
          }
        }
        return total;
      }

      case 'COUNTIFS': {
        // COUNTIFS(range1, criteria1, range2, criteria2, ...)
        if (args.length < 2 || args.length % 2 !== 0) return formula;
        const pairCount = args.length / 2;
        const rangeArrays: (string | number | null)[][] = [];
        const criteriaList: string[] = [];
        for (let p = 0; p < pairCount; p++) {
          rangeArrays.push(getRangeRawValues(args[p * 2], cells));
          criteriaList.push(args[p * 2 + 1].replace(/^"|"$/g, ''));
        }
        const len = rangeArrays[0].length;
        let count = 0;
        for (let i = 0; i < len; i++) {
          const allMatch = rangeArrays.every((ra, p) => matchesCriteria(ra[i], criteriaList[p]));
          if (allMatch) count++;
        }
        return count;
      }

      case 'SUMIFS': {
        // SUMIFS(sum_range, criteria_range1, criteria1, criteria_range2, criteria2, ...)
        if (args.length < 3 || (args.length - 1) % 2 !== 0) return formula;
        const sumVals = getRangeRawValues(args[0], cells);
        const pairCnt = (args.length - 1) / 2;
        const critRanges: (string | number | null)[][] = [];
        const crits: string[] = [];
        for (let p = 0; p < pairCnt; p++) {
          critRanges.push(getRangeRawValues(args[1 + p * 2], cells));
          crits.push(args[2 + p * 2].replace(/^"|"$/g, ''));
        }
        let total = 0;
        for (let i = 0; i < sumVals.length; i++) {
          const allMatch = critRanges.every((ra, p) => matchesCriteria(ra[i], crits[p]));
          if (allMatch) {
            const n = Number(sumVals[i]);
            if (!isNaN(n)) total += n;
          }
        }
        return total;
      }

      // ─── Text ──────────────────────────────────────────────────

      case 'CONCAT':
      case 'CONCATENATE': {
        const parts: string[] = [];
        for (const arg of args) {
          if (isRange(arg)) {
            const vals = getRangeRawValues(arg, cells);
            parts.push(...vals.map(v => String(v ?? '')));
          } else {
            const val = resolveArg(arg, cells);
            parts.push(String(val ?? ''));
          }
        }
        return parts.join('');
      }

      case 'UPPER': {
        const val = resolveArg(args[0], cells);
        return String(val ?? '').toUpperCase();
      }

      case 'LOWER': {
        const val = resolveArg(args[0], cells);
        return String(val ?? '').toLowerCase();
      }

      case 'LEN': {
        const val = resolveArg(args[0], cells);
        return String(val ?? '').length;
      }

      case 'LEFT': {
        const val = String(resolveArg(args[0], cells) ?? '');
        const n = args.length > 1 ? resolveNumArg(args[1], cells) : 1;
        return val.substring(0, n ?? 1);
      }

      case 'RIGHT': {
        const val = String(resolveArg(args[0], cells) ?? '');
        const n = args.length > 1 ? resolveNumArg(args[1], cells) : 1;
        return val.substring(val.length - (n ?? 1));
      }

      case 'MID': {
        if (args.length < 3) return formula;
        const val = String(resolveArg(args[0], cells) ?? '');
        const start = resolveNumArg(args[1], cells);
        const length = resolveNumArg(args[2], cells);
        if (start === null || length === null) return formula;
        // MID is 1-based in Excel
        return val.substring(start - 1, start - 1 + length);
      }

      case 'TRIM': {
        const val = resolveArg(args[0], cells);
        return String(val ?? '').trim();
      }

      // ─── Search (VLOOKUP / HLOOKUP) ───────────────────────────

      case 'VLOOKUP': {
        // VLOOKUP(search_value, range, col_index, [exact_match])
        if (args.length < 3) return formula;
        const searchVal = resolveArg(args[0], cells);
        const range = args[1];
        const colIndex = resolveNumArg(args[2], cells);
        if (colIndex === null || !isRange(range)) return formula;

        const [startCell, endCell] = range.split(':');
        const startCoords = cellIdToCoords(startCell);
        const endCoords = cellIdToCoords(endCell);

        const minRow = Math.min(startCoords.row, endCoords.row);
        const maxRow = Math.max(startCoords.row, endCoords.row);
        const startCol = Math.min(startCoords.col, endCoords.col);

        // Search in first column of range
        for (let row = minRow; row <= maxRow; row++) {
          const cellId = columnIndexToLetter(startCol) + row;
          const cellVal = cells[cellId]?.value;
          if (cellVal !== null && cellVal !== undefined && String(cellVal) === String(searchVal)) {
            // Return value from the target column
            const targetCol = startCol + colIndex - 1;
            const targetId = columnIndexToLetter(targetCol) + row;
            return cells[targetId]?.value ?? '';
          }
        }
        return '#N/A';
      }

      case 'HLOOKUP': {
        // HLOOKUP(search_value, range, row_index, [exact_match])
        if (args.length < 3) return formula;
        const searchVal = resolveArg(args[0], cells);
        const range = args[1];
        const rowIndex = resolveNumArg(args[2], cells);
        if (rowIndex === null || !isRange(range)) return formula;

        const [startCell, endCell] = range.split(':');
        const startCoords = cellIdToCoords(startCell);
        const endCoords = cellIdToCoords(endCell);

        const minCol = Math.min(startCoords.col, endCoords.col);
        const maxCol = Math.max(startCoords.col, endCoords.col);
        const startRow = Math.min(startCoords.row, endCoords.row);

        // Search in first row of range
        for (let col = minCol; col <= maxCol; col++) {
          const cellId = columnIndexToLetter(col) + startRow;
          const cellVal = cells[cellId]?.value;
          if (cellVal !== null && cellVal !== undefined && String(cellVal) === String(searchVal)) {
            // Return value from the target row
            const targetRow = startRow + rowIndex - 1;
            const targetId = columnIndexToLetter(col) + targetRow;
            return cells[targetId]?.value ?? '';
          }
        }
        return '#N/A';
      }

      case 'XLOOKUP': {
        // XLOOKUP(search_value, lookup_range, return_range, [not_found])
        if (args.length < 3) return formula;
        const searchVal = resolveArg(args[0], cells);
        const lookupVals = getRangeRawValues(args[1], cells);
        const returnVals = getRangeRawValues(args[2], cells);
        const notFound = args.length >= 4 ? resolveArg(args[3], cells) : '#N/A';

        for (let i = 0; i < lookupVals.length; i++) {
          if (lookupVals[i] !== null && lookupVals[i] !== undefined && String(lookupVals[i]) === String(searchVal)) {
            return returnVals[i] ?? '';
          }
        }
        return notFound ?? '#N/A';
      }

      case 'INDEX': {
        // INDEX(range, row_num, [col_num])
        if (args.length < 2) return formula;
        const range = args[0];
        const rowNum = resolveNumArg(args[1], cells);
        const colNum = args.length >= 3 ? resolveNumArg(args[2], cells) : 1;
        if (rowNum === null || colNum === null || !isRange(range)) return formula;

        const [startCell, endCell] = range.split(':');
        const sc = cellIdToCoords(startCell);
        const ec = cellIdToCoords(endCell);
        const minRow = Math.min(sc.row, ec.row);
        const minCol = Math.min(sc.col, ec.col);

        const targetRow = minRow + rowNum - 1;
        const targetCol = minCol + colNum - 1;
        const targetId = columnIndexToLetter(targetCol) + targetRow;
        return cells[targetId]?.value ?? '';
      }

      case 'MATCH': {
        // MATCH(search_value, lookup_range, [match_type])
        if (args.length < 2) return formula;
        const searchVal = resolveArg(args[0], cells);
        const lookupVals = getRangeRawValues(args[1], cells);

        for (let i = 0; i < lookupVals.length; i++) {
          if (lookupVals[i] !== null && lookupVals[i] !== undefined && String(lookupVals[i]) === String(searchVal)) {
            return i + 1; // 1-based position
          }
        }
        return '#N/A';
      }

      // ─── Date functions ───────────────────────────────────────

      case 'DATE': {
        // DATE(year, month, day)
        if (args.length < 3) return formula;
        const year = resolveNumArg(args[0], cells);
        const month = resolveNumArg(args[1], cells);
        const day = resolveNumArg(args[2], cells);
        if (year === null || month === null || day === null) return formula;
        const d = new Date(year, month - 1, day);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      }

      case 'YEAR': {
        const val = resolveArg(args[0], cells);
        const d = new Date(String(val));
        return !isNaN(d.getTime()) ? d.getFullYear() : formula;
      }

      case 'MONTH': {
        const val = resolveArg(args[0], cells);
        const d = new Date(String(val));
        return !isNaN(d.getTime()) ? d.getMonth() + 1 : formula;
      }

      case 'DAY': {
        const val = resolveArg(args[0], cells);
        const d = new Date(String(val));
        return !isNaN(d.getTime()) ? d.getDate() : formula;
      }

      default:
        return formula;
    }
  } catch (error) {
    console.warn('Formula evaluation error:', error);
    return formula;
  }
}
