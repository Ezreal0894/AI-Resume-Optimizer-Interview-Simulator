import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { ResumeAnalysisReport } from './dto/resume.dto';
export declare class ResumeService {
    private readonly prisma;
    private readonly config;
    private llm;
    constructor(prisma: PrismaService, config: ConfigService);
    analyzeResume(file: Express.Multer.File, userId: string, targetRole: string, targetJd?: string): Promise<{
        resume: any;
        analysis: ResumeAnalysisReport;
    }>;
    getUserResumes(userId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.ResumeStatus;
        isPinned: boolean;
        fileName: string;
        fileSize: number;
        targetRole: string | null;
    }[]>;
    getResumeDetail(resumeId: string, userId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        status: import(".prisma/client").$Enums.ResumeStatus;
        isPinned: boolean;
        fileName: string;
        fileSize: number;
        mimeType: string;
        rawContent: string;
        targetRole: string | null;
        targetJd: string | null;
        analysisReport: import("@prisma/client/runtime/library").JsonValue | null;
    }>;
    togglePin(resumeId: string, userId: string): Promise<{
        id: string;
        isPinned: boolean;
    }>;
    private validateFile;
    private parseFileInMemory;
    private analyzeWithRetry;
    private analyzeWithAI;
    private validateAndNormalizeReport;
}
