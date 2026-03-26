# 系统管理模块 SQL 审计报告（RBAC/角色权限）

## 结论摘要

- 角色列表改为分页 + 字段裁剪后，核心查询从“全量 include permissions”降为“只取 role 基本字段 + 关系计数”，降低 IO 与 JSON 序列化开销。
- RBAC 表自身已有关键唯一约束与复合主键，可满足高频读写一致性；大规模场景建议以 Postgres 为准并补充查询维度索引。

## 关键数据表（Prisma 模型）

参考：[schema.prisma](file:///h:/xs/prisma/schema.prisma)

- `Role`：`id`, `name (unique)`, `description`
- `Permission`：`id`, `code (unique)`, `description`
- `UserRole`：`(userId, roleId)` 关联（复合主键）
- `RolePermission`：`(roleId, permissionId)` 关联（复合主键）

## 核心查询与优化点

### 1) 分页角色列表

接口：`GET /api/roles?page&pageSize&q`

- 查询：
  - `role.count(where)`
  - `role.findMany(select: { id,name,description,_count })` + `skip/take`
- 优化点：
  - 避免 `include permissions.permission` 造成大 JSON payload
  - 默认按 `name asc` 排序，便于分页稳定性

实现：[roles.ts](file:///h:/xs/api/src/routes/roles.ts)

### 2) 权限列表缓存

接口：`GET /api/roles/permissions`

- 查询：`permission.findMany(orderBy: code asc)`
- 优化点：
  - 权限表低频变化，服务端 TTL 缓存 60s，降低重复查询

实现：[roles.ts](file:///h:/xs/api/src/routes/roles.ts)

### 3) 替换权限集合（写放大控制）

接口：`PUT /api/roles/{id}/permissions`

- 查询：
  - 先校验 role 是否存在
  - 校验 permissionIds 全部存在（`permission.count(in ids)`）
  - 事务：`rolePermission.deleteMany(roleId)` + `createMany(data)`
- 优化点：
  - 服务端对 `permissionIds` 去重，避免复合主键冲突导致失败风暴

实现：[roles.ts](file:///h:/xs/api/src/routes/roles.ts)

## 索引建议（百万级场景）

若生产迁移到 Postgres：

- `Role(name)`：保持唯一索引
- `Permission(code)`：保持唯一索引
- `RolePermission(roleId)`、`RolePermission(permissionId)`：补充单列索引以加速过滤与 JOIN
- `UserRole(roleId)`：补充索引以加速按角色统计用户/查成员
- 若启用模糊搜索 `contains`：
  - Postgres 建议 `pg_trgm` + GIN 索引（对 `Role.name/description`、`Permission.code/description`）

