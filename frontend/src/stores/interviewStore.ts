/**
 * 面试状态管理
 * 管理面试会话、消息、语音状态
 */
import { create } from 'zustand';

interface Message {
  id: string;
  role: 'assistant' | 'user';
  content: string;
  timestamp: Date;
}

interface InterviewState {
  // 会话状态
  sessionId: string | null;
  jobTitle: string;
  isActive: boolean;

  // 消息列表
  messages: Message[];

  // 流式响应状态
  isStreaming: boolean;
  streamingContent: string;

  // 语音状态
  isListening: boolean;
  isSpeaking: boolean;

  // Actions
  setSession: (sessionId: string, jobTitle: string) => void;
  addMessage: (role: 'assistant' | 'user', content: string) => void;
  setStreaming: (isStreaming: boolean) => void;
  appendStreamContent: (content: string) => void;
  finalizeStream: () => void;
  setListening: (isListening: boolean) => void;
  setSpeaking: (isSpeaking: boolean) => void;
  endSession: () => void;
  reset: () => void;
}

export const useInterviewStore = create<InterviewState>((set, get) => ({
  // 初始状态
  sessionId: null,
  jobTitle: '',
  isActive: false,
  messages: [],
  isStreaming: false,
  streamingContent: '',
  isListening: false,
  isSpeaking: false,

  // 设置会话
  setSession: (sessionId, jobTitle) =>
    set({
      sessionId,
      jobTitle,
      isActive: true,
      messages: [],
    }),

  // 添加消息
  addMessage: (role, content) =>
    set((state) => ({
      messages: [
        ...state.messages,
        {
          id: Date.now().toString(),
          role,
          content,
          timestamp: new Date(),
        },
      ],
    })),

  // 设置流式状态
  setStreaming: (isStreaming) =>
    set({ isStreaming, streamingContent: isStreaming ? '' : get().streamingContent }),

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
            id: Date.now().toString(),
            role: 'assistant',
            content: streamingContent,
            timestamp: new Date(),
          },
        ],
        streamingContent: '',
        isStreaming: false,
      }));
    }
  },

  // 设置监听状态
  setListening: (isListening) => set({ isListening }),

  // 设置播报状态
  setSpeaking: (isSpeaking) => set({ isSpeaking }),

  // 结束会话
  endSession: () => set({ isActive: false }),

  // 重置状态
  reset: () =>
    set({
      sessionId: null,
      jobTitle: '',
      isActive: false,
      messages: [],
      isStreaming: false,
      streamingContent: '',
      isListening: false,
      isSpeaking: false,
    }),
}));
