'use client';

import React, { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';
import { useToast } from '@/components/ToastContext';
import {
  Settings,
  Globe,
  Bot,
  Key,
  Save,
  CheckCircle2,
  RefreshCw,
  Sparkles,
  Eye,
  EyeOff,
  Radio,
  Server,
  Cpu,
  Star,
  Plus,
  Trash2,
} from 'lucide-react';

import { NeoSelect } from '@/components/NeoSelect';
import { NeoInput } from '@/components/NeoInput';

const DEFAULT_ENDPOINTS: Record<string, string> = {
  gemini: 'https://generativelanguage.googleapis.com/v1beta/openai',
  openai: 'https://api.openai.com/v1',
  ollama_cloud: 'https://ollama.com/v1',
  custom: 'http://localhost:11434/v1',
};

const PRESET_MODELS: Record<string, { value: string; label: string; icon?: string }[]> = {
  gemini: [
    { value: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash (Fastest)', icon: '⚡' },
    { value: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro (Deep Context)', icon: '🧠' },
    { value: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash', icon: '✨' },
    { value: 'gemini-2.0-flash-lite-preview-02-05', label: 'Gemini 2.0 Flash-Lite', icon: '🚀' },
  ],
  openai: [
    { value: 'gpt-4o', label: 'GPT-4o (Flagship Omni)', icon: '🌟' },
    { value: 'gpt-4o-mini', label: 'GPT-4o Mini (Fast & Cheap)', icon: '⚡' },
    { value: 'gpt-4-turbo', label: 'GPT-4 Turbo', icon: '🏎️' },
    { value: 'o3-mini', label: 'o3-mini (Reasoning)', icon: '🔬' },
    { value: 'o1', label: 'o1 (Advanced Reasoning)', icon: '💡' },
  ],
  ollama_cloud: [
    { value: 'qwen2.5:latest', label: 'Qwen 2.5 (Fast & Smart)', icon: '🦙' },
    { value: 'llama3.3:latest', label: 'Llama 3.3', icon: '🦙' },
    { value: 'deepseek-r1:latest', label: 'DeepSeek R1', icon: '🦙' },
  ],
  custom: [
    { value: 'custom-model', label: 'Custom Model ID', icon: '⚙️' },
  ],
};

interface ProviderConfigItem {
  apiKey: string;
  endpointUrl: string;
  modelName: string;
  customModelInput?: string;
  availableModels?: { value: string; label: string; icon?: string }[];
}

export default function SettingsPage() {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Settings state
  const [timezone, setTimezone] = useState('Asia/Kolkata');
  const [weekStartsOn, setWeekStartsOn] = useState(0);

  // Active viewing/editing tab provider
  const [activeTabProvider, setActiveTabProvider] = useState<'gemini' | 'openai' | 'ollama_cloud' | 'custom'>('gemini');
  // Which provider is the global default
  const [defaultProvider, setDefaultProvider] = useState<'gemini' | 'openai' | 'ollama_cloud' | 'custom'>('gemini');

  // Per-provider isolated settings state
  const [providersData, setProvidersData] = useState<Record<string, ProviderConfigItem>>({
    gemini: {
      apiKey: '',
      endpointUrl: DEFAULT_ENDPOINTS.gemini,
      modelName: 'gemini-2.0-flash',
      availableModels: PRESET_MODELS.gemini,
    },
    openai: {
      apiKey: '',
      endpointUrl: DEFAULT_ENDPOINTS.openai,
      modelName: 'gpt-4o',
      availableModels: PRESET_MODELS.openai,
    },
    ollama_cloud: {
      apiKey: '',
      endpointUrl: DEFAULT_ENDPOINTS.ollama_cloud,
      modelName: 'qwen2.5:latest',
      availableModels: [
        { value: 'qwen2.5:latest', label: 'Qwen 2.5 (Fast & Smart)', icon: '🦙' },
        { value: 'llama3.3:latest', label: 'Llama 3.3', icon: '🦙' },
        { value: 'deepseek-r1:latest', label: 'DeepSeek R1', icon: '🦙' },
      ],
    },
    custom: {
      apiKey: '',
      endpointUrl: DEFAULT_ENDPOINTS.custom,
      modelName: 'default',
      customModelInput: '',
      availableModels: PRESET_MODELS.custom,
    },
  });

  const [showApiKey, setShowApiKey] = useState(false);
  const [testingAi, setTestingAi] = useState(false);
  const [fetchingModels, setFetchingModels] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [newCustomModelName, setNewCustomModelName] = useState('');

  // Dynamic timezone list from Intl API
  const [timezoneOptions, setTimezoneOptions] = useState<{ value: string; label: string; icon?: string }[]>([]);

  useEffect(() => {
    // Generate dynamic timezone list from Intl API
    try {
      const rawZones = typeof Intl !== 'undefined' && Intl.supportedValuesOf
        ? Intl.supportedValuesOf('timeZone')
        : [
            'Asia/Kolkata',
            'UTC',
            'America/New_York',
            'America/Los_Angeles',
            'America/Chicago',
            'Europe/London',
            'Europe/Paris',
            'Asia/Tokyo',
            'Asia/Dubai',
            'Asia/Singapore',
            'Australia/Sydney',
          ];

      const formatted = rawZones.map((tz) => {
        let offset = '';
        try {
          const d = new Date();
          const dtf = new Intl.DateTimeFormat('en-US', { timeZone: tz, timeZoneName: 'shortOffset' });
          const parts = dtf.formatToParts(d);
          const tzPart = parts.find((p) => p.type === 'timeZoneName');
          offset = tzPart ? ` (${tzPart.value})` : '';
        } catch (e) {
          offset = '';
        }

        return {
          value: tz,
          label: `${tz.replace(/_/g, ' ')}${offset}`,
          icon: '🌐',
        };
      });

      setTimezoneOptions(formatted);
    } catch (e) {
      setTimezoneOptions([
        { value: 'Asia/Kolkata', label: 'Asia/Kolkata (UTC+5:30)', icon: '🇮🇳' },
        { value: 'UTC', label: 'UTC (Coordinated Universal Time)', icon: '🌐' },
        { value: 'America/New_York', label: 'America/New_York (EST/EDT)', icon: '🇺🇸' },
        { value: 'Europe/London', label: 'Europe/London (GMT/BST)', icon: '🇬🇧' },
      ]);
    }

    // Load AI config from localStorage
    try {
      const savedConfig = localStorage.getItem('ai_provider_config');
      if (savedConfig) {
        const parsed = JSON.parse(savedConfig);

        // Check if modern multi-provider format
        if (parsed.providers) {
          setDefaultProvider(parsed.defaultProvider || 'gemini');
          setActiveTabProvider(parsed.defaultProvider || 'gemini');
          setProvidersData((prev) => ({
            ...prev,
            ...parsed.providers,
          }));
        } else if (parsed.provider) {
          // Legacy single-provider format migration
          const legacyProv = parsed.provider || 'gemini';
          setDefaultProvider(legacyProv);
          setActiveTabProvider(legacyProv);
          setProvidersData((prev) => ({
            ...prev,
            [legacyProv]: {
              ...prev[legacyProv],
              apiKey: parsed.apiKey || '',
              endpointUrl: parsed.endpointUrl || DEFAULT_ENDPOINTS[legacyProv],
              modelName: parsed.modelName || prev[legacyProv]?.modelName || '',
            },
          }));
        }
      }
    } catch (e) {
      // default
    }

    async function loadSettings() {
      try {
        const res = await apiFetch('/settings');
        if (res.settings) {
          setTimezone(res.settings.timezone || 'Asia/Kolkata');
          setWeekStartsOn(res.settings.week_starts_on ?? 0);
        }
      } catch (err: any) {
        showToast(err?.message || 'Failed to load settings', 'error');
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, [showToast]);

  const activeConfig = providersData[activeTabProvider] || {
    apiKey: '',
    endpointUrl: DEFAULT_ENDPOINTS[activeTabProvider],
    modelName: '',
    availableModels: [],
  };

  function updateActiveProvider(partial: Partial<ProviderConfigItem>) {
    setProvidersData((prev) => ({
      ...prev,
      [activeTabProvider]: {
        ...prev[activeTabProvider],
        ...partial,
      },
    }));
  }

  async function fetchLiveModelsFor(provider: string, endpoint: string, apiKey: string) {
    setFetchingModels(true);
    try {
      const res = await apiFetch('/ai/models', {
        method: 'POST',
        body: JSON.stringify({
          providerConfig: {
            provider,
            apiKey: apiKey.trim(),
            endpointUrl: endpoint.trim(),
          },
        }),
      });

      if (res.models && res.models.length > 0) {
        const getIcon = (prov: string) => {
          if (prov === 'gemini') return '✨';
          if (prov === 'openai') return '🌟';
          if (prov === 'ollama_cloud') return '🦙';
          return '⚙️';
        };

        const formatted = res.models.map((m: any) => ({
          value: m.id,
          label: m.name || m.id,
          icon: getIcon(provider),
        }));

        setProvidersData((prev) => {
          const current: ProviderConfigItem = prev[provider] || {
            apiKey: '',
            endpointUrl: DEFAULT_ENDPOINTS[provider] || '',
            modelName: '',
            availableModels: [],
          };
          const nextModel = formatted.some((m: any) => m.value === current.modelName)
            ? current.modelName
            : formatted[0]?.value || '';
          return {
            ...prev,
            [provider]: {
              ...current,
              availableModels: formatted,
              modelName: nextModel,
            },
          };
        });

        showToast(`Retrieved ${res.models.length} live models for ${provider.replace('_', ' ')}!`, 'success');
      } else {
        if (provider === 'ollama_cloud') {
          showToast('No models returned from Ollama endpoint. You can enter your model name below.', 'info');
        }
      }
    } catch (err: any) {
      showToast(err?.message || 'Failed to fetch live models from endpoint.', 'error');
    } finally {
      setFetchingModels(false);
    }
  }

  function handleAddCustomModel() {
    if (!newCustomModelName.trim()) {
      showToast('Please enter a custom model name or ID.', 'error');
      return;
    }
    const modelId = newCustomModelName.trim();
    const currentProv = activeTabProvider;
    const current = providersData[currentProv] || {
      apiKey: '',
      endpointUrl: DEFAULT_ENDPOINTS[currentProv] || '',
      modelName: '',
      availableModels: [],
    };

    const existingList = current.availableModels || PRESET_MODELS[currentProv] || [];
    if (existingList.some((m) => m.value.toLowerCase() === modelId.toLowerCase())) {
      updateActiveProvider({ modelName: modelId });
      setNewCustomModelName('');
      showToast(`Model "${modelId}" selected!`, 'info');
      return;
    }

    const newOption = {
      value: modelId,
      label: `${modelId} (Custom)`,
      icon: '⚙️',
    };

    const updatedList = [newOption, ...existingList];
    setProvidersData((prev) => ({
      ...prev,
      [currentProv]: {
        ...current,
        availableModels: updatedList,
        modelName: modelId,
      },
    }));

    setNewCustomModelName('');
    showToast(`Added custom model "${modelId}" to ${currentProv.replace('_', ' ')}!`, 'success');
  }

  function handleRemoveModel(modelVal: string) {
    const currentProv = activeTabProvider;
    const current = providersData[currentProv];
    if (!current?.availableModels) return;

    const filtered = current.availableModels.filter((m) => m.value !== modelVal);
    const nextModel = current.modelName === modelVal ? (filtered[0]?.value || '') : current.modelName;

    setProvidersData((prev) => ({
      ...prev,
      [currentProv]: {
        ...current,
        availableModels: filtered,
        modelName: nextModel,
      },
    }));
    showToast(`Removed model "${modelVal}"`, 'info');
  }

  function handleTabChange(newProvider: 'gemini' | 'openai' | 'ollama_cloud' | 'custom') {
    setActiveTabProvider(newProvider);
    setTestResult(null);

    const config = providersData[newProvider];
    // If ollama_cloud and no models yet, fetch automatically
    if (newProvider === 'ollama_cloud' && (!config?.availableModels || config.availableModels.length === 0)) {
      fetchLiveModelsFor(newProvider, config?.endpointUrl || DEFAULT_ENDPOINTS.ollama_cloud, config?.apiKey || '');
    }
  }

  function autoDetectTimezone() {
    try {
      const localTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (localTz) {
        setTimezone(localTz);
        showToast(`Auto-detected timezone: ${localTz}`, 'info');
      }
    } catch (e) {
      showToast('Could not auto-detect timezone', 'error');
    }
  }

  async function handleSaveSettings(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    try {
      // Save regional settings to backend
      await apiFetch('/settings', {
        method: 'PATCH',
        body: JSON.stringify({
          timezone,
          week_starts_on: Number(weekStartsOn),
        }),
      });

      // Construct complete multi-provider config payload
      const multiConfig = {
        defaultProvider,
        providers: providersData,
        // Legacy fields pointing to the active default provider for backward compatibility
        provider: defaultProvider,
        apiKey: providersData[defaultProvider]?.apiKey?.trim() || '',
        endpointUrl: providersData[defaultProvider]?.endpointUrl?.trim() || DEFAULT_ENDPOINTS[defaultProvider],
        modelName: providersData[defaultProvider]?.modelName || '',
      };

      localStorage.setItem('ai_provider_config', JSON.stringify(multiConfig));
      window.dispatchEvent(new Event('ai-config-updated'));

      showToast('All regional settings & AI provider keys saved! ✨', 'success');
    } catch (err: any) {
      showToast(err?.message || 'Failed to save settings', 'error');
    } finally {
      setSaving(false);
    }
  }

  async function handleFetchLiveModels() {
    await fetchLiveModelsFor(activeTabProvider, activeConfig.endpointUrl, activeConfig.apiKey);
  }

  async function handleTestAi() {
    setTestingAi(true);
    setTestResult(null);
    try {
      const activeModel = activeTabProvider === 'custom' && activeConfig.customModelInput?.trim()
        ? activeConfig.customModelInput.trim()
        : activeConfig.modelName;

      const res = await apiFetch('/ai/test', {
        method: 'POST',
        body: JSON.stringify({
          providerConfig: {
            provider: activeTabProvider,
            apiKey: activeConfig.apiKey.trim(),
            endpointUrl: activeConfig.endpointUrl.trim(),
            modelName: activeModel,
          },
        }),
      });

      if (res.ok) {
        setTestResult({ ok: true, message: res.message || 'Connected successfully!' });
        showToast(res.message || 'AI service connected successfully! 🤖', 'success');
      } else {
        setTestResult({ ok: false, message: res.error || 'Connection failed.' });
        showToast(res.error || 'Connection failed. Verify API key & model.', 'error');
      }
    } catch (err: any) {
      setTestResult({ ok: false, message: err?.message || 'Connection test failed.' });
      showToast(err?.message || 'AI service test failed', 'error');
    } finally {
      setTestingAi(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="neo-box p-6 flex items-center gap-3 font-bold text-xs">
          <RefreshCw className="w-4 h-4 animate-spin text-[var(--sb-primary)]" />
          <span>Loading settings...</span>
        </div>
      </div>
    );
  }

  const currentAvailableModels = activeConfig.availableModels && activeConfig.availableModels.length > 0
    ? activeConfig.availableModels
    : PRESET_MODELS[activeTabProvider] || [];

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-[var(--sb-ink)] tracking-tight">System & AI Settings</h1>
          <p className="text-xs text-[var(--sb-muted)] mt-0.5">
            Configure regional timezones, calendar conventions, and multi-provider AI credentials.
          </p>
        </div>

        <button
          type="button"
          onClick={handleSaveSettings}
          disabled={saving}
          className="neo-btn neo-btn-primary py-2 px-4 text-xs flex items-center gap-2 shadow-[2px_2px_0px_var(--sb-shadow-color)]"
        >
          {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
          <span>{saving ? 'Saving...' : 'Save All Settings'}</span>
        </button>
      </div>

      {/* Regional & Calendar Card */}
      <div className="neo-box p-6 bg-[var(--sb-surface)]">
        <div className="flex items-center gap-2 mb-4">
          <Globe className="w-4 h-4 text-[var(--sb-primary)]" />
          <h2 className="text-base font-black text-[var(--sb-ink)]">Regional & Calendar Preferences</h2>
        </div>

        <div className="space-y-4">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-end gap-3">
              <div className="flex-1">
                <NeoSelect
                  label="Timezone"
                  value={timezone}
                  onChange={(val) => setTimezone(String(val))}
                  options={timezoneOptions}
                />
              </div>
              <button
                type="button"
                onClick={autoDetectTimezone}
                className="neo-btn neo-btn-outline text-xs py-2 px-3 self-start sm:self-auto h-[38px] whitespace-nowrap"
                title="Auto-detect timezone from browser"
              >
                📍 Auto-Detect
              </button>
            </div>
            <p className="text-[11px] text-[var(--sb-muted)] mt-1">
              Used for scheduled reminders, habit check-in resets, and daily agendas.
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--sb-ink)] mb-1.5">
              Week Starts On
            </label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-xs font-bold cursor-pointer">
                <input
                  type="radio"
                  name="week_start"
                  value={0}
                  checked={weekStartsOn === 0}
                  onChange={() => setWeekStartsOn(0)}
                  className="accent-[var(--sb-primary)]"
                />
                Sunday
              </label>
              <label className="flex items-center gap-2 text-xs font-bold cursor-pointer">
                <input
                  type="radio"
                  name="week_start"
                  value={1}
                  checked={weekStartsOn === 1}
                  onChange={() => setWeekStartsOn(1)}
                  className="accent-[var(--sb-primary)]"
                />
                Monday
              </label>
            </div>
            <p className="text-[11px] text-[var(--sb-muted)] mt-1">
              Controls calendar column layout and habit 7-day tracker start day.
            </p>
          </div>
        </div>
      </div>

      {/* AI Assistant Multi-Provider Card */}
      <div className="neo-box p-6 bg-[var(--sb-surface)]">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-black text-[var(--sb-ink)] flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[var(--sb-accent-purple)]" />
            AI Assistant Configuration (Multi-Provider)
            <span className="neo-badge bg-[var(--sb-accent-orange)] text-[#121212] text-[9px] font-black border border-[var(--sb-border)]">
              BETA
            </span>
          </h2>
          <span className="neo-badge bg-[var(--sb-primary)] text-[var(--sb-primary-ink)] text-[10px] font-black">
            PER-PROVIDER KEYS
          </span>
        </div>

        <p className="text-xs text-[var(--sb-muted)] mb-5">
          Each provider stores its own distinct API key and models independently. You can pick your default provider below, or switch providers per conversation in the AI chat!
        </p>

        {/* Provider Selector Tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-5">
          {[
            { id: 'gemini', label: 'Google Gemini', icon: '✨' },
            { id: 'openai', label: 'ChatGPT / OpenAI', icon: '🟢' },
            { id: 'ollama_cloud', label: 'Ollama Cloud', icon: '🦙' },
            { id: 'custom', label: 'Custom (OpenAI)', icon: '⚙️' },
          ].map((prov) => {
            const isTabActive = activeTabProvider === prov.id;
            const isDefault = defaultProvider === prov.id;
            const hasKey = Boolean(providersData[prov.id]?.apiKey);

            return (
              <button
                key={prov.id}
                type="button"
                onClick={() => handleTabChange(prov.id as any)}
                className={`p-3 rounded-lg border-2 text-xs font-bold flex flex-col items-center gap-1.5 transition-all relative ${
                  isTabActive
                    ? 'bg-[var(--sb-primary)] text-[var(--sb-primary-ink)] border-[var(--sb-border)] shadow-[2px_2px_0px_var(--sb-shadow-color)] scale-[1.02]'
                    : 'bg-[var(--sb-surface-alt)] text-[var(--sb-ink)] border-[var(--sb-border-light)] hover:border-[var(--sb-border)]'
                }`}
              >
                {isDefault && (
                  <span
                    className="absolute top-1.5 right-1.5 text-[9px] font-black px-1 rounded bg-[var(--sb-accent-purple)] text-white"
                    title="Default Provider"
                  >
                    ★ DEFAULT
                  </span>
                )}
                <span className="text-base">{prov.icon}</span>
                <span className="truncate">{prov.label}</span>
                {hasKey && (
                  <span className="text-[9px] text-[var(--sb-ok)] font-mono">
                    ● Key Configured
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Provider Configuration Form */}
        <div className="space-y-4 pt-2 border-t border-[var(--sb-border-light)]">
          {/* Default Provider Selector Toggle */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-[var(--sb-surface-alt)] border border-[var(--sb-border-light)]">
            <div className="flex items-center gap-2">
              <Star className={`w-4 h-4 ${defaultProvider === activeTabProvider ? 'text-[var(--sb-accent-purple)] fill-[var(--sb-accent-purple)]' : 'text-[var(--sb-muted)]'}`} />
              <div>
                <p className="text-xs font-bold text-[var(--sb-ink)]">
                  Use {activeTabProvider.replace('_', ' ').toUpperCase()} as Global Default
                </p>
                <p className="text-[10px] text-[var(--sb-muted)]">
                  New chat sessions will automatically start with this provider.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setDefaultProvider(activeTabProvider);
                showToast(`Set ${activeTabProvider.replace('_', ' ')} as default provider! ★`, 'info');
              }}
              className={`text-xs font-bold py-1 px-2.5 rounded border transition ${
                defaultProvider === activeTabProvider
                  ? 'bg-[var(--sb-accent-purple)] text-white border-transparent'
                  : 'bg-[var(--sb-surface)] text-[var(--sb-ink)] border-[var(--sb-border)] hover:bg-[var(--sb-primary)] hover:text-[var(--sb-primary-ink)]'
              }`}
            >
              {defaultProvider === activeTabProvider ? '★ Active Default' : 'Set as Default'}
            </button>
          </div>

          {/* API Key */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--sb-ink)] mb-1.5 flex items-center justify-between">
              <span>
                {activeTabProvider === 'gemini'
                  ? 'Google Gemini API Key'
                  : activeTabProvider === 'openai'
                  ? 'OpenAI API Key'
                  : activeTabProvider === 'ollama_cloud'
                  ? 'Ollama Cloud API Key (Optional)'
                  : 'Custom Endpoint API Key'}
              </span>
              <button
                type="button"
                onClick={() => setShowApiKey(!showApiKey)}
                className="text-[11px] text-[var(--sb-muted)] hover:text-[var(--sb-ink)] flex items-center gap-1 font-normal capitalize"
              >
                {showApiKey ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                <span>{showApiKey ? 'Hide' : 'Show'}</span>
              </button>
            </label>

            <div className="relative">
              <input
                type={showApiKey ? 'text' : 'password'}
                value={activeConfig.apiKey}
                onChange={(e) => updateActiveProvider({ apiKey: e.target.value })}
                placeholder={
                  activeTabProvider === 'gemini'
                    ? 'AIzaSy...'
                    : activeTabProvider === 'openai'
                    ? 'sk-proj-...'
                    : activeTabProvider === 'ollama_cloud'
                    ? 'ollama_api_key... (if required)'
                    : 'Optional bearer token...'
                }
                className="neo-input text-xs font-mono pr-10"
              />
              <Key className="w-3.5 h-3.5 text-[var(--sb-muted)] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
            <p className="text-[10px] text-[var(--sb-muted)] mt-1">
              Your API key for {activeTabProvider.replace('_', ' ')} is stored securely in local workspace storage.
            </p>
          </div>

          {/* API Endpoint URL */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--sb-ink)] mb-1.5">
              API Endpoint URL
            </label>
            <input
              type="text"
              value={activeConfig.endpointUrl}
              onChange={(e) => updateActiveProvider({ endpointUrl: e.target.value })}
              placeholder="https://api.openai.com/v1"
              className="neo-input text-xs font-mono"
            />
            <p className="text-[10px] text-[var(--sb-muted)] mt-1">
              {activeTabProvider === 'ollama_cloud'
                ? 'Ollama Cloud OpenAI-compatible endpoint (models listed at https://ollama.com/v1/models)'
                : 'OpenAI-compatible /v1 chat completions endpoint'}
            </p>
          </div>

          {/* Model Selector & Live Fetch */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
            <div className="sm:col-span-2">
              {currentAvailableModels.length > 0 ? (
                <NeoSelect
                  label={
                    activeTabProvider === 'ollama_cloud'
                      ? 'Models (Select from preset, live, or custom added)'
                      : `Active Model (${activeTabProvider.replace('_', ' ')})`
                  }
                  value={activeConfig.modelName}
                  onChange={(val) => updateActiveProvider({ modelName: String(val) })}
                  options={currentAvailableModels}
                  searchable={true}
                />
              ) : (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[var(--sb-ink)] mb-1.5">
                    {activeTabProvider === 'ollama_cloud'
                      ? 'Ollama Cloud Model Name'
                      : 'Model Name'}
                  </label>
                  <input
                    type="text"
                    value={activeConfig.modelName}
                    onChange={(e) => updateActiveProvider({ modelName: e.target.value })}
                    placeholder={
                      activeTabProvider === 'ollama_cloud'
                        ? 'Fetching models from endpoint or enter (e.g. llama3.3:70b)...'
                        : 'Enter model ID...'
                    }
                    className="neo-input text-xs font-mono"
                  />
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={handleFetchLiveModels}
              disabled={fetchingModels}
              className="neo-btn neo-btn-outline text-xs py-2 px-3 h-[38px] flex items-center justify-center gap-1.5"
              title="Query endpoint live for models"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${fetchingModels ? 'animate-spin' : ''}`} />
              <span>{fetchingModels ? 'Fetching...' : 'Fetch Live Models'}</span>
            </button>
          </div>

          {/* Add Custom Model Box */}
          <div className="p-3.5 rounded-lg bg-[var(--sb-surface-alt)] border-2 border-[var(--sb-border)] space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold uppercase tracking-wider text-[var(--sb-ink)]">
                + Add Custom Model for {activeTabProvider.replace('_', ' ').toUpperCase()}
              </label>
              <span className="text-[10px] text-[var(--sb-muted)] font-mono">
                Supports fine-tunes & any OpenAI-compatible ID
              </span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newCustomModelName}
                onChange={(e) => setNewCustomModelName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddCustomModel();
                  }
                }}
                placeholder="e.g. deepseek-ai/deepseek-r1, llama-3.3-70b, gpt-4.5-preview"
                className="neo-input text-xs font-mono flex-1"
              />
              <button
                type="button"
                onClick={handleAddCustomModel}
                className="neo-btn neo-btn-primary text-xs px-4 py-2 shrink-0 flex items-center gap-1.5 shadow-[2px_2px_0px_var(--sb-shadow-color)]"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Model</span>
              </button>
            </div>
          </div>

          {activeTabProvider === 'custom' && (
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[var(--sb-ink)] mb-1.5">
                Custom Model Identifier (Override)
              </label>
              <input
                type="text"
                value={activeConfig.customModelInput || ''}
                onChange={(e) => updateActiveProvider({ customModelInput: e.target.value })}
                placeholder="e.g. deepseek-ai/deepseek-r1, llama3:8b, mistral"
                className="neo-input text-xs font-mono"
              />
            </div>
          )}

          {/* Test Connection Button & Status */}
          <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleTestAi}
              disabled={testingAi || (!activeConfig.apiKey && activeTabProvider === 'openai')}
              className="neo-btn neo-btn-outline text-xs py-2 px-4 flex items-center gap-2"
            >
              <Cpu className={`w-3.5 h-3.5 text-[var(--sb-accent-purple)] ${testingAi ? 'animate-spin' : ''}`} />
              <span>{testingAi ? `Testing ${activeTabProvider}...` : `Test ${activeTabProvider} Connection`}</span>
            </button>

            {testResult && (
              <span
                className={`text-xs font-bold px-3 py-1.5 rounded-md border flex items-center gap-1.5 ${
                  testResult.ok
                    ? 'bg-[var(--sb-ok-surface)] text-[var(--sb-ok)] border-[var(--sb-ok)]'
                    : 'bg-[var(--sb-alert-surface)] text-[var(--sb-alert)] border-[var(--sb-alert)]'
                }`}
              >
                {testResult.ok ? '✅' : '⚠️'} {testResult.message}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
