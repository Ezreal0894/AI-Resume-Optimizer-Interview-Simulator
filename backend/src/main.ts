/**
 * NestJS 应用入口
 * 配置全局中间件、管道、过滤器
 */
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // 全局前缀
  app.setGlobalPrefix('api');
  
  // Cookie 解析中间件（用于读取 HttpOnly Refresh Token）
  app.use(cookieParser());
  
  // 全局验证管道
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,           // 自动剥离非 DTO 定义的属性
      forbidNonWhitelisted: true, // 存在非白名单属性时抛出错误
      transform: true,           // 自动类型转换
    }),
  );
  
  // CORS 配置（允许前端携带 Cookie）
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,  // 允许携带 Cookie
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  });
  
  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`🚀 Server running on http://localhost:${port}`);
}

bootstrap();
