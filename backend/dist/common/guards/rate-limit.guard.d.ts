import { CanActivate, ExecutionContext } from '@nestjs/common';
export declare class UserRateLimitGuard implements CanActivate {
    canActivate(context: ExecutionContext): boolean;
}
