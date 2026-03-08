import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { ResumeAnalysisReport, ResumeExtractResult } from './dto/resume.dto';
export declare class ResumeService {
    private readonly prisma;
    private readonly config;
    private llm;
    constructor(prisma: PrismaService, config: ConfigService);
    extractResumeStructured(file: Express.Multer.File | null, userId: string, targetRole: string, resumeId?: string): Promise<ResumeExtractResult>;
    private extractWithAI;
    private validateAndNormalizeExtraction;
    analyzeResume(file: Express.Multer.File, userId: string, targetRole: string, targetJd?: string): Promise<{
        resume: any;
        analysis: ResumeAnalysisReport;
    }>;
    getUserResumes(userId: string): Promise<{
        id: string;
        fileName: string;
        fileSize: number;
        targetRole: string | null;
        status: import(".prisma/client").$Enums.ResumeStatus;
        isPinned: boolean;
        createdAt: Date;
        updatedAt: Date;
    }[]>;
    getResumeDetail(resumeId: string, userId: string): Promise<{
        id: string;
        userId: string;
        fileName: string;
        fileSize: number;
        mimeType: string;
        rawContent: string;
        targetRole: string | null;
        targetJd: string | null;
        analysisReport: import("@prisma/client/runtime/library").JsonValue | null;
        extractionData: import("@prisma/client/runtime/library").JsonValue | null;
        status: import(".prisma/client").$Enums.ResumeStatus;
        isPinned: boolean;
        createdAt: Date;
        updatedAt: Date;
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
