'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { useToast } from '@/components/ToastContext';
import {
  Bot,
  Plus,
  Send,
  Trash2,
  Edit2,
  Check,
  X,
  RefreshCw,
  Sparkles,
  Settings,
  MessageSquare,
  Search,
  CheckSquare,
  Calendar,
  Flame,
  StickyNote,
  Clock,
  ChevronRight,
  Zap,
  ShieldCheck,
} from 'lucide-react';
import { MarkdownRenderer } from '@/components/MarkdownRenderer';
import { ToolExecutionBanner } from '@/components/ToolExecutionBanner';
import { ToolApprovalCard, PendingToolApproval } from '@/components/ToolApprovalCard';

import { NeoSelect } from '@/components/NeoSelect';

interface SessionItem {
  id: string;
  title: string;
  provider: string;
  model: string;
  created_at: string;
  updated_at: string;
}

interface MessageItem {
  id?: string;
  role: 'user' | 'assistant' | 'tool';
  content: string;
  tool_calls?: any;
  tool_executions?: any[];
  pending_approvals?: PendingToolApproval[];
  created_at?: string;
}

function AIPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedSessionId = searchParams.get('session');
  const { showToast } = useToast();
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(requestedSessionId || null);
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [approvalMode, setApprovalMode] = useState<boolean>(true);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Per-chat provider & model override
  const [activeChatProvider, setActiveChatProvider] = useState<'gemini' | 'openai' | 'ollama_cloud' | 'custom'>('gemini');
  const [activeChatModel, setActiveChatModel] = useState<string>('gemini-2.0-flash');

  // Custom Model entry state
  const [customModelModalOpen, setCustomModelModalOpen] = useState(false);
  const [customModelInput, setCustomModelInput] = useState('');

  // Renaming state
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Load provider config from localStorage
  const [providerConfig, setProviderConfig] = useState<any>(null);

  const DEFAULT_ENDPOINTS: Record<string, string> = {
    gemini: 'https://generativelanguage.googleapis.com/v1beta/openai',
    openai: 'https://api.openai.com/v1',
    ollama_cloud: 'https://ollama.com/v1',
    custom: 'http://localhost:11434/v1',
  };

  const PRESET_FALLBACKS: Record<string, { value: string; label: string; icon?: string }[]> = {
    gemini: [
      { value: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash', icon: '⚡' },
      { value: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro', icon: '🧠' },
      { value: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash', icon: '✨' },
    ],
    openai: [
      { value: 'gpt-4o', label: 'GPT-4o', icon: '🌟' },
      { value: 'gpt-4o-mini', label: 'GPT-4o Mini', icon: '⚡' },
      { value: 'gpt-4-turbo', label: 'GPT-4 Turbo', icon: '🏎️' },
    ],
    ollama_cloud: [
      { value: 'qwen2.5:latest', label: 'Qwen 2.5', icon: '🦙' },
      { value: 'llama3.3:latest', label: 'Llama 3.3', icon: '🦙' },
      { value: 'deepseek-r1:latest', label: 'DeepSeek R1', icon: '🦙' },
    ],
    custom: [
      { value: 'default', label: 'Default / Endpoint Model', icon: '⚙️' },
    ],
  };

  const [liveModelsMap, setLiveModelsMap] = useState<Record<string, { value: string; label: string; icon?: string }[]>>({});
  const [fetchingChatModels, setFetchingChatModels] = useState(false);

  async function fetchLiveModels(targetProvider?: string, passedConfig?: any) {
    const prov = targetProvider || activeChatProvider;
    const cfg = passedConfig || providerConfig;
    const provObj = cfg?.providers?.[prov] || {};
    const apiKey = provObj.apiKey || (cfg?.provider === prov ? cfg.apiKey : '');
    const endpoint = provObj.endpointUrl || (cfg?.provider === prov ? cfg.endpointUrl : '') || DEFAULT_ENDPOINTS[prov] || '';

    setFetchingChatModels(true);
    try {
      const res = await apiFetch('/ai/models', {
        method: 'POST',
        body: JSON.stringify({
          providerConfig: {
            provider: prov,
            apiKey: (apiKey || '').trim(),
            endpointUrl: (endpoint || '').trim(),
          },
        }),
      });

      if (res.models && res.models.length > 0) {
        const getIcon = (p: string) => {
          if (p === 'gemini') return '✨';
          if (p === 'openai') return '🌟';
          if (p === 'ollama_cloud') return '🦙';
          return '⚙️';
        };

        const formatted = res.models.map((m: any) => ({
          value: m.id,
          label: m.name || m.id,
          icon: getIcon(prov),
        }));

        setLiveModelsMap((prev) => ({
          ...prev,
          [prov]: formatted,
        }));

        // If current activeChatModel is empty or not in the fetched list, select first model or keep saved
        if (prov === activeChatProvider) {
          const savedModel = provObj.modelName;
          if (savedModel && formatted.some((m: any) => m.value === savedModel)) {
            setActiveChatModel(savedModel);
          } else if (!activeChatModel || !formatted.some((m: any) => m.value === activeChatModel)) {
            setActiveChatModel(formatted[0].value);
          }
        }
      }
    } catch (err: any) {
      // Keep fallbacks
    } finally {
      setFetchingChatModels(false);
    }
  }

  function handleAddCustomChatModel(e: React.FormEvent) {
    e.preventDefault();
    if (!customModelInput.trim()) {
      showToast('Please enter a custom model name or ID.', 'error');
      return;
    }
    const newModelId = customModelInput.trim();
    const currentProv = activeChatProvider;

    const newOption = {
      value: newModelId,
      label: `${newModelId} (Custom)`,
      icon: '⚙️',
    };

    setLiveModelsMap((prev) => {
      const existing = prev[currentProv] || PRESET_FALLBACKS[currentProv] || [];
      const filtered = existing.filter((m) => m.value !== newModelId);
      return {
        ...prev,
        [currentProv]: [newOption, ...filtered],
      };
    });

    try {
      const raw = localStorage.getItem('sb_ai_provider_config') || localStorage.getItem('ai_provider_config');
      const cfg = raw ? JSON.parse(raw) : { provider: currentProv, providers: {} };
      if (!cfg.providers) cfg.providers = {};
      if (!cfg.providers[currentProv]) cfg.providers[currentProv] = {};

      const prevAvailable = cfg.providers[currentProv].availableModels || PRESET_FALLBACKS[currentProv] || [];
      const updatedModels = [newOption, ...prevAvailable.filter((m: any) => m.value !== newModelId)];
      cfg.providers[currentProv].availableModels = updatedModels;
      cfg.providers[currentProv].modelName = newModelId;

      localStorage.setItem('sb_ai_provider_config', JSON.stringify(cfg));
      localStorage.setItem('ai_provider_config', JSON.stringify(cfg));
      setProviderConfig(cfg);
    } catch (err) {
      console.error('Failed to save custom model to localStorage:', err);
    }

    setActiveChatModel(newModelId);
    setCustomModelInput('');
    setCustomModelModalOpen(false);
    showToast(`Custom model "${newModelId}" added and selected! 🚀`, 'success');
  }

  useEffect(() => {
    function loadConfig() {
      try {
        const savedApproval = localStorage.getItem('ai_approval_mode');
        if (savedApproval !== null) {
          setApprovalMode(savedApproval === 'true');
        }

        const saved = localStorage.getItem('ai_provider_config');
        if (saved) {
          const parsed = JSON.parse(saved);
          setProviderConfig(parsed);
          const defProv = (parsed.defaultProvider || parsed.provider || 'gemini') as any;
          setActiveChatProvider(defProv);
          const provObj = parsed.providers?.[defProv];
          const defModel = provObj?.modelName || (parsed.provider === defProv ? parsed.modelName : '') || provObj?.availableModels?.[0]?.value || PRESET_FALLBACKS[defProv]?.[0]?.value || '';
          if (defModel) {
            setActiveChatModel(defModel);
          } else if (PRESET_FALLBACKS[defProv]?.[0]?.value) {
            setActiveChatModel(PRESET_FALLBACKS[defProv][0].value);
          }
          // Fetch live models from endpoint for the default provider
          fetchLiveModels(defProv, parsed);
        }
      } catch (e) {
        // default
      }
    }
    loadConfig();
    window.addEventListener('ai-config-updated', loadConfig);
    return () => window.removeEventListener('ai-config-updated', loadConfig);
  }, []);

  // Ensure activeChatModel always has a valid fallback if empty
  useEffect(() => {
    if (!activeChatModel) {
      const liveList = liveModelsMap[activeChatProvider];
      const provObj = providerConfig?.providers?.[activeChatProvider];
      const fallback = liveList?.[0]?.value || provObj?.modelName || provObj?.availableModels?.[0]?.value || PRESET_FALLBACKS[activeChatProvider]?.[0]?.value || '';
      if (fallback) setActiveChatModel(fallback);
    }
  }, [activeChatProvider, activeChatModel, providerConfig, liveModelsMap]);

  function handleProviderChange(newProv: 'gemini' | 'openai' | 'ollama_cloud' | 'custom') {
    setActiveChatProvider(newProv);
    const liveList = liveModelsMap[newProv];
    const provObj = providerConfig?.providers?.[newProv];
    const newModel = liveList?.[0]?.value || provObj?.modelName || provObj?.availableModels?.[0]?.value || PRESET_FALLBACKS[newProv]?.[0]?.value || '';
    if (newModel) {
      setActiveChatModel(newModel);
    }
    // Fetch live models from endpoint for newly selected provider
    fetchLiveModels(newProv);
  }

  // Load all sessions
  useEffect(() => {
    async function fetchSessions() {
      setSessionsLoading(true);
      try {
        const res = await apiFetch('/ai/sessions');
        const list: SessionItem[] = res.sessions || [];
        setSessions(list);

        if (requestedSessionId && list.some((s) => s.id === requestedSessionId)) {
          setCurrentSessionId(requestedSessionId);
        } else if (list.length > 0 && !currentSessionId) {
          setCurrentSessionId(list[0].id);
        } else if (list.length === 0) {
          handleNewChat();
        }
      } catch (err) {
        // demo fallback
      } finally {
        setSessionsLoading(false);
      }
    }
    fetchSessions();
  }, [requestedSessionId]);

  // Load messages whenever currentSessionId changes
  useEffect(() => {
    if (!currentSessionId) return;

    async function fetchMessages() {
      try {
        const res = await apiFetch(`/ai/sessions/${currentSessionId}/messages`);
        setMessages(res.messages || []);
      } catch (err) {
        setMessages([]);
      }
    }
    fetchMessages();
  }, [currentSessionId]);

  // Auto scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  async function handleNewChat() {
    if (messages.length === 0 && currentSessionId) {
      return;
    }

    try {
      const newSess = await apiFetch('/ai/sessions', {
        method: 'POST',
        body: JSON.stringify({
          title: 'New Chat',
          provider: activeChatProvider,
          model: activeChatModel,
        }),
      });
      setSessions((prev) => [newSess, ...prev]);
      setCurrentSessionId(newSess.id);
      setMessages([]);
    } catch (err: any) {
      showToast(err?.message || 'Failed to create new chat', 'error');
    }
  }

  async function handleDeleteSession(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    try {
      await apiFetch(`/ai/sessions/${id}`, { method: 'DELETE' });
      const remaining = sessions.filter((s) => s.id !== id);
      setSessions(remaining);
      if (currentSessionId === id) {
        if (remaining.length > 0) {
          setCurrentSessionId(remaining[0].id);
        } else {
          handleNewChat();
        }
      }
      showToast('Chat deleted', 'info');
    } catch (err: any) {
      showToast(err?.message || 'Failed to delete chat', 'error');
    }
  }

  async function handleSaveRename(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    if (!editingTitle.trim()) return;

    try {
      await apiFetch(`/ai/sessions/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ title: editingTitle.trim() }),
      });
      setSessions((prev) =>
        prev.map((s) => (s.id === id ? { ...s, title: editingTitle.trim() } : s))
      );
      setEditingSessionId(null);
      showToast('Chat renamed', 'success');
    } catch (err: any) {
      showToast(err?.message || 'Failed to rename chat', 'error');
    }
  }

  async function handleSendMessage(textOverride?: string) {
    const textToSend = (textOverride || input).trim();
    if (!textToSend || loading) return;

    let activeSessionId = currentSessionId;
    if (!activeSessionId) {
      try {
        const newSess = await apiFetch('/ai/sessions', {
          method: 'POST',
          body: JSON.stringify({
            title: textToSend.slice(0, 30) || 'New Chat',
            provider: activeChatProvider,
            model: activeChatModel,
          }),
        });
        setSessions((prev) => [newSess, ...prev]);
        setCurrentSessionId(newSess.id);
        activeSessionId = newSess.id;
      } catch (e) {
        // fallback
      }
    }

    const userMsg: MessageItem = {
      role: 'user',
      content: textToSend,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    // Get specific provider settings
    const provSettings = providerConfig?.providers?.[activeChatProvider] || {};
    const effectiveApiKey = provSettings.apiKey || (providerConfig?.provider === activeChatProvider ? providerConfig.apiKey : '');
    const effectiveEndpoint = provSettings.endpointUrl || (providerConfig?.provider === activeChatProvider ? providerConfig.endpointUrl : '');
    const effectiveModel = activeChatModel || provSettings.modelName || 'gemini-2.0-flash';

    const payloadProviderConfig = {
      provider: activeChatProvider,
      apiKey: effectiveApiKey?.trim() || '',
      endpointUrl: effectiveEndpoint?.trim() || '',
      modelName: effectiveModel,
    };

    try {
      const res = await apiFetch('/ai/chat', {
        method: 'POST',
        body: JSON.stringify({
          sessionId: activeSessionId,
          approvalMode,
          messages: [...messages, userMsg].map((m) => ({
            role: m.role,
            content: m.content,
          })),
          providerConfig: payloadProviderConfig,
        }),
      });

      const assistantMsg: MessageItem = {
        role: 'assistant',
        content: res.reply || 'Action executed.',
        tool_calls: res.tool_calls,
        tool_executions: res.tool_executions,
        pending_approvals: res.pending_approvals,
        created_at: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, assistantMsg]);

      // If tools were executed immediately, trigger global data refresh
      if (res.tool_executions && res.tool_executions.length > 0) {
        window.dispatchEvent(new Event('sb-data-updated'));
      }

      // Auto rename session if it was default "New Chat"
      const current = sessions.find((s) => s.id === currentSessionId);
      if (current && current.title === 'New Chat') {
        const autoTitle = textToSend.slice(0, 30) + (textToSend.length > 30 ? '...' : '');
        apiFetch(`/ai/sessions/${currentSessionId}`, {
          method: 'PATCH',
          body: JSON.stringify({ title: autoTitle }),
        }).then(() => {
          setSessions((prev) =>
            prev.map((s) => (s.id === currentSessionId ? { ...s, title: autoTitle } : s))
          );
        });
      }
    } catch (err: any) {
      showToast(err?.message || 'AI request failed', 'error');
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `⚠️ Error: ${err?.message || 'Could not reach AI provider. Check your API configuration in Settings.'}`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  async function handleApproveAction(item: PendingToolApproval, msgIndex: number) {
    try {
      const res = await apiFetch('/ai/execute-tool', {
        method: 'POST',
        body: JSON.stringify({
          name: item.tool,
          args: item.args,
          sessionId: currentSessionId,
          approvalId: item.id,
        }),
      });

      setMessages((prev) =>
        prev.map((m, idx) => {
          if (idx !== msgIndex || !m.pending_approvals) return m;
          return {
            ...m,
            pending_approvals: m.pending_approvals.map((p) =>
              p.id === item.id ? { ...p, status: 'approved', result: res.result } : p
            ),
            tool_executions: [
              ...(m.tool_executions || []),
              { tool: item.tool, args: item.args, result: res.result },
            ],
          };
        })
      );

      window.dispatchEvent(new Event('sb-data-updated'));
      showToast(res.result?.message || `Action ${item.tool} approved and executed!`, 'success');
    } catch (err: any) {
      showToast(err?.message || 'Failed to execute approved action', 'error');
    }
  }

  async function handleRejectAction(approvalId: string, msgIndex: number) {
    try {
      if (currentSessionId) {
        await apiFetch('/ai/execute-tool/reject', {
          method: 'POST',
          body: JSON.stringify({
            sessionId: currentSessionId,
            approvalId,
          }),
        });
      }
    } catch (e: any) {
      console.error('Failed to record rejection:', e);
    }

    setMessages((prev) =>
      prev.map((m, idx) => {
        if (idx !== msgIndex || !m.pending_approvals) return m;
        return {
          ...m,
          pending_approvals: m.pending_approvals.map((p) =>
            p.id === approvalId ? { ...p, status: 'rejected' } : p
          ),
        };
      })
    );
    showToast('Action cancelled', 'info');
  }

  const filteredSessions = sessions.filter((s) =>
    s.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const currentSession = sessions.find((s) => s.id === currentSessionId);

  return (
    <div className="h-[calc(100vh-6.5rem)] flex gap-4 overflow-hidden">
      {/* Sessions Left Sidebar */}
      <div className="w-64 lg:w-72 bg-[var(--sb-surface)] border-2 border-[var(--sb-border)] rounded-xl flex flex-col shadow-[4px_4px_0px_var(--sb-shadow-color)] shrink-0 hidden md:flex">
        {/* New Chat Button Header */}
        <div className="p-3 border-b-2 border-[var(--sb-border)]">
          <button
            type="button"
            onClick={handleNewChat}
            className="w-full neo-btn neo-btn-primary text-xs py-2 px-3 shadow-[2px_2px_0px_var(--sb-shadow-color)] flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>New Chat</span>
          </button>

          {/* Search bar */}
          <div className="mt-2.5 relative flex items-center">
            <Search className="w-3.5 h-3.5 text-[var(--sb-muted)] absolute left-2.5 pointer-events-none z-10" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search chat history..."
              className="neo-input text-xs has-icon-left !py-1.5 w-full !pl-8"
            />
          </div>
        </div>

        {/* Sessions List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {sessionsLoading ? (
            <div className="space-y-2 p-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="neo-skeleton h-10 w-full rounded-md" />
              ))}
            </div>
          ) : filteredSessions.length === 0 ? (
            <div className="p-4 text-center text-xs font-bold text-[var(--sb-muted)]">
              No chat history found.
            </div>
          ) : (
            filteredSessions.map((s) => {
              const isSelected = s.id === currentSessionId;
              const isEditing = editingSessionId === s.id;

              return (
                <div
                  key={s.id}
                  onClick={() => setCurrentSessionId(s.id)}
                  className={`group p-2.5 rounded-lg border-2 text-xs font-bold flex items-center justify-between cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-[var(--sb-primary)] text-[var(--sb-primary-ink)] border-[var(--sb-border)] shadow-[2px_2px_0px_var(--sb-shadow-color)]'
                      : 'bg-[var(--sb-surface-alt)] text-[var(--sb-ink)] border-transparent hover:border-[var(--sb-border)]'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <MessageSquare className="w-3.5 h-3.5 shrink-0 opacity-80" />
                    {isEditing ? (
                      <input
                        type="text"
                        value={editingTitle}
                        onChange={(e) => setEditingTitle(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        className="bg-white text-black text-xs px-1 py-0.5 rounded border border-black w-full"
                        autoFocus
                      />
                    ) : (
                      <span className="truncate">{s.title}</span>
                    )}
                  </div>

                  {/* Edit / Delete actions */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {isEditing ? (
                      <>
                        <button
                          type="button"
                          onClick={(e) => handleSaveRename(s.id, e)}
                          className="p-1 hover:text-[var(--sb-ok)]"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingSessionId(null);
                          }}
                          className="p-1 hover:text-[var(--sb-alert)]"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingSessionId(s.id);
                            setEditingTitle(s.title);
                          }}
                          className="p-1 hover:opacity-80"
                          title="Rename Chat"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleDeleteSession(s.id, e)}
                          className="p-1 hover:text-[var(--sb-alert)]"
                          title="Delete Chat"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Main Chat Canvas */}
      <div className="flex-1 bg-[var(--sb-surface)] border-2 border-[var(--sb-border)] rounded-xl flex flex-col shadow-[4px_4px_0px_var(--sb-shadow-color)] overflow-hidden">
        {/* Top Chat Bar */}
        <div className="px-4 py-3 border-b-2 border-[var(--sb-border)] flex flex-wrap items-center justify-between gap-3 bg-[var(--sb-surface-alt)]">
          {/* Left: Bot Status & Session Info */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-lg bg-[var(--sb-primary)] text-[var(--sb-primary-ink)] border-2 border-[var(--sb-border)] flex items-center justify-center font-black shadow-[2px_2px_0px_var(--sb-shadow-color)] shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-black text-[var(--sb-ink)] leading-none truncate max-w-[140px] sm:max-w-[200px] md:max-w-[260px]">
                  {currentSession?.title || 'Personal Assistant'}
                </h2>
                <span className="neo-badge bg-[var(--sb-accent-orange)] text-[#121212] text-[9px] font-black py-0.5 px-1.5 shrink-0 border border-[var(--sb-border)]">
                  BETA
                </span>
                {activeChatProvider === (providerConfig?.defaultProvider || 'gemini') && (
                  <span className="neo-badge bg-[var(--sb-primary)] text-[var(--sb-primary-ink)] text-[9px] py-0.5 px-1.5 hidden lg:inline-flex items-center gap-0.5">
                    ★ Default
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-[var(--sb-ok)] bg-[var(--sb-surface)] px-1.5 py-0.5 rounded border border-[var(--sb-border)]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--sb-ok)] animate-pulse" />
                  Tools Active
                </span>
                {!(providerConfig?.providers?.[activeChatProvider]?.apiKey || (providerConfig?.provider === activeChatProvider && providerConfig?.apiKey)) && activeChatProvider !== 'custom' && (
                  <span className="text-[10px] text-[var(--sb-alert)] font-bold hidden xl:inline">
                    ⚠️ Missing API Key
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Right: Controls (Provider, Model, Approval Mode, Settings) */}
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            {/* Provider Switcher */}
            <div className="w-36 sm:w-40">
              <NeoSelect
                value={activeChatProvider}
                onChange={(val) => handleProviderChange(val as any)}
                options={[
                  { value: 'gemini', label: 'Gemini', icon: '✨' },
                  { value: 'openai', label: 'OpenAI', icon: '🌟' },
                  { value: 'ollama_cloud', label: 'Ollama Cloud', icon: '🦙' },
                  { value: 'custom', label: 'Custom', icon: '⚙️' },
                ]}
                className="text-xs"
              />
            </div>

            {/* Model Switcher & Live Fetch Button */}
            <div className="flex items-center gap-1.5">
              <div className="w-44 sm:w-52 md:w-56">
                {(() => {
                  const liveList = liveModelsMap[activeChatProvider];
                  const savedList = providerConfig?.providers?.[activeChatProvider]?.availableModels;
                  const available = (liveList && liveList.length > 0) ? liveList : savedList;

                  let modelOptions: { value: string; label: string; icon?: string }[] =
                    available && available.length > 0
                      ? [...available]
                      : (PRESET_FALLBACKS[activeChatProvider] || [{ value: 'default', label: 'Default Model' }]);

                  if (activeChatModel && !modelOptions.some((o: any) => o.value === activeChatModel)) {
                    modelOptions = [{ value: activeChatModel, label: `${activeChatModel} (Custom)`, icon: '⚙️' }, ...modelOptions];
                  }

                  const fullOptions = [
                    ...modelOptions,
                    { value: '__add_custom_modal__', label: '+ Add Custom Model...', icon: '➕' },
                  ];

                  return (
                    <NeoSelect
                      value={activeChatModel}
                      onChange={(val) => {
                        if (val === '__add_custom_modal__') {
                          setCustomModelModalOpen(true);
                        } else {
                          setActiveChatModel(val);
                        }
                      }}
                      options={fullOptions}
                      searchable={true}
                      placeholder={fetchingChatModels ? 'Fetching models...' : 'Select Model'}
                      className="text-xs"
                    />
                  );
                })()}
              </div>

              <button
                type="button"
                onClick={() => setCustomModelModalOpen(true)}
                className="neo-btn neo-btn-outline p-2 shrink-0 h-[38px] flex items-center justify-center shadow-[2px_2px_0px_var(--sb-shadow-color)]"
                title="Add Custom Model ID (Fine-tune, new release, etc.)"
              >
                <Plus className="w-3.5 h-3.5 text-[var(--sb-ink)]" />
              </button>

              <button
                type="button"
                onClick={() => fetchLiveModels(activeChatProvider)}
                disabled={fetchingChatModels}
                className="neo-btn neo-btn-outline p-2 shrink-0 h-[38px] flex items-center justify-center shadow-[2px_2px_0px_var(--sb-shadow-color)]"
                title="Fetch live models from provider endpoint"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${fetchingChatModels ? 'animate-spin text-[var(--sb-primary)]' : ''}`} />
              </button>
            </div>

            {/* Approval Mode Switcher */}
            <button
              type="button"
              onClick={() => {
                const next = !approvalMode;
                setApprovalMode(next);
                localStorage.setItem('ai_approval_mode', String(next));
                showToast(
                  next
                    ? '🔒 Ask Approval: Modifying actions will request your confirmation'
                    : '⚡ Auto-Approve: Actions execute immediately',
                  'info'
                );
              }}
              className={`neo-btn text-xs py-1.5 px-3 flex items-center gap-1.5 h-[38px] transition-all shrink-0 shadow-[2px_2px_0px_var(--sb-shadow-color)] ${
                approvalMode
                  ? 'bg-[var(--sb-accent-orange)] text-[#121212] font-black border-2 border-[var(--sb-border)]'
                  : 'bg-[var(--sb-surface)] text-[var(--sb-ink)] font-bold border-2 border-[var(--sb-border)]'
              }`}
              title={
                approvalMode
                  ? 'Ask for confirmation before editing/deleting/creating records'
                  : 'Automatically execute actions in real time'
              }
            >
              {approvalMode ? (
                <>
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">Ask Approval</span>
                </>
              ) : (
                <>
                  <Zap className="w-3.5 h-3.5 text-[var(--sb-primary)]" />
                  <span className="hidden md:inline">Auto-Approve</span>
                </>
              )}
            </button>

            {/* Settings Shortcut Button */}
            <button
              type="button"
              onClick={() => router.push('/settings')}
              className="neo-btn neo-btn-outline text-xs p-2 sm:px-2.5 flex items-center gap-1.5 shrink-0 h-[38px] shadow-[2px_2px_0px_var(--sb-shadow-color)]"
              title="Configure AI Models & API Keys in Settings"
            >
              <Settings className="w-3.5 h-3.5" />
              <span className="hidden lg:inline">Settings</span>
            </button>
          </div>
        </div>

        {/* Message Stream */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col justify-center items-center text-center max-w-lg mx-auto py-12">
              <div className="w-16 h-16 rounded-2xl bg-[var(--sb-primary)] text-[var(--sb-primary-ink)] border-2 border-[var(--sb-border)] flex items-center justify-center mb-4 shadow-[4px_4px_0px_var(--sb-shadow-color)]">
                <Sparkles className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-black text-[var(--sb-ink)] tracking-tight">
                How can I assist your Second Brain today?
              </h3>
              <p className="text-xs text-[var(--sb-muted)] font-medium mt-1.5 leading-relaxed max-w-md">
                I am your intelligent personal assistant. I have live access to your tasks, notes, habits, calendar, and reminders, and can execute actions on your command.
              </p>
            </div>
          ) : (
            messages.map((msg, idx) => (
              <div
                key={msg.id || idx}
                className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-lg bg-[var(--sb-primary)] text-[var(--sb-primary-ink)] border-2 border-[var(--sb-border)] flex items-center justify-center font-black shrink-0 shadow-[1px_1px_0px_var(--sb-shadow-color)] mt-0.5">
                    <Sparkles className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`max-w-[80%] rounded-xl p-4 text-xs leading-relaxed border-2 border-[var(--sb-border)] ${
                    msg.role === 'user'
                      ? 'bg-[var(--sb-primary)] text-[var(--sb-primary-ink)] font-bold shadow-[3px_3px_0px_var(--sb-shadow-color)]'
                      : 'bg-[var(--sb-surface-alt)] text-[var(--sb-ink)] shadow-[3px_3px_0px_var(--sb-shadow-color)] font-normal'
                  }`}
                >
                  {/* Tool Execution Status above assistant response */}
                  {msg.role === 'assistant' && (
                    <ToolExecutionBanner
                      executions={msg.tool_executions}
                      rawCalls={msg.tool_calls}
                    />
                  )}

                  {/* Pending Tool Approvals (Interactive Human-In-The-Loop) */}
                  {msg.role === 'assistant' && msg.pending_approvals && msg.pending_approvals.length > 0 && (
                    <ToolApprovalCard
                      approvals={msg.pending_approvals}
                      onApprove={(item) => handleApproveAction(item, idx)}
                      onReject={(approvalId) => handleRejectAction(approvalId, idx)}
                    />
                  )}

                  {msg.role === 'user' ? (
                    <div className="whitespace-pre-wrap font-sans text-xs">{msg.content}</div>
                  ) : (
                    <MarkdownRenderer content={msg.content} />
                  )}
                </div>
              </div>
            ))
          )}

          {loading && (
            <div className="flex gap-3 justify-start">
              <div className="w-8 h-8 rounded-lg bg-[var(--sb-primary)] text-[var(--sb-primary-ink)] border-2 border-[var(--sb-border)] flex items-center justify-center font-black shrink-0">
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="neo-box p-3 bg-[var(--sb-surface-alt)] border-2 border-[var(--sb-border)] text-xs font-bold text-[var(--sb-muted)] flex items-center gap-2">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-[var(--sb-primary)]" />
                <span>⚡ Assistant is executing tools & generating response...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-3 md:p-4 border-t-2 border-[var(--sb-border)] bg-[var(--sb-surface)]">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-end gap-2.5 max-w-4xl mx-auto"
          >
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder="Ask a question or command an action (Enter to send, Shift+Enter for new line)..."
              rows={2}
              className="neo-input text-xs resize-none flex-1 py-2 px-3"
              disabled={loading}
              autoFocus
            />

            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="neo-btn neo-btn-primary p-3 shrink-0 shadow-[2px_2px_0px_var(--sb-shadow-color)] disabled:opacity-50 h-[46px]"
              title="Send Message"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>

      {/* Add Custom Model Modal */}
      {customModelModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="neo-box w-full max-w-md bg-[var(--sb-surface)] p-6 relative animate-scale-up shadow-[8px_8px_0px_var(--sb-shadow-color)]">
            <h2 className="text-lg font-black text-[var(--sb-ink)] mb-1 flex items-center gap-2">
              <Plus className="w-5 h-5 text-[var(--sb-primary)]" />
              Add Custom AI Model
            </h2>
            <p className="text-xs text-[var(--sb-muted)] mb-4">
              Enter any custom, fine-tuned, or newly released model identifier for <strong>{activeChatProvider.replace('_', ' ').toUpperCase()}</strong>.
            </p>

            <form onSubmit={handleAddCustomChatModel} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1">
                  Model Identifier / ID
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={customModelInput}
                  onChange={(e) => setCustomModelInput(e.target.value)}
                  placeholder="e.g. deepseek-ai/deepseek-r1, llama-3.3-70b-instruct, gpt-4.5-preview"
                  className="neo-input text-xs font-mono"
                />
              </div>

              <div className="p-3 rounded bg-[var(--sb-surface-alt)] border border-[var(--sb-border-light)] text-[11px] text-[var(--sb-muted)] space-y-1">
                <p className="font-bold text-[var(--sb-ink)]">💡 Examples for {activeChatProvider}:</p>
                {activeChatProvider === 'gemini' && (
                  <p className="font-mono text-[10px]">gemini-2.0-pro-exp-02-05, gemini-2.0-flash-thinking-exp</p>
                )}
                {activeChatProvider === 'openai' && (
                  <p className="font-mono text-[10px]">gpt-4o-2024-11-20, chatgpt-4o-latest, o3-mini</p>
                )}
                {activeChatProvider === 'ollama_cloud' && (
                  <p className="font-mono text-[10px]">qwen2.5-coder:32b, deepseek-r1:70b, mistral-large</p>
                )}
                {activeChatProvider === 'custom' && (
                  <p className="font-mono text-[10px]">meta-llama/Llama-3-70b-chat-hf, mistralai/Mixtral-8x22B</p>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setCustomModelModalOpen(false);
                    setCustomModelInput('');
                  }}
                  className="neo-btn neo-btn-outline text-xs px-4 py-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="neo-btn neo-btn-primary text-xs px-5 py-2"
                >
                  Add & Use Model
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AIPage() {
  return (
    <Suspense
      fallback={
        <div className="h-[calc(100vh-6.5rem)] flex items-center justify-center">
          <div className="neo-box p-6 flex items-center gap-3 font-bold text-xs">
            <RefreshCw className="w-4 h-4 animate-spin text-[var(--sb-primary)]" />
            <span>Loading AI workspace...</span>
          </div>
        </div>
      }
    >
      <AIPageContent />
    </Suspense>
  );
}
