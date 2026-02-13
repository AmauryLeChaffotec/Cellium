import type { Snapshot } from '../../types/version';
import { formatTimestamp } from '../../utils/dateUtils';
import { useVersionStore } from '../../stores/versionStore';

interface VersionItemProps {
  snapshot: Snapshot;
}

export function VersionItem({ snapshot }: VersionItemProps) {
  const formattedDate = formatTimestamp(snapshot.timestamp);
  const { isRestoring, restoreFromSnapshot, deleteSnapshot } = useVersionStore();

  const handleDelete = () => {
    if (confirm(`Supprimer la version "${snapshot.name}" ?`)) {
      deleteSnapshot(snapshot.id);
    }
  };

  return (
    <div className="p-4 hover:bg-gray-50 transition-colors">
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-800">{snapshot.name}</p>
          <p className="text-xs text-gray-500 mt-1">
            {snapshot.author && <span className="font-medium">{snapshot.author} — </span>}
            {formattedDate}
          </p>
        </div>
        <div className="flex gap-1.5 ml-2 shrink-0">
          <button
            onClick={() => restoreFromSnapshot(snapshot.id)}
            disabled={isRestoring}
            className="px-3 py-1 text-xs text-blue-600 hover:bg-blue-50 rounded border border-blue-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isRestoring ? 'Restauration...' : 'Restaurer'}
          </button>
          <button
            onClick={handleDelete}
            className="px-2 py-1 text-xs text-red-500 hover:bg-red-50 rounded border border-red-300"
          >
            Supprimer
          </button>
        </div>
      </div>
    </div>
  );
}
