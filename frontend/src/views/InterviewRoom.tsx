/**
 * 面试间 - 终极进化版 + 沉浸式全屏体验
 * 
 * 核心能力：
 * 1. AIState 状态机视觉映射
 * 2. 霸气打断机制
 * 3. 顶部进度台 + 自动终结
 * 4. 麦克风音量可视化 + 降级文字输入
 * 5. 🆕 沉浸式全屏模式（无导航栏/侧边栏）
 * 6. 🆕 悬浮主题切换器
 * 7. 🆕 防误触守卫（beforeunload + popstate）
 */
import React, { useState, useEffect, useRef } from 'react';
import { 
  Mic, 
  MicOff, 
  Video,
  VideoOff,
  Send, 
  User, 
  Bot,
  AlertCircle,
  Clock,
  MessageSquare,
  Volume2,
  VolumeX,
  StopCircle,
  LogOut,
  Loader2,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useInterviewEngine } from '../hooks/useInterviewEngine';
import { AIState } from '../stores/interviewStore';
import { interviewApi } from '../api/interview';
import ThemeToggle from '../components/theme/ThemeToggle';

// 格式化时间
const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

// 音量柱组件
const VolumeBar: React.FC<{ volume: number; index: number }> = ({ volume, index }) => {
  const height = Math.max(8, Math.min(32, (volume / 100) * 32 + Math.random() * 8));
  const delay = index * 0.05;
  
  return (
    <motion.div
      className="w-1 bg-emerald-400 rounded-full"
      animate={{ height }}
      transition={{ duration: 0.1, delay }}
      style={{ minHeight: 8 }}
    />
  );
};

// AI 头像状态视觉组件
const AIAvatarVisual: React.FC<{ aiState: AIState }> = ({ aiState }) => {
  return (
    <div className="relative w-32 h-32 md:w-56 md:h-56 rounded-full bg-slate-800/50 backdrop-blur-md border border-white/10 flex items-center justify-center mb-6 md:mb-10 shadow-[0_0_50px_rgba(79,70,229,0.15)]">
      <Bot className="w-16 h-16 md:w-20 md:h-20 text-indigo-300 relative z-10 drop-shadow-[0_0_15px_rgba(165,180,252,0.5)]" />
      
      {/* Listening 状态 - 绿色常驻光晕 */}
      <AnimatePresence>
        {aiState === 'listening' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute inset-0 rounded-full border-2 border-emerald-400/50 shadow-[0_0_30px_rgba(52,211,153,0.3)]"
          />
        )}
      </AnimatePresence>

      {/* Thinking 状态 - 高频呼吸灯 */}
      <AnimatePresence>
        {aiState === 'thinking' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0.3, 0.8, 0.3] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, repeat: Infinity, ease: "easeInOut" }}
            className="absolute inset-0 rounded-full border-2 border-indigo-500 shadow-[0_0_40px_rgba(99,102,241,0.5)]"
          />
        )}
      </AnimatePresence>
      
      {/* Speaking 状态 - 多层动态波纹 */}
      <AnimatePresence>
        {aiState === 'speaking' && (
          <>
            <motion.div 
              className="absolute inset-0 rounded-full border-2 border-indigo-500/30 shadow-[0_0_20px_rgba(99,102,241,0.2)]"
              animate={{ scale: [1, 1.4], opacity: [0.8, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeOut" }}
            />
            <motion.div 
              className="absolute inset-0 rounded-full border border-indigo-400/20 shadow-[0_0_30px_rgba(129,140,248,0.2)]"
              animate={{ scale: [1, 1.8], opacity: [0.5, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeOut", delay: 0.3 }}
            />
            <motion.div 
              className="absolute inset-0 rounded-full border border-purple-400/20"
              animate={{ scale: [1, 2.2], opacity: [0.3, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeOut", delay: 0.6 }}
            />
          </>
        )}
      </AnimatePresence>
      
      {/* Idle 状态 - 微弱呼吸 */}
      {aiState === 'idle' && (
        <motion.div 
          className="absolute inset-0 rounded-full bg-indigo-500/5 blur-xl"
          animate={{ scale: [0.9, 1.1], opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        />
      )}
    </div>
  );
};

// 思考中占位气泡
const ThinkingBubble: React.FC = () => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -10 }}
    className="flex flex-col items-start"
  >
    <div className="max-w-[90%] p-3 md:p-5 rounded-2xl rounded-bl-none bg-white border border-slate-100 text-slate-500 shadow-sm">
      <span className="inline-flex items-center gap-1">
        思考中
        <motion.span
          animate={{ opacity: [1, 0, 1] }}
          transition={{ duration: 0.8, repeat: Infinity }}
        >
          |
        </motion.span>
      </span>
    </div>
    <span className="text-[10px] text-slate-400 mt-1 md:mt-2 px-1 font-medium uppercase tracking-wider">
      Interviewer • 正在输入...
    </span>
  </motion.div>
);

// 🚪 结束面试确认弹窗（任务 3）
const EndInterviewModal: React.FC<{ 
  isOpen: boolean; 
  onClose: () => void; 
  onConfirm: () => void;
  isLoading: boolean;
}> = ({ isOpen, onClose, onConfirm, isLoading }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={!isLoading ? onClose : undefined}
            className="fixed inset-0 z-[90] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4"
          >
            {/* Modal Container */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden relative"
            >
              {/* Gradient Header */}
              <div className="relative h-32 bg-gradient-to-br from-red-500 via-rose-500 to-pink-500 flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(255,255,255,0.1),transparent)]" />
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.1),transparent)]"
                />
                <div className="relative z-10 w-16 h-16 bg-white/20 backdrop-blur-xl rounded-full flex items-center justify-center border border-white/30">
                  <LogOut className="w-8 h-8 text-white" />
                </div>
              </div>

              {/* Content */}
              <div className="p-8 space-y-6">
                <div className="text-center space-y-2">
                  <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
                    确定要结束面试吗？
                  </h3>
                  <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
                    系统将为您生成多维战力报告，包含技术深度、沟通能力、逻辑思维等维度的详细分析。
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={onClose}
                    disabled={isLoading}
                    className="flex-1 px-6 py-3 rounded-xl font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    取消
                  </button>
                  <button
                    onClick={onConfirm}
                    disabled={isLoading}
                    className="flex-1 px-6 py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 transition-all shadow-lg shadow-red-500/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>生成中...</span>
                      </>
                    ) : (
                      <span>确认结束</span>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

// 面试结束遮罩
const EndOverlay: React.FC<{ onNavigate: () => void }> = ({ onNavigate }) => {
  useEffect(() => {
    const timer = setTimeout(onNavigate, 2000);
    return () => clearTimeout(timer);
  }, [onNavigate]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-[100] bg-slate-900/80 backdrop-blur-xl flex items-center justify-center"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-center"
      >
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-indigo-500/20 flex items-center justify-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-12 h-12 border-2 border-indigo-400 border-t-transparent rounded-full"
          />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">面试结束</h2>
        <p className="text-slate-400">正在生成多维战力报告...</p>
      </motion.div>
    </motion.div>
  );
};


const InterviewView: React.FC = () => {
  const navigate = useNavigate();
  const [inputMessage, setInputMessage] = useState('');
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [showTextFallback, setShowTextFallback] = useState(false);
  const [showEndModal, setShowEndModal] = useState(false); // 🚪 任务 3
  const [isEndingSession, setIsEndingSession] = useState(false); // 🚪 任务 3
  const [cameraError, setCameraError] = useState<string | null>(null); // 🎥 摄像头错误状态
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const dragConstraintsRef = useRef<HTMLDivElement>(null); // 🎥 拖拽约束容器

  const {
    aiState,
    messages,
    streamingContent,
    sessionId,
    progress,
    micVolume,
    isInterviewEnded,
    initError,
    isMicAvailable,
    hasGreeted,
    canReplaySpeech,
    isSpeaking,
    initSession,
    sendMessage,
    startListening,
    stopListening,
    endSession,
    resetEngine,
    toggleSpeech,
  } = useInterviewEngine();

  // 🛑 改造 3：防误触守卫 - beforeunload 事件
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      // 只有在面试进行中时才拦截
      if (sessionId && !isInterviewEnded) {
        e.preventDefault();
        e.returnValue = ''; // 触发浏览器原生的"离开此网站？"警告框
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [sessionId, isInterviewEnded]);

  // 🛑 改造 4：防误触守卫 - popstate 事件（浏览器后退）
  useEffect(() => {
    const handlePopState = (e: PopStateEvent) => {
      // 只有在面试进行中时才拦截
      if (sessionId && !isInterviewEnded) {
        const confirmLeave = window.confirm(
          '⚠️ 面试正在进行中，确定要离开吗？\n\n离开后当前面试进度将会丢失。'
        );
        
        if (!confirmLeave) {
          // 用户选择留下，恢复历史记录
          window.history.pushState(null, '', window.location.pathname);
        } else {
          // 用户确认离开，清理资源
          if (window.speechSynthesis) {
            window.speechSynthesis.cancel();
          }
          if (mediaStreamRef.current) {
            mediaStreamRef.current.getTracks().forEach(track => track.stop());
            mediaStreamRef.current = null;
          }
          resetEngine();
        }
      }
    };

    // 在历史记录栈中添加一个状态，用于拦截后退
    window.history.pushState(null, '', window.location.pathname);
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [sessionId, isInterviewEnded, resetEngine]);

  // 自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingContent]);

  // 初始化会话（带开场白锁检查）
  useEffect(() => {
    // 检查是否有活跃会话
    if (!sessionId) {
      // 没有会话，跳转回首页
      console.warn('No active interview session, redirecting to dashboard');
      navigate('/dashboard');
      return;
    }
    
    // 有会话但未播报开场白，恢复播报
    if (!hasGreeted && messages.length > 0) {
      const greeting = messages.find(m => m.role === 'assistant')?.content;
      if (greeting) {
        setTimeout(() => {
          if (videoRef.current) {
            // 延迟播报，确保组件已挂载
            window.speechSynthesis?.speak(new SpeechSynthesisUtterance(greeting));
          }
        }, 500);
      }
    }
    
    return () => {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [sessionId, hasGreeted, messages, navigate]);

  // 麦克风不可用时显示文字输入
  useEffect(() => {
    if (!isMicAvailable && sessionId) {
      setShowTextFallback(true);
    }
  }, [isMicAvailable, sessionId]);

  // 🎥 修复 1：正确的 MediaStream 绑定机制
  useEffect(() => {
    if (isCameraOn && videoRef.current && mediaStreamRef.current) {
      // 安全地将流绑定到 video 元素
      videoRef.current.srcObject = mediaStreamRef.current;
      
      // 确保视频开始播放
      videoRef.current.play().catch(err => {
        console.error('Video play error:', err);
      });
    }
  }, [isCameraOn, mediaStreamRef.current]);

  // 🚪 任务 3：优雅的结束面试流程
  const handleEndInterview = async () => {
    if (!sessionId || isEndingSession) return;
    
    setIsEndingSession(true);
    
    try {
      // 1. 调用后端 API 结束会话并生成报告
      console.log('🚪 Ending interview session:', sessionId);
      await interviewApi.endSession(sessionId);
      
      // 2. 底层资源大扫除
      console.log('🧹 Cleaning up resources...');
      
      // 停止 TTS 语音
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      
      // 停止摄像头和麦克风
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => {
          console.log('🛑 Stopping track:', track.kind);
          track.stop();
        });
        mediaStreamRef.current = null;
      }
      
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      
      // 调用引擎清理函数
      resetEngine();
      
      // 3. 关闭弹窗
      setShowEndModal(false);
      
      // 4. 丝滑跳转到报告页
      console.log('🧭 Navigating to report page');
      navigate('/dashboard/report');
      
    } catch (error: any) {
      console.error('❌ Failed to end interview:', error);
      alert(`结束面试失败: ${error.response?.data?.message || error.message || '未知错误'}`);
      setIsEndingSession(false);
    }
  };

  // 面试结束跳转（自动结束时使用）
  const handleNavigateToReport = () => {
    // 资源清理
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    
    resetEngine();
    navigate('/dashboard/report');
  };

  // 发送文字消息
  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;
    sendMessage(inputMessage);
    setInputMessage('');
  };

  // 麦克风控制
  const handleMicToggle = () => {
    if (aiState === 'listening') {
      stopListening();
    } else {
      startListening();
    }
  };

  // 🎥 修复 2：摄像头控制逻辑（带权限异常拦截）
  const handleVideoClick = async () => {
    if (isCameraOn) {
      // 关闭摄像头
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => {
          console.log('🛑 Stopping camera track:', track.kind);
          track.stop();
        });
        mediaStreamRef.current = null;
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      setIsCameraOn(false);
      setCameraError(null);
    } else {
      // 开启摄像头
      try {
        console.log('📹 Requesting camera access...');
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            width: { ideal: 1280 }, 
            height: { ideal: 720 }, 
            facingMode: 'user' 
          } 
        });
        
        console.log('✅ Camera stream obtained:', stream.id);
        mediaStreamRef.current = stream;
        setIsCameraOn(true);
        setCameraError(null);
        
        // 立即绑定到 video 元素
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(err => {
            console.error('Video play error:', err);
          });
        }
      } catch (error: any) {
        console.error('❌ Camera error:', error);
        
        // 🎥 修复 3：极致的权限异常拦截
        let errorMessage = '无法访问摄像头';
        
        if (error.name === 'NotAllowedError') {
          errorMessage = '摄像头权限被拒绝，请在浏览器地址栏中允许摄像头访问';
        } else if (error.name === 'NotFoundError') {
          errorMessage = '未检测到摄像头设备，请检查硬件连接';
        } else if (error.name === 'NotReadableError') {
          errorMessage = '摄像头正被其他应用占用，请关闭其他应用后重试';
        } else if (error.name === 'OverconstrainedError') {
          errorMessage = '摄像头不支持请求的分辨率';
        } else {
          errorMessage = `摄像头错误: ${error.message || '未知错误'}`;
        }
        
        setCameraError(errorMessage);
        setIsCameraOn(false);
        
        // 3 秒后自动清除错误提示
        setTimeout(() => setCameraError(null), 5000);
      }
    }
  };

  // 构建显示消息列表
  const displayMessages = [...messages];
  if (streamingContent) {
    displayMessages.push({
      id: 'streaming',
      role: 'assistant',
      content: streamingContent,
      timestamp: new Date(),
    });
  }

  // AI 状态文案
  const getStatusText = () => {
    switch (aiState) {
      case 'listening': return '正在倾听...';
      case 'thinking': return 'AI 正在思考...';
      case 'speaking': return 'AI 正在回答...';
      default: return '等待您的回答...';
    }
  };


  return (
    <div className="h-full flex flex-col md:flex-row overflow-hidden bg-slate-50 relative z-10 pb-20 md:pb-0">
      {/* � 改造 2：悬浮主题切换器（右上角）*/}
      <div className="fixed top-6 right-6 z-[60]">
        <ThemeToggle />
      </div>

      {/* �🚪 结束面试确认弹窗（任务 3）*/}
      <EndInterviewModal
        isOpen={showEndModal}
        onClose={() => setShowEndModal(false)}
        onConfirm={handleEndInterview}
        isLoading={isEndingSession}
      />

      {/* 面试结束遮罩 */}
      <AnimatePresence>
        {isInterviewEnded && <EndOverlay onNavigate={handleNavigateToReport} />}
      </AnimatePresence>

      {/* 错误提示 */}
      <AnimatePresence>
        {initError && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-4 left-4 right-4 z-50 bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3 shadow-lg"
          >
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <p className="text-sm text-red-700 flex-1">{initError}</p>
            <button 
              onClick={() => navigate('/dashboard')}
              className="px-4 py-1.5 bg-red-100 text-red-700 rounded-lg text-sm font-medium hover:bg-red-200 transition-colors"
            >
              返回
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 麦克风不可用提示 */}
      <AnimatePresence>
        {!isMicAvailable && sessionId && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-4 left-4 right-4 z-40 bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center gap-3 shadow-lg"
          >
            <MessageSquare className="w-5 h-5 text-amber-600 flex-shrink-0" />
            <p className="text-sm text-amber-700">麦克风不可用，已自动切换为文字模式</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 🎥 摄像头错误提示 */}
      <AnimatePresence>
        {cameraError && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-20 left-4 right-4 z-40 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 flex items-start gap-3 shadow-lg"
          >
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-red-900 dark:text-red-100 mb-1">摄像头访问失败</p>
              <p className="text-sm text-red-700 dark:text-red-300">{cameraError}</p>
            </div>
            <button
              onClick={() => setCameraError(null)}
              className="text-red-400 hover:text-red-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 主视频区域 */}
      <div 
        ref={dragConstraintsRef}
        className="flex-none md:flex-1 h-[35vh] md:h-auto flex flex-col relative p-4 md:p-6 z-10"
      >
        <div className="flex-1 bg-slate-900 rounded-3xl border border-white/10 shadow-2xl relative overflow-hidden flex items-center justify-center group">
          {/* 背景光效 */}
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/20 via-slate-900 to-slate-900 pointer-events-none" />
          <div className="absolute top-[-20%] left-[20%] w-[300px] md:w-[600px] h-[300px] md:h-[600px] bg-indigo-500/10 rounded-full blur-[80px] md:blur-[120px] pointer-events-none" />

          {/* 顶部进度台 */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 md:top-8 backdrop-blur-md bg-slate-800/60 border border-white/10 px-4 py-1.5 rounded-full flex items-center gap-3 z-20">
            <div className="flex items-center gap-1.5 text-slate-300">
              <Clock className="w-3.5 h-3.5" />
              <span className="text-sm font-medium">{formatTime(progress.elapsedSeconds)}</span>
            </div>
            <div className="w-px h-4 bg-slate-600" />
            <span className="text-sm text-slate-300">
              进度: <span className="text-indigo-400 font-medium">{progress.currentQuestion}/{progress.totalQuestions}</span>
            </span>
          </div>

          {/* LIVE 标识 */}
          <div className="absolute top-4 left-4 md:top-8 md:left-8 bg-white/10 backdrop-blur-md border border-white/10 px-3 py-1.5 md:px-4 md:py-2 rounded-full flex items-center gap-2 z-20">
            <div className="w-2 h-2 md:w-2.5 md:h-2.5 rounded-full bg-red-500 animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.5)]" />
            <span className="text-[10px] md:text-xs font-bold text-white tracking-wide">LIVE SESSION</span>
          </div>

          {/* 🚪 结束面试按钮（任务 3 - 桌面端）*/}
          <motion.button
            onClick={() => setShowEndModal(true)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="absolute top-4 right-4 md:top-8 md:right-8 bg-red-500/90 hover:bg-red-600 backdrop-blur-md border border-red-400/30 px-4 py-2 md:px-5 md:py-2.5 rounded-full flex items-center gap-2 z-20 shadow-lg shadow-red-500/30 transition-all group"
          >
            <LogOut className="w-4 h-4 md:w-4 md:h-4 text-white group-hover:rotate-12 transition-transform" />
            <span className="text-xs md:text-sm font-bold text-white tracking-wide">结束面试</span>
          </motion.button>

          {/* AI 头像 */}
          <div className="relative z-10 flex flex-col items-center scale-75 md:scale-100">
            <AIAvatarVisual aiState={aiState} />
            <p className="text-indigo-200/80 font-medium text-sm md:text-lg tracking-wide">
              {getStatusText()}
            </p>
          </div>

          {/* 🎥 改造：可拖拽的悬浮画中画 (Draggable PiP) */}
          <AnimatePresence>
            {isCameraOn && (
              <motion.div
                drag
                dragConstraints={dragConstraintsRef}
                dragElastic={0.1}
                dragMomentum={false}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ cursor: 'grabbing' }}
                className="absolute bottom-6 right-6 md:bottom-8 md:right-8 w-32 h-24 md:w-48 md:h-36 bg-slate-900/80 backdrop-blur-xl rounded-2xl shadow-2xl border-2 border-white/20 overflow-hidden cursor-grab active:cursor-grabbing z-30"
              >
                <div className="w-full h-full flex items-center justify-center relative">
                  <video 
                    ref={videoRef} 
                    autoPlay 
                    playsInline 
                    muted 
                    className="w-full h-full object-cover scale-x-[-1]"
                  />
                  
                  {/* YOU 标签 */}
                  <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-sm px-2 py-1 rounded-md text-[10px] font-bold text-white">
                    YOU
                  </div>
                  
                  {/* 绿色指示灯 */}
                  <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.8)]" />
                  
                  {/* 拖拽提示图标 */}
                  <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-5 h-5 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                      </svg>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>


        {/* 桌面端控制栏 */}
        <div className="hidden md:flex h-24 items-center justify-center gap-8 mt-4">
          {/* 麦克风按钮 + 音量柱 */}
          <div className="flex items-center gap-3">
            {/* 音量可视化 */}
            <div className="flex items-end gap-0.5 h-8">
              {[0, 1, 2, 3].map(i => (
                <VolumeBar key={i} volume={aiState === 'listening' ? micVolume : 0} index={i} />
              ))}
            </div>
            
            <button 
              onClick={handleMicToggle}
              disabled={!isMicAvailable}
              className={`w-16 h-16 rounded-full flex items-center justify-center shadow-lg backdrop-blur-xl border transition-all duration-300 ${
                aiState === 'listening'
                  ? 'bg-emerald-500 text-white border-emerald-400 shadow-emerald-500/30' 
                  : 'bg-white/40 text-slate-600 border-white/40 hover:bg-white hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed'
              }`}
            >
              {aiState === 'listening' ? <Mic className="w-7 h-7" /> : <MicOff className="w-7 h-7" />}
            </button>
          </div>

          {/* 🎙️ 语音控制按钮（任务 2）*/}
          <motion.button
            onClick={toggleSpeech}
            disabled={aiState === 'thinking' || !canReplaySpeech}
            whileTap={{ scale: 0.9 }}
            className={`relative w-16 h-16 rounded-full backdrop-blur-xl border flex items-center justify-center shadow-lg transition-all duration-300 group ${
              isSpeaking
                ? 'bg-red-500 text-white border-red-400 shadow-red-500/30 hover:bg-red-600'
                : canReplaySpeech
                  ? 'bg-white/40 text-slate-600 border-white/40 hover:bg-white hover:scale-110'
                  : 'bg-white/20 text-slate-400 border-white/20 opacity-50 cursor-not-allowed'
            }`}
            title={isSpeaking ? '停止播报' : '重新播报'}
          >
            {isSpeaking ? (
              <StopCircle className="w-7 h-7" />
            ) : (
              <Volume2 className="w-7 h-7" />
            )}
            
            {/* Tooltip */}
            <div className="absolute -top-12 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-slate-900 text-white text-xs font-medium rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
              {isSpeaking ? '停止播报' : '重新播报'}
            </div>
          </motion.button>

          <button 
            onClick={handleVideoClick}
            className={`w-16 h-16 rounded-full backdrop-blur-xl border flex items-center justify-center shadow-lg transition-all duration-300 cursor-pointer ${
              isCameraOn
                ? 'bg-white text-slate-900 border-white shadow-indigo-500/20'
                : 'bg-white/40 text-slate-600 border-white/40 hover:bg-white hover:scale-110'
            }`}
            title={isCameraOn ? '关闭摄像头' : '开启摄像头'}
          >
            {isCameraOn ? <Video className="w-7 h-7" /> : <VideoOff className="w-7 h-7" />}
          </button>
        </div>
      </div>

      {/* 字幕侧边栏 */}
      <div className="flex-1 md:w-[400px] md:flex-none bg-white/60 backdrop-blur-2xl border-t md:border-t-0 md:border-l border-white/40 flex flex-col h-full shadow-[-10px_0_30px_rgba(0,0,0,0.02)] z-20">
        <div className="p-4 md:p-6 border-b border-white/20 bg-white/40 backdrop-blur-md flex-shrink-0">
          <h3 className="font-bold text-slate-900 text-base md:text-lg">Transcript</h3>
          <p className="text-[10px] md:text-xs text-slate-500 font-medium mt-0.5 md:mt-1">Real-time speech-to-text</p>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 md:space-y-6 pb-24 md:pb-6">
          {displayMessages.map((msg) => (
            <motion.div 
              key={msg.id} 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div className={`max-w-[90%] p-3 md:p-5 rounded-2xl text-xs md:text-sm leading-relaxed shadow-sm ${
                msg.role === 'user' 
                  ? 'bg-indigo-600 text-white rounded-br-none shadow-indigo-500/20' 
                  : 'bg-white border border-slate-100 text-slate-700 rounded-bl-none shadow-slate-200/50'
              }`}>
                {msg.content}
              </div>
              <span className="text-[10px] text-slate-400 mt-1 md:mt-2 px-1 font-medium uppercase tracking-wider">
                {msg.role === 'user' ? 'You' : 'Interviewer'} • {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </motion.div>
          ))}
          
          {/* 思考中占位气泡 */}
          <AnimatePresence>
            {aiState === 'thinking' && !streamingContent && <ThinkingBubble />}
          </AnimatePresence>
          
          <div ref={messagesEndRef} />
        </div>

        {/* 桌面端文字输入 */}
        <div className="hidden md:block p-6 border-t border-white/20 bg-white/40 backdrop-blur-md">
          <div className="relative group">
            <input 
              type="text" 
              placeholder="输入消息或使用麦克风..." 
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              disabled={aiState === 'thinking'}
              className="w-full pl-6 pr-12 py-4 bg-white/80 border border-slate-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm group-hover:shadow-md disabled:opacity-50"
            />
            <button 
              onClick={handleSendMessage}
              disabled={aiState === 'thinking' || !inputMessage.trim()}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/20 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>


      {/* 移动端浮动控制栏 */}
      <div className="md:hidden fixed bottom-20 left-0 w-full flex flex-col items-center gap-3 z-50 pointer-events-none px-4">
        {/* 降级文字输入框 */}
        <AnimatePresence>
          {showTextFallback && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="w-full max-w-md pointer-events-auto"
            >
              <div className="relative bg-slate-900/90 backdrop-blur-xl rounded-full border border-white/10 shadow-2xl">
                <input 
                  type="text" 
                  placeholder="输入消息..." 
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  className="w-full pl-5 pr-12 py-3 bg-transparent text-white text-sm placeholder-slate-400 focus:outline-none"
                />
                <button 
                  onClick={handleSendMessage}
                  disabled={!inputMessage.trim()}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-indigo-600 text-white rounded-full disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 控制按钮 */}
        <div className="flex items-center gap-4 bg-slate-900/90 backdrop-blur-xl p-2 rounded-full border border-white/10 shadow-2xl pointer-events-auto">
          {/* 音量柱 */}
          <div className="flex items-end gap-0.5 h-6 px-2">
            {[0, 1, 2].map(i => (
              <VolumeBar key={i} volume={aiState === 'listening' ? micVolume : 0} index={i} />
            ))}
          </div>
          
          <button 
            onClick={handleMicToggle}
            disabled={!isMicAvailable}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
              aiState === 'listening'
                ? 'bg-emerald-500 text-white' 
                : 'bg-white/20 text-white disabled:opacity-50'
            }`}
          >
            {aiState === 'listening' ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
          </button>

          {/* 🎙️ 语音控制按钮（任务 2 - 移动端）*/}
          <motion.button
            onClick={toggleSpeech}
            disabled={aiState === 'thinking' || !canReplaySpeech}
            whileTap={{ scale: 0.9 }}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
              isSpeaking
                ? 'bg-red-500 text-white'
                : canReplaySpeech
                  ? 'bg-white/20 text-white'
                  : 'bg-white/10 text-slate-500 opacity-50'
            }`}
          >
            {isSpeaking ? (
              <StopCircle className="w-5 h-5" />
            ) : (
              <Volume2 className="w-5 h-5" />
            )}
          </motion.button>

          <button 
            onClick={handleVideoClick}
            className={`w-12 h-12 rounded-full flex items-center justify-center cursor-pointer transition-all ${
              isCameraOn ? 'bg-white text-slate-900' : 'bg-white/20 text-white'
            }`}
          >
            {isCameraOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
          </button>
        </div>
      </div>
    </div>
  );
};

export default InterviewView;
