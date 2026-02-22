/**
 * 认证服务
 * 核心功能：双 Token 签发、刷新、验证
 */
import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto, LoginDto } from './dto/auth.dto';

// Token Payload 类型定义
export interface JwtPayload {
  sub: string;    // 用户 ID
  email: string;
  type: 'access' | 'refresh';
}

// Token 响应类型
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

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  /**
   * 用户注册
   * @param dto 注册信息
   * @returns Token 响应
   */
  async register(dto: RegisterDto): Promise<TokenResponse> {
    try {
      // 检查邮箱是否已存在
      const existingUser = await this.prisma.user.findUnique({
        where: { email: dto.email },
      });
      
      if (existingUser) {
        throw new ConflictException('该邮箱已被注册');
      }

      // 密码加密（bcrypt salt rounds = 12）
      const hashedPassword = await bcrypt.hash(dto.password, 12);

      // 创建用户
      const user = await this.prisma.user.create({
        data: {
          email: dto.email,
          password: hashedPassword,
          name: dto.name,
        },
      });

      // 生成 Token 对
      return this.generateTokenPair(user);
    } catch (error) {
      if (error instanceof ConflictException) throw error;
      console.error('Register error:', error);
      throw new InternalServerErrorException('注册失败，请稍后重试');
    }
  }

  /**
   * 用户登录
   * @param dto 登录凭证
   * @returns Token 响应
   */
  async login(dto: LoginDto): Promise<TokenResponse> {
    try {
      // 查找用户
      const user = await this.prisma.user.findUnique({
        where: { email: dto.email },
      });

      if (!user) {
        throw new UnauthorizedException('邮箱或密码错误');
      }

      // 验证密码
      const isPasswordValid = await bcrypt.compare(dto.password, user.password);
      if (!isPasswordValid) {
        throw new UnauthorizedException('邮箱或密码错误');
      }

      // 生成 Token 对
      return this.generateTokenPair(user);
    } catch (error) {
      if (error instanceof UnauthorizedException) throw error;
      console.error('Login error:', error);
      throw new InternalServerErrorException('登录失败，请稍后重试');
    }
  }

  /**
   * 刷新 Access Token
   * @param refreshToken 从 Cookie 中获取的 Refresh Token
   * @returns 新的 Access Token
   */
  async refreshAccessToken(refreshToken: string): Promise<{ accessToken: string }> {
    try {
      // 验证 Refresh Token
      const payload = await this.verifyRefreshToken(refreshToken);
      
      // 查找用户并验证 Token Hash
      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
      });

      if (!user || !user.refreshTokenHash) {
        throw new UnauthorizedException('无效的刷新令牌');
      }

      // 验证 Token Hash（防止 Token 被撤销后继续使用）
      const isTokenValid = await bcrypt.compare(refreshToken, user.refreshTokenHash);
      if (!isTokenValid) {
        throw new UnauthorizedException('刷新令牌已失效');
      }

      // 生成新的 Access Token
      const accessToken = this.generateAccessToken(user.id, user.email);
      
      return { accessToken };
    } catch (error) {
      if (error instanceof UnauthorizedException) throw error;
      console.error('Refresh token error:', error);
      throw new UnauthorizedException('刷新令牌无效或已过期');
    }
  }

  /**
   * 登出 - 清除 Refresh Token
   * @param userId 用户 ID
   */
  async logout(userId: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshTokenHash: null },
    });
  }

  /**
   * 生成 Token 对（Access + Refresh）
   * @private
   */
  private async generateTokenPair(user: {
    id: string;
    email: string;
    name: string | null;
    plan: string;
    credits: number;
    tags: string[];
  }): Promise<TokenResponse> {
    // 生成 Access Token（短效 15m）
    const accessToken = this.generateAccessToken(user.id, user.email);
    
    // 生成 Refresh Token（长效 7d）
    const refreshToken = this.generateRefreshToken(user.id, user.email);
    
    // 将 Refresh Token Hash 存入数据库（用于验证和撤销）
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

  /**
   * 生成 Access Token
   * @private
   */
  private generateAccessToken(userId: string, email: string): string {
    const payload: JwtPayload = {
      sub: userId,
      email,
      type: 'access',
    };
    
    return this.jwtService.sign(payload, {
      secret: this.config.get<string>('JWT_ACCESS_SECRET'),
      expiresIn: this.config.get<string>('JWT_ACCESS_EXPIRES_IN', '15m'),
    });
  }

  /**
   * 生成 Refresh Token
   * @private
   */
  private generateRefreshToken(userId: string, email: string): string {
    const payload: JwtPayload = {
      sub: userId,
      email,
      type: 'refresh',
    };
    
    return this.jwtService.sign(payload, {
      secret: this.config.get<string>('JWT_REFRESH_SECRET'),
      expiresIn: this.config.get<string>('JWT_REFRESH_EXPIRES_IN', '7d'),
    });
  }

  /**
   * 验证 Refresh Token
   * @private
   */
  private async verifyRefreshToken(token: string): Promise<JwtPayload> {
    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token, {
        secret: this.config.get<string>('JWT_REFRESH_SECRET'),
      });
      
      if (payload.type !== 'refresh') {
        throw new UnauthorizedException('无效的令牌类型');
      }
      
      return payload;
    } catch {
      throw new UnauthorizedException('刷新令牌无效或已过期');
    }
  }

  /**
   * 获取 Refresh Token Cookie 配置
   */
  getRefreshTokenCookieOptions() {
    return {
      httpOnly: true,                    // 防止 XSS 攻击
      secure: process.env.NODE_ENV === 'production',  // 生产环境强制 HTTPS
      sameSite: 'lax' as const,          // CSRF 防护
      path: '/',                         // Cookie 路径
      maxAge: 7 * 24 * 60 * 60 * 1000,   // 7 天（毫秒）
    };
  }
}
