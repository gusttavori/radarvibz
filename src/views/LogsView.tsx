/**
 * Radar Vibz - System Audit & Execution Logs View
 */

import React, { useState } from 'react';
import {
  FileText,
  Search,
  Filter,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Info,
  AlertTriangle
} from 'lucide-react';
import { SystemLog, MonitoringCycleLog } from '../types/radar';

interface LogsViewProps {
  systemLogs: SystemLog[];
  monitoringLogs: MonitoringCycleLog[];
  loading: boolean;
  onRefresh: () => void;
}

export const LogsView: React.FC<LogsViewProps> = ({
  systemLogs,
  monitoringLogs,
  loading,
  onRefresh
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedModule, setSelectedModule] = useState<string>('all');
  const [selectedLevel, setSelectedLevel] = useState<string>('all');

  const filteredLogs = systemLogs.filter(log => {
    const matchesSearch =
      searchTerm === '' ||
      log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.module.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesModule = selectedModule === 'all' || log.module === selectedModule;
    const matchesLevel = selectedLevel === 'all' || log.level === selectedLevel;
    return matchesSearch && matchesModule && matchesLevel;
  });

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#14141D] border border-[#222230] p-4 rounded-xl">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="w-4 h-4 text-gray-500 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Buscar nos registros de log..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-[#101016] border border-[#262635] rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#4C01B5]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={selectedModule}
            onChange={e => setSelectedModule(e.target.value)}
            className="bg-[#101016] border border-[#262635] text-xs text-gray-300 rounded-lg px-2.5 py-2 focus:outline-none focus:border-[#4C01B5]"
          >
            <option value="all">Todos os Módulos</option>
            <option value="MONITORING">MONITORAMENTO</option>
            <option value="AI_GEMINI">IA GEMINI</option>
            <option value="TELEGRAM">TELEGRAM</option>
            <option value="PROFILES">PERFIS</option>
            <option value="INSTAGRAM_API">INSTAGRAM API</option>
          </select>

          <select
            value={selectedLevel}
            onChange={e => setSelectedLevel(e.target.value)}
            className="bg-[#101016] border border-[#262635] text-xs text-gray-300 rounded-lg px-2.5 py-2 focus:outline-none focus:border-[#4C01B5]"
          >
            <option value="all">Todos os Níveis</option>
            <option value="INFO">INFO</option>
            <option value="SUCCESS">SUCCESS</option>
            <option value="WARN">WARN</option>
            <option value="ERROR">ERROR</option>
          </select>

          <button
            onClick={onRefresh}
            className="p-2 rounded-lg bg-[#181824] hover:bg-[#202030] text-gray-300 border border-[#2A2A3C]"
            title="Recarregar logs"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-[#14141D] border border-[#222230] rounded-xl overflow-hidden">
        <div className="p-4 bg-[#171722] border-b border-[#222230] flex items-center justify-between">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">
            Logs do Sistema ({filteredLogs.length})
          </h3>
          <span className="text-[11px] text-gray-400 font-mono">Retenção de auditoria ativa</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-[#151520] text-gray-400 uppercase text-[10px] tracking-wider border-b border-[#222230]">
              <tr>
                <th className="py-2.5 px-4">Timestamp</th>
                <th className="py-2.5 px-4">Nível</th>
                <th className="py-2.5 px-4">Módulo</th>
                <th className="py-2.5 px-4">Mensagem de Evento</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1D1D2B]">
              {loading ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-gray-500">
                    Carregando eventos de auditoria...
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-gray-500">
                    Nenhum log encontrado para os filtros selecionados.
                  </td>
                </tr>
              ) : (
                filteredLogs.map(log => {
                  const levelColors: Record<string, string> = {
                    INFO: 'text-sky-400 bg-sky-500/10 border-sky-500/20',
                    SUCCESS: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
                    WARN: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
                    ERROR: 'text-rose-400 bg-rose-500/10 border-rose-500/20'
                  };

                  return (
                    <tr key={log.id} className="hover:bg-[#181824] transition-colors">
                      <td className="py-3 px-4 text-gray-400 text-[11px] whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleString('pt-BR')}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border ${levelColors[log.level] || 'text-gray-400'}`}>
                          {log.level}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-[#C495FF] font-semibold whitespace-nowrap">
                        {log.module}
                      </td>
                      <td className="py-3 px-4 text-gray-300 font-sans text-xs">
                        {log.message}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
