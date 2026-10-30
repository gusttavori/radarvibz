/**
 * Radar Vibz - In-Memory & Persistent Storage Engine
 * Responsável pelas operações atômicas, consultas e estatísticas
 */

import fs from 'node:fs';
import path from 'node:path';
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
import {
  INITIAL_SETTINGS,
  INITIAL_PROFILES,
  INITIAL_PUBLICATIONS,
  INITIAL_OPPORTUNITIES,
  INITIAL_CANDIDATES,
  INITIAL_MONITORING_LOGS,
  INITIAL_SYSTEM_LOGS
} from './seeds';

interface DatabaseSchema {
  settings: AppSettings;
  profiles: Profile[];
  publications: Publication[];
  opportunities: Opportunity[];
  candidates: ProfileCandidate[];
  monitoringLogs: MonitoringCycleLog[];
  systemLogs: SystemLog[];
}

class RadarDatabase {
  private data: DatabaseSchema;
  private dbFilePath: string;

  constructor() {
    const dataDir = path.resolve(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      try {
        fs.mkdirSync(dataDir, { recursive: true });
      } catch {
        // Fallback for restricted environments
      }
    }
    this.dbFilePath = path.join(dataDir, 'radar_db.json');
    this.data = this.loadOrSeed();
  }

  private loadOrSeed(): DatabaseSchema {
    if (fs.existsSync(this.dbFilePath)) {
      try {
        const raw = fs.readFileSync(this.dbFilePath, 'utf-8');
        const parsed = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.profiles)) {
          return parsed;
        }
      } catch (err) {
        console.error('Failed to parse database file, falling back to seed data:', err);
      }
    }

    const initialData: DatabaseSchema = {
      settings: JSON.parse(JSON.stringify(INITIAL_SETTINGS)),
      profiles: JSON.parse(JSON.stringify(INITIAL_PROFILES)),
      publications: JSON.parse(JSON.stringify(INITIAL_PUBLICATIONS)),
      opportunities: JSON.parse(JSON.stringify(INITIAL_OPPORTUNITIES)),
      candidates: JSON.parse(JSON.stringify(INITIAL_CANDIDATES)),
      monitoringLogs: JSON.parse(JSON.stringify(INITIAL_MONITORING_LOGS)),
      systemLogs: JSON.parse(JSON.stringify(INITIAL_SYSTEM_LOGS))
    };

    this.saveData(initialData);
    return initialData;
  }

  private saveData(dataToSave?: DatabaseSchema) {
    try {
      const data = dataToSave || this.data;
      fs.writeFileSync(this.dbFilePath, JSON.stringify(data, null, 2), 'utf-8');
    } catch (err) {
      console.warn('Could not persist to disk, running in-memory:', err);
    }
  }

  // Settings
  public getSettings(): AppSettings {
    return this.data.settings;
  }

  public updateSettings(partial: Partial<AppSettings>): AppSettings {
    this.data.settings = {
      ...this.data.settings,
      ...partial,
      instagram: { ...this.data.settings.instagram, ...(partial.instagram || {}) },
      gemini: { ...this.data.settings.gemini, ...(partial.gemini || {}) },
      telegram: { ...this.data.settings.telegram, ...(partial.telegram || {}) },
      monitoring: { ...this.data.settings.monitoring, ...(partial.monitoring || {}) }
    };
    this.saveData();
    return this.data.settings;
  }

  // Profiles
  public getProfiles(filters?: { category?: string; city?: string; status?: string; search?: string }): Profile[] {
    let list = [...this.data.profiles];
    if (filters?.category) {
      list = list.filter(p => p.category.toLowerCase() === filters.category!.toLowerCase());
    }
    if (filters?.city) {
      list = list.filter(p => p.city.toLowerCase() === filters.city!.toLowerCase());
    }
    if (filters?.status) {
      list = list.filter(p => p.monitoringStatus === filters.status);
    }
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      list = list.filter(p => p.username.toLowerCase().includes(q) || p.displayName.toLowerCase().includes(q));
    }
    return list;
  }

  public getProfileById(id: string): Profile | undefined {
    return this.data.profiles.find(p => p.id === id);
  }

  public getProfileByUsername(username: string): Profile | undefined {
    const clean = username.trim().replace(/^@/, '').toLowerCase();
    return this.data.profiles.find(p => p.username.toLowerCase() === clean);
  }

  public createProfile(profile: Omit<Profile, 'id' | 'createdAt' | 'totalPostsFound'>): { success: boolean; profile?: Profile; error?: string } {
    const cleanUsername = profile.username.trim().replace(/^@/, '').toLowerCase();
    if (!cleanUsername) {
      return { success: false, error: 'O nome de usuário do Instagram é obrigatório.' };
    }

    if (this.getProfileByUsername(cleanUsername)) {
      return { success: false, error: `O perfil @${cleanUsername} já está cadastrado no Radar Vibz.` };
    }

    const newProfile: Profile = {
      ...profile,
      id: `prof-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      username: cleanUsername,
      createdAt: new Date().toISOString(),
      totalPostsFound: 0,
      isDemo: false
    };

    this.data.profiles.unshift(newProfile);
    this.logSystem('PROFILES', 'INFO', `Perfil @${cleanUsername} cadastrado com sucesso.`);
    this.saveData();
    return { success: true, profile: newProfile };
  }

  public updateProfile(id: string, updates: Partial<Profile>): { success: boolean; profile?: Profile; error?: string } {
    const idx = this.data.profiles.findIndex(p => p.id === id);
    if (idx === -1) {
      return { success: false, error: 'Perfil não encontrado.' };
    }

    if (updates.username) {
      const cleanUsername = updates.username.trim().replace(/^@/, '').toLowerCase();
      const existing = this.getProfileByUsername(cleanUsername);
      if (existing && existing.id !== id) {
        return { success: false, error: `O usuário @${cleanUsername} já está em uso por outro perfil.` };
      }
      updates.username = cleanUsername;
    }

    this.data.profiles[idx] = {
      ...this.data.profiles[idx],
      ...updates
    };

    this.saveData();
    return { success: true, profile: this.data.profiles[idx] };
  }

  public deleteProfile(id: string): boolean {
    const initialLen = this.data.profiles.length;
    this.data.profiles = this.data.profiles.filter(p => p.id !== id);
    if (this.data.profiles.length !== initialLen) {
      this.saveData();
      return true;
    }
    return false;
  }

  // Publications
  public getPublications(filters?: {
    profileId?: string;
    mediaType?: string;
    relevance?: string;
    analysisStatus?: string;
    isReviewed?: boolean;
    search?: string;
  }): Publication[] {
    let list = [...this.data.publications];
    if (filters?.profileId) {
      list = list.filter(p => p.profileId === filters.profileId);
    }
    if (filters?.mediaType) {
      list = list.filter(p => p.mediaType === filters.mediaType);
    }
    if (filters?.relevance) {
      list = list.filter(p => p.relevance === filters.relevance);
    }
    if (filters?.analysisStatus) {
      list = list.filter(p => p.analysisStatus === filters.analysisStatus);
    }
    if (filters?.isReviewed !== undefined) {
      list = list.filter(p => p.isReviewed === filters.isReviewed);
    }
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      list = list.filter(p => p.caption.toLowerCase().includes(q) || p.username.toLowerCase().includes(q));
    }
    return list.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
  }

  public getPublicationById(id: string): Publication | undefined {
    return this.data.publications.find(p => p.id === id);
  }

  public getPublicationByExternalId(externalId: string): Publication | undefined {
    return this.data.publications.find(p => p.externalId === externalId);
  }

  public insertPublication(pub: Omit<Publication, 'id' | 'detectedAt'>): { created: boolean; publication: Publication } {
    const existing = this.getPublicationByExternalId(pub.externalId);
    if (existing) {
      return { created: false, publication: existing };
    }

    const newPub: Publication = {
      ...pub,
      id: `pub-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      detectedAt: new Date().toISOString()
    };

    this.data.publications.unshift(newPub);

    // Update profile count
    const prof = this.data.profiles.find(p => p.id === pub.profileId || p.username === pub.username);
    if (prof) {
      prof.totalPostsFound = (prof.totalPostsFound || 0) + 1;
      prof.lastPostAt = pub.publishedAt;
      prof.lastCheckedAt = new Date().toISOString();
    }

    this.saveData();
    return { created: true, publication: newPub };
  }

  public updatePublication(id: string, updates: Partial<Publication>): Publication | undefined {
    const idx = this.data.publications.findIndex(p => p.id === id);
    if (idx === -1) return undefined;
    this.data.publications[idx] = {
      ...this.data.publications[idx],
      ...updates
    };
    this.saveData();
    return this.data.publications[idx];
  }

  // Opportunities
  public getOpportunities(filters?: {
    status?: string;
    city?: string;
    relevance?: string;
    category?: string;
    search?: string;
  }): Opportunity[] {
    let list = [...this.data.opportunities];
    if (filters?.status) {
      list = list.filter(o => o.status === filters.status);
    }
    if (filters?.city) {
      list = list.filter(o => o.city.toLowerCase() === filters.city!.toLowerCase());
    }
    if (filters?.relevance) {
      list = list.filter(o => o.relevance === filters.relevance);
    }
    if (filters?.category) {
      list = list.filter(o => o.category.toLowerCase() === filters.category!.toLowerCase());
    }
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      list = list.filter(o =>
        o.eventName.toLowerCase().includes(q) ||
        o.username.toLowerCase().includes(q) ||
        o.summary.toLowerCase().includes(q)
      );
    }
    return list.sort((a, b) => new Date(b.detectedAt).getTime() - new Date(a.detectedAt).getTime());
  }

  public getOpportunityById(id: string): Opportunity | undefined {
    return this.data.opportunities.find(o => o.id === id);
  }

  public createOpportunity(opp: Omit<Opportunity, 'id' | 'detectedAt' | 'contactLogs'>): Opportunity {
    // Avoid duplicate opportunity for same publication
    const existing = this.data.opportunities.find(o => o.publicationId === opp.publicationId);
    if (existing) {
      return existing;
    }

    const newOpp: Opportunity = {
      ...opp,
      id: `opp-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      detectedAt: new Date().toISOString(),
      contactLogs: []
    };

    this.data.opportunities.unshift(newOpp);
    this.logSystem('MONITORING', 'SUCCESS', `Nova oportunidade criada: ${newOpp.eventName} (@${newOpp.username})`);
    this.saveData();
    return newOpp;
  }

  public updateOpportunity(id: string, updates: Partial<Opportunity>): Opportunity | undefined {
    const idx = this.data.opportunities.findIndex(o => o.id === id);
    if (idx === -1) return undefined;
    this.data.opportunities[idx] = {
      ...this.data.opportunities[idx],
      ...updates
    };
    this.saveData();
    return this.data.opportunities[idx];
  }

  public addContactLog(opportunityId: string, log: Omit<ContactLog, 'id' | 'date'>): ContactLog | undefined {
    const opp = this.getOpportunityById(opportunityId);
    if (!opp) return undefined;

    const newLog: ContactLog = {
      ...log,
      id: `cl-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      date: new Date().toISOString()
    };

    if (!opp.contactLogs) {
      opp.contactLogs = [];
    }
    opp.contactLogs.unshift(newLog);
    this.saveData();
    return newLog;
  }

  // Profile Candidates (Discovery)
  public getCandidates(status?: string): ProfileCandidate[] {
    let list = [...this.data.candidates];
    if (status) {
      list = list.filter(c => c.status === status);
    }
    return list.sort((a, b) => new Date(b.discoveredAt).getTime() - new Date(a.discoveredAt).getTime());
  }

  public addCandidate(candidate: Omit<ProfileCandidate, 'id' | 'discoveredAt' | 'status'>): ProfileCandidate {
    const cleanUsername = candidate.username.trim().replace(/^@/, '').toLowerCase();
    const isAlreadyMonitored = !!this.getProfileByUsername(cleanUsername);

    const newCand: ProfileCandidate = {
      ...candidate,
      username: cleanUsername,
      id: `cand-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      discoveredAt: new Date().toISOString(),
      status: isAlreadyMonitored ? 'Já cadastrado' : 'Pendente'
    };

    this.data.candidates.unshift(newCand);
    this.saveData();
    return newCand;
  }

  public approveCandidate(candidateId: string): { success: boolean; profile?: Profile; error?: string } {
    const cand = this.data.candidates.find(c => c.id === candidateId);
    if (!cand) {
      return { success: false, error: 'Candidato não encontrado.' };
    }

    const result = this.createProfile({
      username: cand.username,
      displayName: cand.displayName,
      profileUrl: `https://instagram.com/${cand.username}`,
      category: cand.probableCategory,
      city: cand.city,
      state: cand.state,
      description: `Identificado via descoberta: ${cand.justification}`,
      internalNotes: `Origem: ${cand.source}`,
      monitoringStatus: 'active',
      integrationMethod: 'demo_simulation',
      followersCount: cand.followersEstimated || 5000,
      isDemo: cand.isDemo ?? false
    });

    if (result.success) {
      cand.status = 'Aprovado';
      this.saveData();
    }
    return result;
  }

  public rejectCandidate(candidateId: string): boolean {
    const cand = this.data.candidates.find(c => c.id === candidateId);
    if (!cand) return false;
    cand.status = 'Rejeitado';
    this.saveData();
    return true;
  }

  // Logs
  public getMonitoringLogs(limit = 20): MonitoringCycleLog[] {
    return this.data.monitoringLogs.slice(0, limit);
  }

  public addMonitoringLog(log: Omit<MonitoringCycleLog, 'id' | 'timestamp'>): MonitoringCycleLog {
    const newLog: MonitoringCycleLog = {
      ...log,
      id: `mlog-${Date.now()}`,
      timestamp: new Date().toISOString()
    };
    this.data.monitoringLogs.unshift(newLog);
    if (this.data.monitoringLogs.length > 100) {
      this.data.monitoringLogs.pop();
    }
    this.saveData();
    return newLog;
  }

  public getSystemLogs(limit = 50): SystemLog[] {
    return this.data.systemLogs.slice(0, limit);
  }

  public logSystem(module: SystemLog['module'], level: SystemLog['level'], message: string, metadata?: Record<string, unknown>) {
    const entry: SystemLog = {
      id: `slog-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      timestamp: new Date().toISOString(),
      level,
      module,
      message,
      metadata
    };
    this.data.systemLogs.unshift(entry);
    if (this.data.systemLogs.length > 200) {
      this.data.systemLogs.pop();
    }
    this.saveData();
  }

  // Dashboard Stats
  public getDashboardStats() {
    const totalProfiles = this.data.profiles.length;
    const activeProfiles = this.data.profiles.filter(p => p.monitoringStatus === 'active').length;
    const failedProfiles = this.data.profiles.filter(p => p.monitoringStatus === 'failed').length;
    const pausedProfiles = this.data.profiles.filter(p => p.monitoringStatus === 'paused').length;

    const totalPublications = this.data.publications.length;
    const analyzedPublications = this.data.publications.filter(p => p.analysisStatus === 'analyzed').length;
    const pendingAnalysis = this.data.publications.filter(p => p.analysisStatus === 'pending').length;

    const totalOpportunities = this.data.opportunities.length;
    const highRelevanceOpportunities = this.data.opportunities.filter(o => o.relevance === 'high').length;
    const pendingCandidates = this.data.candidates.filter(c => c.status === 'Pendente').length;

    // Opportunities by category
    const oppsByCategory: Record<string, number> = {};
    for (const opp of this.data.opportunities) {
      const cat = opp.category || 'Outros';
      oppsByCategory[cat] = (oppsByCategory[cat] || 0) + 1;
    }

    // Opportunities by city
    const oppsByCity: Record<string, number> = {};
    for (const opp of this.data.opportunities) {
      const city = opp.city || 'Vitória da Conquista';
      oppsByCity[city] = (oppsByCity[city] || 0) + 1;
    }

    // Most active profiles
    const mostActive = [...this.data.profiles]
      .sort((a, b) => (b.totalPostsFound || 0) - (a.totalPostsFound || 0))
      .slice(0, 5)
      .map(p => ({
        id: p.id,
        username: p.username,
        displayName: p.displayName,
        category: p.category,
        totalPosts: p.totalPostsFound || 0,
        city: p.city
      }));

    // Recent activity & priority opportunities
    const recentPublications = this.data.publications.slice(0, 5);
    const priorityOpportunities = this.data.opportunities
      .filter(o => o.relevance === 'high' && o.status !== 'Convertida' && o.status !== 'Descartada')
      .slice(0, 5);

    const lastLog = this.data.monitoringLogs[0];

    return {
      kpis: {
        totalProfiles,
        activeProfiles,
        failedProfiles,
        pausedProfiles,
        totalPublications,
        analyzedPublications,
        pendingAnalysis,
        totalOpportunities,
        highRelevanceOpportunities,
        pendingCandidates
      },
      monitoringStatus: {
        lastExecution: lastLog ? lastLog.timestamp : this.data.settings.monitoring.lastRunAt,
        nextExecution: this.data.settings.monitoring.nextRunAt,
        lastProfilesChecked: lastLog ? lastLog.profilesChecked : 0,
        lastNewPostsFound: lastLog ? lastLog.newPostsFound : 0,
        lastErrorsCount: lastLog ? lastLog.errorsCount : 0,
        provider: this.data.settings.instagram.providerMode
      },
      oppsByCategory,
      oppsByCity,
      mostActive,
      recentPublications,
      priorityOpportunities
    };
  }

  // Demonstration Data Management
  public resetToDemoData() {
    this.data = {
      settings: JSON.parse(JSON.stringify(INITIAL_SETTINGS)),
      profiles: JSON.parse(JSON.stringify(INITIAL_PROFILES)),
      publications: JSON.parse(JSON.stringify(INITIAL_PUBLICATIONS)),
      opportunities: JSON.parse(JSON.stringify(INITIAL_OPPORTUNITIES)),
      candidates: JSON.parse(JSON.stringify(INITIAL_CANDIDATES)),
      monitoringLogs: JSON.parse(JSON.stringify(INITIAL_MONITORING_LOGS)),
      systemLogs: JSON.parse(JSON.stringify(INITIAL_SYSTEM_LOGS))
    };
    this.saveData();
    return true;
  }

  public clearDemoData() {
    this.data.profiles = this.data.profiles.filter(p => !p.isDemo);
    this.data.publications = this.data.publications.filter(p => !p.isDemo);
    this.data.opportunities = this.data.opportunities.filter(o => !o.isDemo);
    this.data.candidates = this.data.candidates.filter(c => !c.isDemo);
    this.data.monitoringLogs = [];
    this.logSystem('PROFILES', 'WARN', 'Dados demonstrativos foram limpos pelo usuário.');
    this.saveData();
    return true;
  }

  public exportFullBackup(): DatabaseSchema {
    return this.data;
  }
}

export const db = new RadarDatabase();
