import { PrismaService } from '../prisma/prisma.service';
import { OnboardingDto, UpdateProfileDto, UpdateTagsDto } from './dto/user.dto';
export declare class UserService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    saveOnboardingTags(userId: string, dto: OnboardingDto): Promise<{
        email: string;
        name: string | null;
        id: string;
        tags: string[];
        plan: import(".prisma/client").$Enums.UserPlan;
    }>;
    getUserProfile(userId: string): Promise<{
        avatarUrl: string | null;
        email: string;
        name: string | null;
        id: string;
        title: string | null;
        bio: string | null;
        location: string | null;
        website: string | null;
        avatar: string | null;
        tags: string[];
        plan: import(".prisma/client").$Enums.UserPlan;
        createdAt: Date;
    }>;
    updateProfile(userId: string, dto: UpdateProfileDto): Promise<{
        name: string | null;
        id: string;
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
