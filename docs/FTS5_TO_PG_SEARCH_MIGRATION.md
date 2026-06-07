# FTS5 → PostgreSQL 全文搜索迁移方案

> 状态：设计阶段 | 作者：AI | 日期：2026-05-28

---

## 一、现状分析

### 1.1 当前 FTS5 架构

```
┌──────────────────────────────────────────────────────┐
│                    SQLite FTS5                         │
│                                                       │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐ │
│  │   stories    │  │   chapters   │  │   branches   │ │
│  │   INSERT     │  │   INSERT     │  │   INSERT     │ │
│  │   UPDATE     │  │   UPDATE     │  │   UPDATE     │ │
│  │   DELETE     │  │   DELETE     │  │   DELETE     │ │
│  └──────┬───────┘  └──────┬───────┘  └──────┬──────┘ │
│         │                 │                  │        │
│         ▼                 ▼                  ▼        │
│  ┌──────────────────────────────────────────────┐     │
│  │         content_fts (VIRTUAL TABLE)           │     │
│  │  (title, content, type, sourceId, metadata)   │     │
│  │  tokenize='unicode61 remove_diacritics 2'     │     │
│  └──────────────────────────────────────────────┘     │
│         ▲                                             │
│  ┌──────┴───────┐  ┌──────┐                          │
│  │   spinoffs   │  │users │                          │
│  │  INSERT/U/D  │  │I/U/D │                          │
│  └──────────────┘  └──────┘                          │
│                                                       │
│  共 15 个触发器 (5 个模型 × 3 操作)                     │
│  SearchService 使用 Prisma.sql 拼接 MATCH 表达式       │
└──────────────────────────────────────────────────────┘
```

### 1.2 SQLite → PG 迁移时 FTS5 的未来

| 组件 | SQLite | PostgreSQL | 迁移后状态 |
|------|--------|------------|-----------|
| `content_fts` 虚拟表 | `CREATE VIRTUAL TABLE ... USING fts5` | 不存在于 PG | **表消失** |
| `json_object()` | SQLite 内置 | PG 无（需要 `json_build_object`） | **触发器语法报错** |
| `Prisma.sql` MATCH 查询 | FTS5 `MATCH` 语法 | `tsquery @@ tsvector` | **查询静默失败或报错** |
| 热门推荐兜底 | Prisma ORM 直接查 | 兼容 | **不受影响** |

**结论：一旦执行 SQLite → PG 迁移，搜索功能静默失效。** 用户搜索始终触发"error → 空结果 → 无匹配"的 `catch` 分支，最终走热门推荐兜底——用户看到推荐内容而非错误，但永远无法搜索。

---

## 二、目标架构：PostgreSQL 全文搜索

### 2.1 设计原则

1. **零触发器**：使用 `GENERATED ALWAYS AS` 列 + Prisma Schema 声明式维护，避免 PG trigger 维护负担
2. **API 契约不变**：`SearchService.searchAll()` 签名不变，前端零改动
3. **中文友好**：使用 `simple` 配置 + `pg_jieba` 或 `zhparser` 扩展（如不可用则降级为 `pg_trgm` 三元组模糊匹配）
4. **渐进式迁移**：支持 SQLite 和 PG 双写过渡期

### 2.2 方案选型

| 方案 | 索引类型 | 中文支持 | 性能 | 复杂度 | 推荐 |
|------|---------|----------|------|--------|------|
| A: tsvector + GENERATED | GIN | 需扩展 | 高 | 中 | ⭐ 首选 |
| B: pg_trgm 三元组 | GIN (gin_trgm_ops) | 原生 | 中 | 低 | 降级 |
| C: PostgreSQL 触发器 | GIN | 需扩展 | 高 | 高 | 备选 |
| D: 外部 Elasticsearch/Meilisearch | 自建 | 原生 | 极高 | 极高 | 不推荐（过度工程） |

**首选 A + 降级 B 的混合策略**：
- 优先安装 `pg_jieba` 扩展 → tsvector + 中文分词
- 如云服务商不支持自定义扩展 → 降级为 `pg_trgm`（PostgreSQL 内置，无需扩展安装）

---

## 三、详细设计

### 3.1 Schema 变更

对每个需要搜索的模型，添加一个 `GENERATED` 列：

```prisma
// 示例：Story 模型
model Story {
  id          String   @id @default(uuid())
  title       String
  description String?
  authorId    String
  viewCount   Int      @default(0)
  // ... 其他字段

  // 搜索用的 tsvector 生成列（Prisma 层面声明，实际是 PG GENERATED 列）
  // 注意：Prisma 不完全支持 GENERATED 列，需要通过迁移 SQL 手动创建
  // 在 Prisma Schema 中用 @ignore 或注释标注

  @@map("stories")
}
```

**对应的迁移 SQL**：

```sql
-- 方案 A: tsvector（需 pg_jieba 或 zhparser）
-- 如果扩展可用
ALTER TABLE stories ADD COLUMN search_vector tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('jiebacfg', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('jiebacfg', coalesce(description, '')), 'B')
  ) STORED;
CREATE INDEX idx_stories_search ON stories USING GIN (search_vector);

-- 对 chapters, branches, spinoffs, users 重复同样操作
ALTER TABLE chapters ADD COLUMN search_vector tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('jiebacfg', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('jiebacfg', coalesce(content, '')), 'B')
  ) STORED;
CREATE INDEX idx_chapters_search ON chapters USING GIN (search_vector);

ALTER TABLE branches ADD COLUMN search_vector tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('jiebacfg', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('jiebacfg', coalesce(description, '')), 'B')
  ) STORED;
CREATE INDEX idx_branches_search ON branches USING GIN (search_vector);

ALTER TABLE spinoffs ADD COLUMN search_vector tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('jiebacfg', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('jiebacfg', coalesce(content, '')), 'B')
  ) STORED;
CREATE INDEX idx_spinoffs_search ON spinoffs USING GIN (search_vector);

ALTER TABLE users ADD COLUMN search_vector tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('jiebacfg', coalesce(username, email, '')), 'A')
  ) STORED;
CREATE INDEX idx_users_search ON users USING GIN (search_vector);
```

**方案 B: pg_trgm 降级**（如果中文分词扩展不可用）：

```sql
-- 不需要 GENERATED 列，直接在文本字段上建 GIN trigram 索引
CREATE INDEX idx_stories_trgm_title ON stories USING GIN (title gin_trgm_ops);
CREATE INDEX idx_stories_trgm_desc ON stories USING GIN (description gin_trgm_ops);
CREATE INDEX idx_chapters_trgm_title ON chapters USING GIN (title gin_trgm_ops);
CREATE INDEX idx_chapters_trgm_content ON chapters USING GIN (content gin_trgm_ops);
CREATE INDEX idx_branches_trgm_title ON branches USING GIN (title gin_trgm_ops);
CREATE INDEX idx_spinoffs_trgm_title ON spinoffs USING GIN (title gin_trgm_ops);
CREATE INDEX idx_spinoffs_trgm_content ON spinoffs USING GIN (content gin_trgm_ops);
CREATE INDEX idx_users_trgm_name ON users USING GIN (username gin_trgm_ops);

-- 需要先启用扩展
CREATE EXTENSION IF NOT EXISTS pg_trgm;
```

### 3.2 SearchService 重构

重构为策略模式，运行时检测数据库类型：

```typescript
// api/src/services/SearchService.ts 重构结构

interface SearchStrategy {
  searchAll(query: string, type?: string | null, limit?: number, offset?: number): Promise<SearchResponse>;
}

class PgTsVectorSearch implements SearchStrategy {
  // 使用 Prisma.sql + ts_query/ts_rank
  // 示例查询:
  // SELECT title, content, type, source_id, metadata,
  //        ts_rank(search_vector, websearch_to_tsquery('jiebacfg', $1)) as rank
  // FROM stories
  // WHERE search_vector @@ websearch_to_tsquery('jiebacfg', $1)
  // UNION ALL ...
  // ORDER BY rank DESC LIMIT $2 OFFSET $3
}

class PgTrgmSearch implements SearchStrategy {
  // 降级方案: 使用 ILIKE %query% + similarity 排序
  // SELECT title, ... similarity(title, $1) as rank
  // FROM stories WHERE title % $1 OR description % $1
  // UNION ALL ...
}

class Fts5Search implements SearchStrategy {
  // 当前实现，保持不变
}

export class SearchService {
  private static strategy: SearchStrategy;

  static initialize(dbType: 'sqlite' | 'postgresql') {
    if (dbType === 'sqlite') {
      this.strategy = new Fts5Search();
    } else {
      // 检测扩展可用性，选择 tsvector 或 trgm
      this.strategy = new PgTsVectorSearch();
    }
  }
}
```

### 3.3 统一搜索查询设计

不再使用 `content_fts` 虚拟表，改为对每个表的 `search_vector` 列执行 `UNION ALL`：

```sql
-- 方案 A: tsvector 版本
SELECT 'story' as type, id as source_id, title,
       json_build_object('authorId', "authorId", 'storyId', id) as metadata,
       ts_rank(search_vector, websearch_to_tsquery('jiebacfg', $1)) as rank,
       ts_headline('jiebacfg', description, websearch_to_tsquery('jiebacfg', $1),
                   'StartSel=<mark>, StopSel=</mark>, MaxWords=30, MinWords=10') as highlight
FROM stories
WHERE search_vector @@ websearch_to_tsquery('jiebacfg', $1)
  AND ($2::text IS NULL OR $2::text = 'all' OR $2::text = 'story')

UNION ALL

-- chapters, branches, spinoffs, users 同理...
SELECT 'chapter' as type, ...
FROM chapters
WHERE search_vector @@ websearch_to_tsquery('jiebacfg', $1)

-- ... (其他四个表的 UNION ALL)

ORDER BY rank DESC
LIMIT $3 OFFSET $4;
```

### 3.4 结果格式兼容

保持 `SearchResult` 接口不变：
- `highlight` 字段：PG 的 `ts_headline()` 内置 HTML 高亮标记（`<mark>` 标签），前端可直接渲染
- `metadata` 字段：PG 的 `json_build_object()` 等价于 SQLite 的 `json_object()`
- `rank` 字段：`ts_rank()` 替代 FTS5 的 `rank`

### 3.5 热门推荐兜底

`getHotRecommendations()` 方法不变，因为它使用 Prisma ORM 查询，与数据库类型无关。

---

## 四、迁移路线

### Phase 0：检测与验证（迁移前，本次 Sprint）

```
□ 确认目标 PG 版本（≥ 12）及扩展支持情况
□ 在测试 PG 实例上验证 pg_jieba 或 pg_trgm
□ 编写 PG SearchService 实现 + 单元测试
□ 双重策略模式代码合入主分支（不启用，feature flag 控制）
```

### Phase 1：并行运行（迁移过渡期）

```
□ 执行 PG Schema 迁移（GENERATED 列 + GIN 索引）
□ 搜索请求通过 feature flag 路由到 PG 策略
□ 监控搜索延迟、准确率、失败率
□ SQLite 侧 FTS5 保持运行
□ 对比 SQLite FTS5 vs PG 搜索结果一致性
```

### Phase 2：切换

```
□ 确认 PG 搜索结果质量 ≥ FTS5
□ 关闭 FTS5 策略，全部路由到 PG
□ 移除 FTS5 相关代码（content_fts 虚拟表、触发器 SQL）
□ 移除 feature flag
```

### Phase 3：清理

```
□ 删除 `prisma/migrations/manual_fts5/` 目录
□ 清理 prisma.ts 中的 FTS5 相关 rawQuery 引用
□ 更新文档
```

---

## 五、风险评估

| 风险 | 概率 | 影响 | 缓解措施 |
|------|------|------|----------|
| PG 服务商不支持自定义扩展（pg_jieba） | 高 | 中 | 降级到 pg_trgm，牺牲中文分词精度换可用性 |
| tsvector GENERATED 列增加写入开销 | 中 | 低 | 只在 title/content 更新时触发，写入频率远低于读取 |
| PG 搜索延迟高于 FTS5 | 低 | 中 | GIN 索引 + UNION ALL 下每个子查询可并行，PG 查询计划器足够智能 |
| 搜索结果质量下降 | 中 | 中 | Phase 1 并行对比验证，不一致则延迟切换 |
| pg_trgm 中文搜索效果差 | 中 | 高 | 如 pg_trgm 达不到可用标准，评估上 Meilisearch（方案 D） |

---

## 六、决策记录

| 决策 | 选择 | 理由 |
|------|------|------|
| GENERATED 列 vs 触发器 | GENERATED 列 | 声明式维护，无触发器管理负担，PG 12+ 原生支持 |
| 单表 UNION vs 单表 FTS | UNION ALL | 无需维护额外的索引表，schema 更简单 |
| 策略模式 vs 直接改写 | 策略模式 | 支持 SQLite↔PG 过渡期的双写/并行对比 |
| pg_jieba vs pg_trgm | 优先 pg_jieba，降级 pg_trgm | pg_jieba 中文分词好但需要扩展安装，pg_trgm 是内置兜底 |

---

## 七、影响范围

| 文件 | 变更类型 | 说明 |
|------|----------|------|
| `api/src/services/SearchService.ts` | 重构 | 策略模式，增加 PgTsVectorSearch / PgTrgmSearch |
| `prisma/schema.prisma` | 注意标注 | PG 环境需手动添加 search_vector 列 |
| `prisma/migrations/next_pg_search/` | 新建 | PG 搜索相关迁移 SQL |
| `prisma/migrations/manual_fts5/` | 标记 deprecated | SQLite 专用，PG 环境无效 |
| `src/api/searchService.ts` | 不变 | API 契约不变 |
| `src/pages/Home.tsx` | 不变 | SearchResults 组件不变 |
