/**
 * 能力报告页面
 * 使用新 UI 视图组件
 * 
 * 支持两种模式：
 * 1. 查看当前面试报告：/dashboard/report（使用 store 中的 sessionId）
 * 2. 查看历史面试报告：/dashboard/report/:sessionId（使用 URL 参数）
 */
import { useParams } from 'react-router-dom';
import ReportView from '../views/ReportView';

export default function ReportPage() {
  const { sessionId } = useParams<{ sessionId?: string }>();
  
  return <ReportView sessionIdFromUrl={sessionId} />;
}
