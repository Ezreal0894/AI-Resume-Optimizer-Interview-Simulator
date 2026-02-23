export declare enum InterviewDifficulty {
    EASY = "EASY",
    MEDIUM = "MEDIUM",
    HARD = "HARD",
    EXPERT = "EXPERT"
}
export declare class CreateSessionDto {
    jobTitle: string;
    jobDescription?: string;
    difficulty?: InterviewDifficulty;
}
export declare class ChatMessageDto {
    role: 'system' | 'assistant' | 'user';
    content: string;
}
export declare class SendMessageDto {
    messages: ChatMessageDto[];
}
export interface InterviewMetrics {
    overallScore: number;
    radar: {
        technical: number;
        communication: number;
        problemSolving: number;
        cultureFit: number;
        leadership: number;
    };
    feedback: {
        strengths: string[];
        improvements: string[];
    };
}
export interface TrendDataPoint {
    sessionId: string;
    overallScore: number;
    createdAt: Date;
}
