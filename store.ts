import { create } from 'zustand';
import type { User, ChatMessage, DailyBriefing, ProposedAction } from '@/types';

interface AppState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // Chat
  messages: ChatMessage[];
  conversationId: string | null;
  isSending: boolean;

  // Briefing
  todayBriefing: DailyBriefing | null;

  // Approvals
  pendingApprovals: ProposedAction[];

  // Actions
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  setMessages: (messages: ChatMessage[]) => void;
  addMessage: (message: ChatMessage) => void;
  setConversationId: (id: string | null) => void;
  setSending: (sending: boolean) => void;
  setTodayBriefing: (briefing: DailyBriefing | null) => void;
  setPendingApprovals: (actions: ProposedAction[]) => void;
  updateApproval: (actionId: string, status: ProposedAction['status']) => void;
  reset: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  messages: [],
  conversationId: null,
  isSending: false,

  todayBriefing: null,
  pendingApprovals: [],

  setUser: (user) => set({ user, isAuthenticated: !!user }),
  setLoading: (isLoading) => set({ isLoading }),
  setMessages: (messages) => set({ messages }),
  addMessage: (message) => set((s) => ({ messages: [...s.messages, message] })),
  setConversationId: (conversationId) => set({ conversationId }),
  setSending: (isSending) => set({ isSending }),
  setTodayBriefing: (todayBriefing) => set({ todayBriefing }),
  setPendingApprovals: (pendingApprovals) => set({ pendingApprovals }),
  updateApproval: (actionId, status) =>
    set((s) => ({
      pendingApprovals: s.pendingApprovals.map((a) =>
        a.id === actionId ? { ...a, status } : a
      ),
    })),
  reset: () =>
    set({
      user: null,
      isAuthenticated: false,
      messages: [],
      conversationId: null,
      todayBriefing: null,
      pendingApprovals: [],
    }),
}));
