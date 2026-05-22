# 内容管理系统：功能审计与架构优化（阶段化交付）

## 目标

- 在不破坏现有“内容写入 → 异步机审 → 读取侧遮罩”的稳定链路基础上，补齐人工审核处置台、编辑干预机制与媒体上传能力
- 与现有机审框架打通：机审结果自动生成待办工单，人工复核可覆盖机审裁决并留痕
- 引入媒体资产模型与安全检测（大小限制、基础病毒扫描、风险日志），并具备可降级开关

## 文档

- 功能审计与缺口清单：functional_audit.md
- 目标架构与分层方案：architecture.md
- 接口说明（后端）：api.md
- 数据库变更（SQLite/PostgreSQL）：db.md
- 上线/灰度/回滚手册：runbook.md

## 代码位置（新增/改造）

- 人工审核工单（Review Workflow）
  - 后端域：api/src/domains/reviewWorkflow
  - API：api/src/routes/reviewWorkflow.ts（/api/review-workflow）
  - 管理页：/admin/review-cases
- 媒体上传（Media）
  - 后端域：api/src/domains/media
  - API：api/src/routes/media.ts（/api/media）
  - 前端 API：src/api/mediaService.ts
  - 编辑器增强：src/components/Editor/ChapterEditor.tsx（上传并插入 Markdown 引用、编辑期预览）
- 编辑干预（Editorial）
  - 后端域：api/src/domains/editorial
  - API：api/src/routes/editorial.ts（/api/editorial）
  - 管理页：/admin/editorial
- 机审整合点
  - Worker：api/src/workers/moderationWorker.ts（落库后触发 ReviewWorkflowService 与 MediaModerationHook）
  - Orchestrator：api/src/domains/moderation/ModerationOrchestrator.ts（支持 targetType=media_asset 的本地媒体审核 Provider）
