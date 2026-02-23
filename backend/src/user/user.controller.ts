/**
 * 用户控制器
 * 🔄 v2.1：免费化重构 - 移除积分相关接口
 */
import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UserService } from './user.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { OnboardingDto, UpdateProfileDto, UpdateTagsDto } from './dto/user.dto';

// 头像文件大小限制 800KB
const MAX_AVATAR_SIZE = 800 * 1024;
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/gif'];

@Controller('user')
@UseGuards(JwtAuthGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  /**
   * 保存 Onboarding 标签
   * POST /api/user/onboarding
   */
  @Post('onboarding')
  async saveOnboarding(
    @Body() dto: OnboardingDto,
    @CurrentUser('id') userId: string,
  ) {
    const user = await this.userService.saveOnboardingTags(userId, dto);
    return {
      message: 'Onboarding 完成',
      data: user,
    };
  }

  /**
   * 获取用户完整资料
   * GET /api/user/profile
   */
  @Get('profile')
  async getProfile(@CurrentUser('id') userId: string) {
    const profile = await this.userService.getUserProfile(userId);
    return { data: profile };
  }

  /**
   * 更新用户资料
   * PUT /api/user/profile
   */
  @Put('profile')
  async updateProfile(
    @Body() dto: UpdateProfileDto,
    @CurrentUser('id') userId: string,
  ) {
    const profile = await this.userService.updateProfile(userId, dto);
    return {
      message: '资料更新成功',
      data: profile,
    };
  }


  /**
   * 更新用户标签
   * PUT /api/user/tags
   */
  @Put('tags')
  async updateTags(
    @Body() dto: UpdateTagsDto,
    @CurrentUser('id') userId: string,
  ) {
    const result = await this.userService.updateTags(userId, dto);
    return {
      message: '标签更新成功',
      data: result,
    };
  }

  /**
   * 上传用户头像
   * POST /api/user/avatar
   */
  @Post('avatar')
  @UseInterceptors(FileInterceptor('file'))
  async uploadAvatar(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser('id') userId: string,
  ) {
    if (!file) {
      throw new BadRequestException('请上传头像文件');
    }

    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      throw new BadRequestException('仅支持 JPG、PNG、GIF 格式');
    }

    if (file.size > MAX_AVATAR_SIZE) {
      throw new BadRequestException('文件大小不能超过 800KB');
    }

    // TODO: 实际项目中应上传到云存储（如 S3）
    // 这里简化处理，将文件转为 base64 data URL
    const base64 = file.buffer.toString('base64');
    const avatarUrl = `data:${file.mimetype};base64,${base64}`;

    const result = await this.userService.updateAvatar(userId, avatarUrl);
    return {
      message: '头像上传成功',
      data: result,
    };
  }

  /**
   * 删除用户头像
   * DELETE /api/user/avatar
   */
  @Delete('avatar')
  async deleteAvatar(@CurrentUser('id') userId: string) {
    await this.userService.deleteAvatar(userId);
    return { message: '头像已删除' };
  }

  /**
   * 获取用户最近活动（面试+简历混合）
   * GET /api/user/activity
   * Query: limit (默认 10)
   */
  @Get('activity')
  async getRecentActivity(
    @CurrentUser('id') userId: string,
    @Query('limit') limit?: string,
  ) {
    const maxItems = Math.min(parseInt(limit || '10', 10) || 10, 50);
    const activities = await this.userService.getRecentActivity(userId, maxItems);
    return { data: activities };
  }
}
