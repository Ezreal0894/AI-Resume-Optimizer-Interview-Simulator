/**
 * 简历状态管理
 */
import { create } from 'zustand';
import { Resume, ResumeAnalysis } from '../api/resume';

interface ResumeState {
  // 简历列表
  resumes: Resume[];
  
  // 当前选中的简历
  currentResume: Resume | null;
  currentAnalysis: ResumeAnalysis | null;

  // 上传状态
  isUploading: boolean;
  uploadProgress: number;

  // Actions
  setResumes: (resumes: Resume[]) => void;
  addResume: (resume: Resume) => void;
  setCurrentResume: (resume: Resume | null, analysis?: ResumeAnalysis | null) => void;
  setUploading: (isUploading: boolean, progress?: number) => void;
}

export const useResumeStore = create<ResumeState>((set) => ({
  resumes: [],
  currentResume: null,
  currentAnalysis: null,
  isUploading: false,
  uploadProgress: 0,

  setResumes: (resumes) => set({ resumes }),

  addResume: (resume) =>
    set((state) => ({
      resumes: [resume, ...state.resumes],
    })),

  setCurrentResume: (resume, analysis = null) =>
    set({
      currentResume: resume,
      currentAnalysis: analysis,
    }),

  setUploading: (isUploading, progress = 0) =>
    set({ isUploading, uploadProgress: progress }),
}));
