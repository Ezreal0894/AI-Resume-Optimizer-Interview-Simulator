import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto, LoginDto } from './dto/auth.dto';
export interface JwtPayload {
    sub: string;
    email: string;
    type: 'access' | 'refresh';
}
export interface TokenResponse {
    accessToken: string;
    refreshToken: string;
    user: {
        id: string;
        email: string;
        name: string | null;
        plan: string;
        credits: number;
        tags: string[];
    };
}
export declare class AuthService {
    private readonly prisma;
    private readonly jwtService;
    private readonly config;
    constructor(prisma: PrismaService, jwtService: JwtService, config: ConfigService);
    register(dto: RegisterDto): Promise<TokenResponse>;
    login(dto: LoginDto): Promise<TokenResponse>;
    refreshAccessToken(refreshToken: string): Promise<{
        accessToken: string;
    }>;
    logout(userId: string): Promise<void>;
    private generateTokenPair;
    private generateAccessToken;
    private generateRefreshToken;
    private verifyRefreshToken;
    getRefreshTokenCookieOptions(): {
        httpOnly: boolean;
        secure: boolean;
        sameSite: "lax";
        path: string;
        maxAge: number;
    };
}
