# 上线手册（内容审核）

## 前置条件
- 数据库已应用迁移：
  - SQLite：应用 Prisma migrations 中的 `20260413124000_moderation_core`
  - PostgreSQL：应用 Supabase migrations 中的 `20260413124010_moderation_core.sql`
- 管理员账号可访问 `/admin/moderation` 与 `/admin/cms`

## 组件清单
- API（已随主 API 服务发布）：`/api/moderation/*`
- Worker（独立进程，建议至少 1 实例）：
  - 启动：`npm run moderation:worker`
  - 单次运行（用于巡检）：`npm run moderation:worker -- --once`

## 配置与灰度
- 在 CMS 写入 `moderationConfig`（key/value），value 为 JSON。
- 推荐灰度顺序：
  1. `mode=observe`，`rollout.enabled=true`，`percent=1`，只开 comments 或指定业务线
  2. 观察 30-60 分钟：错误率、队列积压、拒绝比例、P95/P99
  3. `percent=5/20/50/100` 逐步放量
  4. 需要拦截时再切 `mode=enforce`（建议先只对评论启用）

## 监控与巡检
- 仪表盘：`/admin/moderation`
- API 指标：`GET /api/moderation/metrics?sinceMinutes=1440`（admin）
- 审核明细：`GET /api/moderation/decisions?limit=50&offset=0`（admin）
- 报告导出：
  - JSON：`GET /api/moderation/report?sinceMinutes=1440`
  - CSV：`GET /api/moderation/report?sinceMinutes=1440&format=csv`

## 压测
- 需要管理员 token：
  - `ADMIN_TOKEN=<jwt> BASE_URL=http://localhost:3001/api CONCURRENCY=50 DURATION_SEC=30 node scripts/loadtest_moderation.mjs`
- 重点观察：
  - 失败率（非 2xx）
  - p95/p99
  - worker 的处理吞吐（jobs 积压是否增长）

## 回滚
- 目标：5 分钟内禁用审核能力，恢复核心业务写入与读取稳定。
- 方式（任一即可）：
  - CMS：将 `moderationConfig` 的 `mode` 改为 `off`
  - 环境变量：`MODERATION_MODE=off`（优先级高于 CMS，重启后生效）
- 回滚脚本：见 [rollback.ps1](file:///h:/xs/docs/moderation/rollback.ps1)

