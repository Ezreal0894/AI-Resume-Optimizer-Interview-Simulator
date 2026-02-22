import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import LandingPage from './views/LandingPage';
import AuthLayout from './views/AuthLayout';
import MainLayout from './components/layout/MainLayout';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<'landing' | 'login' | 'register' | 'dashboard'>('landing');

  return (
    <div className="h-screen w-full bg-slate-50 overflow-hidden font-sans text-slate-900 selection:bg-indigo-100 selection:text-indigo-900">
      <AnimatePresence mode="wait">
        {currentScreen === 'landing' && (
          <motion.div 
            key="landing" 
            className="h-full w-full overflow-y-auto" 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0, y: -20 }} 
            transition={{ duration: 0.3 }}
          >
            <LandingPage onNavigate={(screen) => setCurrentScreen(screen as any)} />
          </motion.div>
        )}
        
        {(currentScreen === 'login' || currentScreen === 'register') && (
          <motion.div 
            key="auth" 
            className="h-full w-full" 
            initial={{ opacity: 0, x: 20 }} 
            animate={{ opacity: 1, x: 0 }} 
            exit={{ opacity: 0, x: -20 }} 
            transition={{ duration: 0.3 }}
          >
            <AuthLayout mode={currentScreen} onNavigate={(screen) => setCurrentScreen(screen as any)} />
          </motion.div>
        )}
        
        {currentScreen === 'dashboard' && (
          <motion.div 
            key="dashboard" 
            className="h-full w-full" 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0, scale: 0.95 }} 
            transition={{ duration: 0.3 }}
          >
            <MainLayout onLogout={() => setCurrentScreen('landing')} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
