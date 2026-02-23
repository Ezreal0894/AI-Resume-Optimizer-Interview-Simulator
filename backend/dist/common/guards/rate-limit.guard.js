"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserRateLimitGuard = void 0;
const common_1 = require("@nestjs/common");
const userLocks = new Map();
const LOCK_DURATION = 5000;
let UserRateLimitGuard = class UserRateLimitGuard {
    canActivate(context) {
        const request = context.switchToHttp().getRequest();
        const userId = request.user?.id;
        if (!userId) {
            return true;
        }
        const lockKey = `${userId}:resume-analyze`;
        const now = Date.now();
        const lastRequest = userLocks.get(lockKey);
        if (lastRequest && now - lastRequest < LOCK_DURATION) {
            throw new common_1.HttpException('请求过于频繁，请稍后再试', common_1.HttpStatus.TOO_MANY_REQUESTS);
        }
        userLocks.set(lockKey, now);
        setTimeout(() => {
            userLocks.delete(lockKey);
        }, LOCK_DURATION + 1000);
        return true;
    }
};
exports.UserRateLimitGuard = UserRateLimitGuard;
exports.UserRateLimitGuard = UserRateLimitGuard = __decorate([
    (0, common_1.Injectable)()
], UserRateLimitGuard);
//# sourceMappingURL=rate-limit.guard.js.map