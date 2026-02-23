import { MessageEvent } from '@nestjs/common';
import { Observable } from 'rxjs';
import { InterviewService } from './interview.service';
import { CreateSessionDto, ChatMessageDto } from './dto/interview.dto';
export declare class InterviewController {
    private readonly interviewService;
    constructor(interviewService: InterviewService);
    createSession(dto: CreateSessionDto, userId: string): Promise<{
        message: string;
        data: {
            sessionId: string;
            greeting: string;
        };
    }>;
    streamChatPost(sessionId: string, dto: {
        messages: ChatMessageDto[];
    }, userId: string): Observable<MessageEvent>;
    endSession(sessionId: string, userId: string): Promise<{
        message: string;
        data: {
            sessionId: string;
            metrics: import("./dto/interview.dto").InterviewMetrics;
        };
    }>;
    getHistoryTrend(userId: string): Promise<{
        data: import("./dto/interview.dto").TrendDataPoint[];
    }>;
    getSessions(userId: string): Promise<{
        data: {
            id: string;
            jobTitle: string;
            difficulty: import(".prisma/client").$Enums.InterviewDifficulty;
            status: import(".prisma/client").$Enums.InterviewStatus;
            isPinned: boolean;
            metrics: import("@prisma/client/runtime/library").JsonValue;
            startedAt: Date;
            endedAt: Date | null;
        }[];
    }>;
    getSessionDetail(sessionId: string, userId: string): Promise<{
        data: {
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
        };
    }>;
    togglePin(sessionId: string, userId: string): Promise<{
        data: {
            id: string;
            isPinned: boolean;
        };
    }>;
}
