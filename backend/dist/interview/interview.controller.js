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
exports.InterviewController = void 0;
const common_1 = require("@nestjs/common");
const rxjs_1 = require("rxjs");
const interview_service_1 = require("./interview.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
const interview_dto_1 = require("./dto/interview.dto");
let InterviewController = class InterviewController {
    constructor(interviewService) {
        this.interviewService = interviewService;
    }
    async createSession(dto, userId) {
        const result = await this.interviewService.createSession(dto, userId);
        return {
            message: '面试会话已创建',
            data: result,
        };
    }
    streamChatPost(sessionId, dto, userId) {
        return this.interviewService
            .streamChat(sessionId, dto.messages, userId)
            .pipe((0, rxjs_1.map)((event) => ({
            data: event.data,
            type: event.type,
        })));
    }
    async endSession(sessionId, userId) {
        const result = await this.interviewService.endSession(sessionId, userId);
        return {
            message: '面试已结束，报告已生成',
            data: result,
        };
    }
    async getHistoryTrend(userId) {
        const trend = await this.interviewService.getHistoryTrend(userId);
        return {
            data: trend,
        };
    }
    async getSessions(userId) {
        const sessions = await this.interviewService.getUserSessions(userId);
        return {
            data: sessions,
        };
    }
    async getSessionDetail(sessionId, userId) {
        const session = await this.interviewService.getSessionDetail(sessionId, userId);
        return {
            data: session,
        };
    }
    async togglePin(sessionId, userId) {
        const session = await this.interviewService.togglePin(sessionId, userId);
        return {
            data: session,
        };
    }
    async deleteSession(sessionId, userId) {
        await this.interviewService.deleteSession(sessionId, userId);
        return {
            message: '面试记录已删除',
        };
    }
};
exports.InterviewController = InterviewController;
__decorate([
    (0, common_1.Post)('session'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [interview_dto_1.CreateSessionDto, String]),
    __metadata("design:returntype", Promise)
], InterviewController.prototype, "createSession", null);
__decorate([
    (0, common_1.Post)('chat/:sessionId/stream'),
    (0, common_1.Sse)(),
    __param(0, (0, common_1.Param)('sessionId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, String]),
    __metadata("design:returntype", rxjs_1.Observable)
], InterviewController.prototype, "streamChatPost", null);
__decorate([
    (0, common_1.Post)('session/:sessionId/end'),
    __param(0, (0, common_1.Param)('sessionId')),
    __param(1, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], InterviewController.prototype, "endSession", null);
__decorate([
    (0, common_1.Get)('history/trend'),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], InterviewController.prototype, "getHistoryTrend", null);
__decorate([
    (0, common_1.Get)('sessions'),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], InterviewController.prototype, "getSessions", null);
__decorate([
    (0, common_1.Get)('session/:sessionId'),
    __param(0, (0, common_1.Param)('sessionId')),
    __param(1, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], InterviewController.prototype, "getSessionDetail", null);
__decorate([
    (0, common_1.Patch)('session/:sessionId/pin'),
    __param(0, (0, common_1.Param)('sessionId')),
    __param(1, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], InterviewController.prototype, "togglePin", null);
__decorate([
    (0, common_1.Delete)('session/:sessionId'),
    __param(0, (0, common_1.Param)('sessionId')),
    __param(1, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], InterviewController.prototype, "deleteSession", null);
exports.InterviewController = InterviewController = __decorate([
    (0, common_1.Controller)('interview'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [interview_service_1.InterviewService])
], InterviewController);
//# sourceMappingURL=interview.controller.js.map