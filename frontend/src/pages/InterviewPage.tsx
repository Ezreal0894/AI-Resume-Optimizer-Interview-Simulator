/**
 * AI 模拟面试页面
 * 设计系统：深色主题面试界面，清晰视觉层次
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { User, Mic, MicOff, Video, VideoOff, PhoneOff, Send, Loader2 } from 'lucide-react';
import { useInterviewStore } from '../stores/interviewStore';
import { interviewApi, ChatMessage, StreamController } from '../api/interview';
import { useSpeech } from '../hooks/useSpeech';

interface Message {
  id: string;
  role: 'assistant' | 'user';
  content: string;
  timestamp: Date;
}

export default function InterviewPage() {
  const {
    sessionId,
    jobTitle,
    messages,
    isStreaming,
    streamingContent,
    isListening,
    isSpeaking,
    setSession,
    addMessage,
    setStreaming,
    appendStreamContent,
    finalizeStream,
    reset,
  } = useInterviewStore();

  const { startListening, stopListening, speak, stopSpeaking, isSupported } = useSpeech();

  const [inputText, setInputText] = useState('');
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isStarting, setIsStarting] = useState(false);
  const [showSetup, setShowSetup] = useState(true);
  const [setupJobTitle, setSetupJobTitle] = useState('前端工程师');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const streamControllerRef = useRef<StreamController | null>(null);

  useEffect(() => {
    return () => {
      if (streamControllerRef.current) {
        streamControllerRef.current.abort();
        streamControllerRef.current = null;
      }
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingContent]);

  const handleStartInterview = useCallback(async () => {
    setIsStarting(true);
    try {
      const response = await interviewApi.createSession({
        jobTitle: setupJobTitle,
        difficulty: 'MEDIUM',
      });
      setSession(response.data.data.sessionId, setupJobTitle);
      addMessage('assistant', response.data.data.greeting);
      setShowSetup(false);
      if (isSupported.synthesis) {
        speak(response.data.data.greeting);
      }
    } catch (error) {
      console.error('Failed to start interview:', error);
    } finally {
      setIsStarting(false);
    }
  }, [setupJobTitle, setSession, addMessage, isSupported.synthesis, speak]);

  const handleSendMessage = useCallback(async (text: string) => {
    if (!text.trim() || !sessionId || isStreaming) return;

    addMessage('user', text);
    setInputText('');
    setStreaming(true);

    const context: ChatMessage[] = messages.slice(-10).map((m: Message) => ({
      role: m.role,
      content: m.content,
    }));
    context.push({ role: 'user', content: text });

    streamControllerRef.current = interviewApi.streamChat(
      sessionId,
      context,
      (content: string) => appendStreamContent(content),
      () => {
        finalizeStream();
        const fullContent = useInterviewStore.getState().streamingContent;
        if (fullContent && isSupported.synthesis) {
          speak(fullContent);
        }
        streamControllerRef.current = null;
      },
      (error: string) => {
        console.error('Stream error:', error);
        setStreaming(false);
        streamControllerRef.current = null;
      }
    );
  }, [sessionId, isStreaming, messages, addMessage, setStreaming, appendStreamContent, finalizeStream, isSupported.synthesis, speak]);

  const handleVoiceInput = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      stopSpeaking();
      startListening(
        (text: string) => handleSendMessage(text),
        (error: string) => console.error('Speech recognition error:', error)
      );
    }
  }, [isListening, stopListening, stopSpeaking, startListening, handleSendMessage]);

  const handleEndInterview = useCallback(async () => {
    if (streamControllerRef.current) {
      streamControllerRef.current.abort();
      streamControllerRef.current = null;
    }
    stopSpeaking();
    stopListening();
    if (sessionId) {
      try {
        await interviewApi.endSession(sessionId);
      } catch (error) {
        console.error('Failed to end interview:', error);
      }
    }
    reset();
    setShowSetup(true);
  }, [sessionId, stopSpeaking, stopListening, reset]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(inputText);
    }
  }, [inputText, handleSendMessage]);

  // 设置界面
  if (showSetup) {
    return (
      <div className="h-full flex items-center justify-center p-8 bg-gray-50">
        <motion.div
          className="max-w-md w-full bg-white rounded-xl border border-gray-200 p-8 shadow-soft"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-2">开始模拟面试</h2>
          <p className="text-sm text-gray-400 mb-6">选择你想要模拟的岗位</p>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                目标岗位
              </label>
              <input
                type="text"
                value={setupJobTitle}
                onChange={(e) => setSetupJobTitle(e.target.value)}
                placeholder="例如：前端工程师"
                className="w-full h-10 px-3 border border-gray-200 rounded-lg text-gray-900 text-sm focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/10 transition-all duration-150 placeholder:text-gray-400"
              />
            </div>

            <motion.button
              onClick={handleStartInterview}
              disabled={isStarting || !setupJobTitle.trim()}
              className="w-full h-10 bg-primary-500 text-white rounded-lg font-medium text-sm flex items-center justify-center gap-2 disabled:opacity-50 shadow-soft"
              whileHover={{ scale: 1.01, boxShadow: '0 8px 30px rgba(14,165,233,0.3)' }}
              whileTap={{ scale: 0.99 }}
            >
              {isStarting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  准备中...
                </>
              ) : (
                '开始面试'
              )}
            </motion.button>
          </div>
        </motion.div>
      </div>
    );
  }

  // 面试界面
  return (
    <div className="h-screen bg-gray-900 flex">
      {/* 主视觉区 */}
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        {/* AI 头像 */}
        <div className="relative mb-8">
          <motion.div
            className="absolute inset-0 rounded-full"
            animate={{
              boxShadow: [
                '0 0 60px 30px rgba(14,165,233,0.1)',
                '0 0 80px 40px rgba(14,165,233,0.2)',
                '0 0 60px 30px rgba(14,165,233,0.1)',
              ],
            }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            style={{ transform: 'scale(1.5)' }}
          />
          <motion.div
            className="absolute inset-0 rounded-full"
            animate={{
              boxShadow: [
                '0 0 40px 20px rgba(14,165,233,0.15)',
                '0 0 60px 30px rgba(14,165,233,0.25)',
                '0 0 40px 20px rgba(14,165,233,0.15)',
              ],
            }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut', delay: 0.3 }}
            style={{ transform: 'scale(1.2)' }}
          />
          <div className="relative w-32 h-32 bg-gray-800 rounded-full flex items-center justify-center border-2 border-primary-500/30">
            <User className="w-16 h-16 text-primary-400" strokeWidth={1.5} />
          </div>
        </div>

        <h2 className="text-xl font-semibold text-white mb-2">AI 面试官</h2>
        <p className="text-sm text-gray-400 mb-8">正在进行：{jobTitle} 模拟面试</p>

        {/* 语音波纹动画 */}
        {(isSpeaking || isStreaming) && (
          <div className="flex items-center gap-1">
            {[...Array(5)].map((_, i) => (
              <motion.div
                key={i}
                className="w-1 bg-primary-500 rounded-full"
                animate={{ height: [16, 32, 16] }}
                transition={{
                  duration: 0.8,
                  repeat: Infinity,
                  delay: i * 0.1,
                  ease: 'easeInOut',
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* 右侧对话区 */}
      <div className="w-96 bg-gray-800/50 backdrop-blur-xl border-l border-gray-700/50 flex flex-col">
        <div className="px-6 py-4 border-b border-gray-700/50">
          <h3 className="text-base font-semibold text-white">实时对话</h3>
        </div>

        {/* 消息列表 */}
        <div className="flex-1 overflow-auto p-6 space-y-4">
          {messages.map((msg: Message) => (
            <motion.div
              key={msg.id}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div
                className={`max-w-[80%] p-4 rounded-xl text-sm ${
                  msg.role === 'user'
                    ? 'bg-primary-500 text-white rounded-br-md'
                    : 'bg-gray-700 text-gray-200 rounded-bl-md'
                }`}
              >
                {msg.content}
              </div>
            </motion.div>
          ))}

          {isStreaming && streamingContent && (
            <motion.div
              className="flex justify-start"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="max-w-[80%] p-4 rounded-xl bg-gray-700 text-gray-200 rounded-bl-md text-sm">
                {streamingContent}
                <span className="inline-block w-2 h-4 bg-primary-400 ml-1 animate-pulse" />
              </div>
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* 输入区 */}
        <div className="p-4 border-t border-gray-700/50">
          <div className="flex gap-2">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="输入你的回答..."
              disabled={isStreaming}
              className="flex-1 h-10 px-3 bg-gray-700 text-white text-sm rounded-lg border border-gray-600 focus:outline-none focus:border-primary-500 disabled:opacity-50 placeholder:text-gray-400"
            />
            <motion.button
              onClick={() => handleSendMessage(inputText)}
              disabled={isStreaming || !inputText.trim()}
              className="w-10 h-10 bg-primary-500 text-white rounded-lg flex items-center justify-center disabled:opacity-50"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Send className="w-4 h-4" strokeWidth={1.5} />
            </motion.button>
          </div>
        </div>
      </div>

      {/* 底部控制台 */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4 px-6 py-4 bg-gray-900/70 backdrop-blur-xl rounded-xl border border-gray-700/50"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <motion.button
          onClick={handleVoiceInput}
          className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors duration-150 ${
            isListening ? 'bg-error-500 text-white' : 'bg-gray-700 text-white hover:bg-gray-600'
          }`}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          {isListening ? <MicOff className="w-5 h-5" strokeWidth={1.5} /> : <Mic className="w-5 h-5" strokeWidth={1.5} />}
        </motion.button>
        <motion.button
          onClick={() => setIsCameraOn(!isCameraOn)}
          className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors duration-150 ${
            isCameraOn ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-error-500 text-white'
          }`}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          {isCameraOn ? <Video className="w-5 h-5" strokeWidth={1.5} /> : <VideoOff className="w-5 h-5" strokeWidth={1.5} />}
        </motion.button>
        <motion.button
          onClick={handleEndInterview}
          className="w-12 h-12 rounded-full bg-error-500 text-white flex items-center justify-center"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <PhoneOff className="w-5 h-5" strokeWidth={1.5} />
        </motion.button>
      </motion.div>
    </div>
  );
}
