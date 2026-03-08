import { Outlet, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import Sidebar from '../components/layout/Sidebar';
import BottomNav from '../components/layout/BottomNav';
import ThemeToggle from '../components/theme/ThemeToggle';

export default function DashboardLayout() {
  const location = useLocation();
  
  // 🛑 改造 1：检测是否在面试间（沉浸式全屏模式）
  const isInterviewRoom = location.pathname.includes('/interview') && !location.pathname.includes('/history');
  
  return (
    <div className="flex h-screen w-full bg-slate-50 dark:bg-slate-950 overflow-hidden transition-colors duration-500">
      {/* Sidebar - 面试间时隐藏 */}
      {!isInterviewRoom && <Sidebar />}
      
      {/* Main Content Area */}
      <motion.main 
        layout
        className={`flex-1 overflow-hidden relative h-full flex flex-col ${
          isInterviewRoom ? 'w-full' : ''
        }`}
      >
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
      </motion.main>

      {/* Mobile Bottom Navigation - 面试间时隐藏 */}
      {!isInterviewRoom && <BottomNav />}

      {/* Mobile Theme Toggle - 面试间时隐藏（面试间内部有自己的主题切换器）*/}
      {!isInterviewRoom && (
        <div className="fixed bottom-20 right-4 z-40 md:hidden">
          <ThemeToggle />
        </div>
      )}
    </div>
  );
}
