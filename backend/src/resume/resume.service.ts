/**
 * 简历服务
 * 🔄 v2.0：高阶 ATS 分析、积分补偿事务、结构化 AI 输出
 */
import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ChatOpenAI } from '@langchain/openai';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import pdfParse from 'pdf-parse';
import { PrismaService } from '../prisma/prisma.service';
import { UserService, CREDIT_COSTS } from '../user/user.service';
import { ResumeAnalysisReport } from './dto/resume.dto';

// 文件限制
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

// AI 配置
const AI_CONFIG = {
  MAX_RETRIES: 2,
  TIMEOUT: 90000,
  TEMPERATURE: 0.2,
  MAX_TOKENS: 4000,
};

@Injectable()
export class ResumeService {
  private llm: ChatOpenAI;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly userService: UserService,
  ) {
    this.llm = new ChatOpenAI({
      modelName: this.config.get<string>('DEEPSEEK_MODEL', 'deepseek-chat'),
      openAIApiKey: this.config.get<string>('DEEPSEEK_API_KEY'),
      configuration: {
        baseURL: this.config.get<string>('DEEPSEEK_BASE_URL', 'https://api.deepseek.com'),
      },
      temperature: AI_CONFIG.TEMPERATURE,
      maxTokens: AI_CONFIG.MAX_TOKENS,
      timeout: AI_CONFIG.TIMEOUT,
    });
  }

  /**
   * 🔄 复合上传并分析简历（带积分补偿事务）
   */
  async analyzeResume(
    file: Express.Multer.File,
    userId: string,
    targetRole: string,
    targetJd?: string,
  ): Promise<{ resume: any; analysis: ResumeAnalysisReport }> {
    // 1. 验证文件
    this.validateFile(file);

    // 2. 扣除积分（先扣后补）
    await this.userService.deductCredits(
      userId,
      CREDIT_COSTS.RESUME_ANALYSIS,
      '简历分析',
    );

    let resumeId: string | null = null;

    try {
      // 3. 解析文件内容
      const rawContent = await this.parseFileInMemory(file);

      if (!rawContent || rawContent.trim().length < 10) {
        throw new BadRequestException('无法从文件中提取有效内容，请确保简历包含文字');
      }

      // 4. 修复中文文件名编码（Multer 使用 Latin-1 解码，需转为 UTF-8）
      const fileName = Buffer.from(file.originalname, 'latin1').toString('utf8');

      // 5. 创建简历记录（状态：分析中）
      const resume = await this.prisma.resume.create({
        data: {
          userId,
          fileName,
          fileSize: file.size,
          mimeType: file.mimetype,
          rawContent,
          targetRole,
          targetJd,
          status: 'ANALYZING',
        },
      });
      resumeId = resume.id;

      // 5. 调用 AI 进行高阶 ATS 分析
      const analysisReport = await this.analyzeWithRetry(rawContent, targetRole, targetJd);

      // 6. 更新简历记录为完成
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
          fileSize: updatedResume.fileSize,
          targetRole: updatedResume.targetRole,
          status: updatedResume.status,
          createdAt: updatedResume.createdAt,
        },
        analysis: analysisReport,
      };
    } catch (error) {
      // 🔄 积分补偿事务：分析失败时退还积分
      console.error('Resume analysis failed, refunding credits:', error);

      await this.userService.refundCredits(
        userId,
        CREDIT_COSTS.RESUME_ANALYSIS,
        '简历分析失败退款',
      );

      // 更新简历状态为失败
      if (resumeId) {
        await this.prisma.resume.update({
          where: { id: resumeId },
          data: { status: 'FAILED' },
        }).catch(() => {}); // 忽略更新失败
      }

      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new InternalServerErrorException('简历分析失败，积分已退还，请稍后重试');
    }
  }

  /**
   * 获取用户简历列表
   */
  async getUserResumes(userId: string) {
    return this.prisma.resume.findMany({
      where: { userId },
      select: {
        id: true,
        fileName: true,
        fileSize: true,
        targetRole: true,
        status: true,
        isPinned: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: [
        { isPinned: 'desc' },
        { createdAt: 'desc' },
      ],
    });
  }

  /**
   * 获取简历详情
   */
  async getResumeDetail(resumeId: string, userId: string) {
    const resume = await this.prisma.resume.findFirst({
      where: { id: resumeId, userId },
    });

    if (!resume) {
      throw new NotFoundException('简历不存在');
    }

    return resume;
  }

  /**
   * 切换置顶状态
   */
  async togglePin(resumeId: string, userId: string) {
    const resume = await this.prisma.resume.findFirst({
      where: { id: resumeId, userId },
    });

    if (!resume) {
      throw new NotFoundException('简历不存在');
    }

    return this.prisma.resume.update({
      where: { id: resumeId },
      data: { isPinned: !resume.isPinned },
      select: {
        id: true,
        isPinned: true,
      },
    });
  }

  /**
   * 验证上传文件
   */
  private validateFile(file: Express.Multer.File): void {
    if (!file) {
      throw new BadRequestException('请上传文件');
    }

    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      throw new BadRequestException('仅支持 PDF 和 DOCX 格式');
    }

    if (file.size > MAX_FILE_SIZE) {
      throw new BadRequestException('文件大小不能超过 10MB');
    }
  }

  /**
   * 内存解析文件
   */
  private async parseFileInMemory(file: Express.Multer.File): Promise<string> {
    try {
      if (file.mimetype === 'application/pdf') {
        const pdfData = await pdfParse(file.buffer);
        return pdfData.text;
      }

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
   * 带重试的 AI 分析
   */
  private async analyzeWithRetry(
    content: string,
    targetRole: string,
    targetJd?: string,
  ): Promise<ResumeAnalysisReport> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= AI_CONFIG.MAX_RETRIES; attempt++) {
      try {
        return await this.analyzeWithAI(content, targetRole, targetJd);
      } catch (error) {
        lastError = error as Error;
        console.warn(`AI analysis attempt ${attempt + 1} failed:`, error);

        if (attempt < AI_CONFIG.MAX_RETRIES) {
          await new Promise((resolve) => setTimeout(resolve, 1000 * (attempt + 1)));
        }
      }
    }

    // 所有重试失败，抛出错误触发积分退还
    throw lastError || new Error('AI 分析失败');
  }

  /**
   * 🔄 调用 AI 进行高阶 ATS 分析（严格结构化输出）
   */
  private async analyzeWithAI(
    content: string,
    targetRole: string,
    targetJd?: string,
  ): Promise<ResumeAnalysisReport> {
    const systemPrompt = `你是一位资深的 HR 专家和 ATS（Applicant Tracking System）优化顾问。
请对简历进行全面的 ATS 兼容性分析和优化建议。

你必须严格按照以下 JSON 格式返回，不要添加任何其他内容：
{
  "overallScore": 数字(0-100),
  "atsCompatibility": {
    "score": 数字(0-100),
    "suggestions": ["ATS优化建议1", "ATS优化建议2", "ATS优化建议3"]
  },
  "keywordAnalysis": {
    "matched": ["已匹配关键词1", "已匹配关键词2"],
    "missing": ["缺失关键词1", "缺失关键词2"]
  },
  "structureAnalysis": {
    "sections": ["已有章节1", "已有章节2"],
    "improvements": ["结构改进建议1", "结构改进建议2"]
  },
  "contentSuggestions": ["内容优化建议1", "内容优化建议2", "内容优化建议3"]
}

分析维度说明：
1. overallScore: 简历综合评分（0-100）
2. atsCompatibility: ATS 系统兼容性分析
   - score: ATS 通过率预估
   - suggestions: 如何提高 ATS 通过率的具体建议
3. keywordAnalysis: 关键词匹配分析
   - matched: 简历中已包含的 JD 关键词
   - missing: JD 中要求但简历缺失的关键词
4. structureAnalysis: 简历结构分析
   - sections: 简历已有的章节
   - improvements: 结构优化建议
5. contentSuggestions: 内容优化的具体建议（量化成果、STAR 法则等）`;

    const humanPrompt = `目标职位：${targetRole}

${targetJd ? `职位描述（JD）：
${targetJd.substring(0, 3000)}

` : ''}简历内容：
${content.substring(0, 8000)}

请用中文分析，严格按照 JSON 格式返回。`;

    const response = await this.llm.invoke([
      new SystemMessage(systemPrompt),
      new HumanMessage(humanPrompt),
    ]);

    const responseText = response.content as string;
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      throw new Error('AI 返回格式错误，无法解析 JSON');
    }

    const analysis = JSON.parse(jsonMatch[0]) as ResumeAnalysisReport;

    // 验证并修正必要字段
    return this.validateAndNormalizeReport(analysis);
  }

  /**
   * 验证并规范化报告结构
   */
  private validateAndNormalizeReport(analysis: any): ResumeAnalysisReport {
    return {
      overallScore: typeof analysis.overallScore === 'number' 
        ? Math.min(100, Math.max(0, analysis.overallScore)) 
        : 70,
      atsCompatibility: {
        score: typeof analysis.atsCompatibility?.score === 'number'
          ? Math.min(100, Math.max(0, analysis.atsCompatibility.score))
          : 70,
        suggestions: Array.isArray(analysis.atsCompatibility?.suggestions)
          ? analysis.atsCompatibility.suggestions.slice(0, 5)
          : ['建议使用标准简历格式', '避免使用表格和图片'],
      },
      keywordAnalysis: {
        matched: Array.isArray(analysis.keywordAnalysis?.matched)
          ? analysis.keywordAnalysis.matched.slice(0, 15)
          : [],
        missing: Array.isArray(analysis.keywordAnalysis?.missing)
          ? analysis.keywordAnalysis.missing.slice(0, 10)
          : [],
      },
      structureAnalysis: {
        sections: Array.isArray(analysis.structureAnalysis?.sections)
          ? analysis.structureAnalysis.sections.slice(0, 10)
          : ['工作经历', '教育背景'],
        improvements: Array.isArray(analysis.structureAnalysis?.improvements)
          ? analysis.structureAnalysis.improvements.slice(0, 5)
          : ['建议添加项目经历章节'],
      },
      contentSuggestions: Array.isArray(analysis.contentSuggestions)
        ? analysis.contentSuggestions.slice(0, 10)
        : ['建议量化工作成果', '使用 STAR 法则描述项目'],
    };
  }
}
