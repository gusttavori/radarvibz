/**
 * Radar Vibz - Publications Feed & AI Analysis View
 */

import React, { useState } from 'react';
import {
  FileImage,
  Search,
  Filter,
  Sparkles,
  ExternalLink,
  CheckCircle,
  Calendar,
  MapPin,
  Clock,
  Layers,
  Video,
  Image as ImageIcon,
  Loader2,
  X,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import { Publication, Opportunity } from '../types/radar';
import { RelevanceBadge, CategoryBadge } from '../components/common/Badge';
import { api } from '../client/api';

interface PostsViewProps {
  publications: Publication[];
  loading: boolean;
  onRefresh: () => void;
  onSelectOpportunity?: (opp: Opportunity) => void;
  selectedPostInitial?: Publication | null;
  onClearInitialPost?: () => void;
}

export const PostsView: React.FC<PostsViewProps> = ({
  publications,
  loading,
  onRefresh,
  onSelectOpportunity,
  selectedPostInitial,
  onClearInitialPost
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterRelevance, setFilterRelevance] = useState<string>('all');
  const [filterReviewed, setFilterReviewed] = useState<string>('all');

  const [activeModalPost, setActiveModalPost] = useState<Publication | null>(selectedPostInitial || null);
  const [analyzingPostId, setAnalyzingPostId] = useState<string | null>(null);
  const [relatedOpportunity, setRelatedOpportunity] = useState<Opportunity | null>(null);

  // Sync initial selection
  React.useEffect(() => {
    if (selectedPostInitial) {
      setActiveModalPost(selectedPostInitial);
      // Fetch related opportunity if exists
      api.getOpportunities().then(opps => {
        const found = opps.find(o => o.publicationId === selectedPostInitial.id);
        setRelatedOpportunity(found || null);
      });
      onClearInitialPost?.();
    }
  }, [selectedPostInitial]);

  const handleOpenModal = async (pub: Publication) => {
    setActiveModalPost(pub);
    try {
      const opps = await api.getOpportunities();
      const found = opps.find(o => o.publicationId === pub.id);
      setRelatedOpportunity(found || null);
    } catch {
      setRelatedOpportunity(null);
    }
  };

  const handleTriggerAnalysis = async (pubId: string) => {
    setAnalyzingPostId(pubId);
    try {
      const res = await api.analyzePublication(pubId);
      if (activeModalPost && activeModalPost.id === pubId) {
        setActiveModalPost(res.publication);
        setRelatedOpportunity(res.opportunity);
      }
      onRefresh();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Falha na análise da IA');
    } finally {
      setAnalyzingPostId(null);
    }
  };

  const handleToggleReviewed = async (pub: Publication) => {
    try {
      const nextReviewed = !pub.isReviewed;
      const updated = await api.updatePublication(pub.id, { isReviewed: nextReviewed });
      if (activeModalPost && activeModalPost.id === pub.id) {
        setActiveModalPost(updated);
      }
      onRefresh();
    } catch (err) {
      console.error(err);
    }
  };

  const filteredPosts = publications.filter(p => {
    const matchesSearch =
      searchTerm === '' ||
      p.caption.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.username.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || p.mediaType === filterType;
    const matchesRelevance = filterRelevance === 'all' || p.relevance === filterRelevance;
    const matchesReviewed =
      filterReviewed === 'all' ||
      (filterReviewed === 'reviewed' && p.isReviewed) ||
      (filterReviewed === 'unreviewed' && !p.isReviewed);
    return matchesSearch && matchesType && matchesRelevance && matchesReviewed;
  });

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top filter bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#14141D] border border-[#222230] p-4 rounded-xl">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="w-4 h-4 text-gray-500 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Buscar por legenda ou perfil..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-[#101016] border border-[#262635] rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#4C01B5]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={filterType}
            onChange={e => setFilterType(e.target.value)}
            className="bg-[#101016] border border-[#262635] text-xs text-gray-300 rounded-lg px-2.5 py-2 focus:outline-none focus:border-[#4C01B5]"
          >
            <option value="all">Todos os Tipos de Mídia</option>
            <option value="IMAGE">Fotos</option>
            <option value="CAROUSEL_ALBUM">Carrossel</option>
            <option value="VIDEO">Vídeo / Reel</option>
          </select>

          <select
            value={filterRelevance}
            onChange={e => setFilterRelevance(e.target.value)}
            className="bg-[#101016] border border-[#262635] text-xs text-gray-300 rounded-lg px-2.5 py-2 focus:outline-none focus:border-[#4C01B5]"
          >
            <option value="all">Todas as Relevâncias</option>
            <option value="high">Alta Relevância</option>
            <option value="medium">Média Relevância</option>
            <option value="low">Baixa Relevância</option>
            <option value="none">Não Analisada</option>
          </select>

          <select
            value={filterReviewed}
            onChange={e => setFilterReviewed(e.target.value)}
            className="bg-[#101016] border border-[#262635] text-xs text-gray-300 rounded-lg px-2.5 py-2 focus:outline-none focus:border-[#4C01B5]"
          >
            <option value="all">Revisão: Todas</option>
            <option value="reviewed">Apenas Revisadas</option>
            <option value="unreviewed">Pendentes de Revisão</option>
          </select>
        </div>
      </div>

      {/* Publications Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {loading ? (
          <div className="col-span-full py-16 text-center text-gray-500 text-xs">
            Carregando publicações detectadas...
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="col-span-full py-16 text-center text-gray-500 text-xs">
            Nenhuma publicação encontrada para os critérios selecionados.
          </div>
        ) : (
          filteredPosts.map(pub => {
            const isAnalyzing = analyzingPostId === pub.id;
            return (
              <div
                key={pub.id}
                className="bg-[#14141D] border border-[#222230] hover:border-[#38384E] rounded-xl overflow-hidden flex flex-col justify-between transition-all group"
              >
                <div>
                  {/* Card Media Preview */}
                  <div className="relative aspect-video bg-[#0D0D12] overflow-hidden">
                    <img
                      src={pub.thumbnailUrl || pub.mediaUrl || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop'}
                      alt="Media Thumbnail"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />

                    {/* Media type icon badge */}
                    <div className="absolute top-2.5 left-2.5 flex items-center gap-1 px-2 py-1 rounded bg-black/70 backdrop-blur text-[10px] text-gray-200 font-medium">
                      {pub.mediaType === 'VIDEO' ? (
                        <Video className="w-3 h-3 text-red-400" />
                      ) : pub.mediaType === 'CAROUSEL_ALBUM' ? (
                        <Layers className="w-3 h-3 text-blue-400" />
                      ) : (
                        <ImageIcon className="w-3 h-3 text-emerald-400" />
                      )}
                      <span>{pub.mediaType === 'CAROUSEL_ALBUM' ? 'Carrossel' : pub.mediaType === 'VIDEO' ? 'Vídeo' : 'Foto'}</span>
                    </div>

                    <div className="absolute top-2.5 right-2.5">
                      <RelevanceBadge relevance={pub.relevance} />
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-4 space-y-2.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white group-hover:text-[#B57CFF] transition-colors">
                        @{pub.username}
                      </span>
                      <span className="text-[10px] text-gray-400">
                        {new Date(pub.publishedAt).toLocaleDateString('pt-BR')}
                      </span>
                    </div>

                    <p className="text-gray-300 text-[11px] line-clamp-3 leading-relaxed">
                      {pub.caption || '(Publicação sem legenda)'}
                    </p>

                    {pub.aiAnalysis?.event_name && (
                      <div className="bg-[#181824] p-2 rounded border border-[#262638] text-[11px]">
                        <span className="text-[10px] text-[#9D54FF] font-semibold block uppercase">
                          Evento Detectado pela IA
                        </span>
                        <p className="font-semibold text-white truncate">{pub.aiAnalysis.event_name}</p>
                        <p className="text-gray-400 text-[10px]">
                          {pub.aiAnalysis.event_date ? `Data: ${new Date(pub.aiAnalysis.event_date + 'T12:00:00Z').toLocaleDateString('pt-BR')}` : 'Data a confirmar'}
                          {pub.aiAnalysis.venue ? ` • ${pub.aiAnalysis.venue}` : ''}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Actions */}
                <div className="p-4 pt-0 flex items-center justify-between border-t border-[#1C1C28] mt-3">
                  <button
                    onClick={() => handleToggleReviewed(pub)}
                    className={`flex items-center gap-1 text-[11px] font-medium transition-colors ${
                      pub.isReviewed ? 'text-emerald-400' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>{pub.isReviewed ? 'Revisada' : 'Marcar Revisada'}</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleTriggerAnalysis(pub.id)}
                      disabled={isAnalyzing}
                      title="Analisar ou reprocessar com Google Gemini"
                      className="p-1.5 rounded-lg bg-[#4C01B5]/20 hover:bg-[#4C01B5]/40 text-[#C495FF] border border-[#4C01B5]/30 text-xs transition-colors disabled:opacity-50"
                    >
                      {isAnalyzing ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Sparkles className="w-3.5 h-3.5" />
                      )}
                    </button>

                    <button
                      onClick={() => handleOpenModal(pub)}
                      className="px-3 py-1.5 rounded-lg bg-[#181824] hover:bg-[#222232] text-white text-xs font-semibold border border-[#28283C] transition-colors"
                    >
                      Detalhes
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Post Detail & AI Analysis Modal */}
      {activeModalPost && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#14141D] border border-[#262638] rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl relative">
            <button
              onClick={() => setActiveModalPost(null)}
              className="absolute top-5 right-5 text-gray-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-4">
              <span className="font-bold text-white text-base">@{activeModalPost.username}</span>
              <RelevanceBadge relevance={activeModalPost.relevance} />
              <a
                href={activeModalPost.originalUrl}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-[#9D54FF] hover:underline flex items-center gap-1 ml-auto mr-8"
              >
                <span>Ver no Instagram</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Media Preview */}
              <div>
                <img
                  src={activeModalPost.mediaUrl || activeModalPost.thumbnailUrl || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop'}
                  alt="Post Original"
                  className="w-full rounded-lg object-cover max-h-72 border border-[#222230]"
                />
                <div className="mt-2 flex items-center justify-between text-[11px] text-gray-500">
                  <span>ID: {activeModalPost.externalId}</span>
                  <span>Postado: {new Date(activeModalPost.publishedAt).toLocaleString('pt-BR')}</span>
                </div>
              </div>

              {/* Caption */}
              <div className="bg-[#101016] p-4 rounded-lg border border-[#222230] text-xs flex flex-col justify-between">
                <div>
                  <span className="text-[10px] text-gray-500 uppercase font-semibold block mb-2">
                    Legenda Completa da Publicação
                  </span>
                  <p className="text-gray-200 whitespace-pre-wrap leading-relaxed max-h-56 overflow-y-auto">
                    {activeModalPost.caption || '(Sem legenda)'}
                  </p>
                </div>

                <div className="pt-3 border-t border-[#1C1C28] flex items-center justify-between mt-3">
                  <button
                    onClick={() => handleToggleReviewed(activeModalPost)}
                    className="flex items-center gap-1.5 text-xs text-gray-300 font-medium"
                  >
                    <CheckCircle className={`w-4 h-4 ${activeModalPost.isReviewed ? 'text-emerald-400' : 'text-gray-500'}`} />
                    <span>{activeModalPost.isReviewed ? 'Publicação Marcada como Revisada' : 'Marcar como Revisada'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* AI Gemini Analysis Result Panel */}
            <div className="bg-[#171724] border border-[#262638] rounded-xl p-5 mb-4">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#232336]">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-[#4C01B5]/30 border border-[#4C01B5]/50 flex items-center justify-center text-[#C495FF]">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                      Diagnóstico de Inteligência Artificial (Google Gemini)
                    </h3>
                    <p className="text-[10px] text-gray-400">Modelo: gemini-3.8-flash com responseSchema estruturado</p>
                  </div>
                </div>

                <button
                  onClick={() => handleTriggerAnalysis(activeModalPost.id)}
                  disabled={analyzingPostId === activeModalPost.id}
                  className="px-3 py-1.5 rounded-lg bg-[#4C01B5] hover:bg-[#3D0194] text-white text-xs font-semibold flex items-center gap-1.5 disabled:opacity-50"
                >
                  {analyzingPostId === activeModalPost.id ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Analisando com Gemini...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Reanalisar com IA</span>
                    </>
                  )}
                </button>
              </div>

              {activeModalPost.aiAnalysis ? (
                <div className="space-y-4 text-xs">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="bg-[#101016] p-2.5 rounded-lg border border-[#222230]">
                      <span className="text-[10px] text-gray-500 uppercase block font-semibold">É Evento Real?</span>
                      <span className={`font-bold ${activeModalPost.aiAnalysis.is_event ? 'text-emerald-400' : 'text-gray-400'}`}>
                        {activeModalPost.aiAnalysis.is_event ? 'SIM (Confirmado)' : 'NÃO'}
                      </span>
                    </div>

                    <div className="bg-[#101016] p-2.5 rounded-lg border border-[#222230]">
                      <span className="text-[10px] text-gray-500 uppercase block font-semibold">Oportunidade Comercial?</span>
                      <span className={`font-bold ${activeModalPost.aiAnalysis.is_opportunity ? 'text-[#9D54FF]' : 'text-gray-400'}`}>
                        {activeModalPost.aiAnalysis.is_opportunity ? 'SIM (Elegível)' : 'NÃO'}
                      </span>
                    </div>

                    <div className="bg-[#101016] p-2.5 rounded-lg border border-[#222230]">
                      <span className="text-[10px] text-gray-500 uppercase block font-semibold">Categoria</span>
                      <span className="font-bold text-white">{activeModalPost.aiAnalysis.category}</span>
                    </div>

                    <div className="bg-[#101016] p-2.5 rounded-lg border border-[#222230]">
                      <span className="text-[10px] text-gray-500 uppercase block font-semibold">Nível de Confiança</span>
                      <span className="font-bold text-emerald-400">
                        {Math.round(activeModalPost.aiAnalysis.confidence * 100)}%
                      </span>
                    </div>
                  </div>

                  {activeModalPost.aiAnalysis.event_name && (
                    <div className="bg-[#101016] p-3 rounded-lg border border-[#222230] space-y-2">
                      <div className="flex flex-wrap items-center gap-4 text-gray-300">
                        <div>
                          <span className="text-gray-500 text-[10px] block">Nome do Evento:</span>
                          <strong className="text-white text-sm">{activeModalPost.aiAnalysis.event_name}</strong>
                        </div>
                        <div>
                          <span className="text-gray-500 text-[10px] block">Data do Evento:</span>
                          <strong className="text-white">
                            {activeModalPost.aiAnalysis.event_date
                              ? new Date(activeModalPost.aiAnalysis.event_date + 'T12:00:00Z').toLocaleDateString('pt-BR')
                              : 'Não identificada'}
                          </strong>
                        </div>
                        <div>
                          <span className="text-gray-500 text-[10px] block">Horário:</span>
                          <strong className="text-white">{activeModalPost.aiAnalysis.event_time || 'Não especificado'}</strong>
                        </div>
                        <div>
                          <span className="text-gray-500 text-[10px] block">Local / Espaço:</span>
                          <strong className="text-white">{activeModalPost.aiAnalysis.venue || 'Não especificado'}</strong>
                        </div>
                      </div>

                      {activeModalPost.aiAnalysis.artists && activeModalPost.aiAnalysis.artists.length > 0 && (
                        <div className="pt-2 border-t border-[#1C1C28]">
                          <span className="text-gray-500 text-[10px] block mb-1">Atrações Musicais / Artistas:</span>
                          <div className="flex flex-wrap gap-1">
                            {activeModalPost.aiAnalysis.artists.map((art, i) => (
                              <span key={i} className="px-2 py-0.5 rounded bg-[#202030] text-gray-200 text-[11px]">
                                {art}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="bg-[#101016] p-3 rounded-lg border border-[#222230]">
                    <span className="text-[10px] text-[#C495FF] uppercase font-semibold block mb-1">
                      Potencial Comercial para o Vibz
                    </span>
                    <p className="text-gray-200 leading-relaxed font-medium">
                      {activeModalPost.aiAnalysis.commercial_opportunity || activeModalPost.aiAnalysis.summary}
                    </p>
                  </div>

                  <div className="bg-[#101016] p-3 rounded-lg border border-[#222230]">
                    <span className="text-[10px] text-emerald-400 uppercase font-semibold block mb-1">
                      Ação Comercial Recomendada
                    </span>
                    <p className="text-gray-200 leading-relaxed">
                      {activeModalPost.aiAnalysis.suggested_action}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6 text-xs text-gray-400">
                  Esta publicação ainda não foi processada pela inteligência artificial. Clique em "Reanalisar com IA" acima.
                </div>
              )}
            </div>

            {/* Related Opportunity Shortcut */}
            {relatedOpportunity && (
              <div className="bg-[#4C01B5]/20 border border-[#4C01B5]/40 rounded-xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <TrendingUp className="w-5 h-5 text-[#C495FF]" />
                  <div>
                    <h4 className="text-xs font-bold text-white">
                      Oportunidade Comercial Aberta: {relatedOpportunity.eventName}
                    </h4>
                    <p className="text-[11px] text-gray-300">
                      Status no CRM: <strong className="text-[#C495FF]">{relatedOpportunity.status}</strong>
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setActiveModalPost(null);
                    onSelectOpportunity?.(relatedOpportunity);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-[#4C01B5] hover:bg-[#3D0194] text-white text-xs font-semibold"
                >
                  Abrir no CRM
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
