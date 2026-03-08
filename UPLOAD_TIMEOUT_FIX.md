# 🔧 PDF 上传超时问题修复

## 问题描述
用户上传 PDF 简历时显示"上传时间过长无法上传"错误。

## 根本原因
1. **前端 API 客户端超时设置过短**：30 秒
2. **后端 AI 处理超时设置不足**：90 秒
3. **简历提取需要调用 AI API**：可能需要 60-120 秒

## 解决方案

### 1. 前端超时配置优化 ✅

**文件：** `frontend/src/api/client.ts`

**修改前：**
```typescript
const apiClient = axios.create({
  baseURL: '/api',
  timeout: 30000, // 30 秒
  withCredentials: true,
});
```

**修改后：**
```typescript
const apiClient = axios.create({
  baseURL: '/api',
  timeout: 120000, // 🔧 增加到 120 秒（2 分钟）
  withCredentials: true,
});
```

**理由：**
- 简历提取需要：上传文件 + PDF 解析 + AI 分析
- 预计耗时：30-90 秒
- 设置 120 秒提供足够的缓冲

### 2. 后端 AI 超时配置优化 ✅

**文件：** `backend/src/resume/resume.service.ts`

**修改前：**
```typescript
const AI_CONFIG = {
  MAX_RETRIES: 2,
  TIMEOUT: 90000, // 90 秒
  TEMPERATURE: 0.2,
  MAX_TOKENS: 4000,
};
```

**修改后：**
```typescript
const AI_CONFIG = {
  MAX_RETRIES: 2,
  TIMEOUT: 180000, // 🔧 增加到 180 秒（3 分钟）
  TEMPERATURE: 0.2,
  MAX_TOKENS: 4000,
};
```

**理由：**
- DeepSeek API 响应时间可能较长
- 包含重试机制（最多 2 次重试）
- 180 秒确保 AI 有足够时间处理

### 3. 其他优化建议

#### 3.1 添加上传进度提示
在 `MockInterviewWizardModal.tsx` 中，上传状态已经有加载动画，但可以添加更详细的进度提示：

```typescript
// 当前状态
{isUploading && (
  <Loader2 className="w-14 h-14 text-indigo-600 animate-spin mb-3" />
  <p className="font-semibold text-indigo-900 dark:text-indigo-100 text-lg">上传中...</p>
)}

// 建议优化
{isUploading && (
  <Loader2 className="w-14 h-14 text-indigo-600 animate-spin mb-3" />
  <p className="font-semibold text-indigo-900 dark:text-indigo-100 text-lg">上传中...</p>
  <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
    AI 正在深度分析您的简历，这可能需要 1-2 分钟
  </p>
)}
```

#### 3.2 添加超时友好提示
如果仍然超时，显示更友好的错误消息：

```typescript
catch (error: any) {
  const errorMsg = error.code === 'ECONNABORTED' 
    ? '简历分析超时，请稍后重试。如果问题持续，请尝试上传更小的文件。'
    : error.response?.data?.message || error.message || '上传失败';
  setUploadError(errorMsg);
}
```

#### 3.3 优化 AI Prompt
减少 AI 处理时间，优化 prompt 长度：

**当前：** 简历内容截取 8000 字符
**建议：** 可以保持，但确保 prompt 简洁

#### 3.4 添加文件大小预检
在上传前检查文件大小，避免上传过大文件：

```typescript
const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;
  
  // 检查文件大小（10MB 限制）
  if (file.size > 10 * 1024 * 1024) {
    setUploadError('文件大小不能超过 10MB');
    return;
  }
  
  // 继续上传...
};
```

## 测试验证

### 测试步骤
1. 准备一份 2-5MB 的 PDF 简历
2. 在浏览器中访问 http://localhost:5173
3. 登录并开始模拟面试
4. 上传 PDF 简历
5. 观察上传过程

### 预期结果
- ✅ 上传开始后显示加载动画
- ✅ 等待 30-90 秒（取决于文件大小和 AI 响应速度）
- ✅ 成功进入 "extracting" 状态
- ✅ 显示提取动画（3 条轮播消息）
- ✅ 成功进入 Step 2，显示 Bento Grid 布局

### 如果仍然超时
1. **检查网络连接**：确保网络稳定
2. **检查 AI API**：确保 DeepSeek API Key 有效
3. **检查文件大小**：尝试上传更小的文件（< 2MB）
4. **查看后端日志**：检查是否有其他错误

## 配置总结

| 配置项 | 修改前 | 修改后 | 说明 |
|--------|--------|--------|------|
| 前端 API 超时 | 30 秒 | 120 秒 | 支持长时间 AI 处理 |
| 后端 AI 超时 | 90 秒 | 180 秒 | 确保 AI 有足够时间 |
| 文件大小限制 | 10MB | 10MB | 保持不变 |
| AI 重试次数 | 2 次 | 2 次 | 保持不变 |

## 性能优化建议（未来）

### 短期优化
1. **添加上传进度条**：显示实际上传进度
2. **添加取消按钮**：允许用户取消长时间上传
3. **优化 AI Prompt**：减少不必要的内容

### 长期优化
1. **异步处理**：上传后立即返回，后台处理
2. **WebSocket 通知**：处理完成后推送通知
3. **缓存机制**：缓存已处理的简历
4. **CDN 加速**：使用 CDN 加速文件上传

## 回滚方案

如果新配置导致问题，可以回滚：

### 前端回滚
```typescript
// frontend/src/api/client.ts
const apiClient = axios.create({
  baseURL: '/api',
  timeout: 30000, // 回滚到 30 秒
  withCredentials: true,
});
```

### 后端回滚
```typescript
// backend/src/resume/resume.service.ts
const AI_CONFIG = {
  MAX_RETRIES: 2,
  TIMEOUT: 90000, // 回滚到 90 秒
  TEMPERATURE: 0.2,
  MAX_TOKENS: 4000,
};
```

## 监控建议

添加日志记录上传时间：

```typescript
// 后端
console.log(`[Resume Extract] Started for user ${userId}`);
const startTime = Date.now();

// ... 处理逻辑 ...

const duration = Date.now() - startTime;
console.log(`[Resume Extract] Completed in ${duration}ms`);
```

## 相关文件

- ✅ `frontend/src/api/client.ts` - 前端 API 客户端
- ✅ `backend/src/resume/resume.service.ts` - 后端简历服务
- 📄 `frontend/src/components/interview/MockInterviewWizardModal.tsx` - 上传 UI
- 📄 `frontend/src/api/document.ts` - 文档 API

---

**修复日期：** 2026-03-08  
**修复人员：** Kiro AI Assistant  
**测试状态：** ⏳ 待用户测试验证  
**优先级：** 🔴 高（阻塞用户测试）
