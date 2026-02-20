/**
 * JWT 认证守卫
 * 用于保护需要认证的路由
 */
import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Observable } from 'rxjs';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  /**
   * 判断是否可以激活路由
   */
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    // 调用父类的 canActivate 方法进行 JWT 验证
    return super.canActivate(context);
  }

  /**
   * 处理认证请求
   * 可以在这里自定义错误消息
   */
  handleRequest<TUser = any>(
    err: any,
    user: TUser,
    info: any,
    context: ExecutionContext,
  ): TUser {
    // 如果有错误或用户不存在，抛出未授权异常
    if (err || !user) {
      // 根据不同的错误类型返回不同的消息
      if (info?.name === 'TokenExpiredError') {
        throw new UnauthorizedException('令牌已过期，请重新登录');
      }
      if (info?.name === 'JsonWebTokenError') {
        throw new UnauthorizedException('无效的令牌');
      }
      throw new UnauthorizedException('请先登录');
    }
    
    return user;
  }
}
