import { useState, useRef } from 'react';
import { useVersionStore } from '../../stores/versionStore';
import { VersionItem } from './VersionItem';
import { getAuthor, setAuthor } from '../../utils/session';

interface VersionPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function VersionPanel({ isOpen, onClose }: VersionPanelProps) {
  const { snapshots, isLoading, createSnapshot, exportFile, importFile } = useVersionStore();
  const [name, setName] = useState('');
  const [author, setAuthorValue] = useState(getAuthor);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleAuthorChange = (value: string) => {
    setAuthorValue(value);
    setAuthor(value);
  };

  const handleSave = () => {
    const trimmedName = name.trim();
    const trimmedAuthor = author.trim();
    if (!trimmedName || !trimmedAuthor) return;
    createSnapshot(trimmedName, trimmedAuthor);
    setName('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    }
  };

  return (
    <div className="fixed top-0 right-0 h-full w-96 bg-white border-l border-gray-200/80 shadow-2xl shadow-gray-300/30 z-20 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-indigo-50 rounded-lg flex items-center justify-center">
            <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-base font-bold text-gray-900">Versions</h2>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
          aria-label="Fermer"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Save new version */}
      <div className="px-5 py-4 border-b border-gray-100 space-y-2.5">
        <input
          type="text"
          value={author}
          onChange={(e) => handleAuthorChange(e.target.value)}
          placeholder="Prenom Nom"
          className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 focus:bg-white placeholder:text-gray-400"
        />
        <div className="flex gap-2">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Nom de la version..."
            className="flex-1 px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 focus:bg-white placeholder:text-gray-400"
          />
          <button
            onClick={handleSave}
            disabled={!name.trim() || !author.trim()}
            className="px-4 py-2 text-sm bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-lg font-semibold hover:from-indigo-700 hover:to-violet-700 disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
          >
            Sauvegarder
          </button>
        </div>
      </div>

      {/* Export / Import */}
      <div className="px-5 py-3 border-b border-gray-100 flex gap-2">
        <button
          onClick={exportFile}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-sm text-gray-600 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 hover:text-gray-800 font-medium"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
          </svg>
          Exporter
        </button>
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-sm text-gray-600 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 hover:text-gray-800 font-medium"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
          </svg>
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
          <div className="p-6 text-center">
            <div className="inline-flex items-center gap-2 text-gray-400">
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <span className="text-sm">Chargement...</span>
            </div>
          </div>
        ) : snapshots.length === 0 ? (
          <div className="p-6 text-center">
            <p className="text-sm text-gray-400">Aucune version enregistree</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {[...snapshots].reverse().map((snapshot) => (
              <VersionItem key={snapshot.id} snapshot={snapshot} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
