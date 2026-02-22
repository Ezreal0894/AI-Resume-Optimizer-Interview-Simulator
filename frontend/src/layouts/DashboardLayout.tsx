import { Outlet } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import Sidebar from '../components/layout/Sidebar';
import BottomNav from '../components/layout/BottomNav';

export default function DashboardLayout() {
  const { user } = useAuthStore();

  const userInitials = user?.name 
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : user?.email?.[0]?.toUpperCase() || 'U';

  return (
    <div className="flex h-screen w-full bg-slate-50 overflow-hidden">
      {/* Sidebar */}
      <Sidebar />
      
      {/* Main Content Area */}
      <main className="flex-1 overflow-hidden relative h-full flex flex-col">
        {/* Top Header Bar */}
        <header className="h-16 bg-white/60 backdrop-blur-xl border-b border-white/20 flex items-center justify-end px-4 md:px-8 flex-shrink-0">
          <div className="flex items-center gap-4">
            <motion.button
              className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-slate-100 transition-colors duration-150"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Bell className="w-5 h-5 text-slate-500" strokeWidth={1.5} />
            </motion.button>
            <div className="w-10 h-10 bg-slate-900 rounded-full flex items-center justify-center text-white text-sm font-semibold cursor-pointer">
              {userInitials}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-auto">
          <AnimatePresence mode="wait">
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="h-full w-full"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <BottomNav />
    </div>
  );
}
