/**
 * 面试状态管理 - 企业级重构版
 * 
 * 核心能力：
 * 1. 跨页面状态持久化（切页不丢失）
 * 2. 开场白锁（防重复播报）
 * 3. AI 状态机管理
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// AI 状态机类型
export type AIState = 'idle' | 'listening' | 'thinking' | 'speaking' | 'paused';

// 消息类型
export interface InterviewMessage {
  id: string;
  role: 'assistant' | 'user';
  content: string;
  timestamp: Date;
}

// 面试进度类型
export interface InterviewProgress {
  currentQuestion: number;
  totalQuestions: number;
  elapsedSeconds: number;
}

interface InterviewState {
  // 会话状态
  sessionId: string | null;
  jobTitle: string;
  isActive: boolean;
  
  // 🔒 开场白锁 - 防止重复播报
  hasGreeted: boolean;
  
  // AI 状态机
  aiState: AIState;
  
  // 消息列表（持久化）
  messages: InterviewMessage[];
  
  // 流式响应状态
  isStreaming: boolean;
  streamingContent: string;
  
  // 面试进度
  progress: InterviewProgress;
  
  // 面试结束标志
  isInterviewEnded: boolean;
  
  // 初始化错误
  initError: string | null;

  // Actions
  setSession: (sessionId: string, jobTitle: string) => void;
  setGreeted: () => void;
  setAIState: (state: AIState) => void;
  addMessage: (role: 'assistant' | 'user', content: string) => void;
  setStreaming: (isStreaming: boolean) => void;
  appendStreamContent: (content: string) => void;
  finalizeStream: () => void;
  updateProgress: (updates: Partial<InterviewProgress>) => void;
  incrementTimer: () => void;
  setInterviewEnded: (ended: boolean) => void;
  setInitError: (error: string | null) => void;
  pauseSession: () => void;
  resumeSession: () => void;
  endSession: () => void;
  reset: () => void;
}


// 初始状态
const initialState = {
  sessionId: null,
  jobTitle: '',
  isActive: false,
  hasGreeted: false,
  aiState: 'idle' as AIState,
  messages: [],
  isStreaming: false,
  streamingContent: '',
  progress: {
    currentQuestion: 0,
    totalQuestions: 5,
    elapsedSeconds: 0,
  },
  isInterviewEnded: false,
  initError: null,
};

export const useInterviewStore = create<InterviewState>()(
  persist(
    (set, get) => ({
      ...initialState,

      // 设置会话（保留已有消息）
      setSession: (sessionId, jobTitle) =>
        set((state) => ({
          sessionId,
          jobTitle,
          isActive: true,
          // 如果是同一个 session，保留消息；否则清空
          messages: state.sessionId === sessionId ? state.messages : [],
          hasGreeted: state.sessionId === sessionId ? state.hasGreeted : false,
        })),

      // 🔒 标记开场白已播报
      setGreeted: () => set({ hasGreeted: true }),

      // 设置 AI 状态
      setAIState: (aiState) => set({ aiState }),

      // 添加消息
      addMessage: (role, content) =>
        set((state) => ({
          messages: [
            ...state.messages,
            {
              id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              role,
              content,
              timestamp: new Date(),
            },
          ],
        })),

      // 设置流式状态
      setStreaming: (isStreaming) =>
        set({ 
          isStreaming, 
          streamingContent: isStreaming ? '' : get().streamingContent,
          aiState: isStreaming ? 'thinking' : get().aiState,
        }),

      // 追加流式内容
      appendStreamContent: (content) =>
        set((state) => ({
          streamingContent: state.streamingContent + content,
        })),

      // 完成流式响应
      finalizeStream: () => {
        const { streamingContent } = get();
        if (streamingContent) {
          set((state) => ({
            messages: [
              ...state.messages,
              {
                id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                role: 'assistant',
                content: streamingContent,
                timestamp: new Date(),
              },
            ],
            streamingContent: '',
            isStreaming: false,
            progress: {
              ...state.progress,
              currentQuestion: Math.min(state.progress.currentQuestion + 1, state.progress.totalQuestions),
            },
          }));
        }
      },

      // 更新进度
      updateProgress: (updates) =>
        set((state) => ({
          progress: { ...state.progress, ...updates },
        })),

      // 计时器递增
      incrementTimer: () =>
        set((state) => ({
          progress: {
            ...state.progress,
            elapsedSeconds: state.progress.elapsedSeconds + 1,
          },
        })),

      // 设置面试结束
      setInterviewEnded: (ended) => set({ isInterviewEnded: ended }),

      // 设置初始化错误
      setInitError: (error) => set({ initError: error }),

      // 暂停会话（切页时调用）
      pauseSession: () => set({ aiState: 'paused' }),

      // 恢复会话
      resumeSession: () => set({ aiState: 'idle' }),

      // 结束会话
      endSession: () => set({ isActive: false, aiState: 'idle' }),

      // 完全重置（开始新面试时调用）
      reset: () => set(initialState),
    }),
    {
      name: 'interview-storage',
      // 只持久化关键状态
      partialize: (state) => ({
        sessionId: state.sessionId,
        jobTitle: state.jobTitle,
        isActive: state.isActive,
        hasGreeted: state.hasGreeted,
        messages: state.messages,
        progress: state.progress,
        isInterviewEnded: state.isInterviewEnded,
      }),
    }
  )
);
