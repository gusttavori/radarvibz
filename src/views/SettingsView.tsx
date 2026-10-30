/**
 * Radar Vibz - System Settings View
 */

import React, { useState } from 'react';
import {
  Settings,
  Shield,
  Sparkles,
  Send,
  Clock,
  Database,
  CheckCircle,
  AlertCircle,
  Download,
  Trash2,
  RefreshCw,
  Loader2,
  ExternalLink
} from 'lucide-react';
import { AppSettings } from '../types/radar';
import { api } from '../client/api';

interface SettingsViewProps {
  settings: AppSettings | null;
  loading: boolean;
  onRefresh: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  loading,
  onRefresh
}) => {
  const [activeTab, setActiveTab] = useState<'instagram' | 'gemini' | 'telegram' | 'monitoring' | 'system'>('instagram');

  // Instagram Form
  const [appId, setAppId] = useState(settings?.instagram.appId || '');
  const [appSecret, setAppSecret] = useState(settings?.instagram.appSecret || '');
  const [accessToken, setAccessToken] = useState(settings?.instagram.accessToken || '');
  const [pageId, setPageId] = useState(settings?.instagram.pageId || '');
  const [apiVersion, setApiVersion] = useState(settings?.instagram.apiVersion || 'v21.0');
  const [providerMode, setProviderMode] = useState<'demo_simulation' | 'meta_graph_api'>(
    settings?.instagram.providerMode || 'demo_simulation'
  );

  // Telegram Form
  const [telegramToken, setTelegramToken] = useState(settings?.telegram.botToken || '');
  const [telegramChatId, setTelegramChatId] = useState(settings?.telegram.chatId || '');
  const [telegramEnabled, setTelegramEnabled] = useState(settings?.telegram.enabled ?? true);
  const [minRelevance, setMinRelevance] = useState<'high' | 'medium'>(settings?.telegram.minRelevance || 'high');

  // Monitoring Form
  const [intervalMinutes, setIntervalMinutes] = useState(settings?.monitoring.intervalMinutes || 30);
  const [maxProfilesPerCycle, setMaxProfilesPerCycle] = useState(settings?.monitoring.maxProfilesPerCycle || 20);

  // Test states
  const [testingInstagram, setTestingInstagram] = useState(false);
  const [instagramTestResult, setInstagramTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const [testingGemini, setTestingGemini] = useState(false);
  const [geminiTestResult, setGeminiTestResult] = useState<any>(null);

  const [testingTelegram, setTestingTelegram] = useState(false);
  const [telegramTestResult, setTelegramTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Sync initial settings
  React.useEffect(() => {
    if (settings) {
      setAppId(settings.instagram.appId || '');
      setAppSecret(settings.instagram.appSecret || '');
      setAccessToken(settings.instagram.accessToken || '');
      setPageId(settings.instagram.pageId || '');
      setApiVersion(settings.instagram.apiVersion || 'v21.0');
      setProviderMode(settings.instagram.providerMode);
      setTelegramToken(settings.telegram.botToken || '');
      setTelegramChatId(settings.telegram.chatId || '');
      setTelegramEnabled(settings.telegram.enabled);
      setMinRelevance(settings.telegram.minRelevance);
      setIntervalMinutes(settings.monitoring.intervalMinutes);
      setMaxProfilesPerCycle(settings.monitoring.maxProfilesPerCycle);
    }
  }, [settings]);

  const handleSaveAll = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveSuccess(false);

    try {
      await api.updateSettings({
        instagram: {
          appId,
          appSecret,
          accessToken,
          pageId,
          apiVersion,
          providerMode
        },
        telegram: {
          botToken: telegramToken,
          chatId: telegramChatId,
          enabled: telegramEnabled,
          minRelevance,
          allowedCategories: settings?.telegram.allowedCategories || []
        },
        monitoring: {
          intervalMinutes: Number(intervalMinutes),
          maxProfilesPerCycle: Number(maxProfilesPerCycle),
          autoScheduled: true
        }
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      onRefresh();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Falha ao salvar');
    } finally {
      setSaving(false);
    }
  };

  const handleTestInstagram = async () => {
    setTestingInstagram(true);
    setInstagramTestResult(null);
    try {
      const res = await api.testInstagram({ accessToken, pageId, apiVersion });
      setInstagramTestResult(res);
    } catch (err: unknown) {
      setInstagramTestResult({
        success: false,
        message: err instanceof Error ? err.message : 'Falha no teste da Meta API'
      });
    } finally {
      setTestingInstagram(false);
    }
  };

  const handleTestGemini = async () => {
    setTestingGemini(true);
    setGeminiTestResult(null);
    try {
      const res = await api.testGemini();
      setGeminiTestResult(res);
    } catch (err: unknown) {
      setGeminiTestResult({ success: false, error: err instanceof Error ? err.message : 'Falha no teste' });
    } finally {
      setTestingGemini(false);
    }
  };

  const handleTestTelegram = async () => {
    setTestingTelegram(true);
    setTelegramTestResult(null);
    try {
      const res = await api.testTelegramNotification(telegramToken, telegramChatId);
      setTelegramTestResult(res);
    } catch (err: unknown) {
      setTelegramTestResult({
        success: false,
        message: err instanceof Error ? err.message : 'Falha no teste do Telegram'
      });
    } finally {
      setTestingTelegram(false);
    }
  };

  const handleResetDemoData = async () => {
    if (confirm('Deseja restaurar todos os 12 perfis e 20 publicações de demonstração do Radar Vibz?')) {
      await api.resetDemoData();
      alert('Dados demonstrativos restaurados com sucesso!');
      onRefresh();
    }
  };

  const handleClearDemoData = async () => {
    if (confirm('Atenção: deseja limpar todos os dados de demonstração [DEMO]? Perfis cadastrados manualmente serão mantidos.')) {
      await api.clearDemoData();
      alert('Dados de demonstração removidos.');
      onRefresh();
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Settings Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-[#222230] pb-3 text-xs">
        {[
          { id: 'instagram', label: 'Meta Instagram API', icon: Shield },
          { id: 'gemini', label: 'Google Gemini AI', icon: Sparkles },
          { id: 'telegram', label: 'Telegram Bot', icon: Send },
          { id: 'monitoring', label: 'Rotina de Monitoramento', icon: Clock },
          { id: 'system', label: 'Banco & Demonstração', icon: Database }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg font-semibold transition-all cursor-pointer ${
                isActive
                  ? 'bg-[#4C01B5] text-white shadow-sm'
                  : 'text-gray-400 hover:text-white hover:bg-[#181824]'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      <form onSubmit={handleSaveAll} className="space-y-6">
        {/* TAB 1: META INSTAGRAM */}
        {activeTab === 'instagram' && (
          <div className="bg-[#14141D] border border-[#222230] rounded-xl p-6 space-y-5">
            <div>
              <h2 className="text-sm font-bold text-white mb-1">Configuração da Meta Instagram Graph API</h2>
              <p className="text-xs text-gray-400">
                O Radar Vibz utiliza o endpoint oficial Business Discovery da Meta. Nunca utiliza scraping não autorizado ou senhas.
              </p>
            </div>

            <div className="bg-[#101016] p-3.5 rounded-lg border border-[#222230] text-xs space-y-2">
              <span className="text-[10px] text-[#9D54FF] font-semibold uppercase block">Modo Operacional</span>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer text-gray-200">
                  <input
                    type="radio"
                    name="providerMode"
                    value="demo_simulation"
                    checked={providerMode === 'demo_simulation'}
                    onChange={() => setProviderMode('demo_simulation')}
                    className="accent-[#4C01B5]"
                  />
                  <span>Modo Demonstração (Simula publicações fictícias do Sudoeste)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-gray-200">
                  <input
                    type="radio"
                    name="providerMode"
                    value="meta_graph_api"
                    checked={providerMode === 'meta_graph_api'}
                    onChange={() => setProviderMode('meta_graph_api')}
                    className="accent-[#4C01B5]"
                  />
                  <span>Meta Graph API Oficial (Produção)</span>
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-gray-300 font-medium mb-1">Page ID / Business Account ID</label>
                <input
                  type="text"
                  placeholder="ex: 17841405309211844"
                  value={pageId}
                  onChange={e => setPageId(e.target.value)}
                  className="w-full bg-[#101016] border border-[#262635] rounded-lg p-2.5 text-white focus:outline-none focus:border-[#4C01B5]"
                />
              </div>

              <div>
                <label className="block text-gray-300 font-medium mb-1">Versão da Graph API</label>
                <input
                  type="text"
                  value={apiVersion}
                  onChange={e => setApiVersion(e.target.value)}
                  className="w-full bg-[#101016] border border-[#262635] rounded-lg p-2.5 text-white focus:outline-none focus:border-[#4C01B5]"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-gray-300 font-medium mb-1">Meta Graph Access Token (Long-Lived)</label>
                <input
                  type="password"
                  placeholder="EAAG..."
                  value={accessToken}
                  onChange={e => setAccessToken(e.target.value)}
                  className="w-full bg-[#101016] border border-[#262635] rounded-lg p-2.5 text-white focus:outline-none focus:border-[#4C01B5] font-mono text-[11px]"
                />
                <span className="text-[10px] text-gray-500 block mt-1">
                  Requer permissões: <code className="text-gray-400">instagram_basic</code>, <code className="text-gray-400">pages_show_list</code>.
                </span>
              </div>
            </div>

            <div className="pt-3 border-t border-[#20202E] flex items-center justify-between">
              <button
                type="button"
                onClick={handleTestInstagram}
                disabled={testingInstagram}
                className="px-4 py-2 rounded-lg bg-[#181824] hover:bg-[#202030] text-gray-200 text-xs font-semibold border border-[#2A2A3C] flex items-center gap-2"
              >
                {testingInstagram ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                <span>Testar Conexão Meta</span>
              </button>

              {instagramTestResult && (
                <span className={`text-xs ${instagramTestResult.success ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {instagramTestResult.message}
                </span>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: GOOGLE GEMINI AI */}
        {activeTab === 'gemini' && (
          <div className="bg-[#14141D] border border-[#222230] rounded-xl p-6 space-y-5">
            <div>
              <h2 className="text-sm font-bold text-white mb-1">Google Gemini API (Análise de Publicações)</h2>
              <p className="text-xs text-gray-400">
                Interpretação semântica com identificação de shows, festivais, atrações e potencial comercial para o Vibz.
              </p>
            </div>

            <div className="bg-[#101016] p-4 rounded-lg border border-[#222230] text-xs space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-bold text-white block">Modelo de IA Selecionado</span>
                  <span className="text-[11px] text-gray-400 font-mono">gemini-3.8-flash</span>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-300 text-[10px] font-bold border border-emerald-500/20">
                  SDK @google/genai Ativo
                </span>
              </div>
              <p className="text-[11px] text-gray-400">
                A chave de API é gerenciada de forma segura pelo servidor backend (<code className="text-[#9D54FF]">process.env.GEMINI_API_KEY</code>). Nenhuma credencial é exposta no frontend.
              </p>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={handleTestGemini}
                disabled={testingGemini}
                className="px-4 py-2 rounded-lg bg-[#4C01B5]/30 hover:bg-[#4C01B5]/50 text-[#C495FF] border border-[#4C01B5]/50 text-xs font-semibold flex items-center gap-2"
              >
                {testingGemini ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                <span>Executar Diagnóstico de Interpretação</span>
              </button>
            </div>

            {geminiTestResult && (
              <div className="bg-[#101016] p-4 rounded-lg border border-[#222230] text-xs space-y-2">
                <span className="text-[10px] text-emerald-400 font-bold uppercase block">
                  Resultado do Teste Gemini:
                </span>
                <pre className="text-gray-300 overflow-x-auto text-[11px] font-mono">
                  {JSON.stringify(geminiTestResult.data || geminiTestResult, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: TELEGRAM BOT */}
        {activeTab === 'telegram' && (
          <div className="bg-[#14141D] border border-[#222230] rounded-xl p-6 space-y-5">
            <div>
              <h2 className="text-sm font-bold text-white mb-1">Telegram Bot API (Alertas Comerciais)</h2>
              <p className="text-xs text-gray-400">
                Disparo em tempo real para os gerentes comerciais e promotores do Vibz Eventos.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-gray-300 font-medium mb-1">Bot Token (do @BotFather)</label>
                <input
                  type="password"
                  placeholder="ex: 123456789:ABCdefGhIJKlmNoPQRstuVWXyz"
                  value={telegramToken}
                  onChange={e => setTelegramToken(e.target.value)}
                  className="w-full bg-[#101016] border border-[#262635] rounded-lg p-2.5 text-white focus:outline-none focus:border-[#4C01B5] font-mono text-[11px]"
                />
              </div>

              <div>
                <label className="block text-gray-300 font-medium mb-1">Chat ID de Destino</label>
                <input
                  type="text"
                  placeholder="ex: -1002498124 ou ID pessoal"
                  value={telegramChatId}
                  onChange={e => setTelegramChatId(e.target.value)}
                  className="w-full bg-[#101016] border border-[#262635] rounded-lg p-2.5 text-white focus:outline-none focus:border-[#4C01B5]"
                />
              </div>

              <div>
                <label className="block text-gray-300 font-medium mb-1">Relevância Mínima para Disparo</label>
                <select
                  value={minRelevance}
                  onChange={e => setMinRelevance(e.target.value as any)}
                  className="w-full bg-[#101016] border border-[#262635] rounded-lg p-2.5 text-white focus:outline-none focus:border-[#4C01B5]"
                >
                  <option value="high">Apenas Alta Relevância (Recomendado)</option>
                  <option value="medium">Média e Alta Relevância</option>
                </select>
              </div>

              <div className="flex items-center gap-3 pt-6">
                <label className="flex items-center gap-2 cursor-pointer text-gray-200">
                  <input
                    type="checkbox"
                    checked={telegramEnabled}
                    onChange={e => setTelegramEnabled(e.target.checked)}
                    className="accent-[#4C01B5] w-4 h-4"
                  />
                  <span>Habilitar Notificações Automáticas no Telegram</span>
                </label>
              </div>
            </div>

            <div className="pt-3 border-t border-[#20202E] flex items-center justify-between">
              <button
                type="button"
                onClick={handleTestTelegram}
                disabled={testingTelegram}
                className="px-4 py-2 rounded-lg bg-[#229ED9]/20 hover:bg-[#229ED9]/30 text-[#229ED9] text-xs font-semibold border border-[#229ED9]/40 flex items-center gap-2"
              >
                {testingTelegram ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                <span>Disparar Mensagem de Teste</span>
              </button>

              {telegramTestResult && (
                <span className={`text-xs ${telegramTestResult.success ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {telegramTestResult.message}
                </span>
              )}
            </div>
          </div>
        )}

        {/* TAB 4: MONITORAMENTO */}
        {activeTab === 'monitoring' && (
          <div className="bg-[#14141D] border border-[#222230] rounded-xl p-6 space-y-5">
            <div>
              <h2 className="text-sm font-bold text-white mb-1">Configuração da Rotina de Monitoramento</h2>
              <p className="text-xs text-gray-400">
                Ajuste os parâmetros de frequência e limites de perfis para cada ciclo do motor.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-gray-300 font-medium mb-1">Intervalo Entre Varreduras (Minutos)</label>
                <select
                  value={intervalMinutes}
                  onChange={e => setIntervalMinutes(Number(e.target.value))}
                  className="w-full bg-[#101016] border border-[#262635] rounded-lg p-2.5 text-white focus:outline-none focus:border-[#4C01B5]"
                >
                  <option value={30}>30 minutos (Padrão)</option>
                  <option value={60}>60 minutos (1 hora)</option>
                  <option value={180}>180 minutos (3 horas)</option>
                  <option value={360}>360 minutos (6 horas)</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-300 font-medium mb-1">Máximo de Perfis por Ciclo</label>
                <input
                  type="number"
                  min={5}
                  max={100}
                  value={maxProfilesPerCycle}
                  onChange={e => setMaxProfilesPerCycle(Number(e.target.value))}
                  className="w-full bg-[#101016] border border-[#262635] rounded-lg p-2.5 text-white focus:outline-none focus:border-[#4C01B5]"
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: BANCO & DEMONSTRAÇÃO */}
        {activeTab === 'system' && (
          <div className="bg-[#14141D] border border-[#222230] rounded-xl p-6 space-y-6">
            <div>
              <h2 className="text-sm font-bold text-white mb-1">Gestão de Dados & Demonstração</h2>
              <p className="text-xs text-gray-400">
                Operações de backup, restauração de dados fictícios para testes e higienização da base.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-[#101016] p-4 rounded-xl border border-[#222230] flex flex-col justify-between space-y-3 text-xs">
                <div>
                  <h3 className="font-bold text-white mb-1">Exportar Backup Completo</h3>
                  <p className="text-gray-400 text-[11px]">
                    Baixe o banco de dados em formato JSON com todos os perfis, posts e oportunidades.
                  </p>
                </div>
                <a
                  href="/api/settings/export-backup"
                  download="radar_vibz_backup.json"
                  className="w-full py-2 px-3 rounded-lg bg-[#181824] hover:bg-[#222232] text-white font-semibold border border-[#2A2A3E] text-center flex items-center justify-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Baixar JSON</span>
                </a>
              </div>

              <div className="bg-[#101016] p-4 rounded-xl border border-[#222230] flex flex-col justify-between space-y-3 text-xs">
                <div>
                  <h3 className="font-bold text-amber-300 mb-1">Restaurar Dados Demo</h3>
                  <p className="text-gray-400 text-[11px]">
                    Recarrega os 12 perfis demonstrativos, 20 publicações e 8 oportunidades de teste.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleResetDemoData}
                  className="w-full py-2 px-3 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 font-semibold border border-amber-500/30 text-center flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Restaurar Demo</span>
                </button>
              </div>

              <div className="bg-[#101016] p-4 rounded-xl border border-[#222230] flex flex-col justify-between space-y-3 text-xs">
                <div>
                  <h3 className="font-bold text-rose-400 mb-1">Limpar Dados Demo</h3>
                  <p className="text-gray-400 text-[11px]">
                    Remove todos os dados com a tag [DEMO], preservando apenas perfis criados manualmente.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleClearDemoData}
                  className="w-full py-2 px-3 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 font-semibold border border-rose-500/30 text-center flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Limpar Fictícios</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Global Save Button */}
        <div className="flex items-center justify-between pt-4 border-t border-[#222230]">
          {saveSuccess ? (
            <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4" /> Configurações salvas com sucesso!
            </span>
          ) : (
            <span className="text-xs text-gray-500">As alterações são aplicadas imediatamente ao backend.</span>
          )}

          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 rounded-lg bg-[#4C01B5] hover:bg-[#3D0194] text-white text-xs font-bold shadow-lg shadow-[#4C01B5]/20 cursor-pointer disabled:opacity-50"
          >
            {saving ? 'Gravando...' : 'Salvar Configurações'}
          </button>
        </div>
      </form>
    </div>
  );
};
