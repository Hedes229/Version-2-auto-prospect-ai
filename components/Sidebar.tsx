
import React from 'react';
import { LayoutDashboard, Users, Send, Settings, Database, Sparkles, BarChart3, X } from 'lucide-react';
import { ViewType } from '../types';

interface SidebarProps {
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
  leadCount: number;
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, onViewChange, leadCount, isOpen, onClose }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'pipeline', label: 'Leads & Pipeline', icon: Users },
    { id: 'sources', label: 'Data Sources', icon: Database },
    { id: 'campaigns', label: 'Campaigns', icon: Send },
  ];

  const sidebarClasses = `
    fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-white transform transition-transform duration-300 ease-in-out flex flex-col border-r border-slate-800
    ${isOpen ? 'translate-x-0' : '-translate-x-full'}
    md:translate-x-0 md:static md:h-screen
  `;

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 md:hidden"
          onClick={onClose}
        />
      )}

      <div className={sidebarClasses}>
        <div className="p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
              AutoProspect
            </h1>
          </div>
          <button onClick={onClose} className="md:hidden text-slate-400 hover:text-white">
            <X size={24} />
          </button>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <div
                key={item.id}
                onClick={() => {
                  onViewChange(item.id as ViewType);
                  onClose();
                }}
                className={`flex items-center justify-between px-4 py-3 rounded-xl font-medium cursor-pointer transition-all duration-200 group ${
                  isActive 
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40' 
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon size={20} className={isActive ? 'text-white' : 'text-slate-500 group-hover:text-slate-300'} />
                  <span>{item.label}</span>
                </div>
                {item.id === 'pipeline' && leadCount > 0 && (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${isActive ? 'bg-blue-400 text-white' : 'bg-slate-800 text-slate-400'}`}>
                    {leadCount}
                  </span>
                )}
              </div>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-800 bg-slate-900/50">
          <div className="flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-white cursor-pointer transition-colors group">
            <Settings size={20} className="group-hover:rotate-45 transition-transform duration-500" />
            <span className="text-sm font-medium">Settings</span>
          </div>
          <div className="mt-4 px-2">
             <div className="bg-slate-800/50 border border-slate-800 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">IA Usage</p>
                  <BarChart3 size={12} className="text-slate-500" />
                </div>
                <div className="w-full bg-slate-700 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-gradient-to-r from-blue-400 to-indigo-400 h-full w-[45%]"></div>
                </div>
                <p className="text-right text-[10px] font-mono text-slate-400 mt-2">4,520 / 10k</p>
             </div>
          </div>
        </div>
      </div>
    </>
  );
};
