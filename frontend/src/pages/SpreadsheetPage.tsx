import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { SpreadsheetGrid } from '../components/Grid';
import { DiffOverlay, ActionBar } from '../components/Diff';
import { VersionPanel } from '../components/Version';
import { AgentChat } from '../components/Agent';
import { HelpModal } from '../components/HelpModal';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { useVersionStore } from '../stores/versionStore';
import { useAuthStore } from '../stores/authStore';
import { setSessionId } from '../utils/session';

export function SpreadsheetPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isVersionPanelOpen, setIsVersionPanelOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
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
        <div className="inline-flex items-center gap-2 text-gray-400">
          <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span className="text-sm">Chargement...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Toolbar */}
      <header className="bg-white border-b border-gray-200/80 px-3 py-1.5 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-lg px-2 py-1.5 font-medium"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
          </button>
          <div className="w-px h-5 bg-gray-200" />
          <div className="flex items-center gap-2 px-1">
            <div className="flex items-center justify-center w-6 h-6 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-md">
              <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M3 14h18M10 3v18M14 3v18M3 6a3 3 0 013-3h12a3 3 0 013 3v12a3 3 0 01-3 3H6a3 3 0 01-3-3V6z" />
              </svg>
            </div>
            <h1 className="text-sm font-bold text-gray-900 tracking-tight">Cellium</h1>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setIsHelpOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg font-medium"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
            </svg>
            Aide
          </button>
          <button
            onClick={() => setIsVersionPanelOpen(!isVersionPanelOpen)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg font-medium"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Historique
          </button>
          <div className="w-px h-5 bg-gray-200 mx-1" />
          <div className="flex items-center gap-2 px-1">
            <div className="w-6 h-6 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center text-[10px] font-bold">
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <span className="text-xs font-medium text-gray-500">{user?.name}</span>
          </div>
          <button
            onClick={logout}
            className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
            title="Deconnexion"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
            </svg>
          </button>
        </div>
      </header>

      <div className="relative flex-1">
        <SpreadsheetGrid />
        <DiffOverlay />
      </div>
      <ActionBar />
      <VersionPanel isOpen={isVersionPanelOpen} onClose={() => setIsVersionPanelOpen(false)} />
      <AgentChat />
      {isHelpOpen && <HelpModal onClose={() => setIsHelpOpen(false)} />}
    </div>
  );
}
