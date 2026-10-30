/**
 * Radar Vibz - Frontend API Client
 */

import {
  Profile,
  Publication,
  Opportunity,
  ProfileCandidate,
  MonitoringCycleLog,
  SystemLog,
  AppSettings,
  ContactLog
} from '../types/radar';

export interface DashboardStats {
  kpis: {
    totalProfiles: number;
    activeProfiles: number;
    failedProfiles: number;
    pausedProfiles: number;
    totalPublications: number;
    analyzedPublications: number;
    pendingAnalysis: number;
    totalOpportunities: number;
    highRelevanceOpportunities: number;
    pendingCandidates: number;
  };
  monitoringStatus: {
    lastExecution: string;
    nextExecution?: string;
    lastProfilesChecked: number;
    lastNewPostsFound: number;
    lastErrorsCount: number;
    provider: string;
  };
  oppsByCategory: Record<string, number>;
  oppsByCity: Record<string, number>;
  mostActive: Array<{
    id: string;
    username: string;
    displayName: string;
    category: string;
    totalPosts: number;
    city: string;
  }>;
  recentPublications: Publication[];
  priorityOpportunities: Opportunity[];
}

export const api = {
  // Dashboard
  async getDashboardStats(): Promise<DashboardStats> {
    const res = await fetch('/api/dashboard/stats');
    const json = await res.json();
    if (!json.success) throw new Error(json.error || 'Erro ao carregar estatísticas');
    return json.data;
  },

  // Profiles
  async getProfiles(params?: { category?: string; city?: string; status?: string; search?: string }): Promise<Profile[]> {
    const q = new URLSearchParams();
    if (params?.category) q.set('category', params.category);
    if (params?.city) q.set('city', params.city);
    if (params?.status) q.set('status', params.status);
    if (params?.search) q.set('search', params.search);
    const res = await fetch(`/api/profiles?${q.toString()}`);
    const json = await res.json();
    return json.data || [];
  },

  async getProfileById(id: string): Promise<{ profile: Profile; publications: Publication[]; opportunities: Opportunity[] }> {
    const res = await fetch(`/api/profiles/${id}`);
    const json = await res.json();
    if (!json.success) throw new Error(json.error || 'Perfil não encontrado');
    return json.data;
  },

  async createProfile(data: Partial<Profile>): Promise<Profile> {
    const res = await fetch('/api/profiles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error || 'Erro ao cadastrar perfil');
    return json.profile;
  },

  async updateProfile(id: string, updates: Partial<Profile>): Promise<Profile> {
    const res = await fetch(`/api/profiles/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error || 'Erro ao atualizar perfil');
    return json.profile;
  },

  async deleteProfile(id: string): Promise<boolean> {
    const res = await fetch(`/api/profiles/${id}`, { method: 'DELETE' });
    const json = await res.json();
    return json.success;
  },

  async importCsv(csvContent: string): Promise<{ importedCount: number; duplicateCount: number; errorsCount: number }> {
    const res = await fetch('/api/profiles/import-csv', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ csvContent })
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error || 'Falha ao importar CSV');
    return json;
  },

  // Monitoring
  async triggerMonitoringCycle(): Promise<{
    durationMs: number;
    profilesChecked: number;
    newPostsFound: number;
    newOpportunitiesCount: number;
    errorsCount: number;
    details: string;
  }> {
    const res = await fetch('/api/monitoring/run', { method: 'POST' });
    const json = await res.json();
    if (!json.success) throw new Error(json.error || 'Falha ao executar ciclo');
    return json.data;
  },

  async getMonitoringStatus(): Promise<{
    isBusy: boolean;
    settings: AppSettings['monitoring'];
    providerMode: string;
    lastExecution: MonitoringCycleLog | null;
  }> {
    const res = await fetch('/api/monitoring/status');
    const json = await res.json();
    return json.data;
  },

  async getMonitoringLogs(): Promise<MonitoringCycleLog[]> {
    const res = await fetch('/api/monitoring/logs');
    const json = await res.json();
    return json.data || [];
  },

  // Publications
  async getPublications(params?: {
    profileId?: string;
    mediaType?: string;
    relevance?: string;
    analysisStatus?: string;
    isReviewed?: boolean;
    search?: string;
  }): Promise<Publication[]> {
    const q = new URLSearchParams();
    if (params?.profileId) q.set('profileId', params.profileId);
    if (params?.mediaType) q.set('mediaType', params.mediaType);
    if (params?.relevance) q.set('relevance', params.relevance);
    if (params?.analysisStatus) q.set('analysisStatus', params.analysisStatus);
    if (params?.isReviewed !== undefined) q.set('isReviewed', String(params.isReviewed));
    if (params?.search) q.set('search', params.search);
    const res = await fetch(`/api/publications?${q.toString()}`);
    const json = await res.json();
    return json.data || [];
  },

  async analyzePublication(id: string): Promise<{ publication: Publication; opportunity: Opportunity | null }> {
    const res = await fetch(`/api/publications/${id}/analyze`, { method: 'POST' });
    const json = await res.json();
    if (!json.success) throw new Error(json.error || 'Erro ao analisar publicação');
    return json.data;
  },

  async updatePublication(id: string, updates: Partial<Publication>): Promise<Publication> {
    const res = await fetch(`/api/publications/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    const json = await res.json();
    return json.data;
  },

  // Opportunities
  async getOpportunities(params?: {
    status?: string;
    city?: string;
    relevance?: string;
    category?: string;
    search?: string;
  }): Promise<Opportunity[]> {
    const q = new URLSearchParams();
    if (params?.status) q.set('status', params.status);
    if (params?.city) q.set('city', params.city);
    if (params?.relevance) q.set('relevance', params.relevance);
    if (params?.category) q.set('category', params.category);
    if (params?.search) q.set('search', params.search);
    const res = await fetch(`/api/opportunities?${q.toString()}`);
    const json = await res.json();
    return json.data || [];
  },

  async updateOpportunity(id: string, updates: Partial<Opportunity>): Promise<Opportunity> {
    const res = await fetch(`/api/opportunities/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    const json = await res.json();
    return json.data;
  },

  async addContactLog(id: string, data: { responsible: string; channel: string; notes: string }): Promise<ContactLog> {
    const res = await fetch(`/api/opportunities/${id}/contact-logs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error || 'Erro ao registrar contato');
    return json.data;
  },

  // Discovery
  async getCandidates(status?: string): Promise<ProfileCandidate[]> {
    const q = status ? `?status=${encodeURIComponent(status)}` : '';
    const res = await fetch(`/api/discovery/candidates${q}`);
    const json = await res.json();
    return json.data || [];
  },

  async runDiscoverySearch(filters: { city?: string; category?: string; keyword?: string }): Promise<ProfileCandidate[]> {
    const res = await fetch('/api/discovery/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(filters)
    });
    const json = await res.json();
    return json.data || [];
  },

  async approveCandidate(id: string): Promise<Profile> {
    const res = await fetch(`/api/discovery/candidates/${id}/approve`, { method: 'POST' });
    const json = await res.json();
    if (!json.success) throw new Error(json.error || 'Erro ao aprovar candidato');
    return json.data;
  },

  async rejectCandidate(id: string): Promise<boolean> {
    const res = await fetch(`/api/discovery/candidates/${id}/reject`, { method: 'POST' });
    const json = await res.json();
    return json.success;
  },

  async addCandidate(data: Partial<ProfileCandidate>): Promise<ProfileCandidate> {
    const res = await fetch('/api/discovery/candidates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error || 'Erro ao adicionar candidato');
    return json.data;
  },

  // Notifications
  async testTelegramNotification(botToken?: string, chatId?: string): Promise<{ success: boolean; message: string; simulated?: boolean }> {
    const res = await fetch('/api/notifications/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ botToken, chatId })
    });
    return res.json();
  },

  async dispatchOpportunityAlert(opportunityId: string): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`/api/notifications/dispatch/${opportunityId}`, { method: 'POST' });
    return res.json();
  },

  // Settings
  async getSettings(): Promise<AppSettings> {
    const res = await fetch('/api/settings');
    const json = await res.json();
    return json.data;
  },

  async updateSettings(settings: Partial<AppSettings>): Promise<AppSettings> {
    const res = await fetch('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings)
    });
    const json = await res.json();
    return json.data;
  },

  async testInstagram(data?: { accessToken?: string; pageId?: string; apiVersion?: string }): Promise<{ success: boolean; message: string }> {
    const res = await fetch('/api/settings/test-instagram', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data || {})
    });
    return res.json();
  },

  async testGemini(sampleCaption?: string): Promise<{ success: boolean; data?: unknown; error?: string }> {
    const res = await fetch('/api/settings/test-gemini', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sampleCaption })
    });
    return res.json();
  },

  async resetDemoData(): Promise<boolean> {
    const res = await fetch('/api/settings/reset-demo', { method: 'POST' });
    const json = await res.json();
    return json.success;
  },

  async clearDemoData(): Promise<boolean> {
    const res = await fetch('/api/settings/clear-demo', { method: 'POST' });
    const json = await res.json();
    return json.success;
  },

  // Logs
  async getLogs(): Promise<{ systemLogs: SystemLog[]; monitoringLogs: MonitoringCycleLog[] }> {
    const res = await fetch('/api/logs');
    const json = await res.json();
    return json.data;
  }
};
