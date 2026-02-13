import { useState, useRef } from 'react';
import { useVersionStore } from '../../stores/versionStore';
import { VersionItem } from './VersionItem';

interface VersionPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function VersionPanel({ isOpen, onClose }: VersionPanelProps) {
  const { snapshots, isLoading, createSnapshot, exportFile, importFile } = useVersionStore();
  const [name, setName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleSave = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    createSnapshot(trimmed);
    setName('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    }
  };

  return (
    <div className="fixed top-0 right-0 h-full w-96 bg-white border-l border-gray-300 shadow-lg z-20 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-800">Versions</h2>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700"
          aria-label="Fermer"
        >
          ✕
        </button>
      </div>

      {/* Save new version */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex gap-2">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Nom de la version..."
            className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleSave}
            disabled={!name.trim()}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            Sauvegarder
          </button>
        </div>
      </div>

      {/* Export / Import */}
      <div className="p-4 border-b border-gray-200 flex gap-2">
        <button
          onClick={exportFile}
          className="flex-1 px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded border border-gray-300 hover:bg-gray-200"
        >
          Exporter (.cellium)
        </button>
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex-1 px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded border border-gray-300 hover:bg-gray-200"
        >
          Importer
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".cellium"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              importFile(file);
              e.target.value = '';
            }
          }}
        />
      </div>

      {/* Version list */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="p-4 text-center text-gray-500">Chargement...</div>
        ) : snapshots.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            Aucune version enregistrée
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {[...snapshots].reverse().map((snapshot) => (
              <VersionItem key={snapshot.id} snapshot={snapshot} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
