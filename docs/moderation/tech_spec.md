# 内容审核方案（全类型：文本/图片/音视频）

## 目标
- 覆盖：章节/番外/评论/故事/书单/角色信息 + 封面/头像/AI 生成图片/视频等媒体链接。
- 稳定性：审核能力异常不阻塞核心写入流程；支持降级与熔断；默认旁路记录。
- 架构合理性：与现有业务模块解耦；可横向扩展（多 worker 并行）；策略配置化（CMS 可动态下发）。
- 合规与性能平衡：写入路径不等待外部审核；通过异步队列实现最终审核；支持按业务线/用户灰度。
- 可观测性：审核明细（decision）、队列状态（jobs）、审计日志（audit_logs）、管理仪表盘。
- 灰度与回滚：支持按用户/按业务线/按比例；5 分钟内通过配置切换一键回滚。

## 总体架构
1. 业务写入（create/update）成功后，异步 enqueue 审核任务（不 await，不阻塞）。
2. 审核 worker 从 DB 队列拉取任务，调用审核编排器（Orchestrator）执行：
   - 文本：规则引擎（本地）作为基线；后续可接第三方/自研模型 Provider。
   - 媒体：URL 域名策略（allow/block）作为基线；后续可接图片/音视频识别 Provider。
3. 结果写入 `moderation_decisions`；管理侧通过 `/api/moderation/*` 查看指标/明细，并支持人工覆盖决策（写入审计日志）。

## 关键模块与边界
- 域模型与配置：
  - [types.ts](file:///h:/xs/api/src/domains/moderation/types.ts)
  - [ModerationConfigService.ts](file:///h:/xs/api/src/domains/moderation/ModerationConfigService.ts)
  - [rollout.ts](file:///h:/xs/api/src/domains/moderation/rollout.ts)
- 审核编排（超时 + 熔断 + 降级）：
  - [ModerationOrchestrator.ts](file:///h:/xs/api/src/domains/moderation/ModerationOrchestrator.ts)
  - [CircuitBreaker.ts](file:///h:/xs/api/src/domains/moderation/CircuitBreaker.ts)
- Provider（可插拔）：
  - 文本规则： [TextRuleProvider.ts](file:///h:/xs/api/src/domains/moderation/providers/TextRuleProvider.ts)
  - 媒体 URL： [UrlMediaProvider.ts](file:///h:/xs/api/src/domains/moderation/providers/UrlMediaProvider.ts)
- 队列与落库：
  - enqueue： [ModerationGateway.ts](file:///h:/xs/api/src/domains/moderation/ModerationGateway.ts)
  - jobs/decisions： [ModerationJobRepository.ts](file:///h:/xs/api/src/domains/moderation/ModerationJobRepository.ts)
  - worker： [moderationWorker.ts](file:///h:/xs/api/src/workers/moderationWorker.ts)
- 管理与审计：
  - API： [moderation.ts](file:///h:/xs/api/src/routes/moderation.ts)
  - 控制器： [moderationController.ts](file:///h:/xs/api/src/controllers/moderationController.ts)
  - 管理服务： [ModerationAdminService.ts](file:///h:/xs/api/src/domains/moderation/ModerationAdminService.ts)
- 仪表盘：
  - 前端页面： [ModerationDashboard.tsx](file:///h:/xs/src/pages/admin/ModerationDashboard.tsx)
  - 前端 API： [moderationService.ts](file:///h:/xs/src/api/moderationService.ts)

## 数据表设计
- `moderation_jobs`：审核队列（DB Queue）
- `moderation_decisions`：审核结果（明细）
- `moderation_audit_logs`：人工操作与关键事件审计

迁移脚本：
- SQLite（Prisma migrations）：[20260413124000_moderation_core/migration.sql](file:///h:/xs/prisma/migrations/20260413124000_moderation_core/migration.sql)
- PostgreSQL（Supabase）：[20260413124010_moderation_core.sql](file:///h:/xs/supabase/migrations/20260413124010_moderation_core.sql)

## 稳定性与降级
- 写入路径：enqueue 失败直接吞掉（不影响主流程），但不会写 decision。
- Worker：
  - Provider 超时：`withTimeout` 触发失败计数。
  - 熔断：连续失败达到阈值后短时 open，返回 `failed/provider_unavailable` decision（可配置在 enforce 模式下拒绝）。
  - 重试：指数退避，最多 10 次，之后标记 dead。

## 灰度与回滚
- 配置来源：`site_configs.key = moderationConfig`（JSON 字符串，由 CMS 更新）。
- 灰度维度：
  - userIds 白名单
  - businessLines 白名单
  - percent（基于 userId + businessLine 的稳定哈希采样）
- 一键回滚：
  - 将 `moderationConfig.mode` 设为 `off`，或设置环境变量 `MODERATION_MODE=off` 立即生效（配置缓存 TTL 30s）。

## 配置示例（CMS 写入 moderationConfig）
```json
{
  "mode": "observe",
  "rollout": { "enabled": true, "percent": 5, "userIds": [], "businessLines": ["comments"] },
  "policy": { "onProviderError": "allow_and_flag", "hardBlockLabels": ["illegal"], "maxTextLength": 50000 },
  "providers": {
    "text": { "enabled": true, "timeoutMs": 800, "breaker": { "failureThreshold": 5, "openMs": 30000 } },
    "media": { "enabled": true, "timeoutMs": 1200, "breaker": { "failureThreshold": 5, "openMs": 30000 }, "urlAllowlist": [], "urlBlocklist": [] }
  }
}
```

## 已接入的内容入口（旁路 enqueue）
- 故事/角色： [storyController.ts](file:///h:/xs/api/src/controllers/storyController.ts)
- 章节/评论： [chapterController.ts](file:///h:/xs/api/src/controllers/chapterController.ts)
- 番外： [spinoffController.ts](file:///h:/xs/api/src/controllers/spinoffController.ts)
- 书单： [booklistController.ts](file:///h:/xs/api/src/controllers/booklistController.ts)
- AI 生图/视频： [aiController.ts](file:///h:/xs/api/src/controllers/aiController.ts)

## 后续扩展点（下一阶段）
- 引入第三方审核 Provider（HTTP SDK），按策略路由并支持多 Provider 投票。
- 将“拒绝内容的展示”纳入读路径：对被拒绝的内容在 API 返回中做脱敏/隐藏，并提供申诉流程。
- 支持媒体文件上传（multipart）后在落盘前/后做鉴黄/涉暴检测。

