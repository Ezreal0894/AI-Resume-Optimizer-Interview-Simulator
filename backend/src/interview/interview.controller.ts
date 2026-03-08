/**
 * 面试控制器
 * 🔄 v3.0：支持 Resume/Topic 双模式
 */
import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Patch,
  Delete,
  UseGuards,
  Sse,
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
   * SSE 流式对话（POST 方式）
   * POST /api/interview/chat/:sessionId/stream
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
   * 获取历史趋势数据（最近 10 次）
   * GET /api/interview/history/trend
   */
  @Get('history/trend')
  async getHistoryTrend(@CurrentUser('id') userId: string) {
    const trend = await this.interviewService.getHistoryTrend(userId);

    return {
      data: trend,
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

  /**
   * 切换面试会话置顶状态
   * PATCH /api/interview/session/:sessionId/pin
   */
  @Patch('session/:sessionId/pin')
  async togglePin(
    @Param('sessionId') sessionId: string,
    @CurrentUser('id') userId: string,
  ) {
    const session = await this.interviewService.togglePin(sessionId, userId);

    return {
      data: session,
    };
  }

  /**
   * 删除面试会话
   * DELETE /api/interview/session/:sessionId
   */
  @Delete('session/:sessionId')
  async deleteSession(
    @Param('sessionId') sessionId: string,
    @CurrentUser('id') userId: string,
  ) {
    await this.interviewService.deleteSession(sessionId, userId);

    return {
      message: '面试记录已删除',
    };
  }
}
