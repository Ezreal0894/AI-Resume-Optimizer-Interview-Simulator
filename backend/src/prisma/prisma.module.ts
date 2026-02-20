/**
 * Prisma 数据库模块
 * 提供全局数据库连接服务
 */
import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global()  // 全局模块，无需在其他模块中重复导入
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
