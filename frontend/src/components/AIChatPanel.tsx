import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  MessageSquare,
  X,
  Send,
  Bot,
  User,
  Loader2,
  Trash2,
  Plus,
  ChevronLeft,
  Wrench,
  Sparkles,
} from 'lucide-react';
import { cn } from '../lib/utils';
import {
  sendChatMessage,
  listConversations,
  getConversation,
  deleteConversation,
} from '../lib/aiApi';
import type { AIChatMessage, AIConversationListItem } from '../types_ai';

/** Lightweight markdown-to-React formatter — beautiful formatting, zero dependencies. */
function FormattedMessage({ content }: { content: string }) {
  try {
    const elements = useMemo(() => {
      try {
        const lines = content.split('\n');
        const result: React.ReactNode[] = [];
        let listItems: React.ReactNode[] = [];
        let listType: 'ul' | 'ol' | null = null;
        let tableRows: string[][] = [];
        let tableHeader: string[] = [];
        let key = 0;

        const flushList = () => {
          if (listItems.length > 0 && listType) {
            result.push(
              <div key={key++} className="my-2 ml-1 space-y-1.5">
                {listItems}
              </div>
            );
            listItems = [];
            listType = null;
          }
        };

        const flushTable = () => {
          if (tableHeader.length > 0 || tableRows.length > 0) {
            result.push(
              <div key={key++} className="my-2 overflow-x-auto rounded-lg border border-line">
                <table className="w-full text-xs">
                  {tableHeader.length > 0 && (
                    <thead>
                      <tr className="bg-accent/5 border-b border-line">
                        {tableHeader.map((h, i) => (
                          <th key={i} className="px-2.5 py-1.5 text-left font-semibold text-ink whitespace-nowrap">{h.trim()}</th>
                        ))}
                      </tr>
                    </thead>
                  )}
                  <tbody>
                    {tableRows.map((row, ri) => (
                      <tr key={ri} className={cn(ri % 2 === 0 ? 'bg-bg/50' : '', 'border-b border-line/50 last:border-0')}>
                        {row.map((cell, ci) => (
                          <td key={ci} className="px-2.5 py-1.5 text-ink-soft whitespace-nowrap">{formatInline(cell.trim())}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
            tableHeader = [];
            tableRows = [];
          }
        };

        const formatInline = (text: string): React.ReactNode[] => {
          try {
            const nodes: React.ReactNode[] = [];
            // Match **bold**, *italic*, `code`, ₹amounts
            const regex = /(\*\*(.+?)\*\*|\*(.+?)\*|`(.+?)`|(₹[\d,]+(?:\.\d{1,2})?))/g;
            let lastIndex = 0;
            let match;
            let i = 0;
            while ((match = regex.exec(text)) !== null) {
              if (match.index > lastIndex) {
                nodes.push(text.slice(lastIndex, match.index));
              }
              if (match[2]) {
                nodes.push(<strong key={`b${i}`} className="font-semibold text-ink">{match[2]}</strong>);
              } else if (match[3]) {
                nodes.push(<em key={`i${i}`} className="italic text-ink-soft">{match[3]}</em>);
              } else if (match[4]) {
                nodes.push(<code key={`c${i}`} className="bg-accent/8 text-accent px-1 py-0.5 rounded text-xs font-mono">{match[4]}</code>);
              } else if (match[5]) {
                nodes.push(<span key={`r${i}`} className="font-semibold text-accent">{match[5]}</span>);
              }
              lastIndex = regex.lastIndex;
              i++;
            }
            if (lastIndex < text.length) {
              nodes.push(text.slice(lastIndex));
            }
            return nodes;
          } catch {
            return [text];
          }
        };

        for (const line of lines) {
          const trimmed = line.trim();

          // Empty line — flush pending elements
          if (!trimmed) {
            flushList();
            flushTable();
            result.push(<div key={key++} className="h-1.5" />);
            continue;
          }

          // Horizontal rule
          if (/^[-—]{3,}$/.test(trimmed)) {
            flushList();
            flushTable();
            result.push(<hr key={key++} className="my-2 border-line/60" />);
            continue;
          }

          // Table row: | col1 | col2 |
          if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
            flushList();
            const cells = trimmed.slice(1, -1).split('|');
            // Skip separator rows like |---|---|
            if (cells.every(c => /^[\s:-]+$/.test(c))) continue;
            if (tableHeader.length === 0 && tableRows.length === 0) {
              tableHeader = cells;
            } else {
              tableRows.push(cells);
            }
            continue;
          } else {
            flushTable();
          }

          // Unordered list: - item, * item, • item
          const ulMatch = trimmed.match(/^[-*•]\s+(.+)$/);
          if (ulMatch) {
            flushTable();
            if (listType !== 'ul') flushList();
            listType = 'ul';
            listItems.push(
              <div key={key++} className="flex gap-2 items-start">
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-accent flex-shrink-0" />
                <span className="text-ink-soft leading-relaxed">{formatInline(ulMatch[1])}</span>
              </div>
            );
            continue;
          }

          // Ordered list: 1. item, 2) item
          const olMatch = trimmed.match(/^(\d+)[.)]\s+(.+)$/);
          if (olMatch) {
            flushTable();
            if (listType !== 'ol') flushList();
            listType = 'ol';
            listItems.push(
              <div key={key++} className="flex gap-2 items-start">
                <span className="text-accent font-semibold text-xs mt-0.5 w-4 flex-shrink-0 text-right">{olMatch[1]}.</span>
                <span className="text-ink-soft leading-relaxed">{formatInline(olMatch[2])}</span>
              </div>
            );
            continue;
          }

          // Not a list — flush
          flushList();

          // Heading: ### text
          if (trimmed.startsWith('### ')) {
            result.push(
              <div key={key++} className="mt-3 mb-1">
                <p className="font-semibold text-ink text-[13px]">{formatInline(trimmed.slice(4))}</p>
              </div>
            );
            continue;
          }
          // Heading: ## text
          if (trimmed.startsWith('## ')) {
            result.push(
              <div key={key++} className="mt-3 mb-1 pb-1 border-b border-line/40">
                <p className="font-bold text-ink text-sm">{formatInline(trimmed.slice(3))}</p>
              </div>
            );
            continue;
          }

          // Normal paragraph
          result.push(<p key={key++} className="my-0.5 text-ink-soft leading-relaxed">{formatInline(trimmed)}</p>);
        }

        flushList();
        flushTable();
        return result;
      } catch {
        return [<span key="fallback">{content}</span>];
      }
    }, [content]);

    return <div className="space-y-0.5 break-words overflow-hidden">{elements}</div>;
  } catch {
    return <div className="whitespace-pre-wrap">{content}</div>;
  }
}

/** Floating AI Chat Drawer — appears as a slide-out panel from the right. */
export function AIChatPanel() {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<'chat' | 'history'>('chat');

  // Chat state
  const [messages, setMessages] = useState<AIChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [toolsUsed, setToolsUsed] = useState<string[]>([]);
  const [error, setError] = useState('');

  // History state
  const [conversations, setConversations] = useState<AIConversationListItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    try {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
    } catch {
      // ignore
    }
  }, [messages, loading]);

  // Focus input when panel opens
  useEffect(() => {
    try {
      if (open && inputRef.current) {
        setTimeout(() => inputRef.current?.focus(), 200);
      }
    } catch {
      // ignore
    }
  }, [open]);

  const loadHistory = useCallback(async () => {
    try {
      setHistoryLoading(true);
      const convos = await listConversations(20);
      setConversations(convos);
    } catch {
      // ignore
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  const loadConversation = useCallback(async (id: string) => {
    try {
      const conv = await getConversation(id);
      if (conv) {
        setConversationId(conv.id);
        // Filter to only user and assistant text messages for display
        const displayMessages = conv.messages.filter(
          (m) => (m.role === 'user' || m.role === 'assistant') && m.content
        );
        setMessages(displayMessages);
        setView('chat');
      }
    } catch {
      // ignore
    }
  }, []);

  const startNewChat = useCallback(() => {
    try {
      setConversationId(null);
      setMessages([]);
      setToolsUsed([]);
      setError('');
      setView('chat');
    } catch {
      // ignore
    }
  }, []);

  const handleSend = useCallback(async () => {
    try {
      const text = input.trim();
      if (!text || loading) return;

      setInput('');
      setError('');
      setToolsUsed([]);

      // Add user message optimistically
      const userMsg: AIChatMessage = { role: 'user', content: text, timestamp: new Date().toISOString() };
      setMessages((prev) => [...prev, userMsg]);
      setLoading(true);

      try {
        const res = await sendChatMessage(text, conversationId || undefined);
        setConversationId(res.conversation_id);
        setToolsUsed(res.tools_used || []);

        const assistantMsg: AIChatMessage = {
          role: 'assistant',
          content: res.response,
          timestamp: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, assistantMsg]);
      } catch (err: any) {
        setError(err?.message || 'Failed to get response');
        // Add error as assistant message
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: `⚠ ${err?.message || 'Something went wrong. Please try again.'}` },
        ]);
      } finally {
        setLoading(false);
      }
    } catch {
      setLoading(false);
    }
  }, [input, loading, conversationId]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      try {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          handleSend();
        }
      } catch {
        // ignore
      }
    },
    [handleSend],
  );

  const handleDeleteConversation = useCallback(
    async (id: string, e: React.MouseEvent) => {
      try {
        e.stopPropagation();
        await deleteConversation(id);
        setConversations((prev) => prev.filter((c) => c.id !== id));
        if (conversationId === id) {
          startNewChat();
        }
      } catch {
        // ignore
      }
    },
    [conversationId, startNewChat],
  );

  // Render a single message
  const renderMessage = (msg: AIChatMessage, idx: number) => {
    try {
      const isUser = msg.role === 'user';
      return (
        <div key={idx} className={cn('flex gap-2 sm:gap-3 mb-4', isUser ? 'justify-end' : 'justify-start')}>
          {!isUser && (
            <div className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-accent/10 flex items-center justify-center">
              <Bot size={14} className="text-accent sm:w-4 sm:h-4" />
            </div>
          )}
          <div
            className={cn(
              'max-w-[85%] sm:max-w-[80%] rounded-xl px-3 py-2.5 sm:px-4 sm:py-3 text-sm leading-relaxed',
              isUser
                ? 'bg-accent text-white rounded-br-sm'
                : 'bg-bg text-ink border border-line rounded-bl-sm',
            )}
          >
            {isUser ? (
              <div className="whitespace-pre-wrap break-words">{msg.content}</div>
            ) : (
              <FormattedMessage content={msg.content ?? ''} />
            )}
          </div>
          {isUser && (
            <div className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-accent/20 flex items-center justify-center">
              <User size={14} className="text-accent sm:w-4 sm:h-4" />
            </div>
          )}
        </div>
      );
    } catch {
      return null;
    }
  };

  return (
    <>
      {/* Floating trigger button */}
      <button
        onClick={() => {
          setOpen(true);
          if (view === 'history') loadHistory();
        }}
        className={cn(
          'fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 flex items-center gap-2 rounded-full bg-accent',
          'px-3.5 py-3 sm:px-5 sm:py-3.5',
          'text-white shadow-lg hover:bg-accent/90 transition-all duration-200',
          'hover:shadow-xl hover:scale-105',
          open && 'hidden',
        )}
      >
        <Sparkles size={20} />
        <span className="font-semibold text-sm hidden sm:inline">Ask ProcureAI</span>
      </button>

      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-50 bg-ink/20 backdrop-blur-sm lg:bg-transparent lg:backdrop-blur-none"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Chat drawer */}
      <div
        className={cn(
          'fixed top-0 right-0 z-50 h-full w-full sm:max-w-md bg-surface border-l border-line shadow-2xl',
          'flex flex-col transition-transform duration-300 ease-in-out',
          open ? 'translate-x-0' : 'translate-x-full',
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-4 h-14 border-b border-line flex-shrink-0">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Bot size={20} className="text-accent flex-shrink-0" />
            <div className="min-w-0">
              <span className="font-display font-bold text-ink text-sm leading-tight block">ProcureAI Advisor</span>
              <span className="text-[10px] text-muted leading-tight block truncate">Compare suppliers · Optimize baskets · Explain recommendations</span>
            </div>
            {toolsUsed.length > 0 && (
              <span className="flex items-center gap-1 text-[10px] text-muted bg-bg px-1.5 py-0.5 rounded-full flex-shrink-0">
                <Wrench size={10} />
                {toolsUsed.length} tool{toolsUsed.length > 1 ? 's' : ''}
              </span>
            )}
          </div>
          <button
            onClick={() => {
              setView('history');
              loadHistory();
            }}
            className="p-2 rounded-md text-muted hover:bg-bg hover:text-ink transition-colors"
            title="Chat history"
          >
            <MessageSquare size={18} />
          </button>
          <button
            onClick={startNewChat}
            className="p-2 rounded-md text-muted hover:bg-bg hover:text-ink transition-colors"
            title="New chat"
          >
            <Plus size={18} />
          </button>
          <button
            onClick={() => setOpen(false)}
            className="p-2 rounded-md text-muted hover:bg-bg hover:text-ink transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        {view === 'chat' ? (
          <>
            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4">
              {messages.length === 0 && !loading && (
                <div className="flex flex-col items-center justify-center h-full text-center text-muted px-6">
                  <Sparkles size={40} className="text-accent/40 mb-4" />
                  <p className="font-bold text-ink mb-1 text-base">ProcureAI Advisor</p>
                  <p className="text-xs text-muted mb-1">Compare suppliers · Optimize baskets · Explain recommendations</p>
                  <p className="text-sm text-ink-soft mb-6">
                    Ask me anything about procurement — I'll fetch real data and explain the results.
                  </p>
                  <div className="space-y-2 w-full">
                    {[
                      'Compare laptop prices across suppliers',
                      'Optimize my grocery basket',
                      'How much have I saved this month?',
                      'Find the fastest delivery for office chairs',
                    ].map((q) => (
                      <button
                        key={q}
                        onClick={() => {
                          setInput(q);
                          setTimeout(() => inputRef.current?.focus(), 50);
                        }}
                        className="w-full text-left text-sm px-4 py-2.5 rounded-lg border border-line bg-bg hover:bg-accent/5 hover:border-accent/30 text-ink transition-colors"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {messages.map((msg, i) => renderMessage(msg, i))}
              {loading && (
                <div className="flex gap-3 mb-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center">
                    <Bot size={16} className="text-accent" />
                  </div>
                  <div className="bg-bg border border-line rounded-xl rounded-bl-sm px-4 py-3">
                    <div className="flex items-center gap-2 text-sm text-muted">
                      <Loader2 size={14} className="animate-spin" />
                      Thinking...
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Input area */}
            <div className="border-t border-line p-2.5 sm:p-3 flex-shrink-0 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
              {error && (
                <div className="text-xs text-danger mb-2 px-1">{error}</div>
              )}
              <div className="flex items-end gap-2">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask about procurement..."
                  rows={1}
                  className={cn(
                    'flex-1 resize-none rounded-xl border border-line bg-bg px-3 py-2.5 sm:px-4 sm:py-3 text-sm text-ink',
                    'placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-accent/30',
                    'max-h-32',
                  )}
                  style={{ minHeight: '44px' }}
                  disabled={loading}
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || loading}
                  className={cn(
                    'flex-shrink-0 rounded-xl p-3 transition-all',
                    input.trim() && !loading
                      ? 'bg-accent text-white hover:bg-accent/90'
                      : 'bg-bg text-muted cursor-not-allowed',
                  )}
                >
                  {loading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                </button>
              </div>
              <div className="text-center mt-2">
                <span className="text-[10px] text-muted/50">Powered by Groq · AI responses may be approximate</span>
              </div>
            </div>
          </>
        ) : (
          /* Conversation history view */
          <div className="flex-1 overflow-y-auto">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-line">
              <button
                onClick={() => setView('chat')}
                className="p-1.5 rounded-md text-muted hover:bg-bg hover:text-ink"
              >
                <ChevronLeft size={18} />
              </button>
              <span className="font-semibold text-sm text-ink">Conversations</span>
            </div>
            {historyLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 size={20} className="animate-spin text-muted" />
              </div>
            ) : conversations.length === 0 ? (
              <div className="text-center py-12 text-sm text-muted">No conversations yet</div>
            ) : (
              <div className="divide-y divide-line">
                {conversations.map((c) => (
                  <div
                    key={c.id}
                    onClick={() => loadConversation(c.id)}
                    className={cn(
                      'flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-bg transition-colors',
                      conversationId === c.id && 'bg-accent/5',
                    )}
                  >
                    <MessageSquare size={16} className="text-muted flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-ink truncate">{c.title}</div>
                      <div className="text-xs text-muted">
                        {new Date(c.updatedAt).toLocaleDateString()}
                        {c.metadata?.messageCount ? ` · ${c.metadata.messageCount} messages` : ''}
                      </div>
                    </div>
                    <button
                      onClick={(e) => handleDeleteConversation(c.id, e)}
                      className="p-1.5 rounded-md text-muted hover:text-danger hover:bg-danger/10 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
