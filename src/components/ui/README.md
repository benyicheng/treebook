# UI 原子组件层

> 基于现有设计 token（`ink-*` / `accent-*` / `rounded-*` / `duration-*`）的统一组件层。
> 目标：替代全项目散落的内联按钮/输入框/卡片样式，统一 padding、圆角、焦点环、禁用态、loading 态与排版层级。

## 何时用什么

| 场景 | 用法 |
| --- | --- |
| 普通按钮（`<button>`） | `<Button variant="..." size="...">` |
| 需要跳转的按钮（`<Link>` / `<a>`） | `className={buttonVariants({ variant, size })}` |
| 纯图标按钮 | `<IconButton aria-label="...">` |
| 文本输入 | `<Input />` / 多行 `<Textarea />` |
| 下拉选择 | `<Select>`（基于原生 select，带 chevron） |
| 开关切换 | `<Switch checked={...} onChange={...} />` |
| 内容容器卡片 | `<Card>`（可选 `CardHeader/CardBody/CardFooter`） |
| 标签 / 状态徽标 | `<Badge tone="..." variant="..." />` |
| 标签页导航 | `<Tabs items={...} value={...} onChange={...} />` |
| 模态/抽屉遮罩 | `className="scrim"`（随明暗自适应，替代 `bg-black/NN`） |
| 微标签（eyebrow） | `className="eyebrow"`（替代 `text-[10px] font-black uppercase tracking-widest`） |

## Button / buttonVariants

```tsx
// 注意：本项目使用相对路径导入（未配置 @ 别名）
import { Button, buttonVariants } from '../../components/ui';

<Button variant="primary" size="md" leftIcon={<Plus size={16} />}>新建</Button>
<Button variant="danger" loading={saving}>删除</Button>
<Button variant="ghost" fullWidth>取消</Button>

// 用于 Link：
<Link to="/login" className={buttonVariants({ variant: 'secondary' })}>登录</Link>
```

- `variant`: `primary`（默认，accent 实心）/ `secondary`（ink 反色）/ `outline` / `ghost` / `subtle` / `danger`
- `size`: `sm`(h-9) / `md`(h-11，默认) / `lg`(h-12)
- `loading` 自动禁用并显示内置 spinner；`leftIcon`/`rightIcon`/`fullWidth` 按需使用。
- 需要覆盖圆角等，直接传 `className`（`twMerge` 会正确覆盖冲突项，如 `rounded-full`）。

## 排版约定（重要）

- 组件默认使用 **`font-semibold`** 而非 `font-black`。字重分层规范：
  - **`font-black`（800）**：仅页面主标题（h1 hero）、品牌 logo 等极少数展示场景。
  - **`font-bold`（700）**：区块标题（h2/h3/h4）、空状态主文案。
  - **`font-semibold`（600）**：按钮、导航项、标签、徽标、表单 label。
- **微标签**（`text-[9-10px] uppercase` 一类）请用 `.eyebrow` 工具类，它统一为 600 字重 + 0.1em 字距，替代散落的 `text-[10px] font-black uppercase tracking-widest`。

## 颜色约定

- 表面/文字/边框一律用 `ink-*` / `accent-*` token，避免 `bg-white`/`text-white`/`bg-black` 硬编码。
- 模态与抽屉的遮罩用 `.scrim` 工具类（基于 `--scrim-light` token，随明暗自适应），替代 `bg-black/30|40|50|60`。

## 无障碍

- `IconButton` 强制要求 `aria-label`。
- `Button` 在 `loading` 时自动加 `aria-busy`。
- `Tabs` 使用 `role="tablist"/"tab"`，支持左右方向键切换。
- `Input`/`Textarea` 提供 `error` 态，配合外部 `<label htmlFor>` 使用。

## 迁移指引（后续增量）

其余页面按目录逐步迁移，原则：**视觉与交互等价或更精细，不改变布局与业务逻辑**。
优先级建议：~~discover/~~ → ~~read/~~ → ~~mainline/~~ → booklist/ → admin/

已完成迁移：
- 共享组件：`EmptyState`、`ConfirmDialog`、`Modal`、`NotificationDropdown`、`home/*`、`Merge/MergeManagementModal`、`MainLayout`
- `auth/`：`LoginPage`、`RegisterPage`
- `discover/`：`UniverseDiscoverPage`（搜索/刷新/分页）
- `read/`：`CreateBranchModal`、`ChapterNavigation`、`CommentSection`
- `mainline/`：`CreateStoryPage`、`components/StoryModals`
- `admin/`：`CMSPage`、`RoleManagement`、`ModerationDashboard`、`ReviewCasesPage`、`EditorialChangesPage`、`UserManagement`（全目录完成）
- `reading-path/`：`ReadingPathEditPage`、`ReadingPathCreatePage`、`ReadingPathDetailPage`、`ReadingPathsListPage`、`ReadingTrailPage`（全目录完成）
- `booklist/`：`BooklistPage`、`BooklistDetailPage` + 12 个 components（全目录完成）
- `spinoff/`：`SpinoffEditorPage`、`SpinoffDetailPage`、`SpinoffPage`（全目录完成）
- `wiki/`：`WikiDetailPage`、`WikiEditorPage`、`WikiListPage`（全目录完成）
- `branch/`：`BranchPage`、`BranchesPage`（全目录完成）
- `search/`、`follow/`（全目录完成）
- 共享组件：`Interaction/*`（FollowButton/ShareButton/RatingComponent）、`Editor/*`（ChapterEditor/MarkdownEditor）、`layout/MobileSearchOverlay`、`notifications/*`、`reading/ReadingSettings`、`StoryTree/*`、`Booklist/ReadingDrawer*`、`Booklist/AddToBooklistModal`、`Merge/*`

**迁移已基本完成。** 剩余仅为少数刻意保留的专用组件（自定义分段控件、checkbox、可点击列表行等）。
未纳入（专用组件，刻意保留）：`ReadingToolbar` 悬浮控件、`DiscoverTabs` 非全宽 pill、页码方块分页器、Link 卡片式章节导航。缺 `Select` 原子组件，原生 `<select>` 暂保留。
