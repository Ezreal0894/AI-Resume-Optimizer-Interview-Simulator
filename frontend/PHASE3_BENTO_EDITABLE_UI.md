# 🎨 Phase 3: 白盒化配置视图重构 (The Editable Bento UI)

## 概述

成功重构 Step 2 视图，将"分析结果确认"与"难度选择"合并展示，采用极简的 Bento Grid 布局，并实现了核心知识点的高阶交互编辑功能。

## 实现的功能

### 1. Bento Grid 布局 (Resume Mode)

当用户选择简历模式时，Step 2 会展示一个优雅的 Bento Grid 布局：

#### 上半部分：AI 深度剖析卡片

- **左上块：个人信息概览**
  - 显示姓名、职位、工作年限
  - 采用莫兰迪靛蓝色渐变背景 (`from-indigo-50 to-purple-50`)
  - 带有用户图标和精致的卡片设计

- **右上块：简历核心亮点**
  - 以点句式 (Bullet points) 列表展示前 3 个亮点
  - 采用琥珀色渐变背景 (`from-amber-50 to-orange-50`)
  - 前置亮色小图标 (Lightbulb)

- **横向主块：核心知识点 (可编辑)**
  - 将后端返回的 `knowledgePoints` 渲染为莫兰迪靛蓝色的药丸标签 (Pill Tags)
  - 每个标签右侧带有微小的 `X` 图标，点击可丝滑移除该标签
  - 使用 Framer Motion 的 `layout` 动画实现流畅的增删效果
  - 在标签列表末尾放置虚线边框的 `+ 添加考点` 按钮
  - 点击后变成精致的 `Input`，回车后将新标签压入数组
  - 支持 ESC 键取消，失焦自动保存

### 2. 难度选择 (下半部分)

保留原有的 4 个难度单选卡片：
- 初级 (Junior - Foundations)
- 中级 (Mid-Level - Practical)
- 高级 (Senior - Deep Dive)
- 专家 (Big Tech Expert - Mastery)

### 3. 底部操作区 (Action Bar)

- 按钮文案更新为："🚀 确认知识点，开始定制化面试"
- 提交时，前端将以下数据发送给 `POST /api/interview/session` 接口：
  - `resumeId`: 简历 ID
  - `customKnowledgePoints`: 经过用户增删的知识点数组
  - `difficulty`: 选择的难度
  - `mode`: 'RESUME'
  - `jobTitle`: 用户职位

## 技术实现细节

### 状态管理

```typescript
// 自定义知识点状态
const [customKnowledgePoints, setCustomKnowledgePoints] = useState<string[]>([]);
const [isAddingKnowledge, setIsAddingKnowledge] = useState(false);
const [newKnowledgeInput, setNewKnowledgeInput] = useState('');
```

### 数据流

1. **提取阶段** (`handleNextStep`)
   - 调用 `extractResume` API 获取简历结构化数据
   - 初始化 `customKnowledgePoints` 为提取的 `knowledgePoints`

2. **编辑阶段** (Step 2)
   - 用户可以删除不需要的知识点
   - 用户可以添加新的知识点
   - 所有操作都有流畅的动画反馈

3. **提交阶段** (`handleStartInterview`)
   - 将 `customKnowledgePoints` 作为 `customKnowledgePoints` 字段发送给后端
   - 后端会根据这些知识点定制化面试题目

### 动画效果

使用 Framer Motion 实现：
- `layout` 动画：标签增删时的流畅布局变化
- `AnimatePresence` + `mode="popLayout"`：标签移除时的淡出效果
- `initial/animate/exit`：标签添加时的缩放动画
- 卡片入场动画：使用 `delay` 实现错落有致的出现效果

### 样式设计

- **莫兰迪色系**：使用柔和的靛蓝色 (`indigo-100/900`) 作为主色调
- **渐变背景**：个人信息和亮点卡片使用微妙的渐变
- **药丸标签**：圆角 (`rounded-full`)、边框、悬停效果
- **虚线边框**：添加按钮使用 `border-dashed` 区分
- **响应式布局**：使用 `grid-cols-1 md:grid-cols-2` 适配移动端

## 用户体验优化

1. **视觉层次清晰**：使用不同的背景色和图标区分不同类型的信息
2. **交互反馈即时**：所有操作都有动画反馈
3. **编辑流程流畅**：
   - 悬停显示删除按钮（避免视觉噪音）
   - 点击添加按钮立即变成输入框
   - 回车保存，ESC 取消，失焦自动保存
4. **防误操作**：删除按钮需要悬停才显示
5. **空状态友好**：即使没有知识点也可以添加新的

## 后端契约对齐

### 请求格式 (Resume Mode)

```typescript
{
  mode: 'RESUME',
  jobTitle: string,
  difficulty: 'EASY' | 'MEDIUM' | 'HARD' | 'EXPERT',
  resumeId: string,
  customKnowledgePoints?: string[]  // 🆕 Phase 3
}
```

### 后端处理

后端 `interview.service.ts` 会：
1. 检查 `customKnowledgePoints` 是否存在
2. 如果存在，使用自定义知识点生成面试题目
3. 如果不存在，使用简历中提取的原始知识点

## 文件变更

### 修改的文件

- `frontend/src/components/interview/MockInterviewWizardModal.tsx`
  - 新增状态：`customKnowledgePoints`, `isAddingKnowledge`, `newKnowledgeInput`
  - 新增图标导入：`Plus`, `User`, `Lightbulb`, `Target`
  - 重构 `renderStep2` 函数：实现 Bento Grid 布局
  - 更新 `handleNextStep`：初始化自定义知识点
  - 更新 `handleStartInterview`：发送自定义知识点到后端
  - 更新重置逻辑：清空自定义知识点状态

### 后端支持

后端已经支持 `customKnowledgePoints` 字段（见 `backend/src/interview/dto/interview.dto.ts`）：

```typescript
@ValidateIf((o) => o.mode === InterviewMode.RESUME)
@IsOptional()
@IsArray()
@IsString({ each: true })
customKnowledgePoints?: string[];
```

## 测试建议

1. **功能测试**
   - 上传简历 → 查看提取的知识点是否正确显示
   - 删除知识点 → 验证动画和状态更新
   - 添加知识点 → 验证输入框交互和保存逻辑
   - 提交面试 → 验证 payload 是否包含 `customKnowledgePoints`

2. **边界测试**
   - 删除所有知识点 → 仍可添加新的
   - 添加空字符串 → 应该被过滤
   - 快速连续添加/删除 → 动画应该流畅

3. **响应式测试**
   - 移动端 (375px) → Bento Grid 应该变成单列
   - 平板 (768px) → Bento Grid 应该显示两列
   - 桌面 (1024px+) → 完整布局

## 后续优化建议

1. **知识点推荐**：基于职位和简历内容，AI 推荐相关知识点
2. **知识点分类**：将知识点按技术栈分类显示
3. **知识点权重**：允许用户标记重点考察的知识点
4. **历史知识点**：保存用户常用的知识点，快速添加
5. **拖拽排序**：允许用户调整知识点的优先级

## 总结

Phase 3 成功实现了白盒化配置视图，将 AI 分析结果从黑盒变成可编辑的白盒，赋予用户更多控制权。通过精致的 Bento Grid 布局和流畅的交互动画，提升了用户体验，同时保持了界面的简洁和优雅。
