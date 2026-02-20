/**
 * Web Speech API Hook
 * 🛡️ 防御性重构：封装浏览器原生语音识别 (STT) 和语音合成 (TTS)
 * 支持组件卸载时自动清理资源
 */
import { useCallback, useRef, useEffect } from 'react';
import { useInterviewStore } from '../stores/interviewStore';

// 语音识别类型声明
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
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

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: Event) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

export function useSpeech() {
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const isMountedRef = useRef<boolean>(true);
  
  const { setListening, setSpeaking } = useInterviewStore();

  // 初始化语音识别 + 清理函数
  useEffect(() => {
    isMountedRef.current = true;
    
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'zh-CN';
    }

    // 🛡️ 关键：组件卸载时清理所有语音资源
    return () => {
      isMountedRef.current = false;
      
      // 停止语音识别
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // 忽略已停止的错误
        }
        recognitionRef.current = null;
      }
      
      // 停止语音合成
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      
      // 重置状态（使用 getState 避免闭包问题）
      useInterviewStore.getState().setListening(false);
      useInterviewStore.getState().setSpeaking(false);
    };
  }, []);

  /**
   * 开始语音识别
   * @param onResult 识别结果回调
   * @param onError 错误回调
   */
  const startListening = useCallback(
    (onResult: (text: string) => void, onError?: (error: string) => void) => {
      if (!recognitionRef.current) {
        onError?.('您的浏览器不支持语音识别');
        return;
      }

      // 停止正在播放的语音
      window.speechSynthesis.cancel();
      if (isMountedRef.current) {
        setSpeaking(false);
      }

      const recognition = recognitionRef.current;

      recognition.onstart = () => {
        if (isMountedRef.current) {
          setListening(true);
        }
      };

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        if (!isMountedRef.current) return;
        
        let finalTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          if (result.isFinal) {
            finalTranscript += result[0].transcript;
          }
        }

        if (finalTranscript) {
          onResult(finalTranscript);
        }
      };

      recognition.onerror = (event: Event) => {
        if (isMountedRef.current) {
          setListening(false);
        }
        const errorEvent = event as Event & { error?: string };
        onError?.(errorEvent.error || '语音识别出错');
      };

      recognition.onend = () => {
        if (isMountedRef.current) {
          setListening(false);
        }
      };

      try {
        recognition.start();
      } catch {
        onError?.('启动语音识别失败');
      }
    },
    [setListening, setSpeaking]
  );

  /**
   * 停止语音识别
   */
  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // 忽略已停止的错误
      }
    }
    if (isMountedRef.current) {
      setListening(false);
    }
  }, [setListening]);

  /**
   * 语音合成（TTS）
   * @param text 要播报的文本
   * @param onEnd 播报结束回调
   */
  const speak = useCallback(
    (text: string, onEnd?: () => void) => {
      if (!isMountedRef.current) return;
      
      // 取消之前的播报
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'zh-CN';
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;

      // 选择中文语音
      const voices = window.speechSynthesis.getVoices();
      const chineseVoice = voices.find(
        (voice) => voice.lang.includes('zh') || voice.lang.includes('CN')
      );
      if (chineseVoice) {
        utterance.voice = chineseVoice;
      }

      utterance.onstart = () => {
        if (isMountedRef.current) {
          setSpeaking(true);
        }
      };

      utterance.onend = () => {
        if (isMountedRef.current) {
          setSpeaking(false);
        }
        onEnd?.();
      };

      utterance.onerror = () => {
        if (isMountedRef.current) {
          setSpeaking(false);
        }
      };

      window.speechSynthesis.speak(utterance);
    },
    [setSpeaking]
  );

  /**
   * 停止语音播报
   */
  const stopSpeaking = useCallback(() => {
    window.speechSynthesis.cancel();
    if (isMountedRef.current) {
      setSpeaking(false);
    }
  }, [setSpeaking]);

  /**
   * 检查浏览器是否支持语音功能
   */
  const isSupported = {
    recognition: !!(window.SpeechRecognition || window.webkitSpeechRecognition),
    synthesis: 'speechSynthesis' in window,
  };

  return {
    startListening,
    stopListening,
    speak,
    stopSpeaking,
    isSupported,
  };
}
