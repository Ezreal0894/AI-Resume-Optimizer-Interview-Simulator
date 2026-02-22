import React from 'react';
import { 
  ArrowLeft, 
  Download, 
  Share2, 
  CheckCircle2, 
  AlertCircle, 
  XCircle, 
  FileText, 
  Target, 
  Zap, 
  Layout,
  Type
} from 'lucide-react';
import { motion } from 'framer-motion';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip
} from 'recharts';

interface ResumeReportViewProps {
  onBack: () => void;
}

// --- Mock Data ---
const SCORE_DATA = [
  { name: 'Score', value: 85 },
  { name: 'Remaining', value: 15 },
];
const SCORE_COLORS = ['#4F46E5', '#E2E8F0'];

const KEYWORD_DATA = [
  { name: 'React', count: 12, required: 10 },
  { name: 'TypeScript', count: 8, required: 8 },
  { name: 'Node.js', count: 3, required: 5 },
  { name: 'AWS', count: 1, required: 4 },
];

const SUGGESTIONS = [
  {
    id: 1,
    type: 'critical',
    category: 'ATS Compatibility',
    title: 'Missing Critical Keywords',
    description: 'Your resume is missing "AWS" and "CI/CD" which are frequently mentioned in the job description.',
    icon: AlertCircle,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-100'
  },
  {
    id: 2,
    type: 'warning',
    category: 'Impact & Metrics',
    title: 'Quantify Your Achievements',
    description: 'In the "Senior Developer" role, try to add specific metrics (e.g., "Improved load time by 40%").',
    icon: Target,
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-100'
  },
  {
    id: 3,
    type: 'success',
    category: 'Formatting',
    title: 'Excellent Structure',
    description: 'Your section headers and chronological order are perfectly parsed by standard ATS systems.',
    icon: CheckCircle2,
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-100'
  }
];

const ResumeReportView: React.FC<ResumeReportViewProps> = ({ onBack }) => {
  return (
    <div className="h-full flex flex-col relative z-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 md:mb-8 pt-safe md:pt-0">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="p-2 rounded-full bg-white border border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">Resume Analysis Report</h2>
            <p className="text-sm text-slate-500 flex items-center gap-2">
              <FileText className="w-3 h-3" /> Software_Engineer_Resume_v2.pdf
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <button className="px-4 h-10 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 transition-colors flex items-center gap-2">
            <Share2 className="w-4 h-4" /> Share
          </button>
          <button className="px-4 h-10 bg-indigo-600 text-white rounded-lg text-sm font-medium shadow-lg shadow-indigo-500/20 hover:bg-indigo-700 transition-colors flex items-center gap-2">
            <Download className="w-4 h-4" /> Export PDF
          </button>
        </div>
      </div>

      {/* Content Scroll Area */}
      <div className="flex-1 overflow-y-auto pb-24 md:pb-8 space-y-6 md:space-y-8">
        
        {/* Top Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Overall Score */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col items-center justify-center relative overflow-hidden"
          >
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-4">Overall Score</h3>
            <div className="relative w-40 h-40">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={SCORE_DATA}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={70}
                    startAngle={90}
                    endAngle={-270}
                    dataKey="value"
                    stroke="none"
                  >
                    {SCORE_DATA.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={SCORE_COLORS[index]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl font-black text-slate-900">85</span>
                <span className="text-xs text-slate-400 font-bold">/ 100</span>
              </div>
            </div>
            <div className="mt-4 text-center">
              <p className="text-sm font-medium text-slate-900">Top 10% Candidate</p>
              <p className="text-xs text-slate-500">Ready for application</p>
            </div>
          </motion.div>

          {/* Keyword Match */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest">Keyword Match</h3>
              <span className="px-2 py-1 bg-emerald-50 text-emerald-600 text-xs font-bold rounded-md">High Match</span>
            </div>
            <div className="flex-1 w-full h-40">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={KEYWORD_DATA} layout="vertical" margin={{ top: 0, right: 30, left: 40, bottom: 0 }}>
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <Tooltip cursor={{ fill: '#f1f5f9' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Bar dataKey="count" fill="#4F46E5" radius={[0, 4, 4, 0]} barSize={20} background={{ fill: '#F1F5F9', radius: [0, 4, 4, 0] }} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="text-xs text-slate-400 mt-2 text-center">Comparing against "Senior Frontend Engineer" JD</p>
          </motion.div>

          {/* Quick Stats */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="grid grid-rows-3 gap-4"
          >
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-bold uppercase">Action Verbs</p>
                <p className="text-lg font-bold text-slate-900">Strong (85%)</p>
              </div>
            </div>
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
                <Layout className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-bold uppercase">Formatting</p>
                <p className="text-lg font-bold text-slate-900">Clean</p>
              </div>
            </div>
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                <Type className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-bold uppercase">Word Count</p>
                <p className="text-lg font-bold text-slate-900">Optimal (650)</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Detailed Suggestions */}
        <div>
          <h3 className="text-lg font-bold text-slate-900 mb-4">Detailed Analysis</h3>
          <div className="space-y-4">
            {SUGGESTIONS.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + index * 0.1 }}
                className={`bg-white rounded-2xl p-6 border ${item.borderColor} shadow-sm flex flex-col md:flex-row gap-6`}
              >
                <div className={`w-12 h-12 rounded-2xl ${item.bgColor} flex items-center justify-center flex-shrink-0`}>
                  <item.icon className={`w-6 h-6 ${item.color}`} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-md uppercase tracking-wide ${item.bgColor} ${item.color}`}>
                      {item.category}
                    </span>
                    <h4 className="text-base font-bold text-slate-900">{item.title}</h4>
                  </div>
                  <p className="text-slate-600 leading-relaxed">{item.description}</p>
                </div>
                <div className="flex items-center">
                  <button className="px-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-600 text-sm font-medium rounded-lg transition-colors">
                    Fix Now
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResumeReportView;
