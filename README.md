# 平行宇宙写作平台 (Parallel Universe Writing Platform)

这是一个创新型多人协作写作环境，支持主线、分支、番外、书单四种故事路径。通过图形化的"平行世界"展示故事的多样性。

[![GitHub Repo](https://img.shields.io/badge/github-repo-blue.svg)](https://github.com/your-username/parallel-universe)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

## 技术栈

- **前端**: React 18, TypeScript, Vite, Tailwind CSS, Zustand, React-Flow (树图可视化), TipTap (协作编辑器)
- **后端**: Node.js, Express, Socket.io (实时协作), JWT (身份认证)
- **数据库**: SQLite (开发) / PostgreSQL (生产) + Prisma ORM
- **图标**: Lucide React

## 在线演示

- 前端预览: [待部署]
- 后端 API: [待部署]

## 快速部署

本项目可以快速部署到以下平台:

- **Vercel**: [查看部署指南](docs/GITHUB_DEPLOYMENT.md) (推荐,免费)
- **Render**: [查看部署指南](docs/GITHUB_DEPLOYMENT.md) (支持后端)
- **Railway**: [查看部署指南](docs/GITHUB_DEPLOYMENT.md) (一键部署)
- **自建服务器**: [查看部署指南](docs/GITHUB_DEPLOYMENT.md) (VPS)

## 目录结构说明

- `api/`: 后端源码目录
  - `src/controllers`: 业务逻辑控制器
  - `src/routes`: API 路由定义
  - `src/middleware`: 身份认证及权限校验中间件
  - `src/domains`: 领域模块（如 moderation、reviewWorkflow、media）
- `prisma/`: 数据库模型定义及迁移脚本
  - `schema.prisma`: Prisma 模型定义
  - `dev.db`: 本地 SQLite 数据库文件
- `src/`: 前端源码目录
  - `api/`: API 请求封装层
  - `components/`: UI 组件，如 `StoryTree` (树图) 和 `Editor` (编辑器)
  - `stores/`: 状态管理 (Zustand)
  - `pages/`: 页面级组件 (Home, Mainline, Branch, Spinoff, Booklist)
  - `layouts/`: 布局组件

  api/src/
├── services/           # 业务逻辑大脑 (Service Layer)
│   ├── StoryService.ts
│   ├── InteractionService.ts
│   ├── RevenueService.ts
│   ├── StorageService.ts     <-- 新增：支持图片/视频存储
│   ├── BlockchainService.ts  <-- 新增：支持区块链存证
│   └── AIGenerationService.ts <-- 新增：支持 AI 多媒体创作
├── controllers/        # HTTP 接口转换器
├── middleware/         # 权限与验证 (Zod & Auth)
└── routes/             # 扁平化的路由定义

## 核心功能

1. **主线故事**: 由原作者创建，作为宇宙的起源。
2. **平行分支**: 任何读者可以在任意章节创建分支，开启新的可能性。
3. **双轨系统**: 区分"官方正作"与"社区创作"，通过 `isOfficial` 标志过滤。
4. **精彩番外**: 独立于主线的短篇故事，丰富角色维度。
5. **精选书单**: 社区成员编排的个性化阅读路径。
6. **图形化宇宙树**: 直观展示故事的 Divergence (发散) 与 Convergence (收敛)。

## 快速开始

### 1. 安装依赖
```bash
# 安装根目录依赖（前端）
npm install

# 安装后端依赖
cd api
npm install
cd ..
```

### 2. 数据库初始化
```bash
npx prisma migrate dev --name init
npx tsx prisma/seed.ts
```

### 3. 启动项目
```bash
# 启动前端 (默认端口 5173)
npm run dev

# 启动后端 (默认端口 3001)
cd api
npm run dev
```

## 数据库切换 (PostgreSQL)

若需切换至 PostgreSQL，请修改 `prisma/schema.prisma` 中的 `datasource` provider 为 `postgresql`，并更新 `.env` 中的 `DATABASE_URL`。

## 协作规范

- 每个模块应有独立文件夹。
- 复杂逻辑应封装在 `controllers` 或 `hooks` 中。
- 关键功能点需添加注释。

## 内容管理审计与优化

- 文档入口：docs/cms_audit/README.md
