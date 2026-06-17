'use client';

import React, { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import Sidebar from '../../components/Sidebar';
import { 
  Plus, 
  Cpu, 
  Trash2, 
  CheckCircle2, 
  XCircle, 
  Activity, 
  HelpCircle,
  AlertCircle
} from 'lucide-react';

interface AIProvider {
  id: string;
  name: string;
  baseUrl: string;
  apiKey: string;
  modelName: string;
  isDefault: boolean;
  createdAt: string;
}

export default function SettingsPage() {
  const [providers, setProviders] = useState<AIProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [baseUrl, setBaseUrl] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [modelName, setModelName] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [formLoading, setFormLoading] = useState(false);

  // Connection Test States
  const [testingId, setTestingId] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<Record<string, { success: boolean; message: string }>>({});
  
  const [isTestingConfig, setIsTestingConfig] = useState(false);
  const [configTestMessage, setConfigTestMessage] = useState<{ success: boolean; message: string } | null>(null);

  const fetchProviders = async () => {
    try {
      const data = await api.get<AIProvider[]>('/ai/providers');
      setProviders(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load AI Providers.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProviders();
  }, []);

  const clearMessages = () => {
    setError(null);
    setSuccess(null);
    setConfigTestMessage(null);
  };

  const applyPreset = (preset: { name: string; url: string; key: string; model: string }) => {
    setName(preset.name);
    setBaseUrl(preset.url);
    setApiKey(preset.key);
    setModelName(preset.model);
    clearMessages();
  };

  const handleCreateProvider = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    setFormLoading(true);

    try {
      const newProv = await api.post<AIProvider>('/ai/providers', {
        name,
        baseUrl,
        apiKey: apiKey || undefined,
        modelName,
        isDefault,
      });

      setSuccess('AI Provider added successfully.');
      
      // Reset Form
      setName('');
      setBaseUrl('');
      setApiKey('');
      setModelName('');
      setIsDefault(false);

      // Refresh list
      fetchProviders();
    } catch (err: any) {
      setError(err.message || 'Failed to save AI Provider.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleSetDefault = async (id: string) => {
    clearMessages();
    try {
      await api.put(`/ai/providers/${id}`, { isDefault: true });
      setSuccess('Default provider updated.');
      fetchProviders();
    } catch (err: any) {
      setError(err.message || 'Failed to update default provider.');
    }
  };

  const handleDeleteProvider = async (id: string) => {
    clearMessages();
    try {
      await api.delete(`/ai/providers/${id}`);
      setSuccess('AI Provider configuration removed.');
      fetchProviders();
    } catch (err: any) {
      setError(err.message || 'Failed to delete AI Provider.');
    }
  };

  const testConfigConnection = async () => {
    clearMessages();
    if (!baseUrl || !modelName) {
      setError('Base URL and Model Name are required to test connection.');
      return;
    }
    setIsTestingConfig(true);

    try {
      const res = await api.post<{ success: boolean; message: string }>('/ai/providers/test', {
        baseUrl,
        apiKey: apiKey || undefined,
        modelName,
      });
      setConfigTestMessage({ success: true, message: res.message });
    } catch (err: any) {
      setConfigTestMessage({ success: false, message: err.message || 'Connection failed.' });
    } finally {
      setIsTestingConfig(false);
    }
  };

  const testProviderConnection = async (provider: AIProvider) => {
    setTestingId(provider.id);
    try {
      const res = await api.post<{ success: boolean; message: string }>('/ai/providers/test', {
        baseUrl: provider.baseUrl,
        apiKey: provider.apiKey || undefined,
        modelName: provider.modelName,
      });
      setTestResult(prev => ({
        ...prev,
        [provider.id]: { success: true, message: res.message }
      }));
    } catch (err: any) {
      setTestResult(prev => ({
        ...prev,
        [provider.id]: { success: false, message: err.message || 'Connection failed.' }
      }));
    } finally {
      setTestingId(null);
    }
  };

  const presets = [
    { name: 'OpenAI Cloud', url: 'https://api.openai.com/v1', key: '', model: 'gpt-4o-mini' },
    { name: 'LM Studio Local', url: 'http://localhost:1234/v1', key: 'not-needed-for-local', model: 'qwen2.5-coder-7b-instruct' },
    { name: 'Ollama Local', url: 'http://localhost:11434/v1', key: 'not-needed-for-local', model: 'llama3' },
    { name: 'OpenRouter Cloud', url: 'https://openrouter.ai/api/v1', key: '', model: 'meta-llama/llama-3-8b-instruct:free' },
  ];

  return (
    <div className="flex min-h-screen bg-[#090d16]">
      <Sidebar />

      <main className="flex-1 flex flex-col p-8 overflow-y-auto max-h-screen">
        {/* Header */}
        <div className="mb-8 animate-fade-in">
          <h1 className="text-2xl font-bold text-white tracking-tight">AI Providers</h1>
          <p className="text-xs text-gray-500 font-medium">Configure LLM connections for code review and chat services</p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center space-x-2 animate-fade-in">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-sm flex items-center space-x-2 animate-fade-in">
            <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
            <span>{success}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-fade-in">
          {/* Form Configurator */}
          <div className="lg:col-span-5 glass-panel p-6 rounded-2xl relative">
            <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent" />
            
            <h2 className="text-sm font-bold text-white mb-4 flex items-center space-x-2">
              <Cpu className="h-4 w-4 text-indigo-400" />
              <span>Configure Provider</span>
            </h2>

            {/* Presets Row */}
            <div className="mb-6">
              <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-2 font-semibold">Presets Quick Setup</p>
              <div className="flex flex-wrap gap-2">
                {presets.map(p => (
                  <button
                    key={p.name}
                    type="button"
                    onClick={() => applyPreset(p)}
                    className="px-2.5 py-1 text-[10px] rounded-lg bg-white/5 border border-white/5 text-gray-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleCreateProvider} className="space-y-4">
              <div>
                <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                  Profile Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. OpenAI Dev"
                  className="w-full px-3 py-2.5 rounded-xl glass-input text-xs"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                  Base URL Endpoint
                </label>
                <input
                  type="text"
                  required
                  value={baseUrl}
                  onChange={(e) => setBaseUrl(e.target.value)}
                  placeholder="https://api.openai.com/v1"
                  className="w-full px-3 py-2.5 rounded-xl glass-input text-xs"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                  API Key
                </label>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Leave empty or fill key"
                  className="w-full px-3 py-2.5 rounded-xl glass-input text-xs"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                  Model Name
                </label>
                <input
                  type="text"
                  required
                  value={modelName}
                  onChange={(e) => setModelName(e.target.value)}
                  placeholder="e.g. gpt-4o-mini"
                  className="w-full px-3 py-2.5 rounded-xl glass-input text-xs"
                />
              </div>

              <div className="flex items-center space-x-2 py-2">
                <input
                  id="isDefault"
                  type="checkbox"
                  checked={isDefault}
                  onChange={(e) => setIsDefault(e.target.checked)}
                  className="rounded border-white/10 text-indigo-600 focus:ring-0 cursor-pointer h-4 w-4 bg-[#090d16]"
                />
                <label htmlFor="isDefault" className="text-xs text-gray-400 select-none cursor-pointer">
                  Set as Default Provider
                </label>
              </div>

              {configTestMessage && (
                <div className={`p-3 rounded-lg border text-xs flex items-start space-x-2 ${
                  configTestMessage.success 
                    ? 'bg-green-500/10 border-green-500/20 text-green-400' 
                    : 'bg-red-500/10 border-red-500/20 text-red-400'
                }`}>
                  {configTestMessage.success ? (
                    <CheckCircle2 className="h-4 w-4 flex-shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                  )}
                  <span>{configTestMessage.message}</span>
                </div>
              )}

              <div className="flex space-x-2 pt-4 border-t border-white/5">
                <button
                  type="button"
                  onClick={testConfigConnection}
                  disabled={isTestingConfig}
                  className="flex-grow flex items-center justify-center space-x-1.5 px-3 py-2.5 rounded-xl border border-white/5 hover:bg-white/5 text-gray-400 hover:text-white font-semibold text-xs transition-colors cursor-pointer"
                >
                  {isTestingConfig ? (
                    <div className="h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Activity className="h-3.5 w-3.5" />
                      <span>Test Connection</span>
                    </>
                  )}
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="flex-grow flex items-center justify-center space-x-1 px-3 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-colors cursor-pointer"
                >
                  {formLoading ? (
                    <div className="h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Plus className="h-3.5 w-3.5" />
                      <span>Save Provider</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Provider List */}
          <div className="lg:col-span-7 space-y-4">
            <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold px-1">Configured Profiles ({providers.length})</p>

            {loading ? (
              <div className="flex justify-center items-center py-12">
                <div className="h-6 w-6 border-2 border-white/20 border-t-indigo-500 rounded-full animate-spin" />
              </div>
            ) : providers.length === 0 ? (
              <div className="glass-panel p-8 rounded-2xl text-center text-xs text-gray-500">
                No custom AI Providers configured. Register one using the configuration form.
              </div>
            ) : (
              <div className="space-y-4">
                {providers.map((p) => (
                  <div key={p.id} className="glass-panel p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-bold text-white">{p.name}</span>
                        {p.isDefault && (
                          <span className="px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider rounded bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                            Default
                          </span>
                        )}
                      </div>
                      
                      <div className="text-[10px] text-gray-400 font-mono space-y-0.5">
                        <p className="truncate max-w-[280px] md:max-w-[360px]"><span className="text-gray-600">Base URL:</span> {p.baseUrl}</p>
                        <p><span className="text-gray-600">Model Name:</span> {p.modelName}</p>
                        <p><span className="text-gray-600">API Key:</span> {p.apiKey ? '••••••••••••' : 'None'}</p>
                      </div>
                    </div>

                    {/* Action Panel */}
                    <div className="flex items-center space-x-2 mt-2 md:mt-0">
                      {testResult[p.id] && (
                        <div className={`p-1.5 rounded-lg border text-[10px] mr-2 flex items-center space-x-1 ${
                          testResult[p.id].success 
                            ? 'bg-green-500/5 border-green-500/10 text-green-400' 
                            : 'bg-red-500/5 border-red-500/10 text-red-400'
                        }`} title={testResult[p.id].message}>
                          {testResult[p.id].success ? (
                            <CheckCircle2 className="h-3 w-3" />
                          ) : (
                            <XCircle className="h-3 w-3" />
                          )}
                          <span>{testResult[p.id].success ? 'Online' : 'Failed'}</span>
                        </div>
                      )}

                      <button
                        onClick={() => testProviderConnection(p)}
                        disabled={testingId === p.id}
                        className="px-2.5 py-1.5 rounded-lg border border-white/5 hover:bg-white/5 text-gray-400 hover:text-white font-medium text-[10px] transition-colors cursor-pointer"
                      >
                        {testingId === p.id ? 'Testing...' : 'Test Connection'}
                      </button>

                      {!p.isDefault && (
                        <button
                          onClick={() => handleSetDefault(p.id)}
                          className="px-2.5 py-1.5 rounded-lg bg-indigo-600/10 border border-indigo-500/10 hover:bg-indigo-600 hover:text-white text-indigo-400 font-medium text-[10px] transition-all cursor-pointer"
                        >
                          Make Default
                        </button>
                      )}

                      {!p.isDefault && (
                        <button
                          onClick={() => handleDeleteProvider(p.id)}
                          className="p-1.5 text-gray-500 hover:text-red-400 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
                          title="Delete Provider"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Instruction Tip */}
            <div className="p-5 rounded-2xl border border-white/5 bg-white/[0.01] flex items-start space-x-3 text-xs text-gray-500">
              <HelpCircle className="h-4 w-4 text-gray-500 mt-0.5 flex-shrink-0" />
              <div className="space-y-1">
                <p className="font-semibold text-gray-400">Connection Checklist</p>
                <p>Ensure your local services are listening and accepting queries. If using LM Studio, click "Enable Local Server" in the Developer side panel. If using Ollama, ensure your server environment allows CORS origin requests (`OLLAMA_ORIGINS="*" ollama serve`).</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
