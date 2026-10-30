/**
 * Radar Vibz - Discovery View (Descoberta de Novos Perfis)
 */

import React, { useState } from 'react';
import {
  Compass,
  Search,
  CheckCircle,
  XCircle,
  Plus,
  MapPin,
  ExternalLink,
  Sparkles,
  Info,
  Clock,
  UserCheck
} from 'lucide-react';
import { ProfileCandidate, ProfileCategory } from '../types/radar';
import { CategoryBadge } from '../components/common/Badge';
import { api } from '../client/api';

interface DiscoveryViewProps {
  candidates: ProfileCandidate[];
  loading: boolean;
  onRefresh: () => void;
  onCandidateApproved?: () => void;
}

const REGIONAL_CITIES = [
  'Vitória da Conquista',
  'Jequié',
  'Itabuna',
  'Ilhéus',
  'Brumado',
  'Poções',
  'Itapetinga'
];

export const DiscoveryView: React.FC<DiscoveryViewProps> = ({
  candidates,
  loading,
  onRefresh,
  onCandidateApproved
}) => {
  const [filterCity, setFilterCity] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('');
  const [keyword, setKeyword] = useState('');
  const [searching, setSearching] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('Pendente');

  // Manual candidate modal state
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [manualUser, setManualUser] = useState('');
  const [manualName, setManualName] = useState('');
  const [manualCategory, setManualCategory] = useState<ProfileCategory>('Bar');
  const [manualCity, setManualCity] = useState('Vitória da Conquista');
  const [manualJustification, setManualJustification] = useState('');

  // Handle run discovery search
  const handleRunSearch = async () => {
    setSearching(true);
    try {
      await api.runDiscoverySearch({
        city: filterCity || undefined,
        category: (filterCategory as ProfileCategory) || undefined,
        keyword: keyword || undefined
      });
      onRefresh();
    } catch (err) {
      console.error(err);
    } finally {
      setSearching(false);
    }
  };

  // Handle approve candidate
  const handleApprove = async (cand: ProfileCandidate) => {
    try {
      await api.approveCandidate(cand.id);
      onCandidateApproved?.();
      onRefresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Falha ao aprovar candidato');
    }
  };

  // Handle reject candidate
  const handleReject = async (cand: ProfileCandidate) => {
    try {
      await api.rejectCandidate(cand.id);
      onRefresh();
    } catch (err) {
      console.error(err);
    }
  };

  // Handle create manual candidate
  const handleCreateManual = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualUser || !manualName) return;
    try {
      await api.addCandidate({
        username: manualUser,
        displayName: manualName,
        probableCategory: manualCategory,
        city: manualCity,
        state: 'BA',
        justification: manualJustification || 'Adicionado para qualificação comercial',
        source: 'Indicação Manual da Equipe'
      });
      setIsManualModalOpen(false);
      setManualUser('');
      setManualName('');
      setManualJustification('');
      onRefresh();
    } catch (err) {
      console.error(err);
    }
  };

  const filteredCandidates = candidates.filter(c => {
    if (statusFilter === 'all') return true;
    return c.status === statusFilter;
  });

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Search & Discovery Controls Card */}
      <div className="bg-[#14141D] border border-[#222230] rounded-xl p-5">
        <div className="flex items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#4C01B5]/20 border border-[#4C01B5]/40 flex items-center justify-center text-[#9D54FF]">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white tracking-wide">Busca & Prospecção Regional</h2>
              <p className="text-xs text-gray-400">
                Encontre novos perfis de entretenimento no Sudoeste da Bahia para adicionar à sua esteira de monitoramento.
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsManualModalOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold bg-[#1A1A28] hover:bg-[#222234] text-gray-200 border border-[#2A2A3C] transition-colors"
          >
            <Plus className="w-4 h-4 text-[#9D54FF]" />
            <span>Inserir Candidato Manual</span>
          </button>
        </div>

        {/* Filters Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
          <div>
            <label className="block text-gray-400 mb-1 font-medium">Cidade do Sudoeste</label>
            <select
              value={filterCity}
              onChange={e => setFilterCity(e.target.value)}
              className="w-full bg-[#101016] border border-[#262635] rounded-lg p-2 text-white focus:outline-none focus:border-[#4C01B5]"
            >
              <option value="">Todas as Cidades</option>
              {REGIONAL_CITIES.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-gray-400 mb-1 font-medium">Segmento / Categoria</label>
            <select
              value={filterCategory}
              onChange={e => setFilterCategory(e.target.value)}
              className="w-full bg-[#101016] border border-[#262635] rounded-lg p-2 text-white focus:outline-none focus:border-[#4C01B5]"
            >
              <option value="">Todas Categorias</option>
              <option value="Bar">Bares & Botecos</option>
              <option value="Casa de eventos">Casas de Shows & Arenas</option>
              <option value="Produtora">Produtoras de Eventos</option>
              <option value="Organizador">Organizadores & Atléticas</option>
              <option value="Artista">DJs & Artistas</option>
              <option value="Banda">Bandas</option>
            </select>
          </div>

          <div>
            <label className="block text-gray-400 mb-1 font-medium">Palavra-chave</label>
            <input
              type="text"
              placeholder="ex: Jazz, Micareta, Chopp..."
              value={keyword}
              onChange={e => setKeyword(e.target.value)}
              className="w-full bg-[#101016] border border-[#262635] rounded-lg p-2 text-white focus:outline-none focus:border-[#4C01B5]"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={handleRunSearch}
              disabled={searching}
              className="w-full py-2 px-4 rounded-lg bg-[#4C01B5] hover:bg-[#3D0194] text-white font-semibold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
            >
              <Search className="w-3.5 h-3.5" />
              <span>{searching ? 'Buscando...' : 'Prospectar Candidatos'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tabs by Status */}
      <div className="flex items-center gap-2 border-b border-[#222230] pb-2 text-xs">
        {['Pendente', 'Aprovado', 'Rejeitado', 'all'].map(st => (
          <button
            key={st}
            onClick={() => setStatusFilter(st)}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
              statusFilter === st
                ? 'bg-[#4C01B5] text-white'
                : 'text-gray-400 hover:text-white hover:bg-[#181824]'
            }`}
          >
            {st === 'all' ? 'Todos os Registros' : st}
          </button>
        ))}
      </div>

      {/* Candidates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full py-12 text-center text-gray-500 text-xs">
            Carregando candidatos mapeados...
          </div>
        ) : filteredCandidates.length === 0 ? (
          <div className="col-span-full py-12 text-center text-gray-500 text-xs">
            Nenhum candidato com status "{statusFilter}". Clique em "Prospectar Candidatos" acima.
          </div>
        ) : (
          filteredCandidates.map(cand => (
            <div
              key={cand.id}
              className="bg-[#14141D] border border-[#222230] hover:border-[#333346] rounded-xl p-4 flex flex-col justify-between transition-all"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <h3 className="font-bold text-white text-xs">@{cand.username}</h3>
                    <p className="text-[11px] text-gray-400 truncate max-w-[200px]">{cand.displayName}</p>
                  </div>
                  <CategoryBadge category={cand.probableCategory} />
                </div>

                <div className="flex items-center gap-1.5 text-[11px] text-gray-400 mb-3">
                  <MapPin className="w-3 h-3 text-[#9D54FF]" />
                  <span>{cand.city} - {cand.state}</span>
                </div>

                <div className="bg-[#181824] p-2.5 rounded-lg border border-[#222230] mb-3 text-[11px]">
                  <span className="text-[10px] text-purple-400 font-semibold block mb-0.5 uppercase tracking-wide">
                    Justificativa da Descoberta
                  </span>
                  <p className="text-gray-300 leading-relaxed">{cand.justification}</p>
                </div>

                <div className="text-[10px] text-gray-500 space-y-0.5 mb-4">
                  <p>Fonte: <span className="text-gray-400">{cand.source}</span></p>
                  <p>Identificado em: {new Date(cand.discoveredAt).toLocaleDateString('pt-BR')}</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-[#1F1F2C] flex items-center justify-between">
                <span className="text-[10px] font-semibold text-gray-400">
                  Status: <strong className="text-white">{cand.status}</strong>
                </span>

                {cand.status === 'Pendente' && (
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleReject(cand)}
                      title="Rejeitar candidato"
                      className="p-1.5 text-gray-400 hover:text-rose-400 hover:bg-[#20202E] rounded transition-colors"
                    >
                      <XCircle className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => handleApprove(cand)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#4C01B5] hover:bg-[#3D0194] text-white text-[11px] font-bold shadow-sm transition-colors cursor-pointer"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>Aprovar & Monitorar</span>
                    </button>
                  </div>
                )}

                {cand.status === 'Aprovado' && (
                  <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                    <UserCheck className="w-3.5 h-3.5" />
                    Adicionado ao Monitoramento
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Manual Candidate Modal */}
      {isManualModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-[#14141D] border border-[#262638] rounded-xl max-w-md w-full p-6 shadow-2xl relative">
            <h2 className="text-sm font-bold text-white mb-1">Inserir Candidato Manual</h2>
            <p className="text-xs text-gray-400 mb-4">
              Adicione um perfil do Instagram indicado para avaliação da equipe comercial Vibz.
            </p>

            <form onSubmit={handleCreateManual} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-gray-300 font-medium mb-1">Usuário do Instagram (@)</label>
                <input
                  type="text"
                  required
                  placeholder="ex: novopoint_vca"
                  value={manualUser}
                  onChange={e => setManualUser(e.target.value.replace(/^@/, ''))}
                  className="w-full bg-[#101016] border border-[#262635] rounded-lg p-2.5 text-white focus:outline-none focus:border-[#4C01B5]"
                />
              </div>

              <div>
                <label className="block text-gray-300 font-medium mb-1">Nome do Estabelecimento / Perfil</label>
                <input
                  type="text"
                  required
                  placeholder="ex: Novo Point Lounge"
                  value={manualName}
                  onChange={e => setManualName(e.target.value)}
                  className="w-full bg-[#101016] border border-[#262635] rounded-lg p-2.5 text-white focus:outline-none focus:border-[#4C01B5]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-300 font-medium mb-1">Categoria Provável</label>
                  <select
                    value={manualCategory}
                    onChange={e => setManualCategory(e.target.value as ProfileCategory)}
                    className="w-full bg-[#101016] border border-[#262635] rounded-lg p-2 text-white focus:outline-none focus:border-[#4C01B5]"
                  >
                    <option value="Bar">Bar</option>
                    <option value="Casa de eventos">Casa de eventos</option>
                    <option value="Produtora">Produtora</option>
                    <option value="Organizador">Organizador</option>
                    <option value="Artista">Artista</option>
                    <option value="Banda">Banda</option>
                    <option value="Outros">Outros</option>
                  </select>
                </div>

                <div>
                  <label className="block text-gray-300 font-medium mb-1">Cidade</label>
                  <input
                    type="text"
                    required
                    value={manualCity}
                    onChange={e => setManualCity(e.target.value)}
                    className="w-full bg-[#101016] border border-[#262635] rounded-lg p-2 text-white focus:outline-none focus:border-[#4C01B5]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-300 font-medium mb-1">Justificativa / Motivo da Indicação</label>
                <textarea
                  rows={2}
                  placeholder="Por que este perfil deve ser monitorado pelo Vibz?"
                  value={manualJustification}
                  onChange={e => setManualJustification(e.target.value)}
                  className="w-full bg-[#101016] border border-[#262635] rounded-lg p-2 text-white focus:outline-none focus:border-[#4C01B5]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#222230]">
                <button
                  type="button"
                  onClick={() => setIsManualModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-[#181824] hover:bg-[#222230] text-gray-300 text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-[#4C01B5] hover:bg-[#3D0194] text-white text-xs font-semibold"
                >
                  Salvar Candidato
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
