# AI 简历优化与面试模拟器 - 后端接口详细规约

> 版本: v1.0.0 | 最后更新: 2026-02-20

---

## 1. Auth 模块 (认证)

### 1.1 用户注册

**`POST /api/auth/register`**

创建新用户账户，成功后自动登录。

| 项目 | 值 |
|------|-----|
| 认证 | 不需要 |
| Content-Type | `application/json` |

**Request Body**

```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "name": "张三"
}
```

| 字段 | 类型 | 必填 | 描述 |
|------|------|------|------|
| email | string | ✅ | 邮箱地址，需符合邮箱格式 |
| password | string | ✅ | 密码，最少 8 位，需包含字母和数字 |
| name | string | ✅ | 用户昵称，2-20 字符 |

**Success Response (201)**

```json
{
  "message": "注册成功",
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "clx1234567890abcdef",
    "email": "user@example.com",
    "name": "张三",
    "createdAt": "2026-02-20T12:00:00.000Z"
  }
}
```

**⚠️ 重要**: Refresh Token 通过 `Set-Cookie` 响应头下发，不在响应体中返回。

```http
Set-Cookie: refresh_token=eyJhbGc...; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=604800
```

**Error Responses**

| 状态码 | 错误码 | 描述 |
|--------|--------|------|
| 400 | 40001 | 参数校验失败 |
| 409 | 40900 | 邮箱已被注册 |

---

### 1.2 用户登录

**`POST /api/auth/login`**

使用邮箱密码登录。

| 项目 | 值 |
|------|-----|
| 认证 | 不需要 |
| Content-Type | `application/json` |

**Request Body**

```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Success Response (200)**

```json
{
  "message": "登录成功",
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "clx1234567890abcdef",
    "email": "user@example.com",
    "name": "张三",
    "createdAt": "2026-02-20T12:00:00.000Z"
  }
}
```

**⚠️ Refresh Token 通过 HttpOnly Cookie 下发**

**Error Responses**

| 状态码 | 错误码 | 描述 |
|--------|--------|------|
| 401 | 40103 | 邮箱或密码错误 |
| 401 | 40104 | 用户不存在 |

---

### 1.3 刷新 Access Token

**`POST /api/auth/refresh`**

使用 Refresh Token 获取新的 Access Token。

| 项目 | 值 |
|------|-----|
| 认证 | Cookie 自动携带 |
| Content-Type | 无需请求体 |

**Request**

无需请求体，Refresh Token 从 Cookie 中自动读取。

```http
POST /api/auth/refresh HTTP/1.1
Cookie: refresh_token=eyJhbGc...
```

**Success Response (200)**

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Error Responses**

| 状态码 | 错误码 | 描述 |
|--------|--------|------|
| 401 | 40101 | Refresh Token 无效 |
| 401 | 40102 | Refresh Token 已过期 |

---

### 1.4 用户登出

**`POST /api/auth/logout`**

登出当前用户，清除服务端 Token 记录。

| 项目 | 值 |
|------|-----|
| 认证 | ✅ Bearer Token |

**Request Headers**

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Success Response (200)**

```json
{
  "message": "登出成功"
}
```

响应会包含 `Set-Cookie` 清除 refresh_token。

---

### 1.5 获取当前用户信息

**`POST /api/auth/me`**

获取当前登录用户的信息。

| 项目 | 值 |
|------|-----|
| 认证 | ✅ Bearer Token |

**Success Response (200)**

```json
{
  "user": {
    "id": "clx1234567890abcdef",
    "email": "user@example.com",
    "name": "张三",
    "createdAt": "2026-02-20T12:00:00.000Z"
  }
}
```

---

## 2. Resume 模块 (简历)

### 2.1 上传并分析简历

**`POST /api/resume/upload`**

上传简历文件，AI 自动解析并生成优化建议。

| 项目 | 值 |
|------|-----|
| 认证 | ✅ Bearer Token |
| Content-Type | `multipart/form-data` |

**⚠️ 文件限制**

| 限制项 | 值 |
|--------|-----|
| 最大文件大小 | 5MB |
| 支持格式 | PDF, DOCX |
| 单次上传数量 | 1 个文件 |
| 并发限制 | 10 个请求 |

**Request**

```http
POST /api/resume/upload HTTP/1.1
Authorization: Bearer eyJhbGc...
Content-Type: multipart/form-data; boundary=----WebKitFormBoundary

------WebKitFormBoundary
Content-Disposition: form-data; name="file"; filename="resume.pdf"
Content-Type: application/pdf

(binary content)
------WebKitFormBoundary--
```

| 字段 | 类型 | 必填 | 描述 |
|------|------|------|------|
| file | File | ✅ | 简历文件 (PDF/DOCX) |

**Success Response (200)**

```json
{
  "message": "简历分析完成",
  "data": {
    "id": "clx1234567890resume",
    "userId": "clx1234567890abcdef",
    "fileName": "resume.pdf",
    "fileSize": 102400,
    "mimeType": "application/pdf",
    "createdAt": "2026-02-20T12:00:00.000Z",
    "analysis": {
      "basicInfo": {
        "name": "张三",
        "email": "zhangsan@example.com",
        "phone": "138****1234",
        "location": "北京"
      },
      "education": [
        {
          "school": "北京大学",
          "degree": "本科",
          "major": "计算机科学",
          "startDate": "2018-09",
          "endDate": "2022-06"
        }
      ],
      "experience": [
        {
          "company": "某科技公司",
          "position": "前端工程师",
          "startDate": "2022-07",
          "endDate": "至今",
          "description": "负责公司核心产品的前端开发..."
        }
      ],
      "skills": ["JavaScript", "React", "TypeScript", "Node.js"],
      "overallScore": 78,
      "suggestions": [
        {
          "category": "工作经历",
          "priority": "high",
          "issue": "缺少量化成果描述",
          "suggestion": "建议添加具体的业绩数据，如'提升页面加载速度 40%'"
        },
        {
          "category": "技能",
          "priority": "medium",
          "issue": "技能列表较为笼统",
          "suggestion": "建议按熟练程度分类，突出核心技能"
        }
      ]
    }
  }
}
```

**Error Responses**

| 状态码 | 错误码 | 描述 |
|--------|--------|------|
| 400 | 40003 | 不支持的文件类型 |
| 400 | 40004 | 文件超过 5MB 限制 |
| 400 | - | 服务器繁忙（并发限制） |
| 500 | 50003 | 文件解析失败 |
| 503 | 50001 | AI 服务异常 |

---

### 2.2 获取简历列表

**`GET /api/resume/list`**

获取当前用户的所有简历记录。

| 项目 | 值 |
|------|-----|
| 认证 | ✅ Bearer Token |

**Success Response (200)**

```json
{
  "data": [
    {
      "id": "clx1234567890resume",
      "fileName": "resume.pdf",
      "fileSize": 102400,
      "overallScore": 78,
      "createdAt": "2026-02-20T12:00:00.000Z"
    },
    {
      "id": "clx0987654321resume",
      "fileName": "resume_v2.docx",
      "fileSize": 85600,
      "overallScore": 85,
      "createdAt": "2026-02-19T10:30:00.000Z"
    }
  ]
}
```

---

### 2.3 获取简历详情

**`GET /api/resume/:id`**

获取指定简历的完整分析报告。

| 项目 | 值 |
|------|-----|
| 认证 | ✅ Bearer Token |

**Path Parameters**

| 参数 | 类型 | 描述 |
|------|------|------|
| id | string | 简历 ID |

**Success Response (200)**

```json
{
  "data": {
    "id": "clx1234567890resume",
    "userId": "clx1234567890abcdef",
    "fileName": "resume.pdf",
    "fileSize": 102400,
    "mimeType": "application/pdf",
    "createdAt": "2026-02-20T12:00:00.000Z",
    "analysis": { ... }
  }
}
```

**Error Responses**

| 状态码 | 错误码 | 描述 |
|--------|--------|------|
| 403 | 40300 | 无权访问该简历 |
| 404 | 40402 | 简历不存在 |

---

## 3. Interview 模块 (面试)

### 3.1 创建面试会话

**`POST /api/interview/session`**

创建新的 AI 模拟面试会话。

| 项目 | 值 |
|------|-----|
| 认证 | ✅ Bearer Token |
| Content-Type | `application/json` |

**Request Body**

```json
{
  "resumeId": "clx1234567890resume",
  "jobTitle": "高级前端工程师",
  "jobDescription": "负责公司核心产品的前端架构设计...",
  "difficulty": "medium",
  "language": "zh-CN"
}
```

| 字段 | 类型 | 必填 | 描述 |
|------|------|------|------|
| resumeId | string | ❌ | 关联的简历 ID（可选） |
| jobTitle | string | ✅ | 目标职位名称 |
| jobDescription | string | ❌ | 职位描述 |
| difficulty | enum | ❌ | 难度: `easy`, `medium`, `hard`，默认 `medium` |
| language | string | ❌ | 面试语言，默认 `zh-CN` |

**Success Response (200)**

```json
{
  "message": "面试会话已创建",
  "data": {
    "sessionId": "clx1234567890session",
    "status": "IN_PROGRESS",
    "jobTitle": "高级前端工程师",
    "difficulty": "medium",
    "createdAt": "2026-02-20T12:00:00.000Z",
    "initialMessage": "你好！我是你的 AI 面试官。今天我们将进行一场高级前端工程师的模拟面试..."
  }
}
```

---

### 3.2 SSE 流式对话 (GET 方式)

**`GET /api/interview/chat/:sessionId`**

通过 Server-Sent Events 进行流式对话。

| 项目 | 值 |
|------|-----|
| 认证 | ✅ Bearer Token |
| Content-Type | `text/event-stream` |
| 连接类型 | SSE (Server-Sent Events) |

**⚠️ 这是一个 SSE 流式接口**

**Path Parameters**

| 参数 | 类型 | 描述 |
|------|------|------|
| sessionId | string | 面试会话 ID |

**Query Parameters**

| 参数 | 类型 | 必填 | 描述 |
|------|------|------|------|
| messages | string | ✅ | URL 编码的 JSON 消息数组 |

**messages 格式**

```json
[
  { "role": "user", "content": "我有5年的前端开发经验..." },
  { "role": "assistant", "content": "很好，请详细介绍一下..." },
  { "role": "user", "content": "我主要负责..." }
]
```

**Request 示例**

```http
GET /api/interview/chat/clx123?messages=%5B%7B%22role%22%3A%22user%22%2C%22content%22%3A%22%E4%BD%A0%E5%A5%BD%22%7D%5D HTTP/1.1
Authorization: Bearer eyJhbGc...
Accept: text/event-stream
```

**SSE 响应流格式**

```
event: message
data: {"type":"chunk","content":"好"}

event: message
data: {"type":"chunk","content":"的"}

event: message
data: {"type":"chunk","content":"，"}

event: message
data: {"type":"chunk","content":"请"}

event: message
data: {"type":"done","content":""}
```

**SSE 事件类型**

| type | 描述 |
|------|------|
| `chunk` | 文本片段，用于打字机效果 |
| `done` | 流结束标志 |
| `error` | 错误信息 |

---

### 3.3 SSE 流式对话 (POST 方式 - 推荐)

**`POST /api/interview/chat/:sessionId/stream`**

POST 方式的流式对话，可在 Body 中传递更多数据。

| 项目 | 值 |
|------|-----|
| 认证 | ✅ Bearer Token |
| Content-Type | `application/json` |
| 响应类型 | `text/event-stream` |

**Request Body**

```json
{
  "messages": [
    { "role": "user", "content": "我有5年的前端开发经验" },
    { "role": "assistant", "content": "很好，请详细介绍一下你的项目经历" },
    { "role": "user", "content": "我主要负责公司电商平台的前端架构..." }
  ]
}
```

**响应格式同 GET 方式**

---

### 3.4 结束面试会话

**`POST /api/interview/session/:sessionId/end`**

结束面试并生成评估报告。

| 项目 | 值 |
|------|-----|
| 认证 | ✅ Bearer Token |

**Path Parameters**

| 参数 | 类型 | 描述 |
|------|------|------|
| sessionId | string | 面试会话 ID |

**Success Response (200)**

```json
{
  "message": "面试已结束，报告已生成",
  "data": {
    "sessionId": "clx1234567890session",
    "status": "COMPLETED",
    "duration": 1800,
    "report": {
      "overallScore": 82,
      "dimensions": [
        {
          "name": "技术能力",
          "score": 85,
          "feedback": "对前端技术栈有深入理解，能够清晰解释技术选型原因"
        },
        {
          "name": "沟通表达",
          "score": 78,
          "feedback": "表达较为清晰，但部分回答略显冗长"
        },
        {
          "name": "问题解决",
          "score": 80,
          "feedback": "能够提出合理的解决方案，思路清晰"
        }
      ],
      "strengths": [
        "技术基础扎实",
        "项目经验丰富"
      ],
      "improvements": [
        "回答可以更加简洁",
        "可以多举具体案例"
      ],
      "summary": "整体表现良好，技术能力突出..."
    }
  }
}
```

---

### 3.5 获取面试会话列表

**`GET /api/interview/sessions`**

获取当前用户的所有面试会话。

| 项目 | 值 |
|------|-----|
| 认证 | ✅ Bearer Token |

**Success Response (200)**

```json
{
  "data": [
    {
      "sessionId": "clx1234567890session",
      "jobTitle": "高级前端工程师",
      "status": "COMPLETED",
      "overallScore": 82,
      "duration": 1800,
      "createdAt": "2026-02-20T12:00:00.000Z"
    },
    {
      "sessionId": "clx0987654321session",
      "jobTitle": "全栈工程师",
      "status": "IN_PROGRESS",
      "overallScore": null,
      "duration": null,
      "createdAt": "2026-02-19T15:30:00.000Z"
    }
  ]
}
```

---

### 3.6 获取会话详情

**`GET /api/interview/session/:sessionId`**

获取指定面试会话的完整信息。

| 项目 | 值 |
|------|-----|
| 认证 | ✅ Bearer Token |

**Success Response (200)**

```json
{
  "data": {
    "sessionId": "clx1234567890session",
    "userId": "clx1234567890abcdef",
    "resumeId": "clx1234567890resume",
    "jobTitle": "高级前端工程师",
    "jobDescription": "...",
    "difficulty": "medium",
    "status": "COMPLETED",
    "messages": [
      { "role": "assistant", "content": "你好！我是你的 AI 面试官...", "timestamp": "..." },
      { "role": "user", "content": "你好，我是张三...", "timestamp": "..." }
    ],
    "report": { ... },
    "createdAt": "2026-02-20T12:00:00.000Z",
    "endedAt": "2026-02-20T12:30:00.000Z"
  }
}
```

**Error Responses**

| 状态码 | 错误码 | 描述 |
|--------|--------|------|
| 403 | 40300 | 无权访问该会话 |
| 404 | 40401 | 会话不存在 |
