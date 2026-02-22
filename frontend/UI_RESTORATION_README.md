# UI_RESTORATION_README.md
# 🎯 GitHub 原版 UI 逆向解析文档 (Reverse Engineering Audit)

> **本文档是 Phase 3 像素级重构的唯一合法宪法，任何代码修改必须严格遵循此文档。**

---

## 📋 目录

1. [OnboardingView 逆向解析](#1-onboardingview-逆向解析)
2. [DocumentLibraryView 逆向解析](#2-documentlibraryview-逆向解析)
3. [SettingsView 逆向解析](#3-settingsview-逆向解析)
4. [DocumentUploadModal 逆向解析](#4-documentuploadmodal-逆向解析)
5. [DocumentPreviewModal 逆向解析](#5-documentpreviewmodal-逆向解析)
6. [通用动效与质感清单](#6-通用动效与质感清单)
7. [Framer Motion 参数速查表](#7-framer-motion-参数速查表)

---

## 1. OnboardingView 逆向解析

### 1.1 布局骨架剖析

```
根容器: h-screen w-full bg-slate-50 flex flex-col relative overflow-hidden

├── 🌈 Ambient Background (absolute, pointer-events-none, z-0)
│   ├── div: absolute top-[-10%] right-[-5%] w-[600px] h-[600px] rounded-full bg-indigo-500/5 blur-[120px]
│   └── div: absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] rounded-full bg-slate-500/5 blur-[100px]
│
├── 📌 Fixed Header (flex-none, sticky top-0, z-10)
│   └── div: pt-safe px-6 pb-6 md:pt-12 md:pb-8 bg-slate-50/80 backdrop-blur-sm
│       └── div: max-w-4xl mx-auto text-center
│           ├── motion.h1: text-2xl md:text-4xl font-bold text-slate-900 mb-2 tracking-tight leading-tight
│           └── motion.p: text-sm md:text-lg text-slate-500 leading-relaxed max-w-2xl mx-auto
│
├── 📜 Scrollable Content (flex-1, overflow-y-auto, z-10)
│   └── div: max-w-5xl mx-auto px-4 md:px-6 pb-40 pt-2
│       └── div: grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4
│           └── [ROLE_CARDS × 16]
│
├── 🎭 Scroll Fading Mask (absolute, pointer-events-none, z-20)
│   └── div: absolute bottom-[88px] md:bottom-[100px] left-0 right-0 h-12 bg-gradient-to-t from-slate-50 to-transparent
│
└── 🦶 Sticky Footer (absolute bottom-0, z-50)
    └── motion.div: bg-white/80 backdrop-blur-xl border-t border-slate-200 pb-safe
        └── div: max-w-7xl mx-auto p-4 md:p-6 flex items-center justify-between gap-4
```

### 1.2 Role Card DOM 结构 (单个卡片)

```jsx
<motion.button
  className={`relative group p-4 md:p-6 rounded-2xl border-2 text-left transition-all duration-300 
              flex flex-col items-start gap-3 md:gap-4 h-full min-h-[140px] md:min-h-[160px]
              ${isSelected 
                ? 'bg-indigo-50/50 border-indigo-600 shadow-lg shadow-indigo-500/10' 
                : 'bg-white border-slate-200 hover:border-indigo-200 hover:bg-slate-50/50'}`}
>
  {/* Icon Container */}
  <div className={`p-2.5 md:p-3 rounded-xl transition-colors duration-300 
                   ${isSelected 
                     ? 'bg-indigo-100 text-indigo-600' 
                     : 'bg-slate-100 text-slate-500 group-hover:bg-white group-hover:text-indigo-500'}`}>
    <Icon className="w-5 h-5 md:w-7 md:h-7" />
  </div>
  
  {/* Label */}
  <span className={`font-bold text-xs md:text-sm transition-colors 
                    ${isSelected ? 'text-indigo-900' : 'text-slate-600 group-hover:text-slate-900'}`}>
    {role.label}
  </span>
  
  {/* Check Icon (AnimatePresence) */}
  <AnimatePresence>
    {isSelected && (
      <motion.div className="absolute top-3 right-3 md:top-4 md:right-4 text-indigo-600">
        <CheckCircle2 className="w-5 h-5 md:w-6 md:h-6 fill-indigo-100" />
      </motion.div>
    )}
  </AnimatePresence>
</motion.button>
```

### 1.3 Framer Motion 参数

| 元素 | 属性 | 值 |
|------|------|-----|
| Header h1 | initial | `{ opacity: 0, y: -20 }` |
| Header h1 | animate | `{ opacity: 1, y: 0 }` |
| Header h1 | transition | `{ duration: 0.6, ease: "easeOut" }` |
| Header p | initial | `{ opacity: 0 }` |
| Header p | animate | `{ opacity: 1 }` |
| Header p | transition | `{ delay: 0.2, duration: 0.6 }` |
| Role Card | initial | `{ opacity: 0, y: 30 }` |
| Role Card | whileInView | `{ opacity: 1, y: 0 }` |
| Role Card | viewport | `{ once: true, margin: "50px" }` |
| Role Card | transition | `{ duration: 0.5, delay: index % 4 * 0.05 }` |
| Role Card | whileHover | `{ y: -4, boxShadow: "0 10px 30px -10px rgba(79, 70, 229, 0.1)" }` |
| Role Card | whileTap | `{ scale: 0.95 }` |
| Check Icon | initial | `{ scale: 0, opacity: 0 }` |
| Check Icon | animate | `{ scale: 1, opacity: 1 }` |
| Check Icon | exit | `{ scale: 0, opacity: 0 }` |
| Footer | initial | `{ y: 100 }` |
| Footer | animate | `{ y: 0 }` |

### 1.4 CTA Button 状态

```jsx
// Enabled State
className="w-full md:w-auto px-8 py-3.5 rounded-xl font-bold text-base flex items-center justify-center gap-2 
           transition-all duration-300 bg-indigo-600 text-white shadow-lg shadow-indigo-500/30 
           hover:bg-indigo-700 hover:scale-[1.02] active:scale-[0.98] animate-pulse"

// Disabled State
className="... bg-slate-100 text-slate-400 cursor-not-allowed"
```

---

## 2. DocumentLibraryView 逆向解析

### 2.1 布局骨架剖析

```
根容器: p-4 md:p-8 max-w-7xl mx-auto h-full overflow-y-auto relative z-10 pb-24 md:pb-8

├── 🌈 Ambient Background (absolute, -z-10)
│   ├── div: absolute top-[5%] right-[10%] w-[500px] h-[500px] rounded-full bg-indigo-500/5 blur-[120px]
│   └── div: absolute bottom-[10%] left-[5%] w-[400px] h-[400px] rounded-full bg-emerald-500/5 blur-[100px]
│
├── 📌 Header & Search Section
│   └── div: flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 pt-safe md:pt-0
│       ├── Title Block
│       │   ├── h2: text-2xl md:text-3xl font-bold text-slate-900 tracking-tight
│       │   └── p: text-base md:text-lg text-slate-500 mt-1
│       └── Search & Upload
│           ├── Search Input: w-full sm:w-64 pl-10 pr-4 h-12 bg-white/60 backdrop-blur-md border border-slate-200 rounded-xl
│           └── Upload Button: h-12 px-6 bg-indigo-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-indigo-500/30
│
├── 🏷️ Fluid Tabs
│   └── div: flex flex-wrap gap-2 mb-8 p-1.5 bg-slate-100/50 backdrop-blur-sm rounded-2xl w-full md:w-fit border border-slate-200/50
│       └── [TAB_BUTTONS × 4] with layoutId="activeTab"
│
├── 📁 File Grid (motion.div layout)
│   └── div: grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6
│       └── [DOCUMENT_CARDS] or [EMPTY_STATE]
│
└── 🔲 Modals
    ├── DocumentUploadModal
    └── DocumentPreviewModal
```

### 2.2 Document Card DOM 结构

```jsx
<motion.div
  layout
  initial={{ opacity: 0, scale: 0.9 }}
  animate={{ opacity: 1, scale: 1 }}
  exit={{ opacity: 0, scale: 0.9 }}
  transition={{ type: "spring", stiffness: 300, damping: 25 }}
  className="group relative bg-white rounded-2xl border border-slate-200 shadow-sm 
             hover:shadow-xl hover:shadow-indigo-500/10 transition-all duration-300 
             overflow-hidden flex flex-col md:block"
>
  {/* Main Content */}
  <div className="p-6 flex-1 relative">
    {/* Pin Icon (conditional) */}
    {doc.isPinned && (
      <div className="absolute top-0 right-0 p-2">
        <Pin className="w-4 h-4 text-indigo-500 fill-indigo-500/20 rotate-45" />
      </div>
    )}
    
    {/* File Icon */}
    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${categoryColors}`}>
      <FileIcon className="w-6 h-6" />
    </div>
    
    {/* Title */}
    <h3 className="font-bold text-slate-900 text-lg mb-1 line-clamp-2 leading-tight">{doc.title}</h3>
    
    {/* Meta */}
    <div className="flex items-center gap-3 text-xs text-slate-400 font-medium mb-4">
      <span>{doc.size}</span>
      <span className="w-1 h-1 rounded-full bg-slate-300"></span>
      <span>{doc.date}</span>
    </div>
    
    {/* Tags */}
    <div className="flex flex-wrap gap-2">
      {doc.tags.map(...)}
    </div>
  </div>
  
  {/* Desktop Hover Action Bar */}
  <div className="md:absolute md:bottom-0 md:left-0 md:w-full md:translate-y-full 
                  md:group-hover:translate-y-0 transition-transform duration-300 z-10">
    <div className="bg-slate-900/90 backdrop-blur-md p-4 flex justify-around items-center 
                    border-t border-white/10 md:rounded-b-2xl">
      {/* Pin, Preview, Download, Delete buttons */}
    </div>
  </div>
  
  {/* Mobile Action Bar */}
  <div className="md:hidden border-t border-slate-100 p-3 flex justify-around bg-slate-50/50">
    {/* Preview, Download buttons */}
  </div>
</motion.div>
```

### 2.3 Fluid Tab 动效

```jsx
<button className={`relative px-4 py-2 rounded-xl text-sm font-medium transition-colors z-10 
                    flex-1 md:flex-none text-center
                    ${activeTab === tab.id ? 'text-indigo-700' : 'text-slate-500 hover:text-slate-700'}`}>
  {activeTab === tab.id && (
    <motion.div
      layoutId="activeTab"
      className="absolute inset-0 bg-white rounded-xl shadow-sm border border-slate-200/50 -z-10"
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    />
  )}
  {tab.label}
</button>
```

---

## 3. SettingsView 逆向解析

### 3.1 布局骨架剖析

```
根容器: p-4 md:p-8 max-w-4xl mx-auto h-full overflow-y-auto pb-24 md:pb-8

├── 📌 Header
│   └── div: mb-6 md:mb-8 pt-safe md:pt-0
│       ├── h2: text-2xl md:text-3xl font-bold text-slate-900 mb-1 md:mb-2 tracking-tight
│       └── p: text-base md:text-lg text-slate-500
│
└── 📦 Settings Cards Stack
    └── div: space-y-4 md:space-y-6
        ├── [Profile Card]
        ├── [Subscription Card]
        ├── [Notifications Card]
        ├── [Danger Zone Card]
        └── [Sign Out Button]
```

### 3.2 Settings Card 通用结构

```jsx
<div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
  {/* Card Header */}
  <div className="px-4 py-3 md:px-6 md:py-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
    <Icon className="w-5 h-5 text-slate-500" />
    <h3 className="font-medium text-slate-900">{title}</h3>
  </div>
  
  {/* Card Content */}
  <div className="p-4 md:p-6 space-y-6">
    {children}
  </div>
</div>
```

### 3.3 Profile Section 详细结构

```jsx
{/* Avatar Row */}
<div className="flex flex-col md:flex-row items-center gap-6">
  <div className="w-20 h-20 bg-slate-900 rounded-full flex items-center justify-center 
                  text-2xl text-white font-medium shadow-lg shadow-indigo-500/20">
    JD
  </div>
  <div className="space-y-2 text-center md:text-left">
    <button className="px-4 h-12 md:h-auto md:py-2 bg-white border border-slate-200 rounded-lg 
                       text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 
                       transition-colors flex items-center justify-center">
      Change Avatar
    </button>
    <p className="text-xs text-slate-400">JPG, GIF or PNG. Max size of 800K</p>
  </div>
</div>

{/* Form Grid */}
<div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
  {/* Input Fields */}
</div>
```

### 3.4 Subscription Banner

```jsx
<div className="flex flex-col md:flex-row items-start md:items-center justify-between 
                p-4 bg-indigo-50 rounded-xl border border-indigo-100 mb-6 gap-4 md:gap-0">
  <div className="flex items-center gap-4">
    <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0">
      <Sparkles className="w-5 h-5 text-white" />
    </div>
    <div>
      <p className="font-semibold text-indigo-900">Pro Plan</p>
      <p className="text-sm text-indigo-700">Billed annually • Next billing date: Oct 24, 2026</p>
    </div>
  </div>
  <button className="w-full md:w-auto px-4 py-2 bg-white text-indigo-600 text-sm font-medium 
                     rounded-lg shadow-sm border border-indigo-200 hover:bg-indigo-50 transition-colors">
    Manage Subscription
  </button>
</div>
```

### 3.5 Toggle Switch 结构

```jsx
<label className="relative inline-flex items-center cursor-pointer">
  <input type="checkbox" defaultChecked={item.default} className="sr-only peer" />
  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer 
                  peer-checked:after:translate-x-full peer-checked:after:border-white 
                  after:content-[''] after:absolute after:top-[2px] after:left-[2px] 
                  after:bg-white after:border-gray-300 after:border after:rounded-full 
                  after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600">
  </div>
</label>
```

### 3.6 Danger Zone Card

```jsx
<div className="bg-white rounded-2xl border border-red-100 shadow-sm overflow-hidden">
  {/* Header - 特殊红色主题 */}
  <div className="px-4 py-3 md:px-6 md:py-4 border-b border-red-100 bg-red-50/30 flex items-center gap-3">
    <Shield className="w-5 h-5 text-red-500" />
    <h3 className="font-medium text-red-900">Danger Zone</h3>
  </div>
  
  {/* Content */}
  <div className="p-4 md:p-6 flex flex-col md:flex-row items-start md:items-center 
                  justify-between gap-4 md:gap-0">
    <div>
      <p className="text-sm font-medium text-slate-900">Delete Account</p>
      <p className="text-xs text-slate-500">Permanently remove your account and all data.</p>
    </div>
    <button className="w-full md:w-auto px-4 py-2 bg-white border border-red-200 text-red-600 
                       text-sm font-medium rounded-lg hover:bg-red-50 transition-colors">
      Delete Account
    </button>
  </div>
</div>
```

### 3.7 Sign Out Button

```jsx
<div className="flex justify-end pt-4 pb-8">
  <button 
    onClick={onLogout}
    className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-3 
               bg-slate-200 text-slate-700 rounded-xl font-medium hover:bg-slate-300 transition-colors"
  >
    <LogOut className="w-4 h-4" /> Sign Out
  </button>
</div>
```

---

## 4. DocumentUploadModal 逆向解析

### 4.1 布局骨架剖析

```
Modal Wrapper: fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6

├── 🌫️ Backdrop
│   └── motion.div: absolute inset-0 bg-slate-900/40 backdrop-blur-sm
│
└── 📦 Modal Content
    └── motion.div: relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden z-10
        ├── Header: flex items-center justify-between p-6 border-b border-slate-100
        ├── Content: p-6 space-y-6
        │   ├── Dropzone
        │   ├── Category Selection
        │   └── Progress Bar (conditional)
        └── Footer: p-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3
```

### 4.2 Dropzone 结构

```jsx
<div 
  className={`relative border-2 border-dashed rounded-2xl h-48 flex flex-col items-center 
              justify-center text-center transition-all duration-200 
              ${dragActive 
                ? 'border-indigo-500 bg-indigo-50/50' 
                : 'border-slate-200 bg-slate-50/50 hover:border-indigo-300 hover:bg-indigo-50/30'}`}
  onDragEnter={handleDrag}
  onDragLeave={handleDrag}
  onDragOver={handleDrag}
  onDrop={handleDrop}
  onClick={() => inputRef.current?.click()}
>
  {/* Hidden Input */}
  <input ref={inputRef} type="file" className="hidden" accept=".pdf,.docx,.doc,.txt" />
  
  {/* File Selected State */}
  {file ? (
    <div className="flex flex-col items-center animate-in fade-in zoom-in duration-300">
      <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center 
                      mb-3 text-indigo-600 shadow-sm">
        <FileText className="w-8 h-8" />
      </div>
      <p className="font-medium text-slate-900 truncate max-w-[200px]">{file.name}</p>
      <p className="text-xs text-slate-500 mt-1">{fileSize} MB</p>
      <button className="mt-3 text-xs font-bold text-red-500 hover:text-red-600 hover:underline">
        Remove file
      </button>
    </div>
  ) : (
    /* Empty State */
    <div className="flex flex-col items-center pointer-events-none">
      <div className="w-12 h-12 bg-white rounded-xl shadow-sm border border-slate-100 
                      flex items-center justify-center mb-3 text-indigo-500">
        <UploadCloud className="w-6 h-6" />
      </div>
      <p className="font-medium text-slate-700">Click to upload or drag and drop</p>
      <p className="text-xs text-slate-400 mt-1">PDF, DOCX or TXT (MAX. 10MB)</p>
    </div>
  )}
  
  {/* Drag Overlay */}
  {dragActive && (
    <div className="absolute inset-0 bg-indigo-500/10 backdrop-blur-[1px] rounded-2xl 
                    flex items-center justify-center border-2 border-indigo-500 pointer-events-none">
      <p className="font-bold text-indigo-600 text-lg">Drop file here</p>
    </div>
  )}
</div>
```

### 4.3 Category Selection

```jsx
<div className="space-y-3">
  <label className="text-sm font-bold text-slate-700 block">Document Type</label>
  <div className="grid grid-cols-3 gap-3">
    {['resume', 'cover_letter', 'other'].map((cat) => (
      <button
        key={cat}
        onClick={() => setCategory(cat)}
        className={`px-3 py-2.5 rounded-xl text-xs font-bold border transition-all capitalize 
                    ${category === cat 
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-500/20' 
                      : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-200 hover:bg-slate-50'}`}
      >
        {cat.replace('_', ' ')}
      </button>
    ))}
  </div>
</div>
```

### 4.4 Progress Bar

```jsx
{uploading && (
  <div className="space-y-2">
    <div className="flex justify-between text-xs font-medium text-slate-500">
      <span>Uploading...</span>
      <span>{progress}%</span>
    </div>
    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
      <motion.div 
        className="h-full bg-indigo-500 rounded-full"
        initial={{ width: 0 }}
        animate={{ width: `${progress}%` }}
        transition={{ duration: 0.2 }}
      />
    </div>
  </div>
)}
```

### 4.5 Modal Framer Motion 参数

| 元素 | 属性 | 值 |
|------|------|-----|
| Backdrop | initial | `{ opacity: 0 }` |
| Backdrop | animate | `{ opacity: 1 }` |
| Backdrop | exit | `{ opacity: 0 }` |
| Modal | initial | `{ opacity: 0, scale: 0.95, y: 20 }` |
| Modal | animate | `{ opacity: 1, scale: 1, y: 0 }` |
| Modal | exit | `{ opacity: 0, scale: 0.95, y: 20 }` |

---

## 5. DocumentPreviewModal 逆向解析

### 5.1 布局骨架剖析

```
Modal Wrapper: z-50 flex items-center justify-center overflow-hidden
               ${isFullScreen ? 'absolute inset-0 bg-slate-50' : 'fixed inset-0 p-4 sm:p-6'}

├── 🌫️ Backdrop (仅非全屏模式)
│   └── motion.div: absolute inset-0 bg-slate-900/60 backdrop-blur-md z-0
│
└── 📦 Modal Content (左右分栏)
    └── motion.div: relative bg-white shadow-2xl overflow-hidden z-10 flex flex-col md:flex-row
                    ${isFullScreen ? 'w-full h-full rounded-none' : 'w-full max-w-6xl h-[85vh] rounded-3xl'}
        
        ├── 📄 Left: Document Viewer (flex-1)
        │   └── div: bg-slate-100 relative flex flex-col min-w-0 overflow-hidden
        │       ├── Toolbar: h-14 bg-white border-b border-slate-200 shadow-sm
        │       └── Canvas: flex-1 overflow-auto p-8 bg-slate-50/50
        │
        └── 📋 Right: Sidebar Info (w-full md:w-80)
            └── div: bg-white border-l border-slate-200 flex flex-col h-full shadow-[-10px_0_30px_-10px_rgba(0,0,0,0.05)]
                ├── Header: p-6 border-b border-slate-100 sticky top-0
                ├── Metadata: p-6 space-y-6 flex-1 overflow-y-auto
                └── Actions Footer: p-6 border-t border-slate-100 bg-slate-50 sticky bottom-0
```

### 5.2 Zoom Toolbar

```jsx
<div className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-4 z-20 relative shadow-sm">
  <div className="flex items-center gap-2">
    <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
      <button 
        onClick={handleZoomOut}
        className="p-1.5 hover:bg-white hover:shadow-sm rounded-md text-slate-500 transition-all active:scale-95"
      >
        <ZoomOut className="w-4 h-4" />
      </button>
      <span className="text-xs font-medium text-slate-600 px-2 min-w-[3rem] text-center">
        {Math.round(scale * 100)}%
      </span>
      <button 
        onClick={handleZoomIn}
        className="p-1.5 hover:bg-white hover:shadow-sm rounded-md text-slate-500 transition-all active:scale-95"
      >
        <ZoomIn className="w-4 h-4" />
      </button>
    </div>
  </div>
  <div className="text-sm font-medium text-slate-500">Page 1 of 2</div>
</div>
```

### 5.3 Document Canvas (Mock)

```jsx
<div className="flex-1 overflow-auto p-8 flex justify-center bg-slate-50/50 relative z-0">
  <div 
    className="transition-transform duration-200 ease-out origin-top"
    style={{ transform: `scale(${scale})` }}
  >
    <div className="w-[800px] bg-white shadow-lg min-h-[1000px] p-12 space-y-8 
                    relative group border border-slate-200/60">
      {/* Mock Content Blocks */}
      
      {/* Hover Overlay */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center 
                      opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-50">
        <div className="bg-slate-900/80 backdrop-blur-sm text-white px-6 py-3 rounded-full 
                        font-medium shadow-xl transform scale-90 group-hover:scale-100 
                        transition-transform border border-white/10">
          Preview Mode
        </div>
      </div>
    </div>
  </div>
</div>
```

### 5.4 Sidebar Metadata Item

```jsx
<div className="flex items-center gap-3 text-sm">
  <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-500 flex-none">
    <Icon className="w-4 h-4" />
  </div>
  <div className="min-w-0 flex-1">
    <p className="text-slate-500 text-xs">{label}</p>
    <p className="font-medium text-slate-900 truncate">{value}</p>
  </div>
</div>
```

### 5.5 AI Insights Card

```jsx
<div className="bg-indigo-50/50 rounded-2xl p-4 border border-indigo-100">
  <h4 className="text-sm font-bold text-indigo-900 mb-3 flex items-center gap-2">
    <FileText className="w-4 h-4 flex-none" /> 
    <span className="truncate">AI Summary</span>
  </h4>
  <p className="text-xs text-indigo-800/80 leading-relaxed break-words">
    {summaryText}
  </p>
</div>
```

### 5.6 Preview Modal Framer Motion 参数

| 元素 | 模式 | initial | animate | exit |
|------|------|---------|---------|------|
| Backdrop | 非全屏 | `{ opacity: 0 }` | `{ opacity: 1 }` | `{ opacity: 0 }` |
| Modal | 非全屏 | `{ opacity: 0, scale: 0.95, y: 20 }` | `{ opacity: 1, scale: 1, y: 0 }` | `{ opacity: 0, scale: 0.95, y: 20 }` |
| Modal | 全屏 | `{ opacity: 0 }` | `{ opacity: 1 }` | `{ opacity: 0 }` |

---

## 6. 通用动效与质感清单

### 6.1 毛玻璃效果 (Glassmorphism)

| 场景 | 类名组合 |
|------|----------|
| 轻度模糊 | `bg-white/60 backdrop-blur-md` |
| 中度模糊 | `bg-white/80 backdrop-blur-xl` |
| 重度模糊 | `bg-slate-900/90 backdrop-blur-md` |
| Header 模糊 | `bg-slate-50/80 backdrop-blur-sm` |
| Modal Backdrop | `bg-slate-900/40 backdrop-blur-sm` 或 `bg-slate-900/60 backdrop-blur-md` |

### 6.2 阴影系统

| 场景 | 类名 |
|------|------|
| 卡片默认 | `shadow-sm` |
| 卡片悬停 | `shadow-xl shadow-indigo-500/10` |
| 按钮主色 | `shadow-lg shadow-indigo-500/30` |
| 按钮次色 | `shadow-lg shadow-indigo-500/20` |
| Modal | `shadow-2xl` |
| Avatar | `shadow-lg shadow-indigo-500/20` |

### 6.3 圆角系统

| 元素 | 类名 |
|------|------|
| 小按钮 | `rounded-lg` |
| 中按钮 | `rounded-xl` |
| 大按钮/CTA | `rounded-xl` |
| 卡片 | `rounded-2xl` |
| Modal | `rounded-3xl` |
| Avatar | `rounded-full` |
| Icon Container | `rounded-xl` 或 `rounded-2xl` |
| Tabs Container | `rounded-2xl` |

### 6.4 Ambient Background Glow 模式

```jsx
{/* 标准双色光晕 */}
<div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none -z-10">
  <div className="absolute top-[X%] right-[Y%] w-[Npx] h-[Npx] rounded-full bg-indigo-500/5 blur-[120px]" />
  <div className="absolute bottom-[X%] left-[Y%] w-[Npx] h-[Npx] rounded-full bg-emerald-500/5 blur-[100px]" />
</div>
```

---

## 7. Framer Motion 参数速查表

### 7.1 通用 Spring 配置

```js
transition={{ type: "spring", stiffness: 300, damping: 30 }}
```

### 7.2 Modal 进出场

```js
// Backdrop
initial={{ opacity: 0 }}
animate={{ opacity: 1 }}
exit={{ opacity: 0 }}

// Modal Content
initial={{ opacity: 0, scale: 0.95, y: 20 }}
animate={{ opacity: 1, scale: 1, y: 0 }}
exit={{ opacity: 0, scale: 0.95, y: 20 }}
```

### 7.3 卡片列表动画

```js
// 容器
<motion.div layout>

// 子项
initial={{ opacity: 0, scale: 0.9 }}
animate={{ opacity: 1, scale: 1 }}
exit={{ opacity: 0, scale: 0.9 }}
transition={{ type: "spring", stiffness: 300, damping: 25 }}
```

### 7.4 Hover 交互

```js
whileHover={{ y: -4, boxShadow: "0 10px 30px -10px rgba(79, 70, 229, 0.1)" }}
whileTap={{ scale: 0.95 }}

// 或简化版
whileHover={{ scale: 1.02 }}
whileTap={{ scale: 0.98 }}
```

### 7.5 layoutId 共享动画

```jsx
// Tab 指示器
<motion.div
  layoutId="activeTab"
  className="absolute inset-0 bg-white rounded-xl shadow-sm border border-slate-200/50 -z-10"
  transition={{ type: "spring", stiffness: 300, damping: 30 }}
/>
```

### 7.6 AnimatePresence 用法

```jsx
<AnimatePresence mode="popLayout">
  {items.map(item => (
    <motion.div
      key={item.id}
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
    >
      {/* content */}
    </motion.div>
  ))}
</AnimatePresence>
```

---

## ✅ Phase 2 完成确认

本文档已完整记录以下 5 个组件的：
- ✅ 布局骨架（Grid/Flex 约束类名）
- ✅ DOM 树形结构
- ✅ 动效与质感清单
- ✅ Framer Motion 参数

**请审核本文档，确认无误后进入 Phase 3 进行 1:1 像素级重构。**
