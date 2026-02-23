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
exports.UserService = exports.CREDIT_COSTS = void 0;
const common_1 = require("@nestjs/common");
const payment_required_exception_1 = require("../common/exceptions/payment-required.exception");
const prisma_service_1 = require("../prisma/prisma.service");
exports.CREDIT_COSTS = {
    RESUME_ANALYSIS: 5,
    INTERVIEW_SESSION: 5,
};
let UserService = class UserService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async saveOnboardingTags(userId, dto) {
        const user = await this.prisma.user.update({
            where: { id: userId },
            data: { tags: dto.tags },
            select: {
                id: true,
                email: true,
                name: true,
                tags: true,
                plan: true,
                credits: true,
            },
        });
        return user;
    }
    async getUserProfile(userId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                name: true,
                title: true,
                bio: true,
                location: true,
                website: true,
                avatar: true,
                tags: true,
                plan: true,
                credits: true,
                createdAt: true,
            },
        });
        if (!user) {
            throw new common_1.NotFoundException('用户不存在');
        }
        return {
            ...user,
            avatarUrl: user.avatar,
        };
    }
    async updateProfile(userId, dto) {
        const user = await this.prisma.user.update({
            where: { id: userId },
            data: {
                name: dto.name,
                title: dto.title,
                bio: dto.bio,
                location: dto.location,
                website: dto.website,
            },
            select: {
                id: true,
                name: true,
                title: true,
                bio: true,
                location: true,
                website: true,
            },
        });
        return user;
    }
    async updateTags(userId, dto) {
        const user = await this.prisma.user.update({
            where: { id: userId },
            data: { tags: dto.tags },
            select: { tags: true },
        });
        return user;
    }
    async updateAvatar(userId, avatarUrl) {
        const user = await this.prisma.user.update({
            where: { id: userId },
            data: { avatar: avatarUrl },
            select: { avatar: true },
        });
        return { avatarUrl: user.avatar };
    }
    async deleteAvatar(userId) {
        await this.prisma.user.update({
            where: { id: userId },
            data: { avatar: null },
        });
    }
    async deductCredits(userId, cost, reason) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { credits: true },
        });
        if (!user) {
            throw new common_1.NotFoundException('用户不存在');
        }
        if (user.credits < cost) {
            throw new payment_required_exception_1.PaymentRequiredException(`积分不足，${reason}需要 ${cost} 积分，当前余额 ${user.credits}`);
        }
        const updated = await this.prisma.user.update({
            where: { id: userId },
            data: { credits: { decrement: cost } },
            select: { credits: true },
        });
        return updated.credits;
    }
    async getCredits(userId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { credits: true },
        });
        if (!user) {
            throw new common_1.NotFoundException('用户不存在');
        }
        return user.credits;
    }
    async addCredits(userId, amount) {
        const updated = await this.prisma.user.update({
            where: { id: userId },
            data: { credits: { increment: amount } },
            select: { credits: true },
        });
        return updated.credits;
    }
    async refundCredits(userId, amount, reason) {
        console.log(`Refunding ${amount} credits to user ${userId}: ${reason}`);
        const updated = await this.prisma.user.update({
            where: { id: userId },
            data: { credits: { increment: amount } },
            select: { credits: true },
        });
        return updated.credits;
    }
    async getRecentActivity(userId, limit = 10) {
        const [interviews, resumes] = await Promise.all([
            this.prisma.interviewSession.findMany({
                where: { userId, status: 'COMPLETED' },
                select: {
                    id: true,
                    jobTitle: true,
                    metrics: true,
                    createdAt: true,
                },
                orderBy: { createdAt: 'desc' },
                take: limit,
            }),
            this.prisma.resume.findMany({
                where: { userId, status: 'COMPLETED' },
                select: {
                    id: true,
                    fileName: true,
                    analysisReport: true,
                    createdAt: true,
                },
                orderBy: { createdAt: 'desc' },
                take: limit,
            }),
        ]);
        const interviewActivities = interviews.map((interview) => {
            const metrics = interview.metrics;
            return {
                id: `interview-${interview.id}`,
                type: 'interview',
                title: `${interview.jobTitle} Mock Interview`,
                date: this.formatRelativeDate(interview.createdAt),
                score: metrics?.overallScore || 0,
                sourceId: interview.id,
            };
        });
        const resumeActivities = resumes.map((resume) => {
            const report = resume.analysisReport;
            return {
                id: `resume-${resume.id}`,
                type: 'resume',
                title: `${resume.fileName} Optimization`,
                date: this.formatRelativeDate(resume.createdAt),
                score: report?.overallScore || 0,
                sourceId: resume.id,
            };
        });
        const allActivities = [...interviewActivities, ...resumeActivities]
            .sort((a, b) => {
            const aTime = interviews.find(i => `interview-${i.id}` === a.id)?.createdAt
                || resumes.find(r => `resume-${r.id}` === a.id)?.createdAt
                || new Date(0);
            const bTime = interviews.find(i => `interview-${i.id}` === b.id)?.createdAt
                || resumes.find(r => `resume-${r.id}` === b.id)?.createdAt
                || new Date(0);
            return new Date(bTime).getTime() - new Date(aTime).getTime();
        })
            .slice(0, limit);
        return allActivities;
    }
    formatRelativeDate(date) {
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
exports.UserService = UserService;
exports.UserService = UserService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], UserService);
//# sourceMappingURL=user.service.js.map