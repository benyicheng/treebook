# 数据库变更（SQLite + PostgreSQL）

## SQLite（Prisma migrations）

- 新增迁移：
  - prisma/migrations/20260414150000_review_workflow_and_media_assets/migration.sql

新增表：
- moderation_cases：人工复核工单
- moderation_case_actions：工单动作流（批注/退回/通过/拒绝等）
- media_assets：媒体资源表（owner、mime、size、hash、存储路径、状态）
- media_risk_logs：风险日志（病毒扫描/合规检测/失败原因等）

新增/变更（多级审核 + 编辑干预）：
- moderation_cases 新增字段：dueAt（SLA 截止时间）、reopenedCount（退回重提次数）
- editorial_changes：编辑改稿变更单
- editorial_change_actions：编辑改稿动作留痕（用于 ≥180 天审计）

## PostgreSQL（Supabase migrations）

- 新增迁移：
  - supabase/migrations/20260414150010_review_workflow_and_media_assets.sql

## 迁移执行建议

- 开发（SQLite）：按现有 prisma migrate 流程执行
- 生产（PostgreSQL）：按 supabase migrations 顺序执行
