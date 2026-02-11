// 0 → 'A', 25 → 'Z'
export function columnIndexToLetter(index: number): string {
  return String.fromCharCode(65 + index);
}

// 'A' → 0, 'Z' → 25
export function letterToColumnIndex(letter: string): number {
  return letter.charCodeAt(0) - 65;
}

// 'A1' → { row: 1, col: 0 }
export function cellIdToCoords(id: string): { row: number; col: number } {
  const letter = id.charAt(0);
  const row = parseInt(id.slice(1), 10);
  return { row, col: letterToColumnIndex(letter) };
}

// (1, 0) → 'A1'
export function coordsToCellId(row: number, col: number): string {
  return `${columnIndexToLetter(col)}${row}`;
}
