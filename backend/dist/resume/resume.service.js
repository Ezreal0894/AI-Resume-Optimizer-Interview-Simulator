"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResumeService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const openai_1 = require("@langchain/openai");
const messages_1 = require("@langchain/core/messages");
const pdf_parse_1 = __importDefault(require("pdf-parse"));
const prisma_service_1 = require("../prisma/prisma.service");
const user_service_1 = require("../user/user.service");
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_MIME_TYPES = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];
const AI_CONFIG = {
    MAX_RETRIES: 2,
    TIMEOUT: 90000,
    TEMPERATURE: 0.2,
    MAX_TOKENS: 4000,
};
let ResumeService = class ResumeService {
    constructor(prisma, config, userService) {
        this.prisma = prisma;
        this.config = config;
        this.userService = userService;
        this.llm = new openai_1.ChatOpenAI({
            modelName: this.config.get('DEEPSEEK_MODEL', 'deepseek-chat'),
            openAIApiKey: this.config.get('DEEPSEEK_API_KEY'),
            configuration: {
                baseURL: this.config.get('DEEPSEEK_BASE_URL', 'https://api.deepseek.com'),
            },
            temperature: AI_CONFIG.TEMPERATURE,
            maxTokens: AI_CONFIG.MAX_TOKENS,
            timeout: AI_CONFIG.TIMEOUT,
        });
    }
    async analyzeResume(file, userId, targetRole, targetJd) {
        this.validateFile(file);
        await this.userService.deductCredits(userId, user_service_1.CREDIT_COSTS.RESUME_ANALYSIS, '简历分析');
        let resumeId = null;
        try {
            const rawContent = await this.parseFileInMemory(file);
            if (!rawContent || rawContent.trim().length < 10) {
                throw new common_1.BadRequestException('无法从文件中提取有效内容，请确保简历包含文字');
            }
            const fileName = Buffer.from(file.originalname, 'latin1').toString('utf8');
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
            const analysisReport = await this.analyzeWithRetry(rawContent, targetRole, targetJd);
            const updatedResume = await this.prisma.resume.update({
                where: { id: resume.id },
                data: {
                    analysisReport: analysisReport,
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
        }
        catch (error) {
            console.error('Resume analysis failed, refunding credits:', error);
            await this.userService.refundCredits(userId, user_service_1.CREDIT_COSTS.RESUME_ANALYSIS, '简历分析失败退款');
            if (resumeId) {
                await this.prisma.resume.update({
                    where: { id: resumeId },
                    data: { status: 'FAILED' },
                }).catch(() => { });
            }
            if (error instanceof common_1.BadRequestException) {
                throw error;
            }
            throw new common_1.InternalServerErrorException('简历分析失败，积分已退还，请稍后重试');
        }
    }
    async getUserResumes(userId) {
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
    async getResumeDetail(resumeId, userId) {
        const resume = await this.prisma.resume.findFirst({
            where: { id: resumeId, userId },
        });
        if (!resume) {
            throw new common_1.NotFoundException('简历不存在');
        }
        return resume;
    }
    async togglePin(resumeId, userId) {
        const resume = await this.prisma.resume.findFirst({
            where: { id: resumeId, userId },
        });
        if (!resume) {
            throw new common_1.NotFoundException('简历不存在');
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
    validateFile(file) {
        if (!file) {
            throw new common_1.BadRequestException('请上传文件');
        }
        if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
            throw new common_1.BadRequestException('仅支持 PDF 和 DOCX 格式');
        }
        if (file.size > MAX_FILE_SIZE) {
            throw new common_1.BadRequestException('文件大小不能超过 10MB');
        }
    }
    async parseFileInMemory(file) {
        try {
            if (file.mimetype === 'application/pdf') {
                const pdfData = await (0, pdf_parse_1.default)(file.buffer);
                return pdfData.text;
            }
            if (file.mimetype.includes('wordprocessingml')) {
                throw new common_1.BadRequestException('DOCX 解析功能开发中，请先使用 PDF 格式');
            }
            throw new common_1.BadRequestException('不支持的文件格式');
        }
        catch (error) {
            if (error instanceof common_1.BadRequestException)
                throw error;
            console.error('File parsing error:', error);
            throw new common_1.BadRequestException('文件解析失败，请确保文件未损坏');
        }
    }
    async analyzeWithRetry(content, targetRole, targetJd) {
        let lastError = null;
        for (let attempt = 0; attempt <= AI_CONFIG.MAX_RETRIES; attempt++) {
            try {
                return await this.analyzeWithAI(content, targetRole, targetJd);
            }
            catch (error) {
                lastError = error;
                console.warn(`AI analysis attempt ${attempt + 1} failed:`, error);
                if (attempt < AI_CONFIG.MAX_RETRIES) {
                    await new Promise((resolve) => setTimeout(resolve, 1000 * (attempt + 1)));
                }
            }
        }
        throw lastError || new Error('AI 分析失败');
    }
    async analyzeWithAI(content, targetRole, targetJd) {
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
            new messages_1.SystemMessage(systemPrompt),
            new messages_1.HumanMessage(humanPrompt),
        ]);
        const responseText = response.content;
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error('AI 返回格式错误，无法解析 JSON');
        }
        const analysis = JSON.parse(jsonMatch[0]);
        return this.validateAndNormalizeReport(analysis);
    }
    validateAndNormalizeReport(analysis) {
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
};
exports.ResumeService = ResumeService;
exports.ResumeService = ResumeService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        config_1.ConfigService,
        user_service_1.UserService])
], ResumeService);
//# sourceMappingURL=resume.service.js.map