/**
 * 用户相关 API
 */
import apiClient from './client';

export interface UserProfile {
  id: string;
  email: string;
  name: string | null;
  title: string | null;
  bio: string | null;
  location: string | null;
  website: string | null;
  avatarUrl: string | null;
  tags: string[];
  plan: string;
  credits: number;
  createdAt: string;
}

export interface UpdateProfileParams {
  name?: string;
  title?: string;
  bio?: string;
  location?: string;
  website?: string;
}

export const userApi = {
  // 获取用户资料
  getProfile: () =>
    apiClient.get<{ data: UserProfile }>('/user/profile'),

  // 更新用户资料
  updateProfile: (params: UpdateProfileParams) =>
    apiClient.put<{ message: string; data: Partial<UserProfile> }>('/user/profile', params),

  // 更新用户标签
  updateTags: (tags: string[]) =>
    apiClient.put<{ message: string; data: { tags: string[] } }>('/user/tags', { tags }),

  // 上传头像
  uploadAvatar: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return apiClient.post<{ message: string; data: { avatarUrl: string } }>('/user/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  // 删除头像
  deleteAvatar: () =>
    apiClient.delete<{ message: string }>('/user/avatar'),

  // 保存 Onboarding 标签
  saveOnboarding: (tags: string[]) =>
    apiClient.post<{ message: string; data: UserProfile }>('/user/onboarding', { tags }),

  // 获取积分
  getCredits: () =>
    apiClient.get<{ data: { credits: number } }>('/user/credits'),
};
