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
 * 上传文档（简历）并分析
 * @param file 文件
 * @param targetRole 目标职位（可选，默认"通用职位"）
 */
export async function uploadDocument(file: File, targetRole?: string): Promise<any> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('targetRole', targetRole || '通用职位');
  
  const response = await apiClient.post('/resume/analyze', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
}

/**
 * 🆕 Phase 2: 提取简历结构化信息（白盒化）
 * 🔧 Phase 3: 支持历史简历提取（通过 resumeId）
 * @param fileOrResumeId 文件或简历 ID
 * @param targetRole 目标职位
 */
export interface ResumeExtractResult {
  resumeId: string;
  personalInfo: {
    name: string;
    role: string;
    yearsOfExperience: number;
  };
  highlights: string[];
  knowledgePoints: string[];
}

export async function extractResume(
  fileOrResumeId: File | string,
  targetRole: string
): Promise<ResumeExtractResult> {
  const formData = new FormData();
  
  // 判断是文件还是 resumeId
  if (typeof fileOrResumeId === 'string') {
    // 历史简历模式：传递 resumeId
    formData.append('resumeId', fileOrResumeId);
  } else {
    // 新文件上传模式：传递 file
    formData.append('file', fileOrResumeId);
  }
  
  formData.append('targetRole', targetRole);
  
  const response = await apiClient.post<{ data: ResumeExtractResult }>('/resume/extract', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data.data;
}
