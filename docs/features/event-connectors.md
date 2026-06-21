# 事件卡六向连接器（Event Card Six-direction Connector）

> 把书单里的"事件"从扁平列表项升级为故事图谱的可探索坐标：每个事件卡底部展示 6 个连接器徽标，一键展开查看关联的章节 / 角色 / 地点 / 分支 / 番外 / 阅读路径，并在分支点提供双栏对比与路径叉路。

| | |
|---|---|
| **状态** | 已实现，Feature Flag 守护（默认关闭） |
| **分支** | `feat/event-connectors` |
| **落地阶段** | Phase 0 → Phase 4（全部完成） |
| **测试** | 206/206 通过（含 49 个本特性新增） |
| **数据库迁移** | 2 个（`add_event_connector_precision` / `add_reading_path_fork`） |
| **首次提交日期** | 2026-06-21 |

---

## 一、功能概览

### 六向连接器

每个事件卡底部渲染 6 个徽标，数字代表该事件关联了多少项：

| 徽标 | 连接器 | 数据来源 |
|---|---|---|
| 📖 | 章节 | `StoryEventNode` (targetType='chapter') |
| 👥 | 角色 | `CharacterAppearance` 反查事件关联的章节/分支/番外 |
| 📍 | 地点 (Wiki) | `WikiEntityMention`（解析事件描述中的 `[[wiki:slug]]`） |
| 🌿 | 分支 | `Branch.parentEventId`（精确）+ `parentChapterId`（fallback） |
| ✨ | 番外 | `Spinoff.originalEventId`（精确）+ `originalChapterId/originalBranchId`（fallback） |
| 🌿 | 分支 | `Branch.parentEventId` / `parentChapterId` |
| ✨ | 番外 | `Spinoff.originalEventId` / `originalChapterId` |
| 🛤 | 路径 | `ReadingPathNode.eventId`（已有 FK） |

- count=0 灰显不可点；count>0 着色可点击
- 点击徽标 → 卡片内展开该连接器的 top-3 预览面板
- 点预览项 → 跳转对应详情页

### 分支对比（Phase 4）

在 🌿 分支连接器展开后有 **"对比预览 ⇆"** 按钮，点击弹出双栏抽屉：

- 左栏：主线轨道（前 3 章 + 统计）
- 右栏：各分支轨道（可勾选 2-5 个，选 1 个主选）
- 底部 **"加入路径叉路"** → 在指定阅读路径的事件处插入 fork 选择点

### 路径叉路（Phase 4）

`forkPath` 在路径的指定事件后插入 N 个分支节点，共享 `forkGroupId`：
- 阅读器读到该事件时提示用户选 A/B/C 路
- `isForkPrimary` 标记默认推荐分支
- 后续节点 `sortOrder` 自动顺延，无空洞

---

## 二、架构

### 数据流（flag on 状态）

```
书单事件 tab 加载
   ↓
BooklistEventTab 收集 allEventIds
   ↓
EventConnectorsProvider（批量预拉，TanStack Query）
   │   isFrontendFlagEnabled('event_connectors') ? useQuery : 跳过
   ↓ flag on
GET /api/events/connectors?ids=...
   │
   ├─ 后端 flag off → 503 → context.isActive=false → 所有卡退化
   ├─ 网络错 → context.isActive=false → 所有卡退化
   └─ 成功 → context.byId Map<eventId, EventCardDTO>
   ↓
N 张 BooklistEventCard 各自 useEventConnector(evt.id) 命中 cache
   ↓
渲染 EventConnectorBar (6 格徽标)
   ↓ 用户点击徽标
渲染 EventConnectorInlineGrid (top-3 preview)
   ↓ 点击"对比预览"
BranchCompareDrawer 打开 → GET /api/events/:id/branches/compare
   ↓ 用户勾选分支 + 点"加入路径叉路"
POST /api/reading-paths/:id/fork
```

### 后端分层

```
api/src/domains/eventConnector/
├─ types.ts                      # EventCardDTO + 6 个 Preview + BranchComparison/Fork DTO
├─ EventConnectorService.ts      # 编排 6 路并发（2 趟 RTT）
├─ EventConnectorRepo.ts         # 6 路原子 query + getBranchComparison + 双轨
├─ EventConnectorAssembler.ts    # 纯函数合并器
├─ WikiMentionParser.ts          # [[wiki:slug]] 解析 + syncEventWikiMentions
└─ __tests__/
    ├─ EventConnectorAssembler.test.ts   # 8 个
    └─ WikiMentionParser.test.ts         # 14 个

api/src/domains/featureFlags/
├─ FeatureFlagService.ts         # env + rolloutPercent + userId 稳定分桶
└─ __tests__/FeatureFlagService.test.ts  # 9 个

api/src/controllers/
├─ eventConnectorController.ts   # getEventConnectors + getBranchComparison（flag 守护）
└─ __tests__/eventConnectorController.test.ts  # 5 个

api/src/utils/__tests__/
└─ eventConnectorValidation.test.ts  # 12 个 zod 校验
```

### 前端分层

```
src/api/eventConnectorService.ts          # DTO + fetchEventConnectors + fetchBranchComparison + forkReadingPath
src/lib/featureFlags.ts                   # 前端 flag 读取（VITE_ 变量）
src/pages/booklist/components/
├─ EventConnectorsContext.tsx             # 批量预拉 Provider + useEventConnector hook
├─ EventConnectorBar.tsx                  # 6 格徽标条
├─ EventConnectorInlineGrid.tsx           # 单连接器预览面板 + 分支对比入口
├─ eventConnectorMeta.tsx                 # 6 连接器图标/标签/颜色配置
├─ BranchCompareDrawer.tsx                # 双栏对比抽屉 + fork 操作
└─ __tests__/
    ├─ EventConnectorBar.test.tsx              # 5 个
    ├─ EventConnectorInlineGrid.compare.test.tsx  # 5 个
    └─ BooklistEventCard.flagoff.test.tsx      # 2 个（零回归契约）
```

---

## 三、Feature Flag

### 双层守护

| 层 | 变量 | 作用 |
|---|---|---|
| 后端 | `FEATURE_EVENT_CONNECTORS` + `FEATURE_EVENT_CONNECTORS_ROLLOUT_PERCENT` | 决定是否返回数据（关 → 503） |
| 前端 | `VITE_FEATURE_EVENT_CONNECTORS` | 决定是否发请求 + 渲染 UI（关 → 零网络开销） |

- **任一层关闭 → 用户看到旧版事件卡**（零回归契约）
- 后端 `rolloutPercent` 按 `userId` 稳定分桶（djb2 哈希），同一用户每次结果一致
- 无 `userId` 时保守返回 false（避免无差别放行）

### 灰度阶梯

| 阶段 | 后端 ROLLOUT_PERCENT | 前端 flag | 说明 |
|---|---|---|---|
| 开发 | 0 | true | 仅内部测试（见下） |
| 内测 | 10 | true | 10% 用户可见 |
| 公测 | 50 | true | 半量观察 |
| 全量 | 100 | true | 所有用户 |
| 回滚 | 0 / false | false | 瞬间退回旧版 |

> **内部测试**：`ROLLOUT_PERCENT=0` 时所有人不可见。临时设为 100 测完调回，或用特定 userId 落桶验证。

### 开启步骤

```bash
# 1. 后端 .env
FEATURE_EVENT_CONNECTORS=true
FEATURE_EVENT_CONNECTORS_ROLLOUT_PERCENT=100

# 2. 前端环境变量（Vite 构建期注入，改完必须重启 dev server）
VITE_FEATURE_EVENT_CONNECTORS=true

# 3. 重启
npm run server   # 后端
npm run dev      # 前端
```

---

## 四、数据库变更

### 迁移 1：`20260619000001_add_event_connector_precision`

| 改动 | 说明 |
|---|---|
| `StoryEvent.storyTime Int?` | 故事内时间序号（编年史） |
| `Branch.parentEventId String?` + FK + 索引 | 精确分支起点 |
| `Spinoff.originalEventId String?` + FK + 索引 | 精确番外起点 |
| `WikiEntityMention` 新表 | Wiki ↔ Event/Chapter/Branch/Spinoff 提及关系 |

### 迁移 2：`20260620000001_add_reading_path_fork`

| 改动 | 说明 |
|---|---|
| `ReadingPathNode.forkGroupId String?` + 索引 | 叉路分组 ID |
| `ReadingPathNode.isForkPrimary Boolean` | 组内主选标记 |

### ⚠️ FTS5 保护

两个迁移的 `prisma migrate diff` 原始输出都包含对 `content_fts*`（FTS5 虚拟表 + 影子表）的 DROP 语句——这些表由 `prisma.ts:ensureFts5Table()` 运行时创建，schema.prisma 中不可见。**已手工从迁移 SQL 中剔除 DROP 语句**，保护全文搜索功能不受影响。

### 回填脚本

```bash
# 预览（默认 dry-run，不写库）
npx tsx prisma/migrate_event_connector.ts

# 真实写入
npx tsx prisma/migrate_event_connector.ts --apply
```

回填逻辑：
- `Branch.parentEventId`：取该分支 `parentChapterId` 关联的最早事件（sortOrder 最小）
- `Spinoff.originalEventId`：优先 `originalChapterId` 的事件，fallback `originalBranchId`
- 只更新 `WHERE parentEventId/originalEventId IS NULL`，不覆盖已有值
- 全程 `$transaction`，要么全成要么全失败

### 双轨期

Repo 的 `getBranchConnectors` / `getSpinoffConnectors` 采用双轨：
- **主路**：`parentEventId` / `originalEventId` 直接命中（精确）
- **Fallback**：`parentChapterId` / `originalChapterId` 反查（Phase 1 行为）
- Fallback 仅取 `WHERE parentEventId/originalEventId IS NULL`，避免双计
- 全量回填后 fallback 路返回空集，等同被淘汰

---

## 五、API

### 批量连接器摘要

```http
GET /api/events/connectors?ids=uuid1,uuid2,...&limit=20
```

- flag off → 503 `FEATURE_DISABLED`
- ids 上限 50（zod 校验）
- 返回 `EventCardDTO[]`，每个含 6 个连接器的 `{count, preview[]}`

### 分支对比

```http
GET /api/events/:eventId/branches/compare
```

返回主线轨道 + 各分支轨道（前 3 章 preview + 统计）。

### 路径叉路

```http
POST /api/reading-paths/:pathId/fork
Content-Type: application/json

{
  "atEventId": "uuid",
  "branchOptions": ["uuid1", "uuid2"],   // 2-5 个
  "primary": "uuid1"                      // 必须在 branchOptions 内
}
```

- 403：非路径创建者
- 404：路径或事件不存在
- 400：branchOptions 数量越界 / primary 不在 options 内 / branch 不存在

---

## 六、Wiki 引用语法

在事件描述中用 `[[wiki:slug]]` 引用百科条目，保存时自动解析落表：

```
主角在 [[wiki:port-city]] 的码头遇见 [[wiki:character/mysterious-man]]，
回忆起 [[wiki:concept/fate]] 的设定。
```

| 语法 | 说明 |
|---|---|
| `[[wiki:port-city]]` | 直接 slug，匹配 `wiki_pages.slug` |
| `[[wiki:character/mysterious-man]]` | 带 contentType 前缀，会校验类型匹配 |

- 同一 slug 多次出现只算一次
- 不存在的 slug 静默跳过（不报错）
- 解析在 `StoryEventService.create/update` 后 fire-and-forget 执行，不阻塞响应

---

## 七、测试

| 测试文件 | 数量 | 覆盖 |
|---|---|---|
| `FeatureFlagService.test.ts` | 9 | flag 开关 / 灰度分桶稳定性 / rolloutPercent 边界 |
| `EventConnectorAssembler.test.ts` | 8 | 纯函数合并 / 空输入 / isBranchPoint / 多事件不串扰 |
| `WikiMentionParser.test.ts` | 14 | `[[wiki:slug]]` 解析 / 去重 / contentType 前缀 / 边界 |
| `eventConnectorController.test.ts` | 5 | flag 守护 503 / 成功响应 / ids 校验 |
| `eventConnectorValidation.test.ts` | 12 | zod schema 边界（branchOptions 2-5 / UUID / 缺字段） |
| `EventConnectorBar.test.tsx` | 5 | 6 格渲染 / 空格灰显 / 点击切换 active |
| `EventConnectorInlineGrid.compare.test.tsx` | 5 | 分支对比入口渲染 / 回调触发 / 向后兼容 |
| `BooklistEventCard.flagoff.test.tsx` | 2 | **零回归契约**：flag off 时不渲染连接器 |

**红线三件套**（每个 Phase 必过）：
```bash
npm run preflight   # = typecheck:api + typecheck:app + test
```

---

## 八、关键设计决策

| 决策 | 选择 | 原因 |
|---|---|---|
| 端点形式 | `GET /api/events/connectors?ids=...` 独立路径 | 不侵入现有 `/api/events/:id`，零回归 |
| flag 关闭行为 | 后端 503 + 前端不渲染 | 显式信号，前端可降级；双层保险 |
| 批量预拉 | `EventConnectorsProvider` 收集 eventIds 一次拉 | N 张卡 × N 次请求会打挂后端 |
| Popover | Phase 2 不做，推到后续 | 引入 floating-ui 增加复杂度，InlineGrid 已满足 MVP |
| Wiki 语法 | `[[wiki:slug]]` 而非 `@slug` | 避免 @ 与角色名混淆，与 Obsidian/MediaWiki 一致 |
| 双轨防双计 | fallback `WHERE parentEventId IS NULL` | 主路 + fallback 都可能命中同一条，NULL 过滤确保单计 |
| Wiki 同步 | fire-and-forget | 不阻塞事件写入响应；失败仅记日志 |
| FTS5 保护 | 手工剔除迁移 SQL 中的 DROP | prisma migrate diff 误把 FTS5 影子表当孤儿表 DROP |
| 路由顺序 | `/connectors` / `/:eventId/branches/compare` 必须在 `/:id` 之前 | Express 先到先得，否则被 `/:id` 吞掉 |

---

## 九、文件清单

### 新增（19 个）

**后端**
- `api/src/domains/featureFlags/FeatureFlagService.ts` + `__tests__/`
- `api/src/domains/eventConnector/{types,EventConnectorService,EventConnectorRepo,EventConnectorAssembler,WikiMentionParser}.ts` + `__tests__/` (2 文件)
- `api/src/controllers/eventConnectorController.ts` + `__tests__/`
- `api/src/utils/__tests__/eventConnectorValidation.test.ts`
- `prisma/migrate_event_connector.ts`
- `prisma/migrations/20260619000001_add_event_connector_precision/migration.sql`
- `prisma/migrations/20260620000001_add_reading_path_fork/migration.sql`

**前端**
- `src/api/eventConnectorService.ts`
- `src/lib/featureFlags.ts`
- `src/pages/booklist/components/{EventConnectorsContext,EventConnectorBar,EventConnectorInlineGrid,eventConnectorMeta,BranchCompareDrawer}.tsx`
- `src/pages/booklist/components/__tests__/` (3 文件)

### 修改（12 个）

- `prisma/schema.prisma`（+ 5 字段 + 1 表 + relations）
- `api/src/services/StoryEventService.ts`（create/update 接入 wiki 同步）
- `api/src/services/ReadingPathService.ts`（+ forkPath）
- `api/src/controllers/readingPathController.ts`（+ forkReadingPath）
- `api/src/routes/events.ts`（+ /connectors + /:eventId/branches/compare）
- `api/src/routes/readingPaths.ts`（+ /:id/fork）
- `api/src/utils/validation.ts`（+ 3 zod schemas）
- `src/pages/booklist/components/BooklistEventCard.tsx`（集成连接器 + Drawer）
- `src/pages/booklist/components/BooklistEventTab.tsx`（包 Provider）
- `src/pages/booklist/components/__tests__/BooklistEventCard.flagoff.test.tsx`（mock Drawer）
- `.env.example`（+ flag 变量）
- `package.json`（+ db scripts + preflight）

---

## 十、后续待办

- [ ] 生产数据回填：`tsx prisma/migrate_event_connector.ts --apply`
- [ ] 灰度上线：10% → 50% → 100%
- [ ] 监控指标：`event_connectors.api.p95` / `card.expand_rate` / `fallback_used`
- [ ] 双轨期结束后移除 fallback 代码
- [ ] Popover hover 预览（引入 floating-ui）
- [ ] 阅读器内 fork 节点选择 UI（读到叉路点弹窗选 A/B/C）
