/**
 * Radar Vibz - Top Header Component
 */

import React from 'react';
import { Play, Loader2, Sparkles, AlertCircle, RefreshCw, Menu } from 'lucide-react';
import { NavTab } from './Sidebar';

interface HeaderProps {
  activeTab: NavTab;
  isScanning: boolean;
  onTriggerScan: () => void;
  onRefreshData?: () => void;
  isDemoMode?: boolean;
  onToggleMobile?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  isScanning,
  onTriggerScan,
  onRefreshData,
  isDemoMode = true,
  onToggleMobile
}) => {
  const titles: Record<NavTab, { title: string; subtitle: string }> = {
    dashboard: {
      title: 'Dashboard de Inteligência',
      subtitle: 'Visão executiva do monitoramento comercial e eventos detectados'
    },
    monitoring: {
      title: 'Motor de Monitoramento',
      subtitle: 'Controle de ciclos de varredura periódica e diagnóstico de conexão'
    },
    profiles: {
      title: 'Perfis Monitorados',
      subtitle: 'Gestão de bares, casas de eventos, produtoras e promotores da região'
    },
    discovery: {
      title: 'Descoberta de Novos Perfis',
      subtitle: 'Prospecção automatizada e qualificação de estabelecimentos e organizadores'
    },
    posts: {
      title: 'Publicações Identificadas',
      subtitle: 'Feed de mídias rastreadas e categorizadas com análise de IA'
    },
    opportunities: {
      title: 'Oportunidades Comerciais (CRM)',
      subtitle: 'Pipeline de prospecção, parcerias de ingressos e divulgação Vibz'
    },
    notifications: {
      title: 'Alertas & Notificações',
      subtitle: 'Integração Telegram Bot para disparo imediato de eventos de alta relevância'
    },
    settings: {
      title: 'Configurações do Sistema',
      subtitle: 'Parâmetros de APIs externas (Meta Graph, Gemini, Telegram) e rotinas'
    },
    logs: {
      title: 'Histórico & Logs',
      subtitle: 'Auditoria detalhada de varreduras, chamadas de IA e eventos de sistema'
    }
  };

  const current = titles[activeTab] || titles.dashboard;

  return (
    <header className="h-16 px-4 sm:px-6 bg-[#0E0E14] border-b border-[#1E1E2C] flex items-center justify-between shrink-0">
      <div className="flex items-center gap-3">
        {onToggleMobile && (
          <button
            onClick={onToggleMobile}
            className="p-1.5 rounded-lg bg-[#161622] text-gray-300 hover:text-white md:hidden border border-[#232332]"
            aria-label="Abrir menu de navegação"
          >
            <Menu className="w-4 h-4" />
          </button>
        )}
        <div>
          <h1 className="text-sm sm:text-base font-bold text-white tracking-tight flex items-center gap-2">
            {current.title}
          </h1>
          <p className="text-[10px] sm:text-[11px] text-gray-400 hidden sm:block">{current.subtitle}</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Demo status tag */}
        {isDemoMode ? (
          <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium bg-amber-500/10 text-amber-300 border border-amber-500/20">
            <AlertCircle className="w-3 h-3 text-amber-400" />
            Dados Demonstrativos [DEMO]
          </span>
        ) : (
          <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
            <Sparkles className="w-3 h-3 text-emerald-400" />
            Meta Graph Conectado
          </span>
        )}

        {/* Refresh button */}
        {onRefreshData && (
          <button
            onClick={onRefreshData}
            title="Atualizar dados"
            className="p-2 rounded-lg bg-[#161622] hover:bg-[#1E1E2E] text-gray-400 hover:text-white border border-[#232332] transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Immediate scan trigger */}
        <button
          onClick={onTriggerScan}
          disabled={isScanning}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-[#4C01B5] hover:bg-[#3D0194] text-white shadow-sm transition-all disabled:opacity-60 cursor-pointer disabled:cursor-not-allowed"
        >
          {isScanning ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Varrendo Perfis...</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Executar Varredura Agora</span>
            </>
          )}
        </button>
      </div>
    </header>
  );
};
