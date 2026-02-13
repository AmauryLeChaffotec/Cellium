import type { GridPersistData } from '../utils/persistence';

export interface Snapshot {
  id: string;
  timestamp: string;
  name: string;
  gridData: GridPersistData;
}
