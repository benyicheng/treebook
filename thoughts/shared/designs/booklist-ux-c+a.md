# Booklist 书单阅读体验优化方案 C+A

**Date**: 2026-05-23
**Status**: 设计阶段
**Branches**: master

---

## 目标

解决书单阅读的三大痛点：
1. **上下文丢失** — 点击"阅读此章节"跳转到 ReadPage，回不来
2. **无进度追踪** — 不知道读到哪了，每次从头翻
3. **重型组件** — BooklistDetailPage.tsx 971 行，耦合严重

---

## 架构概览

```
src/pages/booklist/
├── BooklistPage.tsx              ← 列表页（轻微改动）
├── BooklistDetailPage.tsx        ← 详情页（拆分重构）
├── components/                   ← NEW: 拆出来的子组件
│   ├── BooklistHeader.tsx        ← 头部区域（标题、统计、操作按钮）
│   ├── BooklistTimeline.tsx      ← 时间线列表（带三态标记）
│   ├── BooklistChapterCard.tsx   ← 单站卡片（含预览弹窗）
│   ├── ReadingDrawer.tsx         ← NEW: 阅读抽屉（方案A核心）
│   └── BooklistProgressBar.tsx   ← NEW: 进度条

src/hooks/
├── useBooklistProgress.ts        ← NEW: 阅读进度钩子（localStorage）

src/api/storyService.ts           ← 新增 progress endpoints（可选）
```

---

## 方案 C 项：增强时间线 + 关键体验优化

### C1. 阅读进度追踪 (useBooklistProgress.ts)

**核心逻辑**：使用 `localStorage` 存储每个书单的阅读进度，按 `read_progress_batch_YYMMDD` 存储（对齐项目已有模式）。

```typescript
// 数据格式
interface BooklistProgress {
  booklistId: string;
  currentItemIndex: number;   // 当前读到第几站（0-based）
  completedItemIds: string[]; // 已读完成的章节ID列表
  updatedAt: number;          // 最后更新时间戳
}

// Hook API
useBooklistProgress(booklistId, items[]) => {
  progress,           // 当前进度数据
  markCompleted,     // 标记某站已完成
  setCurrentItem,    // 设置当前阅读站
  continueReading,   // 获取"继续阅读"目标站
  resetProgress,     // 重置进度
}
```

**标记为已完成**：在阅读抽屉中读完拉到 80% 底部时自动触发（通过 scroll position），或手动点击"标记完成"。

### C2. 三态标记 + 进度条

**BooklistChapterCard 的三态视觉**：

| 状态 | 数字标样式 | 文字 |
|------|-----------|------|
| 未读 | 白色底 + 浅灰数字 | — |
| 当前 | 绿色底 + 白色数字 | 继续 |
| 已读 | 绿色底 + 勾选图标 | 已读 ✓ |

**BooklistProgressBar** — 书单顶部（header 与 timeline 之间）：

```
[◼◼◼◼◼◼◼◼◼◻]  2/8 站已完成
```

- 放置在 header 卡片底部（`pb-0`），轻量不突兀
- 点击进度条或具体站可跳转
- 动画过渡 `transition-all duration-500`

**代码插入位置**：`BooklistDetailPage.tsx` L483-484 — `</div>` 关闭 header 和 `<div className="space-y-12 px-4 relative">` 开始 timeline 之间。

### C3. "继续阅读"按钮

替代旧版"开始旅程"的单一行为：

- **首次访问**：显示"开始旅程"（跳第一站）
- **有进度**：按钮文字变为"继续阅读 → 第{N}站：{章节名}"，直接跳转到断点
- 按钮放在原"开始旅程"位置（header 右侧），保持显眼

**涉及改动**：`BooklistDetailPage.tsx` L434-439 的 `onClick` 逻辑。

### C4. 悬浮预览弹窗

在 timeline 卡片上 hover 时（桌面端）弹出内容预览：

```
┌────────────────────────────────────────────┐
│  📖 第三章：抉择                            │
│                                             │
│  "他站在两个世界之间，不知道该选哪一个..."  │
│  ——前 200 字内容摘要——                      │
│                                             │
│  来源：主线 | 作者：XXX | 约 3500 字       │
│  ──────────────────────────────────────     │
│  [💬 导游点评] 这一章是路线的转折点...      │
└────────────────────────────────────────────┘
```

- 使用 CSS `group-hover` + absolute positioned tooltip
- 延迟 300ms 显示（防误触）
- 移动端改为点击"预览"按钮触发 Modal
- 预览内容从 `item.chapter.content` 截取前 200 字

### C5. ReadPage 头部加入书单导航

修改 `ReadPage.tsx` 顶栏（L264-275 区域）：

```
[← 返回] 书单名 > 第3站：章节标题  [❌退出路线]
                                    [←上一章] [下一章→]
```

- 仅当 URL 含 `?referralId={booklistId}` 时显示
- 通过 `referralId` 获取书单信息（可在 ReadPage 增加一个轻量 fetch）
- 上一章/下一章跳转到书单的上/下一站，而不是故事的上/下一章
- 退出路线：回到书单详情页

**涉及新增数据获取**：ReadPage 需要知道书单的项目列表，可以通过 `booklistService.getById(referralId)` 获取 `items` 数组。

### C6. 添加章节流程优化（一步搜索）

当前流程：搜故事 → 选故事 → 加载章节 → 选章节（两步 loading）

优化为：**全局搜索章节**（跨故事搜章节标题）

```

┌──────────────────────────────────────────────┐
│  搜索章节（支持跨故事）  [🔍]                  │
│  ┌──────────────────────────────────────┐    │
│  │ 输入章节标题...                        │    │
│  └──────────────────────────────────────┘    │
│                                              │
│  搜索结果（实时）：                           │
│  ┌──────────────────────────────────────┐   │
│  │ 📖 觉醒  — 故事A · 主线 · 第1章  [+] │   │
│  │ 📖 觉醒  — 故事B · 分支 · 第3章  [+] │   │
│  └──────────────────────────────────────┘   │
│                                              │
│  导游点评（可选）：                           │
│  ──────────────────────────────────────      │
└──────────────────────────────────────────────┘
```

**依赖**：后端需要新增一个搜索 API 或复用现有搜索，返回 `chapterId` + `chapter.title` + `story.title` + `branchId`。如果没有后端支持，可以先保留旧的两步流程，把"搜索故事"的过滤做得更好（加防抖、加空状态）。

---

## 方案 A 项：Inline 阅读抽屉

### A1. ReadingDrawer 组件

**触发方式**：
- 点击"阅读此章节"按钮（L537-543）
- 点击"继续阅读"按钮（L435）
- 点击三态标记的"当前"标签

**UI 表现**：

```
┌────────────────────────────────────────────────┐
│  书单详情页（背景变暗 50%，不可滚动）          │
│                                                │
│          (上方内容半透明遮罩层)                  │
│                                                │
│  ═══════  ✕ 关闭   🌐 阅读路线  4/8 站 ═══════│  ← 抽屉头部
│   ← 上一站   📖 第三章：抉择   下一站 →        │  ← 站导航
│  ─────────────────────────────────────────     │
│                                                │
│  【Markdown 内容渲染区】                        │
│                                                │
│  他站在两个世界之间，不知道该选哪一个...        │
│  月光透过窗户洒在地板上...                      │
│                                                │
│  ─────────────────────────────────────────     │
│              [✅ 标记为已读]                    │  ← 底部操作
│  ═══════════════════════════════════════════════│  ← 抽屉底边
└────────────────────────────────────────────────┘
```

**技术实现**：

```
<ReadingDrawer
  isOpen={boolean}
  onClose={() => void}
  items={booklist.items}
  initialIndex={number}    // 从第几站开始
  onProgressUpdate={(index) => void}
/>
```

- 固定在视口底部，高度 `85vh`
- 使用 `react-markdown` 渲染内容（复用 ReadPage 的渲染方式）
- ESC 或点击遮罩/✕ 关闭
- 动画：`translateY(100%) → translateY(0)` + `opacity` 300ms
- 阅读设置（字号、字体、主题）暂不内嵌，保持轻量；后续可考虑像 ReadPage 一样保存 `localStorage` 设置
- 关闭抽屉时自动调用 `progress.setCurrentItem(currentIndex)` + `markCompleted`（如果已滑动到底部）

**添加"阅读全部"模式**：抽屉内点击"下一站"自动加载下一章内容，形成连读体验。全部读完时显示总结弹窗。

**新增 Lucide 图标引用**：
- 检查是否需要新增：`X` 已有（L22），`ChevronLeft` 已有（L15），`ChevronRight` 已有（L13）
- 可能需要新增：`Maximize2`, `Minimize2`

### A2. Backdrop 与滚动锁定

当抽屉打开时：
```css
body { overflow: hidden; }
```
使用 `useEffect` 在组件 mount/unmount 时切换。已经复用的 `Modal` 组件有类似逻辑，可以参照。

---

## 拆件/重构计划

### BooklistDetailPage.tsx 拆件

为了 C+A 的改动干净，先做组件拆分：

| 组件 | 职责 | 提取代码范围 |
|------|------|-------------|
| `BooklistHeader` | 标题、徽章、统计、操作按钮 | L358-482 |
| `BooklistTimeline` | 时间线容器 + 整体布局 | L486-640 |
| `BooklistChapterCard` | 单站卡片（含三态、悬浮预览） | L506-618 |
| `BooklistProgressBar` | 进度条组件 | 新增 |
| `ReadingDrawer` | 阅读抽屉 | 新增 |

> 已有 Modal 弹窗（编辑、删除、分享、笔记、添加章节）暂时保持原位，后续再考虑抽取。

---

## 用户操作流程对比

### 优化前
```
书单详情页 → 点击"阅读此章节" → 跳转 ReadPage
         → 看完点浏览器返回 → 回到书单详情（从头找位置）
         → 忘记读到哪了，重来
```

### 优化后
```
书单详情页 → 点击"继续阅读/阅读此章节" → 底部弹出阅读抽屉
         → 在抽屉内阅读 + 前后站导航
         → 自动标记已完成
         → 关闭抽屉 → 回到书单详情（进度已更新）
              → 或者点击"下一站" → 连读

或者：
书单详情页 → 点击"阅读此章节" → ReadPage
         → 顶部有书单面包屑导航
         → 点击"← 上一站 / 下一站 →" 在书单内切换
         → 点击"退出路线" → 回到书单详情
```

---

## 文件改动清单

| 文件 | 改动类型 | 说明 |
|------|---------|------|
| `src/pages/booklist/BooklistDetailPage.tsx` | 重构 | 拆为小组件 + 集成进度条 + 集成继续阅读按钮 + 集成阅读抽屉 |
| `src/pages/booklist/components/BooklistHeader.tsx` | 新建 | 标题区组件 |
| `src/pages/booklist/components/BooklistTimeline.tsx` | 新建 | 时间线容器 |
| `src/pages/booklist/components/BooklistChapterCard.tsx` | 新建 | 单站卡片 |
| `src/pages/booklist/components/BooklistProgressBar.tsx` | 新建 | 进度条 |
| `src/pages/booklist/components/ReadingDrawer.tsx` | 新建 | 阅读抽屉 |
| `src/hooks/useBooklistProgress.ts` | 新建 | 阅读进度钩子 |
| `src/pages/read/ReadPage.tsx` | 修改 | 加书单导航面包屑（有referralId时） |
| `src/pages/booklist/BooklistPage.tsx` | 微调 | 列表页进度展示（可选） |

---

## 需要确认的问题

1. **添加章节搜索** — 是否需要后端支持跨故事搜索章节？如果没有后端 API，先保留旧的两步流程
2. **连读模式** — 抽屉内读完站 A 自动跳到站 B，是否需要自动滚动过渡？（当前设计是用户手动点"下一站"）
3. **ReadPage 书单导航** — 上一章/下一章在书单内还是故事内？（设计是书单内，意味着需要 `booklistId` + `items` 数据）
4. **移动端抽屉** — 85vh 的抽屉在手机小屏上阅读区只有约 60vh，是否可接受？

---

## 注意事项

- **阅读进度只存 localStorage**，不涉及后端改动。后期可考虑存到用户设置中保证跨端同步
- **导航保留兼容**：旧 URL 模式 `/read/{chapterId}?referralId={booklistId}` 保持不变
- **样式复用**：`ReadingDrawer` 内的 Markdown 渲染样式尽量复用 `ReadPage` 中的现有样式（字号、行距、间距等）
- **可访问性**：抽屉 ESC 关闭、focus trap、aria 标签
