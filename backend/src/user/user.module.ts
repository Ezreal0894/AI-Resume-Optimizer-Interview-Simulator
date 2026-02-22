/**
 * 用户模块
 */
import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';

@Module({
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],  // 导出供其他模块使用（积分扣除）
})
export class UserModule {}
