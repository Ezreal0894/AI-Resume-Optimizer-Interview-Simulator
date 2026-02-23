/**
 * 文档库控制器
 * 聚合查询 Resume 和 InterviewSession
 */
import { Controller, Get, Delete, Patch, Param, Query, UseGuards } from '@nestjs/common';
import { DocumentService } from './document.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('documents')
@UseGuards(JwtAuthGuard)
export class DocumentController {
  constructor(private readonly documentService: DocumentService) {}

  /**
   * 获取用户文档库（聚合查询）
   * GET /api/documents
   * Query: category (all | resume | optimized | report)
   * 
   * 返回统一格式的文档列表，包含：
   * - 简历（原始 + AI 优化后）
   * - 面试报告
   */
  @Get()
  async getDocuments(
    @CurrentUser('id') userId: string,
    @Query('category') category?: string,
  ) {
    const documents = await this.documentService.getUserDocuments(userId, category);

    return {
      data: documents,
    };
  }

  /**
   * 删除文档
   * DELETE /api/documents/:id
   * id 格式: resume-{resumeId} 或 interview-{sessionId}
   */
  @Delete(':id')
  async deleteDocument(
    @Param('id') documentId: string,
    @CurrentUser('id') userId: string,
  ) {
    await this.documentService.deleteDocument(documentId, userId);
    return { message: '文档已删除' };
  }

  /**
   * 切换文档置顶状态
   * PATCH /api/documents/:id/pin
   * id 格式: resume-{resumeId} 或 interview-{sessionId}
   */
  @Patch(':id/pin')
  async togglePin(
    @Param('id') documentId: string,
    @CurrentUser('id') userId: string,
  ) {
    const result = await this.documentService.toggleDocumentPin(documentId, userId);
    return { data: result };
  }
}
