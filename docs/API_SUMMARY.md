# API 接口文档摘要

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
    "credits": 50,
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
    "plan": "FREE",
    "credits": 50
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
    "credits": 50,
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

### GET /api/user/credits
获取积分余额（需认证）

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
    },
    {
      "id": "interview-cuid2",
      "title": "Frontend Engineer 面试报告",
      "type": "report",
      "fileType": "report",
      "size": "-",
      "date": "Yesterday",
      "tags": [{ "label": "Excellent", "color": "emerald" }],
      "isPinned": true,
      "sourceId": "cuid2",
      "sourceType": "interview",
      "ownerName": "John Doe",
      "aiSummary": "Interview performance score: 88%. Strong communication skills and technical knowledge demonstrated."
    }
  ]
}
```

### DELETE /api/documents/:id
删除文档（需认证）
- id 格式: `resume-{resumeId}` 或 `interview-{sessionId}`
```json
Response:
{
  "message": "文档已删除"
}
```

### PATCH /api/documents/:id/pin
切换文档置顶状态（需认证）
- id 格式: `resume-{resumeId}` 或 `interview-{sessionId}`
```json
Response:
{
  "data": {
    "id": "resume-cuid1",
    "isPinned": true
  }
}
```

---

## 📄 简历模块 (Resume)

### POST /api/resume/analyze
上传并分析简历（支持 JD 对标）
- Content-Type: multipart/form-data
- 扣除 5 积分

```
Request (form-data):
- file: 简历文件 (PDF/DOCX, 最大 5MB)
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
      "matchScore": 85,
      "missingKeywords": ["微服务", "Docker"],
      "highlights": ["React 经验丰富", "项目经历完整"],
      "improvements": [
        {
          "original": "负责项目开发",
          "improved": "主导完成 XX 项目，提升性能 30%",
          "reason": "量化成果更有说服力"
        }
      ]
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
创建面试会话
- 扣除 5 积分

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
```json
Request:
{
  "messages": [
    { "role": "system", "content": "..." },
    { "role": "assistant", "content": "..." },
    { "role": "user", "content": "用户回答" }
  ]
}

Response (SSE):
data: {"content": "AI", "done": false}
data: {"content": "回复", "done": false}
data: {"content": "", "done": true}
```

### POST /api/interview/session/:sessionId/end
结束面试并生成报告（需认证）
```json
Response:
{
  "message": "面试已结束，报告已生成",
  "data": {
    "sessionId": "cuid",
    "metrics": {
      "overallScore": 85,
      "radar": {
        "tech": 80,
        "comm": 90,
        "logic": 85,
        "exp": 75,
        "pressure": 88
      },
      "feedback": {
        "strengths": ["表达清晰", "技术扎实"],
        "weaknesses": ["项目细节可以更丰富"]
      }
    }
  }
}
```

### GET /api/interview/history/trend
获取历史趋势数据（最近 10 次）
```json
Response:
{
  "data": [
    { "sessionId": "cuid1", "overallScore": 75, "createdAt": "2026-02-20T..." },
    { "sessionId": "cuid2", "overallScore": 80, "createdAt": "2026-02-21T..." },
    { "sessionId": "cuid3", "overallScore": 85, "createdAt": "2026-02-22T..." }
  ]
}
```

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
| 402 | 积分不足 |
| 404 | 资源不存在 |
| 409 | 资源冲突（如邮箱已注册） |
| 500 | 服务器内部错误 |

---

## 💰 积分系统

| 操作 | 消耗积分 |
|------|----------|
| 简历分析 | 5 |
| 创建面试会话 | 5 |

新用户默认 50 积分。
