# 书树平台 — 全面功能测试报告

**测试日期**: 2026-06-04
**测试范围**: API 接口层 + 前端渲染 + 数据完整性
**测试环境**: Windows / Node 22.22.2 / Vite 6.4.1 / Express + Prisma + SQLite (FTS5)

---

## 一、测试概要

| 维度 | 状态 |
|---|---|
| 用户注册/登录 | ✅ 正常 |
| 故事 CRUD | ✅ 正常 |
| 章节 CRUD | ✅ 正常 |
| 分支创建/详情 | ✅ 正常 |
| 番外创建/详情 | ✅ 正常 |
| 评论系统 | ✅ 正常 |
| 书单管理 | ✅ 正常 |
| 关注/取关 | ✅ 正常 |
| 通知系统 | ✅ 正常 |
| 阅读路径 | ✅ 正常 |
| 权限控制 | ✅ 正常 |
| 搜索功能 | 🔴 **完全失效** |
| Vite 生产构建 | ✅ 正常 |
| TypeScript 编译 | 🟡 7 个类型错误 |
| 数据完整性 | 🟡 编码损坏记录残留 |

---

## 二、严重 Bug（P0 — 阻塞级）

### 🔴 Bug #1：搜索功能完全失效

**现象**：任何搜索查询（中文、英文、空字符串、不存在的关键词）均返回相同的热门推荐结果。`rank` 全为 0，`query` 返回空字符串，无相关性排序。

**根因**：**FTS5 虚拟表 `content_fts` 从未在数据库中创建**。

- `SearchService.ts` 第 57-76 行执行 `SELECT ... FROM content_fts WHERE content_fts MATCH ...`
- 该表在任何 Prisma 迁移中均不存在（已检查全部 17 个迁移目录）
- FTS 查询抛出 SQLite 错误，被 `catch` 块（第 106-109 行）**静默捕获**，回退到 `getHotRecommendations()` 全表扫描
- 用户完全无法感知搜索失效 — 看起来有结果但全部是假的相关性

**影响范围**：平台核心功能。用户无法通过关键词找到特定故事/章节/分支。

**修复建议**：
1. 创建 FTS5 虚拟表迁移：
   ```sql
   CREATE VIRTUAL TABLE IF NOT EXISTS content_fts
   USING fts5(title, content, type, sourceId, metadata);
   ```
2. 添加 `AFTER INSERT`/`AFTER UPDATE`/`AFTER DELETE` 触发器同步数据
3. 初始化时填充已有内容
4. 移除 `catch` 块的静默吞异常行为，改为返回空结果 + 日志告警
5. `getHotRecommendations` 仅在 `query` 为空时触发，不应作为错误回退

---

## 三、中等问题（P1）

### 🟡 Bug #2：编码损坏数据永久残留

**现象**：数据库中存在标题为 `???????` 的故事（id: `8e55a3a0-ecc8-4888-b0df-dbba3a7fa886`），搜索结果中可见。

**根因**：Git Bash 的 `curl` 对内联 JSON 字符串中的中文编码处理存在问题（UTF-8 → codepage 转换丢失），导致插入数据时中文被损坏。

**修复建议**：
1. 手动删除该损坏记录（仅此一条）
2. 后端增加输入编码验证（检测不可打印字符/替换字符）
3. API 中间件层添加 `Content-Type: charset=utf-8` 强制声明

### 🟡 Bug #3：TypeScript 编译错误（7 个）

**分布**：

| 文件 | 行号 | 类型 | 描述 |
|---|---|---|---|
| `api/src/index.ts` | 153 | Helmet CSP | CSP directives 类型不兼容，缺少 `baseUri`/`formAction` |
| `api/src/index.ts` | 210×2 | unknown type | `err` 未类型收窄就访问 `.status`/`.message` |
| `src/components/StoryTree/TreeViewToggle.tsx` | 13-15, 40 | Lucide icon | `ForwardRefExoticComponent` 与 `FC<{size?:number}>` 类型不兼容，`className` prop 缺失 |

**影响**：不影响运行时（`tsx watch` 跳过类型检查，Vite build 成功），但阻碍 IDE 代码提示和 CI 质量门禁。

**修复建议**：
- Helmet：补全 `baseUri` 和 `formAction` 字段，或添加 `as const satisfies` 断言
- err 类型：`(err as Error).status` 或类型守卫
- Lucide icon：将 `FC<{size?:number}>` 改为 `FC<LucideProps>` 并增加 `className` prop

---

## 四、轻微问题（P2）

### 🟢 Issue #4：书单封面默认图

书单创建时自动填充默认 coverImage（非用户上传），视觉上可能误导。功能层面无影响。

### 🟢 Issue #5：关注 API 设计非 RESTful

- 关注：`POST /follows/follow`（body: `followingId`）
- 取关：`POST /follows/unfollow`（body: `followingId`）

建议改为 `POST /follows`（创建关注关系）和 `DELETE /follows/:id`（删除关注关系），与 REST 规范一致。当前功能正常，仅代码风格问题。

### 🟢 Issue #6：`/api/users/me` 端点不存在

前端若依赖此端点获取当前用户信息会 404。实际应使用 `/api/auth/me`。需确认前端是否调用了错误端点。

---

## 五、正常工作模块

| 模块 | 测试结果 |
|---|---|
| **用户注册** | ✅ 正常注册、重复邮箱返回 400 |
| **用户登录** | ✅ 返回 JWT、密码错误返回 401 |
| **JWT 认证** | ✅ 无效 token 返回 401、角色鉴权正常 |
| **故事创建** | ✅ 自动设置 isOfficial（根据角色） |
| **故事获取** | ✅ 含作者信息、标签、章节数 |
| **故事删除** | ✅ 仅作者/admin 可删除 |
| **章节创建** | ✅ 需 storyId + orderIndex + title + content |
| **章节更新** | ✅ 权限校验正确 |
| **分支创建** | ✅ branchType 枚举（parallel/alternative/if_timeline） |
| **分支详情** | ✅ 含父故事/父章节信息 |
| **番外创建** | ✅ 前后端字段名一致（originalStoryId） |
| **评论** | ✅ 创建 + 获取正常 |
| **书单** | ✅ 创建 + 获取正常 |
| **关注/取关** | ✅ 频率限制 + 互关检测正常 |
| **通知** | ✅ 列表 + 未读计数正常 |
| **阅读路径** | ✅ 创建 + 步骤导航正常 |
| **标签过滤** | ✅ 按标签筛选故事正常 |
| **404 处理** | ✅ 不存在的路由返回 404 |
| **CMS** | ✅ 无认证请求被拒绝 |
| **发现页** | ✅ `/discover/universes` hot/latest Tab 正常 |

---

## 六、数据模型验证

Prisma 模型 **17 个迁移** 已全部应用，共 **50 个数据表**。核心关系链路验证通过：

```
User → Story → Chapter → Branch（从特定 chapter 分叉）
                  ↓
              Spinoff（关联 originalStory）
User → Booklist → BooklistItem（收藏 Chapter，非 Story）
User → Follow → User（互关注）
Story → Tag（多对多 via _StoryToTag）
```

---

## 七、生产构建验证

```
✅ Vite build: 9.77s — 20 个 chunk，最大 269 KB (vendor-editor)
✅ dist/ 产出 74 文件
🟡 tsc --noEmit: 7 errors (3 backend + 4 frontend)
```

---

## 八、修复优先级建议

| 优先级 | Bug | 工作量估算 |
|---|---|---|
| **P0** | 搜索功能（FTS5 虚拟表创建 + 触发器 + 索引填充） | 中等（半天） |
| **P1** | 编码损坏数据清理 | 极小（1 分钟） |
| **P1** | TypeScript 7 个编译错误 | 小（30 分钟） |
| **P2** | 书单封面默认图策略 | 小 |
| **P2** | 关注 API RESTful 重构 | 中等（需前后端同步） |
| **P2** | /api/users/me 端点确认 | 小 |

---

## 九、附录

### 测试用 JWT Token（已过期）
```
eyJhbGciOiJIUzI1NiIs...cTSyYnXBPBgNg64vXZW8nk9q9Ga4jVlLUd588kg_Lfs
User: tester999@test.com (TestBot999, role: reader)
```

### 测试创建的实体（测试后清理）
- 用户 `54a872e0-...` (TestBot999)
- 故事 `5f838d0a-...` (编码测试故事) — 已删除
- 编码损坏故事 `8e55a3a0-...` (???????) — **残留未清理**

### 技术环境
- Node.js: 22.22.2
- Vite: 6.4.1
- Prisma: SQLite + FTS5 (3.45.0)
- 后端端口: 3001（非默认 3000）
- 前端端口: 5173/5174（动态分配）
