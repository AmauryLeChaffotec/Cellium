import type { Operation } from './operations';

export interface Snapshot {
  id: string; // UUID v4
  timestamp: string; // ISO 8601
  description: string; // Description de la commande IA
  operations: Operation[]; // Delta des opérations appliquées
}

export interface VersionStore {
  snapshots: Snapshot[];
  createSnapshot: (operations: Operation[], description: string) => void;
  loadSnapshots: () => Promise<void>;
  clearSnapshots: () => void;
}
