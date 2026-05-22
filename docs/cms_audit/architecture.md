# 目标架构（分层/模块化/插件化）

## 设计原则

- 不阻塞核心写入：审核与媒体处理默认旁路；异常时可快速降级
- 审核可配置：机审 → 人审多级工作流可扩展；保留审计日志
- 媒体可插拔：扫描/压缩/转码/存储均为可替换组件，默认提供本地落盘方案
- 稳定性优先：新能力默认开关关闭，配合灰度逐步放量

## 新增模块

### 1) reviewWorkflow（人工审核工单）

- 输入：机审落库后的 decision（rejected/failed）
- 输出：moderation_cases（工单）+ moderation_case_actions（操作流转与批注）
- 人工裁决：通过 ModerationAdminService 写入“手工决策”并影响读路径遮罩

整合点：
- worker 在写入 moderation_decisions 后调用 ReviewWorkflowService，自动生成工单

多级流转：
- case.level 表示当前审核级别；approve 在未到终审时会自动升级到下一层级并重新进入待处理队列
- return 将工单退回作者修改，作者更新内容后会自动重提（returned → open）
- dueAt 记录当前级别 SLA 到期时间（超时可在后台列表中识别）

### 2) media（媒体上传与安全检测）

- 上传：multipart/form-data → buffer → 病毒扫描（可替换）→（图片可选压缩/转码）→ quarantine 落盘 → media_assets 落库
- 审核：上传后触发机审作业（targetType=media_asset），由本地 Provider 做基础可用性检测；后续可接入第三方内容安全
- 风险日志：media_risk_logs 记录扫描/审核异常与拒绝原因

整合点：
- worker 在写入 decision 后调用 MediaModerationHook，将审核结果回写 media_assets 状态

## 降级/灰度/回滚（落地方式）

- 媒体上传开关：MEDIA_UPLOADS_ENABLED=false 时接口直接返回 503，不影响内容核心功能
- 媒体上传灰度：MEDIA_ROLLOUT_PERCENT=5 可按用户 ID 稳定哈希灰度放量
- 图片优化开关：MEDIA_IMAGE_OPTIMIZE=false 可关闭 sharp 处理
- 人工审核处置台权限：通过 RBAC permissions 控制（review:case:view / review:case:act）

### 3) editorial（编辑人工干预）

- 编辑改稿以“变更单”形式存在（editorial_changes + actions），支持：格式校对、敏感信息过滤、提交/应用留痕
- 应用改稿后会触发：重提 returned 工单（如果存在）+ 旁路重新机审（保持主链路稳定）
