/**
 * 简历模块
 */
import { Module } from '@nestjs/common';
import { ResumeController } from './resume.controller';
import { ResumeService } from './resume.service';
import { UserModule } from '../user/user.module';

@Module({
  imports: [UserModule],  // 导入 UserModule 以使用积分服务
  controllers: [ResumeController],
  providers: [ResumeService],
})
export class ResumeModule {}
