/**
 * 简历相关 DTO
 * 🔄 v2.0：高阶 ATS 分析结构
 */
import { IsString, IsOptional, MaxLength } from 'class-validator';

/**
 * 简历分析请求 DTO（multipart/form-data 文本字段）
 */
export class AnalyzeResumeDto {
  @IsString()
  @MaxLength(100)
  targetRole: string;

  @IsOptional()
  @IsString()
  @MaxLength(10000)
  targetJd?: string;
}

/**
 * 🔄 高阶简历分析报告结构（前端契约）
 * 存入 JSONB，返回给前端
 */
export interface ResumeAnalysisReport {
  /** 综合评分 0-100 */
  overallScore: number;

  /** ATS 兼容性分析 */
  atsCompatibility: {
    score: number;
    suggestions: string[];
  };

  /** 关键词分析 */
  keywordAnalysis: {
    matched: string[];
    missing: string[];
  };

  /** 结构分析 */
  structureAnalysis: {
    sections: string[];
    improvements: string[];
  };

  /** 内容优化建议 */
  contentSuggestions: string[];
}
