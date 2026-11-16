import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import type { ChatMessage, DailyBriefing, ProposedAction, User, ConnectedAccount } from '@/types';

const API_BASE = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001';

const client = axios.create({
  baseURL: API_BASE,
  timeout: 30000,
});

// Attach auth token
client.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const api = {
  // Auth
  async login(email: string, password: string) {
    const { data } = await client.post('/auth/login', { email, password });
    await SecureStore.setItemAsync('auth_token', data.token);
    return data.user as User;
  },

  async signup(email: string, password: string, name?: string) {
    const { data } = await client.post('/auth/signup', { email, password, name });
    await SecureStore.setItemAsync('auth_token', data.token);
    return data.user as User;
  },

  async logout() {
    await SecureStore.deleteItemAsync('auth_token');
  },

  async getMe() {
    const { data } = await client.get('/me');
    return data as User & { googleConnected?: boolean };
  },

  // Chat
  async sendMessage(content: string, conversationId?: string) {
    const { data } = await client.post('/chat', { content, conversationId });
    return data as { messages: ChatMessage[]; conversationId: string };
  },

  async getConversation(conversationId: string) {
    const { data } = await client.get(`/chat/${conversationId}`);
    return data as ChatMessage[];
  },

  // Briefing
  async getTodayBriefing() {
    const { data } = await client.get('/briefing/today');
    return data as DailyBriefing | null;
  },

  async generateBriefing() {
    const { data } = await client.post('/briefing/generate');
    return data as DailyBriefing;
  },

  // Approvals
  async getPendingApprovals() {
    const { data } = await client.get('/approvals');
    return data as ProposedAction[];
  },

  async respondToAction(
    actionId: string,
    status: 'approved' | 'rejected' | 'edited',
    editedPayload?: Record<string, unknown>
  ) {
    const { data } = await client.post(`/approvals/${actionId}`, { status, editedPayload });
    return data as ProposedAction;
  },

  // Connections
  async getConnectedAccounts() {
    const { data } = await client.get('/connections');
    return data as ConnectedAccount[];
  },

  async startGoogleOAuth() {
    const { data } = await client.get('/connections/google/start');
    return data as { url: string };
  },

  async disconnectGoogle() {
    await client.delete('/connections/google');
  },

  // Calendar
  async getCalendarEvents() {
    const { data } = await client.get('/calendar/events');
    return data;
  },

  async getCalendarConflicts() {
    const { data } = await client.get('/calendar/conflicts');
    return data;
  },
};

export default api;
