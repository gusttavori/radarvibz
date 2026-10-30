/**
 * Radar Vibz - Telegram Notifications View
 */

import React, { useState } from 'react';
import {
  Bell,
  Send,
  CheckCircle,
  AlertCircle,
  ShieldAlert,
  Loader2,
  Settings,
  Eye,
  RefreshCw
} from 'lucide-react';
import { AppSettings, SystemLog } from '../types/radar';
import { api } from '../client/api';

interface NotificationsViewProps {
  settings: AppSettings | null;
  logs: SystemLog[];
  onRefresh: () => void;
}

export const NotificationsView: React.FC<NotificationsViewProps> = ({
  settings,
  logs,
  onRefresh
}) => {
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; simulated?: boolean } | null>(null);

  const handleTestNotification = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await api.testTelegramNotification();
      setTestResult(res);
    } catch (err: unknown) {
      setTestResult({
        success: false,
        message: err instanceof Error ? err.message : 'Falha na requisição ao Telegram'
      });
    } finally {
      setTesting(false);
    }
  };

  const telegramLogs = logs.filter(l => l.module === 'TELEGRAM');

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Telegram Status Banner */}
      <div className="bg-[#14141D] border border-[#222230] rounded-xl p-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#229ED9]/20 border border-[#229ED9]/40 flex items-center justify-center text-[#229ED9]">
              <Send className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-base font-bold text-white">Integração Telegram Bot API</h2>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                  settings?.telegram.enabled
                    ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
                    : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                }`}>
                  {settings?.telegram.enabled ? 'Notificações Ativas' : 'Pausado'}
                </span>
              </div>
              <p className="text-xs text-gray-400">
                Disparo instantâneo de oportunidades de alta relevância comercial para o grupo de atendimento do Vibz.
              </p>
            </div>
          </div>

          <button
            onClick={handleTestNotification}
            disabled={testing}
            className="w-full md:w-auto px-5 py-2.5 rounded-lg text-xs font-bold bg-[#229ED9] hover:bg-[#1C88BD] text-white flex items-center justify-center gap-2 shadow-lg shadow-[#229ED9]/20 transition-all cursor-pointer disabled:opacity-50"
          >
            {testing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Enviando Teste...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Testar Envio Telegram</span>
              </>
            )}
          </button>
        </div>

        {testResult && (
          <div className={`mt-4 p-3 rounded-lg text-xs border flex items-center gap-2 ${
            testResult.success
              ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
              : 'bg-rose-500/10 text-rose-300 border-rose-500/30'
          }`}>
            {testResult.success ? <CheckCircle className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
            <span>{testResult.message}</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Editorial Notification Message Preview */}
        <div className="bg-[#14141D] border border-[#222230] rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <Eye className="w-4 h-4 text-[#9D54FF]" />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Padrão Editorial da Mensagem</h3>
          </div>
          <p className="text-xs text-gray-400 mb-4">
            Estrutura exata da mensagem enviada ao grupo comercial no Telegram a cada novo evento identificado:
          </p>

          <div className="bg-[#0F141A] border border-[#1E293B] rounded-xl p-4 text-xs font-mono text-gray-200 leading-relaxed space-y-2 select-all">
            <p className="font-bold text-[#38BDF8]">RADAR VIBZ</p>
            <p className="font-bold text-rose-400">🚨 NOVA OPORTUNIDADE IDENTIFICADA</p>
            <p className="text-gray-400">Perfil: <strong className="text-white">@arena_sudoeste_eventos</strong></p>
            <p className="text-gray-400">Categoria: <strong className="text-white">Festival / Casa de eventos</strong></p>
            <p className="text-gray-400">Cidade: <strong className="text-white">Vitória da Conquista</strong></p>
            <hr className="border-[#1E293B] my-2" />
            <p className="text-gray-400">Evento: <strong className="text-white">Conquista Summer Fest 2026</strong></p>
            <p className="text-gray-400">Data: <strong className="text-white">21/11/2026 às 20:00</strong></p>
            <p className="text-gray-400">Local: <strong className="text-white">Arena Sudoeste</strong></p>
            <p className="text-gray-400">Atrações: <strong className="text-white">Banda Som da Serra, Trio EletroAxé, DJ Alan</strong></p>
            <hr className="border-[#1E293B] my-2" />
            <p className="text-rose-400 font-bold">Relevância: ALTA</p>
            <p className="text-gray-400">Oportunidade:<br /><span className="text-gray-300">Possibilidade de contato urgente com o organizador para divulgação exclusiva e venda de ingressos no Vibz.</span></p>
            <p className="text-sky-400 underline">https://instagram.com/p/DB123456781</p>
          </div>
        </div>

        {/* Telegram Configuration Details */}
        <div className="bg-[#14141D] border border-[#222230] rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <Settings className="w-4 h-4 text-gray-400" />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Parâmetros Atuais do Bot</h3>
          </div>

          <div className="space-y-3 text-xs">
            <div className="bg-[#101016] p-3 rounded-lg border border-[#222230]">
              <span className="text-[10px] text-gray-500 uppercase block font-semibold">Chat ID de Destino</span>
              <span className="font-mono text-gray-200">
                {settings?.telegram.chatId || '(Modo Simulação Ativo - configure na aba Configurações)'}
              </span>
            </div>

            <div className="bg-[#101016] p-3 rounded-lg border border-[#222230]">
              <span className="text-[10px] text-gray-500 uppercase block font-semibold">Gatilho de Relevância</span>
              <span className="font-bold text-rose-400 uppercase">
                {settings?.telegram.minRelevance === 'high' ? 'Apenas Alta Prioridade (Recomendado)' : 'Média e Alta'}
              </span>
            </div>

            <div className="bg-[#101016] p-3 rounded-lg border border-[#222230]">
              <span className="text-[10px] text-gray-500 uppercase block font-semibold">Política de Deduplicação</span>
              <span className="text-emerald-400 font-medium">
                Ativa: Cada evento gera no máximo 1 alerta para evitar repetições no grupo comercial.
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Telegram Dispatch Logs */}
      <div className="bg-[#14141D] border border-[#222230] rounded-xl overflow-hidden">
        <div className="p-4 bg-[#171722] border-b border-[#222230] flex items-center justify-between">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">Histórico de Disparos Telegram</h3>
          <button onClick={onRefresh} className="text-xs text-gray-400 hover:text-white flex items-center gap-1">
            <RefreshCw className="w-3 h-3" />
            <span>Atualizar</span>
          </button>
        </div>

        <div className="divide-y divide-[#1D1D2B] text-xs">
          {telegramLogs.length === 0 ? (
            <div className="py-8 text-center text-gray-500">
              Nenhuma mensagem disparada recentemente.
            </div>
          ) : (
            telegramLogs.map(log => (
              <div key={log.id} className="p-3.5 hover:bg-[#181824] transition-colors flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${log.level === 'SUCCESS' ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                  <div>
                    <p className="text-gray-200 font-medium">{log.message}</p>
                    <span className="text-[10px] text-gray-500">
                      {new Date(log.timestamp).toLocaleString('pt-BR')}
                    </span>
                  </div>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                  log.level === 'SUCCESS' ? 'bg-emerald-500/10 text-emerald-300' : 'bg-amber-500/10 text-amber-300'
                }`}>
                  {log.level}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
