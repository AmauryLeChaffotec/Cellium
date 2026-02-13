import type { GridPersistData } from '../utils/persistence';

export interface Snapshot {
  id: string;
  timestamp: string;
  name: string;
  author: string;
  gridData: GridPersistData;
}
