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
    <div className="px-5 py-3.5 hover:bg-gray-50/80 transition-colors group">
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-800">{snapshot.name}</p>
          <p className="text-xs text-gray-400 mt-0.5">
            {snapshot.author && <span className="text-gray-500 font-medium">{snapshot.author}</span>}
            {snapshot.author && ' — '}
            {formattedDate}
          </p>
        </div>
        <div className="flex gap-1.5 ml-3 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => restoreFromSnapshot(snapshot.id)}
            disabled={isRestoring}
            className="px-2.5 py-1 text-xs text-indigo-600 hover:bg-indigo-50 rounded-md font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isRestoring ? '...' : 'Restaurer'}
          </button>
          <button
            onClick={handleDelete}
            className="px-2 py-1 text-xs text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
