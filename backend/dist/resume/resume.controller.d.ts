import { ResumeService } from './resume.service';
export declare class ResumeController {
    private readonly resumeService;
    constructor(resumeService: ResumeService);
    analyzeResume(file: Express.Multer.File, targetRole: string, targetJd: string, userId: string): Promise<{
        message: string;
        data: {
            resume: any;
            analysis: import("./dto/resume.dto").ResumeAnalysisReport;
        };
    }>;
    uploadResume(file: Express.Multer.File, userId: string): Promise<{
        message: string;
        data: {
            resume: any;
            analysis: import("./dto/resume.dto").ResumeAnalysisReport;
        };
    }>;
    getResumeList(userId: string): Promise<{
        data: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            status: import(".prisma/client").$Enums.ResumeStatus;
            isPinned: boolean;
            fileName: string;
            fileSize: number;
            targetRole: string | null;
        }[];
    }>;
    getResumeDetail(resumeId: string, userId: string): Promise<{
        data: {
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
        };
    }>;
    togglePin(resumeId: string, userId: string): Promise<{
        data: {
            id: string;
            isPinned: boolean;
        };
    }>;
}
