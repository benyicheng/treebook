# 部署指南 (Deployment Guide)

本项目建议采用 **Vercel (前端)** + **Render (后端 & 数据库)** 的免费方案部署。

## 1. 数据库准备 (Supabase 或 Render PostgreSQL)
由于云端无法使用本地 SQLite 文件，推荐使用 [Supabase](https://supabase.com/) 的免费 PostgreSQL：
1. 创建项目，获取 `DATABASE_URL`。
2. 在 GitHub 部署前，将 `prisma/schema.prisma` 中的 `provider` 改为 `"postgresql"`：
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```

## 2. 后端部署 (Render)
1. 在 [Render](https://render.com/) 创建 **Blueprint**。
2. 关联 GitHub 仓库 `treebook`。
3. Render 会自动读取 `render.yaml` 并创建 Web Service 和 PostgreSQL 数据库。
4. 在 Render 控制台手动设置 `FRONTEND_URL` 环境变量（Vercel 的域名）。

## 3. 前端部署 (Vercel)
1. 在 [Vercel](https://vercel.com/) 导入 `treebook` 仓库。
2. 设置环境变量：
   - `VITE_API_URL`: Render 后端的 API 地址 (如 `https://treebook-api.onrender.com/api`)。
3. 点击 **Deploy**。

## 4. 常见问题
* **API 连接不上**：确保后端 `CORS` 已配置允许 Vercel 域名访问。
* **数据库报错**：部署前必须将 Prisma Provider 改为 `postgresql` 并运行 `npx prisma generate`。
