/**
 * 简历相关 API
 */
import apiClient from './client';

export interface ResumeAnalysis {
  overallScore: number;
  atsCompatibility: {
    score: number;
    suggestions: string[];
  };
  keywordAnalysis: {
    matched: string[];
    missing: string[];
  };
  structureAnalysis: {
    sections: string[];
    improvements: string[];
  };
  contentSuggestions: string[];
}

export interface Resume {
  id: string;
  fileName: string;
  fileSize: number;
  status: 'PENDING' | 'ANALYZING' | 'COMPLETED' | 'FAILED';
  analysisReport?: ResumeAnalysis;
  createdAt: string;
  updatedAt: string;
}

export const resumeApi = {
  // 上传简历
  upload: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return apiClient.post<{ message: string; data: { resume: Resume; analysis: ResumeAnalysis } }>(
      '/resume/upload',
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
  },

  // 获取简历列表
  getList: () =>
    apiClient.get<{ data: Resume[] }>('/resume/list'),

  // 获取简历详情
  getDetail: (id: string) =>
    apiClient.get<{ data: Resume }>(`/resume/${id}`),
};
