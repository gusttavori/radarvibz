/**
 * Radar Vibz - Opportunities CRM View
 * Pipeline comercial de prospecção e parcerias do Vibz Eventos
 */

import React, { useState } from 'react';
import {
  TrendingUp,
  Search,
  Filter,
  Calendar,
  MapPin,
  ExternalLink,
  MessageSquare,
  Phone,
  Send,
  Plus,
  Clock,
  CheckCircle,
  X,
  AlertCircle,
  Flame,
  ArrowUpDown
} from 'lucide-react';
import { Opportunity, OpportunityStatus, ContactLog } from '../types/radar';
import { RelevanceBadge, OpportunityStatusBadge, CategoryBadge } from '../components/common/Badge';
import { api } from '../client/api';

interface OpportunitiesViewProps {
  opportunities: Opportunity[];
  loading: boolean;
  onRefresh: () => void;
  selectedOpportunityInitial?: Opportunity | null;
  onClearInitialOpportunity?: () => void;
}

const CRM_STATUSES: OpportunityStatus[] = [
  'Nova',
  'Em análise',
  'Contato necessário',
  'Em negociação',
  'Convertida',
  'Descartada'
];

export const OpportunitiesView: React.FC<OpportunitiesViewProps> = ({
  opportunities,
  loading,
  onRefresh,
  selectedOpportunityInitial,
  onClearInitialOpportunity
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [cityFilter, setCityFilter] = useState<string>('all');
  const [relevanceFilter, setRelevanceFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'pipeline' | 'list'>('pipeline');

  // Selected Opportunity Detail Drawer
  const [activeOpportunity, setActiveOpportunity] = useState<Opportunity | null>(
    selectedOpportunityInitial || null
  );

  // New Contact Log form
  const [isAddingContact, setIsAddingContact] = useState(false);
  const [contactResponsible, setContactResponsible] = useState('Equipe Comercial Vibz');
  const [contactChannel, setContactChannel] = useState<'WhatsApp' | 'Instagram Direct' | 'Telefone' | 'Email' | 'Presencial'>('WhatsApp');
  const [contactNotes, setContactNotes] = useState('');
  const [submittingContact, setSubmittingContact] = useState(false);

  // Telegram dispatch alert
  const [dispatchingTelegram, setDispatchingTelegram] = useState(false);
  const [telegramFeedback, setTelegramFeedback] = useState<string | null>(null);

  // Sync initial selection
  React.useEffect(() => {
    if (selectedOpportunityInitial) {
      setActiveOpportunity(selectedOpportunityInitial);
      onClearInitialOpportunity?.();
    }
  }, [selectedOpportunityInitial]);

  const handleUpdateStatus = async (opp: Opportunity, newStatus: OpportunityStatus) => {
    try {
      const updated = await api.updateOpportunity(opp.id, { status: newStatus });
      if (activeOpportunity && activeOpportunity.id === opp.id) {
        setActiveOpportunity(updated);
      }
      onRefresh();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddContactLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeOpportunity || !contactNotes.trim()) return;

    setSubmittingContact(true);
    try {
      await api.addContactLog(activeOpportunity.id, {
        responsible: contactResponsible,
        channel: contactChannel,
        notes: contactNotes
      });
      // Refresh current opp
      const opps = await api.getOpportunities();
      const refreshed = opps.find(o => o.id === activeOpportunity.id);
      if (refreshed) setActiveOpportunity(refreshed);
      setIsAddingContact(false);
      setContactNotes('');
      onRefresh();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Falha ao registrar contato');
    } finally {
      setSubmittingContact(false);
    }
  };

  const handleDispatchTelegram = async (oppId: string) => {
    setDispatchingTelegram(true);
    setTelegramFeedback(null);
    try {
      const res = await api.dispatchOpportunityAlert(oppId);
      setTelegramFeedback(res.message || 'Alerta despachado com sucesso!');
      setTimeout(() => setTelegramFeedback(null), 4000);
    } catch (err: unknown) {
      setTelegramFeedback(`Erro: ${err instanceof Error ? err.message : 'Falha ao enviar'}`);
    } finally {
      setDispatchingTelegram(false);
    }
  };

  const filteredOpps = opportunities.filter(o => {
    const matchesSearch =
      searchTerm === '' ||
      o.eventName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.summary.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || o.status === statusFilter;
    const matchesCity = cityFilter === 'all' || o.city.toLowerCase() === cityFilter.toLowerCase();
    const matchesRelevance = relevanceFilter === 'all' || o.relevance === relevanceFilter;
    return matchesSearch && matchesStatus && matchesCity && matchesRelevance;
  });

  const uniqueCities = Array.from(new Set(opportunities.map(o => o.city))).filter(Boolean);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#14141D] border border-[#222230] p-4 rounded-xl">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="w-4 h-4 text-gray-500 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Buscar por evento, organizador ou cidade..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-[#101016] border border-[#262635] rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#4C01B5]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="bg-[#101016] border border-[#262635] text-xs text-gray-300 rounded-lg px-2.5 py-2 focus:outline-none focus:border-[#4C01B5]"
          >
            <option value="all">Todos os Status</option>
            {CRM_STATUSES.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          <select
            value={cityFilter}
            onChange={e => setCityFilter(e.target.value)}
            className="bg-[#101016] border border-[#262635] text-xs text-gray-300 rounded-lg px-2.5 py-2 focus:outline-none focus:border-[#4C01B5]"
          >
            <option value="all">Todas as Cidades</option>
            {uniqueCities.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          <select
            value={relevanceFilter}
            onChange={e => setRelevanceFilter(e.target.value)}
            className="bg-[#101016] border border-[#262635] text-xs text-gray-300 rounded-lg px-2.5 py-2 focus:outline-none focus:border-[#4C01B5]"
          >
            <option value="all">Todas as Relevâncias</option>
            <option value="high">Alta Prioridade</option>
            <option value="medium">Média Prioridade</option>
            <option value="low">Baixa</option>
          </select>

          <div className="border-l border-[#262638] pl-2 flex items-center gap-1">
            <button
              onClick={() => setViewMode('pipeline')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold ${viewMode === 'pipeline' ? 'bg-[#4C01B5] text-white' : 'text-gray-400 hover:text-white'}`}
            >
              Pipeline Kanban
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold ${viewMode === 'list' ? 'bg-[#4C01B5] text-white' : 'text-gray-400 hover:text-white'}`}
            >
              Lista
            </button>
          </div>
        </div>
      </div>

      {/* PIPELINE VIEW */}
      {viewMode === 'pipeline' ? (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3.5 overflow-x-auto pb-4">
          {CRM_STATUSES.map(status => {
            const columnOpps = filteredOpps.filter(o => o.status === status);
            return (
              <div key={status} className="bg-[#101016] border border-[#222230] rounded-xl p-3 flex flex-col min-w-[220px]">
                {/* Column Header */}
                <div className="flex items-center justify-between pb-2 mb-3 border-b border-[#20202E]">
                  <h3 className="text-xs font-bold text-gray-200 tracking-tight">{status}</h3>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-[#1A1A26] text-gray-400">
                    {columnOpps.length}
                  </span>
                </div>

                {/* Column Cards */}
                <div className="space-y-2.5 flex-1 overflow-y-auto max-h-[70vh]">
                  {columnOpps.length === 0 ? (
                    <div className="py-8 text-center text-[11px] text-gray-600">
                      Vazio
                    </div>
                  ) : (
                    columnOpps.map(opp => (
                      <div
                        key={opp.id}
                        onClick={() => setActiveOpportunity(opp)}
                        className="bg-[#151520] hover:bg-[#1B1B28] border border-[#242434] hover:border-[#38384E] p-3 rounded-lg cursor-pointer transition-all space-y-2 group"
                      >
                        <div className="flex items-start justify-between gap-1">
                          <RelevanceBadge relevance={opp.relevance} />
                          <span className="text-[10px] text-gray-500 font-mono">
                            {opp.eventDate ? new Date(opp.eventDate + 'T12:00:00Z').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) : 'S/D'}
                          </span>
                        </div>

                        <h4 className="text-xs font-bold text-white group-hover:text-[#B57CFF] transition-colors line-clamp-2">
                          {opp.eventName}
                        </h4>

                        <div className="text-[11px] text-gray-400 space-y-0.5">
                          <p className="truncate">@{opp.username}</p>
                          <p className="text-gray-500 text-[10px] flex items-center gap-1">
                            <MapPin className="w-2.5 h-2.5" />
                            <span className="truncate">{opp.city}</span>
                          </p>
                        </div>

                        {opp.contactLogs && opp.contactLogs.length > 0 && (
                          <div className="pt-2 border-t border-[#1F1F2C] text-[10px] text-[#9D54FF] font-medium flex items-center gap-1">
                            <MessageSquare className="w-3 h-3" />
                            <span>{opp.contactLogs.length} contatos registrados</span>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* LIST VIEW */
        <div className="bg-[#14141D] border border-[#222230] rounded-xl overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#171722] text-gray-400 uppercase text-[10px] tracking-wider font-semibold border-b border-[#222230]">
              <tr>
                <th className="py-3 px-4">Evento & Oportunidade</th>
                <th className="py-3 px-4">Perfil</th>
                <th className="py-3 px-4">Data Prevista</th>
                <th className="py-3 px-4">Cidade / Local</th>
                <th className="py-3 px-4">Relevância</th>
                <th className="py-3 px-4">Status CRM</th>
                <th className="py-3 px-4 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1D1D2B]">
              {filteredOpps.map(opp => (
                <tr
                  key={opp.id}
                  onClick={() => setActiveOpportunity(opp)}
                  className="hover:bg-[#181824] transition-colors cursor-pointer group"
                >
                  <td className="py-3.5 px-4">
                    <span className="font-bold text-white group-hover:text-[#B57CFF] transition-colors block">
                      {opp.eventName}
                    </span>
                    <span className="text-[11px] text-gray-400 line-clamp-1">
                      {opp.commercialPotential || opp.summary}
                    </span>
                  </td>

                  <td className="py-3.5 px-4 text-gray-300">
                    @{opp.username}
                  </td>

                  <td className="py-3.5 px-4 text-gray-300">
                    {opp.eventDate ? new Date(opp.eventDate + 'T12:00:00Z').toLocaleDateString('pt-BR') : 'A confirmar'}
                  </td>

                  <td className="py-3.5 px-4 text-gray-400">
                    {opp.city} {opp.venue ? `(${opp.venue})` : ''}
                  </td>

                  <td className="py-3.5 px-4">
                    <RelevanceBadge relevance={opp.relevance} />
                  </td>

                  <td className="py-3.5 px-4">
                    <OpportunityStatusBadge status={opp.status} />
                  </td>

                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveOpportunity(opp);
                      }}
                      className="px-2.5 py-1 rounded bg-[#1C1C28] hover:bg-[#242436] text-gray-200 text-xs font-semibold"
                    >
                      Abrir CRM
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Opportunity Detail Drawer & CRM Notes */}
      {activeOpportunity && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex justify-end">
          <div className="bg-[#14141D] border-l border-[#262638] w-full max-w-xl h-full p-6 overflow-y-auto shadow-2xl relative flex flex-col justify-between">
            <div>
              <button
                onClick={() => setActiveOpportunity(null)}
                className="absolute top-5 right-5 text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="mb-4">
                <div className="flex items-center gap-2 mb-1.5">
                  <RelevanceBadge relevance={activeOpportunity.relevance} />
                  <CategoryBadge category={activeOpportunity.category} />
                  <span className="text-xs text-gray-400">ID: {activeOpportunity.id}</span>
                </div>
                <h2 className="text-lg font-bold text-white tracking-tight">
                  {activeOpportunity.eventName}
                </h2>
                <p className="text-xs text-gray-400">Identificado em perfil: @{activeOpportunity.username}</p>
              </div>

              {/* Status Selector */}
              <div className="bg-[#181824] p-3 rounded-lg border border-[#222230] mb-5">
                <label className="block text-[11px] font-semibold text-gray-400 mb-1.5 uppercase tracking-wide">
                  Status Comercial (Funil de Vendas Vibz)
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {CRM_STATUSES.map(st => (
                    <button
                      key={st}
                      onClick={() => handleUpdateStatus(activeOpportunity, st)}
                      className={`py-1.5 px-2 rounded text-xs font-bold transition-all ${
                        activeOpportunity.status === st
                          ? 'bg-[#4C01B5] text-white shadow-sm'
                          : 'bg-[#12121A] text-gray-400 hover:text-white border border-[#20202E]'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              {/* Event Metadata */}
              <div className="grid grid-cols-2 gap-3 mb-5 text-xs">
                <div className="bg-[#101016] p-2.5 rounded-lg border border-[#222230]">
                  <span className="text-[10px] text-gray-500 block uppercase font-semibold">Data & Horário</span>
                  <span className="font-bold text-white">
                    {activeOpportunity.eventDate
                      ? new Date(activeOpportunity.eventDate + 'T12:00:00Z').toLocaleDateString('pt-BR')
                      : 'Data não informada'}
                    {activeOpportunity.eventTime ? ` às ${activeOpportunity.eventTime}` : ''}
                  </span>
                </div>

                <div className="bg-[#101016] p-2.5 rounded-lg border border-[#222230]">
                  <span className="text-[10px] text-gray-500 block uppercase font-semibold">Local & Cidade</span>
                  <span className="font-bold text-white truncate block">
                    {activeOpportunity.venue || 'Local a confirmar'} • {activeOpportunity.city}
                  </span>
                </div>
              </div>

              {/* Commercial Potential & Suggested Action */}
              <div className="space-y-3 mb-6">
                <div className="bg-[#181824] p-3 rounded-lg border border-[#262638] text-xs">
                  <span className="text-[10px] text-[#C495FF] uppercase font-bold block mb-1">
                    Potencial Comercial para o Vibz
                  </span>
                  <p className="text-gray-200 leading-relaxed font-medium">
                    {activeOpportunity.commercialPotential || activeOpportunity.summary}
                  </p>
                </div>

                <div className="bg-[#181824] p-3 rounded-lg border border-[#262638] text-xs">
                  <span className="text-[10px] text-emerald-400 uppercase font-bold block mb-1">
                    Ação Comercial Recomendada
                  </span>
                  <p className="text-gray-200 leading-relaxed">
                    {activeOpportunity.suggestedAction || 'Entrar em contato para fechamento.'}
                  </p>
                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  <a
                    href={activeOpportunity.originalUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-[#9D54FF] hover:underline flex items-center gap-1 font-semibold"
                  >
                    <span>Abrir Publicação Original</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>

                  <button
                    onClick={() => handleDispatchTelegram(activeOpportunity.id)}
                    disabled={dispatchingTelegram}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#229ED9]/20 hover:bg-[#229ED9]/30 text-[#229ED9] border border-[#229ED9]/40 text-xs font-semibold cursor-pointer disabled:opacity-50"
                  >
                    <Send className="w-3 h-3" />
                    <span>{dispatchingTelegram ? 'Enviando...' : 'Despachar Telegram'}</span>
                  </button>
                </div>

                {telegramFeedback && (
                  <div className="p-2.5 rounded bg-[#101016] border border-[#262638] text-[11px] text-emerald-300">
                    {telegramFeedback}
                  </div>
                )}
              </div>

              {/* CRM Contact Logs Timeline */}
              <div className="space-y-3 border-t border-[#222230] pt-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5 text-[#9D54FF]" />
                    <span>Histórico de Contatos & Interações ({activeOpportunity.contactLogs?.length || 0})</span>
                  </h3>
                  <button
                    onClick={() => setIsAddingContact(prev => !prev)}
                    className="text-xs text-[#9D54FF] hover:underline font-semibold flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Registrar Contato</span>
                  </button>
                </div>

                {/* Add contact log form */}
                {isAddingContact && (
                  <form onSubmit={handleAddContactLog} className="bg-[#181824] p-3 rounded-lg border border-[#2A2A3E] space-y-2.5 text-xs">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] text-gray-400 mb-0.5">Responsável</label>
                        <input
                          type="text"
                          required
                          value={contactResponsible}
                          onChange={e => setContactResponsible(e.target.value)}
                          className="w-full bg-[#101016] border border-[#262635] rounded p-1.5 text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-gray-400 mb-0.5">Canal</label>
                        <select
                          value={contactChannel}
                          onChange={e => setContactChannel(e.target.value as any)}
                          className="w-full bg-[#101016] border border-[#262635] rounded p-1.5 text-white"
                        >
                          <option value="WhatsApp">WhatsApp</option>
                          <option value="Instagram Direct">Instagram Direct</option>
                          <option value="Telefone">Telefone</option>
                          <option value="Presencial">Visita Presencial</option>
                          <option value="Email">Email</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] text-gray-400 mb-0.5">Notas da Conversa / Proposta</label>
                      <textarea
                        rows={2}
                        required
                        placeholder="ex: Produtor aceitou proposta de 7% e quer testar no evento de novembro..."
                        value={contactNotes}
                        onChange={e => setContactNotes(e.target.value)}
                        className="w-full bg-[#101016] border border-[#262635] rounded p-2 text-white"
                      />
                    </div>

                    <div className="flex justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setIsAddingContact(false)}
                        className="px-2.5 py-1 rounded bg-[#20202E] text-gray-300 text-xs"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        disabled={submittingContact}
                        className="px-3 py-1 rounded bg-[#4C01B5] text-white text-xs font-semibold"
                      >
                        {submittingContact ? 'Gravando...' : 'Salvar Interação'}
                      </button>
                    </div>
                  </form>
                )}

                {/* Timeline list */}
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {!activeOpportunity.contactLogs || activeOpportunity.contactLogs.length === 0 ? (
                    <p className="text-xs text-gray-500 italic py-2">
                      Nenhum contato registrado ainda para esta oportunidade.
                    </p>
                  ) : (
                    activeOpportunity.contactLogs.map(log => (
                      <div key={log.id} className="bg-[#101016] p-2.5 rounded border border-[#20202E] text-xs">
                        <div className="flex items-center justify-between text-[10px] text-gray-400 mb-1">
                          <span className="font-semibold text-white">{log.responsible} ({log.channel})</span>
                          <span>{new Date(log.date).toLocaleString('pt-BR')}</span>
                        </div>
                        <p className="text-gray-300 leading-relaxed">{log.notes}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-[#222230] flex justify-end">
              <button
                onClick={() => setActiveOpportunity(null)}
                className="px-4 py-2 rounded-lg bg-[#181824] hover:bg-[#222230] text-gray-300 text-xs font-semibold"
              >
                Concluir Visualização
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
