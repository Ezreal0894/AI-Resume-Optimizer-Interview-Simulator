/**
 * JWT 策略
 * 用于验证 Access Token 并提取用户信息
 */
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtPayload } from '../auth.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      // 从 Authorization Header 中提取 Bearer Token
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      // 不忽略过期时间
      ignoreExpiration: false,
      // Access Token 密钥
      secretOrKey: config.get<string>('JWT_ACCESS_SECRET'),
    });
  }

  /**
   * 验证 Token 后的回调
   * 返回值会被注入到 request.user
   * @param payload JWT 解码后的 payload
   */
  async validate(payload: JwtPayload) {
    // 验证 Token 类型
    if (payload.type !== 'access') {
      throw new UnauthorizedException('无效的令牌类型');
    }

    // 查找用户（确保用户仍然存在）
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        email: true,
        name: true,
        plan: true,
        avatar: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('用户不存在');
    }

    // 返回用户信息，将被注入到 request.user
    return user;
  }
}
