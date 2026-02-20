/**
 * 认证状态管理
 * 使用 Zustand 管理用户认证状态
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  email: string;
  name: string | null;
  plan: string;
}

interface AuthState {
  // 状态
  accessToken: string | null;
  user: User | null;
  isAuthenticated: boolean;

  // Actions
  setAccessToken: (token: string) => void;
  setUser: (user: User) => void;
  login: (token: string, user: User) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      // 初始状态
      accessToken: null,
      user: null,
      isAuthenticated: false,

      // 设置 Access Token
      setAccessToken: (token) =>
        set({ accessToken: token }),

      // 设置用户信息
      setUser: (user) =>
        set({ user, isAuthenticated: true }),

      // 登录
      login: (token, user) =>
        set({
          accessToken: token,
          user,
          isAuthenticated: true,
        }),

      // 登出
      logout: () =>
        set({
          accessToken: null,
          user: null,
          isAuthenticated: false,
        }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        accessToken: state.accessToken,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
