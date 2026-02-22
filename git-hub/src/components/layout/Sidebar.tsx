import React from 'react';
import { 
  LayoutDashboard, 
  FileText, 
  Mic, 
  BarChart3, 
  Settings, 
  Sparkles,
  FolderOpen
} from 'lucide-react';
import { motion } from 'motion/react';
import { ViewState, NavItem } from '../../types';

interface SidebarProps {
  activeView: ViewState;
  onViewChange: (view: ViewState) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeView, onViewChange }) => {
  const navItems: NavItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'documents', label: 'Documents', icon: FolderOpen },
    { id: 'resume', label: 'Resume Optimizer', icon: FileText },
    { id: 'interview', label: 'Mock Interview', icon: Mic },
    { id: 'reports', label: 'Reports', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="hidden md:flex w-64 bg-slate-900 h-screen flex-col text-slate-400 border-r border-slate-800 flex-shrink-0 z-20 relative">
      <div className="p-6 flex items-center gap-3 text-white mb-6">
        <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-900/50">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <span className="font-semibold text-lg tracking-tight">AI Career Coach</span>
      </div>

      <nav className="flex-1 px-4 space-y-2">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onViewChange(item.id)}
            className="relative w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors duration-200 group hover:text-slate-200"
          >
            {activeView === item.id && (
              <motion.div
                layoutId="sidebar-active"
                className="absolute inset-0 bg-indigo-600 rounded-lg"
                initial={false}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-3">
              <item.icon className={`w-5 h-5 ${activeView === item.id ? 'text-white' : 'text-slate-500 group-hover:text-slate-300'}`} />
              <span className={`font-medium text-sm ${activeView === item.id ? 'text-white' : ''}`}>{item.label}</span>
            </span>
          </button>
        ))}
      </nav>

      <div className="p-6 border-t border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-white font-medium">
            JD
          </div>
          <div>
            <p className="text-sm font-medium text-white">John Doe</p>
            <p className="text-xs text-slate-500">Pro Plan</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
