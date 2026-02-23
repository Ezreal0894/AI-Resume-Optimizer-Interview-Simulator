/**
 * 设置页面 - 容器组件 (Smart Component)
 * 负责业务逻辑：认证状态管理、API 调用、路由跳转
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { userApi, UserProfile } from '../api/user';
import { authApi } from '../api/auth';
import SettingsView from '../views/SettingsView';

export default function SettingsPage() {
  const navigate = useNavigate();
  const { logout } = useAuthStore();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 获取用户资料
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await userApi.getProfile();
        setProfile(response.data.data);
      } catch (error) {
        console.error('Failed to fetch profile:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch (error) {
      console.error('Logout API failed:', error);
    } finally {
      logout();
      navigate('/');
    }
  };

  const handleSaveTags = async (tags: string[]) => {
    try {
      await userApi.updateTags(tags);
      setProfile(prev => prev ? { ...prev, tags } : null);
    } catch (error) {
      console.error('Failed to save tags:', error);
    }
  };

  const handleSaveProfile = async (data: {
    name: string;
    title: string;
    bio: string;
    location: string;
    website: string;
  }) => {
    try {
      await userApi.updateProfile(data);
      setProfile(prev => prev ? { ...prev, ...data } : null);
    } catch (error) {
      console.error('Failed to save profile:', error);
    }
  };

  const handleUploadAvatar = async (file: File) => {
    try {
      const response = await userApi.uploadAvatar(file);
      setProfile(prev => prev ? { ...prev, avatarUrl: response.data.data.avatarUrl } : null);
      return response.data.data.avatarUrl;
    } catch (error) {
      console.error('Failed to upload avatar:', error);
      return null;
    }
  };

  const handleDeleteAvatar = async () => {
    try {
      await userApi.deleteAvatar();
      setProfile(prev => prev ? { ...prev, avatarUrl: null } : null);
    } catch (error) {
      console.error('Failed to delete avatar:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <SettingsView
      onLogout={handleLogout}
      profile={profile}
      onSaveTags={handleSaveTags}
      onSaveProfile={handleSaveProfile}
      onUploadAvatar={handleUploadAvatar}
      onDeleteAvatar={handleDeleteAvatar}
    />
  );
}
