/**
 * 文档库控制器
 * 聚合查询 Resume 和 InterviewSession
 */
import { Controller, Get, UseGuards } from '@nestjs/common';
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
   * 
   * 返回统一格式的文档列表，包含：
   * - 简历（原始 + AI 优化后）
   * - 面试报告
   */
  @Get()
  async getDocuments(@CurrentUser('id') userId: string) {
    const documents = await this.documentService.getUserDocuments(userId);

    return {
      data: documents,
    };
  }
}
