/**
 * Dashboard 布局组件
 * 设计系统：极简现代主义，清晰视觉层次
 */
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Briefcase,
  FileText,
  Mic,
  BarChart3,
  Settings,
  LogOut,
  Bell,
} from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { authApi } from '../api/auth';

const navItems = [
  { path: '/dashboard', icon: Briefcase, label: '工作台', end: true },
  { path: '/dashboard/resume', icon: FileText, label: '简历优化' },
  { path: '/dashboard/interview', icon: Mic, label: '模拟面试' },
  { path: '/dashboard/report', icon: BarChart3, label: '能力报告' },
  { path: '/dashboard/settings', icon: Settings, label: '设置' },
];

export default function DashboardLayout() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch {
      // 忽略错误
    } finally {
      logout();
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen flex bg-white">
      {/* 侧边栏 - 浅色设计 */}
      <aside className="w-64 bg-gray-50 border-r border-gray-200 flex flex-col">
        {/* Logo */}
        <div className="p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-500 rounded-xl flex items-center justify-center shadow-soft">
              <Briefcase className="w-5 h-5 text-white" strokeWidth={1.5} />
            </div>
            <span className="text-xl font-bold text-gray-900">AI 职通车</span>
          </div>
        </div>

        {/* 导航菜单 */}
        <nav className="flex-1 px-4 py-2 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.end}
              className="relative block"
            >
              {({ isActive }: { isActive: boolean }) => (
                <motion.div 
                  className={`relative flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all duration-150 ${
                    isActive 
                      ? 'bg-primary-500 shadow-soft' 
                      : 'hover:bg-gray-100'
                  }`}
                  whileHover={{ scale: isActive ? 1 : 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <item.icon
                    className={`w-5 h-5 ${
                      isActive ? 'text-white' : 'text-gray-500'
                    }`}
                    strokeWidth={1.5}
                  />
                  <span
                    className={`text-sm ${
                      isActive ? 'text-white font-medium' : 'text-gray-600'
                    }`}
                  >
                    {item.label}
                  </span>
                </motion.div>
              )}
            </NavLink>
          ))}
        </nav>

        {/* 用户信息和登出 */}
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center gap-3 px-3 py-3 mb-2 bg-white rounded-xl shadow-soft">
            <div className="w-10 h-10 bg-primary-500 rounded-full flex items-center justify-center text-white text-sm font-semibold">
              {user?.name?.[0] || user?.email?.[0] || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user?.name || '用户'}
              </p>
              <p className="text-xs text-gray-400 truncate">{user?.email}</p>
            </div>
          </div>
          <motion.button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 w-full text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all duration-150"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <LogOut className="w-5 h-5" strokeWidth={1.5} />
            <span className="text-sm">退出登录</span>
          </motion.button>
        </div>
      </aside>

      {/* 主内容区 */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* 顶部导航栏 */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-end px-8">
          <div className="flex items-center gap-4">
            <motion.button
              className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-gray-50 transition-colors duration-150"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Bell className="w-5 h-5 text-gray-500" strokeWidth={1.5} />
            </motion.button>
            <div className="w-10 h-10 bg-primary-500 rounded-full flex items-center justify-center text-white text-sm font-semibold cursor-pointer">
              {user?.name?.[0] || user?.email?.[0] || 'U'}
            </div>
          </div>
        </header>

        {/* 页面内容 */}
        <main className="flex-1 overflow-auto bg-gray-50">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
