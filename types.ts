// Shared types between mobile and backend

export type UserId = string;

export interface User {
  id: UserId;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  createdAt: string;
  preferences: UserPreferences;
}

export interface UserPreferences {
  timezone: string;
  briefingTime: string; // "07:30"
  tone: 'professional' | 'friendly' | 'concise';
  autoApproveLowRisk: boolean;
  notificationsEnabled: boolean;
}

export type MessageRole = 'user' | 'assistant' | 'system' | 'tool';

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  createdAt: string;
  toolCalls?: ToolCall[];
  toolResults?: ToolResult[];
  pendingApproval?: boolean;
}

export interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
}

export interface ToolResult {
  toolCallId: string;
  result: unknown;
  isError?: boolean;
}

export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'edited';

export interface ProposedAction {
  id: string;
  type: 'draft_email' | 'reschedule' | 'create_reminder' | 'cancel_subscription' | 'other';
  title: string;
  description: string;
  payload: Record<string, unknown>;
  riskLevel: 'low' | 'medium' | 'high';
  status: ApprovalStatus;
  createdAt: string;
  expiresAt?: string;
}

export interface DailyBriefing {
  id: string;
  date: string; // YYYY-MM-DD
  summary: string;
  sections: BriefingSection[];
  proposedActions: ProposedAction[];
  generatedAt: string;
}

export interface BriefingSection {
  title: string;
  items: BriefingItem[];
}

export interface BriefingItem {
  id: string;
  type: 'event' | 'task' | 'email' | 'alert' | 'insight';
  title: string;
  subtitle?: string;
  time?: string;
  priority: 'low' | 'medium' | 'high';
  actionable?: boolean;
  relatedActionId?: string;
}

export interface ConnectedAccount {
  provider: 'google' | 'microsoft' | 'apple';
  type: 'calendar' | 'email' | 'both';
  email: string;
  connectedAt: string;
  scopes: string[];
  status: 'active' | 'needs_reauth' | 'revoked';
}

export interface AgentActivity {
  id: string;
  type: 'briefing_generated' | 'action_proposed' | 'action_executed' | 'message' | 'error';
  summary: string;
  details?: Record<string, unknown>;
  createdAt: string;
}
