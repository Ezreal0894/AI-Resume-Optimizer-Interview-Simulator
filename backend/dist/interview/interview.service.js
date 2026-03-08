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
Object.defineProperty(exports, "__esModule", { value: true });
exports.InterviewService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const openai_1 = require("@langchain/openai");
const messages_1 = require("@langchain/core/messages");
const rxjs_1 = require("rxjs");
const prisma_service_1 = require("../prisma/prisma.service");
const AI_CONFIG = {
    TIMEOUT: 60000,
    MAX_TOKENS: 2000,
    TEMPERATURE: 0.7,
    MAX_RETRIES: 2,
};
let InterviewService = class InterviewService {
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
            streaming: true,
            timeout: AI_CONFIG.TIMEOUT,
        });
    }
    async createSession(dto, userId) {
        if (dto.mode === 'RESUME' && dto.resumeId) {
            const resume = await this.prisma.resume.findFirst({
                where: {
                    id: dto.resumeId,
                    userId,
                },
            });
            if (!resume) {
                throw new common_1.NotFoundException('简历不存在或无权访问');
            }
            if (!resume.rawContent && !resume.analysisReport) {
                throw new common_1.BadRequestException('简历尚未解析完成，请稍后重试');
            }
        }
        const session = await this.prisma.interviewSession.create({
            data: {
                userId,
                jobTitle: dto.jobTitle,
                jobDescription: dto.jobDescription,
                difficulty: dto.difficulty || 'MEDIUM',
                mode: dto.mode,
                resumeId: dto.mode === 'RESUME' ? dto.resumeId : null,
                customKnowledgePoints: dto.mode === 'RESUME' && dto.customKnowledgePoints
                    ? dto.customKnowledgePoints
                    : [],
                topics: dto.mode === 'TOPIC' ? dto.topics || [] : [],
                status: 'IN_PROGRESS',
            },
            include: {
                resume: dto.mode === 'RESUME',
            },
        });
        const systemPrompt = await this.generateDynamicSystemPrompt(session);
        await this.prisma.interviewMessage.create({
            data: {
                sessionId: session.id,
                role: 'SYSTEM',
                content: systemPrompt,
            },
        });
        const greeting = this.generateDynamicGreeting(session);
        await this.prisma.interviewMessage.create({
            data: {
                sessionId: session.id,
                role: 'ASSISTANT',
                content: greeting,
            },
        });
        return {
            sessionId: session.id,
            greeting,
        };
    }
    streamChat(sessionId, messages, userId) {
        const subject = new rxjs_1.Subject();
        let isCancelled = false;
        const subscription = subject.subscribe({
            complete: () => {
                isCancelled = true;
            },
        });
        this.executeStreamChat(sessionId, messages, userId, subject, () => isCancelled)
            .catch((error) => {
            if (!isCancelled) {
                console.error('Stream chat error:', error);
                subject.next({ data: JSON.stringify({ error: '对话出错，请重试' }), type: 'error' });
            }
        })
            .finally(() => {
            subscription.unsubscribe();
            subject.complete();
        });
        return subject.asObservable();
    }
    async executeStreamChat(sessionId, messages, userId, subject, isCancelled) {
        const session = await this.prisma.interviewSession.findFirst({
            where: { id: sessionId, userId },
        });
        if (!session) {
            throw new common_1.NotFoundException('面试会话不存在');
        }
        if (session.status !== 'IN_PROGRESS') {
            throw new common_1.BadRequestException('面试会话已结束');
        }
        const langchainMessages = this.buildLangchainMessages(messages);
        const lastUserMessage = messages[messages.length - 1];
        if (lastUserMessage?.role === 'user') {
            await this.prisma.interviewMessage.create({
                data: {
                    sessionId,
                    role: 'USER',
                    content: lastUserMessage.content,
                },
            });
        }
        let fullResponse = '';
        try {
            const stream = await this.llm.stream(langchainMessages);
            for await (const chunk of stream) {
                if (isCancelled()) {
                    console.log('Client disconnected, stopping LLM stream');
                    break;
                }
                const content = chunk.content;
                if (content) {
                    fullResponse += content;
                    subject.next({
                        data: JSON.stringify({ content, done: false }),
                        type: 'message',
                    });
                }
            }
            if (!isCancelled()) {
                subject.next({
                    data: JSON.stringify({ content: '', done: true }),
                    type: 'done',
                });
                if (fullResponse.trim()) {
                    await this.prisma.interviewMessage.create({
                        data: {
                            sessionId,
                            role: 'ASSISTANT',
                            content: fullResponse,
                        },
                    });
                }
            }
        }
        catch (error) {
            if (!isCancelled()) {
                console.error('LLM stream error:', error);
                subject.next({
                    data: JSON.stringify({ error: 'AI 响应出错' }),
                    type: 'error',
                });
            }
        }
    }
    async endSession(sessionId, userId) {
        const session = await this.prisma.interviewSession.findFirst({
            where: { id: sessionId, userId },
            include: {
                messages: {
                    orderBy: { createdAt: 'asc' },
                },
            },
        });
        if (!session) {
            throw new common_1.NotFoundException('面试会话不存在');
        }
        const metrics = await this.generateReportWithRetry(session.messages);
        const updatedSession = await this.prisma.interviewSession.update({
            where: { id: sessionId },
            data: {
                status: 'COMPLETED',
                endedAt: new Date(),
                metrics: metrics,
            },
        });
        return {
            sessionId: updatedSession.id,
            metrics,
        };
    }
    async getHistoryTrend(userId) {
        const sessions = await this.prisma.interviewSession.findMany({
            where: {
                userId,
                status: 'COMPLETED',
            },
            select: {
                id: true,
                metrics: true,
                createdAt: true,
            },
            orderBy: { createdAt: 'asc' },
            take: 10,
        });
        return sessions
            .filter((s) => s.metrics !== null)
            .map((session) => {
            const metrics = session.metrics;
            return {
                sessionId: session.id,
                overallScore: metrics?.overallScore || 0,
                createdAt: session.createdAt,
            };
        });
    }
    async getUserSessions(userId) {
        return this.prisma.interviewSession.findMany({
            where: { userId },
            select: {
                id: true,
                jobTitle: true,
                difficulty: true,
                status: true,
                isPinned: true,
                startedAt: true,
                endedAt: true,
                metrics: true,
            },
            orderBy: [
                { isPinned: 'desc' },
                { createdAt: 'desc' },
            ],
        });
    }
    async getSessionDetail(sessionId, userId) {
        const session = await this.prisma.interviewSession.findFirst({
            where: { id: sessionId, userId },
            include: {
                messages: {
                    where: { role: { not: 'SYSTEM' } },
                    orderBy: { createdAt: 'asc' },
                },
            },
        });
        if (!session) {
            throw new common_1.NotFoundException('面试会话不存在');
        }
        return session;
    }
    async togglePin(sessionId, userId) {
        const session = await this.prisma.interviewSession.findFirst({
            where: { id: sessionId, userId },
        });
        if (!session) {
            throw new common_1.NotFoundException('面试会话不存在');
        }
        return this.prisma.interviewSession.update({
            where: { id: sessionId },
            data: { isPinned: !session.isPinned },
            select: {
                id: true,
                isPinned: true,
            },
        });
    }
    async deleteSession(sessionId, userId) {
        const session = await this.prisma.interviewSession.findFirst({
            where: { id: sessionId, userId },
        });
        if (!session) {
            throw new common_1.NotFoundException('面试会话不存在');
        }
        await this.prisma.interviewSession.delete({
            where: { id: sessionId },
        });
    }
    async generateDynamicSystemPrompt(session) {
        const difficultyMap = {
            EASY: 'Junior（初级）',
            MEDIUM: 'Mid-Level（中级）',
            HARD: 'Senior（高级）',
            EXPERT: 'Big Tech Expert（专家级）',
        };
        const difficultyLabel = difficultyMap[session.difficulty] || 'Mid-Level（中级）';
        if (session.mode === 'RESUME' && session.resume) {
            const resumeContent = this.extractResumeContent(session.resume);
            const knowledgePointsSection = session.customKnowledgePoints && session.customKnowledgePoints.length > 0
                ? `\n【用户确认的核心知识点】：\n${session.customKnowledgePoints.join('、')}\n\n⚠️ 重要：你必须严格围绕上述知识点展开提问，深挖候选人在这些领域的理解深度和实践经验。`
                : '';
            return `你是一位资深的技术面试官，正在进行「${session.jobTitle}」岗位的深度面试。

【面试难度】：${difficultyLabel}

【候选人简历上下文】：
${resumeContent}${knowledgePointsSection}

【面试策略】：
1. 深挖简历中的项目经验，追问技术细节和实现方案
2. 针对简历中提到的技术栈进行深度考察
3. ${session.customKnowledgePoints && session.customKnowledgePoints.length > 0 ? '重点围绕用户确认的核心知识点进行提问' : '关注候选人在项目中的角色、贡献和解决的核心问题'}
4. 根据难度级别调整问题深度：
   - Junior: 基础概念、常见场景
   - Mid-Level: 实际应用、性能优化
   - Senior: 架构设计、技术选型
   - Expert: 系统设计、技术领导力

【面试规则】：
- 每次只问一个问题，等待候选人回答后再继续
- 根据简历内容进行针对性提问
- 保持专业、友好的态度
- 适时给予正面反馈和引导

请用中文进行面试。`;
        }
        if (session.mode === 'TOPIC' && session.topics.length > 0) {
            const topicsText = session.topics.join('、');
            return `你是一位资深的技术面试官，正在进行「${session.jobTitle}」岗位的专项技术盲测。

【面试难度】：${difficultyLabel}

【考核领域】：${topicsText}

【面试策略】：
1. 直接从指定领域中挑选高频、硬核的面试题进行提问
2. 无需提及简历，专注于技术能力的考察
3. 根据难度级别调整问题深度：
   - Junior: 基础概念、API 使用
   - Mid-Level: 原理解析、最佳实践
   - Senior: 深层原理、性能优化、架构设计
   - Expert: 源码级理解、系统设计、技术决策

【面试规则】：
- 每次只问一个问题，等待候选人回答后再继续
- 问题要有层次，从基础到深入
- 保持专业、友好的态度
- 适时给予正面反馈和引导
- 注意考察：技术深度、问题解决能力、沟通表达

请用中文进行面试。`;
        }
        return this.generateSystemPrompt(session.jobTitle, session.jobDescription, session.difficulty);
    }
    extractResumeContent(resume) {
        if (resume.analysisReport) {
            const report = resume.analysisReport;
            const sections = [];
            if (report.keywordAnalysis?.matched) {
                sections.push(`技术栈：${report.keywordAnalysis.matched.join('、')}`);
            }
            if (report.structureAnalysis?.sections) {
                sections.push(`简历章节：${report.structureAnalysis.sections.join('、')}`);
            }
            if (sections.length > 0) {
                return sections.join('\n') + '\n\n' + (resume.rawContent?.substring(0, 2000) || '');
            }
        }
        return resume.rawContent?.substring(0, 3000) || '简历内容暂无';
    }
    generateDynamicGreeting(session) {
        const difficultyMap = {
            EASY: 'Junior（初级）',
            MEDIUM: 'Mid-Level（中级）',
            HARD: 'Senior（高级）',
            EXPERT: 'Big Tech Expert（专家级）',
        };
        const difficultyLabel = difficultyMap[session.difficulty] || 'Mid-Level（中级）';
        if (session.mode === 'RESUME') {
            return `你好！我是你的 AI 面试官。今天我们将进行「${session.jobTitle}」岗位的模拟面试，难度级别为 ${difficultyLabel}。

我已经仔细阅读了你的简历，接下来会针对你的项目经验和技术栈进行深度提问。请放轻松，把这当作一次真实的面试体验。

准备好了吗？那我们开始吧！

首先，请简单介绍一下你自己，重点讲讲你最近的一个项目，包括你在其中的角色、使用的技术栈，以及遇到的最大挑战是什么？`;
        }
        if (session.mode === 'TOPIC') {
            const topicsText = session.topics.join('、');
            return `你好！我是你的 AI 面试官。今天我们将进行「${session.jobTitle}」岗位的专项技术盲测，难度级别为 ${difficultyLabel}。

本次考核的专项领域为：${topicsText}

这是一场纯技术能力的考察，我会直接从这些领域中挑选高频面试题进行提问。请放轻松，尽可能展示你的技术深度和思考过程。

准备好了吗？那我们开始吧！

第一个问题：请解释一下你对「${session.topics[0]}」的理解，并举例说明在实际项目中如何应用？`;
        }
        return this.generateGreeting(session.jobTitle);
    }
    generateSystemPrompt(jobTitle, jobDescription, difficulty) {
        const difficultyGuide = {
            EASY: '问题难度较低，主要考察基础知识和基本技能',
            MEDIUM: '问题难度适中，考察实际工作能力和项目经验',
            HARD: '问题难度较高，深入考察技术深度和解决复杂问题的能力',
            EXPERT: '问题难度很高，考察系统设计、架构能力和技术领导力',
        };
        return `你是一位专业的 AI 面试官，正在进行「${jobTitle}」岗位的模拟面试。

面试要求：
- 难度级别：${difficultyGuide[difficulty || 'MEDIUM']}
- 岗位描述：${jobDescription || '标准岗位要求'}

面试规则：
1. 每次只问一个问题，等待候选人回答后再继续
2. 根据候选人的回答进行追问或转换话题
3. 保持专业、友好的态度
4. 适时给予正面反馈和引导
5. 问题要有层次，从基础到深入
6. 注意考察：技术能力、沟通表达、问题解决、文化契合、领导力

请用中文进行面试。`;
    }
    generateGreeting(jobTitle) {
        return `你好！我是你的 AI 面试官。今天我们将进行「${jobTitle}」岗位的模拟面试。

在开始之前，请放轻松，把这当作一次真实的面试体验。我会根据你的回答进行追问，帮助你更好地准备真正的面试。

准备好了吗？那我们开始吧！

首先，请简单介绍一下你自己，包括你的教育背景、工作经历，以及为什么对这个岗位感兴趣？`;
    }
    buildLangchainMessages(messages) {
        return messages.map((msg) => {
            switch (msg.role) {
                case 'system':
                    return new messages_1.SystemMessage(msg.content);
                case 'assistant':
                    return new messages_1.AIMessage(msg.content);
                case 'user':
                    return new messages_1.HumanMessage(msg.content);
                default:
                    return new messages_1.HumanMessage(msg.content);
            }
        });
    }
    async generateReportWithRetry(messages) {
        let lastError = null;
        for (let attempt = 0; attempt <= AI_CONFIG.MAX_RETRIES; attempt++) {
            try {
                return await this.generateInterviewReport(messages);
            }
            catch (error) {
                lastError = error;
                console.warn(`Report generation attempt ${attempt + 1} failed:`, error);
                if (attempt < AI_CONFIG.MAX_RETRIES) {
                    await new Promise((resolve) => setTimeout(resolve, 1000 * (attempt + 1)));
                }
            }
        }
        console.error('All report generation attempts failed:', lastError);
        return this.getDefaultMetrics();
    }
    async generateInterviewReport(messages) {
        const conversation = messages
            .filter((m) => m.role !== 'SYSTEM')
            .map((m) => `${m.role === 'ASSISTANT' ? '面试官' : '候选人'}: ${m.content}`)
            .join('\n\n');
        const prompt = `请根据以下面试对话，生成一份详细的面试评估报告。

对话内容：
${conversation.substring(0, 6000)}

你必须严格按照以下 JSON 格式返回，不要添加任何其他内容：
{
  "overallScore": 0-100的整体评分,
  "radar": {
    "technical": 0-100,
    "communication": 0-100,
    "problemSolving": 0-100,
    "cultureFit": 0-100,
    "leadership": 0-100
  },
  "feedback": {
    "strengths": ["优势1", "优势2", "优势3"],
    "improvements": ["待改进1", "待改进2", "待改进3"]
  }
}

评分维度说明：
- technical: 技术深度 - 对专业知识的掌握程度
- communication: 沟通表达 - 表达清晰度和逻辑性
- problemSolving: 问题解决 - 分析和解决问题的能力
- cultureFit: 文化契合 - 与团队文化的匹配度
- leadership: 领导力 - 主动性和影响力`;
        const response = await this.llm.invoke([new messages_1.HumanMessage(prompt)]);
        const responseText = response.content;
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error('AI 返回格式错误，无法解析 JSON');
        }
        const metrics = JSON.parse(jsonMatch[0]);
        return this.validateAndNormalizeMetrics(metrics);
    }
    validateAndNormalizeMetrics(metrics) {
        const clamp = (val, min, max) => typeof val === 'number' ? Math.min(max, Math.max(min, val)) : 75;
        return {
            overallScore: clamp(metrics.overallScore, 0, 100),
            radar: {
                technical: clamp(metrics.radar?.technical, 0, 100),
                communication: clamp(metrics.radar?.communication, 0, 100),
                problemSolving: clamp(metrics.radar?.problemSolving, 0, 100),
                cultureFit: clamp(metrics.radar?.cultureFit, 0, 100),
                leadership: clamp(metrics.radar?.leadership, 0, 100),
            },
            feedback: {
                strengths: Array.isArray(metrics.feedback?.strengths)
                    ? metrics.feedback.strengths.slice(0, 5)
                    : ['表达清晰', '态度积极'],
                improvements: Array.isArray(metrics.feedback?.improvements)
                    ? metrics.feedback.improvements.slice(0, 5)
                    : ['可以更多展示项目细节', '建议加强技术深度'],
            },
        };
    }
    getDefaultMetrics() {
        return {
            overallScore: 75,
            radar: {
                technical: 75,
                communication: 80,
                problemSolving: 75,
                cultureFit: 78,
                leadership: 70,
            },
            feedback: {
                strengths: ['表达清晰', '态度积极'],
                improvements: ['可以更多展示项目细节', '建议加强技术深度'],
            },
        };
    }
};
exports.InterviewService = InterviewService;
exports.InterviewService = InterviewService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        config_1.ConfigService])
], InterviewService);
//# sourceMappingURL=interview.service.js.map