/**
 * 简历相关 DTO
 * 🔄 v3.0：新增白盒化提取结构
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
 * 🆕 Phase 1: 白盒化简历提取结果
 */
export interface ResumeExtractResult {
  /** 简历 ID */
  resumeId: string;

  /** 个人信息 */
  personalInfo: {
    name: string;
    role: string;
    yearsOfExperience: number;
  };

  /** 核心亮点（3-5 条）*/
  highlights: string[];

  /** 知识点列表（8-15 个）*/
  knowledgePoints: string[];
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
