import { ConfigService } from '@nestjs/config';
import { Observable } from 'rxjs';
import { PrismaService } from '../prisma/prisma.service';
import { UserService } from '../user/user.service';
import { CreateSessionDto, InterviewMetrics, TrendDataPoint } from './dto/interview.dto';
export interface SSEMessageEvent {
    data: string;
    type?: string;
}
interface ChatMessage {
    role: 'system' | 'assistant' | 'user';
    content: string;
}
export declare class InterviewService {
    private readonly prisma;
    private readonly config;
    private readonly userService;
    private llm;
    constructor(prisma: PrismaService, config: ConfigService, userService: UserService);
    createSession(dto: CreateSessionDto, userId: string): Promise<{
        sessionId: string;
        greeting: string;
    }>;
    streamChat(sessionId: string, messages: ChatMessage[], userId: string): Observable<SSEMessageEvent>;
    private executeStreamChat;
    endSession(sessionId: string, userId: string): Promise<{
        sessionId: string;
        metrics: InterviewMetrics;
    }>;
    getHistoryTrend(userId: string): Promise<TrendDataPoint[]>;
    getUserSessions(userId: string): Promise<{
        id: string;
        jobTitle: string;
        difficulty: import(".prisma/client").$Enums.InterviewDifficulty;
        status: import(".prisma/client").$Enums.InterviewStatus;
        isPinned: boolean;
        metrics: import("@prisma/client/runtime/library").JsonValue;
        startedAt: Date;
        endedAt: Date | null;
    }[]>;
    getSessionDetail(sessionId: string, userId: string): Promise<{
        messages: {
            id: string;
            createdAt: Date;
            role: import(".prisma/client").$Enums.MessageRole;
            content: string;
            sessionId: string;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        jobTitle: string;
        jobDescription: string | null;
        difficulty: import(".prisma/client").$Enums.InterviewDifficulty;
        status: import(".prisma/client").$Enums.InterviewStatus;
        isPinned: boolean;
        metrics: import("@prisma/client/runtime/library").JsonValue | null;
        startedAt: Date;
        endedAt: Date | null;
    }>;
    togglePin(sessionId: string, userId: string): Promise<{
        id: string;
        isPinned: boolean;
    }>;
    private generateSystemPrompt;
    private generateGreeting;
    private buildLangchainMessages;
    private generateReportWithRetry;
    private generateInterviewReport;
    private validateAndNormalizeMetrics;
    private getDefaultMetrics;
}
export {};
