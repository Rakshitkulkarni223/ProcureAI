/**
 * AI Chat API client — wraps /api/ai/* endpoints.
 */
import axios from 'axios';
import { tokenStore } from './api';
import type {
  AIChatResponse,
  AIConversation,
  AIConversationListItem,
  AIHealthStatus,
} from '../types_ai';

const AI_API = axios.create({
  baseURL: `${process.env.REACT_APP_BACKEND_URL}/api/ai`,
  headers: { 'Content-Type': 'application/json' },
});

// Attach auth token to every request
AI_API.interceptors.request.use((config) => {
  try {
    const token = tokenStore.get();
    if (token) config.headers.Authorization = `Bearer ${token}`;
  } catch {
    // ignore
  }
  return config;
});

function unwrap<T>(res: { data: { success: boolean; data: T } }): T {
  return res.data.data;
}

/** Send a chat message to the AI assistant. */
export async function sendChatMessage(
  message: string,
  conversationId?: string,
): Promise<AIChatResponse> {
  try {
    const res = await AI_API.post('/chat', {
      message,
      conversation_id: conversationId || undefined,
    });
    return unwrap(res);
  } catch (err: any) {
    const msg = err?.response?.data?.detail || err?.message || 'Chat request failed';
    throw new Error(msg);
  }
}

/** List recent conversations. */
export async function listConversations(limit = 20): Promise<AIConversationListItem[]> {
  try {
    const res = await AI_API.get('/conversations', { params: { limit } });
    return unwrap(res);
  } catch {
    return [];
  }
}

/** Get a full conversation with messages. */
export async function getConversation(id: string): Promise<AIConversation | null> {
  try {
    const res = await AI_API.get(`/conversations/${id}`);
    return unwrap(res);
  } catch {
    return null;
  }
}

/** Rename a conversation. */
export async function renameConversation(id: string, title: string): Promise<void> {
  try {
    await AI_API.patch(`/conversations/${id}`, { title });
  } catch {
    // ignore
  }
}

/** Delete a conversation. */
export async function deleteConversation(id: string): Promise<void> {
  try {
    await AI_API.delete(`/conversations/${id}`);
  } catch {
    // ignore
  }
}

/** Check AI health. */
export async function getAIHealth(): Promise<AIHealthStatus | null> {
  try {
    const res = await AI_API.get('/health');
    return unwrap(res);
  } catch {
    return null;
  }
}
