# 🚀 Mock Interview Wizard v3.0 - 快速部署脚本 (Windows PowerShell)
# 用途：自动执行数据库 migration 和服务重启

$ErrorActionPreference = "Stop"  # 遇到错误立即退出

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "🚀 Mock Interview Wizard v3.0 部署开始" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: 检查环境
Write-Host "📋 Step 1: 检查环境变量..." -ForegroundColor Yellow
if (-not $env:DATABASE_URL) {
    Write-Host "❌ 错误：DATABASE_URL 环境变量未设置" -ForegroundColor Red
    Write-Host "请在 .env 文件中配置 DATABASE_URL" -ForegroundColor Red
    exit 1
}
Write-Host "✅ 环境变量检查通过" -ForegroundColor Green
Write-Host ""

# Step 2: 生成 Prisma Client
Write-Host "🔧 Step 2: 生成 Prisma Client..." -ForegroundColor Yellow
npx prisma generate
Write-Host "✅ Prisma Client 生成完成" -ForegroundColor Green
Write-Host ""

# Step 3: 运行 Migration
Write-Host "🗄️  Step 3: 运行数据库 Migration..." -ForegroundColor Yellow
npx prisma migrate deploy
Write-Host "✅ Migration 应用完成" -ForegroundColor Green
Write-Host ""

# Step 4: 验证数据库结构
Write-Host "🔍 Step 4: 验证数据库结构..." -ForegroundColor Yellow
npx prisma migrate status
Write-Host ""

# Step 5: 构建项目
Write-Host "🏗️  Step 5: 构建 NestJS 项目..." -ForegroundColor Yellow
npm run build
Write-Host "✅ 项目构建完成" -ForegroundColor Green
Write-Host ""

# Step 6: 提示重启服务
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "✅ 部署完成！" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📝 下一步操作：" -ForegroundColor Yellow
Write-Host "1. 重启后端服务："
Write-Host "   开发环境: npm run start:dev" -ForegroundColor White
Write-Host "   生产环境: npm run start:prod" -ForegroundColor White
Write-Host ""
Write-Host "2. 验证 API："
Write-Host '   Invoke-WebRequest -Uri "http://localhost:3000/api/interview/session" `' -ForegroundColor White
Write-Host '     -Method POST `' -ForegroundColor White
Write-Host '     -Headers @{"Authorization"="Bearer YOUR_TOKEN";"Content-Type"="application/json"} `' -ForegroundColor White
Write-Host '     -Body ''{"mode":"TOPIC","jobTitle":"Frontend Developer","difficulty":"MEDIUM","topics":["React"]}''' -ForegroundColor White
Write-Host ""
Write-Host "3. 打开 Prisma Studio 查看数据："
Write-Host "   npx prisma studio" -ForegroundColor White
Write-Host ""
Write-Host "🎉 Mock Interview Wizard v3.0 已准备就绪！" -ForegroundColor Green
