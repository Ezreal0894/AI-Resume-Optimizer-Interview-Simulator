/**
 * 面试相关 API
 * 🛡️ 防御性重构：支持 SSE 取消、重连、超时控制
 */
import apiClient from './client';
import { useAuthStore } from '../stores/authStore';

export interface ChatMessage {
  role: 'system' | 'assistant' | 'user';
  content: string;
}

export interface InterviewSession {
  id: string;
  jobTitle: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD' | 'EXPERT';
  status: 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  metrics?: InterviewMetrics;
  startedAt: string;
  endedAt?: string;
  isPinned?: boolean;
}

export interface InterviewMetrics {
  overallScore: number;
  radar: {
    technical: number;
    communication: number;
    problemSolving: number;
    cultureFit: number;
    leadership: number;
  };
  feedback: {
    strengths: string[];
    improvements: string[];
  };
}

// SSE 流控制器类型
export interface StreamController {
  abort: () => void;
}

// SSE 配置
const SSE_CONFIG = {
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000,
  TIMEOUT: 60000, // 60 秒超时
};

export const interviewApi = {
  // 创建面试会话（v3.0 支持 Resume/Topic 双模式 + Phase 3 自定义知识点）
  createSession: (params: { 
    mode: 'RESUME' | 'TOPIC';
    jobTitle: string; 
    jobDescription?: string; 
    difficulty?: string;
    resumeId?: string;  // Resume 模式必填
    customKnowledgePoints?: string[];  // 🆕 Phase 3: Resume 模式可选
    topics?: string[];  // Topic 模式必填
  }) =>
    apiClient.post<{ message: string; data: { sessionId: string; greeting: string } }>(
      '/interview/session',
      params
    ),

  /**
   * SSE 流式对话（支持取消、重连、超时）
   * @returns StreamController 用于外部取消连接
   */
  streamChat: (
    sessionId: string,
    messages: ChatMessage[],
    onChunk: (content: string) => void,
    onDone: () => void,
    onError: (error: string) => void
  ): StreamController => {
    const abortController = new AbortController();
    let retryCount = 0;
    let isAborted = false;

    const executeStream = async () => {
      const token = useAuthStore.getState().accessToken;

      // 超时控制
      const timeoutId = setTimeout(() => {
        if (!isAborted) {
          abortController.abort();
          onError('请求超时，请重试');
        }
      }, SSE_CONFIG.TIMEOUT);

      try {
        const response = await fetch(`/api/interview/chat/${sessionId}/stream`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          credentials: 'include',
          body: JSON.stringify({ messages }),
          signal: abortController.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: 请求失败`);
        }

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();

        if (!reader) {
          throw new Error('无法读取响应流');
        }

        // 重置重试计数
        retryCount = 0;

        while (!isAborted) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));
                if (data.content) {
                  onChunk(data.content);
                }
                if (data.done) {
                  onDone();
                  return; // 正常结束
                }
                if (data.error) {
                  onError(data.error);
                  return;
                }
              } catch {
                // 忽略单行解析错误，继续处理
              }
            }
          }
        }

        // 正常读取完毕
        if (!isAborted) {
          onDone();
        }
      } catch (error) {
        clearTimeout(timeoutId);

        // 用户主动取消，不触发错误回调
        if (isAborted || (error instanceof Error && error.name === 'AbortError')) {
          return;
        }

        // 网络错误重试逻辑
        if (retryCount < SSE_CONFIG.MAX_RETRIES) {
          retryCount++;
          console.warn(`SSE 连接失败，${SSE_CONFIG.RETRY_DELAY}ms 后重试 (${retryCount}/${SSE_CONFIG.MAX_RETRIES})`);
          await new Promise((resolve) => setTimeout(resolve, SSE_CONFIG.RETRY_DELAY));
          if (!isAborted) {
            return executeStream();
          }
        } else {
          onError(error instanceof Error ? error.message : '网络错误，请检查连接');
        }
      }
    };

    // 启动流
    executeStream();

    // 返回控制器供外部取消
    return {
      abort: () => {
        isAborted = true;
        abortController.abort();
      },
    };
  },

  // 结束面试
  endSession: (sessionId: string) =>
    apiClient.post<{ message: string; data: { sessionId: string; metrics: InterviewMetrics } }>(
      `/interview/session/${sessionId}/end`
    ),

  // 获取会话列表
  getSessions: () =>
    apiClient.get<{ data: InterviewSession[] }>('/interview/sessions'),

  // 获取会话详情
  getSessionDetail: (sessionId: string) =>
    apiClient.get<{ data: InterviewSession & { messages: ChatMessage[] } }>(
      `/interview/session/${sessionId}`
    ),

  // 获取历史趋势数据
  getHistoryTrend: () =>
    apiClient.get<{ data: { sessionId: string; overallScore: number; createdAt: Date }[] }>(
      '/interview/history/trend'
    ),

  // 切换会话置顶状态
  togglePin: (sessionId: string) =>
    apiClient.patch<{ data: { id: string; isPinned: boolean } }>(
      `/interview/session/${sessionId}/pin`
    ),

  // 删除面试会话
  deleteSession: (sessionId: string) =>
    apiClient.delete<{ message: string }>(
      `/interview/session/${sessionId}`
    ),
};
