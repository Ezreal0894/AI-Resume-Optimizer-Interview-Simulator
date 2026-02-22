/**
 * 用户相关 DTO
 * 🔄 v2.0：Onboarding 标签严格限制 1-10 个
 */
import { IsArray, IsString, ArrayMaxSize, ArrayMinSize, MaxLength } from 'class-validator';

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
 */
export class UpdateProfileDto {
  @IsString()
  @MaxLength(50)
  name?: string;

  @IsString()
  @MaxLength(100)
  title?: string;
}
