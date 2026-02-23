import { PrismaService } from '../prisma/prisma.service';
import { OnboardingDto, UpdateProfileDto, UpdateTagsDto } from './dto/user.dto';
export declare const CREDIT_COSTS: {
    RESUME_ANALYSIS: number;
    INTERVIEW_SESSION: number;
};
export declare class UserService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    saveOnboardingTags(userId: string, dto: OnboardingDto): Promise<{
        id: string;
        email: string;
        name: string | null;
        tags: string[];
        plan: import(".prisma/client").$Enums.UserPlan;
        credits: number;
    }>;
    getUserProfile(userId: string): Promise<{
        avatarUrl: string | null;
        id: string;
        email: string;
        name: string | null;
        title: string | null;
        bio: string | null;
        location: string | null;
        website: string | null;
        avatar: string | null;
        tags: string[];
        plan: import(".prisma/client").$Enums.UserPlan;
        credits: number;
        createdAt: Date;
    }>;
    updateProfile(userId: string, dto: UpdateProfileDto): Promise<{
        id: string;
        name: string | null;
        title: string | null;
        bio: string | null;
        location: string | null;
        website: string | null;
    }>;
    updateTags(userId: string, dto: UpdateTagsDto): Promise<{
        tags: string[];
    }>;
    updateAvatar(userId: string, avatarUrl: string): Promise<{
        avatarUrl: string | null;
    }>;
    deleteAvatar(userId: string): Promise<void>;
    deductCredits(userId: string, cost: number, reason: string): Promise<number>;
    getCredits(userId: string): Promise<number>;
    addCredits(userId: string, amount: number): Promise<number>;
    refundCredits(userId: string, amount: number, reason: string): Promise<number>;
    getRecentActivity(userId: string, limit?: number): Promise<({
        id: string;
        type: "interview";
        title: string;
        date: string;
        score: any;
        sourceId: string;
    } | {
        id: string;
        type: "resume";
        title: string;
        date: string;
        score: any;
        sourceId: string;
    })[]>;
    private formatRelativeDate;
}
