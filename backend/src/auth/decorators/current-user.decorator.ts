/**
 * 当前用户装饰器
 * 用于从请求中提取当前登录用户信息
 */
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * @CurrentUser() - 获取完整用户对象
 * @CurrentUser('id') - 获取用户 ID
 * @CurrentUser('email') - 获取用户邮箱
 */
export const CurrentUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;

    // 如果指定了属性名，返回该属性
    if (data) {
      return user?.[data];
    }

    // 否则返回完整用户对象
    return user;
  },
);
