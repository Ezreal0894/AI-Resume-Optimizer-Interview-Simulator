/**
 * 面试引擎 Hook - 企业级重构版
 * 
 * 核心能力：
 * 1. 状态提升到 Zustand（跨页面持久化）
 * 2. 完善的生命周期清理（强行闭嘴）
 * 3. 开场白锁 + 空输入拦截
 * 4. 霸气打断机制
 */
import { useEffect, useRef, useCallback } from 'react';
import { interviewApi, StreamController } from '../api/interview';
import { useInterviewStore, AIState, InterviewMessage, InterviewProgress } from '../stores/interviewStore';

// Web Speech API 类型声明
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface ISpeechRecognition extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onstart: ((this: ISpeechRecognition, ev: Event) => any) | null;
  onend: ((this: ISpeechRecognition, ev: Event) => any) | null;
  onerror: ((this: ISpeechRecognition, ev: any) => any) | null;
  onresult: ((this: ISpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

declare global {
  interface Window {
    SpeechRecognition: new () => ISpeechRecognition;
    webkitSpeechRecognition: new () => ISpeechRecognition;
  }
}

// 终结符标记
const INTERVIEW_END_MARKER = '[INTERVIEW_END]';

// 最小有效输入长度
const MIN_VALID_INPUT_LENGTH = 2;

// Hook 返回类型
export interface UseInterviewEngineReturn {
  // 状态（从 Store 读取）
  aiState: AIState;
  messages: InterviewMessage[];
  streamingContent: string;
  sessionId: string | null;
  progress: InterviewProgress;
  isInterviewEnded: boolean;
  initError: string | null;
  hasGreeted: boolean;
  
  // 麦克风状态
  micVolume: number;
  isMicAvailable: boolean;
  
  // 操作方法
  initSession: (jobTitle: string, difficulty?: string) => Promise<void>;
  sendMessage: (text: string) => Promise<void>;
  startListening: () => void;
  stopListening: () => void;
  endSession: () => Promise<void>;
  resetEngine: () => void;
  speakText: (text: string) => void;
}

export function useInterviewEngine(): UseInterviewEngineReturn {
  // 从 Zustand Store 读取状态
  const {
    sessionId,
    aiState,
    messages,
    streamingContent,
    progress,
    isInterviewEnded,
    initError,
    hasGreeted,
    setSession,
    setGreeted,
    setAIState,
    addMessage,
    setStreaming,
    appendStreamContent,
    finalizeStream,
    setInterviewEnded,
    setInitError,
    pauseSession,
    reset,
  } = useInterviewStore();

  // 本地状态（不需要持久化）
  const micVolumeRef = useRef(0);
  const isMicAvailableRef = useRef(true);
  
  // Refs
  const streamControllerRef = useRef<StreamController | null>(null);
  const recognitionRef = useRef<ISpeechRecognition | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const volumeAnimationRef = useRef<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isMountedRef = useRef(true);


  // ==========================================
  // 🔴 核心清理函数 - 强行闭嘴
  // ==========================================
  const forceCleanup = useCallback(() => {
    // 1. 立即停止 TTS 语音播报
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    
    // 2. 停止语音识别
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch (e) {
        // 忽略已停止的错误
      }
      recognitionRef.current = null;
    }
    
    // 3. 停止 SSE 流
    if (streamControllerRef.current) {
      streamControllerRef.current.abort();
      streamControllerRef.current = null;
    }
    
    // 4. 停止音量监测
    if (volumeAnimationRef.current) {
      cancelAnimationFrame(volumeAnimationRef.current);
      volumeAnimationRef.current = null;
    }
    
    // 5. 释放麦克风
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach(track => track.stop());
      micStreamRef.current = null;
    }
    
    // 6. 关闭音频上下文
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    
    // 7. 停止计时器
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // ==========================================
  // 🔴 组件卸载时的完整清理
  // ==========================================
  useEffect(() => {
    isMountedRef.current = true;
    
    // 预加载语音列表（Chrome 需要）
    if (window.speechSynthesis) {
      window.speechSynthesis.getVoices();
      // Chrome 需要监听 voiceschanged 事件
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.getVoices();
      };
    }
    
    return () => {
      isMountedRef.current = false;
      
      // 强行闭嘴 + 释放所有资源
      forceCleanup();
      
      // 将状态置为暂停
      pauseSession();
    };
  }, [forceCleanup, pauseSession]);

  // ==========================================
  // 面试计时器
  // ==========================================
  useEffect(() => {
    const { incrementTimer } = useInterviewStore.getState();
    
    if (sessionId && !isInterviewEnded && aiState !== 'paused') {
      timerRef.current = setInterval(() => {
        if (isMountedRef.current) {
          incrementTimer();
        }
      }, 1000);
    }
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [sessionId, isInterviewEnded, aiState]);

  // ==========================================
  // 霸气打断 - 停止 AI 语音播报
  // ==========================================
  const interruptSpeaking = useCallback(() => {
    if (window.speechSynthesis?.speaking) {
      window.speechSynthesis.cancel();
    }
    if (aiState === 'speaking') {
      setAIState('idle');
    }
  }, [aiState, setAIState]);

  // ==========================================
  // 语音合成 - AI 说话
  // ==========================================
  const speakText = useCallback((text: string) => {
    // 检查浏览器支持
    if (!window.speechSynthesis) {
      console.warn('Speech synthesis not supported');
      return;
    }
    
    if (!isMountedRef.current) return;
    
    // 清理终结符
    const cleanText = text.replace(INTERVIEW_END_MARKER, '').trim();
    if (!cleanText) {
      console.log('Empty text, skipping speech');
      return;
    }
    
    // 先取消之前的语音
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = 'zh-CN';
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    
    // 选择中文语音（如果可用）
    const voices = window.speechSynthesis.getVoices();
    const zhVoice = voices.find(v => v.lang.includes('zh') || v.lang.includes('CN'));
    if (zhVoice) {
      utterance.voice = zhVoice;
    }
    
    utterance.onstart = () => {
      console.log('Speech started');
      if (isMountedRef.current) {
        useInterviewStore.getState().setAIState('speaking');
      }
    };
    
    utterance.onend = () => {
      console.log('Speech ended');
      if (isMountedRef.current) {
        useInterviewStore.getState().setAIState('idle');
      }
    };
    
    utterance.onerror = (event) => {
      console.error('Speech error:', event.error);
      if (isMountedRef.current) {
        useInterviewStore.getState().setAIState('idle');
      }
    };
    
    // Chrome 有时需要延迟才能正常播放
    setTimeout(() => {
      if (isMountedRef.current) {
        window.speechSynthesis.speak(utterance);
      }
    }, 100);
  }, []);

  // ==========================================
  // 初始化麦克风音量分析
  // ==========================================
  const initMicAnalyser = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micStreamRef.current = stream;
      
      audioContextRef.current = new AudioContext();
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);
      
      isMicAvailableRef.current = true;
      return true;
    } catch (error: any) {
      console.error('Mic init error:', error);
      isMicAvailableRef.current = false;
      return false;
    }
  }, []);


  // ==========================================
  // 音量监测动画循环
  // ==========================================
  const startVolumeMonitoring = useCallback(() => {
    if (!analyserRef.current) return;
    
    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    
    const updateVolume = () => {
      if (!analyserRef.current || !isMountedRef.current) {
        micVolumeRef.current = 0;
        return;
      }
      
      analyserRef.current.getByteFrequencyData(dataArray);
      const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
      micVolumeRef.current = Math.min(100, average * 1.5);
      
      volumeAnimationRef.current = requestAnimationFrame(updateVolume);
    };
    
    updateVolume();
  }, []);

  const stopVolumeMonitoring = useCallback(() => {
    if (volumeAnimationRef.current) {
      cancelAnimationFrame(volumeAnimationRef.current);
      volumeAnimationRef.current = null;
    }
    micVolumeRef.current = 0;
  }, []);

  // ==========================================
  // 🔒 初始化面试会话（带开场白锁）
  // ==========================================
  const initSession = useCallback(async (jobTitle: string, difficulty: string = 'MEDIUM') => {
    // 检查是否已有活跃会话且已播报开场白
    const store = useInterviewStore.getState();
    
    if (store.sessionId && store.hasGreeted && store.messages.length > 0) {
      // 恢复现场，不重新初始化
      console.log('Restoring existing session:', store.sessionId);
      setAIState('idle');
      await initMicAnalyser();
      return;
    }
    
    try {
      setInitError(null);
      const response = await interviewApi.createSession({ jobTitle, difficulty });
      const { sessionId: newSessionId, greeting } = response.data.data;
      
      if (!isMountedRef.current) return;
      
      setSession(newSessionId, jobTitle);
      addMessage('assistant', greeting);
      setGreeted(); // 🔒 标记开场白已播报
      
      // 初始化麦克风
      await initMicAnalyser();
      
      // 更新进度
      useInterviewStore.getState().updateProgress({ currentQuestion: 1 });
      
      // 播报开场白（延迟确保状态更新完成）
      setTimeout(() => {
        if (isMountedRef.current) {
          speakText(greeting);
        }
      }, 500);
    } catch (error: any) {
      console.error('Session init error:', error);
      if (isMountedRef.current) {
        setInitError(error.response?.data?.message || '创建面试会话失败，请重试');
      }
    }
  }, [setSession, addMessage, setGreeted, setAIState, setInitError, initMicAnalyser, speakText]);

  // ==========================================
  // 🔒 发送消息（带空输入拦截）
  // ==========================================
  const sendMessage = useCallback(async (text: string) => {
    // 🔒 空输入拦截 - 过滤无效输入
    const trimmedText = text.trim();
    if (!trimmedText || trimmedText.length < MIN_VALID_INPUT_LENGTH) {
      console.log('Empty or too short input ignored:', text);
      return;
    }
    
    // 过滤纯标点符号
    const cleanText = trimmedText.replace(/[^\u4e00-\u9fa5a-zA-Z0-9]/g, '');
    if (!cleanText) {
      console.log('Pure punctuation input ignored:', text);
      return;
    }
    
    if (!sessionId || aiState === 'thinking') return;
    
    // 打断当前 AI 语音
    interruptSpeaking();
    
    // 添加用户消息
    addMessage('user', trimmedText);
    
    // 进入思考状态
    setStreaming(true);
    
    // 构建对话历史
    const currentMessages = useInterviewStore.getState().messages;
    const chatMessages = currentMessages.map(m => ({ role: m.role, content: m.content }));
    
    let fullResponse = '';
    
    // 流式请求
    streamControllerRef.current = interviewApi.streamChat(
      sessionId,
      chatMessages,
      // onChunk
      (chunk) => {
        if (!isMountedRef.current) return;
        fullResponse += chunk;
        appendStreamContent(chunk);
        
        // 检测终结符
        if (fullResponse.includes(INTERVIEW_END_MARKER)) {
          setInterviewEnded(true);
        }
      },
      // onComplete
      () => {
        if (!isMountedRef.current) return;
        
        const cleanContent = fullResponse.replace(INTERVIEW_END_MARKER, '').trim();
        finalizeStream();
        
        // 播报回复（延迟确保状态更新完成）
        const store = useInterviewStore.getState();
        if (!store.isInterviewEnded && cleanContent) {
          setTimeout(() => {
            if (isMountedRef.current) {
              speakText(cleanContent);
            }
          }, 200);
        }
      },
      // onError
      (error) => {
        console.error('Stream error:', error);
        if (isMountedRef.current) {
          setAIState('idle');
          setStreaming(false);
        }
      }
    );
  }, [sessionId, aiState, interruptSpeaking, addMessage, setStreaming, appendStreamContent, finalizeStream, setInterviewEnded, speakText, setAIState]);


  // ==========================================
  // 开始语音识别
  // ==========================================
  const startListening = useCallback(() => {
    const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition || !isMicAvailableRef.current) {
      console.warn('Speech recognition not available');
      return;
    }
    
    // 打断 AI 说话 (霸气打断)
    interruptSpeaking();
    
    const recognition = new SpeechRecognition();
    recognition.lang = 'zh-CN';
    recognition.continuous = false;
    recognition.interimResults = true;
    
    recognition.onstart = () => {
      if (isMountedRef.current) {
        setAIState('listening');
        startVolumeMonitoring();
      }
    };
    
    (recognition as any).onaudiostart = () => {
      // 用户开始说话时打断 AI
      interruptSpeaking();
    };
    
    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = Array.from(event.results)
        .map((result: SpeechRecognitionResult) => result[0].transcript)
        .join('');
      
      if (event.results[0].isFinal) {
        // 🔒 空输入拦截 - 在这里也检查
        const trimmed = transcript.trim();
        if (trimmed && trimmed.length >= MIN_VALID_INPUT_LENGTH) {
          sendMessage(trimmed);
        } else {
          console.log('Empty speech result ignored');
        }
      }
    };
    
    recognition.onend = () => {
      if (isMountedRef.current) {
        setAIState('idle');
        stopVolumeMonitoring();
      }
    };
    
    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      if (event.error === 'not-allowed') {
        isMicAvailableRef.current = false;
      }
      if (isMountedRef.current) {
        setAIState('idle');
        stopVolumeMonitoring();
      }
    };
    
    recognitionRef.current = recognition;
    recognition.start();
  }, [interruptSpeaking, setAIState, startVolumeMonitoring, stopVolumeMonitoring, sendMessage]);

  // ==========================================
  // 停止语音识别
  // ==========================================
  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        // 忽略
      }
      recognitionRef.current = null;
    }
    setAIState('idle');
    stopVolumeMonitoring();
  }, [setAIState, stopVolumeMonitoring]);

  // ==========================================
  // 结束面试会话
  // ==========================================
  const endSession = useCallback(async () => {
    // 强行闭嘴
    forceCleanup();
    
    const currentSessionId = useInterviewStore.getState().sessionId;
    if (currentSessionId) {
      try {
        await interviewApi.endSession(currentSessionId);
      } catch (error) {
        console.error('End session error:', error);
      }
    }
    
    setInterviewEnded(true);
  }, [forceCleanup, setInterviewEnded]);

  // ==========================================
  // 重置引擎
  // ==========================================
  const resetEngine = useCallback(() => {
    forceCleanup();
    reset();
  }, [forceCleanup, reset]);

  return {
    aiState,
    messages,
    streamingContent,
    sessionId,
    progress,
    isInterviewEnded,
    initError,
    hasGreeted,
    micVolume: micVolumeRef.current,
    isMicAvailable: isMicAvailableRef.current,
    initSession,
    sendMessage,
    startListening,
    stopListening,
    endSession,
    resetEngine,
    speakText,
  };
}
