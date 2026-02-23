/**
 * 面试服务
 * 🔄 v2.1：免费化重构 - 移除积分系统
 */
import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ChatOpenAI } from '@langchain/openai';
import {
  HumanMessage,
  SystemMessage,
  AIMessage,
  BaseMessage,
} from '@langchain/core/messages';
import { Observable, Subject } from 'rxjs';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSessionDto, InterviewMetrics, TrendDataPoint } from './dto/interview.dto';

// SSE 消息事件类型
export interface SSEMessageEvent {
  data: string;
  type?: string;
}

// 对话消息类型
interface ChatMessage {
  role: 'system' | 'assistant' | 'user';
  content: string;
}

// AI 配置
const AI_CONFIG = {
  TIMEOUT: 60000,
  MAX_TOKENS: 2000,
  TEMPERATURE: 0.7,
  MAX_RETRIES: 2,
};

@Injectable()
export class InterviewService {
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
      streaming: true,
      timeout: AI_CONFIG.TIMEOUT,
    });
  }

  /**
   * 创建面试会话
   */
  async createSession(dto: CreateSessionDto, userId: string) {
    const session = await this.prisma.interviewSession.create({
      data: {
        userId,
        jobTitle: dto.jobTitle,
        jobDescription: dto.jobDescription,
        difficulty: dto.difficulty || 'MEDIUM',
        status: 'IN_PROGRESS',
      },
    });

    // 创建系统提示消息
    const systemPrompt = this.generateSystemPrompt(dto.jobTitle, dto.jobDescription, dto.difficulty);

    await this.prisma.interviewMessage.create({
      data: {
        sessionId: session.id,
        role: 'SYSTEM',
        content: systemPrompt,
      },
    });

    // 生成开场白
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

  /**
   * SSE 流式对话
   */
  streamChat(
    sessionId: string,
    messages: ChatMessage[],
    userId: string,
  ): Observable<SSEMessageEvent> {
    const subject = new Subject<SSEMessageEvent>();
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

  /**
   * 执行流式对话
   */
  private async executeStreamChat(
    sessionId: string,
    messages: ChatMessage[],
    userId: string,
    subject: Subject<SSEMessageEvent>,
    isCancelled: () => boolean,
  ): Promise<void> {
    const session = await this.prisma.interviewSession.findFirst({
      where: { id: sessionId, userId },
    });

    if (!session) {
      throw new NotFoundException('面试会话不存在');
    }

    if (session.status !== 'IN_PROGRESS') {
      throw new BadRequestException('面试会话已结束');
    }

    const langchainMessages = this.buildLangchainMessages(messages);

    // 存储用户消息
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

        const content = chunk.content as string;
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
    } catch (error) {
      if (!isCancelled()) {
        console.error('LLM stream error:', error);
        subject.next({
          data: JSON.stringify({ error: 'AI 响应出错' }),
          type: 'error',
        });
      }
    }
  }

  /**
   * 结束面试会话并生成报告
   */
  async endSession(sessionId: string, userId: string) {
    const session = await this.prisma.interviewSession.findFirst({
      where: { id: sessionId, userId },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!session) {
      throw new NotFoundException('面试会话不存在');
    }

    // 生成面试报告（带重试）
    const metrics = await this.generateReportWithRetry(session.messages);

    const updatedSession = await this.prisma.interviewSession.update({
      where: { id: sessionId },
      data: {
        status: 'COMPLETED',
        endedAt: new Date(),
        metrics: metrics as any,
      },
    });

    return {
      sessionId: updatedSession.id,
      metrics,
    };
  }

  /**
   * 获取历史趋势数据（最近 10 次）
   */
  async getHistoryTrend(userId: string): Promise<TrendDataPoint[]> {
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
        const metrics = session.metrics as any;
        return {
          sessionId: session.id,
          overallScore: metrics?.overallScore || 0,
          createdAt: session.createdAt,
        };
      });
  }

  /**
   * 获取用户的面试会话列表
   */
  async getUserSessions(userId: string) {
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

  /**
   * 获取会话详情
   */
  async getSessionDetail(sessionId: string, userId: string) {
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
      throw new NotFoundException('面试会话不存在');
    }

    return session;
  }

  /**
   * 切换置顶状态
   */
  async togglePin(sessionId: string, userId: string) {
    const session = await this.prisma.interviewSession.findFirst({
      where: { id: sessionId, userId },
    });

    if (!session) {
      throw new NotFoundException('面试会话不存在');
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

  /**
   * 生成系统提示词
   */
  private generateSystemPrompt(
    jobTitle: string,
    jobDescription?: string,
    difficulty?: string,
  ): string {
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

  /**
   * 生成开场白
   */
  private generateGreeting(jobTitle: string): string {
    return `你好！我是你的 AI 面试官。今天我们将进行「${jobTitle}」岗位的模拟面试。

在开始之前，请放轻松，把这当作一次真实的面试体验。我会根据你的回答进行追问，帮助你更好地准备真正的面试。

准备好了吗？那我们开始吧！

首先，请简单介绍一下你自己，包括你的教育背景、工作经历，以及为什么对这个岗位感兴趣？`;
  }

  /**
   * 构建 Langchain 消息数组
   */
  private buildLangchainMessages(messages: ChatMessage[]): BaseMessage[] {
    return messages.map((msg) => {
      switch (msg.role) {
        case 'system':
          return new SystemMessage(msg.content);
        case 'assistant':
          return new AIMessage(msg.content);
        case 'user':
          return new HumanMessage(msg.content);
        default:
          return new HumanMessage(msg.content);
      }
    });
  }

  /**
   * 带重试的报告生成
   */
  private async generateReportWithRetry(messages: any[]): Promise<InterviewMetrics> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= AI_CONFIG.MAX_RETRIES; attempt++) {
      try {
        return await this.generateInterviewReport(messages);
      } catch (error) {
        lastError = error as Error;
        console.warn(`Report generation attempt ${attempt + 1} failed:`, error);

        if (attempt < AI_CONFIG.MAX_RETRIES) {
          await new Promise((resolve) => setTimeout(resolve, 1000 * (attempt + 1)));
        }
      }
    }

    console.error('All report generation attempts failed:', lastError);
    return this.getDefaultMetrics();
  }

  /**
   * 🔄 生成面试报告（前端契约对齐的 5 维度）
   */
  private async generateInterviewReport(messages: any[]): Promise<InterviewMetrics> {
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

    const response = await this.llm.invoke([new HumanMessage(prompt)]);
    const responseText = response.content as string;
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      throw new Error('AI 返回格式错误，无法解析 JSON');
    }

    const metrics = JSON.parse(jsonMatch[0]) as InterviewMetrics;

    // 验证并修正字段
    return this.validateAndNormalizeMetrics(metrics);
  }

  /**
   * 验证并规范化报告结构
   */
  private validateAndNormalizeMetrics(metrics: any): InterviewMetrics {
    const clamp = (val: any, min: number, max: number) =>
      typeof val === 'number' ? Math.min(max, Math.max(min, val)) : 75;

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

  /**
   * 默认报告（AI 失败时的 fallback）
   */
  private getDefaultMetrics(): InterviewMetrics {
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
}
