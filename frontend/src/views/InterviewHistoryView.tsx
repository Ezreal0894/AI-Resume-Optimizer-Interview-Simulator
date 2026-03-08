/**
 * 面试历史列表页面
 * 展示所有历史面试会话
 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Clock, 
  Loader2, 
  Pin,
  PinOff,
  ChevronRight,
  Calendar,
  Award,
  AlertCircle,
  Trash2,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { interviewApi, InterviewSession } from '../api/interview';
import { useInterviewStore } from '../stores/interviewStore';

const InterviewHistoryView: React.FC = () => {
  const navigate = useNavigate();
  const { setSession } = useInterviewStore();
  const [sessions, setSessions] = useState<InterviewSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; sessionId: string | null; sessionTitle: string }>({
    isOpen: false,
    sessionId: null,
    sessionTitle: ''
  });
  const [isDeleting, setIsDeleting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // 获取会话列表
  useEffect(() => {
    const fetchSessions = async () => {
      try {
        setIsLoading(true);
        const response = await interviewApi.getSessions();
        setSessions(response.data.data || []);
        setError(null);
      } catch (err: any) {
        console.error('Failed to fetch sessions:', err);
        setError(err.response?.data?.message || '加载失败');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSessions();
  }, []);

  // 切换置顶
  const handleTogglePin = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await interviewApi.togglePin(sessionId);
      // 更新本地状态
      setSessions(prev => 
        prev.map(s => 
          s.id === sessionId ? { ...s, isPinned: !s.isPinned } : s
        ).sort((a, b) => {
          if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
          return new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime();
        })
      );
    } catch (err) {
      console.error('Failed to toggle pin:', err);
    }
  };

  // 打开删除确认弹窗
  const handleDeleteClick = (session: InterviewSession, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteConfirm({
      isOpen: true,
      sessionId: session.id,
      sessionTitle: session.jobTitle
    });
  };

  // 确认删除
  const handleConfirmDelete = async () => {
    if (!deleteConfirm.sessionId) return;

    setIsDeleting(true);
    try {
      await interviewApi.deleteSession(deleteConfirm.sessionId);
      
      // 从列表中移除
      setSessions(prev => prev.filter(s => s.id !== deleteConfirm.sessionId));
      
      // 显示成功提示
      setToast({ message: '面试记录已删除', type: 'success' });
      setTimeout(() => setToast(null), 3000);
      
      // 关闭弹窗
      setDeleteConfirm({ isOpen: false, sessionId: null, sessionTitle: '' });
    } catch (err: any) {
      console.error('Failed to delete session:', err);
      setToast({ 
        message: err.response?.data?.message || '删除失败，请重试', 
        type: 'error' 
      });
      setTimeout(() => setToast(null), 3000);
    } finally {
      setIsDeleting(false);
    }
  };

  // 取消删除
  const handleCancelDelete = () => {
    setDeleteConfirm({ isOpen: false, sessionId: null, sessionTitle: '' });
  };

  // 查看报告
  const handleViewReport = (session: InterviewSession) => {
    if (session.status === 'COMPLETED' && session.metrics) {
      // 跳转到带 sessionId 参数的报告页面
      navigate(`/dashboard/report/${session.id}`);
    }
  };

  // 格式化时间
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // 格式化时长
  const formatDuration = (start: string, end?: string) => {
    if (!end) return '进行中';
    const duration = new Date(end).getTime() - new Date(start).getTime();
    const minutes = Math.floor(duration / 60000);
    return `${minutes} 分钟`;
  };

  // 获取状态标签
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold">已完成</span>;
      case 'IN_PROGRESS':
        return <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-bold">进行中</span>;
      case 'CANCELLED':
        return <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-bold">已取消</span>;
      default:
        return null;
    }
  };

  // 获取难度标签
  const getDifficultyBadge = (difficulty: string) => {
    const colors = {
      EASY: 'bg-green-100 text-green-700',
      MEDIUM: 'bg-blue-100 text-blue-700',
      HARD: 'bg-orange-100 text-orange-700',
      EXPERT: 'bg-red-100 text-red-700'
    };
    const labels = {
      EASY: 'Junior',
      MEDIUM: 'Mid-Level',
      HARD: 'Senior',
      EXPERT: 'Expert'
    };
    return (
      <span className={`px-2 py-0.5 rounded text-xs font-semibold ${colors[difficulty as keyof typeof colors]}`}>
        {labels[difficulty as keyof typeof labels]}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-indigo-500 animate-spin mx-auto mb-4" />
          <p className="text-slate-600">加载面试历史中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <AlertCircle className="w-16 h-16 text-amber-500 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-slate-900 mb-2">加载失败</h3>
          <p className="text-slate-600 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors"
          >
            重试
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto h-full overflow-y-auto relative z-10 pb-24 md:pb-8">
      {/* Ambient Background */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-[10%] right-[10%] w-[400px] h-[400px] rounded-full bg-indigo-500/10 blur-[100px]" />
        <div className="absolute bottom-[20%] left-[10%] w-[300px] h-[300px] rounded-full bg-emerald-500/10 blur-[80px]" />
      </div>

      {/* Header */}
      <div className="mb-6 md:mb-8 pt-safe md:pt-0">
        <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2 tracking-tight">Interview History</h2>
        <p className="text-base md:text-lg text-slate-500">Review your past mock interview sessions and track your progress.</p>
      </div>

      {/* Sessions List */}
      {sessions.length === 0 ? (
        <div className="bg-white/60 backdrop-blur-2xl rounded-3xl border border-white/40 shadow-xl p-12 text-center">
          <Calendar className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-slate-900 mb-2">暂无面试记录</h3>
          <p className="text-slate-500 mb-6">开始你的第一次模拟面试吧！</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors"
          >
            开始面试
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {sessions.map((session) => {
            const metrics = session.metrics as any;
            const overallScore = metrics?.overallScore || 0;

            return (
              <motion.div
                key={session.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ scale: 1.01, y: -2 }}
                onClick={() => handleViewReport(session)}
                className={`bg-white/60 backdrop-blur-2xl rounded-2xl border border-white/40 shadow-lg hover:shadow-xl transition-all cursor-pointer overflow-hidden ${
                  session.status !== 'COMPLETED' ? 'opacity-75' : ''
                }`}
              >
                <div className="p-5 md:p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg md:text-xl font-bold text-slate-900">{session.jobTitle}</h3>
                        {session.isPinned && (
                          <Pin className="w-4 h-4 text-indigo-600 fill-indigo-600" />
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {formatDate(session.startedAt)}
                        </div>
                        <span>•</span>
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {formatDuration(session.startedAt, session.endedAt)}
                        </div>
                        <span>•</span>
                        {getDifficultyBadge(session.difficulty)}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => handleTogglePin(session.id, e)}
                        className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                        title={session.isPinned ? '取消置顶' : '置顶'}
                      >
                        {session.isPinned ? (
                          <PinOff className="w-5 h-5 text-slate-600" />
                        ) : (
                          <Pin className="w-5 h-5 text-slate-400" />
                        )}
                      </button>
                      <button
                        onClick={(e) => handleDeleteClick(session, e)}
                        className="p-2 hover:bg-red-50 rounded-lg transition-colors group"
                        title="删除"
                      >
                        <Trash2 className="w-5 h-5 text-slate-400 group-hover:text-red-500" />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {getStatusBadge(session.status)}
                      {session.status === 'COMPLETED' && overallScore > 0 && (
                        <div className="flex items-center gap-2">
                          <Award className="w-5 h-5 text-amber-500" />
                          <span className="text-2xl font-bold text-slate-900">{overallScore}</span>
                          <span className="text-sm text-slate-500">/ 100</span>
                        </div>
                      )}
                    </div>
                    {session.status === 'COMPLETED' && (
                      <div className="flex items-center gap-2 text-indigo-600 font-bold text-sm">
                        查看报告 <ChevronRight className="w-4 h-4" />
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* 删除确认弹窗 */}
      <AnimatePresence>
        {deleteConfirm.isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={handleCancelDelete}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
            >
              {/* Header */}
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-xl font-bold text-slate-900">删除面试记录</h3>
                <button
                  onClick={handleCancelDelete}
                  className="p-1 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6">
                <p className="text-slate-600 mb-2">
                  确定要删除「<span className="font-semibold text-slate-900">{deleteConfirm.sessionTitle}</span>」的面试记录吗？
                </p>
                <p className="text-sm text-red-600">此操作不可恢复。</p>
              </div>

              {/* Footer */}
              <div className="p-6 bg-slate-50 flex items-center justify-end gap-3">
                <button
                  onClick={handleCancelDelete}
                  disabled={isDeleting}
                  className="px-6 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl font-medium hover:bg-slate-50 transition-colors disabled:opacity-50"
                >
                  取消
                </button>
                <button
                  onClick={handleConfirmDelete}
                  disabled={isDeleting}
                  className="px-6 py-2.5 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      删除中...
                    </>
                  ) : (
                    '确认删除'
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast 提示 */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-4 right-4 z-50"
          >
            <div className={`px-6 py-3 rounded-xl shadow-lg flex items-center gap-3 ${
              toast.type === 'success' 
                ? 'bg-emerald-500 text-white' 
                : 'bg-red-500 text-white'
            }`}>
              {toast.type === 'success' ? (
                <Award className="w-5 h-5" />
              ) : (
                <AlertCircle className="w-5 h-5" />
              )}
              <span className="font-medium">{toast.message}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default InterviewHistoryView;
