/**
 * 工作台主页
 * 设计系统：卡片式布局，柔和阴影，大圆角
 */
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FileText, Mic, CheckCircle, BarChart3, ChevronRight, TrendingUp } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';

const activities = [
  {
    icon: CheckCircle,
    text: '完成了「字节跳动-前端工程师」模拟面试',
    time: '2小时前',
    iconBg: 'bg-success-50',
    iconColor: 'text-success-500',
  },
  {
    icon: FileText,
    text: '简历《前端开发工程师》已优化完成',
    time: '昨天',
    iconBg: 'bg-primary-50',
    iconColor: 'text-primary-500',
  },
  {
    icon: BarChart3,
    text: '查看了最新的能力分析报告',
    time: '2天前',
    iconBg: 'bg-warning-50',
    iconColor: 'text-warning-500',
  },
];

const stats = [
  { label: '模拟面试', value: '12', trend: '+3', trendUp: true },
  { label: '简历优化', value: '5', trend: '+1', trendUp: true },
  { label: '平均得分', value: '86', trend: '+5', trendUp: true },
];

export default function DashboardPage() {
  const user = useAuthStore((state) => state.user);

  return (
    <div className="p-8">
      {/* 欢迎区域 */}
      <motion.div
        className="mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <p className="text-sm text-gray-400 mb-1">欢迎回来</p>
        <h1 className="text-2xl font-bold text-gray-900">
          {user?.name || '用户'}，今天想提升哪方面的能力？
        </h1>
      </motion.div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            className="bg-white rounded-xl p-6 border border-gray-200 shadow-soft"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <p className="text-xs text-gray-400 mb-2">{stat.label}</p>
            <div className="flex items-end justify-between">
              <span className="text-3xl font-bold text-gray-900">{stat.value}</span>
              <span className={`flex items-center gap-1 text-xs font-medium ${
                stat.trendUp ? 'text-success-500' : 'text-error-500'
              }`}>
                <TrendingUp className="w-3 h-3" strokeWidth={2} />
                {stat.trend}
              </span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* 快捷入口卡片 */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <Link to="/dashboard/resume">
          <motion.div
            className="bg-white rounded-xl p-6 border border-gray-200 shadow-soft cursor-pointer group"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            whileHover={{ 
              y: -4, 
              boxShadow: '0 8px 30px rgba(0,0,0,0.1)',
            }}
          >
            <div className="w-12 h-12 bg-primary-50 rounded-xl flex items-center justify-center mb-4 group-hover:bg-primary-500 transition-colors duration-150">
              <FileText className="w-6 h-6 text-primary-500 group-hover:text-white transition-colors duration-150" strokeWidth={1.5} />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">优化简历</h3>
            <p className="text-sm text-gray-500">AI 深度分析，让你的简历脱颖而出</p>
          </motion.div>
        </Link>

        <Link to="/dashboard/interview">
          <motion.div
            className="bg-white rounded-xl p-6 border border-gray-200 shadow-soft cursor-pointer group"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            whileHover={{ 
              y: -4, 
              boxShadow: '0 8px 30px rgba(0,0,0,0.1)',
            }}
          >
            <div className="w-12 h-12 bg-primary-50 rounded-xl flex items-center justify-center mb-4 group-hover:bg-primary-500 transition-colors duration-150">
              <Mic className="w-6 h-6 text-primary-500 group-hover:text-white transition-colors duration-150" strokeWidth={1.5} />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">开始模拟面试</h3>
            <p className="text-sm text-gray-500">AI 面试官实时互动，告别面试焦虑</p>
          </motion.div>
        </Link>
      </div>

      {/* 最近活动 */}
      <motion.div
        className="bg-white rounded-xl border border-gray-200 shadow-soft"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">最近活动</h3>
        </div>
        <div className="divide-y divide-gray-100">
          {activities.map((activity, i) => (
            <motion.div
              key={i}
              className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors duration-150 cursor-pointer"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 + i * 0.1 }}
            >
              <div className={`w-10 h-10 ${activity.iconBg} rounded-full flex items-center justify-center`}>
                <activity.icon className={`w-5 h-5 ${activity.iconColor}`} strokeWidth={1.5} />
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-700">{activity.text}</p>
                <p className="text-xs text-gray-400">{activity.time}</p>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-300" strokeWidth={1.5} />
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
