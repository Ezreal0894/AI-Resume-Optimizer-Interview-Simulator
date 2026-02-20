/**
 * 能力报告页面
 * 设计系统：数据可视化，卡片式布局，清晰视觉层次
 */
import { useEffect } from 'react';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { Award, Target, TrendingUp, CheckCircle } from 'lucide-react';

const mockReport = {
  overallScore: 88,
  dimensions: [
    { name: '技术深度', score: 85 },
    { name: '表达沟通', score: 90 },
    { name: '逻辑思维', score: 88 },
    { name: '项目经验', score: 82 },
    { name: '抗压能力', score: 92 },
  ],
  strengths: [
    '技术基础扎实，对 React 生态有深入理解',
    '表达清晰流畅，能够准确传达技术观点',
    '面对压力问题时保持冷静，应变能力强',
  ],
  improvements: [
    '可以更多展示项目中的技术决策过程',
    '建议补充系统设计相关的知识储备',
    '回答时可以增加更多具体的数据支撑',
  ],
};

export default function ReportPage() {
  const score = mockReport.overallScore;
  const displayScore = useMotionValue(0);
  const roundedScore = useTransform(displayScore, (v) => Math.round(v));

  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = useMotionValue(circumference);

  useEffect(() => {
    const scoreControls = animate(displayScore, score, {
      duration: 1.5,
      ease: 'easeOut',
    });

    animate(strokeDashoffset, circumference * (1 - score / 100), {
      duration: 1.5,
      ease: 'easeOut',
    });

    return () => scoreControls.stop();
  }, [score, circumference, displayScore, strokeDashoffset]);

  return (
    <div className="p-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">能力报告</h1>
        <p className="text-sm text-gray-400 mb-8">字节跳动 - 前端工程师模拟面试</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* 综合得分 */}
        <motion.div
          className="bg-white rounded-xl border border-gray-200 p-6 flex flex-col items-center justify-center shadow-soft"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <p className="text-xs text-gray-400 mb-4">综合得分</p>
          <div className="relative w-44 h-44">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 200 200">
              <circle
                cx="100"
                cy="100"
                r={radius}
                fill="none"
                stroke="#E5E7EB"
                strokeWidth="10"
              />
              <motion.circle
                cx="100"
                cy="100"
                r={radius}
                fill="none"
                stroke="#0EA5E9"
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={circumference}
                style={{ strokeDashoffset }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <motion.span className="text-4xl font-bold text-gray-900">
                {roundedScore}
              </motion.span>
              <span className="text-xs text-gray-400">/ 100</span>
            </div>
          </div>
          <p className="mt-4 text-sm text-primary-500 font-medium">优秀表现！</p>
        </motion.div>

        {/* 雷达图 */}
        <motion.div
          className="bg-white rounded-xl border border-gray-200 p-6 shadow-soft"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h3 className="text-base font-semibold text-gray-900 mb-4 text-center">
            能力维度
          </h3>
          <div className="relative w-full aspect-square max-w-[260px] mx-auto">
            <svg viewBox="0 0 200 200" className="w-full h-full">
              {[20, 40, 60, 80, 100].map((r, i) => (
                <polygon
                  key={i}
                  points={mockReport.dimensions
                    .map((_, j) => {
                      const angle = (j * 72 - 90) * (Math.PI / 180);
                      const x = 100 + r * 0.8 * Math.cos(angle);
                      const y = 100 + r * 0.8 * Math.sin(angle);
                      return `${x},${y}`;
                    })
                    .join(' ')}
                  fill="none"
                  stroke="#E5E7EB"
                  strokeWidth="1"
                />
              ))}
              {mockReport.dimensions.map((_, i) => {
                const angle = (i * 72 - 90) * (Math.PI / 180);
                const x = 100 + 80 * Math.cos(angle);
                const y = 100 + 80 * Math.sin(angle);
                return (
                  <line
                    key={i}
                    x1="100"
                    y1="100"
                    x2={x}
                    y2={y}
                    stroke="#E5E7EB"
                    strokeWidth="1"
                  />
                );
              })}
              <motion.polygon
                points={mockReport.dimensions
                  .map((d, i) => {
                    const angle = (i * 72 - 90) * (Math.PI / 180);
                    const r = (d.score / 100) * 80;
                    const x = 100 + r * Math.cos(angle);
                    const y = 100 + r * Math.sin(angle);
                    return `${x},${y}`;
                  })
                  .join(' ')}
                fill="rgba(14,165,233,0.15)"
                stroke="#0EA5E9"
                strokeWidth="2"
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5, duration: 0.8 }}
                style={{ transformOrigin: 'center' }}
              />
              {mockReport.dimensions.map((d, i) => {
                const angle = (i * 72 - 90) * (Math.PI / 180);
                const x = 100 + 95 * Math.cos(angle);
                const y = 100 + 95 * Math.sin(angle);
                return (
                  <text
                    key={i}
                    x={x}
                    y={y}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="text-[10px] fill-gray-500"
                  >
                    {d.name}
                  </text>
                );
              })}
            </svg>
          </div>
        </motion.div>

        {/* AI 点评 */}
        <motion.div
          className="bg-white rounded-xl border border-gray-200 p-6 space-y-6 shadow-soft"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div>
            <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Award className="w-5 h-5 text-success-500" strokeWidth={1.5} /> 亮点与优势
            </h3>
            <ul className="space-y-3">
              {mockReport.strengths.map((s, i) => (
                <motion.li
                  key={i}
                  className="flex items-start gap-3 text-sm text-gray-600"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + i * 0.1 }}
                >
                  <CheckCircle className="w-4 h-4 text-success-500 mt-0.5 flex-shrink-0" strokeWidth={1.5} />
                  {s}
                </motion.li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Target className="w-5 h-5 text-warning-500" strokeWidth={1.5} /> 改进建议
            </h3>
            <ul className="space-y-3">
              {mockReport.improvements.map((s, i) => (
                <motion.li
                  key={i}
                  className="flex items-start gap-3 text-sm text-gray-600"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.8 + i * 0.1 }}
                >
                  <TrendingUp className="w-4 h-4 text-warning-500 mt-0.5 flex-shrink-0" strokeWidth={1.5} />
                  {s}
                </motion.li>
              ))}
            </ul>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
