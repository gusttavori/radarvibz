/**
 * Radar Vibz - Profiles View (Gerenciamento de Perfis)
 */

import React, { useState } from 'react';
import {
  Users,
  Search,
  Filter,
  Plus,
  FileSpreadsheet,
  Trash2,
  Edit2,
  ExternalLink,
  MapPin,
  Clock,
  Eye,
  CheckCircle,
  X,
  AlertCircle,
  Power
} from 'lucide-react';
import { Profile, ProfileCategory, Publication, Opportunity } from '../types/radar';
import { CategoryBadge, StatusBadge, RelevanceBadge } from '../components/common/Badge';
import { api } from '../client/api';

interface ProfilesViewProps {
  profiles: Profile[];
  loading: boolean;
  onRefresh: () => void;
  onSelectPost?: (post: Publication) => void;
  onSelectOpportunity?: (opp: Opportunity) => void;
}

const CATEGORIES: ProfileCategory[] = [
  'Bar',
  'Casa de eventos',
  'Produtora',
  'Organizador',
  'Divulgador',
  'Artista',
  'Banda',
  'Promotor',
  'Outros'
];

export const ProfilesView: React.FC<ProfilesViewProps> = ({
  profiles,
  loading,
  onRefresh,
  onSelectPost,
  onSelectOpportunity
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedCity, setSelectedCity] = useState<string>('all');

  // Modals & Drawers state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);
  const [selectedProfileDetail, setSelectedProfileDetail] = useState<{
    profile: Profile;
    publications: Publication[];
    opportunities: Opportunity[];
  } | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [editingProfile, setEditingProfile] = useState<Profile | null>(null);

  // Form states
  const [formUsername, setFormUsername] = useState('');
  const [formDisplayName, setFormDisplayName] = useState('');
  const [formCategory, setFormCategory] = useState<ProfileCategory>('Bar');
  const [formCity, setFormCity] = useState('Vitória da Conquista');
  const [formState, setFormState] = useState('BA');
  const [formDescription, setFormDescription] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formFollowers, setFormFollowers] = useState<number>(5000);
  const [formError, setFormError] = useState('');
  const [formSubmitting, setFormSubmitting] = useState(false);

  // CSV modal state
  const [csvText, setCsvText] = useState('');
  const [csvResult, setCsvResult] = useState<string | null>(null);
  const [csvLoading, setCsvLoading] = useState(false);

  // Filter logic
  const filteredProfiles = profiles.filter(p => {
    const matchesSearch =
      searchTerm === '' ||
      p.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.displayName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
    const matchesStatus = selectedStatus === 'all' || p.monitoringStatus === selectedStatus;
    const matchesCity = selectedCity === 'all' || p.city.toLowerCase() === selectedCity.toLowerCase();
    return matchesSearch && matchesCategory && matchesStatus && matchesCity;
  });

  const uniqueCities = Array.from(new Set(profiles.map(p => p.city))).filter(Boolean);

  // Open Add Modal
  const openAddModal = () => {
    setEditingProfile(null);
    setFormUsername('');
    setFormDisplayName('');
    setFormCategory('Bar');
    setFormCity('Vitória da Conquista');
    setFormState('BA');
    setFormDescription('');
    setFormNotes('');
    setFormFollowers(5000);
    setFormError('');
    setIsAddModalOpen(true);
  };

  // Open Edit Modal
  const openEditModal = (p: Profile) => {
    setEditingProfile(p);
    setFormUsername(p.username);
    setFormDisplayName(p.displayName);
    setFormCategory(p.category);
    setFormCity(p.city);
    setFormState(p.state || 'BA');
    setFormDescription(p.description || '');
    setFormNotes(p.internalNotes || '');
    setFormFollowers(p.followersCount || 0);
    setFormError('');
    setIsAddModalOpen(true);
  };

  // Handle Save Profile
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormSubmitting(true);

    try {
      if (editingProfile) {
        await api.updateProfile(editingProfile.id, {
          username: formUsername,
          displayName: formDisplayName,
          category: formCategory,
          city: formCity,
          state: formState,
          description: formDescription,
          internalNotes: formNotes,
          followersCount: Number(formFollowers)
        });
      } else {
        await api.createProfile({
          username: formUsername,
          displayName: formDisplayName,
          category: formCategory,
          city: formCity,
          state: formState,
          description: formDescription,
          internalNotes: formNotes,
          followersCount: Number(formFollowers)
        });
      }
      setIsAddModalOpen(false);
      onRefresh();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Falha ao salvar perfil.');
    } finally {
      setFormSubmitting(false);
    }
  };

  // Toggle monitoring
  const handleToggleMonitoring = async (p: Profile) => {
    const nextStatus = p.monitoringStatus === 'active' ? 'paused' : 'active';
    await api.updateProfile(p.id, { monitoringStatus: nextStatus });
    onRefresh();
  };

  // Delete profile
  const handleDeleteProfile = async (id: string, username: string) => {
    if (confirm(`Tem certeza que deseja remover o perfil @${username} do monitoramento?`)) {
      await api.deleteProfile(id);
      onRefresh();
    }
  };

  // View details
  const handleViewDetail = async (p: Profile) => {
    setLoadingDetail(true);
    try {
      const data = await api.getProfileById(p.id);
      setSelectedProfileDetail(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingDetail(false);
    }
  };

  // Handle CSV Import
  const handleImportCsv = async () => {
    if (!csvText.trim()) return;
    setCsvLoading(true);
    setCsvResult(null);
    try {
      const res = await api.importCsv(csvText);
      setCsvResult(`Importação concluída: ${res.importedCount} importados, ${res.duplicateCount} duplicados ignorados, ${res.errorsCount} erros.`);
      onRefresh();
    } catch (err: unknown) {
      setCsvResult(`Erro: ${err instanceof Error ? err.message : 'Falha ao importar CSV'}`);
    } finally {
      setCsvLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top action row */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="relative flex-1 sm:w-72">
            <Search className="w-4 h-4 text-gray-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Buscar por usuário (@) ou nome..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-[#14141D] border border-[#262635] rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#4C01B5]"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              className="bg-[#14141D] border border-[#262635] text-xs text-gray-300 rounded-lg px-2.5 py-2 focus:outline-none focus:border-[#4C01B5]"
            >
              <option value="all">Todas Categorias</option>
              {CATEGORIES.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>

            <select
              value={selectedCity}
              onChange={e => setSelectedCity(e.target.value)}
              className="bg-[#14141D] border border-[#262635] text-xs text-gray-300 rounded-lg px-2.5 py-2 focus:outline-none focus:border-[#4C01B5]"
            >
              <option value="all">Todas Cidades</option>
              {uniqueCities.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>

            <select
              value={selectedStatus}
              onChange={e => setSelectedStatus(e.target.value)}
              className="bg-[#14141D] border border-[#262635] text-xs text-gray-300 rounded-lg px-2.5 py-2 focus:outline-none focus:border-[#4C01B5]"
            >
              <option value="all">Todos Status</option>
              <option value="active">Ativos</option>
              <option value="paused">Pausados</option>
              <option value="failed">Com Falha</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsCsvModalOpen(true)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold bg-[#181824] hover:bg-[#202030] text-gray-200 border border-[#2A2A3C] transition-colors"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
            <span>Importar CSV</span>
          </button>

          <button
            onClick={openAddModal}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold bg-[#4C01B5] hover:bg-[#3D0194] text-white shadow-sm transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Perfil</span>
          </button>
        </div>
      </div>

      {/* Profiles Table */}
      <div className="bg-[#14141D] border border-[#222230] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#171722] text-gray-400 border-b border-[#222230] uppercase text-[10px] tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-4">Perfil Instagram</th>
                <th className="py-3 px-4">Categoria</th>
                <th className="py-3 px-4">Cidade</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Publicações</th>
                <th className="py-3 px-4">Última Checagem</th>
                <th className="py-3 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1D1D2B]">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-400">
                    Carregando perfis...
                  </td>
                </tr>
              ) : filteredProfiles.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-400">
                    Nenhum perfil encontrado para os filtros selecionados.
                  </td>
                </tr>
              ) : (
                filteredProfiles.map(p => (
                  <tr key={p.id} className="hover:bg-[#181824] transition-colors group">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#4C01B5]/30 border border-[#4C01B5]/50 flex items-center justify-center font-bold text-xs text-[#C495FF]">
                          {p.username.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-white group-hover:text-[#B57CFF] transition-colors">
                              @{p.username}
                            </span>
                            <a
                              href={p.profileUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-gray-500 hover:text-white"
                              title="Abrir no Instagram"
                            >
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                          <span className="text-[11px] text-gray-400 block truncate max-w-[200px]">
                            {p.displayName}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <CategoryBadge category={p.category} />
                    </td>

                    <td className="py-3.5 px-4 text-gray-300">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-gray-500" />
                        <span>{p.city} - {p.state}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <StatusBadge status={p.monitoringStatus} />
                    </td>

                    <td className="py-3.5 px-4 font-semibold text-gray-200">
                      {p.totalPostsFound || 0} posts
                    </td>

                    <td className="py-3.5 px-4 text-gray-400 text-[11px]">
                      {p.lastCheckedAt ? new Date(p.lastCheckedAt).toLocaleString('pt-BR') : 'Nunca'}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleViewDetail(p)}
                          title="Ver histórico e publicações"
                          className="p-1.5 text-gray-400 hover:text-white hover:bg-[#222232] rounded"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => handleToggleMonitoring(p)}
                          title={p.monitoringStatus === 'active' ? 'Pausar monitoramento' : 'Ativar monitoramento'}
                          className={`p-1.5 rounded hover:bg-[#222232] ${p.monitoringStatus === 'active' ? 'text-emerald-400' : 'text-gray-500'}`}
                        >
                          <Power className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => openEditModal(p)}
                          title="Editar perfil"
                          className="p-1.5 text-gray-400 hover:text-white hover:bg-[#222232] rounded"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => handleDeleteProfile(p.id, p.username)}
                          title="Remover perfil"
                          className="p-1.5 text-gray-400 hover:text-rose-400 hover:bg-[#222232] rounded"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Profile Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-[#14141D] border border-[#262638] rounded-xl max-w-lg w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setIsAddModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-sm font-bold text-white mb-1">
              {editingProfile ? 'Editar Perfil Monitorado' : 'Cadastrar Novo Perfil'}
            </h2>
            <p className="text-xs text-gray-400 mb-4">
              Informe os dados do perfil do Instagram para inclusão na rotina de monitoramento comercial.
            </p>

            {formError && (
              <div className="p-3 mb-4 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSaveProfile} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-gray-300 font-medium mb-1">Nome de Usuário (@)</label>
                <div className="flex">
                  <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-[#262635] bg-[#1A1A24] text-gray-400">@</span>
                  <input
                    type="text"
                    required
                    placeholder="ex: arenasudoeste_eventos"
                    value={formUsername}
                    onChange={e => setFormUsername(e.target.value.replace(/^@/, ''))}
                    className="flex-1 bg-[#101016] border border-[#262635] rounded-r-lg px-3 py-2 text-white focus:outline-none focus:border-[#4C01B5]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-300 font-medium mb-1">Nome de Exibição</label>
                <input
                  type="text"
                  required
                  placeholder="ex: Arena Sudoeste Eventos"
                  value={formDisplayName}
                  onChange={e => setFormDisplayName(e.target.value)}
                  className="w-full bg-[#101016] border border-[#262635] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#4C01B5]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-300 font-medium mb-1">Categoria</label>
                  <select
                    value={formCategory}
                    onChange={e => setFormCategory(e.target.value as ProfileCategory)}
                    className="w-full bg-[#101016] border border-[#262635] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#4C01B5]"
                  >
                    {CATEGORIES.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-gray-300 font-medium mb-1">Cidade</label>
                  <input
                    type="text"
                    required
                    placeholder="ex: Vitória da Conquista"
                    value={formCity}
                    onChange={e => setFormCity(e.target.value)}
                    className="w-full bg-[#101016] border border-[#262635] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#4C01B5]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-300 font-medium mb-1">Descrição do Estabelecimento / Perfil</label>
                <textarea
                  rows={2}
                  placeholder="Informações sobre o perfil, público-alvo ou programação..."
                  value={formDescription}
                  onChange={e => setFormDescription(e.target.value)}
                  className="w-full bg-[#101016] border border-[#262635] rounded-lg p-2.5 text-white focus:outline-none focus:border-[#4C01B5]"
                />
              </div>

              <div>
                <label className="block text-gray-300 font-medium mb-1">Observações Internas (Equipe Vibz)</label>
                <input
                  type="text"
                  placeholder="ex: Contato do produtor Marcos: (77) 99999-0000"
                  value={formNotes}
                  onChange={e => setFormNotes(e.target.value)}
                  className="w-full bg-[#101016] border border-[#262635] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#4C01B5]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#222230]">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-[#181824] hover:bg-[#222230] text-gray-300 text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="px-4 py-2 rounded-lg bg-[#4C01B5] hover:bg-[#3D0194] text-white text-xs font-semibold disabled:opacity-50"
                >
                  {formSubmitting ? 'Salvando...' : editingProfile ? 'Salvar Alterações' : 'Cadastrar Perfil'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CSV Import Modal */}
      {isCsvModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-[#14141D] border border-[#262638] rounded-xl max-w-xl w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setIsCsvModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-sm font-bold text-white mb-1 flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              Importação em Massa via CSV
            </h2>
            <p className="text-xs text-gray-400 mb-3">
              Cole abaixo as linhas no formato: <code className="text-[#B57CFF]">username,displayName,category,city,state,description</code>
            </p>

            <div className="bg-[#101016] p-2.5 rounded-lg border border-[#222230] mb-3 text-[11px] text-gray-400">
              <span className="font-semibold text-gray-300 block mb-1">Exemplo de cabeçalho e linhas:</span>
              <pre className="text-gray-500 overflow-x-auto">
{`username,displayName,category,city,state,description
bar_do_parque,Bar do Parque,Bar,Vitória da Conquista,BA,Petiscaria com música
arena_lounge_vca,Arena Lounge,Casa de eventos,Vitória da Conquista,BA,Shows`}
              </pre>
            </div>

            <textarea
              rows={6}
              placeholder="Cole aqui o conteúdo CSV..."
              value={csvText}
              onChange={e => setCsvText(e.target.value)}
              className="w-full bg-[#101016] border border-[#262635] rounded-lg p-3 text-xs text-white focus:outline-none focus:border-[#4C01B5] mb-3 font-mono"
            />

            {csvResult && (
              <div className="p-3 mb-3 rounded-lg bg-[#1B1B26] border border-[#262635] text-xs text-gray-200">
                {csvResult}
              </div>
            )}

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsCsvModalOpen(false)}
                className="px-4 py-2 rounded-lg bg-[#181824] hover:bg-[#222230] text-gray-300 text-xs font-semibold"
              >
                Fechar
              </button>
              <button
                type="button"
                onClick={handleImportCsv}
                disabled={csvLoading || !csvText.trim()}
                className="px-4 py-2 rounded-lg bg-[#4C01B5] hover:bg-[#3D0194] text-white text-xs font-semibold disabled:opacity-50"
              >
                {csvLoading ? 'Processando CSV...' : 'Executar Importação'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Profile Detail Drawer */}
      {selectedProfileDetail && (
        <div className="fixed inset-0 z-50 bg-black/60 flex justify-end">
          <div className="bg-[#14141D] border-l border-[#262638] w-full max-w-xl h-full p-6 overflow-y-auto shadow-2xl relative">
            <button
              onClick={() => setSelectedProfileDetail(null)}
              className="absolute top-5 right-5 text-gray-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-[#4C01B5]/30 border border-[#4C01B5]/60 flex items-center justify-center font-bold text-lg text-[#C495FF]">
                {selectedProfileDetail.profile.username.charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 className="text-base font-bold text-white">
                  @{selectedProfileDetail.profile.username}
                </h2>
                <p className="text-xs text-gray-400">{selectedProfileDetail.profile.displayName}</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mb-6">
              <CategoryBadge category={selectedProfileDetail.profile.category} />
              <StatusBadge status={selectedProfileDetail.profile.monitoringStatus} />
              <span className="text-xs bg-[#1C1C28] text-gray-300 px-2 py-0.5 rounded border border-[#262638]">
                {selectedProfileDetail.profile.city} - {selectedProfileDetail.profile.state}
              </span>
              <a
                href={selectedProfileDetail.profile.profileUrl}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-[#9D54FF] hover:underline flex items-center gap-1 ml-auto"
              >
                <span>Instagram Oficial</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            {selectedProfileDetail.profile.description && (
              <div className="bg-[#181824] p-3 rounded-lg border border-[#222230] mb-4 text-xs">
                <span className="text-[10px] text-gray-500 uppercase font-semibold block mb-1">Descrição</span>
                <p className="text-gray-300">{selectedProfileDetail.profile.description}</p>
              </div>
            )}

            {selectedProfileDetail.profile.internalNotes && (
              <div className="bg-[#181824] p-3 rounded-lg border border-[#222230] mb-6 text-xs">
                <span className="text-[10px] text-amber-500 uppercase font-semibold block mb-1">Notas Internas Vibz</span>
                <p className="text-gray-300">{selectedProfileDetail.profile.internalNotes}</p>
              </div>
            )}

            {/* Sub-tabs: Publicações and Oportunidades */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center justify-between border-b border-[#222230] pb-2">
                <span>Publicações Rastreadas ({selectedProfileDetail.publications.length})</span>
              </h3>

              {selectedProfileDetail.publications.length === 0 ? (
                <p className="text-xs text-gray-500 italic py-4">Nenhuma publicação registrada ainda para este perfil.</p>
              ) : (
                <div className="space-y-3">
                  {selectedProfileDetail.publications.map(pub => (
                    <div
                      key={pub.id}
                      onClick={() => onSelectPost?.(pub)}
                      className="p-3 bg-[#181824] hover:bg-[#1E1E2C] rounded-lg border border-[#222230] transition-colors cursor-pointer text-xs"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-gray-400 text-[11px]">
                          {new Date(pub.publishedAt).toLocaleDateString('pt-BR')} • {pub.mediaType}
                        </span>
                        <RelevanceBadge relevance={pub.relevance} />
                      </div>
                      <p className="text-gray-200 line-clamp-2">{pub.caption || '(Sem legenda)'}</p>
                    </div>
                  ))}
                </div>
              )}

              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center justify-between border-b border-[#222230] pb-2 pt-4">
                <span>Oportunidades Comerciais ({selectedProfileDetail.opportunities.length})</span>
              </h3>

              {selectedProfileDetail.opportunities.length === 0 ? (
                <p className="text-xs text-gray-500 italic py-4">Nenhuma oportunidade comercial gerada para este perfil.</p>
              ) : (
                <div className="space-y-3">
                  {selectedProfileDetail.opportunities.map(opp => (
                    <div
                      key={opp.id}
                      onClick={() => onSelectOpportunity?.(opp)}
                      className="p-3 bg-[#181824] hover:bg-[#1E1E2C] rounded-lg border border-[#222230] transition-colors cursor-pointer text-xs"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-white">{opp.eventName}</span>
                        <RelevanceBadge relevance={opp.relevance} />
                      </div>
                      <p className="text-gray-300 text-[11px] mb-1">{opp.commercialPotential || opp.summary}</p>
                      <span className="text-[10px] text-gray-500">Status: {opp.status}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
