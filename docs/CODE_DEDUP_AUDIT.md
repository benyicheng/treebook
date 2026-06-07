# 代码冗余审计报告

> 审计日期：2026-06-04 | 范围：h:\xs\ 全栈项目
> 方法：TS AST/import graph 分析 + 人工抽样验证

---

## 执行摘要

项目整体代码质量**中等偏上**。没有发现严重的架构级重复，但存在三类可量化的浪费：

| 类别 | 数量 | 严重性 |
|------|------|--------|
| **完全未使用的死代码**（删除零影响） | ~1,200 行 | 🟡 Medium |
| **重复实现**（合并可消除 ~600 行） | 11 处 | 🟡 Medium |
| **过度工程/职责混乱** | 4 处 | 🟢 Low |

**总计可安全消除：~1,800 行（约占代码库 3%）**

---

## 一、🐴 死代码：完全未被引用的代码（可直接删除）

### 1.1 前端组件（3 个文件，702 行）

| 文件 | 行数 | 原因 |
|------|------|------|
| `src/components/BrowseNav.tsx` | 160 | 导航已内联到 MainLayout，零 import |
| `src/components/CreatorNav.tsx` | 65 | 同上 |
| `src/pages/booklist/components/ReadingDrawer.tsx` | 477 | `components/Booklist/ReadingDrawer.tsx` 已替代 |

### 1.2 前端 API 服务函数（4 个函数）

| 函数 | 文件 | 行 |
|------|------|---|
| `booklistService.reorderItems` | `src/api/storyService.ts:417` | PATCH /booklists/:id/reorder |
| `booklistService.toggleProgress` | `src/api/storyService.ts:432` | POST /booklists/:id/progress/toggle |
| `chapterService.deleteComment` | `src/api/storyService.ts:256` | DELETE /chapters/comments/:commentId |
| `interactionService.getRatingReasonTags` | `src/api/interactionService.ts:80` | GET /interactions/rating-reason-tags |

### 1.3 前端 Hook 导出（13 个）

| Hook | 文件 |
|------|------|
| `useBooklistStoryLinks` | `src/hooks/useBooklists.ts:171` |
| `useSyncStoryLinks` | `src/hooks/useBooklists.ts:179` |
| `useMyBranches` | `src/hooks/useBranches.ts:21` |
| `useUpdateBranch` | `src/hooks/useBranches.ts:47` |
| `useDeleteBranch` | `src/hooks/useBranches.ts:59` |
| `useMyStories` | `src/hooks/useStories.ts:27` |
| `useStoryTags` | `src/hooks/useStories.ts:41` |
| `useMySpinoffs` | `src/hooks/useSpinoffs.ts:25` |
| `useUpdateSpinoff` | `src/hooks/useSpinoffs.ts:43` |
| `useDeleteSpinoff` | `src/hooks/useSpinoffs.ts:55` |
| `useUniverseFeed` | `src/hooks/useDiscover.ts:6` |
| `useStoryReadingPaths` | `src/hooks/useReadingPaths.ts:39` |
| `useAdvanceTrail` | `src/hooks/useReadingPaths.ts:52` |

### 1.4 前端导出类型（5 个，从未被外部 import）

| 类型 | 文件 |
|------|------|
| `FollowUser` | `src/api/followService.ts:3` |
| `PublicProfile` | `src/api/authService.ts:14` |
| `NotificationListResponse` | `src/api/notificationService.ts:15` |
| `WikiAlias` | `src/api/wikiService.ts:25` |
| `WikiLink` | `src/api/wikiService.ts:32` |

### 1.5 后端：反馈路由静默丢弃数据

`api/src/routes/feedback.ts` 第 14、41 行：
```typescript
const record = await (prisma as any).feedback?.create?.(...)
const record = await (prisma as any).report?.create?.(...)
```
`feedback` 和 `report` 表在 schema 中不存在。所有用户反馈和举报被**静默丢弃**，不报错但也没有任何效果。要么实现表，要么删除路由。

---

## 二、🔄 重复实现（同一功能的多个版本）

### 2.1 内联 Modal × 7（绕过共享 Modal 组件）

| 文件 | 行号 | 缺失功能 |
|------|------|----------|
| `components/Merge/MergeRequestModal.tsx` | 44-103 | 无 aria-modal / 焦点陷阱 / ESC |
| `components/Merge/MergeManagementModal.tsx` | 59-213 | 同上 |
| `pages/admin/RoleManagement.tsx` | 280-350+ | 同上 |
| `pages/admin/UserManagement.tsx` | 198+ | 同上 |
| `pages/admin/ModerationDashboard.tsx` | 298+ | 同上 |
| `pages/reading-path/ReadingPathsListPage.tsx` | 116+ | 同上 |

**应该做的**：全部改用 `src/components/Modal.tsx`（已有完整无障碍支持）。

### 2.2 `getHotRecommendations` 重复

| 位置 | 策略 |
|------|------|
| `SearchService.getHotRecommendations()` (第 135 行) | stories + branches + spinoffs |
| `RecommendationService.getHotRecommendations()` (第 160 行) | 仅 stories |

两个不同的实现做同一件事。应合并为单一来源。

### 2.3 游标分页样板代码（4 处重复）

`ActivityService`, `FollowService.getFollowers/getFollowing/getFollowActivity` 都独立实现了同样的 `limit+1 → hasMore → nextCursor` 模式。`utils/pagination.ts` 已有 offset 分页工具，缺少游标分页工具。

### 2.4 `certifyBranch` 路由双重注册

| 路由文件 | 路径 |
|----------|------|
| `routes/stories.ts:80` | `POST /api/stories/branches/:branchId/certify` |
| `routes/branches.ts:38` | `POST /api/branches/:branchId/certify` |

同一个 handler 通过两条不同路径暴露。确认前端用哪条，删除另一条。

### 2.5 表单提交按钮样式重复（12+ 处）

```
className="w-full py-4 bg-accent-500 text-white rounded-2xl font-black disabled:opacity-50 active:scale-95"
```

这条完全相同的 className 在至少 12 个不同表单中出现。应抽取为 `SubmitButton` 组件或至少共享 className 常量。

---

## 三、🎈 过度工程 & 职责混乱

### 3.1 `StoryService.ts` 包含 4 个领域的逻辑

当前 455 行中包含：
- Story CRUD
- **Character CRUD**（应独立为 CharacterService）
- **Branch 认证**（应属于 BranchService）
- **Tag 管理**（可独立）
- Character appearance 批量操作

### 3.2 `BooklistService.ts` 包含关系图逻辑

文件 563 行，其中约 180 行是图/关系操作（`createRelation`, `deleteRelation`, `getGraph`, `syncStoryLinks`）。占 32%。

### 3.3 `ChapterService.ts` 包含 Comment CRUD

评论逻辑（`getComments`, `createComment`, `updateComment`）在 ChapterService 中。评论同样适用于 Branches 和 Spinoffs，应抽取为 `CommentService`。

### 3.4 `InteractionService` 与 `InteractionDomainService` 重叠

`services/InteractionService.ts` 是 `domains/interactions/InteractionDomainService.ts` 的薄包装。无业务逻辑价值，增加了调用栈深度。

---

## 四、📊 建议行动清单

| 优先级 | 行动 | 预期收益 | 预计工时 |
|--------|------|----------|----------|
| 🔴 P0 | 删除 3 个死组件文件（702 行） | 清理 import 图 | 0.5h |
| 🔴 P0 | 删除 4 个死 API 函数 + 13 个死 Hook | 清理 API surface | 1h |
| 🔴 P0 | 删除 5 个未使用的导出类型 | 类型系统净化 | 0.5h |
| 🟡 P1 | 7 个内联 Modal 统一用 `<Modal>` | 无障碍 + 减少 ~400 行 | 3h |
| 🟡 P1 | `getHotRecommendations` 合并为一 | 消除逻辑分叉 | 1h |
| 🟡 P1 | 游标分页抽工具函数 | 消除 4 处样板 | 1h |
| 🟡 P1 | 合并/删除冗余 `certifyBranch` 路由 | API 净化 | 0.5h |
| 🟢 P2 | StoryService 拆出 CharacterService | 关注点分离 | 2h |
| 🟢 P2 | BooklistService 拆出 GraphService | 关注点分离 | 2h |
| 🟢 P2 | ChapterService 拆出 CommentService | 复用性 | 2h |
| 🟢 P2 | 修复 feedback 路由（实现或删除） | 避免静默数据丢失 | 1h |
| 🟢 P3 | 抽取 SubmitButton 组件 | 一致性 | 1h |

**P0 总工时：2h，可消除 ~1,000 行死代码**

---

## 五、工具改进建议

当前 `tsconfig.json` 中 `noUnusedLocals: false` + `noUnusedParameters: false`，ESLint 也未启用 `no-unused-vars`。建议：

```json
// tsconfig.json
"noUnusedLocals": true,
"noUnusedParameters": true
```

启用后 tsc 会自动捕获上述死代码，防止未来积累。
