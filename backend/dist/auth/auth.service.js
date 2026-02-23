"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
const bcrypt = __importStar(require("bcryptjs"));
const prisma_service_1 = require("../prisma/prisma.service");
let AuthService = class AuthService {
    constructor(prisma, jwtService, config) {
        this.prisma = prisma;
        this.jwtService = jwtService;
        this.config = config;
    }
    async register(dto) {
        try {
            const existingUser = await this.prisma.user.findUnique({
                where: { email: dto.email },
            });
            if (existingUser) {
                throw new common_1.ConflictException('该邮箱已被注册');
            }
            const hashedPassword = await bcrypt.hash(dto.password, 12);
            const user = await this.prisma.user.create({
                data: {
                    email: dto.email,
                    password: hashedPassword,
                    name: dto.name,
                },
            });
            return this.generateTokenPair(user);
        }
        catch (error) {
            if (error instanceof common_1.ConflictException)
                throw error;
            console.error('Register error:', error);
            throw new common_1.InternalServerErrorException('注册失败，请稍后重试');
        }
    }
    async login(dto) {
        try {
            const user = await this.prisma.user.findUnique({
                where: { email: dto.email },
            });
            if (!user) {
                throw new common_1.UnauthorizedException('邮箱或密码错误');
            }
            const isPasswordValid = await bcrypt.compare(dto.password, user.password);
            if (!isPasswordValid) {
                throw new common_1.UnauthorizedException('邮箱或密码错误');
            }
            return this.generateTokenPair(user);
        }
        catch (error) {
            if (error instanceof common_1.UnauthorizedException)
                throw error;
            console.error('Login error:', error);
            throw new common_1.InternalServerErrorException('登录失败，请稍后重试');
        }
    }
    async refreshAccessToken(refreshToken) {
        try {
            const payload = await this.verifyRefreshToken(refreshToken);
            const user = await this.prisma.user.findUnique({
                where: { id: payload.sub },
            });
            if (!user || !user.refreshTokenHash) {
                throw new common_1.UnauthorizedException('无效的刷新令牌');
            }
            const isTokenValid = await bcrypt.compare(refreshToken, user.refreshTokenHash);
            if (!isTokenValid) {
                throw new common_1.UnauthorizedException('刷新令牌已失效');
            }
            const accessToken = this.generateAccessToken(user.id, user.email);
            return { accessToken };
        }
        catch (error) {
            if (error instanceof common_1.UnauthorizedException)
                throw error;
            console.error('Refresh token error:', error);
            throw new common_1.UnauthorizedException('刷新令牌无效或已过期');
        }
    }
    async logout(userId) {
        await this.prisma.user.update({
            where: { id: userId },
            data: { refreshTokenHash: null },
        });
    }
    async generateTokenPair(user) {
        const accessToken = this.generateAccessToken(user.id, user.email);
        const refreshToken = this.generateRefreshToken(user.id, user.email);
        const refreshTokenHash = await bcrypt.hash(refreshToken, 10);
        await this.prisma.user.update({
            where: { id: user.id },
            data: { refreshTokenHash },
        });
        return {
            accessToken,
            refreshToken,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                plan: user.plan,
                credits: user.credits,
                tags: user.tags,
            },
        };
    }
    generateAccessToken(userId, email) {
        const payload = {
            sub: userId,
            email,
            type: 'access',
        };
        return this.jwtService.sign(payload, {
            secret: this.config.get('JWT_ACCESS_SECRET'),
            expiresIn: this.config.get('JWT_ACCESS_EXPIRES_IN', '15m'),
        });
    }
    generateRefreshToken(userId, email) {
        const payload = {
            sub: userId,
            email,
            type: 'refresh',
        };
        return this.jwtService.sign(payload, {
            secret: this.config.get('JWT_REFRESH_SECRET'),
            expiresIn: this.config.get('JWT_REFRESH_EXPIRES_IN', '7d'),
        });
    }
    async verifyRefreshToken(token) {
        try {
            const payload = await this.jwtService.verifyAsync(token, {
                secret: this.config.get('JWT_REFRESH_SECRET'),
            });
            if (payload.type !== 'refresh') {
                throw new common_1.UnauthorizedException('无效的令牌类型');
            }
            return payload;
        }
        catch {
            throw new common_1.UnauthorizedException('刷新令牌无效或已过期');
        }
    }
    getRefreshTokenCookieOptions() {
        return {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: 7 * 24 * 60 * 60 * 1000,
        };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        jwt_1.JwtService,
        config_1.ConfigService])
], AuthService);
//# sourceMappingURL=auth.service.js.map