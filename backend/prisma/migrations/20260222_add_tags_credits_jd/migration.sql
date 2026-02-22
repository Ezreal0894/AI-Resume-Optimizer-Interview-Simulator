-- 🔄 后端重构迁移：添加 tags、credits、targetRole、targetJd 字段

-- 1. 用户表：添加 tags 数组和 credits 积分字段
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "tags" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "credits" INTEGER NOT NULL DEFAULT 50;

-- 2. 简历表：添加 targetRole 和 targetJd 字段
ALTER TABLE "resumes" ADD COLUMN IF NOT EXISTS "targetRole" TEXT;
ALTER TABLE "resumes" ADD COLUMN IF NOT EXISTS "targetJd" TEXT;

-- 3. 面试会话表：添加复合索引支持历史趋势查询
CREATE INDEX IF NOT EXISTS "interview_sessions_userId_createdAt_idx" ON "interview_sessions"("userId", "createdAt");
