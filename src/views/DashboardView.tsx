/**
 * Radar Vibz - Dashboard View
 */

import React from 'react';
import {
  Users,
  Activity,
  AlertTriangle,
  FileImage,
  Sparkles,
  TrendingUp,
  Flame,
  UserPlus,
  ArrowRight,
  ExternalLink,
  Clock,
  MapPin,
  Calendar
} from 'lucide-react';
import { DashboardStats } from '../client/api';
import { CategoryBadge, RelevanceBadge, OpportunityStatusBadge } from '../components/common/Badge';
import { NavTab } from '../components/layout/Sidebar';
import { Publication, Opportunity } from '../types/radar';

interface DashboardViewProps {
  stats: DashboardStats | null;
  loading: boolean;
  onNavigate: (tab: NavTab) => void;
  onSelectPost: (post: Publication) => void;
  onSelectOpportunity: (opp: Opportunity) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  stats,
  loading,
  onNavigate,
  onSelectPost,
  onSelectOpportunity
}) => {
  if (loading || !stats) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[400px] text-gray-400">
        <div className="w-8 h-8 border-2 border-[#4C01B5] border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-xs">Carregando indicadores do Radar Vibz...</p>
      </div>
    );
  }

  const { kpis, monitoringStatus, oppsByCategory, oppsByCity, mostActive, recentPublications, priorityOpportunities } = stats;

  const kpiCards = [
    { label: 'Perfis Cadastrados', value: kpis.totalProfiles, icon: Users, color: 'text-indigo-400', tab: 'profiles' as NavTab },
    { label: 'Perfis Ativos', value: kpis.activeProfiles, icon: Activity, color: 'text-emerald-400', tab: 'profiles' as NavTab },
    { label: 'Com Falha de Acesso', value: kpis.failedProfiles, icon: AlertTriangle, color: 'text-red-400', tab: 'profiles' as NavTab },
    { label: 'Publicações Mapeadas', value: kpis.totalPublications, icon: FileImage, color: 'text-blue-400', tab: 'posts' as NavTab },
    { label: 'Analisadas por IA', value: kpis.analyzedPublications, icon: Sparkles, color: 'text-purple-400', tab: 'posts' as NavTab },
    { label: 'Oportunidades Vibz', value: kpis.totalOpportunities, icon: TrendingUp, color: 'text-violet-400', tab: 'opportunities' as NavTab },
    { label: 'Alta Relevância', value: kpis.highRelevanceOpportunities, icon: Flame, color: 'text-rose-400', tab: 'opportunities' as NavTab },
    { label: 'Candidatos Descoberta', value: kpis.pendingCandidates, icon: UserPlus, color: 'text-amber-400', tab: 'discovery' as NavTab }
  ];

  const totalOpps = Math.max(1, Object.values(oppsByCategory).reduce((a, b) => a + b, 0));

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* 8 Primary KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        {kpiCards.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div
              key={idx}
              onClick={() => onNavigate(kpi.tab)}
              className="bg-[#14141D] border border-[#222230] hover:border-[#38384E] p-4 rounded-xl transition-all cursor-pointer group shadow-sm"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-medium text-gray-400 group-hover:text-gray-200 transition-colors">
                  {kpi.label}
                </span>
                <Icon className={`w-4 h-4 ${kpi.color}`} />
              </div>
              <div className="text-2xl font-bold tracking-tight text-white">{kpi.value}</div>
            </div>
          );
        })}
      </div>

      {/* Monitoring Engine Health Strip */}
      <div className="bg-[#14141D] border border-[#222230] rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#4C01B5]/20 border border-[#4C01B5]/40 flex items-center justify-center text-[#9D54FF]">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xs font-semibold text-white">Status da Rotina de Monitoramento</h3>
            <p className="text-[11px] text-gray-400">
              Última execução:{' '}
              <span className="text-gray-200 font-medium">
                {monitoringStatus.lastExecution ? new Date(monitoringStatus.lastExecution).toLocaleTimeString('pt-BR') : 'Sem dados'}
              </span>{' '}
              • Próxima:{' '}
              <span className="text-[#9D54FF] font-medium">
                {monitoringStatus.nextExecution ? new Date(monitoringStatus.nextExecution).toLocaleTimeString('pt-BR') : 'Agendada'}
              </span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-6 text-xs text-gray-300">
          <div>
            <span className="text-gray-500 block text-[10px] uppercase font-semibold">Perfis Verificados</span>
            <span className="font-bold text-white text-sm">{monitoringStatus.lastProfilesChecked}</span>
          </div>
          <div className="border-l border-[#262638] pl-6">
            <span className="text-gray-500 block text-[10px] uppercase font-semibold">Novas Publicações</span>
            <span className="font-bold text-emerald-400 text-sm">+{monitoringStatus.lastNewPostsFound}</span>
          </div>
          <div className="border-l border-[#262638] pl-6">
            <span className="text-gray-500 block text-[10px] uppercase font-semibold">Falhas no Ciclo</span>
            <span className={`font-bold text-sm ${monitoringStatus.lastErrorsCount > 0 ? 'text-rose-400' : 'text-gray-400'}`}>
              {monitoringStatus.lastErrorsCount}
            </span>
          </div>
          <button
            onClick={() => onNavigate('monitoring')}
            className="ml-2 text-xs font-semibold text-[#9D54FF] hover:text-[#B57CFF] flex items-center gap-1 cursor-pointer"
          >
            <span>Ver detalhes</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Grid: Priority Opportunities & Recent Publications */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (7 cols): Priority Opportunities */}
        <div className="lg:col-span-7 bg-[#14141D] border border-[#222230] rounded-xl p-5 flex flex-col">
          <div className="flex items-center justify-between pb-4 border-b border-[#20202E]">
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-rose-400" />
              <h2 className="text-sm font-bold text-white tracking-wide">Oportunidades Prioritárias</h2>
            </div>
            <button
              onClick={() => onNavigate('opportunities')}
              className="text-xs text-[#9D54FF] hover:underline font-semibold flex items-center gap-1"
            >
              <span>Ver todas ({kpis.totalOpportunities})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-[#1D1D2B] flex-1">
            {priorityOpportunities.length === 0 ? (
              <div className="py-12 text-center text-xs text-gray-500">
                Nenhuma oportunidade prioritária pendente no momento.
              </div>
            ) : (
              priorityOpportunities.map(opp => (
                <div
                  key={opp.id}
                  onClick={() => onSelectOpportunity(opp)}
                  className="py-3.5 px-2 hover:bg-[#1B1B27] rounded-lg transition-colors cursor-pointer group"
                >
                  <div className="flex items-start justify-between gap-3 mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white group-hover:text-[#B57CFF] transition-colors">
                        {opp.eventName}
                      </span>
                      <RelevanceBadge relevance={opp.relevance} />
                    </div>
                    <OpportunityStatusBadge status={opp.status} />
                  </div>

                  <p className="text-[11px] text-gray-300 line-clamp-1 mb-2 font-normal">
                    {opp.commercialPotential || opp.summary}
                  </p>

                  <div className="flex flex-wrap items-center gap-3 text-[11px] text-gray-400">
                    <span className="text-gray-300 font-medium">@{opp.username}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-gray-500" />
                      {opp.eventDate ? new Date(opp.eventDate + 'T12:00:00Z').toLocaleDateString('pt-BR') : 'Data a confirmar'}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-gray-500" />
                      {opp.city}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Column (5 cols): Recent Publications */}
        <div className="lg:col-span-5 bg-[#14141D] border border-[#222230] rounded-xl p-5 flex flex-col">
          <div className="flex items-center justify-between pb-4 border-b border-[#20202E]">
            <div className="flex items-center gap-2">
              <FileImage className="w-4 h-4 text-blue-400" />
              <h2 className="text-sm font-bold text-white tracking-wide">Últimas Publicações</h2>
            </div>
            <button
              onClick={() => onNavigate('posts')}
              className="text-xs text-[#9D54FF] hover:underline font-semibold flex items-center gap-1"
            >
              <span>Ver feed</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-[#1D1D2B] flex-1">
            {recentPublications.length === 0 ? (
              <div className="py-12 text-center text-xs text-gray-500">
                Nenhuma publicação mapeada no momento.
              </div>
            ) : (
              recentPublications.map(pub => (
                <div
                  key={pub.id}
                  onClick={() => onSelectPost(pub)}
                  className="py-3 px-2 hover:bg-[#1B1B27] rounded-lg transition-colors cursor-pointer flex gap-3"
                >
                  <img
                    src={pub.thumbnailUrl || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=150&auto=format&fit=crop'}
                    alt="Thumbnail"
                    className="w-12 h-12 object-cover rounded-md border border-[#282838] shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="text-xs font-semibold text-gray-200 truncate">@{pub.username}</span>
                      <RelevanceBadge relevance={pub.relevance} />
                    </div>
                    <p className="text-[11px] text-gray-400 line-clamp-2 leading-relaxed">
                      {pub.caption || '(Sem legenda)'}
                    </p>
                    <div className="text-[10px] text-gray-500 mt-1">
                      {new Date(pub.publishedAt).toLocaleDateString('pt-BR')} • {pub.mediaType}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Analytics Breakdown Row: Categories, Cities, Top Profiles */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Opportunities by Category */}
        <div className="bg-[#14141D] border border-[#222230] rounded-xl p-5">
          <h3 className="text-xs font-bold text-white mb-3">Oportunidades por Categoria</h3>
          <div className="space-y-2.5">
            {Object.entries(oppsByCategory).map(([cat, count]) => {
              const pct = Math.round((count / totalOpps) * 100);
              return (
                <div key={cat} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-300 font-medium">{cat}</span>
                    <span className="text-gray-400 font-semibold">{count} ({pct}%)</span>
                  </div>
                  <div className="w-full bg-[#1F1F2C] h-1.5 rounded-full overflow-hidden">
                    <div className="bg-[#4C01B5] h-full rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Opportunities by City */}
        <div className="bg-[#14141D] border border-[#222230] rounded-xl p-5">
          <h3 className="text-xs font-bold text-white mb-3">Oportunidades por Cidade</h3>
          <div className="space-y-2.5">
            {Object.entries(oppsByCity).map(([city, count]) => {
              const pct = Math.round((count / totalOpps) * 100);
              return (
                <div key={city} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-300 font-medium">{city}</span>
                    <span className="text-gray-400 font-semibold">{count}</span>
                  </div>
                  <div className="w-full bg-[#1F1F2C] h-1.5 rounded-full overflow-hidden">
                    <div className="bg-[#9D54FF] h-full rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Most Active Profiles */}
        <div className="bg-[#14141D] border border-[#222230] rounded-xl p-5">
          <h3 className="text-xs font-bold text-white mb-3">Perfis Mais Ativos</h3>
          <div className="space-y-3">
            {mostActive.map((prof, i) => (
              <div key={prof.id} className="flex items-center justify-between text-xs py-1">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-[10px] text-gray-500 font-bold w-4">{i + 1}.</span>
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-200 truncate">@{prof.username}</p>
                    <p className="text-[10px] text-gray-400">{prof.category} • {prof.city}</p>
                  </div>
                </div>
                <span className="text-xs font-bold text-[#9D54FF] shrink-0 bg-[#4C01B5]/20 px-2 py-0.5 rounded">
                  {prof.totalPosts} posts
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
