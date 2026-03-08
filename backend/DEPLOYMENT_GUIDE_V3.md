# 🚀 Mock Interview Wizard v3.0 部署指南

## 📋 架构升级概览

本次升级实现了 **Resume/Topic 双模式面试系统**，支持：
- ✅ 基于简历的深度面试（Resume Mode）
- ✅ 专项话题盲测（Topic Mode）
- ✅ 动态 Prompt Router（Langchain 提示词路由）
- ✅ 严格的 DTO 校验（class-validator）

---

## 🔧 部署步骤

### Step 1: 数据库 Migration

```bash
cd backend

# 生成 Prisma Client
npx prisma generate

# 运行 migration（会自动应用 20260308_add_interview_mode）
npx prisma migrate deploy

# 或者在开发环境使用
npx prisma migrate dev
```

### Step 2: 验证数据库结构

```bash
# 查看数据库状态
npx prisma migrate status

# 打开 Prisma Studio 验证
npx prisma studio
```

检查 `interview_sessions` 表是否包含以下新字段：
- `mode` (InterviewMode enum)
- `resumeId` (String, nullable)
- `topics` (String[])

### Step 3: 重启后端服务

```bash
# 开发环境
npm run start:dev

# 生产环境
npm run build
npm run start:prod
```

### Step 4: 测试 API

#### 测试 Resume 模式

```bash
POST /api/interview/session
Authorization: Bearer <your_token>
Content-Type: application/json

{
  "mode": "RESUME",
  "jobTitle": "Frontend Developer",
  "difficulty": "SENIOR",
  "resumeId": "clxxx123456"
}
```

#### 测试 Topic 模式

```bash
POST /api/interview/session
Authorization: Bearer <your_token>
Content-Type: application/json

{
  "mode": "TOPIC",
  "jobTitle": "Frontend Developer",
  "difficulty": "EXPERT",
  "topics": [
    "React Internals",
    "Performance Optimization",
    "System Design"
  ]
}
```

---

## 🎯 核心代码变更

### 1. Prisma Schema 变更

```prisma
model InterviewSession {
  // ... 其他字段
  
  // 🆕 新增字段
  mode           InterviewMode       @default(RESUME)
  resumeId       String?
  resume         Resume?             @relation(fields: [resumeId], references: [id])
  topics         String[]            @default([])
}

enum InterviewMode {
  RESUME  // 基于简历的深度面试
  TOPIC   // 专项话题盲测
}
```

### 2. DTO 校验规则

```typescript
export class CreateSessionDto {
  @IsEnum(InterviewMode)
  mode: InterviewMode;

  // Resume 模式：resumeId 必填
  @ValidateIf((o) => o.mode === InterviewMode.RESUME)
  @IsNotEmpty()
  resumeId?: string;

  // Topic 模式：topics 数组必填且至少 1 个
  @ValidateIf((o) => o.mode === InterviewMode.TOPIC)
  @IsNotEmpty()
  @ArrayMinSize(1)
  topics?: string[];
}
```

### 3. 动态 Prompt Router

```typescript
// Resume 模式提示词
if (session.mode === 'RESUME' && session.resume) {
  return `你是一位资深面试官。候选人应聘难度为 ${difficulty}。
  这是他的简历上下文：${resumeContent}。
  请根据简历深挖他的项目经验...`;
}

// Topic 模式提示词
if (session.mode === 'TOPIC' && session.topics.length > 0) {
  return `你是一位资深技术面试官。候选人希望进行 ${difficulty} 难度的专项盲测。
  本次考核领域为：${topics}。
  请直接从这些领域中挑选高频硬核面试题...`;
}
```

---

## ⚠️ 注意事项

### 1. 前端 API 调用更新

前端需要更新 `interviewApi.createSession` 的 payload 结构：

```typescript
// 旧版（已废弃）
{ jobTitle, jobDescription, difficulty }

// 新版（v3.0）
{
  mode: 'RESUME' | 'TOPIC',
  jobTitle: string,
  difficulty: string,
  resumeId?: string,      // Resume 模式必填
  topics?: string[],      // Topic 模式必填
}
```

### 2. 简历验证逻辑

Service 会自动验证：
- Resume 模式下，`resumeId` 必须存在且属于当前用户
- 简历必须已完成解析（`rawContent` 或 `analysisReport` 不为空）
- 如果验证失败，抛出 `NotFoundException` 或 `BadRequestException`

### 3. 向后兼容性

- 旧的面试会话数据会自动设置 `mode = 'RESUME'`（默认值）
- 旧的 API 调用会因为缺少 `mode` 字段而被 DTO 校验拦截
- 建议前端同步升级，不支持渐进式迁移

---

## 🧪 测试清单

- [ ] Resume 模式：传入有效 `resumeId`，验证开场白包含简历内容
- [ ] Resume 模式：传入无效 `resumeId`，验证返回 404 错误
- [ ] Topic 模式：传入 `topics` 数组，验证开场白包含话题列表
- [ ] Topic 模式：传入空 `topics` 数组，验证返回 400 错误
- [ ] DTO 校验：`mode = 'RESUME'` 但缺少 `resumeId`，验证返回 400
- [ ] DTO 校验：`mode = 'TOPIC'` 但缺少 `topics`，验证返回 400
- [ ] Prompt Router：验证 Resume 模式的 System Prompt 包含简历内容
- [ ] Prompt Router：验证 Topic 模式的 System Prompt 包含话题列表

---

## 📊 性能优化建议

1. **简历内容截断**：`extractResumeContent` 方法已限制简历内容为 3000 字符，避免 token 超限
2. **数据库索引**：已为 `resumeId` 添加索引，优化关联查询性能
3. **错误处理**：所有 API 调用都包含完整的 try-catch 和错误提示

---

## 🎉 升级完成

部署完成后，前端的 `MockInterviewWizardModal` 将能够：
- 选择历史简历 → 触发 Resume 模式面试
- 跳过简历选择 → 触发 Topic 模式面试
- AI 面试官根据模式动态调整提问策略

如有问题，请查看日志：
```bash
# 查看后端日志
npm run start:dev

# 查看数据库日志
npx prisma studio
```
