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
const user_service_1 = require("../user/user.service");
const AI_CONFIG = {
    TIMEOUT: 60000,
    MAX_TOKENS: 2000,
    TEMPERATURE: 0.7,
    MAX_RETRIES: 2,
};
let InterviewService = class InterviewService {
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
            streaming: true,
            timeout: AI_CONFIG.TIMEOUT,
        });
    }
    async createSession(dto, userId) {
        await this.userService.deductCredits(userId, user_service_1.CREDIT_COSTS.INTERVIEW_SESSION, '创建面试会话');
        const session = await this.prisma.interviewSession.create({
            data: {
                userId,
                jobTitle: dto.jobTitle,
                jobDescription: dto.jobDescription,
                difficulty: dto.difficulty || 'MEDIUM',
                status: 'IN_PROGRESS',
            },
        });
        const systemPrompt = this.generateSystemPrompt(dto.jobTitle, dto.jobDescription, dto.difficulty);
        await this.prisma.interviewMessage.create({
            data: {
                sessionId: session.id,
                role: 'SYSTEM',
                content: systemPrompt,
            },
        });
        const greeting = this.generateGreeting(dto.jobTitle);
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
        config_1.ConfigService,
        user_service_1.UserService])
], InterviewService);
//# sourceMappingURL=interview.service.js.map