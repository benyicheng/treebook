# 项目长期记忆

## 项目：h:/xs（平行宇宙故事平台）

### 技术栈
- **前端**：React + TypeScript + Vite + Tailwind CSS
- **后端**：Express + Prisma + SQLite
- **启动命令**：`npm run dev:full`（前后端并发）

### 核心数据结构
- `BooklistItem` 收藏的是 **Chapter（章节）**，不是 Story
- `Chapter.branchId` 可空：null = 主线，有值 = 属于某分支
- 权限三级：资源作者 / 父资源作者 / admin

### 已完成功能（截止 2026-03-26）
1. 书单作者：添加章节（搜索故事→选章节→填导游点评）、调整顺序、编辑/删除
2. 分支管理：分支作者、主线故事作者、admin 均可操作
3. 主线章节过滤：`getStoryById` 的 chapters 查询加了 `where: { branchId: null }`
4. 「加入书单」功能：阅读页、主线页、分支页均支持，公共组件 `AddToBooklistModal`
5. 章节目录可点击：主线页/分支页章节标题改为 `<Link>` 跳转阅读页
6. 阅读体验优化：ReactMarkdown 统一渲染，设置面板（字号/主题/字体）
7. 首页豆瓣阅读风格重构：轮播/频道/金榜/编辑推荐/书单/继续阅读
8. 侧边栏可折叠：w-72 ↔ w-20，localStorage 持久化
9. **CMS 系统**：站点配置管理（名称/Logo/公告/轮播/页脚），admin 专属页面
10. **分支展示系统全面升级**（2026-03-26）：
    - 后端 `getStoryById` 的 branches 增加 `parentChapter`（分叉点信息）和 `_count.chapters`（章节数）
    - 后端 `getChapterById` 的 `branchesFrom` 增加 `viewCount` 和 `_count.chapters`
    - `StoryBranchTree`：修复 x 坐标 bug（改为主线章节索引映射），同父节点分支竖向错开不重叠
    - `CustomNodes`：节点增加章节数/作者元信息显示，hover 效果增强
    - 主线页概览 Tab：新增「平行宇宙」分支卡片列表（显示分叉点/章节数/作者），超 5 个时有「查看全部」按钮
    - 阅读页平行宇宙入口：全新装饰分隔线设计，卡片显示章节数/作者/阅读量，官方/社区标签区分
    - 分支页：面包屑导航改为「主线 → 第X章:分叉点 → 本分支」路径，分叉点可点击跳转阅读
11. **番外发布功能集成到章节页面**（2026-03-26）：
    - 后端 `getStoryById` 新增 `spinoffs` 查询（包含 author）
    - 后端 `getBranchById` 通过 `parentStory.spinoffs` 获取番外列表（因为 Spinoff 只关联 Story）
    - 前端 Story 接口增加 `spinoffs` 字段，Branch 接口中 `parentStory` 类型包含 `spinoffs`
    - 主线页概览 Tab：新增「番外作品」展示区块（带发布按钮），显示番外列表/空状态
    - 分支页 Header：新增「番外作品」横向滚动展示区（带发布按钮）
    - 主线页/分支页：新增发布番外 Modal（标题+内容，关联当前故事）
12. **首页热门书单功能**（2026-03-26）：
    - 后端 `getBooklists` 支持 `limit` 和 `sortBy` 参数（`sortBy=hot` 按 viewCount 热度排序）
    - 前端 Home.tsx 导入 `booklistService`，添加 `hotBooklists` 状态和 `fetchHotBooklists` 函数
    - 首页「热门书单」区块替换为真实 API 数据，显示标题/作者/章节数/浏览量
    - 空状态：无书单时显示引导图标和提示文字
13. **首页新书速递扩展**（2026-03-26）：
    - 后端添加 `getBranches` 接口，获取最新分支列表（包含 author/parentStory/_count.chapters）
    - 后端 branches 路由添加 GET / 路由
    - 前端 storyService.ts 添加 `branchService.getAll` 方法
    - 前端 Home.tsx 添加 `newBranches` 状态和 `fetchNewBranches` 函数
    - 「新书速递」区块混合展示：4 本新书 + 2 个分支
    - 分支卡片特殊设计：紫色渐变背景、GitBranch 图标、显示父故事标题
14. **首页信息密度优化**（2026-03-26）：
    - 区块间距：从 `space-y-10` 缩小为 `space-y-6`
    - 频道导航：缩小内边距（py-5 → py-4），图标尺寸（w-10 → w-9），文字尺寸（text-sm → text-xs）
    - 热门书单：从 3 列改为 4 列，卡片尺寸缩小（aspect-[16/8] → [16/9]），内边距减小
    - 编辑推荐：从 5 列（2+3）改为 6 列（2+4），右侧列表增加列数
    - 更多推荐：从 5 列改为 6 列（lg:grid-cols-6），显示数量从 10 增加到 12

### 关键文件路径
| 文件 | 说明 |
|---|---|
| `prisma/schema.prisma` | 数据库 Schema |
| `api/src/controllers/booklistController.ts` | 书单 CRUD |
| `api/src/controllers/chapterController.ts` | 章节 CRUD + 权限 |
| `api/src/controllers/branchController.ts` | 分支 CRUD + 权限 |
| `api/src/controllers/storyController.ts` | 故事 CRUD（含主线章节过滤）|
| `api/src/controllers/cmsController.ts` | CMS 站点配置 CRUD |
| `api/src/routes/cms.ts` | CMS 路由（GET 公开，PUT admin）|
| `src/api/storyService.ts` | 前端 API 服务层 |
| `src/stores/useSiteConfigStore.ts` | CMS 站点配置 Zustand Store |
| `src/components/AddToBooklistModal.tsx` | 加入书单公共 Modal |
| `src/pages/mainline/MainlinePage.tsx` | 主线故事页 |
| `src/pages/branch/BranchPage.tsx` | 分支页 |
| `src/pages/read/ReadPage.tsx` | 阅读页 |
| `src/pages/booklist/BooklistDetailPage.tsx` | 书单详情页 |
| `src/pages/admin/CMSPage.tsx` | CMS 管理页面 |
| `src/layouts/MainLayout.tsx` | 主布局（侧边栏可折叠，动态 Logo）|
