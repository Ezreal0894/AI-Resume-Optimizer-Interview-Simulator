"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DocumentService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let DocumentService = class DocumentService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getUserDocuments(userId, category) {
        const [resumes, interviews, user] = await Promise.all([
            this.prisma.resume.findMany({
                where: { userId },
                select: {
                    id: true,
                    fileName: true,
                    fileSize: true,
                    mimeType: true,
                    targetRole: true,
                    status: true,
                    isPinned: true,
                    analysisReport: true,
                    rawContent: true,
                    createdAt: true,
                },
                orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
            }),
            this.prisma.interviewSession.findMany({
                where: { userId, status: 'COMPLETED' },
                select: {
                    id: true,
                    jobTitle: true,
                    difficulty: true,
                    isPinned: true,
                    metrics: true,
                    createdAt: true,
                },
                orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
            }),
            this.prisma.user.findUnique({
                where: { id: userId },
                select: { name: true, email: true },
            }),
        ]);
        const ownerName = user?.name || user?.email?.split('@')[0] || 'You';
        const resumeDocs = resumes.map((resume) => {
            const tags = this.generateResumeTags(resume);
            const isOptimized = resume.status === 'COMPLETED' && resume.analysisReport;
            const report = resume.analysisReport;
            let aiSummary;
            if (report) {
                if (report.summary) {
                    aiSummary = report.summary;
                }
                else if (report.overallScore) {
                    aiSummary = `Resume analysis complete. Overall match score: ${report.overallScore}%. ${report.strengths?.length ? `Key strengths: ${report.strengths.slice(0, 2).join(', ')}.` : ''}`;
                }
            }
            return {
                id: `resume-${resume.id}`,
                title: resume.fileName,
                type: isOptimized ? 'optimized' : 'resume',
                fileType: resume.mimeType.includes('pdf') ? 'pdf' : 'docx',
                size: this.formatFileSize(resume.fileSize),
                date: this.formatDate(resume.createdAt),
                tags,
                isPinned: resume.isPinned,
                sourceId: resume.id,
                sourceType: 'resume',
                ownerName,
                aiSummary,
                rawContent: resume.rawContent,
            };
        });
        const interviewDocs = interviews.map((interview) => {
            const tags = this.generateInterviewTags(interview);
            const metrics = interview.metrics;
            let aiSummary;
            if (metrics) {
                if (metrics.summary) {
                    aiSummary = metrics.summary;
                }
                else if (metrics.overallScore) {
                    aiSummary = `Interview performance score: ${metrics.overallScore}%. ${metrics.feedback ? metrics.feedback : ''}`;
                }
            }
            return {
                id: `interview-${interview.id}`,
                title: `${interview.jobTitle} 面试报告`,
                type: 'report',
                fileType: 'report',
                size: '-',
                date: this.formatDate(interview.createdAt),
                tags,
                isPinned: interview.isPinned,
                sourceId: interview.id,
                sourceType: 'interview',
                ownerName,
                aiSummary,
            };
        });
        let allDocs = [...resumeDocs, ...interviewDocs];
        if (category && category !== 'all') {
            allDocs = allDocs.filter(doc => doc.type === category);
        }
        return allDocs.sort((a, b) => {
            if (a.isPinned !== b.isPinned) {
                return a.isPinned ? -1 : 1;
            }
            return 0;
        });
    }
    async deleteDocument(documentId, userId) {
        const { sourceType, sourceId } = this.parseDocumentId(documentId);
        if (sourceType === 'resume') {
            const resume = await this.prisma.resume.findFirst({
                where: { id: sourceId, userId },
            });
            if (!resume) {
                throw new common_1.NotFoundException('文档不存在');
            }
            await this.prisma.resume.delete({ where: { id: sourceId } });
        }
        else if (sourceType === 'interview') {
            const session = await this.prisma.interviewSession.findFirst({
                where: { id: sourceId, userId },
            });
            if (!session) {
                throw new common_1.NotFoundException('文档不存在');
            }
            await this.prisma.interviewSession.delete({ where: { id: sourceId } });
        }
        else {
            throw new common_1.BadRequestException('无效的文档 ID 格式');
        }
    }
    async toggleDocumentPin(documentId, userId) {
        const { sourceType, sourceId } = this.parseDocumentId(documentId);
        if (sourceType === 'resume') {
            const resume = await this.prisma.resume.findFirst({
                where: { id: sourceId, userId },
            });
            if (!resume) {
                throw new common_1.NotFoundException('文档不存在');
            }
            const updated = await this.prisma.resume.update({
                where: { id: sourceId },
                data: { isPinned: !resume.isPinned },
                select: { id: true, isPinned: true },
            });
            return { id: documentId, isPinned: updated.isPinned };
        }
        else if (sourceType === 'interview') {
            const session = await this.prisma.interviewSession.findFirst({
                where: { id: sourceId, userId },
            });
            if (!session) {
                throw new common_1.NotFoundException('文档不存在');
            }
            const updated = await this.prisma.interviewSession.update({
                where: { id: sourceId },
                data: { isPinned: !session.isPinned },
                select: { id: true, isPinned: true },
            });
            return { id: documentId, isPinned: updated.isPinned };
        }
        else {
            throw new common_1.BadRequestException('无效的文档 ID 格式');
        }
    }
    parseDocumentId(documentId) {
        if (documentId.startsWith('resume-')) {
            return { sourceType: 'resume', sourceId: documentId.replace('resume-', '') };
        }
        else if (documentId.startsWith('interview-')) {
            return { sourceType: 'interview', sourceId: documentId.replace('interview-', '') };
        }
        throw new common_1.BadRequestException('无效的文档 ID 格式，应为 resume-{id} 或 interview-{id}');
    }
    generateResumeTags(resume) {
        const tags = [];
        if (resume.status === 'COMPLETED') {
            const report = resume.analysisReport;
            if (report?.overallScore >= 85) {
                tags.push({ label: 'ATS Ready', color: 'emerald' });
            }
            if (report?.overallScore) {
                tags.push({ label: `Match ${report.overallScore}%`, color: 'indigo' });
            }
        }
        else if (resume.status === 'ANALYZING') {
            tags.push({ label: 'Analyzing', color: 'amber' });
        }
        else if (resume.status === 'FAILED') {
            tags.push({ label: 'Failed', color: 'slate' });
        }
        else {
            tags.push({ label: 'Original', color: 'slate' });
        }
        if (resume.targetRole) {
            tags.push({ label: resume.targetRole, color: 'indigo' });
        }
        return tags.slice(0, 3);
    }
    generateInterviewTags(interview) {
        const tags = [];
        const metrics = interview.metrics;
        if (metrics?.overallScore >= 85) {
            tags.push({ label: 'Excellent', color: 'emerald' });
        }
        else if (metrics?.overallScore >= 70) {
            tags.push({ label: 'Good', color: 'indigo' });
        }
        else if (metrics?.overallScore) {
            tags.push({ label: 'Needs Work', color: 'amber' });
        }
        const difficultyMap = {
            EASY: { label: 'Easy', color: 'slate' },
            MEDIUM: { label: 'Medium', color: 'indigo' },
            HARD: { label: 'Hard', color: 'amber' },
            EXPERT: { label: 'Expert', color: 'emerald' },
        };
        if (interview.difficulty && difficultyMap[interview.difficulty]) {
            tags.push(difficultyMap[interview.difficulty]);
        }
        return tags.slice(0, 3);
    }
    formatFileSize(bytes) {
        if (bytes < 1024)
            return `${bytes} B`;
        if (bytes < 1024 * 1024)
            return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
    }
    formatDate(date) {
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        if (days === 0) {
            const hours = Math.floor(diff / (1000 * 60 * 60));
            if (hours === 0)
                return 'Just now';
            return `${hours} hour${hours > 1 ? 's' : ''} ago`;
        }
        if (days === 1)
            return 'Yesterday';
        if (days < 7)
            return `${days} days ago`;
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
        });
    }
};
exports.DocumentService = DocumentService;
exports.DocumentService = DocumentService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], DocumentService);
//# sourceMappingURL=document.service.js.map