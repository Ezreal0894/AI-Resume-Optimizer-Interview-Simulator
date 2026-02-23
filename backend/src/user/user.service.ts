/**
 * 用户服务
 * 🔄 v2.1：免费化重构 - 移除积分系统
 */
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OnboardingDto, UpdateProfileDto, UpdateTagsDto } from './dto/user.dto';

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
      },
    });
    return user;
  }

  /**
   * 获取用户完整资料
   */
  async getUserProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        title: true,
        bio: true,
        location: true,
        website: true,
        avatar: true,
        tags: true,
        plan: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    return {
      ...user,
      avatarUrl: user.avatar,
    };
  }


  /**
   * 更新用户资料
   */
  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        name: dto.name,
        title: dto.title,
        bio: dto.bio,
        location: dto.location,
        website: dto.website,
      },
      select: {
        id: true,
        name: true,
        title: true,
        bio: true,
        location: true,
        website: true,
      },
    });
    return user;
  }

  /**
   * 更新用户标签
   */
  async updateTags(userId: string, dto: UpdateTagsDto) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { tags: dto.tags },
      select: { tags: true },
    });
    return user;
  }

  /**
   * 更新用户头像
   */
  async updateAvatar(userId: string, avatarUrl: string) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { avatar: avatarUrl },
      select: { avatar: true },
    });
    return { avatarUrl: user.avatar };
  }

  /**
   * 删除用户头像
   */
  async deleteAvatar(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { avatar: null },
    });
  }

  /**
   * 获取用户最近活动（面试+简历混合）
   */
  async getRecentActivity(userId: string, limit: number = 10) {
    // 并行查询面试会话和简历
    const [interviews, resumes] = await Promise.all([
      this.prisma.interviewSession.findMany({
        where: { userId, status: 'COMPLETED' },
        select: {
          id: true,
          jobTitle: true,
          metrics: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
      }),
      this.prisma.resume.findMany({
        where: { userId, status: 'COMPLETED' },
        select: {
          id: true,
          fileName: true,
          analysisReport: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
      }),
    ]);

    // 转换为统一格式
    const interviewActivities = interviews.map((interview) => {
      const metrics = interview.metrics as any;
      return {
        id: `interview-${interview.id}`,
        type: 'interview' as const,
        title: `${interview.jobTitle} Mock Interview`,
        date: this.formatRelativeDate(interview.createdAt),
        score: metrics?.overallScore || 0,
        sourceId: interview.id,
      };
    });

    const resumeActivities = resumes.map((resume) => {
      const report = resume.analysisReport as any;
      return {
        id: `resume-${resume.id}`,
        type: 'resume' as const,
        title: `${resume.fileName} Optimization`,
        date: this.formatRelativeDate(resume.createdAt),
        score: report?.overallScore || 0,
        sourceId: resume.id,
      };
    });

    // 合并并按时间排序
    const allActivities = [...interviewActivities, ...resumeActivities]
      .sort((a, b) => {
        // 需要重新获取原始时间进行排序
        const aTime = interviews.find(i => `interview-${i.id}` === a.id)?.createdAt 
          || resumes.find(r => `resume-${r.id}` === a.id)?.createdAt 
          || new Date(0);
        const bTime = interviews.find(i => `interview-${i.id}` === b.id)?.createdAt 
          || resumes.find(r => `resume-${r.id}` === b.id)?.createdAt 
          || new Date(0);
        return new Date(bTime).getTime() - new Date(aTime).getTime();
      })
      .slice(0, limit);

    return allActivities;
  }

  /**
   * 格式化相对日期
   */
  private formatRelativeDate(date: Date): string {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      const hours = Math.floor(diff / (1000 * 60 * 60));
      if (hours === 0) return 'Just now';
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    }
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  }
}
