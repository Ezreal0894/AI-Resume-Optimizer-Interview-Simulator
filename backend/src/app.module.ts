/**
 * 根模块 - 组织所有功能模块
 */
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { ResumeModule } from './resume/resume.module';
import { InterviewModule } from './interview/interview.module';

@Module({
  imports: [
    // 全局配置模块
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    
    // 数据库模块
    PrismaModule,
    
    // 业务模块
    AuthModule,
    ResumeModule,
    InterviewModule,
  ],
})
export class AppModule {}
