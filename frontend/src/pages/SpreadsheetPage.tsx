import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { SpreadsheetGrid } from '../components/Grid';
import { DiffOverlay, ActionBar } from '../components/Diff';
import { VersionPanel } from '../components/Version';
import { AgentChat } from '../components/Agent';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { useVersionStore } from '../stores/versionStore';
import { useAuthStore } from '../stores/authStore';
import { setSessionId } from '../utils/session';

export function SpreadsheetPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isVersionPanelOpen, setIsVersionPanelOpen] = useState(false);
  const [ready, setReady] = useState(false);
  const { user, logout } = useAuthStore();

  useKeyboardShortcuts();

  useEffect(() => {
    if (!id) {
      navigate('/');
      return;
    }
    // Set the spreadsheet ID as the session so existing code works
    setSessionId(id);
    setReady(true);
    useVersionStore.getState().loadSnapshots();
  }, [id, navigate]);

  if (!ready) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-gray-500">Chargement...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-gray-200 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/')}
            className="text-sm text-gray-500 hover:text-gray-700 transition"
          >
            &larr; Dashboard
          </button>
          <h1 className="text-lg font-semibold text-gray-800">Cellium</h1>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500">{user?.name}</span>
          <button
            onClick={() => setIsVersionPanelOpen(!isVersionPanelOpen)}
            className="px-3 py-1 text-sm text-gray-700 hover:bg-gray-100 rounded border border-gray-300"
          >
            Historique
          </button>
          <button
            onClick={logout}
            className="px-3 py-1 text-sm text-gray-500 hover:text-gray-700 transition"
          >
            Deconnexion
          </button>
        </div>
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
