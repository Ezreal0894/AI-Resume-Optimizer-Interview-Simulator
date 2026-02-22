-- DropIndex
DROP INDEX "interview_sessions_userId_isPinned_createdAt_idx";

-- DropIndex
DROP INDEX "resumes_userId_isPinned_createdAt_idx";

-- CreateIndex
CREATE INDEX "resumes_userId_createdAt_idx" ON "resumes"("userId", "createdAt");
