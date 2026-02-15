import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore, getAuthToken } from '../stores/authStore';

interface Spreadsheet {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export function DashboardPage() {
  const [spreadsheets, setSpreadsheets] = useState<Spreadsheet[]>([]);
  const [loading, setLoading] = useState(true);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const renameInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const authHeaders = () => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${getAuthToken()}`,
  });

  const fetchSpreadsheets = async () => {
    try {
      const res = await fetch('/api/spreadsheets', { headers: authHeaders() });
      if (res.ok) {
        const data = await res.json();
        setSpreadsheets(data);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSpreadsheets();
  }, []);

  useEffect(() => {
    if (renamingId && renameInputRef.current) {
      renameInputRef.current.focus();
      renameInputRef.current.select();
    }
  }, [renamingId]);

  const handleCreate = async () => {
    const res = await fetch('/api/spreadsheets', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ name: 'Sans titre' }),
    });
    if (res.ok) {
      const data = await res.json();
      navigate(`/sheet/${data.id}`);
    }
  };

  const handleOpen = (id: string) => {
    navigate(`/sheet/${id}`);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Supprimer "${name}" ? Cette action est irreversible.`)) return;
    const res = await fetch(`/api/spreadsheets/${id}`, {
      method: 'DELETE',
      headers: authHeaders(),
    });
    if (res.ok) {
      setSpreadsheets((prev) => prev.filter((s) => s.id !== id));
    }
  };

  const startRename = (id: string, currentName: string) => {
    setRenamingId(id);
    setRenameValue(currentName);
  };

  const submitRename = async () => {
    if (!renamingId || !renameValue.trim()) {
      setRenamingId(null);
      return;
    }
    const res = await fetch(`/api/spreadsheets/${renamingId}`, {
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify({ name: renameValue.trim() }),
    });
    if (res.ok) {
      setSpreadsheets((prev) =>
        prev.map((s) => (s.id === renamingId ? { ...s, name: renameValue.trim() } : s))
      );
    }
    setRenamingId(null);
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + 'Z');
    return d.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200/60 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-lg">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M3 14h18M10 3v18M14 3v18M3 6a3 3 0 013-3h12a3 3 0 013 3v12a3 3 0 01-3 3H6a3 3 0 01-3-3V6z" />
              </svg>
            </div>
            <h1 className="text-lg font-bold text-gray-900 tracking-tight">Cellium</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center text-xs font-semibold">
                {user?.name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <span className="text-sm font-medium text-gray-700">{user?.name}</span>
            </div>
            <div className="w-px h-5 bg-gray-200" />
            <button
              onClick={logout}
              className="text-sm text-gray-500 hover:text-gray-800 font-medium"
            >
              Deconnexion
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Mes spreadsheets</h2>
            <p className="text-sm text-gray-500 mt-1">
              {spreadsheets.length > 0 ? `${spreadsheets.length} document${spreadsheets.length > 1 ? 's' : ''}` : ''}
            </p>
          </div>
          <button
            onClick={handleCreate}
            className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 text-white px-5 py-2.5 rounded-xl font-semibold text-sm hover:from-indigo-700 hover:to-violet-700 shadow-md shadow-indigo-200/50 hover:shadow-lg hover:shadow-indigo-300/50 active:scale-[0.98]"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Nouveau spreadsheet
          </button>
        </div>

        {loading ? (
          <div className="text-center py-16">
            <div className="inline-flex items-center gap-2 text-gray-400">
              <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <span className="text-sm">Chargement...</span>
            </div>
          </div>
        ) : spreadsheets.length === 0 ? (
          <div className="text-center py-20">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-indigo-50 to-violet-50 rounded-2xl border border-indigo-100 mb-6">
              <svg className="w-10 h-10 text-indigo-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-gray-800 text-lg font-semibold mb-1">Aucun spreadsheet</p>
            <p className="text-gray-400 text-sm mb-8">Creez votre premier spreadsheet pour commencer</p>
            <button
              onClick={handleCreate}
              className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white px-6 py-2.5 rounded-xl font-semibold text-sm hover:from-indigo-700 hover:to-violet-700 shadow-md shadow-indigo-200/50"
            >
              Creer un spreadsheet
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {spreadsheets.map((sheet) => (
              <div
                key={sheet.id}
                className="bg-white rounded-xl border border-gray-200/80 hover:border-indigo-300 hover:shadow-lg hover:shadow-indigo-50 transition-all duration-200 group"
              >
                <div
                  className="p-5 cursor-pointer"
                  onClick={() => handleOpen(sheet.id)}
                >
                  {/* Grid preview */}
                  <div className="w-full h-24 bg-gradient-to-br from-gray-50 to-slate-50 rounded-lg mb-4 flex items-center justify-center border border-gray-100 group-hover:from-indigo-50/50 group-hover:to-violet-50/50 group-hover:border-indigo-100 transition-colors">
                    <svg className="w-10 h-10 text-gray-300 group-hover:text-indigo-300 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={0.8}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M3 14h18M10 3v18M14 3v18M3 6a3 3 0 013-3h12a3 3 0 013 3v12a3 3 0 01-3 3H6a3 3 0 01-3-3V6z" />
                    </svg>
                  </div>

                  {renamingId === sheet.id ? (
                    <input
                      ref={renameInputRef}
                      value={renameValue}
                      onChange={(e) => setRenameValue(e.target.value)}
                      onBlur={submitRename}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') submitRename();
                        if (e.key === 'Escape') setRenamingId(null);
                      }}
                      onClick={(e) => e.stopPropagation()}
                      className="w-full font-semibold text-gray-900 border border-indigo-400 rounded-lg px-2.5 py-1 outline-none focus:ring-2 focus:ring-indigo-500/40 text-sm"
                    />
                  ) : (
                    <h3 className="font-semibold text-gray-900 truncate text-sm">{sheet.name}</h3>
                  )}
                  <p className="text-xs text-gray-400 mt-1.5">
                    Modifie le {formatDate(sheet.updatedAt)}
                  </p>
                </div>

                {/* Actions */}
                <div className="border-t border-gray-100 px-5 py-2.5 flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      startRename(sheet.id, sheet.name);
                    }}
                    className="text-xs text-gray-500 hover:text-indigo-600 font-medium flex items-center gap-1"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
                    </svg>
                    Renommer
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(sheet.id, sheet.name);
                    }}
                    className="text-xs text-gray-500 hover:text-red-600 font-medium flex items-center gap-1"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                    </svg>
                    Supprimer
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
