import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Mic, 
  BarChart3, 
  FolderOpen,
  Settings, 
  Sparkles
} from 'lucide-react';
import { motion } from 'motion/react';
import { useAuthStore } from '../../stores/authStore';
import ThemeToggle from '../theme/ThemeToggle';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { path: '/dashboard/interview', label: 'Mock Interview', icon: Mic },
  { path: '/dashboard/report', label: 'Reports', icon: BarChart3 },
  { path: '/dashboard/documents', label: 'Documents', icon: FolderOpen },
  { path: '/dashboard/settings', label: 'Settings', icon: Settings },
];

const Sidebar: React.FC = () => {
  const { user } = useAuthStore();

  const userInitials = user?.name 
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : user?.email?.[0]?.toUpperCase() || 'U';

  return (
    <div className="hidden md:flex w-64 bg-slate-900 dark:bg-slate-950 h-screen flex-col text-slate-400 border-r border-slate-800 flex-shrink-0 z-20 relative transition-colors duration-300">
      <div className="p-6 flex items-center gap-3 text-white mb-6">
        <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-900/50">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <span className="font-semibold text-lg tracking-tight">AI Career Coach</span>
      </div>

      <nav className="flex-1 px-4 space-y-2">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.end}
            className="relative w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors duration-200 group hover:text-slate-200"
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <motion.div
                    layoutId="sidebar-active"
                    className="absolute inset-0 bg-indigo-600 rounded-lg"
                    initial={false}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-3">
                  <item.icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-500 group-hover:text-slate-300'}`} />
                  <span className={`font-medium text-sm ${isActive ? 'text-white' : ''}`}>{item.label}</span>
                </span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="p-6 border-t border-slate-800 space-y-6">
        {/* Theme Toggle */}
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Theme</span>
          <ThemeToggle />
        </div>
        
        {/* User Info */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-white font-medium">
            {userInitials}
          </div>
          <div>
            <p className="text-sm font-medium text-white">{user?.name || 'User'}</p>
            <p className="text-xs text-slate-500">{user?.plan === 'PRO' ? 'Pro Plan' : 'Free Plan'}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
