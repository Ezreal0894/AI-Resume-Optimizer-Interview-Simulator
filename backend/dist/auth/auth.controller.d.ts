import { Response, Request } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto } from './dto/auth.dto';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    register(dto: RegisterDto, res: Response): Promise<{
        message: string;
        accessToken: string;
        user: {
            id: string;
            email: string;
            name: string | null;
            plan: string;
            credits: number;
            tags: string[];
        };
    }>;
    login(dto: LoginDto, res: Response): Promise<{
        message: string;
        accessToken: string;
        user: {
            id: string;
            email: string;
            name: string | null;
            plan: string;
            credits: number;
            tags: string[];
        };
    }>;
    refresh(req: Request): Promise<{
        accessToken: string;
    }>;
    logout(userId: string, res: Response): Promise<{
        message: string;
    }>;
    getCurrentUser(user: any): Promise<{
        user: any;
    }>;
}
