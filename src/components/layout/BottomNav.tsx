import React from 'react';
import { 
  LayoutDashboard, 
  FileText, 
  Mic, 
  BarChart3, 
  Settings,
  FolderOpen
} from 'lucide-react';
import { motion } from 'motion/react';
import { ViewState, NavItem } from '../../types';

interface BottomNavProps {
  activeView: ViewState;
  onViewChange: (view: ViewState) => void;
}

const BottomNav: React.FC<BottomNavProps> = ({ activeView, onViewChange }) => {
  const navItems: NavItem[] = [
    { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
    { id: 'documents', label: 'Docs', icon: FolderOpen },
    { id: 'resume', label: 'Resume', icon: FileText },
    { id: 'interview', label: 'Interview', icon: Mic },
    { id: 'reports', label: 'Reports', icon: BarChart3 },
  ];

  return (
    <div className="fixed bottom-0 w-full h-16 bg-slate-900/80 backdrop-blur-xl border-t border-white/10 flex justify-around items-center z-50 md:hidden pb-safe">
      {navItems.map((item) => (
        <button
          key={item.id}
          onClick={() => onViewChange(item.id)}
          className="relative flex flex-col items-center justify-center w-full h-full"
        >
          {activeView === item.id && (
            <motion.div
              layoutId="bottom-nav-active"
              className="absolute top-0 w-8 h-1 bg-indigo-500 rounded-b-full shadow-[0_0_10px_rgba(99,102,241,0.5)]"
              initial={false}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            />
          )}
          <item.icon 
            className={`w-6 h-6 mb-1 transition-colors ${
              activeView === item.id ? 'text-indigo-400' : 'text-slate-500'
            }`} 
          />
          <span className={`text-[10px] font-medium transition-colors ${
            activeView === item.id ? 'text-indigo-400' : 'text-slate-500'
          }`}>
            {item.label}
          </span>
        </button>
      ))}
    </div>
  );
};

export default BottomNav;
