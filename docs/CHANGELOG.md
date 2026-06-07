# 变更日志

> 所有显著的项目变更记录在此。格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/)。

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
