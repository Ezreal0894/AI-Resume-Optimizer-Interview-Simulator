import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Sparkles, 
  ArrowRight, 
  UploadCloud, 
  Check, 
  FileText, 
  Bot, 
  Mic 
} from 'lucide-react';
import { motion } from 'framer-motion';

const LandingPage = () => {
  const navigate = useNavigate();

  const handleNavigate = (screen: string) => {
    if (screen === 'login') {
      navigate('/login');
    } else if (screen === 'register') {
      navigate('/register');
    } else if (screen === 'dashboard') {
      navigate('/dashboard');
    }
  };

  const fadeInUp = {
    initial: { opacity: 0, y: 40 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: "-100px" },
    transition: { duration: 0.6, ease: "easeOut" }
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 overflow-x-hidden">
      {/* Header */}
      <motion.header 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5 }}
        className="fixed top-0 w-full bg-white/70 backdrop-blur-xl border-b border-white/20 z-50"
      >
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-900/20">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="font-semibold text-lg tracking-tight text-slate-900">AI Career Coach</span>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => handleNavigate('login')}
              className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
            >
              Log in
            </button>
            <button 
              onClick={() => handleNavigate('register')}
              className="text-sm font-medium text-white bg-indigo-600 px-5 py-2 rounded-full hover:bg-indigo-700 transition-all shadow-md shadow-indigo-500/20"
            >
              Start Free Trial
            </button>
          </div>
        </div>
      </motion.header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <motion.div 
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          variants={staggerContainer}
          className="max-w-4xl mx-auto text-center space-y-8"
        >
          <motion.h1 
            variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}
            className="text-5xl md:text-6xl font-bold text-slate-900 tracking-tight leading-[1.1]"
          >
            Reinvent Your Career Path <br />
            <span className="text-indigo-600">With AI Intelligence</span>
          </motion.h1>
          <motion.p 
            variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}
            className="text-xl text-slate-500 max-w-2xl mx-auto leading-relaxed"
          >
            The resume optimizer and immersive interview simulator used by millions of elites. Master your preparation with data-driven insights.
          </motion.p>
          <motion.div 
            variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}
            className="flex items-center justify-center gap-4 pt-4"
          >
            <button 
              onClick={() => handleNavigate('register')}
              className="group relative px-8 py-4 bg-indigo-600 text-white rounded-full font-semibold text-lg shadow-xl shadow-indigo-500/30 hover:bg-indigo-700 transition-all hover:-translate-y-1"
            >
              <span className="relative z-10 flex items-center gap-2">
                Elevate Now <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </span>
              <div className="absolute inset-0 rounded-full bg-white/20 animate-ping opacity-20"></div>
            </button>
          </motion.div>
        </motion.div>

        {/* Mockup */}
        <motion.div 
          {...fadeInUp}
          className="mt-20 max-w-5xl mx-auto relative"
        >
          <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl blur opacity-20"></div>
          <div className="relative bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden aspect-[16/9] flex flex-col">
            {/* Mockup Header */}
            <div className="h-8 bg-slate-50 border-b border-slate-200 flex items-center px-4 gap-2">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-400"></div>
                <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                <div className="w-3 h-3 rounded-full bg-emerald-400"></div>
              </div>
              <div className="flex-1 text-center">
                <div className="inline-block px-3 py-0.5 bg-white rounded-md text-[10px] text-slate-400 border border-slate-200 shadow-sm">
                  ai-career-coach.app
                </div>
              </div>
            </div>
            {/* Mockup Body - Simplified Dashboard */}
            <div className="flex-1 flex bg-slate-50 overflow-hidden">
              <div className="w-48 bg-slate-900 p-4 hidden md:block space-y-3">
                <div className="w-8 h-8 bg-indigo-600 rounded-lg mb-6"></div>
                <div className="h-8 bg-indigo-600/20 rounded-md w-full"></div>
                <div className="h-8 bg-white/5 rounded-md w-full"></div>
                <div className="h-8 bg-white/5 rounded-md w-full"></div>
              </div>
              <div className="flex-1 p-6 space-y-6">
                <div className="h-8 w-64 bg-slate-200 rounded-lg"></div>
                <div className="grid grid-cols-2 gap-6">
                  <div className="h-48 bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
                    <div className="w-10 h-10 bg-indigo-50 rounded-lg"></div>
                    <div className="h-6 w-32 bg-slate-100 rounded"></div>
                    <div className="h-4 w-full bg-slate-50 rounded"></div>
                  </div>
                  <div className="h-48 bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
                    <div className="w-10 h-10 bg-emerald-50 rounded-lg"></div>
                    <div className="h-6 w-32 bg-slate-100 rounded"></div>
                    <div className="h-4 w-full bg-slate-50 rounded"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Features */}
      <section className="py-24 bg-white border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-6 space-y-32">
          {/* Feature 1: Resume */}
          <motion.div 
            {...fadeInUp}
            className="flex flex-col md:flex-row items-center gap-16"
          >
            <div className="flex-1 relative group">
              <div className="absolute -inset-4 bg-indigo-50 rounded-3xl -rotate-2 group-hover:rotate-0 transition-transform duration-500"></div>
              <div className="relative bg-white p-8 rounded-2xl border-2 border-dashed border-slate-300 shadow-lg aspect-[4/3] flex flex-col items-center justify-center">
                <UploadCloud className="w-16 h-16 text-indigo-600 mb-6" />
                <div className="space-y-2 text-center">
                  <div className="h-4 w-48 bg-slate-100 rounded mx-auto"></div>
                  <div className="h-4 w-32 bg-slate-100 rounded mx-auto"></div>
                </div>
                <div className="absolute bottom-8 right-8 bg-white p-4 rounded-xl shadow-xl border border-slate-100 flex items-center gap-3 animate-bounce">
                  <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
                    <Check className="w-4 h-4 text-emerald-600" />
                  </div>
                  <span className="text-sm font-medium text-slate-700">ATS Optimized</span>
                </div>
              </div>
            </div>
            <div className="flex-1 space-y-6">
              <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
                <FileText className="w-6 h-6 text-indigo-600" />
              </div>
              <h2 className="text-3xl font-bold text-slate-900">Precision Resume Crafting</h2>
              <p className="text-lg text-slate-500 leading-relaxed">
                Our AI analyzes your resume against thousands of successful profiles. Get instant feedback on formatting, keywords, and impact to pass ATS filters effortlessly.
              </p>
            </div>
          </motion.div>

          {/* Feature 2: Interview */}
          <motion.div 
            {...fadeInUp}
            className="flex flex-col md:flex-row-reverse items-center gap-16"
          >
            <div className="flex-1 relative">
              <div className="bg-slate-900 rounded-2xl p-8 shadow-2xl relative overflow-hidden aspect-[4/3] flex items-center justify-center">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/20 to-purple-900/20"></div>
                <div className="relative z-10 flex flex-col items-center">
                  <div className="w-32 h-32 rounded-full bg-slate-800 flex items-center justify-center relative">
                    <Bot className="w-16 h-16 text-indigo-400" />
                    <div className="absolute inset-0 rounded-full border-2 border-indigo-500/30 animate-ping"></div>
                    <div className="absolute inset-0 rounded-full border border-indigo-500/20 animate-ping delay-75"></div>
                  </div>
                  <div className="mt-8 bg-white/10 backdrop-blur-md px-6 py-3 rounded-full border border-white/10">
                    <div className="flex gap-1">
                      <span className="w-1 h-4 bg-indigo-400 rounded-full animate-pulse"></span>
                      <span className="w-1 h-6 bg-indigo-400 rounded-full animate-pulse delay-75"></span>
                      <span className="w-1 h-3 bg-indigo-400 rounded-full animate-pulse delay-150"></span>
                      <span className="w-1 h-5 bg-indigo-400 rounded-full animate-pulse"></span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex-1 space-y-6">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <Mic className="w-6 h-6 text-purple-600" />
              </div>
              <h2 className="text-3xl font-bold text-slate-900">Conquer Interview Anxiety</h2>
              <p className="text-lg text-slate-500 leading-relaxed">
                Practice with a realistic AI interviewer that adapts to your responses. Experience full audio-visual simulations that mimic top-tier tech interviews.
              </p>
            </div>
          </motion.div>

          {/* Feature 3: Charts */}
          <motion.div 
            {...fadeInUp}
            className="text-center max-w-3xl mx-auto space-y-12"
          >
            <div className="space-y-4">
              <h2 className="text-3xl font-bold text-slate-900">Data-Driven Growth</h2>
              <p className="text-lg text-slate-500">Visualize your progress with comprehensive radar charts and detailed performance metrics.</p>
            </div>
            <div className="flex justify-center">
              <div className="relative w-64 h-64">
                <div className="absolute inset-0 bg-indigo-50 rounded-full animate-pulse opacity-50"></div>
                <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-xl">
                  <polygon points="50,10 90,40 75,85 25,85 10,40" fill="rgba(79, 70, 229, 0.2)" stroke="#4F46E5" strokeWidth="2" />
                  <circle cx="50" cy="50" r="40" fill="none" stroke="#E2E8F0" strokeWidth="1" />
                  <circle cx="50" cy="50" r="25" fill="none" stroke="#E2E8F0" strokeWidth="1" />
                  <line x1="50" y1="50" x2="50" y2="10" stroke="#E2E8F0" strokeWidth="1" />
                  <line x1="50" y1="50" x2="90" y2="40" stroke="#E2E8F0" strokeWidth="1" />
                  <line x1="50" y1="50" x2="75" y2="85" stroke="#E2E8F0" strokeWidth="1" />
                  <line x1="50" y1="50" x2="25" y2="85" stroke="#E2E8F0" strokeWidth="1" />
                  <line x1="50" y1="50" x2="10" y2="40" stroke="#E2E8F0" strokeWidth="1" />
                </svg>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-12 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-slate-800 rounded flex items-center justify-center">
              <Sparkles className="w-3 h-3 text-indigo-500" />
            </div>
            <span className="font-semibold text-white">AI Career Coach</span>
          </div>
          <p className="text-sm">© 2026 AI Career Coach. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
