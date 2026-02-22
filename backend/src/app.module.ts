/**
 * 根模块 - 组织所有功能模块
 * 🔄 v2.0：新增 DocumentModule
 */
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { ResumeModule } from './resume/resume.module';
import { InterviewModule } from './interview/interview.module';
import { DocumentModule } from './document/document.module';

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
    UserModule,
    ResumeModule,
    InterviewModule,
    DocumentModule,
  ],
})
export class AppModule {}
