import type { Snapshot } from '../../types/version';
import { formatTimestamp } from '../../utils/dateUtils';
import { useVersionStore } from '../../stores/versionStore';

interface VersionItemProps {
  snapshot: Snapshot;
}

export function VersionItem({ snapshot }: VersionItemProps) {
  const formattedDate = formatTimestamp(snapshot.timestamp);
  const { isRestoring, restoreFromSnapshot } = useVersionStore();

  const handleRestore = () => {
    restoreFromSnapshot(snapshot.id);
  };

  return (
    <div className="p-4 hover:bg-gray-50 transition-colors">
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-800">{snapshot.description}</p>
          <p className="text-xs text-gray-500 mt-1">{formattedDate}</p>
        </div>
      </div>

      {/* Operations Summary and Restore Button */}
      <div className="mt-2 flex gap-2 text-xs items-center justify-between">
        <span className="text-gray-600">
          {snapshot.operations.length} opération{snapshot.operations.length > 1 ? 's' : ''}
        </span>

        {/* Restore Button */}
        <button
          onClick={handleRestore}
          disabled={isRestoring}
          className="px-3 py-1 text-xs text-blue-600 hover:bg-blue-50 rounded border border-blue-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isRestoring ? 'Restauration...' : 'Restaurer'}
        </button>
      </div>
    </div>
  );
}
