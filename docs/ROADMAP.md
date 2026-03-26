# XS 功能缺口清单（Roadmap）

> 本清单以当前仓库代码现状为准，按“阻断级别/影响面/交付收益”排序。  
> 维护方式：每个条目以 PR 为单位闭环（含接口契约、实现、测试、文档、验收）。

## P0（阻断：用户可直接遇到的断点/白屏/流程断裂）

### 已完成

- 全局错误边界，避免白屏并提供复制错误信息入口  
  - [AppErrorBoundary.tsx](file:///h:/xs/src/components/AppErrorBoundary.tsx)  
  - [App.tsx](file:///h:/xs/src/App.tsx)
- TraceId 贯通（前端请求头 + 后端响应头 + 后端结构化日志）  
  - [client.ts](file:///h:/xs/src/api/client.ts)  
  - [trace.ts](file:///h:/xs/api/src/middleware/trace.ts)  
  - [index.ts](file:///h:/xs/api/src/index.ts)
- 个人资料编辑闭环（页面 + 接口 + Store）  
  - 页面路由：`/settings/profile`（见 [App.tsx](file:///h:/xs/src/App.tsx)）  
  - 后端：`PUT /api/auth/me`（见 [auth.ts](file:///h:/xs/api/src/routes/auth.ts)、[authController.ts](file:///h:/xs/api/src/controllers/authController.ts)）
- 番外详情闭环（路由 + 详情页 + 列表入口）  
  - 列表入口： [SpinoffPage.tsx](file:///h:/xs/src/pages/spinoff/SpinoffPage.tsx)  
  - 详情页： [SpinoffDetailPage.tsx](file:///h:/xs/src/pages/spinoff/SpinoffDetailPage.tsx)  
  - 路由：`/spinoff/:id`（见 [App.tsx](file:///h:/xs/src/App.tsx)）

### 待完成

- 协作（Collaboration）管理闭环（邀请/审批/移除/列表）  
  - 数据表已存在：见 [schema.prisma](file:///h:/xs/prisma/schema.prisma) 中 `Collaboration`  
  - 但后端无对应 routes/controllers，前端无 UI
- 实时协作编辑（Socket.IO）与权限控制  
  - 后端仅有裸转发： [api/src/index.ts](file:///h:/xs/api/src/index.ts)  
  - 前端编辑器导入未使用： [ChapterEditor.tsx](file:///h:/xs/src/components/Editor/ChapterEditor.tsx)
- 全站统一错误/空态/重试组件（替换 `alert()` / `console.error()`）  
  - 多页面仍有 `alert`：如 [MainlinePage.tsx](file:///h:/xs/src/pages/mainline/MainlinePage.tsx)

## P1（高价值：体验一致性、可维护性、弱网一致性）

- 全站交互规范落地（加载、空态、错误、权限拦截、可撤销、焦点管理）
- 全站无障碍（键盘可达、focus ring、ARIA 标签、对话框焦点陷阱）
- 服务端错误码与错误结构统一（推荐 `code/message/traceId/details`）
- 数据层统一：React Query 作为 server-state、Zustand 作为 session/ui-state；逐步消除页面散落本地状态
- 乐观更新与回滚：书单追加章节、故事信息更新、评论发布等场景
- 缓存淘汰与增量同步：按领域 key 管理，减少重复请求（目标 ≥ 30%）

## P2（工程化：交付稳定性与持续迭代）

- 引入 E2E（Playwright/Cypress）与 nightly 回归流水线
- 覆盖率指标与门禁（单测 ≥ 80%，核心路径 ≥ 95%）
- CHANGELOG 与升级指引、配置样例与一键启动脚本整合
- 性能与监控：p50/p95、错误率、WebSocket 连接数、前端关键指标（FCP/TTI/INP）

