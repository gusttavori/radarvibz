/**
 * Radar Vibz - Aplicação Principal
 * Sistema de inteligência e monitoramento de oportunidades do Instagram para o Vibz Eventos
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar, NavTab } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { DashboardView } from './views/DashboardView';
import { ProfilesView } from './views/ProfilesView';
import { MonitoringView } from './views/MonitoringView';
import { DiscoveryView } from './views/DiscoveryView';
import { PostsView } from './views/PostsView';
import { OpportunitiesView } from './views/OpportunitiesView';
import { NotificationsView } from './views/NotificationsView';
import { SettingsView } from './views/SettingsView';
import { LogsView } from './views/LogsView';
import { api, DashboardStats } from './client/api';
import {
  Profile,
  Publication,
  Opportunity,
  ProfileCandidate,
  MonitoringCycleLog,
  SystemLog,
  AppSettings
} from './types/radar';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Application Data States
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [publications, setPublications] = useState<Publication[]>([]);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [candidates, setCandidates] = useState<ProfileCandidate[]>([]);
  const [monitoringLogs, setMonitoringLogs] = useState<MonitoringCycleLog[]>([]);
  const [systemLogs, setSystemLogs] = useState<SystemLog[]>([]);
  const [settings, setSettings] = useState<AppSettings | null>(null);

  const [loading, setLoading] = useState(true);
  const [isScanning, setIsScanning] = useState(false);

  // Selected entities for cross-navigation
  const [selectedPost, setSelectedPost] = useState<Publication | null>(null);
  const [selectedOpportunity, setSelectedOpportunity] = useState<Opportunity | null>(null);

  // Toast notification
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 5000);
  };

  // Load all application data
  const loadData = useCallback(async () => {
    try {
      const [
        statsData,
        profilesData,
        postsData,
        oppsData,
        candidatesData,
        mLogs,
        logsData,
        settingsData
      ] = await Promise.all([
        api.getDashboardStats().catch(() => null),
        api.getProfiles().catch(() => []),
        api.getPublications().catch(() => []),
        api.getOpportunities().catch(() => []),
        api.getCandidates().catch(() => []),
        api.getMonitoringLogs().catch(() => []),
        api.getLogs().catch(() => ({ systemLogs: [], monitoringLogs: [] })),
        api.getSettings().catch(() => null)
      ]);

      if (statsData) setStats(statsData);
      setProfiles(profilesData);
      setPublications(postsData);
      setOpportunities(oppsData);
      setCandidates(candidatesData);
      setMonitoringLogs(mLogs.length > 0 ? mLogs : logsData.monitoringLogs);
      setSystemLogs(logsData.systemLogs);
      if (settingsData) setSettings(settingsData);
    } catch (err) {
      console.error('Failed to load application data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Immediate Scan Trigger
  const handleTriggerScan = async () => {
    if (isScanning) return;
    setIsScanning(true);
    try {
      const result = await api.triggerMonitoringCycle();
      showToast(
        'success',
        `Varredura concluída: ${result.profilesChecked} perfis verificados, ${result.newPostsFound} novos posts e ${result.newOpportunitiesCount} novas oportunidades comerciais.`
      );
      await loadData();
    } catch (err: unknown) {
      showToast('error', err instanceof Error ? err.message : 'Falha na varredura');
    } finally {
      setIsScanning(false);
    }
  };

  // Cross-view navigation handlers
  const handleNavigateToPost = (pub: Publication) => {
    setSelectedPost(pub);
    setActiveTab('posts');
  };

  const handleNavigateToOpportunity = (opp: Opportunity) => {
    setSelectedOpportunity(opp);
    setActiveTab('opportunities');
  };

  const pendingCandidatesCount = candidates.filter(c => c.status === 'Pendente').length;
  const newOpportunitiesCount = opportunities.filter(o => o.status === 'Nova').length;
  const isDemo = settings?.instagram.providerMode === 'demo_simulation';

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#0B0B0F] text-[#F3F4F6]">
      {/* Toast Alert */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-xl bg-[#161622] border border-[#2E2E42] text-xs font-semibold shadow-2xl animate-fade-in">
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          )}
          <span className="text-gray-200">{toast.message}</span>
          <button onClick={() => setToast(null)} className="text-gray-500 hover:text-white ml-2">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        pendingCandidatesCount={pendingCandidatesCount}
        newOpportunitiesCount={newOpportunitiesCount}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden min-w-0">
        <Header
          activeTab={activeTab}
          isScanning={isScanning}
          onTriggerScan={handleTriggerScan}
          onRefreshData={loadData}
          isDemoMode={isDemo}
          onToggleMobile={() => setIsMobileSidebarOpen(prev => !prev)}
        />

        <main className="flex-1 overflow-y-auto bg-[#0B0B0F]">
          {activeTab === 'dashboard' && (
            <DashboardView
              stats={stats}
              loading={loading}
              onNavigate={setActiveTab}
              onSelectPost={handleNavigateToPost}
              onSelectOpportunity={handleNavigateToOpportunity}
            />
          )}

          {activeTab === 'monitoring' && (
            <MonitoringView
              logs={monitoringLogs}
              settings={settings}
              isScanning={isScanning}
              onTriggerScan={handleTriggerScan}
              onRefresh={loadData}
            />
          )}

          {activeTab === 'profiles' && (
            <ProfilesView
              profiles={profiles}
              loading={loading}
              onRefresh={loadData}
              onSelectPost={handleNavigateToPost}
              onSelectOpportunity={handleNavigateToOpportunity}
            />
          )}

          {activeTab === 'discovery' && (
            <DiscoveryView
              candidates={candidates}
              loading={loading}
              onRefresh={loadData}
              onCandidateApproved={loadData}
            />
          )}

          {activeTab === 'posts' && (
            <PostsView
              publications={publications}
              loading={loading}
              onRefresh={loadData}
              onSelectOpportunity={handleNavigateToOpportunity}
              selectedPostInitial={selectedPost}
              onClearInitialPost={() => setSelectedPost(null)}
            />
          )}

          {activeTab === 'opportunities' && (
            <OpportunitiesView
              opportunities={opportunities}
              loading={loading}
              onRefresh={loadData}
              selectedOpportunityInitial={selectedOpportunity}
              onClearInitialOpportunity={() => setSelectedOpportunity(null)}
            />
          )}

          {activeTab === 'notifications' && (
            <NotificationsView
              settings={settings}
              logs={systemLogs}
              onRefresh={loadData}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsView
              settings={settings}
              loading={loading}
              onRefresh={loadData}
            />
          )}

          {activeTab === 'logs' && (
            <LogsView
              systemLogs={systemLogs}
              monitoringLogs={monitoringLogs}
              loading={loading}
              onRefresh={loadData}
            />
          )}
        </main>
      </div>
    </div>
  );
}
