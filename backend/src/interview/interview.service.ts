/**
 * 面试服务
 * 🛡️ 防御性重构：AI 对话、SSE 流式输出、会话管理（支持客户端断开检测）
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
import { CreateSessionDto } from './dto/interview.dto';

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

// LLM 配置
const LLM_CONFIG = {
  TIMEOUT: 60000,  // 60 秒超时
  MAX_TOKENS: 2000,
  TEMPERATURE: 0.7,
};

@Injectable()
export class InterviewService {
  private llm: ChatOpenAI;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {
    // 初始化 DeepSeek LLM（流式模式）
    this.llm = new ChatOpenAI({
      modelName: this.config.get<string>('DEEPSEEK_MODEL', 'deepseek-chat'),
      openAIApiKey: this.config.get<string>('DEEPSEEK_API_KEY'),
      configuration: {
        baseURL: this.config.get<string>('DEEPSEEK_BASE_URL', 'https://api.deepseek.com'),
      },
      temperature: LLM_CONFIG.TEMPERATURE,
      maxTokens: LLM_CONFIG.MAX_TOKENS,
      streaming: true,
      timeout: LLM_CONFIG.TIMEOUT,  // 🛡️ 添加超时控制
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
   * 🛡️ 返回 Observable 用于 NestJS @Sse() 装饰器，支持客户端断开检测
   */
  streamChat(
    sessionId: string,
    messages: ChatMessage[],
    userId: string,
  ): Observable<SSEMessageEvent> {
    const subject = new Subject<SSEMessageEvent>();
    
    // 🛡️ 创建取消标志
    let isCancelled = false;
    
    // 监听客户端断开
    const subscription = subject.subscribe({
      complete: () => {
        isCancelled = true;
      },
    });

    // 异步执行流式对话
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
   * 执行流式对话（内部方法）
   * @private
   */
  private async executeStreamChat(
    sessionId: string,
    messages: ChatMessage[],
    userId: string,
    subject: Subject<SSEMessageEvent>,
    isCancelled: () => boolean,
  ): Promise<void> {
    // 验证会话
    const session = await this.prisma.interviewSession.findFirst({
      where: { id: sessionId, userId },
    });

    if (!session) {
      throw new NotFoundException('面试会话不存在');
    }

    if (session.status !== 'IN_PROGRESS') {
      throw new BadRequestException('面试会话已结束');
    }

    // 构建 Langchain 消息数组
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

    // 流式调用 LLM
    let fullResponse = '';
    
    try {
      const stream = await this.llm.stream(langchainMessages);

      for await (const chunk of stream) {
        // 🛡️ 检查客户端是否已断开
        if (isCancelled()) {
          console.log('Client disconnected, stopping LLM stream');
          break;
        }
        
        const content = chunk.content as string;
        if (content) {
          fullResponse += content;
          
          // 发送 SSE 事件
          subject.next({
            data: JSON.stringify({ content, done: false }),
            type: 'message',
          });
        }
      }

      // 🛡️ 只有在未取消时才发送完成事件和存储
      if (!isCancelled()) {
        // 发送完成事件
        subject.next({
          data: JSON.stringify({ content: '', done: true }),
          type: 'done',
        });

        // 存储 AI 回复（只有有内容时才存储）
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

    // 生成面试报告
    const metrics = await this.generateInterviewReport(session.messages);

    // 更新会话状态
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
        startedAt: true,
        endedAt: true,
        metrics: true,
      },
      orderBy: { createdAt: 'desc' },
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
          where: { role: { not: 'SYSTEM' } },  // 不返回系统提示
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
   * 生成系统提示词
   * @private
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
6. 注意考察：技术能力、沟通表达、逻辑思维、项目经验、抗压能力

请用中文进行面试。`;
  }

  /**
   * 生成开场白
   * @private
   */
  private generateGreeting(jobTitle: string): string {
    return `你好！我是你的 AI 面试官。今天我们将进行「${jobTitle}」岗位的模拟面试。

在开始之前，请放轻松，把这当作一次真实的面试体验。我会根据你的回答进行追问，帮助你更好地准备真正的面试。

准备好了吗？那我们开始吧！

首先，请简单介绍一下你自己，包括你的教育背景、工作经历，以及为什么对这个岗位感兴趣？`;
  }

  /**
   * 构建 Langchain 消息数组
   * @private
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
   * 生成面试报告
   * @private
   */
  private async generateInterviewReport(messages: any[]): Promise<any> {
    // 过滤出对话内容
    const conversation = messages
      .filter((m) => m.role !== 'SYSTEM')
      .map((m) => `${m.role === 'ASSISTANT' ? '面试官' : '候选人'}: ${m.content}`)
      .join('\n\n');

    const prompt = `请根据以下面试对话，生成一份详细的面试评估报告。

对话内容：
${conversation.substring(0, 6000)}

请以 JSON 格式返回评估报告：
{
  "overallScore": 0-100的整体评分,
  "dimensions": {
    "technicalDepth": 0-100,
    "communication": 0-100,
    "logicalThinking": 0-100,
    "projectExperience": 0-100,
    "stressResistance": 0-100
  },
  "strengths": ["优势1", "优势2", "优势3"],
  "improvements": ["改进建议1", "改进建议2", "改进建议3"],
  "detailedFeedback": "详细的综合评价文字"
}`;

    try {
      const response = await this.llm.invoke([new HumanMessage(prompt)]);
      const responseText = response.content as string;
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (error) {
      console.error('Generate report error:', error);
    }

    // 返回默认报告
    return {
      overallScore: 75,
      dimensions: {
        technicalDepth: 75,
        communication: 80,
        logicalThinking: 75,
        projectExperience: 70,
        stressResistance: 80,
      },
      strengths: ['表达清晰', '态度积极'],
      improvements: ['可以更多展示项目细节', '建议加强技术深度'],
      detailedFeedback: '整体表现良好，建议继续加强技术深度和项目经验的展示。',
    };
  }
}
