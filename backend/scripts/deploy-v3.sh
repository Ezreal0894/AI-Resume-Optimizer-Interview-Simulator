#!/bin/bash

# 🚀 Mock Interview Wizard v3.0 - 快速部署脚本
# 用途：自动执行数据库 migration 和服务重启

set -e  # 遇到错误立即退出

echo "========================================="
echo "🚀 Mock Interview Wizard v3.0 部署开始"
echo "========================================="
echo ""

# Step 1: 检查环境
echo "📋 Step 1: 检查环境变量..."
if [ -z "$DATABASE_URL" ]; then
  echo "❌ 错误：DATABASE_URL 环境变量未设置"
  echo "请在 .env 文件中配置 DATABASE_URL"
  exit 1
fi
echo "✅ 环境变量检查通过"
echo ""

# Step 2: 生成 Prisma Client
echo "🔧 Step 2: 生成 Prisma Client..."
npx prisma generate
echo "✅ Prisma Client 生成完成"
echo ""

# Step 3: 运行 Migration
echo "🗄️  Step 3: 运行数据库 Migration..."
npx prisma migrate deploy
echo "✅ Migration 应用完成"
echo ""

# Step 4: 验证数据库结构
echo "🔍 Step 4: 验证数据库结构..."
npx prisma migrate status
echo ""

# Step 5: 构建项目
echo "🏗️  Step 5: 构建 NestJS 项目..."
npm run build
echo "✅ 项目构建完成"
echo ""

# Step 6: 提示重启服务
echo "========================================="
echo "✅ 部署完成！"
echo "========================================="
echo ""
echo "📝 下一步操作："
echo "1. 重启后端服务："
echo "   开发环境: npm run start:dev"
echo "   生产环境: npm run start:prod"
echo ""
echo "2. 验证 API："
echo "   curl -X POST http://localhost:3000/api/interview/session \\"
echo "     -H 'Authorization: Bearer YOUR_TOKEN' \\"
echo "     -H 'Content-Type: application/json' \\"
echo "     -d '{\"mode\":\"TOPIC\",\"jobTitle\":\"Frontend Developer\",\"difficulty\":\"MEDIUM\",\"topics\":[\"React\"]}'"
echo ""
echo "3. 打开 Prisma Studio 查看数据："
echo "   npx prisma studio"
echo ""
echo "🎉 Mock Interview Wizard v3.0 已准备就绪！"
