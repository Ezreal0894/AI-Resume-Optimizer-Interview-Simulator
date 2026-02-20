/**
 * 面试相关 DTO
 */
import {
  IsString,
  IsOptional,
  IsEnum,
  IsArray,
  ValidateNested,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * 面试难度枚举
 */
export enum InterviewDifficulty {
  EASY = 'EASY',
  MEDIUM = 'MEDIUM',
  HARD = 'HARD',
  EXPERT = 'EXPERT',
}

/**
 * 创建面试会话 DTO
 */
export class CreateSessionDto {
  @IsString()
  @MaxLength(100)
  jobTitle: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  jobDescription?: string;

  @IsOptional()
  @IsEnum(InterviewDifficulty)
  difficulty?: InterviewDifficulty;
}

/**
 * 对话消息 DTO
 */
export class ChatMessageDto {
  @IsEnum(['system', 'assistant', 'user'])
  role: 'system' | 'assistant' | 'user';

  @IsString()
  @MaxLength(10000)
  content: string;
}

/**
 * 发送消息 DTO
 */
export class SendMessageDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ChatMessageDto)
  messages: ChatMessageDto[];
}
