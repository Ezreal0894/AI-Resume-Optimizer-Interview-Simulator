/**
 * 面试模块
 */
import { Module } from '@nestjs/common';
import { InterviewController } from './interview.controller';
import { InterviewService } from './interview.service';
import { UserModule } from '../user/user.module';

@Module({
  imports: [UserModule],  // 导入 UserModule 以使用积分服务
  controllers: [InterviewController],
  providers: [InterviewService],
})
export class InterviewModule {}
