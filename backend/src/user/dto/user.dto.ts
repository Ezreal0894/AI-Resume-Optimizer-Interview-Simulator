/**
 * 用户相关 DTO
 */
import { IsArray, IsString, IsOptional, ArrayMaxSize, ArrayMinSize, MaxLength, IsUrl } from 'class-validator';

/**
 * Onboarding 标签保存 DTO
 * POST /api/user/onboarding
 */
export class OnboardingDto {
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1, { message: '请至少选择一个标签' })
  @ArrayMaxSize(10, { message: '最多选择 10 个标签' })
  @MaxLength(50, { each: true, message: '单个标签最多 50 个字符' })
  tags: string[];
}

/**
 * 更新用户资料 DTO
 * PUT /api/user/profile
 */
export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  bio?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  location?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  website?: string;
}

/**
 * 更新用户标签 DTO
 * PUT /api/user/tags
 */
export class UpdateTagsDto {
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(10, { message: '最多选择 10 个标签' })
  @MaxLength(50, { each: true, message: '单个标签最多 50 个字符' })
  tags: string[];
}
