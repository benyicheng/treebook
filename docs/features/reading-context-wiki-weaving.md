# 书单 ↔ 阅读 ↔ 百科 三链路贯通（Reading Context & Wiki Weaving）

> 把「编排（书单）→ 阅读（章节）→ 查证（百科）」这条内容消费闭环上一批「已实现却没接通」的断点全部接线：正文内嵌百科浮窗、阅读来源/进度贯穿、书单阅读进度、角色↔百科、事件详情、关系图谱。

| | |
|---|---|
| **状态** | 已实现 |
| **落地阶段** | P0（正文百科 + 阅读上下文）→ P1（书单进度 + 章节入口 + 角色百科）→ P2（事件详情 + 关系图谱） |
| **新增依赖** | 无（remark 插件复用 react-markdown 传递依赖 `unified`/`unist-util-visit`） |
| **构建** | 涉及文件 typecheck/build 全通过；C2 顺带修复 12 个预存构建错误 |

---

## 一、功能概览

本次围绕三个模块的交互断点，分三批（P0/P1/P2）接线，共 6 组功能：

| 编号 | 功能 | 入口 | 价值 |
|---|---|---|---|
| P0-A | 正文内嵌百科浮窗 | 章节正文 / 书单导读 / 选词 | 阅读中即时查证世界观 |
| P0-B | 阅读上下文贯穿 | 阅读页工具栏 + 右侧面板 | 「从哪来、读到哪」始终可见 |
| P1-C1/C3 | 书单进度 + 章节阅读入口 | 书单「章节」Tab | 编排→阅读闭环 + 进度可视 |
| P1-A3 | 角色 ↔ 百科打通 | 阅读页右侧面板角色卡 | 角色一键查百科 |
| P2-C2 | 书单事件详情 | 书单「大事件」Tab | 事件评论/节点/管理 |
| P2-C4 | 关系图谱自定义关系 | 书单「图谱」Tab | 激活 relation 标注能力 |

---

## 一·补：以故事页为起点的操作路径

下面以一条真实 URL 为入口，串起本次所有优化功能，可逐条手动验证：

> 起点：`http://localhost:5173/story/08bc2904-e3c7-4d85-bcee-d88cdeb8173a`

### 路径 ① 正文内嵌百科 + 选词查词 + 角色百科（P0-A / A3）

```
/story/{storyId}                         故事详情页
  └─ 概览 Tab → 点「第一章」封面卡片         navigate('/read/{chapterId}')
      └─ /read/{chapterId}                  阅读页
          ├─ 正文里 [[卡特]] 悬停 → 百科浮窗 → 点击进 /wiki/{id}     ← P0-A
          ├─ 选中正文任意文字 → 「🔍查百科」工具条 → 结果浮窗           ← P0-A
          └─ 右侧 ContextPanel 「角色出场」→ 点角色卡 → 跳 /wiki/{id}  ← P1-A3
```

### 路径 ② 阅读上下文贯穿（P0-B）

```
/story/{storyId}
  └─ 宇宙分叉树 Tab → 点章节节点 → /read/{chapterId}（无 ctx）
      └─ 右侧 ContextPanel 默认展开，显示章节导航 / 同级分支 / 相关番外 / 角色出场
          （普通阅读也有面板 — 此前仅带 ctx 才显示）
```

### 路径 ③ 书单进度 + 章节阅读入口 + 来源贯穿（P1-C1/C3 + P0-B 闭环）

```
/story/{storyId}
  └─ 概览或章节 Tab → 章节「⋯」→ 加入书单
      └─ /booklist/{booklistId} → 「章节」Tab
          ├─ 顶部进度条（X/N 站已完成 + 百分比）                     ← P1-C1
          ├─ 点章节行 → /read/{chapterId}?ctx=booklist:{booklistId}  ← P1-C3
          └─ 阅读页工具栏显示「书单阅读」徽章 + 右侧面板显示来源+进度  ← P0-B
              └─ 读完返回书单 → 该章显示 ✓ 对勾
```

### 路径 ④ 事件详情（P2-C2）

```
/booklist/{booklistId} → 「大事件」Tab → 点事件卡片
  └─ EventDetailDrawer 抽屉
      ├─ 关联内容（章节/分支/番外）查看跳转、创建者可增删排序
      ├─ 评论区 查看/发表/删除
      └─ 创建者：编辑/删除事件、从此事件创建分支/番外
```

### 路径 ⑤ 关系图谱自定义关系（P2-C4）

```
/booklist/{booklistId} → 「图谱」Tab
  ├─ Canvas 中绿色实线 = 用户自定义关系（带箭头 + 中点标签）
  └─ 下方关系管理面板
      ├─ 创建者：选 源条目→目标条目 + 关系类型 + 标签 → 添加
      └─ 已有关系列表 → 🗑 删除
```

### 速查：各功能对应 URL 模式

| 功能 | URL |
|---|---|
| 故事详情（起点） | `/story/{storyId}` |
| 阅读页（带书单上下文） | `/read/{chapterId}?ctx=booklist:{booklistId}` |
| 阅读页（带路径上下文） | `/read/{chapterId}?ctx=path:{pathId}` |
| 阅读页（带轨迹上下文） | `/read/{chapterId}?ctx=trail:{trailId}` |
| 书单详情 | `/booklist/{booklistId}` |
| 百科详情 | `/wiki/{wikiPageId}` |

---

## 二、P0-A：正文内嵌百科浮窗


### 2.1 语法与渲染

作者在 Markdown 正文中写 `[[实体名称]]`（如 `[[林深]]`），渲染时该词变为**带紫色虚线下划线**的可交互文本。

- **悬停** → 150ms 后弹出百科摘要浮窗（标题、类型徽章、摘要、关联数）。
- **点击** → 客户端路由跳转 `/wiki/:id`（不刷新整页）。

### 2.2 三个入口

| 入口 | 位置 |
|---|---|
| 章节正文 | 阅读页 `/read/:id`，`ChapterContent` 用 `WikiText` 渲染 |
| 书单导读 | 书单详情「概览」Tab，`BooklistOverviewTab` 用 `WikiText` 渲染 |
| 选词查词 | 阅读页选中 ≥2 字文本 → 选区上方「🔍 查百科」浮动工具条 → 结果浮窗 |

### 2.3 技术要点

- **`src/utils/remarkWikiEntities.ts`**：remark 插件，在 MDAST 层把 `[[名称]]` text 节点拆成 `text + link(url='wiki:名称')` 序列。选用 link 节点而非自定义节点/HTML，避免引入 `rehype-raw`。
- **`src/components/wiki/WikiText.tsx`**：`<ReactMarkdown remarkPlugins={[remarkWikiEntities]}>` + 自定义 `a` 组件拦截 `wiki:` 前缀 → 渲染 `WikiPopover`。内置 `useWikiNameCache`：页面内所有实体名去重后**批量 lookup 一次**，缓存 `name→wikiId`，避免每个浮窗各自请求。传入自定义 `urlTransform` 放行 `wiki:` 前缀（react-markdown v10 的 `defaultUrlTransform` 会把非标准协议清空为 `''`，导致跳转自身页——这是必须的修复）。
- **`WikiPopover.tsx` 修复**：`<a href>`→`<Link>`（消除整页刷新）；已知 wikiId 走 `getById` 而非按名 lookup；浮窗定位监听 scroll/resize 重算；加桥接区消除「触发元素→浮窗」缝隙误关。

---

## 三、P0-B：阅读上下文贯穿

### 3.1 来源徽章（工具栏）

从书单/阅读路径/阅读轨迹进入阅读时，工具栏故事名左侧显示徽章：

| 来源类型 | 徽章文案 | 点击行为 |
|---|---|---|
| `booklist` | 书单阅读 | 回书单详情页 |
| `path` | 阅读路径 | 回路径详情页 |
| `trail` | 阅读轨迹 | 回轨迹页 |

（此前仅 booklist 显示徽章，path/trail 无来源标识。）

### 3.2 右侧上下文面板（ContextPanel）

- **常驻挂载**：普通阅读（无来源上下文）也显示面板，可看章节导航/同级分支/相关番外/角色出场。
- **来源感知区**：从书单/路径/轨迹进入时，顶部显示来源标题 + 进度条 + 节点序列（当前高亮、已读打勾），可直接上下章切换。
- **path/trail 差异说明**：path 类型提示「导览型，不记录进度，如需记录请从路径详情页『开始阅读』生成轨迹」；trail 类型保留「完成并继续」按钮。

### 3.3 技术要点

- 消除 `ReadPage` 与 `ContextPanelContent` **重复调用** `useReadingContext`：改由 ReadPage 取一次经 prop 注入。
- 进入书单章节自动 `readingCtx.markCurrentRead()` **回写进度**（此前进度算了却从不回写）。
- 上/下章统一走 `readingCtx.prev()/next()`，保持来源不断链。
- 进度埋点由恒传 0 改为按滚动比例分档上报 0/50/100。

---

## 四、P1：书单进度 + 章节阅读入口 + 角色百科

### 4.1 书单阅读进度（C1）

- **入口**：书单详情页 → 「章节」Tab，主线章节区顶部。
- **表现**：`BooklistProgressBar` 显示 `X/N 站已完成 + 百分比进度条`（组件此前存在但从未渲染）。
- 数据来自 `useBooklistProgress`（localStorage + 后端双写），经 `useBooklistDetail` → `BooklistDetailPage` → `BooklistContentTab` 下传。

### 4.2 章节阅读入口 + 进度视觉（C3）

- **可点击阅读**：章节行跳转 `/read/:id?ctx=booklist:<书单id>`，与 P0-B 闭环。
- **已读**：绿色 `✓` + 标题淡化。
- **当前**：高亮边框 + 「当前」徽章 + 阅读按钮文案变「继续」。
- 覆盖创建者视图（可拖拽）、非创建者视图（按故事分组）、「故事」分组区。
- chapterId 在书单条目与阅读进度两端一致，故读完返回书单即见对勾。

### 4.3 角色 ↔ 百科（A3）

- **入口**：阅读页右侧面板「角色出场」区角色卡。
- **交互**：点击 → 按角色名 `wikiService.lookup`，命中跳 `/wiki/:id`，未命中提示「暂无『角色名』的百科词条」，查询中显示 loading。
- （此前点击只弹「Wiki 链接尚未启用」死提示。）

---

## 五、P2：事件详情 + 关系图谱

### 5.1 书单事件详情（C2）

- **入口**：书单详情页 → 「大事件」Tab → **点击事件卡片**（此前卡片完全不可点击）。
- **功能**（激活闲置的 `EventDetailDrawer`）：
  - 标题/重要度星级/类型/描述/点赞/分享；
  - 关联内容（章节/分支/番外）查看跳转，创建者可搜索添加、拖拽排序、移除；
  - 评论区：查看/发表/删除；
  - 创建者可编辑/删除事件、「从此事件创建分支/番外」。
- **技术要点**：
  - `storyEventService` 补齐与后端对齐的接口：`getComments`/`createComment`/`deleteComment`、`search`（`GET /events?q=`），修正 `removeNode` 签名为 `(eventId, nodeId)`。
  - 修复 `EventDetailDrawer` 预存类型错误：`c.authorId/c.author`→`c.userId/c.user`、`ConfirmDialog` `variant`→`danger`、`addNode` targetType 联合类型。
  - 连带修复 `AddItemDrawer`/`AddItemDialog` 的 `storyEventService.search` 报错。

### 5.2 关系图谱自定义关系（C4）

- **入口**：书单详情页 → 「图谱」Tab。
- **功能**（激活闲置的 relation 后端能力）：
  - 图谱新增**绿色实线边**（带箭头 + 中点标签），展示用户自定义关系；图例新增「自定义关系」。
  - 下方**关系管理面板**：创建者选「源条目 → 目标条目 + 关系类型 + 可选标签」创建；已有关系列表可删除；所有人可见已有关系。
  - 关系类型预设：关联 / 引用 / 对比 / 续作 / 前传 / 伏笔。
- **技术要点**：接入 `useBooklistGraph`/`useCreateRelation`/`useDeleteRelation`（此前全部闲置）。canvas 节点用 `booklistItem.id`，与后端 `sourceItemId/targetItemId` 天然对齐。`BooklistDetailPage` 透传 `booklistId` + `isCreator`。

---

## 六、涉及文件

### 新增

- `src/utils/remarkWikiEntities.ts` — `[[实体]]` remark 插件
- `src/components/wiki/WikiText.tsx` — 支持百科实体的 Markdown 渲染器（含批量名称缓存）

### 修改

| 阶段 | 文件 |
|---|---|
| P0 | `components/wiki/WikiPopover.tsx`、`pages/read/components/ChapterContent.tsx`、`pages/read/components/ReadingToolbar.tsx`、`pages/read/ReadPage.tsx`、`pages/read/hooks/useReadPage.ts`、`pages/read/hooks/useWikiLookup.ts`、`pages/booklist/components/BooklistOverviewTab.tsx`、`components/ui/ContextPanel.tsx`、`components/ui/ContextPanelContent.tsx`、`api/types.ts` |
| P1 | `pages/booklist/components/BooklistContentTab.tsx`、`pages/booklist/BooklistDetailPage.tsx`、`components/ui/ContextPanelContent.tsx` |
| P2 | `api/storyEventService.ts`、`pages/booklist/components/EventDetailDrawer.tsx`、`pages/booklist/components/BooklistEventTab.tsx`、`pages/booklist/components/BooklistGraphTab.tsx`、`pages/booklist/BooklistDetailPage.tsx` |

---

## 七、验收清单

- [ ] 章节正文含 `[[角色名]]` 时悬停出浮窗、点击进 `/wiki/:id`（无整页刷新）
- [ ] 书单导读正文的 `[[条目]]` 同样可交互
- [ ] 阅读页选中文本 → 弹「查百科」工具条 → 点击出结果浮窗
- [ ] 从书单/路径/轨迹进入阅读，工具栏显示对应来源徽章、可点击回来源页
- [ ] 阅读页右侧面板显示来源 + 进度 + 节点序列；普通阅读也有面板
- [ ] path 类型显示「导览型」差异说明
- [ ] 书单「章节」Tab 顶部显示进度条；章节可点击阅读；读完返回见对勾
- [ ] 阅读页面板点角色 → 有百科则跳详情、无则提示
- [ ] 书单「大事件」Tab 点事件卡 → 打开详情抽屉（评论/节点/管理可用）
- [ ] 书单「图谱」Tab → 创建者可增删自定义关系，关系以绿色连线显示

---

## 八、数据样例（基于 `prisma/seed_full.ts` 种子数据）

下列数据取自项目全量种子脚本，用于直观说明各功能的输入/输出形态。ID 为种子运行后实际值（此处以语义占位表示）。

### 8.1 正文内嵌百科（P0-A）

**前提**：章节 `ch12`（第二章：古老的信号）正文含标记：

```markdown
终端机屏幕上跳动着不属于人类文明的字符，[[卡特]]决定深入调查。
信号源来自[[深空七号空间站]]。
```

`WikiText` 渲染时，`useWikiNameCache` 批量预查这两个实体名：

| 实体名（`[[...]]` 内） | lookup 命中的 wikiPage | contentType | wikiId 缓存 |
|---|---|---|---|
| 卡特 | 艾伦·卡特 | character | 已知 → 浮窗走 `getById` |
| 深空七号空间站 | 深空七号 | setting | 已知 → 浮窗走 `getById` |

**浮窗展示**（悬停「卡特」时）：

```
┌──────────────────────────────┐
│ 艾伦·卡特            [角色]  │
│ 银河联盟第7探索舰前舰长...   │
│ 📖 3 条关联   ↗ 查看详情     │
└──────────────────────────────┘
```

点击 → 路由跳转 `/wiki/{alan-carter 的 id}`（客户端 Link，不刷新）。

### 8.2 阅读上下文（P0-B）

从书单 `booklist1`（硬核科幻必读路线）进入章节 `ch12`，URL 为：

```
/read/{ch12.id}?ctx=booklist:{booklist1.id}
```

**工具栏徽章**：故事名左侧显示 `[书单阅读]`，点击回 `/booklist/{booklist1.id}`。

**右侧 ContextPanel 来源感知区**：

| 字段 | 值 |
|---|---|
| 来源类型 | booklist |
| 来源标题 | 硬核科幻必读路线 |
| 进度 | 33%（1/3 站已完成） |
| 节点序列 | ① 遗忘的哨所 ✓ · ② 古老的信号 ▶当前 · ③ 深渊的回声 |

书单 `booklist1` 的主线条目（种子数据）：

| orderIndex | 章节 | notes | 完成态 |
|---|---|---|---|
| 1 | 第一章：遗忘的哨所 | 开篇必读 | ✓ 已读 |
| 2 | 第二章：古老的信号 | 核心悬念 | ▶ 当前 |
| 3 | 第三章：深渊的回声 | 剧情高潮 | 未读 |

进入 ch12 时触发 `markCurrentRead()` → `booklist_progress` 写入 `{currentItemIndex:1, completedItemIds:[ch11.id]}` → 进度条更新为 33%。

**path 类型对比**：从阅读路径 `rp1`（星际余晖·主线探索）进入时，面板下方显示差异说明：

> 阅读路径为导览型，可按顺序阅读但不记录进度。如需记录阅读进度，请从路径详情页「开始阅读」生成阅读轨迹。

`rp1` 的节点（种子数据）：

| sortOrder | contentId | contentTitle | note |
|---|---|---|---|
| 0 | ch11 | 遗忘的哨所 | 故事从这里开始 |
| 1 | ch12 | 古老的信号 | 神秘信号之谜 |
| 2 | ch13 | 深渊的回声 | 真相逐渐浮出水面 |

### 8.3 角色 ↔ 百科（P1-A3）

阅读 `ch12` 时 ContextPanel「角色出场」区展示故事 `星际余晖` 的角色：

| 角色名 | role | 点击行为 |
|---|---|---|
| 艾伦·卡特 | protagonist | lookup 命中 → 跳 `/wiki/{wikiPage.id}` |
| NEXUS-9 | supporting | lookup 命中 → 跳 `/wiki/{wikiPage.id}` |

对应 wikiPage 种子（contentType=character）：

| title | slug | summary |
|---|---|---|
| 艾伦·卡特 | alan-carter | 银河联盟第7探索舰前舰长 |
| NEXUS-9 | nexus-9 | 空间站中枢AI，拥有超越图灵测试的智慧 |

### 8.4 书单章节进度 + 阅读入口（P1-C1/C3）

`BooklistContentTab` 接收的进度数据（来自 `useBooklistProgress`）：

| 字段 | 类型 | 示例值 | 说明 |
|---|---|---|---|
| `completedCount` | number | 1 | 已完成章节数 |
| `totalItems` | number | 3 | 主线条目总数 |
| `completionPercentage` | number | 33 | 百分比 |
| `currentItemIndex` | number | 1 | 当前阅读下标 |
| `completedItemIds` | string[] | [ch11.id] | 已读章节 id 列表 |

**进度条渲染**（`BooklistProgressBar`）：

```
✓ 1/3 站已完成                          33%
████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░
起点                                   终点
```

**章节行视觉**：

| 序号 | 标题 | 视觉 | 点击跳转 |
|---|---|---|---|
| ✓ | 第一章：遗忘的哨所 | 绿勾 + 标题淡化 | `/read/{ch11}?ctx=booklist:{bl1}` |
| ▶ | 第二章：古老的信号 | 高亮边框 + 「当前」徽章 + 「继续」按钮 | `/read/{ch12}?ctx=booklist:{bl1}` |
| 3 | 第三章：深渊的回声 | 正常序号 + 「阅读」按钮 | `/read/{ch13}?ctx=booklist:{bl1}` |

### 8.5 关系图谱（P2-C4）

`useBooklistGraph` 返回结构：

```jsonc
{
  "items": [ /* 所有 booklistItem（含 chapter/branch/spinoff/wiki enrichment） */ ],
  "relations": [
    {
      "id": "rel-001",
      "sourceItemId": "bli1",   // 第一章：遗忘的哨所
      "targetItemId": "bli3",   // 第三章：深渊的回声
      "relationType": "foreshadow",
      "label": "哨所信号→深渊真相",
      "sourceItem": { "id": "bli1", "targetType": "chapter" },
      "targetItem": { "id": "bli3", "targetType": "chapter" }
    }
  ],
  "nodes": 3,
  "edges": 1
}
```

**图谱渲染**：

```
        ① 遗忘的哨所
            ╲
             ╲ 绿色实线（foreshadow · 哨所信号→深渊真相）
              ╲
        ③ 深渊的回声
```

**关系管理面板**（创建者）：

| 源条目 | 关系类型 | 标签 | 目标条目 | 操作 |
|---|---|---|---|---|
| 第一章：遗忘的哨所 | 伏笔 | 哨所信号→深渊真相 | 第三章：深渊的回声 | 🗑 删除 |

创建关系时的请求：

```jsonc
POST /booklists/{booklist1.id}/relations
{ "sourceItemId": "bli1", "targetItemId": "bli3", "relationType": "foreshadow", "label": "哨所信号→深渊真相" }
```

### 8.6 数据流速查

| 功能 | 写入路径 | 读取路径 |
|---|---|---|
| 正文百科浮窗 | — | `GET /wiki-pages/lookup?q=` 批量预查 |
| 选词查百科 | — | `GET /wiki-pages/lookup?q=` |
| 书单进度回写 | `PUT /booklists/:id/progress` + localStorage | `GET /booklists/:id/progress` |
| 阅读轨迹推进 | `POST /reading-paths/trails/:id/advance` | `GET /reading-paths/trails/:id` |
| 事件评论 | `POST /events/:id/comments` | `GET /events/:id/comments` |
| 关系增删 | `POST/DELETE /booklists/:id/relations[/:rid]` | `GET /booklists/:id/graph` |
| 进度埋点 | `POST /analytics/track`（0/50/100） | — |

---

## 九、已知边界（非本次范围）

- **设计系统收口（D）**：补 Button/Tabs/Drawer 原语、统一三套 Spinner、清理死 token 层——数量级更大，另行排期。
- **预存构建错误**：本会话开始前工作区已有 28 个 TS 错误（`RoleManagement`/`ReadingDrawer`/`ReviewCasesPage`/`EditorialChangesPage`/`FollowPage`/`useNotificationStore`/`useUniverseFeed`），为其它未提交改动的 service API 不匹配，与本特性无关。
