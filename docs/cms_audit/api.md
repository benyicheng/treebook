# 接口文档（新增）

## 人工审核工单（Review Workflow）

Base Path：`/api/review-workflow`

### GET /cases

用于后台列表页拉取待处理工单。

Query：
- status?: string（open/in_review/returned/approved/rejected/closed）
- level?: number（1-5）
- limit?: number（默认 50，最大 200）
- offset?: number（默认 0）

权限：
- 需要登录
- permission：`review:case:view`（admin 自动放行）

### GET /cases/:id

获取工单详情与 actions 流。

权限：
- permission：`review:case:view`

### POST /cases/:id/actions

提交工单动作。

Body：
- action: assign|annotate|comment|return|approve|reject|close
- payload?: any

语义：
- approve：
  - 非终审：流转到下一审核级别（level+1），不写入最终手工裁决
  - 终审：写入一条“手工决策 approved”，并将工单置为 approved
- reject：写入一条“手工决策 rejected”，并将工单置为 rejected
- return：退回作者修改（returned）；作者更新内容后会自动重提（open）

权限：
- permission：`review:case:act`

## 媒体上传（Media）

Base Path：`/api/media`

### POST /uploads

表单上传（multipart/form-data）。

FormData：
- file: File
- purpose?: string（例如 chapter_inline）

返回：
- id: string（assetId）
- kind: image|audio|video
- mimeType: string
- sizeBytes: number
- url: string（/api/media/assets/:id）
- status: quarantined

限制：
- 图片 ≤ 2MB、音频 ≤ 5MB、视频 ≤ 50MB（可通过环境变量调整）
- 支持 mime：image/png,image/jpeg,image/webp,audio/mpeg,audio/wav,video/mp4

### GET /assets/:id

获取媒体文件流。

访问控制：
- approved：匿名可访问
- quarantined/rejected：仅 owner 或 admin 可访问

## 编辑改稿（Editorial）

Base Path：`/api/editorial`

### GET /changes

Query：
- status?: draft|submitted|applied|rejected
- targetType?: story|chapter|spinoff|booklist
- targetId?: string

权限：
- permission：`editorial:view`

### POST /changes

Body：
- targetType: story|chapter|spinoff|booklist
- targetId: uuid
- field: title|description|content|coverImage|notes
- proposed: string
- sanitize?: boolean（敏感信息过滤）
- normalize?: boolean（格式归一化）
- submit?: boolean（默认 true）

权限：
- permission：`editorial:propose`

### POST /changes/:id/apply

将改稿应用到正文，并留痕。

权限：
- permission：`editorial:apply`

## 内容写入补充（退回-重提覆盖范围）

### Chapters Comments

- PUT /api/chapters/comments/:commentId
  - 说明：用于评论被退回后的重新提交（同时旁路触发机审）

### Booklist Items

- PUT /api/booklists/:id/items/:itemId
  - 说明：用于书单条目 notes 被退回后的重新提交（同时旁路触发机审）
