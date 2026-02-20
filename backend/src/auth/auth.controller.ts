/**
 * 认证控制器
 * 处理注册、登录、Token 刷新、登出
 */
import {
  Controller,
  Post,
  Body,
  Res,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
  UnauthorizedException,
} from '@nestjs/common';
import { Response, Request } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto } from './dto/auth.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';

// Refresh Token Cookie 名称
const REFRESH_TOKEN_COOKIE = 'refresh_token';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * 用户注册
   * POST /api/auth/register
   */
  @Post('register')
  async register(
    @Body() dto: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.register(dto);
    
    // 设置 Refresh Token Cookie
    const cookieOptions = this.authService.getRefreshTokenCookieOptions();
    res.cookie(REFRESH_TOKEN_COOKIE, result.refreshToken, cookieOptions);
    
    return {
      message: '注册成功',
      accessToken: result.accessToken,
      user: result.user,
    };
  }

  /**
   * 用户登录
   * POST /api/auth/login
   */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.login(dto);
    
    // 设置 Refresh Token Cookie
    const cookieOptions = this.authService.getRefreshTokenCookieOptions();
    res.cookie(REFRESH_TOKEN_COOKIE, result.refreshToken, cookieOptions);
    
    return {
      message: '登录成功',
      accessToken: result.accessToken,
      user: result.user,
    };
  }

  /**
   * 刷新 Access Token
   * POST /api/auth/refresh
   * 从 HttpOnly Cookie 中读取 Refresh Token
   */
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Req() req: Request) {
    // 从 Cookie 中获取 Refresh Token
    const refreshToken = req.cookies?.[REFRESH_TOKEN_COOKIE];
    
    if (!refreshToken) {
      throw new UnauthorizedException('未找到刷新令牌');
    }

    const result = await this.authService.refreshAccessToken(refreshToken);
    
    return {
      accessToken: result.accessToken,
    };
  }

  /**
   * 用户登出
   * POST /api/auth/logout
   * 需要 Access Token 认证
   */
  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async logout(
    @CurrentUser('id') userId: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    // 清除数据库中的 Refresh Token Hash
    await this.authService.logout(userId);
    
    // 清除 Cookie
    res.clearCookie(REFRESH_TOKEN_COOKIE, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });

    return { message: '登出成功' };
  }

  /**
   * 获取当前用户信息
   * POST /api/auth/me
   */
  @Post('me')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async getCurrentUser(@CurrentUser() user: any) {
    return { user };
  }
}
