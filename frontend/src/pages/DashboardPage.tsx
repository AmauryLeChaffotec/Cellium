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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">Cellium</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">{user?.name}</span>
            <button
              onClick={logout}
              className="text-sm text-gray-500 hover:text-gray-700 transition"
            >
              Deconnexion
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-semibold text-gray-800">Mes spreadsheets</h2>
          <button
            onClick={handleCreate}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-lg font-medium hover:bg-blue-700 transition"
          >
            <span className="text-lg leading-none">+</span>
            Nouveau spreadsheet
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-500">Chargement...</div>
        ) : spreadsheets.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-gray-400 text-5xl mb-4">
              <svg className="mx-auto w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-gray-500 text-lg mb-2">Aucun spreadsheet</p>
            <p className="text-gray-400 text-sm mb-6">Creez votre premier spreadsheet pour commencer</p>
            <button
              onClick={handleCreate}
              className="bg-blue-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-blue-700 transition"
            >
              Creer un spreadsheet
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {spreadsheets.map((sheet) => (
              <div
                key={sheet.id}
                className="bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-md transition group"
              >
                <div
                  className="p-5 cursor-pointer"
                  onClick={() => handleOpen(sheet.id)}
                >
                  {/* Grid preview icon */}
                  <div className="w-full h-24 bg-gray-50 rounded-lg mb-4 flex items-center justify-center border border-gray-100">
                    <svg className="w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 10h18M3 14h18M10 3v18M14 3v18M3 6a3 3 0 013-3h12a3 3 0 013 3v12a3 3 0 01-3 3H6a3 3 0 01-3-3V6z" />
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
                      className="w-full font-medium text-gray-900 border border-blue-400 rounded px-2 py-1 outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <h3 className="font-medium text-gray-900 truncate">{sheet.name}</h3>
                  )}
                  <p className="text-xs text-gray-400 mt-1">
                    Modifie le {formatDate(sheet.updatedAt)}
                  </p>
                </div>

                {/* Actions */}
                <div className="border-t border-gray-100 px-5 py-2.5 flex items-center gap-3 opacity-0 group-hover:opacity-100 transition">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      startRename(sheet.id, sheet.name);
                    }}
                    className="text-xs text-gray-500 hover:text-blue-600 transition"
                  >
                    Renommer
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(sheet.id, sheet.name);
                    }}
                    className="text-xs text-gray-500 hover:text-red-600 transition"
                  >
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
