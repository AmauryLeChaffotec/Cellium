import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { GridPersistData } from './persistence';

const mockDB = {
  put: vi.fn(),
  get: vi.fn(),
};

vi.mock('idb', () => ({
  openDB: vi.fn(() => Promise.resolve(mockDB)),
}));

// Import after mock so the module picks up the mocked idb
const { saveGridData, loadGridData, getDB } = await import('./persistence');
const { openDB } = await import('idb');

describe('persistence', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getDB', () => {
    it('should call openDB with cellium database name and version 1', async () => {
      await getDB();
      expect(openDB).toHaveBeenCalledWith('cellium', 1, expect.any(Object));
    });

    it('should return the same promise on subsequent calls (singleton)', async () => {
      const db1 = getDB();
      const db2 = getDB();
      expect(db1).toBe(db2);
    });
  });

  describe('saveGridData', () => {
    it('should call db.put with gridData store and current key', async () => {
      const data: GridPersistData = {
        cells: { A1: { id: 'A1', value: 'test' } },
        rowCount: 100,
        colCount: 26,
      };
      await saveGridData(data);
      expect(mockDB.put).toHaveBeenCalledWith('gridData', data, 'current');
    });
  });

  describe('loadGridData', () => {
    it('should return data when present in IndexedDB', async () => {
      const stored: GridPersistData = {
        cells: { B2: { id: 'B2', value: 42 } },
        rowCount: 500,
        colCount: 10,
      };
      mockDB.get.mockResolvedValue(stored);
      const result = await loadGridData();
      expect(mockDB.get).toHaveBeenCalledWith('gridData', 'current');
      expect(result).toEqual(stored);
    });

    it('should return null when no data in IndexedDB', async () => {
      mockDB.get.mockResolvedValue(undefined);
      const result = await loadGridData();
      expect(result).toBeNull();
    });
  });
});
