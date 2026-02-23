/**
 * 文档库服务
 * 聚合查询 Resume 和 InterviewSession
 * 
 * ⚠️ 注意：运行此代码前需要先执行数据库迁移并重新生成 Prisma Client：
 * npx prisma migrate dev
 * npx prisma generate
 */
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DocumentItem, DocumentTag, DocumentType } from './dto/document.dto';

@Injectable()
export class DocumentService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 获取用户文档库（聚合查询）
   * GET /api/documents
   * @param category 可选分类筛选: all | resume | optimized | report
   */
  async getUserDocuments(userId: string, category?: string): Promise<DocumentItem[]> {
    // 并行查询简历、面试会话和用户信息
    const [resumes, interviews, user] = await Promise.all([
      this.prisma.resume.findMany({
        where: { userId },
        select: {
          id: true,
          fileName: true,
          fileSize: true,
          mimeType: true,
          targetRole: true,
          status: true,
          isPinned: true,
          analysisReport: true,
          rawContent: true,
          createdAt: true,
        },
        orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
      }),
      this.prisma.interviewSession.findMany({
        where: { userId, status: 'COMPLETED' },
        select: {
          id: true,
          jobTitle: true,
          difficulty: true,
          isPinned: true,
          metrics: true,
          createdAt: true,
        },
        orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
      }),
      this.prisma.user.findUnique({
        where: { id: userId },
        select: { name: true, email: true },
      }),
    ]);

    // 获取用户显示名称
    const ownerName = user?.name || user?.email?.split('@')[0] || 'You';

    // 转换简历为文档格式
    const resumeDocs: DocumentItem[] = resumes.map((resume) => {
      const tags = this.generateResumeTags(resume);
      const isOptimized = resume.status === 'COMPLETED' && resume.analysisReport;
      const report = resume.analysisReport as any;

      // 生成 AI 摘要
      let aiSummary: string | undefined;
      if (report) {
        if (report.summary) {
          aiSummary = report.summary;
        } else if (report.overallScore) {
          aiSummary = `Resume analysis complete. Overall match score: ${report.overallScore}%. ${report.strengths?.length ? `Key strengths: ${report.strengths.slice(0, 2).join(', ')}.` : ''}`;
        }
      }

      return {
        id: `resume-${resume.id}`,
        title: resume.fileName,
        type: isOptimized ? 'optimized' : 'resume',
        fileType: resume.mimeType.includes('pdf') ? 'pdf' : 'docx',
        size: this.formatFileSize(resume.fileSize),
        date: this.formatDate(resume.createdAt),
        tags,
        isPinned: resume.isPinned,
        sourceId: resume.id,
        sourceType: 'resume',
        ownerName,
        aiSummary,
        rawContent: resume.rawContent,
      };
    });

    // 转换面试会话为文档格式
    const interviewDocs: DocumentItem[] = interviews.map((interview) => {
      const tags = this.generateInterviewTags(interview);
      const metrics = interview.metrics as any;

      // 生成 AI 摘要
      let aiSummary: string | undefined;
      if (metrics) {
        if (metrics.summary) {
          aiSummary = metrics.summary;
        } else if (metrics.overallScore) {
          aiSummary = `Interview performance score: ${metrics.overallScore}%. ${metrics.feedback ? metrics.feedback : ''}`;
        }
      }

      return {
        id: `interview-${interview.id}`,
        title: `${interview.jobTitle} 面试报告`,
        type: 'report',
        fileType: 'report',
        size: '-',
        date: this.formatDate(interview.createdAt),
        tags,
        isPinned: interview.isPinned,
        sourceId: interview.id,
        sourceType: 'interview',
        ownerName,
        aiSummary,
      };
    });

    // 合并并按置顶和时间排序
    let allDocs = [...resumeDocs, ...interviewDocs];
    
    // 分类筛选
    if (category && category !== 'all') {
      allDocs = allDocs.filter(doc => doc.type === category);
    }
    
    return allDocs.sort((a, b) => {
      // 置顶优先
      if (a.isPinned !== b.isPinned) {
        return a.isPinned ? -1 : 1;
      }
      // 时间倒序（简单比较日期字符串）
      return 0; // 已在各自查询中排序
    });
  }

  /**
   * 删除文档
   * @param documentId 格式: resume-{id} 或 interview-{id}
   */
  async deleteDocument(documentId: string, userId: string): Promise<void> {
    const { sourceType, sourceId } = this.parseDocumentId(documentId);

    if (sourceType === 'resume') {
      const resume = await this.prisma.resume.findFirst({
        where: { id: sourceId, userId },
      });
      if (!resume) {
        throw new NotFoundException('文档不存在');
      }
      await this.prisma.resume.delete({ where: { id: sourceId } });
    } else if (sourceType === 'interview') {
      const session = await this.prisma.interviewSession.findFirst({
        where: { id: sourceId, userId },
      });
      if (!session) {
        throw new NotFoundException('文档不存在');
      }
      await this.prisma.interviewSession.delete({ where: { id: sourceId } });
    } else {
      throw new BadRequestException('无效的文档 ID 格式');
    }
  }

  /**
   * 切换文档置顶状态
   * @param documentId 格式: resume-{id} 或 interview-{id}
   */
  async toggleDocumentPin(documentId: string, userId: string): Promise<{ id: string; isPinned: boolean }> {
    const { sourceType, sourceId } = this.parseDocumentId(documentId);

    if (sourceType === 'resume') {
      const resume = await this.prisma.resume.findFirst({
        where: { id: sourceId, userId },
      });
      if (!resume) {
        throw new NotFoundException('文档不存在');
      }
      const updated = await this.prisma.resume.update({
        where: { id: sourceId },
        data: { isPinned: !resume.isPinned },
        select: { id: true, isPinned: true },
      });
      return { id: documentId, isPinned: updated.isPinned };
    } else if (sourceType === 'interview') {
      const session = await this.prisma.interviewSession.findFirst({
        where: { id: sourceId, userId },
      });
      if (!session) {
        throw new NotFoundException('文档不存在');
      }
      const updated = await this.prisma.interviewSession.update({
        where: { id: sourceId },
        data: { isPinned: !session.isPinned },
        select: { id: true, isPinned: true },
      });
      return { id: documentId, isPinned: updated.isPinned };
    } else {
      throw new BadRequestException('无效的文档 ID 格式');
    }
  }

  /**
   * 解析文档 ID
   */
  private parseDocumentId(documentId: string): { sourceType: 'resume' | 'interview'; sourceId: string } {
    if (documentId.startsWith('resume-')) {
      return { sourceType: 'resume', sourceId: documentId.replace('resume-', '') };
    } else if (documentId.startsWith('interview-')) {
      return { sourceType: 'interview', sourceId: documentId.replace('interview-', '') };
    }
    throw new BadRequestException('无效的文档 ID 格式，应为 resume-{id} 或 interview-{id}');
  }

  /**
   * 生成简历标签
   */
  private generateResumeTags(resume: any): DocumentTag[] {
    const tags: DocumentTag[] = [];

    if (resume.status === 'COMPLETED') {
      const report = resume.analysisReport as any;
      if (report?.overallScore >= 85) {
        tags.push({ label: 'ATS Ready', color: 'emerald' });
      }
      if (report?.overallScore) {
        tags.push({ label: `Match ${report.overallScore}%`, color: 'indigo' });
      }
    } else if (resume.status === 'ANALYZING') {
      tags.push({ label: 'Analyzing', color: 'amber' });
    } else if (resume.status === 'FAILED') {
      tags.push({ label: 'Failed', color: 'slate' });
    } else {
      tags.push({ label: 'Original', color: 'slate' });
    }

    if (resume.targetRole) {
      tags.push({ label: resume.targetRole, color: 'indigo' });
    }

    return tags.slice(0, 3);
  }

  /**
   * 生成面试标签
   */
  private generateInterviewTags(interview: any): DocumentTag[] {
    const tags: DocumentTag[] = [];
    const metrics = interview.metrics as any;

    if (metrics?.overallScore >= 85) {
      tags.push({ label: 'Excellent', color: 'emerald' });
    } else if (metrics?.overallScore >= 70) {
      tags.push({ label: 'Good', color: 'indigo' });
    } else if (metrics?.overallScore) {
      tags.push({ label: 'Needs Work', color: 'amber' });
    }

    // 难度标签
    const difficultyMap: Record<string, DocumentTag> = {
      EASY: { label: 'Easy', color: 'slate' },
      MEDIUM: { label: 'Medium', color: 'indigo' },
      HARD: { label: 'Hard', color: 'amber' },
      EXPERT: { label: 'Expert', color: 'emerald' },
    };
    
    if (interview.difficulty && difficultyMap[interview.difficulty]) {
      tags.push(difficultyMap[interview.difficulty]);
    }

    return tags.slice(0, 3);
  }

  /**
   * 格式化文件大小
   */
  private formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  }

  /**
   * 格式化日期
   */
  private formatDate(date: Date): string {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      const hours = Math.floor(diff / (1000 * 60 * 60));
      if (hours === 0) return 'Just now';
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    }
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  }
}
