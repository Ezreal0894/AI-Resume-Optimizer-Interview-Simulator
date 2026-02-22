/**
 * 用户级别防重复提交 Guard
 * 基于内存的简单限流，防止用户连点导致重复扣费
 */
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
} from '@nestjs/common';

// 用户请求锁（内存存储）
const userLocks = new Map<string, number>();

// 锁定时间（毫秒）
const LOCK_DURATION = 5000;

@Injectable()
export class UserRateLimitGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const userId = request.user?.id;

    if (!userId) {
      return true; // 未认证请求放行，由 JwtAuthGuard 处理
    }

    const lockKey = `${userId}:resume-analyze`;
    const now = Date.now();
    const lastRequest = userLocks.get(lockKey);

    if (lastRequest && now - lastRequest < LOCK_DURATION) {
      throw new HttpException(
        '请求过于频繁，请稍后再试',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    userLocks.set(lockKey, now);

    // 自动清理过期锁（防止内存泄漏）
    setTimeout(() => {
      userLocks.delete(lockKey);
    }, LOCK_DURATION + 1000);

    return true;
  }
}
