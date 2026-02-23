/**
 * 文档库 API
 */
import apiClient from './client';

export interface DocumentTag {
  label: string;
  color: 'indigo' | 'emerald' | 'amber' | 'slate';
}

export interface Document {
  id: string;
  title: string;
  type: 'resume' | 'optimized' | 'report';
  fileType: 'pdf' | 'docx' | 'report';
  size: string;
  date: string;
  tags: DocumentTag[];
  isPinned: boolean;
  sourceId: string;
  sourceType: 'resume' | 'interview';
  ownerName?: string;
  aiSummary?: string;
  rawContent?: string;
}

/**
 * 获取文档列表
 */
export async function getDocuments(category?: string): Promise<Document[]> {
  const params = category && category !== 'all' ? { category } : {};
  const response = await apiClient.get<{ data: Document[] }>('/documents', { params });
  return response.data.data;
}

/**
 * 删除文档
 */
export async function deleteDocument(id: string): Promise<void> {
  await apiClient.delete(`/documents/${id}`);
}

/**
 * 切换文档置顶状态
 */
export async function toggleDocumentPin(id: string): Promise<{ id: string; isPinned: boolean }> {
  const response = await apiClient.patch<{ data: { id: string; isPinned: boolean } }>(`/documents/${id}/pin`);
  return response.data.data;
}

/**
 * 上传文档（简历）
 * @param file 文件
 * @param targetRole 目标职位（可选，默认"通用职位"）
 */
export async function uploadDocument(file: File, targetRole?: string): Promise<any> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('targetRole', targetRole || '通用职位');
  
  const response = await apiClient.post('/resume/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
}
