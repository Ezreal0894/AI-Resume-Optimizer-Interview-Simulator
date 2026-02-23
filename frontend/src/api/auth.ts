/**
 * 认证相关 API
 */
import apiClient from './client';

export interface LoginParams {
  email: string;
  password: string;
}

export interface RegisterParams {
  email: string;
  password: string;
  name?: string;
}

export interface AuthResponse {
  message: string;
  accessToken: string;
  user: {
    id: string;
    email: string;
    name: string | null;
    plan: string;
  };
}

export const authApi = {
  // 登录
  login: (params: LoginParams) =>
    apiClient.post<AuthResponse>('/auth/login', params),

  // 注册
  register: (params: RegisterParams) =>
    apiClient.post<AuthResponse>('/auth/register', params),

  // 刷新 Token
  refresh: () =>
    apiClient.post<{ accessToken: string }>('/auth/refresh'),

  // 登出
  logout: () =>
    apiClient.post('/auth/logout'),

  // 获取当前用户
  getCurrentUser: () =>
    apiClient.get<{ user: AuthResponse['user'] }>('/auth/me'),
};
