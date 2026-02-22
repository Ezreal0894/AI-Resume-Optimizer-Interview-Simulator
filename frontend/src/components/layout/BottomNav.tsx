import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  FileText, 
  Mic, 
  BarChart3, 
  Settings
} from 'lucide-react';
import { motion } from 'framer-motion';

const navItems = [
  { path: '/dashboard', label: 'Home', icon: LayoutDashboard, end: true },
  { path: '/dashboard/resume', label: 'Resume', icon: FileText },
  { path: '/dashboard/interview', label: 'Interview', icon: Mic },
  { path: '/dashboard/report', label: 'Reports', icon: BarChart3 },
];

const BottomNav: React.FC = () => {
  return (
    <div className="fixed bottom-0 w-full h-16 bg-slate-900/80 backdrop-blur-xl border-t border-white/10 flex justify-around items-center z-50 md:hidden pb-safe">
      {navItems.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          end={item.end}
          className="relative flex flex-col items-center justify-center w-full h-full"
        >
          {({ isActive }) => (
            <>
              {isActive && (
                <motion.div
                  layoutId="bottom-nav-active"
                  className="absolute top-0 w-8 h-1 bg-indigo-500 rounded-b-full shadow-[0_0_10px_rgba(99,102,241,0.5)]"
                  initial={false}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
              <item.icon 
                className={`w-6 h-6 mb-1 transition-colors ${
                  isActive ? 'text-indigo-400' : 'text-slate-500'
                }`} 
              />
              <span className={`text-[10px] font-medium transition-colors ${
                isActive ? 'text-indigo-400' : 'text-slate-500'
              }`}>
                {item.label}
              </span>
            </>
          )}
        </NavLink>
      ))}
    </div>
  );
};

export default BottomNav;
