/**
 * Types for the AI Procurement Assistant chat.
 */

export interface AIChatMessage {
  role: 'user' | 'assistant' | 'tool';
  content: string | null;
  timestamp?: string;
  tool_calls?: AIToolCall[];
  tool_call_id?: string;
  name?: string;
}

export interface AIToolCall {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string;
  };
}

export interface AIConversation {
  id: string;
  title: string;
  messages: AIChatMessage[];
  metadata?: {
    messageCount?: number;
    lastToolsUsed?: string[];
    categories?: string[];
  };
  createdAt: string;
  updatedAt: string;
}

export interface AIConversationListItem {
  id: string;
  title: string;
  updatedAt: string;
  messages?: AIChatMessage[];
  metadata?: {
    messageCount?: number;
  };
}

export interface AIChatResponse {
  conversation_id: string;
  response: string;
  tools_used: string[];
  model: string;
  latency_ms: number;
  error?: string;
}

export interface AIHealthStatus {
  status: 'ok' | 'degraded';
  groq_configured: boolean;
  primary_model: string;
  fallback_model: string;
}
