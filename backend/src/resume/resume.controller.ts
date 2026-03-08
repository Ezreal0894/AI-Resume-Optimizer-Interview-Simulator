/**
 * 简历控制器
 * 🔄 v2.0：10MB 复合上传、防重复提交、高阶 ATS 分析
 */
import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Patch,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { ResumeService } from './resume.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRateLimitGuard } from '../common/guards/rate-limit.guard';

// 上传配置：10MB
const UPLOAD_CONFIG = {
  MAX_FILE_SIZE: 10 * 1024 * 1024,
  ALLOWED_MIMES: [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ],
};

@Controller('resume')
@UseGuards(JwtAuthGuard)
export class ResumeController {
  constructor(private readonly resumeService: ResumeService) {}

  /**
   * 🆕 Phase 3: 白盒化简历深度解析接口（增强版）
   * POST /api/resume/extract
   * 
   * 功能：提取个人信息、亮点、知识点（Structured Output）
   * 
   * 🔧 支持两种模式：
   * 1. 新文件上传：multipart/form-data with file
   * 2. 历史简历：application/json with resumeId
   * 
   * 返回：{ personalInfo, highlights, knowledgePoints, resumeId }
   */
  @Post('extract')
  @UseGuards(UserRateLimitGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: {
        fileSize: UPLOAD_CONFIG.MAX_FILE_SIZE,
        files: 1,
      },
      fileFilter: (req, file, callback) => {
        if (!file) {
          // 允许没有文件（历史简历模式）
          callback(null, true);
          return;
        }
        if (!UPLOAD_CONFIG.ALLOWED_MIMES.includes(file.mimetype)) {
          callback(new BadRequestException('仅支持 PDF 和 DOCX 格式'), false);
          return;
        }
        if (/[<>:"/\\|?*\x00-\x1f]/.test(file.originalname)) {
          callback(new BadRequestException('文件名包含非法字符'), false);
          return;
        }
        callback(null, true);
      },
    }),
  )
  async extractResume(
    @UploadedFile() file: Express.Multer.File,
    @Body('targetRole') targetRole: string,
    @Body('resumeId') resumeId: string, // 🆕 历史简历 ID（可选）
    @CurrentUser('id') userId: string,
  ) {
    // 验证：必须提供文件或 resumeId
    if (!file && !resumeId) {
      throw new BadRequestException('请上传简历文件或提供简历 ID');
    }

    if (!targetRole || targetRole.trim().length === 0) {
      throw new BadRequestException('请填写目标职位');
    }

    const result = await this.resumeService.extractResumeStructured(
      file || null,
      userId,
      targetRole.trim(),
      resumeId,
    );

    return {
      message: '简历解析完成',
      data: result,
    };
  }

  /**
   * 🔄 复合上传并分析简历（高阶 ATS 结构）
   * POST /api/resume/analyze
   * Content-Type: multipart/form-data
   *
   * 字段：
   * - file: 简历文件 (PDF/DOCX, 最大 10MB)
   * - targetRole: 目标职位名称 (必填)
   * - targetJd: JD 长文本 (可选)
   */
  @Post('analyze')
  @UseGuards(UserRateLimitGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: {
        fileSize: UPLOAD_CONFIG.MAX_FILE_SIZE,
        files: 1,
      },
      fileFilter: (req, file, callback) => {
        if (!UPLOAD_CONFIG.ALLOWED_MIMES.includes(file.mimetype)) {
          callback(new BadRequestException('仅支持 PDF 和 DOCX 格式'), false);
          return;
        }
        if (/[<>:"/\\|?*\x00-\x1f]/.test(file.originalname)) {
          callback(new BadRequestException('文件名包含非法字符'), false);
          return;
        }
        callback(null, true);
      },
    }),
  )
  async analyzeResume(
    @UploadedFile() file: Express.Multer.File,
    @Body('targetRole') targetRole: string,
    @Body('targetJd') targetJd: string,
    @CurrentUser('id') userId: string,
  ) {
    if (!file) {
      throw new BadRequestException('请上传简历文件');
    }

    if (!targetRole || targetRole.trim().length === 0) {
      throw new BadRequestException('请填写目标职位');
    }

    const result = await this.resumeService.analyzeResume(
      file,
      userId,
      targetRole.trim(),
      targetJd?.trim(),
    );

    return {
      message: '简历分析完成',
      data: result,
    };
  }

  /**
   * 兼容旧接口：简单上传
   * POST /api/resume/upload
   * @deprecated 请使用 /api/resume/analyze
   */
  @Post('upload')
  @UseGuards(UserRateLimitGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: UPLOAD_CONFIG.MAX_FILE_SIZE, files: 1 },
      fileFilter: (req, file, callback) => {
        if (!UPLOAD_CONFIG.ALLOWED_MIMES.includes(file.mimetype)) {
          callback(new BadRequestException('仅支持 PDF 和 DOCX 格式'), false);
          return;
        }
        callback(null, true);
      },
    }),
  )
  async uploadResume(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser('id') userId: string,
  ) {
    if (!file) {
      throw new BadRequestException('请上传简历文件');
    }

    const result = await this.resumeService.analyzeResume(
      file,
      userId,
      '通用职位',
      undefined,
    );

    return {
      message: '简历分析完成',
      data: result,
    };
  }

  /**
   * 获取用户简历列表
   * GET /api/resume/list
   */
  @Get('list')
  async getResumeList(@CurrentUser('id') userId: string) {
    const resumes = await this.resumeService.getUserResumes(userId);
    return { data: resumes };
  }

  /**
   * 获取简历详情
   * GET /api/resume/:id
   */
  @Get(':id')
  async getResumeDetail(
    @Param('id') resumeId: string,
    @CurrentUser('id') userId: string,
  ) {
    const resume = await this.resumeService.getResumeDetail(resumeId, userId);
    return { data: resume };
  }

  /**
   * 切换简历置顶状态
   * PATCH /api/resume/:id/pin
   */
  @Patch(':id/pin')
  async togglePin(
    @Param('id') resumeId: string,
    @CurrentUser('id') userId: string,
  ) {
    const resume = await this.resumeService.togglePin(resumeId, userId);
    return { data: resume };
  }
}
