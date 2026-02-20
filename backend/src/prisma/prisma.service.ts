/**
 * Prisma 服务
 * 管理数据库连接生命周期
 */
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    super({
      log: process.env.NODE_ENV === 'development' 
        ? ['query', 'info', 'warn', 'error'] 
        : ['error'],
    });
  }

  /**
   * 模块初始化时连接数据库
   */
  async onModuleInit() {
    await this.$connect();
    console.log('✅ Database connected');
  }

  /**
   * 模块销毁时断开连接
   */
  async onModuleDestroy() {
    await this.$disconnect();
    console.log('🔌 Database disconnected');
  }
}
