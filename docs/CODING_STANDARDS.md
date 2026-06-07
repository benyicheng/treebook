# 团队编码规范

> **版本:** 1.0 | **生效日期:** 2026-05-27 | **适用范围:** h:/xs 全栈项目全体开发者

---

## 一、总则

本文档定义 xs 项目的编码规范。**所有提交的代码必须符合本文档。** 自动化检查（Prettier + ESLint + tsc）会在 `git commit` 时自动执行，通不过无法入库。

### 质量门禁

| 层级       | 触发时机         | 检查内容                             | 不通过后果   |
| ---------- | ---------------- | ------------------------------------ | ------------ |
| Pre-commit | `git commit`     | Prettier 格式化 + ESLint error       | 提交被拒绝   |
| Pre-review | 发起 PR / 合并前 | tsc 编译 + ESLint warning + Prettier | 需修复后重审 |

```bash
# Pre-commit 自动运行（husky + lint-staged），无需手动操作
# Pre-review 手动运行：
npm run review:check
```

---

## 二、命名约定

### 2.1 文件命名

| 类型            | 命名模式                                | 示例                                                     |
| --------------- | --------------------------------------- | -------------------------------------------------------- |
| React 页面      | `PascalCase` + `Page` 后缀              | `Home.tsx`、`MainlinePage.tsx`、`BooklistDetailPage.tsx` |
| React 组件      | `PascalCase`                            | `Toast.tsx`、`LikeButton.tsx`、`InteractionBar.tsx`      |
| 前端 API 服务   | `camelCase` + `Service` 后缀            | `storyService.ts`、`interactionService.ts`               |
| 后端 Controller | `PascalCase` + `Controller` 后缀        | `storyController.ts`、`authController.ts`                |
| 后端 Service    | `PascalCase` + `Service` 后缀           | `StoryService.ts`、`ChapterService.ts`                   |
| 自定义 Hook     | `use` 前缀 + `camelCase`                | `useEditorLock.ts`、`useBooklistProgress.ts`             |
| Zustand Store   | `use` 前缀 + `camelCase` + `Store` 后缀 | `useAuthStore.ts`、`useSiteConfigStore.ts`               |
| Domain 模块     | `PascalCase`                            | `ModerationGateway.ts`、`EditorialRepository.ts`         |
| 路由文件        | 复数小写                                | `stories.ts`、`branches.ts`、`merges.ts`                 |
| 工具函数        | `camelCase`                             | `catchAsync.ts`、`entity.ts`                             |

### 2.2 变量与函数命名

```typescript
// ✅ Good
const chapterCount = chapters.length;
const fetchStoryById = async (id: string) => { ... };
function calculateRating(stars: number[]): number { ... }

// ❌ Bad — 无意义命名
const data = ...;
const temp = ...;
const result = ...;
function doSomething() { ... }
```

**原则：名字要准确表达意图。** 一眼能从名字判断类型和用途。

---

## 三、导出模式

### 3.1 前端

```
页面组件   →  export default          （路由 lazy import 兼容）
UI 组件    →  export default          （统一风格）
API 服务   →  export const named      （解构导入更清晰）
Store      →  export const named      （Zustand 惯例）
Hooks      →  export function named   （组合式风格）
```

### 3.2 后端

```
Controller →  export const named 函数
Service    →  export default class
Domain 模块 →  export default class
```

---

## 四、TypeScript 规范

### 4.1 类型定义

```typescript
// Props 接口定义在组件文件内，紧跟 imports 之后
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

// 数据模型接口定义在对应 Service 文件内
export interface Story {
  id: string;
  title: string;
  // ...
}
```

### 4.2 禁止事项

| 禁止                                        | 替代方案                                       |
| ------------------------------------------- | ---------------------------------------------- |
| `as any`                                    | 补充接口定义 / 使用泛型 / `unknown` + 类型守卫 |
| `as unknown as T` 双重断言                  | 重构类型设计                                   |
| `@ts-ignore` / `@ts-expect-error`（无注释） | 必须附带解释注释                               |

**当前状态：** `@typescript-eslint/no-explicit-any` 设为 `warn`，不阻塞提交但会在 PR Review 中被标记。渐进目标是向 `strict: true` 迁移。

### 4.3 空值处理

```typescript
// ✅ Good — 防御性空值检查
const items = data?.items ?? [];
if (!user) return <LoginPrompt />;

// ❌ Bad — 假设数据永远不为空
data.items.map(...);           // 如果 data 是 undefined 会崩溃
chapter.content.substring(0);  // 如果 content 是 null 会崩溃
```

---

## 五、React 组件规范

### 5.1 组件结构

```typescript
import { useState } from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';

interface MyComponentProps {
  title: string;
  onAction: () => void;
}

export default function MyComponent({ title, onAction }: MyComponentProps) {
  // 1. Hooks
  const [isOpen, setIsOpen] = useState(false);

  // 2. Derived state / helpers
  const handleClick = () => {
    setIsOpen(prev => !prev);
    onAction();
  };

  // 3. Render
  return (
    <div className="...">
      <h2>{title}</h2>
    </div>
  );
}
```

### 5.2 事件处理

```typescript
// ✅ Good — 获取尺寸/位置始终用 currentTarget
const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
  const rect = e.currentTarget.getBoundingClientRect();
};

// ❌ Bad — target 可能指向子元素（历史高频 Bug）
e.target.getBoundingClientRect();
```

### 5.3 条件渲染

```typescript
// ✅ Good — 明确的空状态处理
if (loading) return <Skeleton />;
if (error) return <ErrorDisplay message={error} />;
if (!items.length) return <EmptyState />;
return <ItemList items={items} />;
```

---

## 六、API 开发规范

### 6.1 响应格式（强制）

```typescript
// ✅ 成功
res.json({ success: true, data: result });
res.status(201).json({ success: true, data: created });

// ✅ 失败
res.status(404).json({ success: false, error: 'Story not found' });

// ❌ 绝对不允许裸返回
res.json(result); // 禁止
res.json({ data: result }); // 禁止（缺少 success）
```

### 6.2 分页（强制）

```typescript
// ✅ Good — 所有列表查询必须有上限保护
const safeLimit = Math.max(1, Math.min(limit || 20, 200));

// ❌ Bad — 无上限，可被攻击
const items = await prisma.story.findMany({ take: limit });
```

### 6.3 权限检查

遵循三级权限体系。**在 Service 层必须显式检查：**

```
资源作者 > 父资源作者 > admin
```

不能仅依赖中间件——中间件验证身份，Service 验证权限。

### 6.4 Controller 模式

```typescript
import { Request, Response } from 'express';
import StoryService from '../services/StoryService';

export const getStories = async (req: Request, res: Response) => {
  try {
    const result = await StoryService.getAll(/* ... */);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};
```

---

## 七、数据库规范

### 7.1 Schema 变更

- 所有 Schema 变更必须通过 Prisma Migration
- 禁止手动修改数据库结构
- Migration 文件纳入版本控制

### 7.2 索引

高频查询字段必须加索引：

- 外键字段：`authorId`、`storyId`、`branchId`、`chapterId`
- 排序字段：`createdAt`、`viewCount`
- 联合索引：`(storyId, branchId)`

### 7.3 软删除

核心实体（Story、Chapter、Branch）优先使用 `deletedAt` 软删除，保留数据可恢复性。

---

## 八、Git 提交规范

### 8.1 Commit Message

```
<type>(<scope>): <subject>

feat(booklist): 添加书单排序功能
fix(rating): 修复半星评分点击区域错误
refactor(api): 统一响应格式为 {success, data}
docs(review): 更新代码审查文档
chore(deps): 升级 ESLint 到 v9
```

**Type:** `feat` | `fix` | `refactor` | `docs` | `chore` | `test` | `style`

### 8.2 Pre-commit 自动化

每次 `git commit` 自动执行：

1. **Prettier** — 格式化 staged 文件
2. **ESLint** — 检查 error 级别问题（warning 不阻塞）

提交前确认：

```bash
git diff --cached   # 确认改动范围
```

---

## 九、项目专用红线

以下规则来自历史缺陷总结，**违反即退回：**

### 9.1 前端红线

| #   | 规则                                                       | 严重度 |
| --- | ---------------------------------------------------------- | ------ |
| F1  | 事件位置/尺寸计算必须用 `e.currentTarget`，不用 `e.target` | 🔴     |
| F2  | 禁止 `as any`（PR Review 重点检查）                        | 🟡     |
| F3  | 禁止硬编码 `localhost`，用环境变量                         | 🟡     |
| F4  | 用户提示用 `addToast()`，不用 `alert()`                    | 🟡     |
| F5  | 乐观更新必须处理失败回滚                                   | 🔴     |

### 9.2 后端红线

| #   | 规则                                          | 严重度 |
| --- | --------------------------------------------- | ------ |
| B1  | API 响应必须 `{ success: true, data }` 格式   | 🔴     |
| B2  | 列表查询必须有分页上限 `Math.min(limit, 200)` | 🔴     |
| B3  | 权限检查在 Service 层显式执行                 | 🔴     |
| B4  | Prisma 查询必须声明 `select`/`include`        | 🟡     |

### 9.3 安全检查（所有模块）

| #   | 规则                                   | 严重度 |
| --- | -------------------------------------- | ------ |
| S1  | 所有用户输入必须验证（Zod 或手动校验） | 🔴     |
| S2  | 文件上传必须有类型/大小限制            | 🔴     |
| S3  | 禁止在日志/响应中泄露 token/password   | 🔴     |
| S4  | SQL 查询必须参数化，禁止字符串拼接     | 🔴     |

---

## 十、工具链速查

```bash
# 开发
npm run dev:full          # 前后端并发启动

# 代码质量
npm run check             # TypeScript 编译检查
npm run lint              # ESLint 检查
npm run format            # Prettier 格式化全部文件
npm run format:check      # 检查格式是否符合标准

# Pre-review 质量门禁
npm run review:check      # check + lint + format:check（全绿再PR）

# 测试
npm test                  # Vitest 运行所有测试

# 数据库
npx prisma migrate dev    # 创建并执行 Migration
npx prisma db seed        # 填充种子数据
```

---

## 附录 A：新成员入职清单

1. 阅读本文档
2. 阅读 `docs/CODE_REVIEW.md`（代码审查标准）
3. 安装 Git Hooks：`npm install`（`prepare` 脚本自动执行 `husky`）
4. 配置 IDE：安装 Prettier + ESLint 插件，启用 format-on-save
5. 提交前运行 `npm run review:check`
