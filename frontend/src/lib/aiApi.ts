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

/** Send a chat message to the AI assistant (non-streaming fallback). */
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

/** SSE stream event callbacks. */
export interface StreamCallbacks {
  onConversationId?: (id: string) => void;
  onToken?: (text: string) => void;
  onToolStart?: (toolName: string) => void;
  onToolDone?: (toolName: string) => void;
  onThinking?: () => void;
  onDone?: (meta: { tools_used: string[]; model: string; latency_ms: number }) => void;
  onError?: (msg: string) => void;
}

/** Send a chat message via SSE streaming. */
export async function sendChatMessageStream(
  message: string,
  conversationId: string | undefined,
  callbacks: StreamCallbacks,
): Promise<void> {
  try {
    const token = tokenStore.get();
    const baseUrl = process.env.REACT_APP_BACKEND_URL || '';

    const resp = await fetch(`${baseUrl}/api/ai/chat/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        message,
        conversation_id: conversationId || undefined,
      }),
    });

    if (!resp.ok) {
      const errorText = await resp.text();
      throw new Error(errorText || `HTTP ${resp.status}`);
    }

    const reader = resp.body?.getReader();
    if (!reader) throw new Error('No readable stream');

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      // Process complete SSE lines
      const lines = buffer.split('\n\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith('data: ')) continue;

        try {
          const payload = JSON.parse(trimmed.slice(6));
          const { type, data } = payload;

          switch (type) {
            case 'conversation_id':
              callbacks.onConversationId?.(data);
              break;
            case 'token':
              callbacks.onToken?.(data);
              break;
            case 'tool_start':
              callbacks.onToolStart?.(data);
              break;
            case 'tool_done':
              callbacks.onToolDone?.(data);
              break;
            case 'thinking':
              callbacks.onThinking?.();
              break;
            case 'done':
              callbacks.onDone?.(data);
              break;
            case 'error':
              callbacks.onError?.(data);
              break;
          }
        } catch {
          // skip malformed events
        }
      }
    }
  } catch (err: any) {
    callbacks.onError?.(err?.message || 'Stream failed');
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
