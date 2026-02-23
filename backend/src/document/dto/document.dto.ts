/**
 * 文档库 DTO
 * 聚合 Resume 和 InterviewSession 的统一数据结构
 */

/**
 * 文档类型
 */
export type DocumentType = 'resume' | 'optimized' | 'report';

/**
 * 文档标签
 */
export interface DocumentTag {
  label: string;
  color: 'indigo' | 'emerald' | 'amber' | 'slate';
}

/**
 * 统一文档结构（前端契约）
 */
export interface DocumentItem {
  id: string;
  title: string;
  type: DocumentType;
  fileType: 'pdf' | 'docx' | 'report';
  size: string;
  date: string;
  tags: DocumentTag[];
  isPinned: boolean;
  /** 原始记录 ID（用于跳转详情） */
  sourceId: string;
  /** 原始记录类型 */
  sourceType: 'resume' | 'interview';
  /** 文档所有者名称 */
  ownerName?: string;
  /** AI 生成的摘要 */
  aiSummary?: string;
  /** 文档原始文本内容 */
  rawContent?: string;
}
