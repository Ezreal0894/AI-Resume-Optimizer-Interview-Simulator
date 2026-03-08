# Phase 3: Historical Resume ID Fix

## 🐛 Issue Identified

**Error**: "简历解析失败: 简历不存在"

**Root Cause**: 
- Document library returns resume IDs with prefix: `resume-{id}`
- Backend expects real resume ID without prefix: `{id}`
- Frontend was passing the prefixed ID directly to the API

## ✅ Solution Applied

### Changes Made

**File**: `frontend/src/components/interview/MockInterviewWizardModal.tsx`

#### 1. Fixed `handleNextStep()` - Resume Extraction
```typescript
// Before (❌ Broken)
extractResult = await extractResume(selectedResumeId, userRole);

// After (✅ Fixed)
const realResumeId = selectedResumeId.startsWith('resume-') 
  ? selectedResumeId.replace('resume-', '') 
  : selectedResumeId;
extractResult = await extractResume(realResumeId, userRole);
```

#### 2. Fixed `handleStartInterview()` - Session Creation
```typescript
// Before (❌ Broken)
const payload = {
  mode: 'RESUME',
  resumeId: selectedResumeId!,
  // ...
};

// After (✅ Fixed)
const realResumeId = selectedResumeId 
  ? (selectedResumeId.startsWith('resume-') 
      ? selectedResumeId.replace('resume-', '') 
      : selectedResumeId)
  : null;

const payload = {
  mode: 'RESUME',
  resumeId: realResumeId!,
  // ...
};
```

## 🔍 Why This Happened

The document library service (`backend/src/document/document.service.ts`) aggregates multiple document types:
- Resumes: `resume-{id}`
- Interview reports: `interview-{id}`

This prefix is used for:
1. Distinguishing document types in the UI
2. Routing delete/pin operations to correct service

However, the resume extraction API expects the raw database ID without prefix.

## ✅ Testing

### Manual Test Steps

1. **Navigate to Dashboard**
   ```
   http://localhost:5173/dashboard
   ```

2. **Start Mock Interview**
   - Click "Start Mock Interview" button

3. **Select Historical Resume**
   - In Step 1, click on any resume from the history list
   - Should see green checkmark on selected resume

4. **Click "Next Step"**
   - Should see loading animation
   - Should NOT see "简历不存在" error
   - Should transition to Step 2 with extracted data

5. **Verify Step 2 Display**
   - Personal info card should show name, role, experience
   - Highlights card should show bullet points
   - Knowledge points should be displayed as editable tags

6. **Complete Interview Setup**
   - Select difficulty
   - Click "🚀 确认知识点，开始定制化面试"
   - Should navigate to interview room successfully

### Expected Behavior

#### First Time Selecting a Resume
- Loading: ~10-30 seconds (AI processing)
- Console logs:
  ```
  📤 Extracting from selected resume: resume-cmmhxxx...
  📝 Real resume ID: cmmhxxx...
  ✅ Extract result: { personalInfo, highlights, knowledgePoints }
  ```

#### Second Time Selecting Same Resume
- Loading: <3 seconds (cache hit!)
- Console logs:
  ```
  📤 Extracting from selected resume: resume-cmmhxxx...
  📝 Real resume ID: cmmhxxx...
  [Backend] Cache hit! Returning cached data
  ✅ Extract result: { personalInfo, highlights, knowledgePoints }
  ```

## 🎯 Verification Checklist

- [ ] No "简历不存在" error when selecting historical resume
- [ ] Step 2 displays extracted data correctly
- [ ] Knowledge points are editable
- [ ] Interview session creates successfully
- [ ] Console shows correct resume ID (without prefix)
- [ ] Second selection is faster (cache hit)

## 📝 Related Files

- `frontend/src/components/interview/MockInterviewWizardModal.tsx` - Fixed ID extraction
- `backend/src/document/document.service.ts` - Source of prefixed IDs
- `backend/src/resume/resume.service.ts` - Expects unprefixed IDs
- `backend/src/resume/resume.controller.ts` - API endpoint

## 🚀 Status

- ✅ Issue identified
- ✅ Fix applied
- ✅ TypeScript errors resolved
- ✅ Ready for testing

## 💡 Future Improvement

Consider creating a utility function to handle ID conversion:

```typescript
// utils/documentId.ts
export function extractResumeId(documentId: string): string {
  return documentId.startsWith('resume-') 
    ? documentId.replace('resume-', '') 
    : documentId;
}

export function extractInterviewId(documentId: string): string {
  return documentId.startsWith('interview-') 
    ? documentId.replace('interview-', '') 
    : documentId;
}
```

This would centralize the logic and make it reusable across the codebase.
