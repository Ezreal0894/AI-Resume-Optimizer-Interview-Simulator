-- AlterTable
ALTER TABLE "interview_sessions" ADD COLUMN "customKnowledgePoints" TEXT[] DEFAULT ARRAY[]::TEXT[];
