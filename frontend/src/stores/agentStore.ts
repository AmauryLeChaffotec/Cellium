import { create } from 'zustand';
import { apiFetch } from '../utils/api';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface AgentStore {
  messages: ChatMessage[];
  isLoading: boolean;
  isOpen: boolean;

  toggleOpen: () => void;
  sendMessage: (message: string) => Promise<void>;
  clearMessages: () => void;
}

export const useAgentStore = create<AgentStore>()((set, get) => ({
  messages: [],
  isLoading: false,
  isOpen: false,

  toggleOpen: () => set((s) => ({ isOpen: !s.isOpen })),

  sendMessage: async (message) => {
    const { messages } = get();

    // Add user message to chat
    const userMsg: ChatMessage = { role: 'user', content: message };
    set({ messages: [...messages, userMsg], isLoading: true });

    try {
      const res = await apiFetch('/api/agent/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Erreur serveur');
      }

      const data = await res.json();
      const assistantMsg: ChatMessage = { role: 'assistant', content: data.reply };

      set((s) => ({
        messages: [...s.messages, assistantMsg],
        isLoading: false,
      }));

      // If the agent modified the spreadsheet, trigger a reload
      if (data.modified) {
        // Dispatch a custom event so the grid knows to reload
        window.dispatchEvent(new CustomEvent('cellium:agent-modified'));
      }
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : 'Erreur inconnue';
      set((s) => ({
        messages: [...s.messages, { role: 'assistant', content: `Erreur : ${errMsg}` }],
        isLoading: false,
      }));
    }
  },

  clearMessages: () => set({ messages: [] }),
}));
