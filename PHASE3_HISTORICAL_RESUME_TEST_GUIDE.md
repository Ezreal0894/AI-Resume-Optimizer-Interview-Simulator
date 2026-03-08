# Phase 3: Historical Resume Extraction - Test Guide

## 🎯 Feature Overview

This feature implements **database-level caching** for resume extraction, enabling instant responses when users select historical resumes.

### Key Benefits:
- **First extraction**: AI processes the resume (~10-30 seconds)
- **Subsequent extractions**: Instant response from cache (<1 second)
- **Cost savings**: No repeated AI calls for the same resume
- **Better UX**: No loading screen on cache hit

---

## 🏗️ Implementation Details

### Backend Changes

1. **Database Schema** (`backend/prisma/schema.prisma`)
   - Added `extractionData` JSONB field to `Resume` model
   - Stores: `personalInfo`, `highlights`, `knowledgePoints`, `extractedAt`, `targetRole`

2. **Resume Service** (`backend/src/resume/resume.service.ts`)
   - `extractResumeStructured()` now supports two modes:
     - **Mode 1**: Historical resume (resumeId) - reads from cache or extracts from rawContent
     - **Mode 2**: New file upload - full extraction + caching
   - Cache structure:
     ```json
     {
       "personalInfo": { "name": "...", "role": "...", "yearsOfExperience": 5 },
       "highlights": ["...", "..."],
       "knowledgePoints": ["React", "Node.js", "..."],
       "extractedAt": "2026-03-08T...",
       "targetRole": "Frontend Developer"
     }
     ```

3. **Resume Controller** (`backend/src/resume/resume.controller.ts`)
   - `POST /api/resume/extract` accepts both:
     - `file` (multipart/form-data) for new uploads
     - `resumeId` (form field) for historical resumes

### Frontend Changes

1. **API Client** (`frontend/src/api/document.ts`)
   - `extractResume()` now accepts `File | string`
   - Automatically detects mode and sends appropriate request

2. **Wizard Modal** (`frontend/src/components/interview/MockInterviewWizardModal.tsx`)
   - Removed the "historical resume not supported" error
   - Now calls `extractResume(selectedResumeId, userRole)` for historical resumes
   - Cache hit = instant transition to Step 2 (no loading animation)

---

## 🧪 Manual Testing Steps

### Prerequisites
1. Backend running on `http://localhost:3000`
2. Frontend running on `http://localhost:5173`
3. Test account: `test@example.com` / `Test123456`

### Test Scenario 1: New Resume Upload (First Time)

1. **Navigate to Dashboard**
   - Go to `http://localhost:5173/dashboard`
   - Click "Start Mock Interview" button

2. **Upload New Resume**
   - In Step 1, drag & drop a PDF resume or click to upload
   - Wait for upload to complete (green checkmark)
   - Click "Next Step" button

3. **Observe Extraction Process**
   - Should see animated loading screen with messages:
     - "正在通读简历全文..."
     - "正在提炼核心亮点..."
     - "正在构建定制化专属题库..."
   - Duration: ~10-30 seconds (depending on AI response time)

4. **Verify Step 2 Display**
   - Should see Bento Grid layout with:
     - **Personal Info Card** (top-left): Name, role, years of experience
     - **Core Highlights Card** (top-right): 3-5 bullet points
     - **Knowledge Points Section**: Editable pill tags
   - Knowledge points should be pre-filled from AI extraction

5. **Test Knowledge Point Editing**
   - Click "X" on a tag to remove it
   - Click "+ 添加考点" to add a new one
   - Verify deduplication (adding existing point shows alert)
   - Verify length limit (100 chars)
   - Verify count limit (20 points max)

6. **Complete Interview Setup**
   - Select difficulty level
   - Click "🚀 确认知识点，开始定制化面试"
   - Should navigate to interview room

### Test Scenario 2: Historical Resume (Cache Hit)

1. **Navigate to Dashboard**
   - Go to `http://localhost:5173/dashboard`
   - Click "Start Mock Interview" button

2. **Select Historical Resume**
   - In Step 1, click on a previously uploaded resume from the list
   - Should see green checkmark on selected resume
   - Click "Next Step" button

3. **Observe Instant Response** ⚡
   - Should see loading screen briefly (~2.5 seconds minimum for animation)
   - **No AI processing delay** - data comes from cache
   - Total duration should be <3 seconds

4. **Verify Step 2 Display**
   - Should see same Bento Grid layout
   - Data should match the first extraction
   - Knowledge points should be pre-filled

5. **Test Multiple Selections**
   - Go back to Step 1
   - Select different historical resumes
   - Each should load instantly from cache

### Test Scenario 3: Backend API Testing

Run the automated test script:

```powershell
cd backend
./test-phase3-historical-resume.ps1
```

**Expected Output:**
```
Phase 3: Historical Resume Extraction Test
==========================================

Step 1: Login...
Login successful
Token: eyJhbGciOiJIUzI1NiIs...

Step 2: Get resume list...
Found 1 resume(s)
  - ID: cmmhxxx...
    File: my-resume.pdf
    Status: COMPLETED

Testing with resume: cmmhxxx...

Step 3: First extraction (may need AI processing)...
First extraction successful (Duration: 12.34s)

Extraction result:
  Name: John Doe
  Role: Frontend Developer
  Experience: 5 years
  Highlights: 3
  Knowledge Points: 8

  Knowledge Points:
    - React
    - TypeScript
    - Node.js
    - ...

Step 4: Second extraction (testing cache, should be instant)...
Second extraction successful (Duration: 0.23s)
Cache hit! Instant response!

Extraction result (should match first extraction):
  Name: John Doe
  Role: Frontend Developer
  Experience: 5 years
  Highlights: 3
  Knowledge Points: 8

==========================================
All tests passed!

Test Summary:
  - First extraction: 12.34s
  - Second extraction: 0.23s
  - Performance improvement: 98.14%
```

---

## ✅ Success Criteria

### Backend
- [ ] `extractionData` field exists in database
- [ ] First extraction saves data to cache
- [ ] Second extraction reads from cache (no AI call)
- [ ] Cache hit response time < 1 second
- [ ] No TypeScript errors in `resume.service.ts`

### Frontend
- [ ] Historical resume selection works
- [ ] Loading animation shows during extraction
- [ ] Step 2 displays extracted data correctly
- [ ] Knowledge points are editable
- [ ] No TypeScript errors in wizard modal

### User Experience
- [ ] First extraction: 10-30 seconds (acceptable)
- [ ] Cache hit: <3 seconds (instant feel)
- [ ] No error messages for historical resumes
- [ ] Smooth transition between steps
- [ ] Knowledge point editing is intuitive

---

## 🐛 Troubleshooting

### Issue: "简历不存在" error
**Cause**: Resume ID doesn't exist or doesn't belong to user
**Solution**: Check resume list with `GET /api/resume/list`

### Issue: "该简历没有可用的文本内容" error
**Cause**: Resume's `rawContent` field is empty
**Solution**: Re-upload the resume to populate `rawContent`

### Issue: Cache not working (still slow on second extraction)
**Cause**: `extractionData` field not saved properly
**Solution**: 
1. Check Prisma Client was regenerated: `npx prisma generate`
2. Check database migration was applied: `npx prisma migrate status`
3. Verify `extractionData` column exists in database

### Issue: TypeScript errors in backend
**Cause**: Prisma Client not regenerated after schema change
**Solution**: 
```bash
cd backend
npx prisma generate
npm run start:dev
```

---

## 📊 Performance Metrics

### Expected Performance:
- **New upload + extraction**: 10-30 seconds
- **Historical resume (cache hit)**: <1 second
- **Performance improvement**: 90-98%

### Database Impact:
- **Storage per resume**: ~2-5 KB (JSONB)
- **Query performance**: O(1) - direct field access
- **Cache invalidation**: Manual (future enhancement)

---

## 🚀 Future Enhancements

1. **Cache Invalidation**
   - Add `cacheVersion` field
   - Invalidate cache when AI model updates

2. **Partial Cache**
   - Cache individual sections (personalInfo, highlights, knowledgePoints)
   - Allow selective re-extraction

3. **Cache Analytics**
   - Track cache hit rate
   - Monitor cost savings

4. **Multi-Target Role Support**
   - Cache multiple extractions per resume (different target roles)
   - Key: `${resumeId}_${targetRole}`

---

## 📝 Notes

- Cache is stored in PostgreSQL JSONB field (efficient indexing)
- No expiration policy (cache persists indefinitely)
- Cache is user-scoped (no cross-user data leakage)
- Frontend doesn't need to know about caching (transparent)
