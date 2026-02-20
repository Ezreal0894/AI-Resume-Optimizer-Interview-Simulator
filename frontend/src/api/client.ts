/**
 * Axios 客户端封装
 * 🛡️ 防御性重构：请求拦截、响应拦截、无感刷新 Token（带重试限制）
 */
import axios, { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '../stores/authStore';

// 刷新配置
const REFRESH_CONFIG = {
  MAX_RETRY_COUNT: 3,  // 最大重试次数
  RETRY_DELAY: 500,    // 重试延迟（毫秒）
};

// 创建 Axios 实例
const apiClient = axios.create({
  baseURL: '/api',
  timeout: 30000,
  withCredentials: true, // 携带 Cookie（用于 Refresh Token）
});

// 请求队列（用于 Token 刷新时挂起请求）
let isRefreshing = false;
let refreshRetryCount = 0;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: Error) => void;
}> = [];

// 处理队列中的请求
const processQueue = (error: Error | null, token: string | null = null): void => {
  failedQueue.forEach((promise) => {
    if (error) {
      promise.reject(error);
    } else if (token) {
      promise.resolve(token);
    }
  });
  failedQueue = [];
};

// 请求拦截器：附加 Access Token
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
    const token = useAuthStore.getState().accessToken;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError): Promise<never> => Promise.reject(error)
);

// 响应拦截器：处理 401 错误，实现无感刷新
apiClient.interceptors.response.use(
  (response: AxiosResponse): AxiosResponse => response,
  async (error: AxiosError): Promise<AxiosResponse> => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // 如果没有 config，直接拒绝
    if (!originalRequest) {
      return Promise.reject(error);
    }

    // 如果是 401 错误且不是刷新 Token 的请求
    if (error.response?.status === 401 && !originalRequest._retry) {
      // 如果正在刷新，将请求加入队列
      if (isRefreshing) {
        return new Promise<string>((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token: string) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return apiClient(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // 检查重试次数
        if (refreshRetryCount >= REFRESH_CONFIG.MAX_RETRY_COUNT) {
          throw new Error('刷新令牌重试次数已达上限');
        }
        refreshRetryCount++;

        // 调用刷新 Token 接口（使用独立的 axios 实例避免循环）
        const response = await axios.post<{ accessToken: string }>(
          '/api/auth/refresh',
          {},
          { withCredentials: true, timeout: 10000 }
        );
        const { accessToken } = response.data;

        // 更新 Store 中的 Token
        useAuthStore.getState().setAccessToken(accessToken);

        // 重置重试计数
        refreshRetryCount = 0;

        // 处理队列中的请求
        processQueue(null, accessToken);

        // 重试原始请求
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        // 刷新失败，清除认证状态
        processQueue(refreshError instanceof Error ? refreshError : new Error('刷新失败'), null);
        
        // 重置状态
        refreshRetryCount = 0;
        useAuthStore.getState().logout();
        
        // 延迟跳转，避免阻塞
        setTimeout(() => {
          window.location.href = '/login';
        }, 100);
        
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
