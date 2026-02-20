/**
 * 简历控制器
 * 🛡️ 防御性重构：处理简历上传、查询接口（带并发限制）
 */
import {
  Controller,
  Post,
  Get,
  Param,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { ResumeService } from './resume.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

// 🛡️ 并发上传限制
const UPLOAD_CONFIG = {
  MAX_FILE_SIZE: 5 * 1024 * 1024,  // 5MB
  MAX_CONCURRENT_UPLOADS: 10,      // 最大并发上传数
  ALLOWED_MIMES: [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ],
};

// 简单的并发计数器（生产环境应使用 Redis）
let currentUploads = 0;

@Controller('resume')
@UseGuards(JwtAuthGuard)  // 所有接口都需要认证
export class ResumeController {
  constructor(private readonly resumeService: ResumeService) {}

  /**
   * 上传并分析简历
   * POST /api/resume/upload
   * 
   * 🛡️ 使用 Multer memory storage，文件不落盘，带并发限制
   */
  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),  // 内存存储，不写入磁盘
      limits: {
        fileSize: UPLOAD_CONFIG.MAX_FILE_SIZE,
        files: 1,  // 🛡️ 限制单次只能上传一个文件
      },
      fileFilter: (req, file, callback) => {
        // 🛡️ 严格的文件类型过滤
        if (!UPLOAD_CONFIG.ALLOWED_MIMES.includes(file.mimetype)) {
          callback(new BadRequestException('仅支持 PDF 和 DOCX 格式'), false);
          return;
        }
        
        // 🛡️ 检查文件名是否包含恶意字符
        if (/[<>:"/\\|?*\x00-\x1f]/.test(file.originalname)) {
          callback(new BadRequestException('文件名包含非法字符'), false);
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
    // 🛡️ 并发限制检查
    if (currentUploads >= UPLOAD_CONFIG.MAX_CONCURRENT_UPLOADS) {
      throw new BadRequestException('服务器繁忙，请稍后重试');
    }
    
    currentUploads++;
    
    try {
      const result = await this.resumeService.uploadAndAnalyze(file, userId);
      
      return {
        message: '简历分析完成',
        data: result,
      };
    } finally {
      // 🛡️ 确保计数器递减
      currentUploads--;
    }
  }

  /**
   * 获取用户简历列表
   * GET /api/resume/list
   */
  @Get('list')
  async getResumeList(@CurrentUser('id') userId: string) {
    const resumes = await this.resumeService.getUserResumes(userId);
    
    return {
      data: resumes,
    };
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
    
    return {
      data: resume,
    };
  }
}
