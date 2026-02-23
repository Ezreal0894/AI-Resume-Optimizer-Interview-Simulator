import { Outlet } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import Sidebar from '../components/layout/Sidebar';
import BottomNav from '../components/layout/BottomNav';
import ThemeToggle from '../components/theme/ThemeToggle';

export default function DashboardLayout() {
  return (
    <div className="flex h-screen w-full bg-slate-50 dark:bg-slate-950 overflow-hidden transition-colors duration-500">
      {/* Sidebar */}
      <Sidebar />
      
      {/* Main Content Area */}
      <main className="flex-1 overflow-hidden relative h-full flex flex-col">

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

      {/* Mobile Theme Toggle - Fixed Position */}
      <div className="fixed bottom-20 right-4 z-40 md:hidden">
        <ThemeToggle />
      </div>
    </div>
  );
}
