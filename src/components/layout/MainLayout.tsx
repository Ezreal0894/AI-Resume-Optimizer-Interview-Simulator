import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft } from 'lucide-react';
import Sidebar from './Sidebar';
import BottomNav from './BottomNav';
import DashboardView from '../../views/DashboardView';
import ResumeView from '../../views/ResumeView';
import InterviewView from '../../views/InterviewRoom';
import ReportsView from '../../views/ReportView';
import ProfileSettingsView from '../../views/ProfileSettingsView';
import DocumentLibraryView from '../../views/DocumentLibraryView';
import OnboardingView from '../../views/OnboardingView';
import { ViewState } from '../../types';

interface MainLayoutProps {
  onLogout: () => void;
}

const MainLayout: React.FC<MainLayoutProps> = ({ onLogout }) => {
  const [activeView, setActiveView] = useState<ViewState>('dashboard');
  const [showOnboarding, setShowOnboarding] = useState(true);
  const [userRoles, setUserRoles] = useState<string[]>([]);
  const [isPreviewMode, setIsPreviewMode] = useState(false);

  const handleOnboardingComplete = (roles: string[]) => {
    setUserRoles(roles);
    setShowOnboarding(false);
  };

  if (showOnboarding) {
    return <OnboardingView onComplete={handleOnboardingComplete} />;
  }

  return (
    <div className="flex h-full w-full bg-slate-50 overflow-hidden">
      {/* Sidebar with Fluid Transition */}
      <motion.div 
        initial={false}
        animate={{ 
          width: isPreviewMode ? 0 : 'auto',
          opacity: isPreviewMode ? 0 : 1,
          x: isPreviewMode ? -20 : 0
        }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="hidden md:block overflow-hidden"
      >
        <div className="w-64 h-full">
          <Sidebar activeView={activeView} onViewChange={setActiveView} />
        </div>
      </motion.div>
      
      <main className="flex-1 overflow-hidden relative h-full flex flex-col">
        {/* Floating Exit Preview Button */}
        <AnimatePresence>
          {isPreviewMode && (
            <motion.button
              initial={{ opacity: 0, y: -20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.9 }}
              onClick={() => setIsPreviewMode(false)}
              className="absolute top-6 left-6 z-[60] flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900/60 backdrop-blur-xl text-white font-medium text-sm shadow-lg shadow-indigo-500/20 hover:bg-slate-900/80 hover:scale-105 transition-all border border-white/10"
            >
              <ArrowLeft className="w-4 h-4" />
              Exit Preview
            </motion.button>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeView}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="h-full w-full overflow-hidden"
          >
            {activeView === 'dashboard' && <DashboardView onViewChange={setActiveView} />}
            {activeView === 'documents' && (
              <DocumentLibraryView 
                isPreviewMode={isPreviewMode} 
                onPreviewModeChange={setIsPreviewMode} 
              />
            )}
            {activeView === 'resume' && <ResumeView />}
            {activeView === 'interview' && <InterviewView />}
            {activeView === 'reports' && <ReportsView />}
            {activeView === 'settings' && <ProfileSettingsView onLogout={onLogout} selectedRoles={userRoles} />}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* BottomNav with Slide Down Animation */}
      <motion.div
        initial={false}
        animate={{ y: isPreviewMode ? "100%" : 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="fixed bottom-0 left-0 right-0 z-40 md:hidden"
      >
        <BottomNav activeView={activeView} onViewChange={setActiveView} />
      </motion.div>
    </div>
  );
};

export default MainLayout;
