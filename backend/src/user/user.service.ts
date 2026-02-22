/**
 * 用户服务
 * 核心功能：Onboarding 标签保存、积分管理、用户信息
 */
import { Injectable, NotFoundException } from '@nestjs/common';
import { PaymentRequiredException } from '../common/exceptions/payment-required.exception';
import { PrismaService } from '../prisma/prisma.service';
import { OnboardingDto } from './dto/user.dto';

// 积分消耗配置
export const CREDIT_COSTS = {
  RESUME_ANALYSIS: 5,   // 简历分析扣 5 点
  INTERVIEW_SESSION: 5, // 面试会话扣 5 点
};

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 保存 Onboarding 标签
   */
  async saveOnboardingTags(userId: string, dto: OnboardingDto) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { tags: dto.tags },
      select: {
        id: true,
        email: true,
        name: true,
        tags: true,
        plan: true,
        credits: true,
      },
    });

    return user;
  }

  /**
   * 获取用户信息
   */
  async getUserProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        tags: true,
        plan: true,
        credits: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    return user;
  }

  /**
   * 检查并扣除积分
   * @throws PaymentRequiredException 余额不足时抛出 402 错误
   */
  async deductCredits(userId: string, cost: number, reason: string): Promise<number> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { credits: true },
    });

    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    if (user.credits < cost) {
      throw new PaymentRequiredException(`积分不足，${reason}需要 ${cost} 积分，当前余额 ${user.credits}`);
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { credits: { decrement: cost } },
      select: { credits: true },
    });

    return updated.credits;
  }

  /**
   * 获取用户积分余额
   */
  async getCredits(userId: string): Promise<number> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { credits: true },
    });

    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    return user.credits;
  }

  /**
   * 充值积分（管理接口）
   */
  async addCredits(userId: string, amount: number): Promise<number> {
    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { credits: { increment: amount } },
      select: { credits: true },
    });

    return updated.credits;
  }

  /**
   * 🔄 退还积分（补偿事务）
   * 用于 AI 分析失败时退还已扣除的积分
   */
  async refundCredits(userId: string, amount: number, reason: string): Promise<number> {
    console.log(`Refunding ${amount} credits to user ${userId}: ${reason}`);
    
    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { credits: { increment: amount } },
      select: { credits: true },
    });

    return updated.credits;
  }
}
