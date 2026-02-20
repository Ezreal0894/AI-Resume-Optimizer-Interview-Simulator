# AI 简历优化与面试模拟器 - API 全局规范

> 版本: v1.0.0 | 最后更新: 2026-02-20

---

## 1. 全局说明

### 1.1 Base URL

```
生产环境: https://api.ai-career.com/api
开发环境: http://localhost:3000/api
```

### 1.2 请求规范

| 项目 | 规范 |
|------|------|
| 协议 | HTTPS (生产环境强制) |
| 编码 | UTF-8 |
| 时区 | UTC (ISO 8601 格式) |
| 请求体格式 | `application/json` (除文件上传外) |

### 1.3 统一响应格式

**成功响应 (2xx)**

```json
{
  "message": "操作成功",
  "data": { ... },
  "accessToken": "eyJhbGc..."  // 仅登录/注册接口返回
}
```

**错误响应 (4xx/5xx)**

```json
{
  "statusCode": 401,
  "code": 40100,
  "message": "Access Token 已过期",
  "timestamp": "2026-02-20T12:00:00.000Z",
  "path": "/api/resume/upload"
}
```

---

## 2. 鉴权机制 (Dual-Token)

本系统采用 **Access Token + Refresh Token** 双令牌机制，兼顾安全性与用户体验。

### 2.1 Token 类型对比

| 属性 | Access Token | Refresh Token |
|------|--------------|---------------|
| 用途 | API 请求鉴权 | 刷新 Access Token |
| 有效期 | 15 分钟 | 7 天 |
| 存储位置 | 前端内存 / localStorage | HttpOnly Cookie |
| 传输方式 | `Authorization` Header | Cookie 自动携带 |
| 安全特性 | 短效，泄露影响有限 | HttpOnly 防 XSS |

### 2.2 Access Token 携带方式

所有需要认证的接口，必须在请求头中携带 Access Token：

```http
GET /api/resume/list HTTP/1.1
Host: api.ai-career.com
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 2.3 Refresh Token 流转机制

```
┌─────────────────────────────────────────────────────────────────┐
│                      Token 生命周期流程                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. 用户登录                                                     │
│     ┌──────────┐    POST /auth/login    ┌──────────┐            │
│     │  Client  │ ───────────────────────▶│  Server  │            │
│     └──────────┘                         └──────────┘            │
│           │                                    │                 │
│           │◀─── Response Body: accessToken ────│                 │
│           │◀─── Set-Cookie: refresh_token ─────│                 │
│                 (HttpOnly; Secure; SameSite=Lax)                │
│                                                                 │
│  2. 正常请求 (Access Token 有效)                                  │
│     ┌──────────┐  Authorization: Bearer xxx  ┌──────────┐       │
│     │  Client  │ ────────────────────────────▶│  Server  │       │
│     └──────────┘                              └──────────┘       │
│           │◀─────────── 200 OK ───────────────│                 │
│                                                                 │
│  3. Access Token 过期 (收到 401)                                  │
│     ┌──────────┐  POST /auth/refresh         ┌──────────┐       │
│     │  Client  │ ────────────────────────────▶│  Server  │       │
│     └──────────┘  (Cookie 自动携带 refresh)   └──────────┘       │
│           │◀─── Response: new accessToken ────│                 │
│           │                                                     │
│     ┌──────────┐  重试原请求 (新 Token)       ┌──────────┐       │
│     │  Client  │ ────────────────────────────▶│  Server  │       │
│     └──────────┘                              └──────────┘       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 2.4 401 错误处理流程 (前端必读)

当收到 `401 Unauthorized` 响应时，前端应执行以下流程：

```
收到 401 响应
     │
     ▼
┌────────────────────┐
│ 是否正在刷新 Token？ │
└────────────────────┘
     │
     ├── 是 ──▶ 将当前请求加入等待队列
     │
     └── 否 ──▶ 设置刷新标志 = true
                    │
                    ▼
              POST /auth/refresh
                    │
         ┌─────────┴─────────┐
         │                   │
      成功 200            失败 401
         │                   │
         ▼                   ▼
   更新 accessToken      清除登录态
   重试所有等待请求       跳转登录页
```

---

## 3. 全局错误码字典

### 3.1 HTTP 状态码映射

| HTTP 状态码 | 含义 | 典型场景 |
|-------------|------|----------|
| 200 | 成功 | 正常响应 |
| 201 | 已创建 | 注册成功、资源创建 |
| 400 | 请求错误 | 参数校验失败 |
| 401 | 未授权 | Token 无效/过期 |
| 403 | 禁止访问 | 无权限操作该资源 |
| 404 | 未找到 | 资源不存在 |
| 413 | 请求体过大 | 文件超过大小限制 |
| 429 | 请求过多 | 触发限流 |
| 500 | 服务器错误 | 内部异常 |
| 503 | 服务不可用 | AI 服务暂时不可用 |

### 3.2 业务错误码详表

#### 通用错误 (400xx)

| 错误码 | 错误名称 | 描述 | 解决方案 |
|--------|----------|------|----------|
| 40001 | INVALID_PARAMS | 请求参数校验失败 | 检查请求体格式与字段类型 |
| 40002 | MISSING_REQUIRED_FIELD | 缺少必填字段 | 补充必填参数 |
| 40003 | INVALID_FILE_TYPE | 不支持的文件类型 | 仅支持 PDF/DOCX |
| 40004 | FILE_TOO_LARGE | 文件超过大小限制 | 文件需小于 5MB |

#### 认证错误 (401xx)

| 错误码 | 错误名称 | 描述 | 解决方案 |
|--------|----------|------|----------|
| 40100 | TOKEN_EXPIRED | Access Token 已过期 | 调用 /auth/refresh 刷新 |
| 40101 | TOKEN_INVALID | Token 格式无效 | 重新登录获取新 Token |
| 40102 | REFRESH_TOKEN_EXPIRED | Refresh Token 已过期 | 需要重新登录 |
| 40103 | CREDENTIALS_INVALID | 邮箱或密码错误 | 检查登录凭证 |
| 40104 | USER_NOT_FOUND | 用户不存在 | 检查邮箱是否正确 |

#### 权限错误 (403xx)

| 错误码 | 错误名称 | 描述 | 解决方案 |
|--------|----------|------|----------|
| 40300 | FORBIDDEN | 无权访问该资源 | 检查资源归属 |
| 40301 | PLAN_LIMIT_EXCEEDED | 超出套餐使用限制 | 升级会员套餐 |

#### 资源错误 (404xx)

| 错误码 | 错误名称 | 描述 | 解决方案 |
|--------|----------|------|----------|
| 40400 | RESOURCE_NOT_FOUND | 请求的资源不存在 | 检查资源 ID |
| 40401 | SESSION_NOT_FOUND | 面试会话不存在 | 创建新会话 |
| 40402 | RESUME_NOT_FOUND | 简历不存在 | 检查简历 ID |

#### 服务端错误 (500xx)

| 错误码 | 错误名称 | 描述 | 解决方案 |
|--------|----------|------|----------|
| 50000 | INTERNAL_ERROR | 服务器内部错误 | 联系技术支持 |
| 50001 | AI_SERVICE_ERROR | AI 大模型服务异常 | 稍后重试 |
| 50002 | AI_RESPONSE_PARSE_ERROR | AI 响应解析失败 | 稍后重试 |
| 50003 | FILE_PARSE_ERROR | 文件解析失败 | 检查文件是否损坏 |
| 50300 | SERVICE_UNAVAILABLE | 服务暂时不可用 | 稍后重试 |

---

## 4. 通用请求头

### 4.1 必需请求头

```http
Content-Type: application/json
Authorization: Bearer <access_token>  // 需认证的接口
```

### 4.2 可选请求头

```http
Accept-Language: zh-CN              // 响应语言偏好
X-Request-ID: uuid-v4               // 请求追踪 ID
X-Client-Version: 1.0.0             // 客户端版本
```

---

## 5. 限流策略

| 接口类型 | 限制 | 窗口 |
|----------|------|------|
| 登录/注册 | 5 次 | 1 分钟 |
| 简历上传 | 10 次 | 1 小时 |
| AI 对话 | 60 次 | 1 分钟 |
| 其他接口 | 100 次 | 1 分钟 |

超出限制返回 `429 Too Many Requests`。

---

## 6. 数据类型约定

| 类型 | 格式 | 示例 |
|------|------|------|
| ID | CUID 字符串 | `"clx1234567890abcdef"` |
| 时间戳 | ISO 8601 | `"2026-02-20T12:00:00.000Z"` |
| 枚举 | 大写下划线 | `"IN_PROGRESS"` |
| 布尔 | JSON boolean | `true` / `false` |
| 金额 | 整数 (分) | `9900` (表示 99.00 元) |
