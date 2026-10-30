/**
 * Radar Vibz - Type Definitions
 * Sistema de inteligência e monitoramento de oportunidades do Instagram para o Vibz Eventos
 */

export type ProfileCategory =
  | 'Bar'
  | 'Casa de eventos'
  | 'Produtora'
  | 'Organizador'
  | 'Divulgador'
  | 'Artista'
  | 'Banda'
  | 'Promotor'
  | 'Outros';

export type MonitoringStatus = 'active' | 'paused' | 'failed';

export type IntegrationMethod = 'meta_graph_api' | 'business_discovery' | 'demo_simulation';

export interface Profile {
  id: string;
  username: string; // e.g. "vibz.eventos" (without @)
  displayName: string;
  profileUrl: string;
  category: ProfileCategory;
  city: string;
  state: string;
  description: string;
  internalNotes?: string;
  monitoringStatus: MonitoringStatus;
  createdAt: string;
  lastCheckedAt?: string;
  lastPostAt?: string;
  integrationMethod: IntegrationMethod;
  avatarUrl?: string;
  followersCount?: number;
  totalPostsFound?: number;
  isDemo?: boolean;
}

export type MediaType = 'IMAGE' | 'VIDEO' | 'REEL' | 'CAROUSEL_ALBUM' | 'OTHER';

export type AnalysisStatus = 'pending' | 'analyzed' | 'failed' | 'cached';

export type RelevanceLevel = 'high' | 'medium' | 'low' | 'none';

export interface AIAnalysisResult {
  is_event: boolean;
  is_opportunity: boolean;
  category: string;
  relevance: 'high' | 'medium' | 'low';
  event_name: string | null;
  event_date: string | null;
  event_time: string | null;
  venue: string | null;
  city: string | null;
  state: string | null;
  artists: string[];
  organizer: string | null;
  summary: string;
  commercial_opportunity: string;
  suggested_action: string;
  confidence: number;
  missing_information: string[];
}

export interface Publication {
  id: string;
  profileId: string;
  username: string;
  externalId: string; // Unique Instagram Media ID
  originalUrl: string;
  mediaType: MediaType;
  caption: string;
  publishedAt: string;
  detectedAt: string;
  mediaUrl?: string;
  thumbnailUrl?: string;
  analysisStatus: AnalysisStatus;
  relevance: RelevanceLevel;
  aiAnalysis?: AIAnalysisResult;
  isReviewed: boolean;
  isDemo?: boolean;
}

export type OpportunityStatus =
  | 'Nova'
  | 'Em análise'
  | 'Contato necessário'
  | 'Em negociação'
  | 'Convertida'
  | 'Descartada';

export interface ContactLog {
  id: string;
  date: string;
  responsible: string;
  channel: 'WhatsApp' | 'Instagram Direct' | 'Telefone' | 'Email' | 'Presencial';
  notes: string;
}

export interface Opportunity {
  id: string;
  publicationId: string;
  profileId: string;
  username: string;
  eventName: string;
  category: string;
  eventDate: string | null;
  eventTime: string | null;
  city: string;
  venue: string | null;
  artists: string[];
  summary: string;
  originalUrl: string;
  relevance: 'high' | 'medium' | 'low';
  commercialPotential: string;
  suggestedAction: string;
  detectedAt: string;
  status: OpportunityStatus;
  internalNotes: string;
  contactLogs: ContactLog[];
  isDemo?: boolean;
}

export type CandidateStatus = 'Pendente' | 'Aprovado' | 'Rejeitado' | 'Já cadastrado';

export interface ProfileCandidate {
  id: string;
  username: string;
  displayName: string;
  probableCategory: ProfileCategory;
  city: string;
  state: string;
  justification: string;
  source: string;
  discoveredAt: string;
  status: CandidateStatus;
  followersEstimated?: number;
  isDemo?: boolean;
}

export interface MonitoringCycleLog {
  id: string;
  timestamp: string;
  durationMs: number;
  profilesChecked: number;
  newPostsFound: number;
  errorsCount: number;
  status: 'success' | 'partial_failure' | 'failed';
  details: string;
  provider: IntegrationMethod;
}

export interface SystemLog {
  id: string;
  timestamp: string;
  level: 'INFO' | 'WARN' | 'ERROR' | 'SUCCESS';
  module: 'MONITORING' | 'AI_GEMINI' | 'TELEGRAM' | 'PROFILES' | 'INSTAGRAM_API';
  message: string;
  metadata?: Record<string, unknown>;
}

export interface AppSettings {
  instagram: {
    appId: string;
    appSecret: string;
    accessToken: string;
    pageId: string;
    apiVersion: string;
    providerMode: 'demo_simulation' | 'meta_graph_api';
    lastSync?: string;
  };
  gemini: {
    model: string;
    temperature: number;
    enabled: boolean;
    autoAnalyzeNewPosts: boolean;
  };
  telegram: {
    botToken: string;
    chatId: string;
    enabled: boolean;
    minRelevance: 'high' | 'medium';
    allowedCategories: string[];
  };
  monitoring: {
    intervalMinutes: number;
    maxProfilesPerCycle: number;
    autoScheduled: boolean;
    lastRunAt?: string;
    nextRunAt?: string;
  };
}
