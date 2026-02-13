import { useEffect, useState } from 'react';
import { SpreadsheetGrid } from './components/Grid';
import { DiffOverlay, ActionBar } from './components/Diff';
import { VersionPanel } from './components/Version';
import { AgentChat } from './components/Agent';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { useVersionStore } from './stores/versionStore';
import { initSession } from './utils/session';

function App() {
  const [isVersionPanelOpen, setIsVersionPanelOpen] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);

  // Activate keyboard shortcuts (Escape, Ctrl+Enter)
  useKeyboardShortcuts();

  // Initialize session before loading anything
  useEffect(() => {
    initSession().then(() => {
      setSessionReady(true);
      useVersionStore.getState().loadSnapshots();
    });
  }, []);

  if (!sessionReady) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-gray-500">Chargement...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-gray-200 px-4 py-2 flex items-center justify-between">
        <h1 className="text-lg font-semibold text-gray-800">Cellium</h1>
        <button
          onClick={() => setIsVersionPanelOpen(!isVersionPanelOpen)}
          className="px-3 py-1 text-sm text-gray-700 hover:bg-gray-100 rounded border border-gray-300"
        >
          Historique
        </button>
      </header>
      <div className="relative">
        <SpreadsheetGrid />
        <DiffOverlay />
      </div>
      <ActionBar />
      <VersionPanel isOpen={isVersionPanelOpen} onClose={() => setIsVersionPanelOpen(false)} />
      <AgentChat />
    </div>
  );
}

export default App;
