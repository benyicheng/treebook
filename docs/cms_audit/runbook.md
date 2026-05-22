# 上线/灰度/回滚手册（媒体上传 + 人工复核工单）

## 环境变量

媒体上传：
- MEDIA_UPLOADS_ENABLED=true|false
- MEDIA_ROLLOUT_PERCENT=5（0-100）
- MEDIA_VIRUS_SCAN_MODE=mock|off
- MEDIA_MAX_IMAGE_BYTES=2097152
- MEDIA_MAX_AUDIO_BYTES=5242880
- MEDIA_MAX_VIDEO_BYTES=52428800
- MEDIA_QUARANTINE_DIR=uploads/quarantine
- MEDIA_IMAGE_OPTIMIZE=true|false

审核侧（既有）：
- MODERATION_WORKER_BATCH_SIZE
- MODERATION_WORKER_INTERVAL_MS

人工复核工单（可选配置，SiteConfig：reviewWorkflowConfig）：
- enabled: boolean
- maxLevel: number（默认 3）
- levels: [{ level: 1, slaMinutes: 30 }, ...]

RBAC 引导：
- /api/init/bootstrap-rbac（admin 登录后调用，可补齐 editor/reviewer 角色与权限）

## 审计留痕（≥180 天）

- moderation_case_actions、moderation_audit_logs、editorial_change_actions 默认不做自动清理，满足至少 180 天留存要求

## 灰度发布（5% → 全量）

1. 设置 `MEDIA_UPLOADS_ENABLED=true`，`MEDIA_ROLLOUT_PERCENT=5`
2. 运行后端与 worker（确保 worker 常驻）
3. 观察 24 小时：错误率、case 数量、media_risk_logs 增长、CPU/内存占用
4. 无异常后将 `MEDIA_ROLLOUT_PERCENT` 提升到 100

## 30 秒内降级策略

- 媒体上传：
  - 任何非预期异常将触发进程内 30 秒降级（返回 503），避免持续故障放大
  - 也可直接将 `MEDIA_UPLOADS_ENABLED=false` 立即关闭上传入口
- 审核 Provider：
  - 已启用断路器（默认 openMs=30000），当连续失败达到阈值自动熔断 30 秒

## 回滚（30 分钟内）

最小回滚路径（不改 DB）：
- 将 `MEDIA_UPLOADS_ENABLED=false`
- 将 `MEDIA_ROLLOUT_PERCENT=0`
- 停止新增工单入口：ReviewWorkflow 仅由 worker 生成工单，不影响现有读写主链路

数据库回滚：
- 不建议在已有数据场景直接 DROP；优先通过功能开关回滚

## 压测（媒体上传）

- 脚本：scripts/loadtest_media_upload.mjs
- 运行前提：准备一个可用的 JWT（admin 或 author 均可），设置环境变量 LOADTEST_TOKEN
