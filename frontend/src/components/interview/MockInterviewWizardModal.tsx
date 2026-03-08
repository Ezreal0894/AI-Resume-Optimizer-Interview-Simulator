import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  X,
  Upload,
  FileText,
  Check,
  Loader2,
  Briefcase,
  Cpu,
  BookOpen,
  Layers,
  Code,
  Lock,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Cloud,
  AlertCircle,
  Plus,
  User,
  Lightbulb,
  Target,
} from 'lucide-react';

// API & Store Imports
import { interviewApi } from '../../api/interview';
import { getDocuments, uploadDocument, Document, extractResume, ResumeExtractResult } from '../../api/document';
import { useAuthStore } from '../../stores/authStore';
import { useInterviewStore } from '../../stores/interviewStore';

// --- Types ---
interface Resume {
  id: string;
  name: string;
  date: string;
  size: string;
}

// 🆕 Phase 3: 知识点编辑限制
const KNOWLEDGE_POINT_LIMITS = {
  MAX_COUNT: 20,
  MAX_LENGTH: 100,
};

// 🆕 Phase 2: 加载状态文案
const LOADING_MESSAGES = [
  '正在通读简历全文...',
  '正在提炼核心亮点...',
  '正在构建定制化专属题库...',
];

const TOPICS = [
  "Data Structures & Algorithms",
  "Core Principles",
  "System Design",
  "Architecture",
  "Design Patterns",
  "React Internals",
  "Performance Optimization"
];

const DIFFICULTIES = [
  { id: 'EASY', label: 'Junior', sub: 'Foundations' },
  { id: 'MEDIUM', label: 'Mid-Level', sub: 'Practical' },
  { id: 'HARD', label: 'Senior', sub: 'Deep Dive' },
  { id: 'EXPERT', label: 'Big Tech Expert', sub: 'Mastery' },
];

interface MockInterviewWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type WizardStep = 1 | 2 | 'extracting'; // 🆕 Phase 2: 新增 extracting 状态

export default function MockInterviewWizardModal({ 
  isOpen, 
  onClose 
}: MockInterviewWizardModalProps) {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const userRole = user?.name || "Frontend Developer";

  // --- State ---
  const [step, setStep] = useState<WizardStep>(1);

  // Resume State
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [isLoadingResumes, setIsLoadingResumes] = useState(false);
  const [selectedResumeId, setSelectedResumeId] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  
  // 🛑 文件格式校验状态（任务：格式强校验）
  const [dragRejectError, setDragRejectError] = useState(false);

  // 🆕 Phase 2: 提取状态
  const [extractedData, setExtractedData] = useState<ResumeExtractResult | null>(null);
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);

  // 🆕 Phase 3: 自定义知识点状态（白盒化编辑）
  const [customKnowledgePoints, setCustomKnowledgePoints] = useState<string[]>([]);
  const [isAddingKnowledge, setIsAddingKnowledge] = useState(false);
  const [newKnowledgeInput, setNewKnowledgeInput] = useState('');

  // Topic & Difficulty State
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [selectedDifficulty, setSelectedDifficulty] = useState<string | null>(null);

  // Async State
  const [isLoading, setIsLoading] = useState(false);

  // --- Fetch Resumes on Open ---
  useEffect(() => {
    if (isOpen) {
      // Reset state
      setStep(1);
      setSelectedResumeId(null);
      setUploadedFile(null);
      setSelectedTopics([]);
      setSelectedDifficulty(null);
      setIsLoading(false);
      setIsUploading(false);
      setUploadError(null);
      setExtractedData(null); // 🆕 Phase 2
      setCustomKnowledgePoints([]); // 🆕 Phase 3
      setIsAddingKnowledge(false); // 🆕 Phase 3
      setNewKnowledgeInput(''); // 🆕 Phase 3

      // Fetch resume list
      const fetchResumes = async () => {
        setIsLoadingResumes(true);
        try {
          const documents = await getDocuments();
          console.log('📄 Fetched documents:', documents);
          const resumeDocuments = documents
            .filter((doc: Document) => doc.type === 'resume')
            .map((doc: Document) => ({
              id: doc.id,
              name: doc.title,
              date: doc.date,
              size: doc.size,
            }));
          console.log('📋 Filtered resumes:', resumeDocuments);
          setResumes(resumeDocuments);
        } catch (error) {
          console.error('❌ Failed to fetch resumes:', error);
          setResumes([]);
        } finally {
          setIsLoadingResumes(false);
        }
      };

      fetchResumes();
    }
  }, [isOpen]);

  // 🆕 Phase 2: 加载消息轮播动画
  useEffect(() => {
    if (step === 'extracting') {
      const interval = setInterval(() => {
        setLoadingMessageIndex((prev) => (prev + 1) % LOADING_MESSAGES.length);
      }, 2500);

      return () => clearInterval(interval);
    }
  }, [step]);

  // --- Validation ---
  const hasResume = !!selectedResumeId || !!uploadedFile;
  const isStep1Valid = hasResume && !uploadError;

  // Step 2 Validation
  const canStart = hasResume 
    ? !!selectedDifficulty 
    : (selectedTopics.length > 0 && !!selectedDifficulty);

  // --- Handlers ---
  // 🛑 改造 1 & 3：拖拽上传 - 源头强锁死 PDF 格式
  const handleFileDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    
    // 🔴 严格校验：只允许 PDF
    if (!file) return;
    
    const isPDF = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    
    if (!isPDF) {
      // 🔴 改造 4：触发震动反馈
      setDragRejectError(true);
      setTimeout(() => setDragRejectError(false), 2000);
      return; // 阻止上传
    }
    
    // PDF 文件，继续上传
    setIsUploading(true);
    setUploadError(null);
    setDragRejectError(false);
    try {
      console.log('📤 Uploading resume:', file.name);
      const response = await uploadDocument(file, userRole);
      console.log('📥 Upload response:', response);
      
      const resumeId = response.data?.resume?.id;
      console.log('✅ Resume ID:', resumeId);
      
      if (!resumeId) {
        throw new Error('未能获取简历 ID');
      }
      
      setUploadedFile(file);
      setSelectedResumeId(resumeId);
    } catch (error: any) {
      console.error('❌ Failed to upload resume:', error);
      const errorMsg = error.response?.data?.message || error.message || '上传失败';
      setUploadError(errorMsg);
      setUploadedFile(null);
      setSelectedResumeId(null);
    } finally {
      setIsUploading(false);
    }
  };

  // 🛑 改造 3：文件选择 - 源头强锁死 PDF 格式
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // 🔴 严格校验：只允许 PDF
    const isPDF = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    
    if (!isPDF) {
      // 🔴 改造 4：触发震动反馈
      setDragRejectError(true);
      setTimeout(() => setDragRejectError(false), 2000);
      return; // 阻止上传
    }
    
    // PDF 文件，继续上传
    setIsUploading(true);
    setUploadError(null);
    setDragRejectError(false);
    try {
      console.log('📤 Uploading resume:', file.name);
      const response = await uploadDocument(file, userRole);
      console.log('📥 Upload response:', response);
      
      const resumeId = response.data?.resume?.id;
      console.log('✅ Resume ID:', resumeId);
      
      if (!resumeId) {
        throw new Error('未能获取简历 ID');
      }
      
      setUploadedFile(file);
      setSelectedResumeId(resumeId);
    } catch (error: any) {
      console.error('❌ Failed to upload resume:', error);
      const errorMsg = error.response?.data?.message || error.message || '上传失败';
      setUploadError(errorMsg);
      setUploadedFile(null);
      setSelectedResumeId(null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSkipToTopics = () => {
    setSelectedResumeId(null);
    setUploadedFile(null);
    setStep(2);
  };

  // 🆕 Phase 2: 拦截跳转，调用提取 API
  // 🔧 Phase 3: 支持历史简历提取（从缓存读取，秒回！）
  const handleNextStep = async () => {
    if (!isStep1Valid) return;

    try {
      // 进入提取状态
      setStep('extracting');
      setLoadingMessageIndex(0);

      let extractResult: ResumeExtractResult;

      // 如果是新上传的文件
      if (uploadedFile) {
        console.log('📤 Extracting from uploaded file...');
        extractResult = await extractResume(uploadedFile, userRole);
      } 
      // 如果是选中的历史简历
      else if (selectedResumeId) {
        console.log('📤 Extracting from selected resume:', selectedResumeId);
        // 🔧 提取真实的 resume ID（去掉 "resume-" 前缀）
        const realResumeId = selectedResumeId.startsWith('resume-') 
          ? selectedResumeId.replace('resume-', '') 
          : selectedResumeId;
        console.log('📝 Real resume ID:', realResumeId);
        // 🚀 后端会从缓存读取，如果有缓存则秒回！
        extractResult = await extractResume(realResumeId, userRole);
      } else {
        throw new Error('未选择简历');
      }

      console.log('✅ Extract result:', extractResult);
      setExtractedData(extractResult);
      
      // 🆕 Phase 3: 初始化自定义知识点为提取的知识点
      setCustomKnowledgePoints(extractResult.knowledgePoints || []);

      // 等待最后一条消息显示完整（至少 2.5 秒）
      await new Promise(resolve => setTimeout(resolve, 2500));

      // 切换到 Step 2
      setStep(2);
    } catch (error: any) {
      console.error('❌ Extract failed:', error);
      alert(`简历解析失败: ${error.response?.data?.message || error.message || '未知错误'}`);
      // 回到 Step 1
      setStep(1);
    }
  };

  const handleStartInterview = async () => {
    if (!canStart || isLoading) return;

    // 🔒 Resume 模式下必须有 resumeId
    if (hasResume && !selectedResumeId) {
      alert('简历上传失败，请重新上传或选择历史简历');
      return;
    }

    setIsLoading(true);
    try {
      // 🔧 提取真实的 resume ID（去掉 "resume-" 前缀）
      const realResumeId = selectedResumeId 
        ? (selectedResumeId.startsWith('resume-') 
            ? selectedResumeId.replace('resume-', '') 
            : selectedResumeId)
        : null;

      // 🔴 1. Construct Payload（v3.0 契约对齐 + Phase 3 自定义知识点）
      const payload = hasResume 
        ? { 
            mode: 'RESUME' as const,
            jobTitle: userRole,
            difficulty: selectedDifficulty || 'MEDIUM',
            resumeId: realResumeId!,  // 使用真实的 resume ID
            customKnowledgePoints: customKnowledgePoints.length > 0 ? customKnowledgePoints : undefined, // 🆕 Phase 3
          }
        : { 
            mode: 'TOPIC' as const,
            jobTitle: userRole,
            jobDescription: `Focus on: ${selectedTopics.join(', ')}`,
            difficulty: selectedDifficulty || 'MEDIUM',
            topics: selectedTopics
          };

      console.log('🚀 Submitting Payload:', payload);

      // 🔴 2. Create Interview Session
      const response = await interviewApi.createSession(payload);
      console.log('✅ API Response:', response.data);
      
      const sessionId = response.data.data.sessionId;
      const greeting = response.data.data.greeting;

      if (!sessionId) {
        throw new Error('Session ID not returned from API');
      }

      console.log('📝 Session created:', sessionId);

      // 🔴 3. 重置面试引擎并设置新会话
      const { reset, setSession, addMessage, setGreeted } = useInterviewStore.getState();
      
      console.log('🔄 Resetting interview store...');
      reset(); // 清除旧会话数据
      
      console.log('💾 Setting new session...');
      setSession(sessionId, userRole);
      addMessage('assistant', greeting);
      setGreeted(); // 标记开场白已播报

      console.log('✅ Interview store initialized');

      // 🔴 4. Navigate to Interview Room
      console.log('🧭 Navigating to /dashboard/interview');
      navigate('/dashboard/interview');
      
      // 🔴 5. Close Modal
      console.log('🚪 Closing modal');
      onClose();
    } catch (error: any) {
      console.error('❌ Failed to start interview:', error);
      console.error('Error details:', error.response?.data || error.message);
      alert(`创建面试失败: ${error.response?.data?.message || error.message || '未知错误'}`);
      setIsLoading(false);
    }
  };

  // --- Render Steps ---
  // 🆕 Phase 2: 骨架屏加载状态
  const renderExtracting = () => (
    <div className="flex flex-col h-full items-center justify-center p-8">
      {/* 科技感毛玻璃容器 */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative w-full max-w-md"
      >
        {/* 背景光效 */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-pink-500/10 rounded-3xl blur-3xl" />
        
        {/* 主容器 */}
        <div className="relative bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200 dark:border-slate-700 rounded-3xl p-8 shadow-2xl">
          {/* AI 图标 */}
          <motion.div
            animate={{ 
              rotate: 360,
              scale: [1, 1.1, 1]
            }}
            transition={{ 
              rotate: { duration: 3, repeat: Infinity, ease: "linear" },
              scale: { duration: 2, repeat: Infinity, ease: "easeInOut" }
            }}
            className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/30"
          >
            <Cpu className="w-10 h-10 text-white" />
          </motion.div>

          {/* 动态文案 */}
          <AnimatePresence mode="wait">
            <motion.div
              key={loadingMessageIndex}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.5 }}
              className="text-center mb-8"
            >
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                {LOADING_MESSAGES[loadingMessageIndex]}
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                AI 正在深度分析您的简历
              </p>
            </motion.div>
          </AnimatePresence>

          {/* 进度条 */}
          <div className="space-y-3">
            {[0, 1, 2].map((index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden"
              >
                <motion.div
                  animate={{
                    x: ['-100%', '100%'],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: index * 0.2,
                  }}
                  className="h-full w-1/3 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full"
                />
              </motion.div>
            ))}
          </div>

          {/* 提示文字 */}
          <motion.p
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="text-xs text-center text-slate-400 dark:text-slate-500 mt-6"
          >
            这可能需要几秒钟，请稍候...
          </motion.p>
        </div>
      </motion.div>
    </div>
  );

  const renderStep1 = () => (
    <div className="flex flex-col h-full">
      <div className="text-center space-y-2 mb-8">
        <h3 className="text-2xl font-bold text-slate-900 dark:text-white">准备开始模拟面试</h3>
        <p className="text-slate-500 dark:text-slate-400">请选择一份简历供 AI 面试官深度解析，或直接跳过进行专项测验。</p>
      </div>

      {/* Bento Split Layout */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 min-h-0">
        {/* Left: History Resumes */}
        <div className="flex flex-col gap-4 overflow-y-auto pr-2 custom-scrollbar">
          <h4 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2 sticky top-0 bg-white dark:bg-slate-900 z-10 py-2">
            <Briefcase className="w-4 h-4 text-indigo-500" />
            历史简历
          </h4>

          {isLoadingResumes ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
            </div>
          ) : resumes.length === 0 ? (
            // 🛑 改造 2：极致的空状态文案
            <div className="text-center py-12 text-slate-400 text-sm">
              <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="font-semibold text-slate-600 dark:text-slate-300 mb-1">暂无历史简历</p>
              <p className="text-slate-500 dark:text-slate-400 text-xs">请在下方上传您的首份 PDF 简历，开启全真模拟面试。</p>
            </div>
          ) : (
            <div className="space-y-3">
              {resumes.map((resume) => {
                const isSelected = selectedResumeId === resume.id;
                // 🛑 改造 1：判断是否为 PDF 格式
                const isPDF = resume.name.toLowerCase().endsWith('.pdf');
                const isDisabled = !isPDF;
                
                return (
                  <motion.div
                    key={resume.id}
                    onClick={() => {
                      if (!isDisabled) {
                        setSelectedResumeId(resume.id);
                        setUploadedFile(null);
                      }
                    }}
                    whileHover={!isDisabled ? { scale: 1.01 } : {}}
                    whileTap={!isDisabled ? { scale: 0.99 } : {}}
                    className={`p-4 rounded-xl border-2 transition-all flex items-center justify-between group relative ${
                      isDisabled
                        ? 'opacity-50 grayscale cursor-not-allowed border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/30'
                        : isSelected
                          ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 cursor-pointer'
                          : 'border-slate-100 dark:border-slate-800 hover:border-indigo-200 dark:hover:border-indigo-800 bg-white dark:bg-slate-800/50 cursor-pointer'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`p-2.5 rounded-lg ${
                        isDisabled 
                          ? 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                          : isSelected 
                            ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600' 
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                      }`}>
                        <FileText className="w-5 h-5" />
                      </div>
                      <div>
                        <p className={`font-medium ${
                          isDisabled
                            ? 'text-slate-400 dark:text-slate-600'
                            : isSelected 
                              ? 'text-indigo-900 dark:text-indigo-100' 
                              : 'text-slate-700 dark:text-slate-200'
                        }`}>
                          {resume.name}
                        </p>
                        <p className="text-xs text-slate-400">{resume.date} • {resume.size}</p>
                      </div>
                    </div>
                    {isSelected && !isDisabled && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="bg-indigo-600 text-white p-1 rounded-full"
                      >
                        <Check className="w-3 h-3" />
                      </motion.div>
                    )}
                    
                    {/* 🛑 改造 1：Tooltip 提示（仅非 PDF 显示）*/}
                    {isDisabled && (
                      <div className="absolute -top-12 left-1/2 -translate-x-1/2 px-3 py-2 bg-slate-900 text-white text-xs font-medium rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-20 shadow-lg">
                        ⚠️ AI 面试官目前仅支持解析 PDF 格式简历
                        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-900 rotate-45"></div>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: Upload Dropzone */}
        <div className="flex flex-col gap-4">
          <h4 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <Cloud className="w-4 h-4 text-indigo-500" />
            上传新简历
          </h4>

          {/* 🛑 改造 3 & 4：拖拽上传区 - 源头强锁死 + 震动反馈 */}
          <motion.div
            animate={dragRejectError ? { x: [-5, 5, -5, 5, 0] } : {}}
            transition={{ duration: 0.3 }}
            className={`flex-1 relative border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center text-center transition-all cursor-pointer overflow-hidden group ${
              dragRejectError
                ? 'border-red-500 bg-red-50 dark:bg-red-900/10'
                : uploadedFile 
                  ? 'border-indigo-500 bg-indigo-50/30 dark:bg-indigo-900/10' 
                  : 'border-slate-200 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-indigo-600 hover:bg-slate-50 dark:hover:bg-slate-800/50'
            }`}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleFileDrop}
            onClick={() => !dragRejectError && document.getElementById('file-upload-wizard')?.click()}
          >
            {/* 🛑 改造 3：Input 属性 - 严格限制 PDF */}
            <input 
              type="file" 
              id="file-upload-wizard" 
              className="hidden" 
              accept=".pdf,application/pdf"
              onChange={handleFileSelect}
            />

            {/* Animated Background Pattern */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              <div className="absolute inset-0 bg-[radial-gradient(#6366f1_1px,transparent_1px)] [background-size:16px_16px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-20"></div>
            </div>

            {/* 🛑 改造 4：格式错误震动反馈 */}
            {dragRejectError ? (
              <motion.div 
                initial={{ opacity: 0, y: 10 }} 
                animate={{ opacity: 1, y: 0 }} 
                className="flex flex-col items-center relative z-10"
              >
                <div className="w-14 h-14 bg-red-100 dark:bg-red-900/50 rounded-full flex items-center justify-center text-red-600 mb-3 shadow-sm">
                  <AlertCircle className="w-7 h-7" />
                </div>
                <p className="font-semibold text-red-900 dark:text-red-100 text-lg px-4 text-center">❌ 格式错误</p>
                <p className="text-sm text-red-600/70 dark:text-red-400 mt-1 px-4 text-center">仅支持 PDF 格式！</p>
              </motion.div>
            ) : isUploading ? (
              <motion.div 
                initial={{ opacity: 0, y: 10 }} 
                animate={{ opacity: 1, y: 0 }} 
                className="flex flex-col items-center relative z-10"
              >
                <Loader2 className="w-14 h-14 text-indigo-600 animate-spin mb-3" />
                <p className="font-semibold text-indigo-900 dark:text-indigo-100 text-lg">上传中...</p>
              </motion.div>
            ) : uploadError ? (
              <motion.div 
                initial={{ opacity: 0, y: 10 }} 
                animate={{ opacity: 1, y: 0 }} 
                className="flex flex-col items-center relative z-10"
              >
                <div className="w-14 h-14 bg-red-100 dark:bg-red-900/50 rounded-full flex items-center justify-center text-red-600 mb-3 shadow-sm">
                  <AlertCircle className="w-7 h-7" />
                </div>
                <p className="font-semibold text-red-900 dark:text-red-100 text-lg px-4 text-center">上传失败</p>
                <p className="text-sm text-red-600/70 dark:text-red-400 mt-1 px-4 text-center">{uploadError}</p>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setUploadError(null);
                    setUploadedFile(null);
                    setSelectedResumeId(null);
                  }}
                  className="mt-4 text-xs font-medium text-red-600 hover:text-red-700 transition-colors z-20 px-4 py-2 bg-red-50 rounded-lg"
                >
                  重新上传
                </button>
              </motion.div>
            ) : uploadedFile ? (
              <motion.div 
                initial={{ opacity: 0, y: 10 }} 
                animate={{ opacity: 1, y: 0 }} 
                className="flex flex-col items-center relative z-10"
              >
                <div className="w-14 h-14 bg-indigo-100 dark:bg-indigo-900/50 rounded-full flex items-center justify-center text-indigo-600 mb-3 shadow-sm">
                  <Check className="w-7 h-7" />
                </div>
                <p className="font-semibold text-indigo-900 dark:text-indigo-100 text-lg break-all px-4">
                  {uploadedFile.name}
                </p>
                <p className="text-sm text-indigo-600/70 dark:text-indigo-400 mt-1">Ready to analyze</p>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setUploadedFile(null);
                    setSelectedResumeId(null);
                    setUploadError(null);
                  }}
                  className="mt-4 text-xs font-medium text-slate-400 hover:text-red-500 transition-colors z-20"
                >
                  Remove file
                </button>
              </motion.div>
            ) : (
              <div className="relative z-10 flex flex-col items-center">
                <div className="w-14 h-14 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-400 mb-4 group-hover:scale-110 group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-all duration-300">
                  <Upload className="w-7 h-7" />
                </div>
                <p className="font-medium text-slate-700 dark:text-slate-200 text-lg">Click to upload</p>
                <p className="text-sm text-slate-400 mt-2">or drag & drop PDF only</p>
                <p className="text-xs text-slate-400 mt-1">⚠️ AI 面试官仅支持 PDF 格式</p>
              </div>
            )}
          </motion.div>
        </div>
      </div>

      {/* Sticky Footer */}
      <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <button
          onClick={handleSkipToTopics}
          className="text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white font-medium text-sm px-4 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          跳过，直接选话题
        </button>
        <button
          onClick={handleNextStep}
          disabled={!isStep1Valid}
          className={`px-8 py-3 rounded-xl font-bold text-white shadow-lg transition-all flex items-center gap-2 ${
            isStep1Valid
              ? 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-500/30 hover:scale-105 active:scale-95'
              : 'bg-slate-300 dark:bg-slate-700 cursor-not-allowed opacity-70'
          }`}
        >
          下一步 <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="flex flex-col h-full">
      {/* Header with Back Button */}
      <div className="flex items-center justify-between mb-6">
        <button 
          onClick={() => setStep(1)}
          className="p-2 -ml-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-300">
          {hasResume ? <FileText className="w-3 h-3" /> : <Cpu className="w-3 h-3" />}
          {hasResume ? 'Resume Mode' : 'Topic Mode'}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-6">
        {/* 🆕 Phase 3: Bento Grid - AI 深度剖析卡片 (Resume Mode Only) */}
        {hasResume && extractedData && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-500" />
              AI 深度剖析
            </h3>

            {/* Bento Grid Layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* 左上块：个人信息概览 */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="p-5 rounded-2xl bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 border border-indigo-100 dark:border-indigo-900/50"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-900/50">
                    <User className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300">个人信息</h4>
                </div>
                <div className="space-y-2">
                  <p className="text-lg font-bold text-slate-900 dark:text-white">
                    {extractedData.personalInfo.name}
                  </p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {extractedData.personalInfo.role}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-500">
                    {extractedData.personalInfo.yearsOfExperience} 年经验
                  </p>
                </div>
              </motion.div>

              {/* 右上块：简历核心亮点 */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="p-5 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border border-amber-100 dark:border-amber-900/50"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/50">
                    <Lightbulb className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  </div>
                  <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300">核心亮点</h4>
                </div>
                <ul className="space-y-2">
                  {extractedData.highlights.slice(0, 3).map((highlight, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300">
                      <span className="text-amber-500 mt-0.5">•</span>
                      <span className="flex-1">{highlight}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            </div>

            {/* 横向主块：核心知识点 (可编辑) */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="p-5 rounded-2xl bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-900/50">
                  <Target className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                </div>
                <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300">核心知识点</h4>
                <span className="text-xs text-slate-400">(可编辑)</span>
              </div>

              {/* 知识点标签列表 */}
              <div className="flex flex-wrap gap-2">
                {customKnowledgePoints.length === 0 && !isAddingKnowledge && (
                  <p className="text-sm text-slate-400 dark:text-slate-500 italic w-full py-2">
                    暂无知识点，点击下方按钮添加自定义考点
                  </p>
                )}
                
                <AnimatePresence mode="popLayout">
                  {customKnowledgePoints.map((point, idx) => (
                    <motion.div
                      key={point}
                      layout
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ type: "spring", stiffness: 300, damping: 25 }}
                      className="group flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-sm font-medium border border-indigo-200 dark:border-indigo-800"
                    >
                      <span>{point}</span>
                      <button
                        onClick={() => {
                          setCustomKnowledgePoints(prev => prev.filter((_, i) => i !== idx));
                        }}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded-full hover:bg-indigo-200 dark:hover:bg-indigo-800"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </motion.div>
                  ))}
                </AnimatePresence>

                {/* 添加考点按钮/输入框 */}
                {isAddingKnowledge ? (
                  <motion.div
                    layout
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex items-center gap-2"
                  >
                    <input
                      type="text"
                      value={newKnowledgeInput}
                      onChange={(e) => setNewKnowledgeInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && newKnowledgeInput.trim()) {
                          const trimmed = newKnowledgeInput.trim();
                          
                          // 🆕 Phase 3: 长度限制
                          if (trimmed.length > KNOWLEDGE_POINT_LIMITS.MAX_LENGTH) {
                            alert(`知识点长度不能超过 ${KNOWLEDGE_POINT_LIMITS.MAX_LENGTH} 个字符`);
                            return;
                          }
                          
                          // 🆕 Phase 3: 去重检查
                          if (customKnowledgePoints.includes(trimmed)) {
                            alert('该知识点已存在');
                            setNewKnowledgeInput('');
                            return;
                          }
                          
                          setCustomKnowledgePoints(prev => [...prev, trimmed]);
                          setNewKnowledgeInput('');
                          setIsAddingKnowledge(false);
                        } else if (e.key === 'Escape') {
                          setNewKnowledgeInput('');
                          setIsAddingKnowledge(false);
                        }
                      }}
                      onBlur={() => {
                        const trimmed = newKnowledgeInput.trim();
                        if (trimmed) {
                          // 🆕 Phase 3: 长度限制
                          if (trimmed.length > KNOWLEDGE_POINT_LIMITS.MAX_LENGTH) {
                            alert(`知识点长度不能超过 ${KNOWLEDGE_POINT_LIMITS.MAX_LENGTH} 个字符`);
                            setNewKnowledgeInput('');
                            setIsAddingKnowledge(false);
                            return;
                          }
                          
                          // 🆕 Phase 3: 去重检查
                          if (!customKnowledgePoints.includes(trimmed)) {
                            setCustomKnowledgePoints(prev => [...prev, trimmed]);
                          }
                        }
                        setNewKnowledgeInput('');
                        setIsAddingKnowledge(false);
                      }}
                      autoFocus
                      placeholder="输入考点..."
                      maxLength={KNOWLEDGE_POINT_LIMITS.MAX_LENGTH}
                      className="px-3 py-1.5 rounded-full border-2 border-dashed border-indigo-300 dark:border-indigo-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-500 min-w-[150px]"
                    />
                  </motion.div>
                ) : (
                  <motion.button
                    layout
                    onClick={() => {
                      // 🆕 Phase 3: 数量限制
                      if (customKnowledgePoints.length >= KNOWLEDGE_POINT_LIMITS.MAX_COUNT) {
                        alert(`最多添加 ${KNOWLEDGE_POINT_LIMITS.MAX_COUNT} 个知识点`);
                        return;
                      }
                      setIsAddingKnowledge(true);
                    }}
                    disabled={customKnowledgePoints.length >= KNOWLEDGE_POINT_LIMITS.MAX_COUNT}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border-2 border-dashed text-sm font-medium transition-colors ${
                      customKnowledgePoints.length >= KNOWLEDGE_POINT_LIMITS.MAX_COUNT
                        ? 'border-slate-200 dark:border-slate-800 text-slate-300 dark:text-slate-700 cursor-not-allowed'
                        : 'border-slate-300 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-indigo-400 dark:hover:border-indigo-600 hover:text-indigo-600 dark:hover:text-indigo-400'
                    }`}
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>添加考点</span>
                    {customKnowledgePoints.length >= KNOWLEDGE_POINT_LIMITS.MAX_COUNT && (
                      <span className="text-xs">({customKnowledgePoints.length}/{KNOWLEDGE_POINT_LIMITS.MAX_COUNT})</span>
                    )}
                  </motion.button>
                )}
              </div>
            </motion.div>
          </div>
        )}

        {/* Topic Blind Test (Only if NO resume) */}
        {!hasResume && (
          <div className="space-y-4">
            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between group">
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                  <Lock className="w-3 h-3" /> Target Role
                </label>
                <div className="flex items-center gap-2 text-slate-900 dark:text-slate-100 font-semibold text-lg">
                  <Code className="w-5 h-5 text-indigo-500" />
                  {userRole}
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-500" />
                专项话题盲测 (多选)
              </label>
              <div className="flex flex-wrap gap-2">
                {TOPICS.map((topic) => {
                  const isSelected = selectedTopics.includes(topic);
                  return (
                    <motion.button
                      key={topic}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        setSelectedTopics(prev => 
                          isSelected ? prev.filter(t => t !== topic) : [...prev, topic]
                        );
                      }}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-all border ${
                        isSelected
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-500/30'
                          : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-500 hover:bg-slate-50 dark:hover:bg-slate-700'
                      }`}
                    >
                      {topic}
                    </motion.button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Difficulty Selection (Always Shown) */}
        <div className="space-y-3">
          <label className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-indigo-500" />
            选择面试难度
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {DIFFICULTIES.map((diff) => {
              const isSelected = selectedDifficulty === diff.id;
              return (
                <motion.div
                  key={diff.id}
                  onClick={() => setSelectedDifficulty(diff.id)}
                  whileTap={{ scale: 0.98 }}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all relative overflow-hidden ${
                    isSelected
                      ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20'
                      : 'border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-800/50 hover:border-indigo-200 dark:hover:border-indigo-800'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1 relative z-10">
                    <span className={`font-semibold ${isSelected ? 'text-indigo-700 dark:text-indigo-300' : 'text-slate-700 dark:text-slate-200'}`}>
                      {diff.label}
                    </span>
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${isSelected ? 'border-indigo-600 bg-indigo-600' : 'border-slate-300 dark:border-slate-600'}`}>
                      {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>
                  </div>
                  <span className="text-xs text-slate-400 relative z-10">{diff.sub}</span>
                  {isSelected && (
                    <motion.div 
                      layoutId="diff-glow"
                      className="absolute inset-0 bg-indigo-500/5 dark:bg-indigo-500/10"
                    />
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Sticky Footer */}
      <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800">
        <button
          onClick={handleStartInterview}
          disabled={!canStart || isLoading}
          className={`w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-3 transition-all duration-300 shadow-xl ${
            canStart && !isLoading
              ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-500/30 hover:scale-[1.02] active:scale-[0.98]'
              : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed'
          }`}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-6 h-6 animate-spin" />
              <span>正在初始化专属 AI 面试官...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              <span>🚀 确认知识点，开始定制化面试</span>
            </>
          )}
        </button>
      </div>
    </div>
  );

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
            className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4"
          >
            {/* Modal Container */}
            <motion.div
              layout
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ 
                layout: { duration: 0.3, type: "spring", stiffness: 300, damping: 30 },
                opacity: { duration: 0.2 }
              }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-4xl h-[600px] overflow-hidden relative flex flex-col"
            >
              {/* Close Button */}
              <div className="absolute top-4 right-4 z-50">
                <button 
                  onClick={onClose}
                  disabled={isLoading}
                  className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-colors disabled:opacity-50"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Progress Bar */}
              <div className="absolute top-0 left-0 w-full h-1 bg-slate-100 dark:bg-slate-800">
                <motion.div 
                  className="h-full bg-indigo-600"
                  initial={{ width: "50%" }}
                  animate={{ 
                    width: step === 1 ? "50%" : step === 'extracting' ? "75%" : "100%" 
                  }}
                  transition={{ duration: 0.5, ease: "easeInOut" }}
                />
              </div>

              {/* Content Area */}
              <div className="flex-1 p-8 pt-10 overflow-hidden">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={step}
                    initial={{ x: typeof step === 'number' && step === 2 ? 50 : -50, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: typeof step === 'number' && step === 2 ? -50 : 50, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    className="h-full"
                  >
                    {step === 1 ? renderStep1() : step === 'extracting' ? renderExtracting() : renderStep2()}
                  </motion.div>
                </AnimatePresence>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
