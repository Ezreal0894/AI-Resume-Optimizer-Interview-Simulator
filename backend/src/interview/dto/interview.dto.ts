/**
 * 面试相关 DTO
 * 🔄 v2.0：前端契约对齐的雷达图 5 维度
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
  @MaxLength(5000)
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

/**
 * 🔄 面试报告结构（前端契约对齐）
 * 雷达图 5 维度：technical, communication, problemSolving, cultureFit, leadership
 */
export interface InterviewMetrics {
  /** 综合评分 0-100 */
  overallScore: number;

  /** 雷达图 5 维度（前端契约命名） */
  radar: {
    technical: number;       // 技术深度
    communication: number;   // 沟通表达
    problemSolving: number;  // 问题解决
    cultureFit: number;      // 文化契合
    leadership: number;      // 领导力
  };

  /** 反馈（前端契约命名） */
  feedback: {
    strengths: string[];     // 优势
    improvements: string[];  // 待改进（非 weaknesses）
  };
}

/**
 * 历史趋势数据点
 */
export interface TrendDataPoint {
  sessionId: string;
  overallScore: number;
  createdAt: Date;
}
