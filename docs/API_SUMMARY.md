# API 接口文档摘要

> 🔄 v2.1 免费化版本 - 所有功能免费开放，无积分限制

## 🔐 认证模块 (Auth)

### POST /api/auth/register
注册新用户
```json
Request:
{
  "email": "user@example.com",
  "password": "password123",
  "name": "用户名"
}

Response:
{
  "accessToken": "jwt...",
  "user": {
    "id": "cuid",
    "email": "user@example.com",
    "name": "用户名",
    "plan": "FREE",
    "tags": []
  }
}
```

### POST /api/auth/login
用户登录
```json
Request:
{
  "email": "user@example.com",
  "password": "password123"
}

Response: 同 register
```

### POST /api/auth/logout
用户登出（需认证）

### POST /api/auth/refresh
刷新 Access Token

---

## 👤 用户模块 (User)

### POST /api/user/onboarding
保存 Onboarding 标签（需认证）
```json
Request:
{
  "tags": ["Frontend Dev", "Full Stack", "AI / LLM Engineer"]
}

Response:
{
  "message": "Onboarding 完成",
  "data": {
    "id": "cuid",
    "email": "user@example.com",
    "name": "用户名",
    "tags": ["Frontend Dev", "Full Stack"],
    "plan": "FREE"
  }
}
```

### GET /api/user/profile
获取用户完整资料（需认证）
```json
Response:
{
  "data": {
    "id": "cuid",
    "email": "john.doe@example.com",
    "name": "John Doe",
    "title": "Senior Frontend Engineer",
    "bio": "Passionate about building accessible and performant web applications.",
    "location": "San Francisco, CA",
    "website": "johndoe.dev",
    "avatarUrl": "https://...",
    "tags": ["Frontend Dev", "Full Stack"],
    "plan": "FREE",
    "createdAt": "2026-02-20T..."
  }
}
```

### PUT /api/user/profile
更新用户资料（需认证）
```json
Request:
{
  "name": "John Doe",
  "title": "Senior Frontend Engineer",
  "bio": "Passionate about building accessible and performant web applications.",
  "location": "San Francisco, CA",
  "website": "johndoe.dev"
}

Response:
{
  "message": "资料更新成功",
  "data": {
    "id": "cuid",
    "name": "John Doe",
    "title": "Senior Frontend Engineer",
    "bio": "...",
    "location": "San Francisco, CA",
    "website": "johndoe.dev"
  }
}
```

### PUT /api/user/tags
更新用户职业标签（需认证）
```json
Request:
{
  "tags": ["Frontend Dev", "Full Stack", "AI / LLM Engineer"]
}

Response:
{
  "message": "标签更新成功",
  "data": {
    "tags": ["Frontend Dev", "Full Stack", "AI / LLM Engineer"]
  }
}
```

### POST /api/user/avatar
上传用户头像（需认证）
- Content-Type: multipart/form-data
```
Request (form-data):
- file: 头像文件 (JPG/PNG/GIF, 最大 800KB)

Response:
{
  "message": "头像上传成功",
  "data": {
    "avatarUrl": "https://..."
  }
}
```

### DELETE /api/user/avatar
删除用户头像（需认证）
```json
Response:
{
  "message": "头像已删除"
}
```

### GET /api/user/activity
获取用户最近活动（需认证）
```json
Query:
- limit: 返回数量（默认 10，最大 50）

Response:
{
  "data": [
    {
      "id": "interview-cuid1",
      "type": "interview",
      "title": "Frontend Engineer Mock Interview",
      "date": "Yesterday",
      "score": 88,
      "sourceId": "cuid1"
    },
    {
      "id": "resume-cuid2",
      "type": "resume",
      "title": "Resume_v4.pdf Optimization",
      "date": "2 days ago",
      "score": 92,
      "sourceId": "cuid2"
    }
  ]
}
```

---

## 📁 文档库模块 (Documents)

### GET /api/documents
获取用户文档库（需认证）
```json
Query:
- category: 分类筛选（all | resume | optimized | report，默认 all）

Response:
{
  "data": [
    {
      "id": "resume-cuid1",
      "title": "Senior_Frontend_Resume_v1.pdf",
      "type": "resume",
      "fileType": "pdf",
      "size": "1.2 MB",
      "date": "2 hours ago",
      "tags": [{ "label": "Original", "color": "slate" }],
      "isPinned": false,
      "sourceId": "cuid1",
      "sourceType": "resume",
      "ownerName": "John Doe",
      "aiSummary": "Resume analysis complete. Overall match score: 85%. Key strengths: React experience, TypeScript proficiency."
    }
  ]
}
```

### DELETE /api/documents/:id
删除文档（需认证）

### PATCH /api/documents/:id/pin
切换文档置顶状态（需认证）

---

## 📄 简历模块 (Resume)

### POST /api/resume/analyze
上传并分析简历（需认证，免费）
- Content-Type: multipart/form-data

```
Request (form-data):
- file: 简历文件 (PDF/DOCX, 最大 10MB)
- targetRole: "前端工程师"
- targetJd: "职位描述长文本..."

Response:
{
  "message": "简历分析完成",
  "data": {
    "resume": {
      "id": "cuid",
      "fileName": "resume.pdf",
      "targetRole": "前端工程师",
      "status": "COMPLETED",
      "createdAt": "2026-02-22T..."
    },
    "analysis": {
      "overallScore": 85,
      "atsCompatibility": { "score": 90, "suggestions": ["..."] },
      "keywordAnalysis": { "matched": ["React"], "missing": ["AWS"] },
      "structureAnalysis": { "sections": ["Experience"], "improvements": ["..."] },
      "contentSuggestions": ["量化成果", "添加指标"]
    }
  }
}
```

### GET /api/resume/list
获取简历列表（需认证）

### GET /api/resume/:id
获取简历详情（需认证）

---

## 🎤 面试模块 (Interview)

### POST /api/interview/session
创建面试会话（需认证，免费）

```json
Request:
{
  "jobTitle": "前端工程师",
  "jobDescription": "岗位描述...",
  "difficulty": "MEDIUM"
}

Response:
{
  "message": "面试会话已创建",
  "data": {
    "sessionId": "cuid",
    "greeting": "你好！我是你的 AI 面试官..."
  }
}
```

### POST /api/interview/chat/:sessionId/stream
SSE 流式对话（需认证）

### POST /api/interview/session/:sessionId/end
结束面试并生成报告（需认证）

### GET /api/interview/history/trend
获取历史趋势数据（最近 10 次）

### GET /api/interview/sessions
获取面试会话列表（需认证）

### GET /api/interview/session/:sessionId
获取会话详情（需认证）

---

## ⚠️ 错误码

| 状态码 | 说明 |
|--------|------|
| 400 | 请求参数错误 |
| 401 | 未认证或 Token 过期 |
| 404 | 资源不存在 |
| 409 | 资源冲突（如邮箱已注册） |
| 500 | 服务器内部错误 |
