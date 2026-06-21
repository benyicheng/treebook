# 变更日志

> 所有显著的项目变更记录在此。格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/)。

---

## [v0.5.0] - 2026-06-21

### ✨ 新增：事件卡六向连接器

把书单事件从扁平列表项升级为故事图谱的可探索坐标。详细文档见 [`docs/features/event-connectors.md`](./features/event-connectors.md)。

- **六向连接器**：每张事件卡底部展示 6 个徽标（📖章节 / 👥角色 / 📍地点 / 🌿分支 / ✨番外 / 🛤路径），点击展开 top-3 预览
- **分支对比**：双栏 diff 风格抽屉，比较主线与各分支走向（前 3 章 + 统计）
- **路径叉路**：在阅读路径的指定事件处插入 fork 选择点，读到该处提示选 A/B/C 路
- **Wiki 引用**：事件描述支持 `[[wiki:slug]]` 语法，保存时自动解析落表
- **Feature Flag**：双层守护（后端 env+rolloutPercent / 前端 VITE_ 变量），默认关闭，零回归

### 🏗 架构

- 新增 `FeatureFlagService`（env + rolloutPercent + userId 稳定分桶，复用 MediaConfigService 模式）
- 新增 `eventConnector` 领域（Service / Repo / Assembler / WikiMentionParser 四层分离）
- 前端 `EventConnectorsProvider` 批量预拉（TanStack Query），N 张卡共享一次请求
- 双轨 Repo：`parentEventId`/`originalEventId` 精确路径 + chapter-level fallback，渐进迁移无感

### 🗃 数据库

- 迁移 `add_event_connector_precision`：`StoryEvent.storyTime` / `Branch.parentEventId` / `Spinoff.originalEventId` / `WikiEntityMention` 新表
- 迁移 `add_reading_path_fork`：`ReadingPathNode.forkGroupId` / `isForkPrimary`
- 回填脚本 `prisma/migrate_event_connector.ts`（dry-run 默认 + `--apply` 写入）
- ⚠️ 手工剔除迁移 SQL 中对 FTS5 影子表的 DROP（prisma migrate diff 误判为孤儿表）

### 🧪 测试

- 新增 49 个测试（FeatureFlag 9 + Assembler 8 + WikiMentionParser 14 + Controller 5 + zod 12 + Bar 5 + InlineGrid 5 + Card flag-off 2 - 重叠 2）
- 全量 **206/206 通过**，29 个测试文件
- 红线三件套：`npm run preflight`（typecheck:api strict + typecheck:app + test）一键验证

### 🔧 工程

- `package.json` 新增 `db:migrate` / `db:generate` / `db:reset` / `preflight` 脚本
- `.env.example` 补 `FEATURE_EVENT_CONNECTORS` + `VITE_FEATURE_EVENT_CONNECTORS`

---

## [v0.4.0] - 2026-06-16

### 🔒 安全加固（代码质量审计 P0-P2）

- **P0**：FollowService 计数同步（`$transaction` 原子化 followerCount/followingCount）
- **P0**：修复 7 个红灯测试（client / useAuthStore / BooklistDetailPage 适配 tokenStore）
- **P1**：`express.json({ limit: '2mb' })` + `urlencoded({ extended: false })`（DoS + 原型污染）
- **P1**：`index.ts` 模块化（提取 `socket.ts` + `utils/bigint.ts`，去除 `(req as any)`）
- **P1**：`prisma.ts` 全部 `$executeRawUnsafe` → `$executeRaw(Prisma.raw)`，注释对齐
- **P1**：ESLint 配置分档（前端 browser / API node / prisma seed 放宽 + ignores 补全）
- **P1**：API `tsconfig.json` 开启 `strict: true`（9 个错误全部修复，0 错）
- **P2**：移除 `/uploads` 直链（改走 `/api/media/assets/:id` 带鉴权）
- **P2**：`StorageService` URL 改走 media API
- **P2**：`.gitignore` 补 `dist-api`
- **P2**：Wiki/Spinoff service 签名从 `any` 收紧为 zod DTO

---

## [v0.3.2] - 2026-06-04

### 🔧 修复
- FTS5 触发器语法损坏导致章节/故事等资源更新 500 错误（SQLite 3.45.0 bug，10 个触发器全部修复）
- 章节创建 403（后端运行旧版代码，重启解决）

### 🔒 安全
- 安全评估完成，识别 12 项安全风险（详见 RISK_REGISTER.md）

### 📋 管理
- 建立 PM 框架（docs/PM_FRAMEWORK.md）
- 创建产品路线图（docs/ROADMAP.md）
- 创建风险登记册（docs/RISK_REGISTER.md）

---

## [v0.3.1] - 2026-05-31

### 🎨 UI
- 全新设计系统（tailwind.config.js 令牌扩展 + CSS 变量 + 深色模式）
- 6 个基础 UI 组件（Button/Card/Input/Textarea/Skeleton/Prose/Heading）
- 统一 ReadingSettings 阅读设置组件
- ReadPage 阅读页重设计（65ch 最佳行宽、毛玻璃工具栏）
- ReadingDrawer 重构（-40% 代码量）
- 全局颜色迁移（115 文件，gray→ink，blue/emerald→accent）

---

## [v0.3.0] - 2026-05-29

### ✅ 新增
- 结构化日志（api/src/utils/logger.ts）
- UserService（消除 authController 三重重复）

### 🔧 修复
- Modal 组件全无障碍升级
- ChapterService 8 查询并发化
- RevenueService N+1 批量查询

### 🧪 测试
- 后端测试：6 文件 / 15 测试通过

### 🧹 清理
- 删除未使用 d3 依赖
- 清除 useSiteConfigStore 调试日志
- 404 Not Found 路由

---

## [v0.2.0] - 2026-05-27

### ✅ 新增
- 通知系统全链路（Notification 模型 + REST API + 前端面板 + 30s 轮询）
- 埋点 SDK + 分析系统（5 核心事件 + 批量上报 + sendBeacon）
- SQL 注入修复（SearchService Prisma.sql 模板字面量）
- Merge 执行（spinoff_official 合并）
- 阅读路径 E2E（ReadingPathService + ReadingTrailPage）
- 关注动态流（FollowService + FollowPage 三 Tab）
- 个性化推荐（三层策略：关注网络 → 相似标签 → 热门兜底）

---

## [v0.1.0] - 2026-03-26

### ✅ 新增
- 用户认证（JWT）+ 权限管理
- 主线故事系统 + 平行分支系统 + 番外作品系统
- 书单系统
- 评论系统 + 互动系统（点赞/评分/分享）
- CMS 管理系统
- 搜索功能
- 首页豆瓣阅读风格重构
- 分支展示系统全面升级
- 番外发布功能集成
