import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FileText, 
  Mic, 
  Clock, 
  ChevronRight 
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuthStore } from '../stores/authStore';
import { RECENT_ACTIVITY } from '../constants';

const DashboardView: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const handleViewChange = (view: string) => {
    if (view === 'documents') {
      navigate('/dashboard/documents');
    } else if (view === 'interview') {
      navigate('/dashboard/interview');
    } else if (view === 'reports') {
      navigate('/dashboard/report');
    }
  };

  const userName = user?.name || 'User';
  const firstName = userName.split(' ')[0];

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6 md:space-y-8 relative z-10 pb-24 md:pb-8">
      {/* Ambient Background Glow */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-[-10%] right-[-5%] w-[300px] md:w-[500px] h-[300px] md:h-[500px] rounded-full bg-indigo-500/20 blur-[80px] md:blur-[100px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[400px] md:w-[600px] h-[400px] md:h-[600px] rounded-full bg-purple-500/20 blur-[100px] md:blur-[120px]" />
      </div>

      <div className="space-y-2 pt-safe md:pt-0">
        <h1 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight">Welcome back, {firstName}</h1>
        <p className="text-base md:text-lg text-slate-500">Ready to take your career to the next level today?</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-6 auto-rows-[minmax(160px,auto)] md:auto-rows-[minmax(180px,auto)]">
        {/* Documents Card - Large Bento Item */}
        <motion.div 
          whileHover={{ scale: 1.02, y: -4 }}
          whileTap={{ scale: 0.98 }}
          transition={{ type: 'spring', stiffness: 300 }}
          onClick={() => handleViewChange('documents')}
          className="md:col-span-7 bg-white/60 backdrop-blur-2xl p-5 md:p-8 rounded-3xl border border-white/40 shadow-xl shadow-indigo-500/5 hover:shadow-indigo-500/10 transition-all cursor-pointer group relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-48 md:w-64 h-48 md:h-64 bg-indigo-500/10 rounded-full blur-3xl -mr-16 -mt-16 transition-opacity group-hover:opacity-70"></div>
          
          <div className="relative z-10 flex flex-col h-full justify-between">
            <div>
              <div className="w-12 h-12 md:w-14 md:h-14 bg-indigo-500/10 rounded-2xl flex items-center justify-center mb-4 md:mb-6 group-hover:bg-indigo-500/20 transition-colors backdrop-blur-md">
                <FileText className="w-6 h-6 md:w-7 md:h-7 text-indigo-600" />
              </div>
              <h3 className="text-xl md:text-2xl font-bold text-slate-900 mb-2">Document Library</h3>
              <p className="text-slate-500 text-sm md:text-lg max-w-md">Upload and manage your resumes with AI-powered analysis and optimization.</p>
            </div>
            <div className="flex items-center text-indigo-600 font-bold text-sm md:text-base group-hover:translate-x-2 transition-transform mt-6 md:mt-8">
              View Documents <ChevronRight className="w-4 h-4 md:w-5 md:h-5 ml-2" />
            </div>
          </div>
        </motion.div>

        {/* Interview Card - Medium Bento Item */}
        <motion.div 
          whileHover={{ scale: 1.02, y: -4 }}
          whileTap={{ scale: 0.98 }}
          transition={{ type: 'spring', stiffness: 300 }}
          onClick={() => handleViewChange('interview')}
          className="md:col-span-5 bg-slate-900/90 backdrop-blur-2xl p-5 md:p-8 rounded-3xl border border-white/10 shadow-xl shadow-slate-900/20 hover:shadow-emerald-500/10 transition-all cursor-pointer group relative overflow-hidden"
        >
          <div className="absolute bottom-0 left-0 w-full h-full bg-gradient-to-t from-emerald-900/20 to-transparent opacity-50"></div>
          <div className="absolute top-0 right-0 w-32 md:w-48 h-32 md:h-48 bg-emerald-500/20 rounded-full blur-3xl -mr-10 -mt-10"></div>

          <div className="relative z-10 flex flex-col h-full justify-between">
            <div>
              <div className="w-12 h-12 md:w-14 md:h-14 bg-emerald-500/20 rounded-2xl flex items-center justify-center mb-4 md:mb-6 backdrop-blur-md border border-emerald-500/30">
                <Mic className="w-6 h-6 md:w-7 md:h-7 text-emerald-400" />
              </div>
              <h3 className="text-xl md:text-2xl font-bold text-white mb-2">Mock Interview</h3>
              <p className="text-slate-400 text-sm md:text-lg">Practice with our realistic AI interviewer.</p>
            </div>
            <div className="flex items-center text-emerald-400 font-bold text-sm md:text-base group-hover:translate-x-2 transition-transform mt-6 md:mt-8">
              Start Session <ChevronRight className="w-4 h-4 md:w-5 md:h-5 ml-2" />
            </div>
          </div>
        </motion.div>

        {/* Recent Activity - Full Width Bento Item */}
        <div className="md:col-span-12 bg-white/60 backdrop-blur-2xl rounded-3xl border border-white/40 shadow-xl shadow-indigo-500/5 overflow-hidden">
          <div className="px-5 py-4 md:px-8 md:py-6 border-b border-white/20 flex justify-between items-center bg-white/40 backdrop-blur-md">
            <h3 className="text-base md:text-lg font-bold text-slate-900">Recent Activity</h3>
            <button className="text-xs md:text-sm text-indigo-600 hover:text-indigo-700 font-bold px-3 py-1.5 md:px-4 md:py-2 bg-indigo-50/50 rounded-full hover:bg-indigo-100/50 transition-colors">View All</button>
          </div>
          <div className="divide-y divide-slate-100/50">
            {RECENT_ACTIVITY.map((activity) => (
              <div key={activity.id} className="px-5 py-4 md:px-8 md:py-5 flex flex-col md:flex-row md:items-center justify-between hover:bg-white/40 transition-colors group gap-3 md:gap-0">
                <div className="flex items-center gap-4 md:gap-5">
                  <div className={`w-10 h-10 md:w-12 md:h-12 rounded-2xl flex items-center justify-center shadow-sm flex-shrink-0 ${
                    activity.type === 'interview' 
                      ? 'bg-emerald-100/80 text-emerald-600' 
                      : 'bg-indigo-100/80 text-indigo-600'
                  }`}>
                    {activity.type === 'interview' ? <Mic className="w-5 h-5 md:w-6 md:h-6" /> : <FileText className="w-5 h-5 md:w-6 md:h-6" />}
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 text-sm md:text-base line-clamp-1">{activity.title}</p>
                    <div className="flex items-center gap-2 text-xs md:text-sm text-slate-500 mt-0.5 md:mt-1">
                      <Clock className="w-3 h-3 md:w-4 md:h-4" /> {activity.date}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 self-end md:self-auto">
                  <span className="text-xs md:text-sm font-semibold text-slate-600">Score</span>
                  <div className={`px-3 py-1 md:px-4 md:py-1.5 rounded-full text-xs md:text-sm font-bold border ${
                    activity.score >= 90 
                      ? 'bg-emerald-50 text-emerald-600 border-emerald-200' 
                      : activity.score >= 80 
                        ? 'bg-indigo-50 text-indigo-600 border-indigo-200' 
                        : 'bg-amber-50 text-amber-600 border-amber-200'
                  }`}>
                    {activity.score}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardView;
