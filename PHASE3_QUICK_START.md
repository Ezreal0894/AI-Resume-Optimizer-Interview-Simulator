# 🚀 Phase 3 快速启动指南

## 前置条件

- Node.js 18+
- PostgreSQL 数据库
- OpenAI API Key

## 1. 后端启动

```bash
# 进入后端目录
cd backend

# 安装依赖（如果还没安装）
npm install

# 配置环境变量
# 编辑 .env 文件，确保包含：
# DATABASE_URL="postgresql://..."
# JWT_SECRET="..."
# OPENAI_API_KEY="..."

# 运行数据库迁移（包含 customKnowledgePoints 字段）
npx prisma migrate deploy

# 启动后端服务
npm run start:dev
```

后端将运行在 `http://localhost:3000`

## 2. 前端启动

```bash
# 进入前端目录
cd frontend

# 安装依赖（如果还没安装）
npm install

# 启动前端服务
npm run dev
```

前端将运行在 `http://localhost:5173`

## 3. 测试 Phase 3 功能

### 步骤 1：注册/登录
1. 打开浏览器访问 `http://localhost:5173`
2. 注册新账号或使用现有账号登录

### 步骤 2：打开 Mock Interview Wizard
1. 点击 Dashboard 页面的 "开始模拟面试" 按钮
2. 或点击侧边栏的 "Mock Interview" 菜单

### 步骤 3：上传简历
1. 在 Step 1 中，拖拽或点击上传一份 PDF 简历
2. 等待简历上传和提取（会显示加载动画）
3. 自动进入 Step 2

### 步骤 4：查看 AI 深度剖析
在 Step 2 中，你会看到 Bento Grid 布局：

**左上块：个人信息**
- 姓名
- 职位
- 工作年限

**右上块：核心亮点**
- 简历中的 3 个核心亮点
- Bullet points 格式

**横向主块：核心知识点（可编辑）**
- AI 提取的知识点标签
- 可以删除不需要的知识点
- 可以添加自定义知识点

### 步骤 5：编辑知识点

#### 删除知识点
1. 悬停在任意知识点标签上
2. 点击右侧出现的 X 按钮
3. 标签会以动画消失

#### 添加知识点
1. 点击 "+ 添加考点" 按钮
2. 输入新的知识点（最多 100 字符）
3. 按 Enter 保存，或按 ESC 取消
4. 最多添加 20 个知识点

### 步骤 6：选择难度
选择以下任意难度：
- Junior (初级)
- Mid-Level (中级)
- Senior (高级)
- Big Tech Expert (专家)

### 步骤 7：开始面试
1. 点击 "🚀 确认知识点，开始定制化面试" 按钮
2. 等待 AI 初始化
3. 自动跳转到面试房间

### 步骤 8：验证 AI 行为
在面试房间中：
1. AI 会围绕你确认的知识点提问
2. AI 会深挖你添加的自定义知识点
3. 问题难度符合你选择的级别

## 4. 验证后端数据

### 使用浏览器开发者工具
1. 打开浏览器开发者工具（F12）
2. 切换到 Network 标签
3. 在 Step 2 点击提交按钮
4. 查看 `POST /api/interview/session` 请求

**预期 Payload：**
```json
{
  "mode": "RESUME",
  "jobTitle": "Frontend Developer",
  "difficulty": "MEDIUM",
  "resumeId": "clx...",
  "customKnowledgePoints": [
    "React Hooks 深度理解",
    "TypeScript 高级类型",
    "性能优化实战",
    "你添加的自定义知识点"
  ]
}
```

**预期 Response：**
```json
{
  "message": "Interview session created successfully",
  "data": {
    "sessionId": "clx...",
    "greeting": "你好！我是你的 AI 面试官..."
  }
}
```

### 使用 PowerShell 测试脚本
```powershell
cd backend
.\test-phase3-knowledge-points.ps1
```

## 5. 常见问题

### Q1: 简历提取失败
**症状：** 上传简历后显示错误

**解决方案：**
1. 确保上传的是 PDF 格式
2. 确保 PDF 文件不是扫描件（需要可提取文本）
3. 检查后端日志查看详细错误
4. 确保 OpenAI API Key 配置正确

### Q2: 知识点无法添加
**症状：** 点击添加按钮无反应

**解决方案：**
1. 检查是否已达到 20 个上限
2. 检查浏览器控制台是否有错误
3. 刷新页面重试

### Q3: AI 没有围绕知识点提问
**症状：** AI 问的问题与知识点无关

**解决方案：**
1. 检查 Network 请求，确认 `customKnowledgePoints` 已发送
2. 检查后端日志，确认 System Prompt 包含知识点
3. 尝试添加更具体的知识点（如 "React Hooks useEffect 依赖数组" 而不是 "React"）

### Q4: 暗色模式显示异常
**症状：** 切换暗色模式后颜色不正确

**解决方案：**
1. 清除浏览器缓存
2. 检查 Tailwind CSS 配置
3. 刷新页面

## 6. 开发调试

### 前端调试
```bash
# 启动开发服务器（带热重载）
npm run dev

# 查看 TypeScript 错误
npm run type-check

# 查看 ESLint 错误
npm run lint
```

### 后端调试
```bash
# 启动开发服务器（带热重载）
npm run start:dev

# 查看数据库数据
npx prisma studio

# 查看日志
# 后端会在控制台输出详细日志
```

### 数据库调试
```bash
# 打开 Prisma Studio
npx prisma studio

# 查看 InterviewSession 表
# 验证 customKnowledgePoints 字段是否正确保存
```

## 7. 性能测试

### 测试大量知识点
1. 添加 20 个知识点
2. 快速连续删除和添加
3. 验证动画流畅无卡顿

### 测试响应式布局
1. 调整浏览器窗口大小
2. 测试 375px（移动端）
3. 测试 768px（平板）
4. 测试 1024px+（桌面）

### 测试暗色模式
1. 切换到暗色模式
2. 验证所有颜色正确
3. 验证文字对比度足够

## 8. 下一步

### 功能增强
- [ ] 实现历史简历提取功能
- [ ] 添加知识点推荐功能
- [ ] 添加知识点分类功能
- [ ] 添加知识点权重设置

### 测试完善
- [ ] 添加单元测试
- [ ] 添加集成测试
- [ ] 添加 E2E 测试

### 文档完善
- [ ] 添加 API 文档（Swagger）
- [ ] 添加组件文档（Storybook）
- [ ] 添加用户使用指南

## 9. 获取帮助

### 文档
- `PHASE3_BENTO_EDITABLE_UI.md` - 功能详细说明
- `PHASE3_TESTING_CHECKLIST.md` - 完整测试清单
- `PHASE3_CODE_REVIEW.md` - 代码审查报告
- `PHASE3_VERIFICATION_REPORT.md` - 验证报告

### 日志
- 前端：浏览器控制台
- 后端：终端输出
- 数据库：Prisma Studio

### 联系
- 提交 Issue
- 查看代码注释
- 参考测试脚本

---

**祝你使用愉快！🎉**
