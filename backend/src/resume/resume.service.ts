/**
 * 简历服务
 * 核心功能：内存解析 PDF、调用 AI 分析、存储结果
 */
import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ChatOpenAI } from '@langchain/openai';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import * as pdfParse from 'pdf-parse';
import { PrismaService } from '../prisma/prisma.service';

// 支持的文件类型
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // docx
];

// 最大文件大小 (5MB)
const MAX_FILE_SIZE = 5 * 1024 * 1024;

// AI 分析结果类型
export interface ResumeAnalysisReport {
  overallScore: number;
  atsCompatibility: {
    score: number;
    suggestions: string[];
  };
  keywordAnalysis: {
    matched: string[];
    missing: string[];
  };
  structureAnalysis: {
    sections: string[];
    improvements: string[];
  };
  contentSuggestions: string[];
  optimizedVersion?: string;
}

@Injectable()
export class ResumeService {
  private llm: ChatOpenAI;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {
    // 初始化 DeepSeek LLM（使用 OpenAI 兼容接口）
    this.llm = new ChatOpenAI({
      modelName: this.config.get<string>('DEEPSEEK_MODEL', 'deepseek-chat'),
      openAIApiKey: this.config.get<string>('DEEPSEEK_API_KEY'),
      configuration: {
        baseURL: this.config.get<string>('DEEPSEEK_BASE_URL', 'https://api.deepseek.com'),
      },
      temperature: 0.3,  // 较低温度保证分析结果稳定
      maxTokens: 4000,
    });
  }

  /**
   * 上传并分析简历
   * @param file Multer 文件对象（内存存储）
   * @param userId 用户 ID
   */
  async uploadAndAnalyze(
    file: Express.Multer.File,
    userId: string,
  ): Promise<{ resume: any; analysis: ResumeAnalysisReport }> {
    // 1. 验证文件
    this.validateFile(file);

    try {
      // 2. 在内存中解析文件内容（不落盘）
      const rawContent = await this.parseFileInMemory(file);

      if (!rawContent || rawContent.trim().length < 50) {
        throw new BadRequestException('无法从文件中提取有效内容，请确保简历包含文字');
      }

      // 3. 创建简历记录（状态：分析中）
      const resume = await this.prisma.resume.create({
        data: {
          userId,
          fileName: file.originalname,
          fileSize: file.size,
          mimeType: file.mimetype,
          rawContent,
          status: 'ANALYZING',
        },
      });

      // 4. 调用 AI 进行分析
      const analysisReport = await this.analyzeWithAI(rawContent);

      // 5. 更新简历记录（存储分析结果）
      const updatedResume = await this.prisma.resume.update({
        where: { id: resume.id },
        data: {
          analysisReport: analysisReport as any,
          status: 'COMPLETED',
        },
      });

      return {
        resume: {
          id: updatedResume.id,
          fileName: updatedResume.fileName,
          status: updatedResume.status,
          createdAt: updatedResume.createdAt,
        },
        analysis: analysisReport,
      };
    } catch (error) {
      console.error('Resume analysis error:', error);
      
      if (error instanceof BadRequestException) {
        throw error;
      }
      
      throw new InternalServerErrorException('简历分析失败，请稍后重试');
    }
  }

  /**
   * 获取用户的简历列表
   */
  async getUserResumes(userId: string) {
    return this.prisma.resume.findMany({
      where: { userId },
      select: {
        id: true,
        fileName: true,
        fileSize: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * 获取简历详情（包含分析报告）
   */
  async getResumeDetail(resumeId: string, userId: string) {
    const resume = await this.prisma.resume.findFirst({
      where: {
        id: resumeId,
        userId,  // 确保只能访问自己的简历
      },
    });

    if (!resume) {
      throw new BadRequestException('简历不存在');
    }

    return resume;
  }

  /**
   * 验证上传文件
   * @private
   */
  private validateFile(file: Express.Multer.File): void {
    if (!file) {
      throw new BadRequestException('请上传文件');
    }

    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      throw new BadRequestException('仅支持 PDF 和 DOCX 格式');
    }

    if (file.size > MAX_FILE_SIZE) {
      throw new BadRequestException('文件大小不能超过 5MB');
    }
  }

  /**
   * 在内存中解析文件内容
   * @private
   */
  private async parseFileInMemory(file: Express.Multer.File): Promise<string> {
    try {
      if (file.mimetype === 'application/pdf') {
        // 使用 pdf-parse 直接从 Buffer 解析
        const pdfData = await pdfParse(file.buffer);
        return pdfData.text;
      }
      
      // DOCX 解析（需要额外的库如 mammoth）
      // 这里简化处理，实际项目中应该使用 mammoth 等库
      if (file.mimetype.includes('wordprocessingml')) {
        // TODO: 使用 mammoth 解析 DOCX
        throw new BadRequestException('DOCX 解析功能开发中，请先使用 PDF 格式');
      }

      throw new BadRequestException('不支持的文件格式');
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      console.error('File parsing error:', error);
      throw new BadRequestException('文件解析失败，请确保文件未损坏');
    }
  }

  /**
   * 调用 AI 分析简历
   * @private
   */
  private async analyzeWithAI(content: string): Promise<ResumeAnalysisReport> {
    const systemPrompt = `你是一位资深的 HR 专家和职业顾问，专门帮助求职者优化简历。
请对以下简历内容进行全面分析，并以 JSON 格式返回分析报告。

分析维度：
1. 整体评分 (0-100)
2. ATS（招聘系统）兼容性分析
3. 关键词匹配分析
4. 结构完整性分析
5. 内容优化建议
6. 优化后的简历版本（可选）

请严格按照以下 JSON 格式返回：
{
  "overallScore": 数字,
  "atsCompatibility": {
    "score": 数字,
    "suggestions": ["建议1", "建议2"]
  },
  "keywordAnalysis": {
    "matched": ["关键词1", "关键词2"],
    "missing": ["缺失关键词1", "缺失关键词2"]
  },
  "structureAnalysis": {
    "sections": ["已有板块1", "已有板块2"],
    "improvements": ["改进建议1", "改进建议2"]
  },
  "contentSuggestions": ["建议1", "建议2", "建议3"]
}`;

    const humanPrompt = `请分析以下简历内容：

${content.substring(0, 8000)}  // 限制长度避免超出 Token 限制

请用中文回复，并严格按照 JSON 格式返回分析结果。`;

    try {
      const response = await this.llm.invoke([
        new SystemMessage(systemPrompt),
        new HumanMessage(humanPrompt),
      ]);

      // 提取 JSON 内容
      const responseText = response.content as string;
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      
      if (!jsonMatch) {
        throw new Error('AI 返回格式错误');
      }

      const analysis = JSON.parse(jsonMatch[0]) as ResumeAnalysisReport;
      
      // 验证必要字段
      if (typeof analysis.overallScore !== 'number') {
        analysis.overallScore = 70;  // 默认分数
      }

      return analysis;
    } catch (error) {
      console.error('AI analysis error:', error);
      
      // 返回默认分析结果
      return {
        overallScore: 70,
        atsCompatibility: {
          score: 70,
          suggestions: ['建议使用标准字体', '确保关键信息在页面顶部'],
        },
        keywordAnalysis: {
          matched: [],
          missing: ['建议添加更多行业关键词'],
        },
        structureAnalysis: {
          sections: ['基本信息', '工作经历'],
          improvements: ['建议添加项目经验板块', '建议添加技能清单'],
        },
        contentSuggestions: [
          '量化工作成果，使用具体数据',
          '突出核心技能和成就',
          '保持简洁，控制在 1-2 页',
        ],
      };
    }
  }
}
