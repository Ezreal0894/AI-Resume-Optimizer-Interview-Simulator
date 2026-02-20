/**
 * 设置页面
 * 设计系统：卡片式布局，清晰视觉层次
 */
import { motion } from 'framer-motion';
import { User, Shield, Bell, Lock, ChevronRight, CheckCircle } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';

interface UserType {
  id: string;
  email: string;
  name: string | null;
  plan: string;
}

interface AuthState {
  user: UserType | null;
}

const settingItems = [
  {
    icon: User,
    title: '个人资料',
    desc: '更新你的姓名、头像和联系方式',
    iconBg: 'bg-primary-50',
    iconColor: 'text-primary-500',
  },
  {
    icon: Shield,
    title: '账户安全',
    desc: '修改密码和两步验证设置',
    iconBg: 'bg-warning-50',
    iconColor: 'text-warning-500',
  },
  {
    icon: Bell,
    title: '通知设置',
    desc: '管理邮件和推送通知偏好',
    iconBg: 'bg-success-50',
    iconColor: 'text-success-500',
  },
  {
    icon: Lock,
    title: '隐私设置',
    desc: '控制数据共享和可见性',
    iconBg: 'bg-purple-50',
    iconColor: 'text-purple-500',
  },
];

const planFeatures = ['无限简历优化', '每月 50 次模拟面试', '详细能力分析报告'];

const usageStats = [
  { label: '模拟面试', value: '23/50 次', progress: 46, color: 'bg-primary-500' },
  { label: '简历优化', value: '无限制', progress: 100, color: 'bg-success-500' },
  { label: '能力报告', value: '8 份', progress: 80, color: 'bg-warning-500' },
];

export default function SettingsPage() {
  const user = useAuthStore((state: AuthState) => state.user);

  return (
    <div className="p-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">设置</h1>
        <p className="text-sm text-gray-400 mb-8">管理你的账户和偏好设置</p>
      </motion.div>

      <div className="flex gap-6">
        {/* 左侧主内容 */}
        <div className="flex-1 space-y-4">
          {/* 用户资料卡片 */}
          <motion.div
            className="bg-white rounded-xl border border-gray-200 p-6 shadow-soft"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-primary-500 rounded-full flex items-center justify-center text-white text-xl font-semibold">
                {user?.name?.[0] || user?.email?.[0] || 'U'}
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900">
                  {user?.name || '用户'}
                </h3>
                <p className="text-sm text-gray-400">{user?.email}</p>
                <span className="inline-block mt-1 px-3 py-1 bg-primary-50 text-primary-500 text-xs font-medium rounded-full">
                  {user?.plan === 'PRO' ? '专业版会员' : '免费版'}
                </span>
              </div>
              <motion.button 
                className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors duration-150"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                编辑资料
              </motion.button>
            </div>
          </motion.div>

          {/* 设置选项列表 */}
          <motion.div
            className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100 shadow-soft"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            {settingItems.map((item, i) => (
              <motion.button
                key={i}
                className="w-full flex items-center gap-4 p-5 hover:bg-gray-50 transition-colors duration-150 text-left cursor-pointer"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.1 }}
              >
                <div className={`w-10 h-10 ${item.iconBg} rounded-xl flex items-center justify-center`}>
                  <item.icon className={`w-5 h-5 ${item.iconColor}`} strokeWidth={1.5} />
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-gray-900">{item.title}</h4>
                  <p className="text-xs text-gray-400">{item.desc}</p>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-300" strokeWidth={1.5} />
              </motion.button>
            ))}
          </motion.div>
        </div>

        {/* 右侧边栏 */}
        <div className="w-80 space-y-4">
          {/* 订阅计划 */}
          <motion.div
            className="bg-white rounded-xl border border-gray-200 p-6 shadow-soft"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h3 className="text-base font-semibold text-gray-900 mb-4">订阅计划</h3>
            <div className="bg-primary-50 rounded-xl p-4 mb-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold text-primary-500">专业版</span>
                <span className="text-xs font-medium text-primary-500">¥99/月</span>
              </div>
              <ul className="space-y-2">
                {planFeatures.map((feature, i) => (
                  <li key={i} className="flex items-center gap-2 text-xs text-primary-600">
                    <CheckCircle className="w-3 h-3" strokeWidth={1.5} />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
            <motion.button
              className="w-full h-10 bg-primary-500 text-white rounded-lg font-medium text-sm shadow-soft"
              whileHover={{ scale: 1.01, boxShadow: '0 8px 30px rgba(14,165,233,0.3)' }}
              whileTap={{ scale: 0.99 }}
            >
              续费订阅
            </motion.button>
            <p className="text-center text-xs text-gray-400 mt-3">
              下次续费日期：2024年3月15日
            </p>
          </motion.div>

          {/* 使用情况 */}
          <motion.div
            className="bg-white rounded-xl border border-gray-200 p-6 shadow-soft"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <h3 className="text-base font-semibold text-gray-900 mb-4">本月使用情况</h3>
            <div className="space-y-4">
              {usageStats.map((stat, i) => (
                <div key={i}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-gray-400">{stat.label}</span>
                    <span className="text-xs font-medium text-gray-900">{stat.value}</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <motion.div
                      className={`h-full ${stat.color} rounded-full`}
                      initial={{ width: 0 }}
                      animate={{ width: `${stat.progress}%` }}
                      transition={{ delay: 0.5 + i * 0.1, duration: 0.8 }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
