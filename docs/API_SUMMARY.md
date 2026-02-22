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
  "tags": ["前端开发", "React", "TypeScript"]
}

Response:
{
  "message": "Onboarding 完成",
  "data": {
    "id": "cuid",
    "email": "user@example.com",
    "name": "用户名",
    "tags": ["前端开发", "React", "TypeScript"],
    "plan": "FREE",
    "credits": 50
  }
}
```

### GET /api/user/profile
获取用户信息（需认证）

### GET /api/user/credits
获取积分余额（需认证）

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
