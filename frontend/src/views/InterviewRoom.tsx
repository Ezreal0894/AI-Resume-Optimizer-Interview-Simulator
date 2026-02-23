/**
 * 面试间 - 终极进化版
 * 
 * 核心能力：
 * 1. AIState 状态机视觉映射
 * 2. 霸气打断机制
 * 3. 顶部进度台 + 自动终结
 * 4. 麦克风音量可视化 + 降级文字输入
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
  MessageSquare
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useInterviewEngine } from '../hooks/useInterviewEngine';
import { AIState } from '../stores/interviewStore';

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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

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
    initSession,
    sendMessage,
    startListening,
    stopListening,
    endSession,
    resetEngine,
  } = useInterviewEngine();

  // 自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingContent]);

  // 初始化会话（带开场白锁检查）
  useEffect(() => {
    // 只有在没有 sessionId 或没有播报过开场白时才初始化
    if (!sessionId || !hasGreeted) {
      initSession('Frontend Engineer', 'MEDIUM');
    }
    
    return () => {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // 麦克风不可用时显示文字输入
  useEffect(() => {
    if (!isMicAvailable && sessionId) {
      setShowTextFallback(true);
    }
  }, [isMicAvailable, sessionId]);

  // 摄像头绑定
  useEffect(() => {
    if (isCameraOn && videoRef.current && mediaStreamRef.current) {
      videoRef.current.srcObject = mediaStreamRef.current;
    }
  }, [isCameraOn]);

  // 面试结束跳转
  const handleNavigateToReport = () => {
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

  // 摄像头控制
  const handleVideoClick = async () => {
    if (isCameraOn) {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
        mediaStreamRef.current = null;
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      setIsCameraOn(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' } 
        });
        mediaStreamRef.current = stream;
        setIsCameraOn(true);
      } catch (error: any) {
        console.error('Camera error:', error);
        alert(error.name === 'NotAllowedError' ? '请允许访问摄像头权限' : '无法访问摄像头');
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

      {/* 主视频区域 */}
      <div className="flex-none md:flex-1 h-[35vh] md:h-auto flex flex-col relative p-4 md:p-6 z-10">
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

          {/* AI 头像 */}
          <div className="relative z-10 flex flex-col items-center scale-75 md:scale-100">
            <AIAvatarVisual aiState={aiState} />
            <p className="text-indigo-200/80 font-medium text-sm md:text-lg tracking-wide">
              {getStatusText()}
            </p>
          </div>

          {/* 用户摄像头预览 */}
          <div className="absolute bottom-4 right-4 md:bottom-8 md:right-8 w-24 h-16 md:w-56 md:h-40 bg-slate-800/80 backdrop-blur-xl rounded-xl md:rounded-2xl shadow-2xl border border-white/10 overflow-hidden group-hover:scale-105 transition-transform duration-500">
            <div className="w-full h-full flex items-center justify-center relative">
              {isCameraOn ? (
                <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover scale-x-[-1]" />
              ) : (
                <User className="w-6 h-6 md:w-10 md:h-10 text-slate-500" />
              )}
              <div className="absolute bottom-1 left-1 md:bottom-3 md:left-3 bg-black/50 backdrop-blur-sm px-1.5 py-0.5 md:px-2 md:py-1 rounded-md text-[8px] md:text-[10px] font-bold text-white">YOU</div>
              {isCameraOn && <div className="absolute top-1 right-1 md:top-2 md:right-2 w-2 h-2 rounded-full bg-green-500 animate-pulse" />}
            </div>
          </div>
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
