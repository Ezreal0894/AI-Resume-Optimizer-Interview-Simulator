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
            fileName: string;
            fileSize: number;
            targetRole: string | null;
            status: import(".prisma/client").$Enums.ResumeStatus;
            isPinned: boolean;
            createdAt: Date;
            updatedAt: Date;
        }[];
    }>;
    getResumeDetail(resumeId: string, userId: string): Promise<{
        data: {
            id: string;
            userId: string;
            fileName: string;
            fileSize: number;
            mimeType: string;
            rawContent: string;
            targetRole: string | null;
            targetJd: string | null;
            analysisReport: import("@prisma/client/runtime/library").JsonValue | null;
            status: import(".prisma/client").$Enums.ResumeStatus;
            isPinned: boolean;
            createdAt: Date;
            updatedAt: Date;
        };
    }>;
    togglePin(resumeId: string, userId: string): Promise<{
        data: {
            id: string;
            isPinned: boolean;
        };
    }>;
}
