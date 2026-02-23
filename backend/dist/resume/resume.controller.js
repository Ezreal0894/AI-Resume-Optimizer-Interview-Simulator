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
exports.ResumeController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const multer_1 = require("multer");
const resume_service_1 = require("./resume.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
const rate_limit_guard_1 = require("../common/guards/rate-limit.guard");
const UPLOAD_CONFIG = {
    MAX_FILE_SIZE: 10 * 1024 * 1024,
    ALLOWED_MIMES: [
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ],
};
let ResumeController = class ResumeController {
    constructor(resumeService) {
        this.resumeService = resumeService;
    }
    async analyzeResume(file, targetRole, targetJd, userId) {
        if (!file) {
            throw new common_1.BadRequestException('请上传简历文件');
        }
        if (!targetRole || targetRole.trim().length === 0) {
            throw new common_1.BadRequestException('请填写目标职位');
        }
        const result = await this.resumeService.analyzeResume(file, userId, targetRole.trim(), targetJd?.trim());
        return {
            message: '简历分析完成',
            data: result,
        };
    }
    async uploadResume(file, userId) {
        if (!file) {
            throw new common_1.BadRequestException('请上传简历文件');
        }
        const result = await this.resumeService.analyzeResume(file, userId, '通用职位', undefined);
        return {
            message: '简历分析完成',
            data: result,
        };
    }
    async getResumeList(userId) {
        const resumes = await this.resumeService.getUserResumes(userId);
        return { data: resumes };
    }
    async getResumeDetail(resumeId, userId) {
        const resume = await this.resumeService.getResumeDetail(resumeId, userId);
        return { data: resume };
    }
    async togglePin(resumeId, userId) {
        const resume = await this.resumeService.togglePin(resumeId, userId);
        return { data: resume };
    }
};
exports.ResumeController = ResumeController;
__decorate([
    (0, common_1.Post)('analyze'),
    (0, common_1.UseGuards)(rate_limit_guard_1.UserRateLimitGuard),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file', {
        storage: (0, multer_1.memoryStorage)(),
        limits: {
            fileSize: UPLOAD_CONFIG.MAX_FILE_SIZE,
            files: 1,
        },
        fileFilter: (req, file, callback) => {
            if (!UPLOAD_CONFIG.ALLOWED_MIMES.includes(file.mimetype)) {
                callback(new common_1.BadRequestException('仅支持 PDF 和 DOCX 格式'), false);
                return;
            }
            if (/[<>:"/\\|?*\x00-\x1f]/.test(file.originalname)) {
                callback(new common_1.BadRequestException('文件名包含非法字符'), false);
                return;
            }
            callback(null, true);
        },
    })),
    __param(0, (0, common_1.UploadedFile)()),
    __param(1, (0, common_1.Body)('targetRole')),
    __param(2, (0, common_1.Body)('targetJd')),
    __param(3, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String]),
    __metadata("design:returntype", Promise)
], ResumeController.prototype, "analyzeResume", null);
__decorate([
    (0, common_1.Post)('upload'),
    (0, common_1.UseGuards)(rate_limit_guard_1.UserRateLimitGuard),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file', {
        storage: (0, multer_1.memoryStorage)(),
        limits: { fileSize: UPLOAD_CONFIG.MAX_FILE_SIZE, files: 1 },
        fileFilter: (req, file, callback) => {
            if (!UPLOAD_CONFIG.ALLOWED_MIMES.includes(file.mimetype)) {
                callback(new common_1.BadRequestException('仅支持 PDF 和 DOCX 格式'), false);
                return;
            }
            callback(null, true);
        },
    })),
    __param(0, (0, common_1.UploadedFile)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], ResumeController.prototype, "uploadResume", null);
__decorate([
    (0, common_1.Get)('list'),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ResumeController.prototype, "getResumeList", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], ResumeController.prototype, "getResumeDetail", null);
__decorate([
    (0, common_1.Patch)(':id/pin'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], ResumeController.prototype, "togglePin", null);
exports.ResumeController = ResumeController = __decorate([
    (0, common_1.Controller)('resume'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [resume_service_1.ResumeService])
], ResumeController);
//# sourceMappingURL=resume.controller.js.map