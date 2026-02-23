import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Sparkles, 
  User, 
  Mail, 
  Lock 
} from 'lucide-react';
import { authApi } from '../api/auth';
import { useAuthStore } from '../stores/authStore';

interface AuthLayoutProps {
  initialMode?: 'login' | 'register';
}

const AuthLayout: React.FC<AuthLayoutProps> = ({ initialMode = 'login' }) => {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleNavigate = (screen: string) => {
    if (screen === 'login') {
      setMode('login');
      navigate('/login', { replace: true });
    } else if (screen === 'register') {
      setMode('register');
      navigate('/register', { replace: true });
    } else if (screen === 'dashboard') {
      navigate('/dashboard');
    }
  };

  const handleSubmit = async () => {
    setError('');
    setIsLoading(true);

    try {
      if (mode === 'login') {
        const response = await authApi.login({ email, password });
        login(response.data.accessToken, response.data.user);
        navigate('/dashboard');
      } else {
        const response = await authApi.register({ email, password, name: name || undefined });
        // 先设置登录状态，再使用 window.location 硬跳转到 onboarding
        // 这样可以避免 React Router 的 PublicRoute 重定向问题
        login(response.data.accessToken, response.data.user);
        window.location.href = '/onboarding';
      }
    } catch (err: any) {
      setError(err.response?.data?.message || '操作失败，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-white">
      {/* Left Side - Brand */}
      <div className="hidden md:flex w-[40%] bg-slate-900 relative flex-col justify-between p-12 text-white overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1497215728101-856f4ea42174?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-10 mix-blend-overlay"></div>
        <div className="relative z-10 flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <span className="font-semibold text-lg">AI Career Coach</span>
        </div>
        <div className="relative z-10 space-y-6">
          <blockquote className="text-2xl font-medium leading-relaxed">
            "Every perfect interview begins with perfect preparation. Let AI be your unfair advantage."
          </blockquote>
          <div className="flex gap-2">
            <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
            <div className="w-2 h-2 rounded-full bg-slate-600"></div>
            <div className="w-2 h-2 rounded-full bg-slate-600"></div>
          </div>
        </div>
        <div className="relative z-10 text-sm text-slate-500">
          © 2026 AI Career Coach Inc.
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-slate-900 tracking-tight">
              {mode === 'login' ? 'Welcome back' : 'Create an account'}
            </h2>
            <p className="mt-2 text-slate-500">
              {mode === 'login' ? 'Enter your details to access your dashboard' : 'Start your journey to career success today'}
            </p>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600 text-center">
              {error}
            </div>
          )}

          <div className="space-y-6">
            {mode === 'register' && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input 
                    type="text" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 transition-all"
                    placeholder="John Doe"
                  />
                </div>
              </div>
            )}
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 transition-all"
                  placeholder="john@example.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button 
              onClick={handleSubmit}
              disabled={isLoading}
              className="w-full bg-indigo-600 text-white py-3 rounded-xl font-semibold shadow-lg shadow-indigo-500/20 hover:bg-indigo-700 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? '处理中...' : (mode === 'login' ? 'Sign In' : 'Create Account')}
            </button>

            <div className="text-center">
              <button 
                onClick={() => handleNavigate(mode === 'login' ? 'register' : 'login')}
                className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
              >
                {mode === 'login' ? "Don't have an account? Sign up for free" : "Already have an account? Sign in"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
