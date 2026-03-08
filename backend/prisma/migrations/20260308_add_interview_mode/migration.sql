-- AlterTable: Add mode, resumeId, topics to InterviewSession
-- 🔄 v3.0: Support Resume/Topic dual mode

-- Create InterviewMode enum
CREATE TYPE "InterviewMode" AS ENUM ('RESUME', 'TOPIC');

-- Add new columns to interview_sessions table
ALTER TABLE "interview_sessions" 
ADD COLUMN "mode" "InterviewMode" NOT NULL DEFAULT 'RESUME',
ADD COLUMN "resumeId" TEXT,
ADD COLUMN "topics" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Add foreign key constraint for resumeId
ALTER TABLE "interview_sessions" 
ADD CONSTRAINT "interview_sessions_resumeId_fkey" 
FOREIGN KEY ("resumeId") REFERENCES "resumes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Create index for resumeId
CREATE INDEX "interview_sessions_resumeId_idx" ON "interview_sessions"("resumeId");
