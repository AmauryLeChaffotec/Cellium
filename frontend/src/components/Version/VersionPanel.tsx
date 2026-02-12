import { useVersionStore } from '../../stores/versionStore';
import { VersionItem } from './VersionItem';

interface VersionPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function VersionPanel({ isOpen, onClose }: VersionPanelProps) {
  const { snapshots, isLoading } = useVersionStore();

  if (!isOpen) return null;

  return (
    <div className="fixed top-0 right-0 h-full w-96 bg-white border-l border-gray-300 shadow-lg z-20 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-800">Historique des Versions</h2>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700"
          aria-label="Fermer l'historique"
        >
          ✕
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="p-4 text-center text-gray-500">Chargement...</div>
        ) : snapshots.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            Aucune version enregistrée
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {/* Reverse order: most recent first */}
            {[...snapshots].reverse().map((snapshot) => (
              <VersionItem key={snapshot.id} snapshot={snapshot} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
