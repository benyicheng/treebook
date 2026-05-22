# 压测报告（内容审核）

## 目标
- 验证管理侧指标查询接口在并发下的稳定性与延迟分布
- 验证审核写入路径为旁路（不 await）后对核心业务延迟影响可忽略

## 环境
- BASE_URL：`http://localhost:3001/api`
- 入口：`GET /api/moderation/metrics?sinceMinutes=60`
- 并发/时长：通过脚本参数控制

## 脚本
- [loadtest_moderation.mjs](file:///h:/xs/scripts/loadtest_moderation.mjs)

示例运行：
```bash
ADMIN_TOKEN=<jwt> BASE_URL=http://localhost:3001/api CONCURRENCY=50 DURATION_SEC=30 node scripts/loadtest_moderation.mjs
```

## 结果记录（示例字段）
- ok：成功请求数
- fail：失败请求数
- rps：吞吐（请求/秒）
- p50/p95/p99：延迟分位（ms）

将脚本输出 JSON 直接粘贴到此处：
```json
{}
```

## 结论与建议
- 若 fail > 0：检查 JWT、权限校验、DB 连接池、慢查询与索引命中
- 若 p95/p99 偏高：考虑对 metrics 查询加缓存、缩小时间窗口或做预聚合表

