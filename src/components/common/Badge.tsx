/**
 * Radar Vibz - Badge Component
 */

import React from 'react';
import { RelevanceLevel, OpportunityStatus, MonitoringStatus } from '../../types/radar';

export const CategoryBadge: React.FC<{ category: string }> = ({ category }) => {
  const styles: Record<string, string> = {
    'Casa de eventos': 'bg-purple-950/60 text-purple-300 border-purple-800/40',
    'Bar': 'bg-amber-950/60 text-amber-300 border-amber-800/40',
    'Produtora': 'bg-blue-950/60 text-blue-300 border-blue-800/40',
    'Organizador': 'bg-indigo-950/60 text-indigo-300 border-indigo-800/40',
    'Divulgador': 'bg-cyan-950/60 text-cyan-300 border-cyan-800/40',
    'Artista': 'bg-pink-950/60 text-pink-300 border-pink-800/40',
    'Banda': 'bg-emerald-950/60 text-emerald-300 border-emerald-800/40',
    'Promotor': 'bg-violet-950/60 text-violet-300 border-violet-800/40',
    'Outros': 'bg-zinc-800/60 text-zinc-300 border-zinc-700/40'
  };

  const style = styles[category] || styles['Outros'];

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium border ${style}`}>
      {category}
    </span>
  );
};

export const RelevanceBadge: React.FC<{ relevance: RelevanceLevel | string }> = ({ relevance }) => {
  const normalized = relevance.toLowerCase();
  if (normalized === 'high' || normalized === 'alta') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 uppercase">
        <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-ping" />
        Alta
      </span>
    );
  }
  if (normalized === 'medium' || normalized === 'média' || normalized === 'media') {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 uppercase">
        Média
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-zinc-800/80 text-zinc-400 border border-zinc-700/50 uppercase">
      Baixa
    </span>
  );
};

export const StatusBadge: React.FC<{ status: MonitoringStatus | string }> = ({ status }) => {
  if (status === 'active' || status === 'ativo') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-950/50 text-emerald-300 border border-emerald-800/50">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
        Ativo
      </span>
    );
  }
  if (status === 'paused' || status === 'pausado') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-zinc-800 text-zinc-400 border border-zinc-700">
        <span className="w-1.5 h-1.5 rounded-full bg-zinc-500" />
        Pausado
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-red-950/50 text-red-300 border border-red-800/50">
      <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
      Falha
    </span>
  );
};

export const OpportunityStatusBadge: React.FC<{ status: OpportunityStatus }> = ({ status }) => {
  const styles: Record<OpportunityStatus, string> = {
    'Nova': 'bg-purple-950/70 text-purple-200 border-purple-800/50 font-bold',
    'Em análise': 'bg-blue-950/70 text-blue-200 border-blue-800/50',
    'Contato necessário': 'bg-amber-950/70 text-amber-200 border-amber-800/50 font-semibold',
    'Em negociação': 'bg-indigo-950/70 text-indigo-200 border-indigo-800/50 font-semibold',
    'Convertida': 'bg-emerald-950/70 text-emerald-200 border-emerald-800/50 font-bold',
    'Descartada': 'bg-zinc-800 text-zinc-400 border-zinc-700'
  };

  const style = styles[status] || 'bg-zinc-800 text-zinc-300 border-zinc-700';

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] border ${style}`}>
      {status}
    </span>
  );
};
