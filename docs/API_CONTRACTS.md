# XS 接口契约（API Contracts）

> 约定：baseURL = `http://localhost:3001/api`  
> 认证：`Authorization: Bearer <JWT>`  
> Trace：客户端请求携带 `X-Trace-Id`，服务端响应回传 `x-trace-id`（便于排障定位）。

## 通用响应与错误码

### 成功

- `2xx`：返回 JSON 对象或数组

### 错误（推荐结构）

所有错误建议满足以下最小结构：

```json
{
  "error": "Forbidden",
  "message": "Missing required permission: story:create",
  "traceId": "optional-trace-id"
}
```

- `400 Bad Request`：参数不合法、业务校验失败
- `401 Unauthorized`：未登录/Token 缺失或无效
- `403 Forbidden`：已登录但无权限
- `404 Not Found`：资源不存在
- `409 Conflict`：唯一性冲突（如 username 已存在）
- `500 Internal Server Error`：服务端异常（应包含 `traceId`）

性能指标（默认）：  
- P50 < 100ms（本地 SQLite），P95 < 300ms（不含网络）

## Auth

### POST /auth/register

**Request**
```json
{ "email": "a@b.com", "username": "name", "password": "******", "role": "reader" }
```

**Response**
```json
{
  "user": { "id": "uuid", "email": "a@b.com", "username": "name", "role": "reader" },
  "token": "jwt"
}
```

### POST /auth/login

**Request**
```json
{ "email": "a@b.com", "password": "******" }
```

**Response**
```json
{
  "user": {
    "id": "uuid",
    "email": "a@b.com",
    "username": "name",
    "role": "reader",
    "roles": ["Reader"],
    "permissions": ["story:read"]
  },
  "token": "jwt"
}
```

### GET /auth/me

**Auth** required

**Response**
```json
{
  "id": "uuid",
  "email": "a@b.com",
  "username": "name",
  "role": "reader",
  "avatarUrl": null,
  "roles": ["Reader"],
  "permissions": ["story:read"]
}
```

### PUT /auth/me

**Auth** required

**Request**
```json
{ "username": "new-name", "avatarUrl": "https://...", "profile": { "bio": "..." } }
```

**Response** 同 `GET /auth/me`

**Error**
- `409 Conflict`：username 已存在

## Stories

### GET /stories

**Query**
- `tag`（可选）：按标签过滤

**Response**
```json
[
  {
    "id": "uuid",
    "title": "标题",
    "description": "简介",
    "coverImage": null,
    "status": "ongoing",
    "author": { "username": "作者", "role": "author" },
    "tags": [{ "id": "uuid", "name": "神话" }],
    "_count": { "branches": 0, "chapters": 1 }
  }
]
```

### GET /stories/:id

**Response**（关键字段）
```json
{
  "id": "uuid",
  "title": "标题",
  "author": { "username": "作者", "role": "author" },
  "chapters": [{ "id": "uuid", "title": "第一章", "orderIndex": 1 }],
  "branches": [{ "id": "uuid", "title": "分支", "author": { "username": "作者", "role": "reader" } }]
}
```

### GET /stories/my

**Auth** required  
按 `req.user.id` 过滤 `authorId`

### POST /stories

**Auth** required

**Request**
```json
{ "title": "标题", "description": "简介", "coverImage": null, "tags": ["神话"] }
```

**Response**：Story 对象

**幂等建议**
- 未来若支持重试：可引入 `Idempotency-Key`（header）+ 服务端落表校验

## Booklists

### GET /booklists

公开书单列表

### GET /booklists/:id

返回书单详情及 items，items 中每条包含 `chapter.story.author.username/role`，用于 UI 展示作者。

### GET /booklists/my

**Auth** required

### POST /booklists

**Auth** required

### POST /booklists/:id/items

**Auth** required  
追加章节到书单；重复追加应返回 `400`。

## Spinoffs

### GET /spinoffs

### GET /spinoffs/:id

### GET /spinoffs/my

**Auth** required

### POST /spinoffs

**Auth** required

## RBAC

### GET /roles

**Auth** required  
**Permission**：`role:read`

### POST /roles

**Auth** required  
**Permission**：`role:create`

### PUT /roles/:id/permissions

**Auth** required  
**Permission**：`role:permission:assign`

