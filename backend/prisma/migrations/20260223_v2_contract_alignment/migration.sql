-- ============================================
-- Migration: v2.0 契约对齐
-- 新增字段：isPinned (Resume, InterviewSession)
-- 更新索引：支持文档库聚合查询
-- ============================================

-- Resume 表新增 isPinned 字段
ALTER TABLE "resumes" ADD COLUMN IF NOT EXISTS "isPinned" BOOLEAN NOT NULL DEFAULT false;

-- InterviewSession 表新增 isPinned 字段
ALTER TABLE "interview_sessions" ADD COLUMN IF NOT EXISTS "isPinned" BOOLEAN NOT NULL DEFAULT false;

-- 创建复合索引支持置顶排序查询
CREATE INDEX IF NOT EXISTS "resumes_userId_isPinned_createdAt_idx" ON "resumes"("userId", "isPinned" DESC, "createdAt" DESC);
CREATE INDEX IF NOT EXISTS "interview_sessions_userId_isPinned_createdAt_idx" ON "interview_sessions"("userId", "isPinned" DESC, "createdAt" DESC);
