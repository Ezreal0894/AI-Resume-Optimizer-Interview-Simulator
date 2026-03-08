-- AlterTable: 添加 extractionData 字段用于缓存提取结果
ALTER TABLE "resumes" ADD COLUMN "extractionData" JSONB;

-- 注释说明
COMMENT ON COLUMN "resumes"."extractionData" IS 'Phase 3: 缓存的简历提取数据 (personalInfo, highlights, knowledgePoints)';
