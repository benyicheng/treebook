# 系统管理模块性能压测报告（本地基线）

## 目标与范围

- 范围：`GET /api/roles`（分页列表，pageSize=20）
- 目标：为后续“百万级数据 + 高并发”提供可重复的基线测试方法与本地对比数据

## 测试环境

- API：`http://localhost:3001/api`
- DB：SQLite（`/api/health` 返回 `database: sqlite`）
- 压测脚本：[/scripts/loadtest_roles.mjs](file:///h:/xs/scripts/loadtest_roles.mjs)

## 压测命令

```bash
node scripts/loadtest_roles.mjs
```

可配置环境变量：

```bash
CONCURRENCY=50 TOTAL_REQUESTS=500 PAGE_SIZE=20 node scripts/loadtest_roles.mjs
```

## 压测结果（实测）

本次运行输出如下：

```json
{
  "baseUrl": "http://localhost:3001/api",
  "concurrency": 50,
  "totalRequests": 500,
  "ok": 500,
  "fail": 0,
  "durationMs": 769,
  "rps": 650.2,
  "latencyMs": { "p50": 72, "p95": 91, "p99": 101, "min": 32, "max": 107 }
}
```

## 结论与上线口径

- 当前在 SQLite + 小数据量下，角色分页列表具备较高吞吐与低延迟的本地基线。
- “单表百万级 + 并发 500”在生产环境应以 Postgres/MySQL 为基线评估，并配合连接池、只读副本与更严格的字段裁剪策略；本报告不对跨环境性能做推断。

