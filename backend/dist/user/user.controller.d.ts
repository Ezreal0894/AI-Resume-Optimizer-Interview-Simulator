import { UserService } from './user.service';
import { OnboardingDto, UpdateProfileDto, UpdateTagsDto } from './dto/user.dto';
export declare class UserController {
    private readonly userService;
    constructor(userService: UserService);
    saveOnboarding(dto: OnboardingDto, userId: string): Promise<{
        message: string;
        data: {
            id: string;
            email: string;
            name: string | null;
            tags: string[];
            plan: import(".prisma/client").$Enums.UserPlan;
            credits: number;
        };
    }>;
    getProfile(userId: string): Promise<{
        data: {
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
        };
    }>;
    updateProfile(dto: UpdateProfileDto, userId: string): Promise<{
        message: string;
        data: {
            id: string;
            name: string | null;
            title: string | null;
            bio: string | null;
            location: string | null;
            website: string | null;
        };
    }>;
    updateTags(dto: UpdateTagsDto, userId: string): Promise<{
        message: string;
        data: {
            tags: string[];
        };
    }>;
    uploadAvatar(file: Express.Multer.File, userId: string): Promise<{
        message: string;
        data: {
            avatarUrl: string | null;
        };
    }>;
    deleteAvatar(userId: string): Promise<{
        message: string;
    }>;
    getCredits(userId: string): Promise<{
        data: {
            credits: number;
        };
    }>;
    getRecentActivity(userId: string, limit?: string): Promise<{
        data: ({
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
        })[];
    }>;
}
