/**
 * 注册页面
 * 设计系统：极简现代主义，清晰视觉层次
 */
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Briefcase, Loader2, CheckCircle } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { authApi } from '../api/auth';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { login } = useAuthStore();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!agreed) {
      setError('请先同意服务条款和隐私政策');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      const response = await authApi.register({ email, password, name });
      login(response.data.accessToken, response.data.user);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || '注册失败，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* 左侧品牌区 */}
      <div className="hidden lg:flex w-[45%] bg-gray-900 p-12 flex-col justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary-500 rounded-xl flex items-center justify-center shadow-soft">
            <Briefcase className="w-5 h-5 text-white" strokeWidth={1.5} />
          </div>
          <span className="text-xl font-bold text-white">AI 职通车</span>
        </div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <p className="text-3xl text-white font-light leading-relaxed mb-8">
            "开启你的求职进阶之旅，
            <br />
            让 AI 成为你的职场导师。"
          </p>
          <ul className="space-y-4 text-gray-300">
            <li className="flex items-center gap-3 text-sm">
              <CheckCircle className="w-5 h-5 text-primary-400" strokeWidth={1.5} />
              专业简历诊断与优化
            </li>
            <li className="flex items-center gap-3 text-sm">
              <CheckCircle className="w-5 h-5 text-primary-400" strokeWidth={1.5} />
              AI 实时模拟面试
            </li>
            <li className="flex items-center gap-3 text-sm">
              <CheckCircle className="w-5 h-5 text-primary-400" strokeWidth={1.5} />
              智能反馈与能力报告
            </li>
          </ul>
        </motion.div>
        <div className="text-gray-500 text-xs">© 2024 AI 职通车</div>
      </div>

      {/* 右侧表单区 */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white">
        <motion.div
          className="w-full max-w-md"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
        >
          <h1 className="text-2xl font-bold text-gray-900 mb-2">创建账号</h1>
          <p className="text-sm text-gray-400 mb-8">开始你的 AI 求职之旅</p>

          {error && (
            <div className="mb-4 p-4 bg-error-50 border border-error-100 rounded-lg text-error-500 text-sm">
              {error}
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                姓名
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="你的姓名"
                className="w-full h-10 px-3 border border-gray-200 rounded-lg text-gray-900 text-sm focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/10 transition-all duration-150 placeholder:text-gray-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                邮箱地址
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full h-10 px-3 border border-gray-200 rounded-lg text-gray-900 text-sm focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/10 transition-all duration-150 placeholder:text-gray-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                密码
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="至少 8 个字符"
                required
                minLength={8}
                className="w-full h-10 px-3 border border-gray-200 rounded-lg text-gray-900 text-sm focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/10 transition-all duration-150 placeholder:text-gray-400"
              />
            </div>
            <label className="flex items-start gap-2 text-sm text-gray-500 cursor-pointer">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded border-gray-300 text-primary-500 focus:ring-primary-500"
              />
              <span>
                我同意{' '}
                <a href="#" className="text-primary-500 hover:text-primary-600">
                  服务条款
                </a>{' '}
                和{' '}
                <a href="#" className="text-primary-500 hover:text-primary-600">
                  隐私政策
                </a>
              </span>
            </label>
            <motion.button
              type="submit"
              disabled={isLoading}
              className="w-full h-10 bg-primary-500 text-white rounded-lg font-medium text-sm flex items-center justify-center gap-2 disabled:opacity-50 shadow-soft"
              whileHover={{ scale: 1.01, boxShadow: '0 8px 30px rgba(14,165,233,0.3)' }}
              whileTap={{ scale: 0.99 }}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  注册中...
                </>
              ) : (
                '创建账号'
              )}
            </motion.button>
          </form>

          <div className="mt-8">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-4 bg-white text-gray-400">或使用以下方式注册</span>
              </div>
            </div>
            <div className="mt-6 grid grid-cols-2 gap-4">
              <motion.button 
                className="flex items-center justify-center gap-2 h-10 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors duration-150"
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                Google
              </motion.button>
              <motion.button 
                className="flex items-center justify-center gap-2 h-10 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors duration-150"
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                微信
              </motion.button>
            </div>
          </div>

          <p className="mt-8 text-center text-sm text-gray-500">
            已有账号？{' '}
            <Link
              to="/login"
              className="text-primary-500 font-medium hover:text-primary-600 transition-colors duration-150"
            >
              立即登录
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
