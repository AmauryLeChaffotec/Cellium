import type { Snapshot } from '../../types/version';
import { formatTimestamp } from '../../utils/dateUtils';
import { useVersionStore } from '../../stores/versionStore';

interface VersionItemProps {
  snapshot: Snapshot;
}

export function VersionItem({ snapshot }: VersionItemProps) {
  const formattedDate = formatTimestamp(snapshot.timestamp);
  const { isRestoring, restoreFromSnapshot } = useVersionStore();

  return (
    <div className="p-4 hover:bg-gray-50 transition-colors">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-800">{snapshot.name}</p>
          <p className="text-xs text-gray-500 mt-1">{formattedDate}</p>
        </div>
        <button
          onClick={() => restoreFromSnapshot(snapshot.id)}
          disabled={isRestoring}
          className="px-3 py-1 text-xs text-blue-600 hover:bg-blue-50 rounded border border-blue-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isRestoring ? 'Restauration...' : 'Restaurer'}
        </button>
      </div>
    </div>
  );
}
