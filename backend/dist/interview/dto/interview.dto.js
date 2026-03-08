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
Object.defineProperty(exports, "__esModule", { value: true });
exports.SendMessageDto = exports.ChatMessageDto = exports.CreateSessionDto = exports.InterviewDifficulty = exports.InterviewMode = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
var InterviewMode;
(function (InterviewMode) {
    InterviewMode["RESUME"] = "RESUME";
    InterviewMode["TOPIC"] = "TOPIC";
})(InterviewMode || (exports.InterviewMode = InterviewMode = {}));
var InterviewDifficulty;
(function (InterviewDifficulty) {
    InterviewDifficulty["EASY"] = "EASY";
    InterviewDifficulty["MEDIUM"] = "MEDIUM";
    InterviewDifficulty["HARD"] = "HARD";
    InterviewDifficulty["EXPERT"] = "EXPERT";
})(InterviewDifficulty || (exports.InterviewDifficulty = InterviewDifficulty = {}));
class CreateSessionDto {
}
exports.CreateSessionDto = CreateSessionDto;
__decorate([
    (0, class_validator_1.IsEnum)(InterviewMode),
    __metadata("design:type", String)
], CreateSessionDto.prototype, "mode", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(100),
    __metadata("design:type", String)
], CreateSessionDto.prototype, "jobTitle", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(5000),
    __metadata("design:type", String)
], CreateSessionDto.prototype, "jobDescription", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(InterviewDifficulty),
    __metadata("design:type", String)
], CreateSessionDto.prototype, "difficulty", void 0);
__decorate([
    (0, class_validator_1.ValidateIf)((o) => o.mode === InterviewMode.RESUME),
    (0, class_validator_1.IsNotEmpty)({ message: 'resumeId is required when mode is RESUME' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateSessionDto.prototype, "resumeId", void 0);
__decorate([
    (0, class_validator_1.ValidateIf)((o) => o.mode === InterviewMode.RESUME),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ArrayMaxSize)(20, { message: 'customKnowledgePoints must not exceed 20 items' }),
    (0, class_validator_1.IsString)({ each: true }),
    (0, class_validator_1.MaxLength)(100, { each: true, message: 'Each knowledge point must not exceed 100 characters' }),
    __metadata("design:type", Array)
], CreateSessionDto.prototype, "customKnowledgePoints", void 0);
__decorate([
    (0, class_validator_1.ValidateIf)((o) => o.mode === InterviewMode.TOPIC),
    (0, class_validator_1.IsNotEmpty)({ message: 'topics is required when mode is TOPIC' }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ArrayMinSize)(1, { message: 'topics must contain at least 1 item' }),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], CreateSessionDto.prototype, "topics", void 0);
class ChatMessageDto {
}
exports.ChatMessageDto = ChatMessageDto;
__decorate([
    (0, class_validator_1.IsEnum)(['system', 'assistant', 'user']),
    __metadata("design:type", String)
], ChatMessageDto.prototype, "role", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(10000),
    __metadata("design:type", String)
], ChatMessageDto.prototype, "content", void 0);
class SendMessageDto {
}
exports.SendMessageDto = SendMessageDto;
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => ChatMessageDto),
    __metadata("design:type", Array)
], SendMessageDto.prototype, "messages", void 0);
//# sourceMappingURL=interview.dto.js.map