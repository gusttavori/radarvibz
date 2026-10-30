/**
 * Radar Vibz - Monitoring Engine View
 */

import React, { useState } from 'react';
import {
  Radar,
  Play,
  Loader2,
  Clock,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Settings2,
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import { MonitoringCycleLog, AppSettings } from '../types/radar';
import { api } from '../client/api';

interface MonitoringViewProps {
  logs: MonitoringCycleLog[];
  settings: AppSettings | null;
  isScanning: boolean;
  onTriggerScan: () => void;
  onRefresh: () => void;
}

export const MonitoringView: React.FC<MonitoringViewProps> = ({
  logs,
  settings,
  isScanning,
  onTriggerScan,
  onRefresh
}) => {
  const [selectedInterval, setSelectedInterval] = useState<number>(settings?.monitoring.intervalMinutes || 30);
  const [savingSettings, setSavingSettings] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleUpdateSchedule = async (newInterval: number) => {
    setSelectedInterval(newInterval);
    setSavingSettings(true);
    setSaveSuccess(false);
    try {
      await api.updateSettings({
        monitoring: {
          intervalMinutes: newInterval,
          maxProfilesPerCycle: settings?.monitoring.maxProfilesPerCycle || 20,
          autoScheduled: true
        }
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      onRefresh();
    } catch (err) {
      console.error(err);
    } finally {
      setSavingSettings(false);
    }
  };

  const handleToggleProvider = async (mode: 'demo_simulation' | 'meta_graph_api') => {
    try {
      await api.updateSettings({
        instagram: {
          appId: settings?.instagram.appId || '',
          appSecret: settings?.instagram.appSecret || '',
          accessToken: settings?.instagram.accessToken || '',
          pageId: settings?.instagram.pageId || '',
          apiVersion: settings?.instagram.apiVersion || 'v21.0',
          providerMode: mode
        }
      });
      onRefresh();
    } catch (err) {
      console.error(err);
    }
  };

  const lastLog = logs[0];
  const isDemoMode = settings?.instagram.providerMode === 'demo_simulation';

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Banner: Status & Quick Run */}
      <div className="bg-[#14141D] border border-[#222230] rounded-xl p-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#4C01B5]/20 border border-[#4C01B5]/50 flex items-center justify-center text-[#9D54FF]">
              <Radar className={`w-6 h-6 ${isScanning ? 'animate-spin' : ''}`} />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-base font-bold text-white">Motor de Varredura Instagram</h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                  {isScanning ? 'Varredura em execução' : 'Pronto para consultas'}
                </span>
              </div>
              <p className="text-xs text-gray-400">
                Consulta periódica aos perfis cadastrados, detecção de publicações inéditas e envio para o pipeline de IA.
              </p>
            </div>
          </div>

          <button
            onClick={onTriggerScan}
            disabled={isScanning}
            className="w-full md:w-auto px-5 py-2.5 rounded-lg text-xs font-bold bg-[#4C01B5] hover:bg-[#3D0194] text-white flex items-center justify-center gap-2 shadow-lg shadow-[#4C01B5]/30 transition-all cursor-pointer disabled:opacity-50"
          >
            {isScanning ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Processando Perfis Ativos...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                <span>Executar Varredura Imediata</span>
              </>
            )}
          </button>
        </div>

        {/* Engine Stats Strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-[#1F1F2E] text-xs">
          <div>
            <span className="text-gray-500 uppercase text-[10px] font-semibold block mb-1">Última Execução</span>
            <span className="font-semibold text-white">
              {lastLog ? new Date(lastLog.timestamp).toLocaleString('pt-BR') : 'Nenhuma'}
            </span>
          </div>

          <div>
            <span className="text-gray-500 uppercase text-[10px] font-semibold block mb-1">Próximo Ciclo</span>
            <span className="font-semibold text-[#9D54FF]">
              {settings?.monitoring.nextRunAt ? new Date(settings.monitoring.nextRunAt).toLocaleTimeString('pt-BR') : 'A cada 30 min'}
            </span>
          </div>

          <div>
            <span className="text-gray-500 uppercase text-[10px] font-semibold block mb-1">Provedor Ativo</span>
            <span className="font-semibold text-gray-200">
              {isDemoMode ? 'Simulação Demonstrativa (Fictícia)' : 'Meta Graph API Oficial'}
            </span>
          </div>

          <div>
            <span className="text-gray-500 uppercase text-[10px] font-semibold block mb-1">Regras de Segurança</span>
            <span className="font-semibold text-emerald-400 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              API Oficial / Sem Scraping
            </span>
          </div>
        </div>
      </div>

      {/* Configuration & Provider Control */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Agendamento Periódico */}
        <div className="bg-[#14141D] border border-[#222230] rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="w-4 h-4 text-indigo-400" />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Agendamento de Consultas</h3>
          </div>
          <p className="text-xs text-gray-400 mb-4">
            Defina o intervalo entre as varreduras automáticas de perfis. Respeita as políticas de rate limit e limites da API.
          </p>

          <div className="grid grid-cols-3 gap-2 mb-3">
            {[30, 60, 180].map(mins => (
              <button
                key={mins}
                onClick={() => handleUpdateSchedule(mins)}
                disabled={savingSettings}
                className={`py-2 px-3 rounded-lg text-xs font-semibold border transition-all ${
                  selectedInterval === mins
                    ? 'bg-[#4C01B5] text-white border-[#4C01B5]'
                    : 'bg-[#181824] text-gray-300 border-[#262638] hover:bg-[#202030]'
                }`}
              >
                {mins === 30 ? 'A cada 30 min' : mins === 60 ? 'A cada 60 min' : 'A cada 3 horas'}
              </button>
            ))}
          </div>

          {saveSuccess && (
            <p className="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Intervalo atualizado com sucesso.
            </p>
          )}
        </div>

        {/* Alternância de Provedores */}
        <div className="bg-[#14141D] border border-[#222230] rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <Settings2 className="w-4 h-4 text-purple-400" />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Provedor de Dados</h3>
          </div>
          <p className="text-xs text-gray-400 mb-4">
            Alterne entre o ambiente com dados fictícios para demonstração e a integração real com a Meta Graph API.
          </p>

          <div className="flex items-center gap-3">
            <button
              onClick={() => handleToggleProvider('demo_simulation')}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold border transition-all ${
                isDemoMode
                  ? 'bg-amber-500/20 text-amber-200 border-amber-500/50'
                  : 'bg-[#181824] text-gray-400 border-[#262638] hover:text-white'
              }`}
            >
              Modo Demonstração (Simulado)
            </button>

            <button
              onClick={() => handleToggleProvider('meta_graph_api')}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold border transition-all ${
                !isDemoMode
                  ? 'bg-[#4C01B5] text-white border-[#4C01B5]'
                  : 'bg-[#181824] text-gray-400 border-[#262638] hover:text-white'
              }`}
            >
              Meta Graph API (Oficial)
            </button>
          </div>
        </div>
      </div>

      {/* Monitoring Execution Logs */}
      <div className="bg-[#14141D] border border-[#222230] rounded-xl overflow-hidden">
        <div className="p-4 bg-[#171722] border-b border-[#222230] flex items-center justify-between">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">Histórico de Ciclos de Varredura</h3>
          <button
            onClick={onRefresh}
            className="text-xs text-gray-400 hover:text-white flex items-center gap-1"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Atualizar</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#151520] text-gray-400 uppercase text-[10px] tracking-wider font-semibold border-b border-[#222230]">
              <tr>
                <th className="py-2.5 px-4">Horário</th>
                <th className="py-2.5 px-4">Provedor</th>
                <th className="py-2.5 px-4">Duração</th>
                <th className="py-2.5 px-4">Perfis Consultados</th>
                <th className="py-2.5 px-4">Novos Posts</th>
                <th className="py-2.5 px-4">Status</th>
                <th className="py-2.5 px-4">Detalhes da Execução</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1D1D2B]">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-gray-500">
                    Nenhum ciclo registrado até o momento.
                  </td>
                </tr>
              ) : (
                logs.map(log => (
                  <tr key={log.id} className="hover:bg-[#181824] transition-colors">
                    <td className="py-3 px-4 text-gray-300 font-medium">
                      {new Date(log.timestamp).toLocaleTimeString('pt-BR')} ({new Date(log.timestamp).toLocaleDateString('pt-BR')})
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-[11px] font-mono text-gray-300">
                        {log.provider === 'meta_graph_api' ? 'Meta Graph API' : 'Demo Simulation'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-400">
                      {(log.durationMs / 1000).toFixed(2)}s
                    </td>
                    <td className="py-3 px-4 font-semibold text-white">
                      {log.profilesChecked}
                    </td>
                    <td className="py-3 px-4 font-bold text-emerald-400">
                      +{log.newPostsFound}
                    </td>
                    <td className="py-3 px-4">
                      {log.status === 'success' ? (
                        <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                          Sucesso
                        </span>
                      ) : log.status === 'partial_failure' ? (
                        <span className="text-[11px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                          Parcial ({log.errorsCount} erros)
                        </span>
                      ) : (
                        <span className="text-[11px] font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
                          Falha
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-gray-400 max-w-xs truncate" title={log.details}>
                      {log.details}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
