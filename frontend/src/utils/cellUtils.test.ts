import { describe, it, expect } from 'vitest';
import {
  columnIndexToLetter,
  letterToColumnIndex,
  cellIdToCoords,
  coordsToCellId,
} from './cellUtils';

describe('columnIndexToLetter', () => {
  it('should convert 0 to A', () => {
    expect(columnIndexToLetter(0)).toBe('A');
  });

  it('should convert 25 to Z', () => {
    expect(columnIndexToLetter(25)).toBe('Z');
  });

  it('should convert 12 to M', () => {
    expect(columnIndexToLetter(12)).toBe('M');
  });
});

describe('letterToColumnIndex', () => {
  it('should convert A to 0', () => {
    expect(letterToColumnIndex('A')).toBe(0);
  });

  it('should convert Z to 25', () => {
    expect(letterToColumnIndex('Z')).toBe(25);
  });

  it('should convert M to 12', () => {
    expect(letterToColumnIndex('M')).toBe(12);
  });
});

describe('cellIdToCoords', () => {
  it('should parse A1 to row 1, col 0', () => {
    expect(cellIdToCoords('A1')).toEqual({ row: 1, col: 0 });
  });

  it('should parse Z100 to row 100, col 25', () => {
    expect(cellIdToCoords('Z100')).toEqual({ row: 100, col: 25 });
  });

  it('should parse C42 to row 42, col 2', () => {
    expect(cellIdToCoords('C42')).toEqual({ row: 42, col: 2 });
  });
});

describe('coordsToCellId', () => {
  it('should convert row 1, col 0 to A1', () => {
    expect(coordsToCellId(1, 0)).toBe('A1');
  });

  it('should convert row 100, col 25 to Z100', () => {
    expect(coordsToCellId(100, 25)).toBe('Z100');
  });

  it('should convert row 42, col 2 to C42', () => {
    expect(coordsToCellId(42, 2)).toBe('C42');
  });

  it('should be inverse of cellIdToCoords', () => {
    const id = 'M50';
    const coords = cellIdToCoords(id);
    expect(coordsToCellId(coords.row, coords.col)).toBe(id);
  });
});
