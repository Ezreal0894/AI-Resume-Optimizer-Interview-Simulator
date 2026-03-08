/**
 * 模拟面试页面
 * 使用新 UI 视图组件
 * 
 * 逻辑：
 * - 如果有活跃会话，直接显示 InterviewRoom
 * - 如果没有会话，自动打开 MockInterviewWizardModal
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import InterviewRoom from '../views/InterviewRoom';
import MockInterviewWizardModal from '../components/interview/MockInterviewWizardModal';
import { useInterviewStore } from '../stores/interviewStore';

export default function InterviewPage() {
  const navigate = useNavigate();
  const { sessionId, isActive } = useInterviewStore();
  const [isWizardOpen, setIsWizardOpen] = useState(false);

  // 检查是否有活跃会话
  useEffect(() => {
    if (!sessionId || !isActive) {
      // 没有活跃会话，打开配置向导
      setIsWizardOpen(true);
    }
  }, [sessionId, isActive]);

  // 如果有活跃会话，显示面试间
  if (sessionId && isActive) {
    return <InterviewRoom />;
  }

  // 否则显示弹窗（或空白页面等待弹窗打开）
  return (
    <div className="h-full flex items-center justify-center bg-slate-50 dark:bg-slate-950">
      <MockInterviewWizardModal
        isOpen={isWizardOpen}
        onClose={() => {
          setIsWizardOpen(false);
          // 关闭弹窗后返回 Dashboard
          navigate('/dashboard');
        }}
      />
    </div>
  );
}
