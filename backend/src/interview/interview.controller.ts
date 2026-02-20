/**
 * 面试控制器
 * 处理面试会话创建、SSE 流式对话、会话管理
 */
import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  Sse,
  Query,
  MessageEvent,
} from '@nestjs/common';
import { Observable, map } from 'rxjs';
import { InterviewService, SSEMessageEvent } from './interview.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CreateSessionDto, ChatMessageDto } from './dto/interview.dto';

@Controller('interview')
@UseGuards(JwtAuthGuard)
export class InterviewController {
  constructor(private readonly interviewService: InterviewService) {}

  /**
   * 创建面试会话
   * POST /api/interview/session
   */
  @Post('session')
  async createSession(
    @Body() dto: CreateSessionDto,
    @CurrentUser('id') userId: string,
  ) {
    const result = await this.interviewService.createSession(dto, userId);
    
    return {
      message: '面试会话已创建',
      data: result,
    };
  }

  /**
   * SSE 流式对话
   * GET /api/interview/chat/:sessionId
   * 
   * 使用 @Sse() 装饰器返回 Server-Sent Events 流
   * 前端通过 EventSource 或 fetch 接收流式数据
   */
  @Sse('chat/:sessionId')
  streamChat(
    @Param('sessionId') sessionId: string,
    @Query('messages') messagesJson: string,
    @CurrentUser('id') userId: string,
  ): Observable<MessageEvent> {
    // 解析消息数组（从 Query 参数传入）
    let messages: ChatMessageDto[] = [];
    try {
      messages = JSON.parse(decodeURIComponent(messagesJson));
    } catch {
      messages = [];
    }

    // 调用服务层的流式对话方法
    return this.interviewService
      .streamChat(sessionId, messages, userId)
      .pipe(
        map((event: SSEMessageEvent): MessageEvent => ({
          data: event.data,
          type: event.type,
        })),
      );
  }

  /**
   * POST 方式的流式对话（推荐）
   * POST /api/interview/chat/:sessionId/stream
   * 
   * 相比 GET 方式，POST 可以在 Body 中传递更多数据
   */
  @Post('chat/:sessionId/stream')
  @Sse()
  streamChatPost(
    @Param('sessionId') sessionId: string,
    @Body() dto: { messages: ChatMessageDto[] },
    @CurrentUser('id') userId: string,
  ): Observable<MessageEvent> {
    return this.interviewService
      .streamChat(sessionId, dto.messages, userId)
      .pipe(
        map((event: SSEMessageEvent): MessageEvent => ({
          data: event.data,
          type: event.type,
        })),
      );
  }

  /**
   * 结束面试会话
   * POST /api/interview/session/:sessionId/end
   */
  @Post('session/:sessionId/end')
  async endSession(
    @Param('sessionId') sessionId: string,
    @CurrentUser('id') userId: string,
  ) {
    const result = await this.interviewService.endSession(sessionId, userId);
    
    return {
      message: '面试已结束，报告已生成',
      data: result,
    };
  }

  /**
   * 获取用户面试会话列表
   * GET /api/interview/sessions
   */
  @Get('sessions')
  async getSessions(@CurrentUser('id') userId: string) {
    const sessions = await this.interviewService.getUserSessions(userId);
    
    return {
      data: sessions,
    };
  }

  /**
   * 获取会话详情
   * GET /api/interview/session/:sessionId
   */
  @Get('session/:sessionId')
  async getSessionDetail(
    @Param('sessionId') sessionId: string,
    @CurrentUser('id') userId: string,
  ) {
    const session = await this.interviewService.getSessionDetail(sessionId, userId);
    
    return {
      data: session,
    };
  }
}
