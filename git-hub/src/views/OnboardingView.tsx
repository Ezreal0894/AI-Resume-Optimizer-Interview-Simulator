import React, { useState } from 'react';
import { 
  Code2, 
  Server, 
  Layout, 
  Database, 
  Terminal, 
  BrainCircuit, 
  Briefcase, 
  PenTool,
  CheckCircle2,
  ArrowRight,
  Smartphone,
  ShieldCheck,
  Gamepad2,
  ClipboardCheck,
  Cloud,
  Cpu,
  Network,
  BarChart3,
  CalendarClock,
  Megaphone
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface OnboardingViewProps {
  onComplete: (selectedRoles: string[]) => void;
}

const ROLES = [
  { id: 'frontend', label: 'Frontend Dev', icon: Layout },
  { id: 'backend', label: 'Backend Dev', icon: Server },
  { id: 'fullstack', label: 'Full Stack', icon: Code2 },
  { id: 'mobile', label: 'Mobile (iOS/Android)', icon: Smartphone },
  { id: 'product', label: 'Product Manager', icon: Briefcase },
  { id: 'uiux', label: 'UI/UX Design', icon: PenTool },
  { id: 'ai', label: 'AI / LLM Engineer', icon: BrainCircuit },
  { id: 'data', label: 'Data Scientist', icon: BarChart3 },
  { id: 'devops', label: 'DevOps / SRE', icon: Cloud },
  { id: 'qa', label: 'QA Engineer', icon: ClipboardCheck },
  { id: 'security', label: 'Cyber Security', icon: ShieldCheck },
  { id: 'game', label: 'Game Developer', icon: Gamepad2 },
  { id: 'pm', label: 'Project Manager', icon: CalendarClock },
  { id: 'embedded', label: 'Embedded Systems', icon: Cpu },
  { id: 'network', label: 'Network Engineer', icon: Network },
  { id: 'ops', label: 'Operations', icon: Megaphone },
];

const OnboardingView: React.FC<OnboardingViewProps> = ({ onComplete }) => {
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);

  const toggleRole = (roleId: string) => {
    setSelectedRoles(prev => 
      prev.includes(roleId) 
        ? prev.filter(id => id !== roleId)
        : [...prev, roleId]
    );
  };

  return (
    <div className="h-screen w-full bg-slate-50 flex flex-col relative overflow-hidden">
      {/* Ambient Background */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] rounded-full bg-indigo-500/5 blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] rounded-full bg-slate-500/5 blur-[100px]" />
      </div>

      {/* 1. Fixed Header */}
      <div className="flex-none pt-safe px-6 pb-6 md:pt-12 md:pb-8 z-10 bg-slate-50/80 backdrop-blur-sm sticky top-0">
        <div className="max-w-4xl mx-auto text-center">
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="text-2xl md:text-4xl font-bold text-slate-900 mb-2 tracking-tight leading-tight"
          >
            Customize Your AI Career Engine
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="text-sm md:text-lg text-slate-500 leading-relaxed max-w-2xl mx-auto"
          >
            Select your target roles to personalize your interview questions.
          </motion.p>
        </div>
      </div>

      {/* 2. Scrollable Content Area */}
      <div className="flex-1 overflow-y-auto scrollbar-hide z-10 relative">
        <div className="max-w-5xl mx-auto px-4 md:px-6 pb-40 pt-2">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
            {ROLES.map((role, index) => {
              const isSelected = selectedRoles.includes(role.id);
              return (
                <motion.button
                  key={role.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "50px" }}
                  transition={{ duration: 0.5, delay: index % 4 * 0.05 }} // Stagger effect based on column index
                  whileHover={{ y: -4, boxShadow: "0 10px 30px -10px rgba(79, 70, 229, 0.1)" }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => toggleRole(role.id)}
                  className={`relative group p-4 md:p-6 rounded-2xl border-2 text-left transition-all duration-300 flex flex-col items-start gap-3 md:gap-4 h-full min-h-[140px] md:min-h-[160px] ${
                    isSelected 
                      ? 'bg-indigo-50/50 border-indigo-600 shadow-lg shadow-indigo-500/10' 
                      : 'bg-white border-slate-200 hover:border-indigo-200 hover:bg-slate-50/50'
                  }`}
                >
                  <div className={`p-2.5 md:p-3 rounded-xl transition-colors duration-300 ${
                    isSelected ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-500 group-hover:bg-white group-hover:text-indigo-500'
                  }`}>
                    <role.icon className="w-5 h-5 md:w-7 md:h-7" />
                  </div>
                  
                  <span className={`font-bold text-xs md:text-sm transition-colors ${
                    isSelected ? 'text-indigo-900' : 'text-slate-600 group-hover:text-slate-900'
                  }`}>
                    {role.label}
                  </span>

                  {/* Check Icon Animation */}
                  <AnimatePresence>
                    {isSelected && (
                      <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        className="absolute top-3 right-3 md:top-4 md:right-4 text-indigo-600"
                      >
                        <CheckCircle2 className="w-5 h-5 md:w-6 md:h-6 fill-indigo-100" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Scroll Fading Mask (Visual Polish) */}
      <div className="absolute bottom-[88px] md:bottom-[100px] left-0 right-0 h-12 bg-gradient-to-t from-slate-50 to-transparent pointer-events-none z-20" />

      {/* 3. Sticky Footer Action */}
      <motion.div 
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        className="absolute bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-slate-200 z-50 pb-safe"
      >
        <div className="max-w-7xl mx-auto p-4 md:p-6 flex items-center justify-between gap-4">
          <div className="hidden md:block">
            <p className="text-sm font-medium text-slate-500">
              {selectedRoles.length === 0 
                ? "Select at least one role to continue" 
                : `${selectedRoles.length} role${selectedRoles.length > 1 ? 's' : ''} selected`}
            </p>
          </div>
          
          <button
            onClick={() => selectedRoles.length > 0 && onComplete(selectedRoles)}
            disabled={selectedRoles.length === 0}
            className={`w-full md:w-auto px-8 py-3.5 rounded-xl font-bold text-base flex items-center justify-center gap-2 transition-all duration-300 ${
              selectedRoles.length > 0
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30 hover:bg-indigo-700 hover:scale-[1.02] active:scale-[0.98] animate-pulse'
                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
            }`}
          >
            Enter Workspace
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default OnboardingView;
