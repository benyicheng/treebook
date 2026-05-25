# 项目代码审查报告

> **项目名称**: 平行宇宙创作平台 (treebook)
> **审查日期**: 2026-05-22
> **审查范围**: 全栈 — React 前端 (src/) + Express 后端 (api/) + Prisma 数据库 (prisma/)

---

## 目录

1. [P0 — 必须修复](#p0--必须修复)
2. [P1 — 高优先级](#p1--高优先级)
3. [P2 — 中等优先级](#p2--中等优先级)
4. [P3 — 低优先级 / 建议](#p3--低优先级--建议)
5. [架构问题](#架构问题)
6. [安全审查](#安全审查)
7. [测试覆盖](#测试覆盖)
8. [前端专项](#前端专项)
9. [后端专项](#后端专项)

---

## P0 — 必须修复

### P0-1: 硬编码 JWT 密钥

| 属性 | 值 |
|------|-----|
| **严重性** | 🔴 CRITICAL |
| **文件** | `api/src/middleware/auth.ts:4`、`api/src/controllers/authController.ts:9` |
| **类型** | 安全漏洞 |

**问题描述**:

```typescript
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
```

如果 `JWT_SECRET` 环境变量未设置（如部署配置遗漏），密钥回退到公开的字符串 `'your-secret-key'`。攻击者可伪造任意用户身份的 JWT token，包括管理员。

**修复建议**:
- 启动时检查 `JWT_SECRET` 是否存在，若缺失则抛出错误终止进程
- 消除 `|| 'your-secret-key'` 回退逻辑
- 生产环境使用强随机密钥（至少 256 位）

---

### P0-2: Socket.IO 无身份认证

| 属性 | 值 |
|------|-----|
| **严重性** | 🔴 CRITICAL |
| **文件** | `api/src/index.ts:96-163` |
| **类型** | 安全漏洞 |

**问题描述**:

WebSocket 连接无任何身份验证。`request-lock` 事件直接接受客户端传来的 `userId` 和 `username`：

```typescript
socket.on('request-lock', (data: { chapterId: string, userId: string, username: string, roomId: string }) => {
```

攻击者可发送任意 `userId`/`username` 冒用他人身份锁定编辑章节。

**修复建议**:
- 在 WebSocket 连接握手阶段验证 JWT token
- `request-lock` 的 `userId` 应从已验证的 token 中提取，而非客户端提供
- 建立 socketId → userId 的映射关系

---

### P0-3: CORS 配置过于宽松

| 属性 | 值 |
|------|-----|
| **严重性** | 🔴 CRITICAL |
| **文件** | `api/src/index.ts:68-72` |
| **类型** | 安全漏洞 |

**问题描述**:

```typescript
app.use(cors({
  origin: true,       // 回显任何 Origin 头
  credentials: true,  // 允许带凭据
  optionsSuccessStatus: 200
}));
```

`origin: true` 意味着任意域名的网页都可以向该 API 发送跨域请求。配合 `credentials: true`，如果未来引入 cookie，可导致 CSRF 攻击。

**修复建议**:
- 生产环境限制 origin 到已知域名列表
- 如无 cookie 使用场景，设置 `credentials: false`

---

### P0-4: `storyService.ts` 响应双重解包 bug

| 属性 | 值 |
|------|-----|
| **严重性** | 🔴 CRITICAL |
| **文件** | `src/api/storyService.ts`（所有方法） |
| **类型** | 功能缺陷 |

**问题描述**:

Axios 拦截器 (`client.ts:30-34`) 已经将 `{ success: true, data: T }` 解包为 `response.data = T`。但所有 service 方法再次执行 `data.data || data` 解包：

```typescript
// client.ts:34 — 拦截器已解包
response.data = response.data.data

// storyService.ts - 对已解包的数据再次解包
const { data } = await client.get<any>('/branches');
return data.data || data;  // data.data 此时为 undefined → 返回原始 data
```

对于嵌套结构（如 `{ user, token }`）可以正常工作（因为 `data.data` 为 `undefined` 时会回退到 `data`）。但对于纯数组或简单对象在 `data` 字段下的情况，二次解包可能导致返回 `undefined`。

**修复建议**:
- 消除所有 service 方法中的 `data.data || data` 模式
- 统一为 `return data;`（拦截器已负责解包）

---

### P0-5: TypeScript strict 模式关闭

| 属性 | 值 |
|------|-----|
| **严重性** | 🔴 CRITICAL |
| **文件** | `tsconfig.json:19` |
| **类型** | 代码质量 |

**问题描述**:

```json
{
  "compilerOptions": {
    "strict": false
  }
}
```

`strict: false` 意味着 `strictNullChecks`、`strictFunctionTypes`、`strictBindCallApply`、`strictPropertyInitialization`、`noImplicitAny`、`noImplicitThis`、`alwaysStrict` 全部关闭。导致：

- `null`/`undefined` 在类型系统中被忽略
- 函数参数/返回值可隐式为 `any`
- 大量 `as any` 强制类型转换（`BranchPage.tsx` 至少 8 处、`authController.ts` 2 处、`api/src/index.ts` 多处）

**修复建议**:
- 开启 `"strict": true`
- 增量修复新出现的类型错误（可使用 `@ts-expect-error` 做过渡）
- 将 `noUnusedLocals` 和 `noUnusedParameters` 也开启

---

## P1 — 高优先级

### P1-1: 无路由懒加载

| 属性 | 值 |
|------|-----|
| **文件** | `src/App.tsx:2-38` |
| **类型** | 性能 |

**问题描述**:

32+ 页面组件全部使用静态 `import`，打包时全部包含在首屏 JS bundle 中。随着页面增多，首屏体积将不断膨胀。

**修复建议**:
- 使用 `React.lazy()` + `Suspense` 实现按路由分块加载
- 配置 Vite 的 `manualChunks` 将第三方库（`reactflow`、`framer-motion`）拆分

---

### P1-2: `alert()` 弹窗遍布代码

| 属性 | 值 |
|------|-----|
| **类型** | 用户体验 |

**受影响文件**（不完全列表）:

| 文件 | 行数 |
|------|------|
| `src/pages/branch/BranchPage.tsx` | 74, 77, 88, 93, 112, 130, 132 |
| `src/pages/read/ReadPage.tsx` | 106, 225 |
| `src/pages/mainline/CreateStoryPage.tsx` | 51 |
| `src/pages/mainline/hooks/useStoryDetails.ts` | 83, 87, 105, 124, 138, 140, 153, 156 |

`alert()` 阻塞浏览器主线程、无法定制样式、无法提供良好的用户反馈体验。

**修复建议**:
- 引入 Toast/Snackbar 组件（如 `react-hot-toast` 或自建）
- 统一错误提示方式

---

### P1-3: 空 catch 块静默吞错误

| 属性 | 值 |
|------|-----|
| **文件** | `src/pages/Home.tsx:47,52,57` |

```typescript
try { const data = await storyService.getRecentReads(); setRecentReads(data); }
catch {}  // 静默吞掉所有错误
```

用户无任何方式感知到数据加载失败。类似模式在 `ReadPage.tsx` 等多处存在。

---

### P1-4: 数据库使用 SQLite

| 属性 | 值 |
|------|-----|
| **文件** | `prisma/schema.prisma:27-29` |
| **类型** | 架构/可扩展性 |

```prisma
datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}
```

SQLite 在生产环境的限制：
- 不支持并发写入（写操作串行化）
- 无连接池
- 无行级安全
- 无 `Json` 字段类型（导致 JSON-as-string 反模式）
- 备份/恢复方案不成熟

**修复建议**:
- 生产环境使用 PostgreSQL（已配置但未切换）
- 开发环境使用 SQLite 保留了轻量优势，使用 `process.env.NODE_ENV` 区分

---

### P1-5: 数据库错误信息泄露

| 属性 | 值 |
|------|-----|
| **文件** | `api/src/middleware/errorHandler.ts:22` |
| **类型** | 安全 |

```typescript
return sendErr(res, 'DATABASE_ERROR', '数据库操作异常: ' + err.message, traceId, 500);
```

将 Prisma 原始错误信息（包含表名、约束名、SQL 片段）直接返回给客户端。攻击者可利用这些信息进行 SQL 注入攻击或了解数据库结构。

**修复建议**:
- 生产环境不暴露具体错误信息
- 记录完整错误到日志，返回通用消息

---

### P1-6: API 响应格式不统一

| 属性 | 值 |
|------|-----|
| **文件** | 所有控制器 |
| **类型** | 架构 |

当前存在 5+ 种响应格式：

| 格式 | 示例 | 使用位置 |
|------|------|----------|
| `{ success, data }` | `{ success: true, data: { id, title } }` | 多数控制器 |
| `{ success, data: { user, token } }` | `{ success: true, data: { user: {...}, token: "..." } }` | authController register/login |
| `{ success, message }` | `{ success: true, message: "Story deleted" }` | delete 操作 |
| CSV 直接输出 | `res.send(csv)` | roleController:54 |
| 自定义 pagination | `{ items, total, page, pageSize }` | RoleService |

**修复建议**:
- 定义统一的 `ApiResponse<T>` 类型
- 所有控制器使用同一个 `respond()` 工具函数
- 错误场景统一走 `errorHandler`

---

### P1-7: 无速率限制

| 属性 | 值 |
|------|-----|
| **文件** | 整个应用 |
| **类型** | 安全 |

`package.json` 中不存在 `express-rate-limit` 或类似中间件。`/api/auth/login` 可被暴力破解。

**修复建议**:
- 引入 `express-rate-limit`
- 对 `/api/auth/login` 和 `/api/auth/register` 应用严格的速率限制
- 考虑对 `/api/ai/*` 等资源密集型接口也加以限制

---

### P1-8: SPA fallback 在 error handler 之前

| 属性 | 值 |
|------|-----|
| **文件** | `api/src/index.ts:202-207` |
| **类型** | 架构缺陷 |

```typescript
app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

// Error handling middleware
app.use(errorHandler);
```

Express 中间件按注册顺序执行。SPA fallback 的 `app.get('*')` 会捕获所有非 API 路由，然后 `app.use(errorHandler)` 永远不会被执行到。API 路由的 404 虽然通过 `app.use('/api/*')` 处理了，但非 API 的错误（如静态资源 404）被静默转化为 HTML 响应。

**修复建议**:
- 将 `app.get('*')` 移到 `errorHandler` 之后
- 或确保 `errorHandler` 在 SPA fallback 之前

---

## P2 — 中等优先级

### P2-1: JSON 存字符串反模式

| 文件 | 字段 | 实际类型 |
|------|------|----------|
| `prisma/schema.prisma:37` | `User.profile` | String? |
| `prisma/schema.prisma:138` | `Story.metadata` | String? |
| `prisma/schema.prisma:170` | `Character.attributes` | String? |
| `prisma/schema.prisma:188` | `Chapter.characterData` | String? |
| `prisma/schema.prisma:216` | `Branch.conditions` | String? |
| `prisma/schema.prisma:243-244` | `Spinoff.referencedCharacters` / `characterRelationships` | String? |
| `prisma/schema.prisma:299` | `Collaboration.permissions` | String? |

共 8 个字段以 `String` 类型存储 JSON 数据。数据库无法验证结构完整性，无法对 JSON 内的字段做查询、索引或约束。

**修复建议**:
- 迁移到 PostgreSQL 后使用 `Json` 字段类型
- 或拆分为关联表
- 在应用层增加 Zod schema 验证

---

### P2-2: `authController.ts` 三重代码重复

| 属性 | 值 |
|------|-----|
| **文件** | `api/src/controllers/authController.ts:58-74, 110-127, 178-195` |

4 层嵌套的 Prisma include 查询完全重复 3 次：

```typescript
include: {
  roles: {
    include: {
      role: {
        include: {
          permissions: {
            include: { permission: true }
          }
        }
      }
    }
  }
}
```

同时 `Array.from(new Set(user.roles.flatMap(...)))` 提取 permissions 的逻辑也重复 3 次。

**修复建议**:
- 提取为 `UserService.getUserWithPermissions(id)` 方法
- 或使用 Prisma 的 `select` + 复用的 fragment

---

### P2-3: 三种数据获取策略混用

| 策略 | 使用位置 |
|------|----------|
| Zustand store | `useStoryStore.fetchStories()`、`useAuthStore.checkAuth()` |
| React Query | `DashboardPage`（使用 `useQuery`） |
| `useEffect` + 直接 API 调用 | `Home.tsx`、`ReadPage.tsx`、`SpinoffDetailPage`、`BooklistDetailPage` |

缓存、刷新、加载状态管理不可预测。

**修复建议**:
- 推荐策略：React Query 管理服务端状态，Zustand 只管理客户端状态（认证信息、UI 偏好）
- 逐步迁移现有 `useEffect` + API 调用到 React Query

---

### P2-4: Modal 组件无无障碍支持

| 属性 | 值 |
|------|-----|
| **文件** | `src/components/Modal.tsx` |

- 无 `role="dialog"`、`aria-modal="true"`、`aria-labelledby`
- 无焦点陷阱（Tab 键可移出模态框）
- 未使用 portal（`createPortal`），模态框渲染在 DOM 树原位

---

### P2-5: 后端测试覆盖严重不足

整个 `api/src/` 只有 4 个测试文件：

| 文件 | 断言数 | 覆盖范围 |
|------|--------|----------|
| `moderationRoutes.test.ts` | 2 | 仅管理员指标 happy path |
| `workflow.test.ts` | 2 | 仅快乐路径 |
| `moderation.test.ts` | 3 | 仅快乐路径 |
| `sensitive.test.ts` | 少量 | 敏感内容过滤 |

**覆盖率**: 控制器 0%、服务 0%、中间件 0%、错误处理器 0%。

---

### P2-6: 无结构化日志

全项目使用 `console.log` / `console.error`：

- 无日志级别（debug / info / warn / error）
- 无 JSON 格式化
- traceId 未在日志中传播
- 无法按级别/来源过滤

---

### P2-7: `useSiteConfigStore.ts` 开发日志残留

| 属性 | 值 |
|------|-----|
| **文件** | `src/stores/useSiteConfigStore.ts:74,100` |

```typescript
console.log('🔄 SiteConfigStore: merging config...');
console.log('🔄 SiteConfigStore: fetchConfig done');
```

---

### P2-8: Revenue service 无认证

| 属性 | 值 |
|------|-----|
| **文件** | `api/src/routes/revenue.ts:8-9` |

`POST /api/revenue/settle/story/:storyId` 和 `POST /api/revenue/settle/spinoff/:spinoffId` 未应用 `authenticate` 中间件，任何人可触发收入结算。

---

## P3 — 低优先级 / 建议

### P3-1: ChapterService 单次读取 8 个顺序 DB 查询

| 属性 | 值 |
|------|-----|
| **文件** | `api/src/services/ChapterService.ts:74-177` |

每次章节读取依次执行：1) findUnique chapter → 2) findUnique booklist → 3) upsert readingHistory → 4) upsert interactionStat → 5) findUnique interactionStat → 6) count comments → 7) findFirst next → 8) findFirst prev。

--- 

### P3-2: Revenue 分发 N+1 查询

| 属性 | 值 |
|------|-----|
| **文件** | `api/src/services/RevenueService.ts:154-170` |

`distributeCurationRewards` 在循环中对每个 `stats` 条目执行独立查询，且在同一事务内（加锁时间延长）。

---

### P3-3: `d3` 依赖未使用

| 属性 | 值 |
|------|-----|
| **文件** | `package.json:31,37` |

```json
"dependencies": {
  "d3": "...",
  "@types/d3": "..."
}
```

全项目 `src/` 中未发现 `import ... from 'd3'` 的调用。约 70KB+ 死代码。

---

### P3-4: 无 404 路由

| 属性 | 值 |
|------|-----|
| **文件** | `src/App.tsx` |

`<Route path="*" element={<NotFound />} />` 缺失。导航到未知路径在 MainLayout 内渲染空白页面。

---

### P3-5: 无表单验证库

所有表单使用手动 `useState` + `onChange` + `required` 属性。无 `react-hook-form`、`formik` 或客户端 Zod 校验。

---

### P3-6: `MergeRequest` 多态关联设计不当

| 属性 | 值 |
|------|-----|
| **文件** | `prisma/schema.prisma:8-24` |

`MergeRequest` 同时关联 `Branch` 和 `Spinoff`（两个可选 FK），是典型的多态关联。Prisma 处理此类关系时两个 FK 都必须 `optional`，类型安全不足。

---

### P3-7: 无 rate limiting 组件重用

`src/components/ui/Button.tsx`、`Card.tsx`、`Page.tsx` 存在但未被任何页面使用，所有页面仍然手写 Tailwind 类。

---

### P3-8: JWT 24h 过期无刷新机制

Token 过期后用户必须重新登录，无 refresh token 机制。同时 `permissions` 嵌入在 JWT 中，权限变更需 24h 才能生效。

---

## 架构问题

### A1: 服务层全部为静态方法

所有 Service（`StoryService`、`BranchService`、`ChapterService` 等）使用 `static async` 方法：

```typescript
export class StoryService {
  static async getAllStories(query) { ... }
}
```

导致：
- 无法依赖注入（hard to mock in tests）
- 测试必须使用 `vi.mock` 模块级模拟
- 耦合紧密

**建议**: 改为实例方法，或使用函数式 service 工厂，依赖（Prisma client）通过参数传入。

---

### A2: 分层不一致

```
Controllers  →  Services  →  Domains (部分)  →  Prisma
                        ↘ 直接操作 Prisma (多数)
```

`domains/` 目录已初具 DDD 雏形（`InteractionRepository`、`MediaRepository`、`ModerationOrchestrator`），但多数 Service 仍然直接操作 `prisma.model.findMany()`，未经过 repository 层。

---

### A3: Zod 验证位置不统一

- `authController.ts:12,55` — 在控制器内直接 `.parse()`
- `routes/chapters.ts` — 使用 `validateRequest` 中间件
- `spinoffs.ts:10-12`、`booklists.ts:22-24` — 完全跳过验证

---

### A4: 前端无分页策略

故事列表、分支列表、书单全部全量获取。`ModerationDashboard.tsx` 有手动分页实现但未使用 React Query 的内置分页能力。

---

## 安全审查

### 问题汇总

| 编号 | 问题 | 严重性 |
|------|------|--------|
| S1 | JWT 硬编码回退密钥 | 🔴 CRITICAL |
| S2 | Socket.IO 无身份认证 | 🔴 CRITICAL |
| S3 | CORS 回显任意 origin | 🔴 CRITICAL |
| S4 | 数据库错误信息泄露 | 🟠 HIGH |
| S5 | Revenue 结算无认证 | 🟠 HIGH |
| S6 | 无速率限制 | 🟠 HIGH |
| S7 | JWT 存 localStorage（XSS 风险） | 🟠 HIGH |
| S8 | CSP 完全禁用 | 🟡 MEDIUM |
| S9 | 密码强度仅 min(6) | 🟡 MEDIUM |
| S10 | `optionalAuthenticate` 静默吞所有 JWT 错误 | 🟡 MEDIUM |
| S11 | 注册可传 `role` 参数 | 🟡 MEDIUM |
| S12 | Profile JSON 存字符串无结构验证 | 🟢 LOW |

---

## 测试覆盖

### 前端测试

| 文件 | 断言数 | 状态 |
|------|--------|------|
| `useAuthStore.test.ts` | ~15 | ✅ 较好 |
| `interactionService.test.ts` | ~25 | ✅ 较好 |
| `LikeButton.test.tsx` | ~10 | ✅ 较好 |
| `MainlinePage.test.tsx` | ~12 | ✅ 较好 |
| `Home.test.tsx` | ~8 | ⚠️ 一般 |
| `DashboardPage.test.tsx` | ~8 | ⚠️ 一般 |
| `SpinoffDetailPage.test.tsx` | ~4 | ❌ 不足 |
| `BooklistDetailPage.test.tsx` | ~4 | ❌ 不足 |
| `StoryBranchTree.test.tsx` | ~8 | ✅ 较好 |

**未被测试的 store**: `useStoryStore`、`useSiteConfigStore`

### 后端测试

| 文件 | 断言数 | 覆盖范围 |
|------|--------|----------|
| `moderationRoutes.test.ts` | 2 | 仅快乐路径 |
| `workflow.test.ts` | 2 | 仅快乐路径 |
| `moderation.test.ts` | 3 | 仅快乐路径 |
| `sensitive.test.ts` | 少量 | 快乐路径 |

**控制器测试: 0 / 18**
**服务测试: 0 / 13**
**中间件测试: 0 / 4**

---

## 前端专项

### 性能

| 问题 | 严重性 | 说明 |
|------|--------|------|
| 32+ 页面全部静态 import | 🔴 HIGH | 无代码分割 |
| `reactflow` 全量打包 | 🔴 HIGH | ~200KB+ 仅用于一个功能 |
| `framer-motion` 全量打包 | 🟡 MEDIUM | ~30KB+，部分动画可用 CSS 替代 |
| `d3` 未使用 | 🟡 MEDIUM | ~70KB 死代码 |
| 无 bundle 分析 | 🟢 LOW | 未配置 `rollup-plugin-visualizer` |

### 可访问性

| 问题 | 示例 |
|------|------|
| 无 `<nav>` landmark | `MainLayout.tsx:76` |
| 无 `aria-label` 在纯图标按钮 | `MobileNavbar.tsx:24-35`、`ReadPage.tsx:244` |
| `outline-none` 移除焦点样式 | `ReadPage.tsx:601,622,736,748`、`LoginPage.tsx:56,71` |
| 无 skip-to-content 链接 | `MainLayout.tsx` |
| 颜色对比度不足 | 状态 badge `bg-gray-100 text-gray-700` |

### DRY 违规

| 问题 | 说明 |
|------|------|
| `Button` 组件存在但不被使用 | 各页面重复手写 15+ 种按钮样式 |
| `timeAgo` 定义在 `Home.tsx` 内 | 非 `lib/utils.ts` |
| `fetchMyBooklists` 在 3 个组件重复 | `ReadPage.tsx`、`Modal` 组件等 |
| skeleton loading 状态手写 | 未使用 `SkeletonCard`/`SkeletonRow` |

---

## 后端专项

### REST API 设计

| 问题 | 位置 |
|------|------|
| 路由排序脆弱（`/tags` 在 `/:id` 之前） | `routes/stories.ts:28-31` |
| Merge 路由使用动作动词 | `POST /merges/create` 应为 `POST /merges` |
| 同一操作多路径 | `POST /branches/:branchId/certify` vs `POST /stories/branches/:branchId/certify` |
| 无 API 版本前缀 | 全部使用 `/api/*`，无法平滑升级 |

### 数据库查询

| 问题 | 位置 | 影响 |
|------|------|------|
| 8 查询/章节读取 | `ChapterService.ts:74-177` | 延迟 |
| N+1 收入分发 | `RevenueService.ts:154-170` | 事务内循环查询 |
| 深层嵌套 include | `authController.ts:59-73`、`StoryService.ts:63-115` | payload 过大 |
| 无嵌套分页 | - | 一次性加载所有关联数据 |
| `connectOrCreate` 循环 | `StoryService.ts:135-138` | 每标签一个查询 |

### 中间件

| 问题 | 位置 |
|------|------|
| 请求日志内联在入口文件 | `api/src/index.ts:86-93` |
| `authenticate` 直接 `res.json()` 而非 `next(err)` | `middleware/auth.ts:19,27` |
| 无 body 大小限制 | `index.ts:74` — `express.json()` 无 `limit` |
| 无 Helmet CSP | `index.ts:63` — `contentSecurityPolicy: false` |

---

> **结束**: 以上共识别 **P0 问题 5 个、P1 问题 8 个、P2 问题 8 个、P3 问题 8 个**，以及架构、安全、测试方面发现若干。
>
> **最紧急行动项**:
> 1. 修复 JWT 硬编码密钥 (P0-1)
> 2. 为 Socket.IO 添加认证 (P0-2)
> 3. 收紧 CORS 配置 (P0-3)
> 4. 修复响应双重解包 bug (P0-4)
> 5. 开启 TypeScript strict 模式 (P0-5)
