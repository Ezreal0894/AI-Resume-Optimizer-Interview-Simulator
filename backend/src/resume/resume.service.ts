/**
 * 简历服务
 * 🔄 v3.0：新增白盒化提取接口（Structured Output）
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
import { ResumeAnalysisReport, ResumeExtractResult } from './dto/resume.dto';

// 文件限制
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

// AI 配置
const AI_CONFIG = {
  MAX_RETRIES: 2,
  TIMEOUT: 180000, // 🔧 增加到 180 秒（3 分钟），确保 AI 有足够时间处理
  TEMPERATURE: 0.2,
  MAX_TOKENS: 4000,
};

@Injectable()
export class ResumeService {
  private llm: ChatOpenAI;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
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
   * 🆕 Phase 1: 白盒化简历深度解析（Structured Output）
   * 提取：个人信息、核心亮点、知识点
   * 
   * 🔧 Phase 3 增强：支持历史简历提取 + 缓存策略
   * - 新文件上传：解析 PDF + AI 提取 + 缓存结果
   * - 历史简历：直接从缓存读取（秒回）
   */
  async extractResumeStructured(
    file: Express.Multer.File | null,
    userId: string,
    targetRole: string,
    resumeId?: string, // 🆕 历史简历 ID（可选）
  ): Promise<ResumeExtractResult> {
    // 🔄 模式 1: 历史简历提取（从缓存读取）
    if (resumeId && !file) {
      console.log(`[Resume Extract] Using cached data for resume ${resumeId}`);
      
      const resume = await this.prisma.resume.findFirst({
        where: { id: resumeId, userId },
        select: {
          id: true,
          rawContent: true,
          extractionData: true,
          targetRole: true,
        },
      });

      if (!resume) {
        throw new NotFoundException('简历不存在');
      }

      // 🚀 如果有缓存，直接返回（秒回！）
      if (resume.extractionData) {
        console.log(`[Resume Extract] Cache hit! Returning cached data`);
        const cached = resume.extractionData as any;
        return {
          resumeId: resume.id,
          personalInfo: cached.personalInfo,
          highlights: cached.highlights,
          knowledgePoints: cached.knowledgePoints,
        };
      }

      // 📝 如果没有缓存，使用 rawContent 重新提取
      console.log(`[Resume Extract] Cache miss, extracting from rawContent`);
      
      if (!resume.rawContent || resume.rawContent.trim().length === 0) {
        throw new BadRequestException('该简历没有可用的文本内容');
      }

      const extracted = await this.extractWithAI(
        resume.rawContent,
        targetRole || resume.targetRole || '通用职位',
      );

      // 💾 保存到缓存
      await this.prisma.resume.update({
        where: { id: resume.id },
        data: {
          extractionData: {
            personalInfo: extracted.personalInfo,
            highlights: extracted.highlights,
            knowledgePoints: extracted.knowledgePoints,
            extractedAt: new Date().toISOString(),
            targetRole: targetRole || resume.targetRole,
          },
        },
      });

      console.log(`[Resume Extract] Cached extraction data for future use`);

      return {
        resumeId: resume.id,
        ...extracted,
      };
    }

    // 🔄 模式 2: 新文件上传（完整流程）
    if (!file) {
      throw new BadRequestException('请上传简历文件或提供简历 ID');
    }

    console.log(`[Resume Extract] Processing new file: ${file.originalname}`);
    const startTime = Date.now();

    // 1. 验证文件
    this.validateFile(file);

    let newResumeId: string | null = null;

    try {
      // 2. 解析文件内容
      const rawContent = await this.parseFileInMemory(file);

      if (!rawContent || rawContent.trim().length < 10) {
        throw new BadRequestException('无法从文件中提取有效内容，请确保简历包含文字');
      }

      // 3. 修复中文文件名编码
      const fileName = Buffer.from(file.originalname, 'latin1').toString('utf8');

      // 4. 创建简历记录（状态：分析中）
      const resume = await this.prisma.resume.create({
        data: {
          userId,
          fileName,
          fileSize: file.size,
          mimeType: file.mimetype,
          rawContent,
          targetRole,
          status: 'ANALYZING',
        },
      });
      newResumeId = resume.id;

      // 5. 调用 AI 进行结构化提取
      const extractedData = await this.extractWithAI(rawContent, targetRole);

      // 6. 更新简历记录为完成 + 保存缓存
      await this.prisma.resume.update({
        where: { id: resume.id },
        data: {
          status: 'COMPLETED',
          extractionData: {
            personalInfo: extractedData.personalInfo,
            highlights: extractedData.highlights,
            knowledgePoints: extractedData.knowledgePoints,
            extractedAt: new Date().toISOString(),
            targetRole,
          },
        },
      });

      const duration = Date.now() - startTime;
      console.log(`[Resume Extract] Completed in ${duration}ms`);

      return {
        resumeId: resume.id,
        personalInfo: extractedData.personalInfo,
        highlights: extractedData.highlights,
        knowledgePoints: extractedData.knowledgePoints,
      };
    } catch (error) {
      console.error('Resume extraction failed:', error);

      // 更新简历状态为失败
      if (newResumeId) {
        await this.prisma.resume.update({
          where: { id: newResumeId },
          data: { status: 'FAILED' },
        }).catch(() => {});
      }

      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new InternalServerErrorException('简历解析失败，请稍后重试');
    }
  }

  /**
   * 🚀 AI 结构化提取（Structured Output with Zod-like Schema）
   */
  private async extractWithAI(
    content: string,
    targetRole: string,
  ): Promise<{
    personalInfo: { name: string; role: string; yearsOfExperience: number };
    highlights: string[];
    knowledgePoints: string[];
  }> {
    const systemPrompt = `你是一位资深的简历分析专家。请从简历中提取关键信息，用于后续的定制化面试。

你必须严格按照以下 JSON 格式返回，不要添加任何其他内容：
{
  "personalInfo": {
    "name": "候选人姓名（如果简历中没有，返回'候选人'）",
    "role": "当前职位或目标职位",
    "yearsOfExperience": 工作年限（整数，如果无法判断返回 0）
  },
  "highlights": [
    "核心亮点1（如：5年大厂经验）",
    "核心亮点2（如：主导过百万级用户项目）",
    "核心亮点3（如：精通微服务架构）"
  ],
  "knowledgePoints": [
    "知识点1（如：React）",
    "知识点2（如：Node.js）",
    "知识点3（如：微服务架构）",
    "知识点4（如：性能优化）"
  ]
}

提取规则：
1. personalInfo.name: 从简历中提取真实姓名，如果没有则返回"候选人"
2. personalInfo.role: 提取当前职位或目标职位
3. personalInfo.yearsOfExperience: 计算工作年限（整数）
4. highlights: 提取 3-5 个最核心的亮点（项目经验、技术能力、业绩成果）
5. knowledgePoints: 提取 8-15 个技术栈/知识点（编程语言、框架、工具、方法论等）

注意：
- highlights 要简洁有力，突出候选人的核心竞争力
- knowledgePoints 要全面覆盖简历中提到的技术栈
- 所有字段都必须填写，不能为空`;

    const humanPrompt = `目标职位：${targetRole}

简历内容：
${content.substring(0, 8000)}

请严格按照 JSON 格式返回提取结果。`;

    let lastError: Error | null = null;

    // 带重试机制
    for (let attempt = 0; attempt <= AI_CONFIG.MAX_RETRIES; attempt++) {
      try {
        const response = await this.llm.invoke([
          new SystemMessage(systemPrompt),
          new HumanMessage(humanPrompt),
        ]);

        const responseText = response.content as string;
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);

        if (!jsonMatch) {
          throw new Error('AI 返回格式错误，无法解析 JSON');
        }

        const extracted = JSON.parse(jsonMatch[0]);

        // 验证并规范化数据
        return this.validateAndNormalizeExtraction(extracted);
      } catch (error) {
        lastError = error as Error;
        console.warn(`AI extraction attempt ${attempt + 1} failed:`, error);

        if (attempt < AI_CONFIG.MAX_RETRIES) {
          await new Promise((resolve) => setTimeout(resolve, 1000 * (attempt + 1)));
        }
      }
    }

    throw lastError || new Error('AI 提取失败');
  }

  /**
   * 验证并规范化提取结果
   */
  private validateAndNormalizeExtraction(data: any): {
    personalInfo: { name: string; role: string; yearsOfExperience: number };
    highlights: string[];
    knowledgePoints: string[];
  } {
    return {
      personalInfo: {
        name: typeof data.personalInfo?.name === 'string' && data.personalInfo.name.trim()
          ? data.personalInfo.name.trim()
          : '候选人',
        role: typeof data.personalInfo?.role === 'string' && data.personalInfo.role.trim()
          ? data.personalInfo.role.trim()
          : '技术岗位',
        yearsOfExperience: typeof data.personalInfo?.yearsOfExperience === 'number'
          ? Math.max(0, Math.min(50, data.personalInfo.yearsOfExperience))
          : 0,
      },
      highlights: Array.isArray(data.highlights)
        ? data.highlights.filter((h: any) => typeof h === 'string' && h.trim()).slice(0, 5)
        : ['具备扎实的技术基础', '良好的沟通能力'],
      knowledgePoints: Array.isArray(data.knowledgePoints)
        ? data.knowledgePoints.filter((k: any) => typeof k === 'string' && k.trim()).slice(0, 15)
        : ['编程基础', '算法与数据结构'],
    };
  }

  /**
   * 上传并分析简历
   */
  async analyzeResume(
    file: Express.Multer.File,
    userId: string,
    targetRole: string,
    targetJd?: string,
  ): Promise<{ resume: any; analysis: ResumeAnalysisReport }> {
    // 1. 验证文件
    this.validateFile(file);

    let resumeId: string | null = null;

    try {
      // 2. 解析文件内容
      const rawContent = await this.parseFileInMemory(file);

      if (!rawContent || rawContent.trim().length < 10) {
        throw new BadRequestException('无法从文件中提取有效内容，请确保简历包含文字');
      }

      // 3. 修复中文文件名编码（Multer 使用 Latin-1 解码，需转为 UTF-8）
      const fileName = Buffer.from(file.originalname, 'latin1').toString('utf8');

      // 4. 创建简历记录（状态：分析中）
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
      console.error('Resume analysis failed:', error);

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

      throw new InternalServerErrorException('简历分析失败，请稍后重试');
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
