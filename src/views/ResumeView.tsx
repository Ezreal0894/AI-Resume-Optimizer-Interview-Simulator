import React, { useState } from 'react';
import { 
  FileText, 
  UploadCloud 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ResumeReportView from './ResumeReportView';

const ResumeView = () => {
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);

  if (selectedReportId) {
    return (
      <ResumeReportView onBack={() => setSelectedReportId(null)} />
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto h-full flex flex-col relative z-10 pb-24 md:pb-8">
      {/* Ambient Background Glow */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-[10%] right-[10%] w-[300px] md:w-[400px] h-[300px] md:h-[400px] rounded-full bg-indigo-500/10 blur-[60px] md:blur-[80px]" />
      </div>

      <div className="mb-6 md:mb-8 pt-safe md:pt-0">
        <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2 tracking-tight">Resume Optimizer</h2>
        <p className="text-base md:text-lg text-slate-500">Upload your resume to get AI-driven insights and improvements.</p>
      </div>

      <div className="flex-1 flex flex-col gap-6 md:gap-8">
        <div className="relative border-2 border-dashed border-indigo-200/50 rounded-3xl bg-white/40 backdrop-blur-xl hover:bg-white/60 hover:border-indigo-500 transition-all duration-500 flex flex-col items-center justify-center p-8 md:p-12 cursor-pointer group h-64 md:h-80 overflow-hidden shadow-lg shadow-indigo-500/5">
          <motion.div
            className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-indigo-500 to-transparent shadow-[0_0_20px_rgba(99,102,241,0.6)] z-0"
            animate={{ top: ["0%", "100%"] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
          />
          <div className="relative z-10 flex flex-col items-center text-center">
            <div className="w-16 h-16 md:w-20 md:h-20 bg-white rounded-2xl shadow-xl shadow-indigo-500/10 flex items-center justify-center mb-4 md:mb-6 group-hover:scale-110 transition-transform duration-300 border border-white/50">
              <UploadCloud className="w-8 h-8 md:w-10 md:h-10 text-indigo-600" />
            </div>
            <p className="text-lg md:text-xl font-bold text-slate-700 mb-2 hidden md:block">Drop your resume here</p>
            <p className="text-lg md:text-xl font-bold text-slate-700 mb-2 md:hidden">Tap to upload resume</p>
            <p className="text-sm md:text-base text-slate-400">Supports PDF, DOCX (Max 10MB)</p>
            <button className="mt-6 md:mt-8 px-6 md:px-8 h-12 md:h-auto md:py-3 bg-white border border-indigo-100 rounded-full text-sm font-bold text-indigo-600 shadow-lg shadow-indigo-500/10 hover:bg-indigo-50 hover:shadow-indigo-500/20 transition-all flex items-center justify-center">
              Browse Files
            </button>
          </div>
        </div>

        <div className="bg-white/60 backdrop-blur-2xl rounded-3xl border border-white/40 shadow-xl shadow-indigo-500/5 p-6 md:p-8">
          <h3 className="text-lg font-bold text-slate-900 mb-4 md:mb-6">History</h3>
          <div className="space-y-3 md:space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="flex items-center justify-between p-3 md:p-4 rounded-2xl border border-white/60 bg-white/40 hover:bg-indigo-50/50 hover:border-indigo-200 transition-all group shadow-sm">
                <div className="flex items-center gap-3 md:gap-4">
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-red-50 rounded-xl flex items-center justify-center border border-red-100 flex-shrink-0">
                    <FileText className="w-5 h-5 md:w-6 md:h-6 text-red-500" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm md:text-base font-bold text-slate-700 group-hover:text-indigo-700 transition-colors truncate max-w-[150px] md:max-w-none">Software_Engineer_Resume_v{i}.pdf</p>
                    <p className="text-[10px] md:text-xs text-slate-400 font-medium mt-0.5">Uploaded 2 days ago • 1.2 MB</p>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedReportId(i.toString())}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-700 px-3 py-1.5 md:px-4 md:py-2 bg-indigo-50 rounded-full md:opacity-0 group-hover:opacity-100 transition-all transform md:translate-x-2 group-hover:translate-x-0 whitespace-nowrap"
                >
                  View Report
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResumeView;
