import { create } from 'zustand';

interface User {
  id: number;
  email: string;
  name: string;
}

interface AuthState {
  token: string | null;
  user: User | null;
  isLoading: boolean;
  error: string | null;
}

interface AuthActions {
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
  clearError: () => void;
}

const TOKEN_KEY = 'cellium-auth-token';

export const useAuthStore = create<AuthState & AuthActions>()((set, get) => ({
  token: localStorage.getItem(TOKEN_KEY),
  user: null,
  isLoading: false,
  error: null,

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        set({ isLoading: false, error: data.error || 'Erreur de connexion' });
        return;
      }
      localStorage.setItem(TOKEN_KEY, data.token);
      set({ token: data.token, user: data.user, isLoading: false });
    } catch {
      set({ isLoading: false, error: 'Erreur réseau' });
    }
  },

  register: async (email, password, name) => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name }),
      });
      const data = await res.json();
      if (!res.ok) {
        set({ isLoading: false, error: data.error || "Erreur d'inscription" });
        return;
      }
      localStorage.setItem(TOKEN_KEY, data.token);
      set({ token: data.token, user: data.user, isLoading: false });
    } catch {
      set({ isLoading: false, error: 'Erreur réseau' });
    }
  },

  logout: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem('cellium-session-id');
    set({ token: null, user: null });
  },

  checkAuth: async () => {
    const token = get().token;
    if (!token) return;
    try {
      const res = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        localStorage.removeItem(TOKEN_KEY);
        set({ token: null, user: null });
        return;
      }
      const data = await res.json();
      set({ user: data.user });
    } catch {
      localStorage.removeItem(TOKEN_KEY);
      set({ token: null, user: null });
    }
  },

  clearError: () => set({ error: null }),
}));

export function getAuthToken(): string | null {
  return useAuthStore.getState().token;
}
