/**
 * 面试相关 DTO
 * 🔄 v3.0：支持 Resume/Topic 双模式，动态校验规则
 */
import {
  IsString,
  IsOptional,
  IsEnum,
  IsArray,
  ValidateNested,
  MaxLength,
  ValidateIf,
  IsNotEmpty,
  ArrayMinSize,
  ArrayMaxSize,
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * 面试模式枚举
 */
export enum InterviewMode {
  RESUME = 'RESUME',  // 基于简历的深度面试
  TOPIC = 'TOPIC',    // 专项话题盲测
}

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
 * 创建面试会话 DTO（v3.0 重构版）
 * 🎯 核心校验逻辑：
 * - mode === 'RESUME' 时，resumeId 必填，customKnowledgePoints 可选
 * - mode === 'TOPIC' 时，topics 数组必填且不能为空
 */
export class CreateSessionDto {
  @IsEnum(InterviewMode)
  mode: InterviewMode;

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

  // 🔴 Resume 模式：resumeId 必填
  @ValidateIf((o) => o.mode === InterviewMode.RESUME)
  @IsNotEmpty({ message: 'resumeId is required when mode is RESUME' })
  @IsString()
  resumeId?: string;

  // 🆕 Phase 1: 用户确认后的自定义知识点（Resume 模式专用）
  @ValidateIf((o) => o.mode === InterviewMode.RESUME)
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20, { message: 'customKnowledgePoints must not exceed 20 items' })
  @IsString({ each: true })
  @MaxLength(100, { each: true, message: 'Each knowledge point must not exceed 100 characters' })
  customKnowledgePoints?: string[];

  // 🔴 Topic 模式：topics 数组必填且至少 1 个
  @ValidateIf((o) => o.mode === InterviewMode.TOPIC)
  @IsNotEmpty({ message: 'topics is required when mode is TOPIC' })
  @IsArray()
  @ArrayMinSize(1, { message: 'topics must contain at least 1 item' })
  @IsString({ each: true })
  topics?: string[];
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
