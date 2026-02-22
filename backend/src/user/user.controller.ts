/**
 * 用户控制器
 * 处理 Onboarding、用户信息、积分查询
 */
import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
} from '@nestjs/common';
import { UserService } from './user.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { OnboardingDto } from './dto/user.dto';

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
   * 获取用户信息
   * GET /api/user/profile
   */
  @Get('profile')
  async getProfile(@CurrentUser('id') userId: string) {
    const profile = await this.userService.getUserProfile(userId);

    return {
      data: profile,
    };
  }

  /**
   * 获取积分余额
   * GET /api/user/credits
   */
  @Get('credits')
  async getCredits(@CurrentUser('id') userId: string) {
    const credits = await this.userService.getCredits(userId);

    return {
      data: { credits },
    };
  }
}
