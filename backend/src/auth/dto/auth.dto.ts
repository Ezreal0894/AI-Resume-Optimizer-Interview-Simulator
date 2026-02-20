/**
 * 认证相关 DTO（数据传输对象）
 * 使用 class-validator 进行请求参数验证
 */
import { IsEmail, IsString, MinLength, MaxLength, IsOptional } from 'class-validator';

/**
 * 注册 DTO
 */
export class RegisterDto {
  @IsEmail({}, { message: '请输入有效的邮箱地址' })
  email: string;

  @IsString()
  @MinLength(8, { message: '密码至少需要 8 个字符' })
  @MaxLength(32, { message: '密码最多 32 个字符' })
  password: string;

  @IsOptional()
  @IsString()
  @MaxLength(50, { message: '姓名最多 50 个字符' })
  name?: string;
}

/**
 * 登录 DTO
 */
export class LoginDto {
  @IsEmail({}, { message: '请输入有效的邮箱地址' })
  email: string;

  @IsString()
  @MinLength(1, { message: '请输入密码' })
  password: string;
}
