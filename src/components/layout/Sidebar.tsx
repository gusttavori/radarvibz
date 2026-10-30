/**
 * Radar Vibz - Sidebar Navigation Component
 */

import React from 'react';
import {
  LayoutDashboard,
  Radar,
  Users,
  Compass,
  FileImage,
  TrendingUp,
  Bell,
  Settings,
  FileText,
  MapPin
} from 'lucide-react';

export type NavTab =
  | 'dashboard'
  | 'monitoring'
  | 'profiles'
  | 'discovery'
  | 'posts'
  | 'opportunities'
  | 'notifications'
  | 'settings'
  | 'logs';

interface SidebarProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  pendingCandidatesCount?: number;
  newOpportunitiesCount?: number;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  pendingCandidatesCount = 0,
  newOpportunitiesCount = 0,
  isMobileOpen = false,
  onCloseMobile
}) => {
  const navItems = [
    { id: 'dashboard' as NavTab, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'monitoring' as NavTab, label: 'Monitoramento', icon: Radar },
    { id: 'profiles' as NavTab, label: 'Perfis Monitorados', icon: Users },
    { id: 'discovery' as NavTab, label: 'Descoberta de Perfis', icon: Compass, badge: pendingCandidatesCount },
    { id: 'posts' as NavTab, label: 'Publicações', icon: FileImage },
    { id: 'opportunities' as NavTab, label: 'Oportunidades (CRM)', icon: TrendingUp, badge: newOpportunitiesCount },
    { id: 'notifications' as NavTab, label: 'Notificações', icon: Bell },
    { id: 'settings' as NavTab, label: 'Configurações', icon: Settings },
    { id: 'logs' as NavTab, label: 'Histórico & Logs', icon: FileText }
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm md:hidden"
        />
      )}

      <aside
        className={`fixed md:static inset-y-0 left-0 z-50 w-64 bg-[#0F0F16] border-r border-[#1E1E2C] flex flex-col h-screen shrink-0 select-none transition-transform duration-300 md:translate-x-0 ${
          isMobileOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        }`}
      >
      {/* Brand Header */}
      <div className="p-5 border-b border-[#1E1E2C] flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-[#4C01B5] flex items-center justify-center text-white shadow-md shadow-[#4C01B5]/30">
          <Radar className="w-5 h-5 text-white animate-pulse" />
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <span className="font-bold tracking-wider text-base text-white">RADAR</span>
            <span className="font-extrabold tracking-wider text-base text-[#9D54FF]">VIBZ</span>
          </div>
          <p className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold">Inteligência Comercial</p>
        </div>
      </div>

      {/* Region Indicator */}
      <div className="px-5 py-3 border-b border-[#1E1E2C]/50 bg-[#13131D]/60 flex items-center gap-2 text-xs text-gray-300">
        <MapPin className="w-3.5 h-3.5 text-[#9D54FF] shrink-0" />
        <span className="truncate">Vitória da Conquista & Região</span>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        <p className="px-3 pb-2 text-[11px] font-semibold tracking-wider text-gray-400 uppercase">Módulos</p>
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                onSelectTab(item.id);
                onCloseMobile?.();
              }}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-medium transition-all ${
                isActive
                  ? 'bg-[#4C01B5] text-white shadow-sm font-semibold'
                  : 'text-gray-300 hover:text-white hover:bg-[#1A1A26]'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-gray-400'}`} />
                <span>{item.label}</span>
              </div>
              {Boolean(item.badge && item.badge > 0) && (
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                    isActive ? 'bg-white text-[#4C01B5]' : 'bg-[#4C01B5]/40 text-[#C495FF]'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer Info */}
      <div className="p-4 border-t border-[#1E1E2C] text-[11px] text-gray-400 flex items-center justify-between">
        <div>
          <p className="font-semibold text-gray-300">Vibz Eventos</p>
          <p className="text-[10px] text-gray-400">Radar de Oportunidades v1.0</p>
        </div>
        <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 ring-4 ring-emerald-500/20" title="Sistema Operacional" />
      </div>
    </aside>
  </>
  );
};
