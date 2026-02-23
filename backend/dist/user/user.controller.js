"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const user_service_1 = require("./user.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
const user_dto_1 = require("./dto/user.dto");
const MAX_AVATAR_SIZE = 800 * 1024;
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/gif'];
let UserController = class UserController {
    constructor(userService) {
        this.userService = userService;
    }
    async saveOnboarding(dto, userId) {
        const user = await this.userService.saveOnboardingTags(userId, dto);
        return {
            message: 'Onboarding 完成',
            data: user,
        };
    }
    async getProfile(userId) {
        const profile = await this.userService.getUserProfile(userId);
        return { data: profile };
    }
    async updateProfile(dto, userId) {
        const profile = await this.userService.updateProfile(userId, dto);
        return {
            message: '资料更新成功',
            data: profile,
        };
    }
    async updateTags(dto, userId) {
        const result = await this.userService.updateTags(userId, dto);
        return {
            message: '标签更新成功',
            data: result,
        };
    }
    async uploadAvatar(file, userId) {
        if (!file) {
            throw new common_1.BadRequestException('请上传头像文件');
        }
        if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
            throw new common_1.BadRequestException('仅支持 JPG、PNG、GIF 格式');
        }
        if (file.size > MAX_AVATAR_SIZE) {
            throw new common_1.BadRequestException('文件大小不能超过 800KB');
        }
        const base64 = file.buffer.toString('base64');
        const avatarUrl = `data:${file.mimetype};base64,${base64}`;
        const result = await this.userService.updateAvatar(userId, avatarUrl);
        return {
            message: '头像上传成功',
            data: result,
        };
    }
    async deleteAvatar(userId) {
        await this.userService.deleteAvatar(userId);
        return { message: '头像已删除' };
    }
    async getCredits(userId) {
        const credits = await this.userService.getCredits(userId);
        return { data: { credits } };
    }
    async getRecentActivity(userId, limit) {
        const maxItems = Math.min(parseInt(limit || '10', 10) || 10, 50);
        const activities = await this.userService.getRecentActivity(userId, maxItems);
        return { data: activities };
    }
};
exports.UserController = UserController;
__decorate([
    (0, common_1.Post)('onboarding'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [user_dto_1.OnboardingDto, String]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "saveOnboarding", null);
__decorate([
    (0, common_1.Get)('profile'),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "getProfile", null);
__decorate([
    (0, common_1.Put)('profile'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [user_dto_1.UpdateProfileDto, String]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "updateProfile", null);
__decorate([
    (0, common_1.Put)('tags'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [user_dto_1.UpdateTagsDto, String]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "updateTags", null);
__decorate([
    (0, common_1.Post)('avatar'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file')),
    __param(0, (0, common_1.UploadedFile)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "uploadAvatar", null);
__decorate([
    (0, common_1.Delete)('avatar'),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "deleteAvatar", null);
__decorate([
    (0, common_1.Get)('credits'),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "getCredits", null);
__decorate([
    (0, common_1.Get)('activity'),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "getRecentActivity", null);
exports.UserController = UserController = __decorate([
    (0, common_1.Controller)('user'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [user_service_1.UserService])
], UserController);
//# sourceMappingURL=user.controller.js.map