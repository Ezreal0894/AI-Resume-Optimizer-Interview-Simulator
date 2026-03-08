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
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_MIME_TYPES = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];
const AI_CONFIG = {
    MAX_RETRIES: 2,
    TIMEOUT: 180000,
    TEMPERATURE: 0.2,
    MAX_TOKENS: 4000,
};
let ResumeService = class ResumeService {
    constructor(prisma, config) {
        this.prisma = prisma;
        this.config = config;
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
    async extractResumeStructured(file, userId, targetRole, resumeId) {
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
                throw new common_1.NotFoundException('简历不存在');
            }
            if (resume.extractionData) {
                console.log(`[Resume Extract] Cache hit! Returning cached data`);
                const cached = resume.extractionData;
                return {
                    resumeId: resume.id,
                    personalInfo: cached.personalInfo,
                    highlights: cached.highlights,
                    knowledgePoints: cached.knowledgePoints,
                };
            }
            console.log(`[Resume Extract] Cache miss, extracting from rawContent`);
            if (!resume.rawContent || resume.rawContent.trim().length === 0) {
                throw new common_1.BadRequestException('该简历没有可用的文本内容');
            }
            const extracted = await this.extractWithAI(resume.rawContent, targetRole || resume.targetRole || '通用职位');
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
        if (!file) {
            throw new common_1.BadRequestException('请上传简历文件或提供简历 ID');
        }
        console.log(`[Resume Extract] Processing new file: ${file.originalname}`);
        const startTime = Date.now();
        this.validateFile(file);
        let newResumeId = null;
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
                    status: 'ANALYZING',
                },
            });
            newResumeId = resume.id;
            const extractedData = await this.extractWithAI(rawContent, targetRole);
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
        }
        catch (error) {
            console.error('Resume extraction failed:', error);
            if (newResumeId) {
                await this.prisma.resume.update({
                    where: { id: newResumeId },
                    data: { status: 'FAILED' },
                }).catch(() => { });
            }
            if (error instanceof common_1.BadRequestException) {
                throw error;
            }
            throw new common_1.InternalServerErrorException('简历解析失败，请稍后重试');
        }
    }
    async extractWithAI(content, targetRole) {
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
        let lastError = null;
        for (let attempt = 0; attempt <= AI_CONFIG.MAX_RETRIES; attempt++) {
            try {
                const response = await this.llm.invoke([
                    new messages_1.SystemMessage(systemPrompt),
                    new messages_1.HumanMessage(humanPrompt),
                ]);
                const responseText = response.content;
                const jsonMatch = responseText.match(/\{[\s\S]*\}/);
                if (!jsonMatch) {
                    throw new Error('AI 返回格式错误，无法解析 JSON');
                }
                const extracted = JSON.parse(jsonMatch[0]);
                return this.validateAndNormalizeExtraction(extracted);
            }
            catch (error) {
                lastError = error;
                console.warn(`AI extraction attempt ${attempt + 1} failed:`, error);
                if (attempt < AI_CONFIG.MAX_RETRIES) {
                    await new Promise((resolve) => setTimeout(resolve, 1000 * (attempt + 1)));
                }
            }
        }
        throw lastError || new Error('AI 提取失败');
    }
    validateAndNormalizeExtraction(data) {
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
                ? data.highlights.filter((h) => typeof h === 'string' && h.trim()).slice(0, 5)
                : ['具备扎实的技术基础', '良好的沟通能力'],
            knowledgePoints: Array.isArray(data.knowledgePoints)
                ? data.knowledgePoints.filter((k) => typeof k === 'string' && k.trim()).slice(0, 15)
                : ['编程基础', '算法与数据结构'],
        };
    }
    async analyzeResume(file, userId, targetRole, targetJd) {
        this.validateFile(file);
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
            console.error('Resume analysis failed:', error);
            if (resumeId) {
                await this.prisma.resume.update({
                    where: { id: resumeId },
                    data: { status: 'FAILED' },
                }).catch(() => { });
            }
            if (error instanceof common_1.BadRequestException) {
                throw error;
            }
            throw new common_1.InternalServerErrorException('简历分析失败，请稍后重试');
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
        config_1.ConfigService])
], ResumeService);
//# sourceMappingURL=resume.service.js.map