import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  CheckCircle2, 
  Sparkles, 
  BarChart3,
  Download,
  Loader2,
  AlertCircle,
  TrendingUp
} from 'lucide-react';
import { 
  Radar, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';
import { 
  motion, 
  useMotionValue, 
  useTransform, 
  animate 
} from 'framer-motion';
import { useInterviewStore } from '../stores/interviewStore';
import { interviewApi } from '../api/interview';

function AnimatedCounter({ value }: { value: number }) {
  const count = useMotionValue(0);
  const rounded = useTransform(count, (latest) => Math.round(latest));
  
  React.useEffect(() => {
    const controls = animate(count, value, { duration: 1.5, ease: "easeOut" });
    return controls.stop;
  }, [value]);

  return <motion.span>{rounded}</motion.span>;
}

interface InterviewMetrics {
  overallScore: number;
  radar: {
    technical: number;
    communication: number;
    problemSolving: number;
    cultureFit: number;
    leadership: number;
  };
  feedback: {
    strengths: string[];
    improvements: string[];
  };
}

interface TrendDataPoint {
  sessionId: string;
  overallScore: number;
  createdAt: Date;
}

interface ReportViewProps {
  sessionIdFromUrl?: string; // 从 URL 参数传入的 sessionId（用于查看历史报告）
}

const ReportsView: React.FC<ReportViewProps> = ({ sessionIdFromUrl }) => {
  const navigate = useNavigate();
  const { sessionId: sessionIdFromStore } = useInterviewStore();
  
  // 优先使用 URL 参数的 sessionId，否则使用 store 中的 sessionId
  const sessionId = sessionIdFromUrl || sessionIdFromStore;
  
  const [metrics, setMetrics] = useState<InterviewMetrics | null>(null);
  const [trendData, setTrendData] = useState<TrendDataPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 获取面试报告数据
  useEffect(() => {
    const fetchReportData = async () => {
      if (!sessionId) {
        setError('未找到面试会话');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        
        // 并行获取会话详情和历史趋势
        const [sessionRes, trendRes] = await Promise.all([
          interviewApi.getSessionDetail(sessionId),
          interviewApi.getHistoryTrend()
        ]);

        const sessionData = sessionRes.data.data;
        
        if (!sessionData.metrics) {
          setError('面试报告尚未生成，请先结束面试');
          setIsLoading(false);
          return;
        }

        setMetrics(sessionData.metrics);
        setTrendData(trendRes.data.data || []);
        setError(null);
      } catch (err: any) {
        console.error('Failed to fetch report:', err);
        setError(err.response?.data?.message || '加载报告失败');
      } finally {
        setIsLoading(false);
      }
    };

    fetchReportData();
  }, [sessionId]);

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-indigo-500 animate-spin mx-auto mb-4" />
          <p className="text-slate-600">加载面试报告中...</p>
        </div>
      </div>
    );
  }

  if (error || !metrics) {
    return (
      <div className="h-full flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <AlertCircle className="w-16 h-16 text-amber-500 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-slate-900 mb-2">无法加载报告</h3>
          <p className="text-slate-600 mb-6">{error || '未找到面试数据'}</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors"
          >
            返回首页
          </button>
        </div>
      </div>
    );
  }

  const score = metrics.overallScore;
  const data = [
    { name: 'Score', value: score },
    { name: 'Remaining', value: 100 - score },
  ];
  const COLORS = ['#4F46E5', '#E2E8F0'];

  // 转换雷达图数据
  const radarData = [
    { subject: 'Technical', A: metrics.radar.technical, fullMark: 100 },
    { subject: 'Communication', A: metrics.radar.communication, fullMark: 100 },
    { subject: 'Problem Solving', A: metrics.radar.problemSolving, fullMark: 100 },
    { subject: 'Culture Fit', A: metrics.radar.cultureFit, fullMark: 100 },
    { subject: 'Leadership', A: metrics.radar.leadership, fullMark: 100 },
  ];

  // 转换趋势图数据
  const trendChartData = trendData.map((point, index) => ({
    session: `#${index + 1}`,
    score: point.overallScore,
    date: new Date(point.createdAt).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
  }));

  const handleDownloadPDF = () => {
    // 使用浏览器打印功能生成 PDF
    window.print();
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto h-full overflow-y-auto relative z-10 pb-24 md:pb-8">
      {/* Ambient Background Glow */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-[20%] left-[10%] w-[300px] md:w-[500px] h-[300px] md:h-[500px] rounded-full bg-indigo-500/10 blur-[80px] md:blur-[100px]" />
        <div className="absolute bottom-[10%] right-[10%] w-[250px] md:w-[400px] h-[250px] md:h-[400px] rounded-full bg-emerald-500/10 blur-[80px] md:blur-[100px]" />
      </div>

      <div className="mb-6 md:mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4 pt-safe md:pt-0">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-1 md:mb-2 tracking-tight">Performance Report</h2>
          <p className="text-base md:text-lg text-slate-500">Analysis from your latest mock interview session.</p>
        </div>
        <button 
          onClick={handleDownloadPDF}
          className="w-full md:w-auto px-6 h-12 md:h-auto md:py-3 bg-white/60 backdrop-blur-xl border border-white/40 rounded-full text-sm font-bold text-slate-700 shadow-lg hover:bg-white hover:scale-105 transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <Download className="w-4 h-4" />
          Download PDF
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-8 mb-4 md:mb-8">
        {/* Overall Score Card - Bento Item */}
        <div className="lg:col-span-4 bg-white/60 backdrop-blur-2xl p-6 md:p-8 rounded-3xl border border-white/40 shadow-xl shadow-indigo-500/5 flex flex-col items-center justify-center relative overflow-hidden group min-h-[300px]">
          <div className="absolute inset-0 bg-gradient-to-b from-white/40 to-transparent pointer-events-none"></div>
          <h3 className="text-xs md:text-sm font-bold text-slate-500 uppercase tracking-widest mb-4 md:mb-6">Overall Score</h3>
          <div className="relative w-48 h-48 md:w-56 md:h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  startAngle={90}
                  endAngle={-270}
                  dataKey="value"
                  stroke="none"
                  isAnimationActive={true}
                  animationDuration={1500}
                >
                  {data.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={COLORS[index % COLORS.length]} 
                      style={{ filter: index === 0 ? 'drop-shadow(0 0 10px rgba(79, 70, 229, 0.4))' : 'none' }}
                    />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-5xl md:text-6xl font-black text-slate-900 tracking-tighter drop-shadow-sm">
                <AnimatedCounter value={score} />
              </span>
              <span className="text-xs md:text-sm text-slate-400 font-bold uppercase tracking-wider mt-1">/ 100 Points</span>
            </div>
          </div>
          <div className="mt-6 md:mt-8 flex items-center gap-2 text-emerald-600 bg-emerald-50/80 backdrop-blur-md px-4 py-2 rounded-full text-xs md:text-sm font-bold border border-emerald-100 shadow-sm">
            <CheckCircle2 className="w-3 h-3 md:w-4 md:h-4" /> Top 15% of candidates
          </div>
        </div>

        {/* Radar Chart - Bento Item */}
        <div className="lg:col-span-8 bg-white/60 backdrop-blur-2xl p-4 md:p-8 rounded-3xl border border-white/40 shadow-xl shadow-indigo-500/5 relative overflow-hidden min-h-[300px] md:min-h-[400px]">
          <div className="absolute top-0 right-0 w-48 md:w-64 h-48 md:h-64 bg-indigo-500/5 rounded-full blur-3xl -mr-16 -mt-16"></div>
          <h3 className="text-xs md:text-sm font-bold text-slate-500 uppercase tracking-widest mb-4 md:mb-6 text-center md:text-left">Skill Breakdown</h3>
          <div className="h-64 md:h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                <PolarGrid stroke="#E2E8F0" strokeWidth={1.5} />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#475569', fontSize: 10, fontWeight: 600 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                <Radar
                  name="Candidate"
                  dataKey="A"
                  stroke="#4F46E5"
                  strokeWidth={3}
                  fill="url(#radarGradient)"
                  fillOpacity={0.4}
                />
                <defs>
                  <linearGradient id="radarGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#4F46E5" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Historical Trend Chart */}
      {trendChartData.length > 1 && (
        <div className="bg-white/60 backdrop-blur-2xl p-6 md:p-8 rounded-3xl border border-white/40 shadow-xl shadow-indigo-500/5 mb-4 md:mb-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h3 className="text-lg md:text-xl font-bold text-slate-900">Performance Trend</h3>
              <p className="text-sm text-slate-500">Your progress over the last {trendChartData.length} interviews</p>
            </div>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis 
                  dataKey="session" 
                  tick={{ fill: '#64748B', fontSize: 12 }}
                  stroke="#CBD5E1"
                />
                <YAxis 
                  domain={[0, 100]} 
                  tick={{ fill: '#64748B', fontSize: 12 }}
                  stroke="#CBD5E1"
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                    border: '1px solid #E2E8F0',
                    borderRadius: '12px',
                    padding: '12px'
                  }}
                  labelFormatter={(label, payload) => {
                    if (payload && payload[0]) {
                      return `${label} - ${payload[0].payload.date}`;
                    }
                    return label;
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="score" 
                  stroke="#4F46E5" 
                  strokeWidth={3}
                  dot={{ fill: '#4F46E5', r: 5 }}
                  activeDot={{ r: 7, fill: '#6366F1' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
        <div className="bg-white/60 backdrop-blur-2xl p-6 md:p-8 rounded-3xl border border-white/40 shadow-xl shadow-emerald-500/5 hover:shadow-emerald-500/10 transition-all">
          <div className="flex items-center gap-4 mb-4 md:mb-6">
            <div className="w-8 h-8 md:w-10 md:h-10 bg-emerald-100 rounded-xl flex items-center justify-center shadow-sm">
              <Sparkles className="w-4 h-4 md:w-5 md:h-5 text-emerald-600" />
            </div>
            <h3 className="text-lg md:text-xl font-bold text-slate-900">Key Strengths</h3>
          </div>
          <ul className="space-y-3 md:space-y-5">
            {metrics.feedback.strengths.length > 0 ? (
              metrics.feedback.strengths.map((item, i) => (
                <li key={i} className="flex gap-3 md:gap-4 text-slate-700 font-medium text-sm md:text-base">
                  <CheckCircle2 className="w-5 h-5 md:w-6 md:h-6 text-emerald-500 flex-shrink-0 drop-shadow-sm" />
                  <span className="leading-relaxed">{item}</span>
                </li>
              ))
            ) : (
              <li className="text-slate-500 text-sm">暂无优势反馈</li>
            )}
          </ul>
        </div>

        <div className="bg-white/60 backdrop-blur-2xl p-6 md:p-8 rounded-3xl border border-white/40 shadow-xl shadow-amber-500/5 hover:shadow-amber-500/10 transition-all">
          <div className="flex items-center gap-4 mb-4 md:mb-6">
            <div className="w-8 h-8 md:w-10 md:h-10 bg-amber-100 rounded-xl flex items-center justify-center shadow-sm">
              <BarChart3 className="w-4 h-4 md:w-5 md:h-5 text-amber-600" />
            </div>
            <h3 className="text-lg md:text-xl font-bold text-slate-900">Areas for Improvement</h3>
          </div>
          <ul className="space-y-3 md:space-y-5">
            {metrics.feedback.improvements.length > 0 ? (
              metrics.feedback.improvements.map((item, i) => (
                <li key={i} className="flex gap-3 md:gap-4 text-slate-700 font-medium text-sm md:text-base">
                  <div className="w-5 h-5 md:w-6 md:h-6 rounded-full border-2 border-amber-200 flex items-center justify-center flex-shrink-0 mt-0.5 bg-amber-50">
                    <div className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]"></div>
                  </div>
                  <span className="leading-relaxed">{item}</span>
                </li>
              ))
            ) : (
              <li className="text-slate-500 text-sm">暂无改进建议</li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ReportsView;
