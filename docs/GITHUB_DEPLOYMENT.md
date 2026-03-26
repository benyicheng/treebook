# GitHub 部署指南

本指南帮助你将平行宇宙故事平台部署到 GitHub。

## 前置条件

- [ ] 已有 GitHub 账号
- [ ] 已安装 Git
- [ ] 已配置 Git 用户信息

## 部署步骤

### 1. 在 GitHub 上创建新仓库

1. 登录 GitHub
2. 点击右上角的 `+` → `New repository`
3. 填写仓库信息:
   - **Repository name**: `parallel-universe` (或你喜欢的名称)
   - **Description**: 平行宇宙故事平台 - 多人协作写作环境
   - **Visibility**: Public (公开) 或 Private (私有)
   - **不要勾选**: "Add a README file", "Add .gitignore", "Choose a license"
4. 点击 `Create repository`

### 2. 推送代码到 GitHub

执行以下命令(替换 `YOUR_USERNAME` 为你的 GitHub 用户名):

```bash
# 添加远程仓库
git remote add origin https://github.com/YOUR_USERNAME/parallel-universe.git

# 推送代码
git branch -M main
git push -u origin main
```

### 3. 配置 GitHub 仓库

#### 添加 README

在 GitHub 仓库页面:
1. 点击 `Add file` → `Create new file`
2. 文件名: `README.md`
3. 复制项目根目录的 `README.md` 内容
4. 或使用 GitHub 自动生成的 README(如果推送时已存在)

#### 添加项目标签(可选)

在仓库页面:
1. 点击 `Settings` → `Labels`
2. 添加常用标签:
   - `bug` (红色)
   - `enhancement` (紫色)
   - `documentation` (蓝色)
   - `good first issue` (绿色)

#### 启用 Issues(可选)

在仓库页面:
1. 点击 `Settings` → `General`
2. 找到 `Features` → `Issues`
3. 点击 `Set up issues`
4. 选择模板或自定义

### 4. 保护分支(推荐)

在仓库页面:
1. 点击 `Settings` → `Branches`
2. 找到 `Branch protection rules`
3. 点击 `Add rule`
4. 配置:
   - **Branch name pattern**: `main`
   - **Require pull request reviews before merging**: 勾选
   - **Require status checks to pass before merging**: 勾选

### 5. 添加 LICENSE(推荐)

在仓库页面:
1. 点击 `Add file` → `Create new file`
2. 文件名: `LICENSE`
3. 选择许可证类型:
   - MIT License (最宽松,推荐开源项目)
   - Apache License 2.0
   - GNU GPL v3 (Copyleft)

### 6. 部署到生产环境(可选)

#### 方案 A: Vercel (推荐,免费)

**前端部署**:
1. 访问 [vercel.com](https://vercel.com)
2. 导入 GitHub 仓库
3. 配置:
   - **Framework Preset**: Vite
   - **Root Directory**: `.` (根目录)
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

**后端部署**(需要额外配置):
1. 使用 Vercel Serverless Functions 或其他 PaaS
2. 需要将 Express 适配为 Vercel API Routes
3. 数据库需要迁移到 PostgreSQL/MySQL

#### 方案 B: Render (免费)

1. 访问 [render.com](https://render.com)
2. 导入 GitHub 仓库
3. 创建 Web Service
4. 配置环境变量:
   - `DATABASE_URL`: PostgreSQL 连接串
   - `JWT_SECRET`: 随机密钥

#### 方案 C: Railway (免费)

1. 访问 [railway.app](https://railway.app)
2. 导入 GitHub 仓库
3. 自动检测并配置

#### 方案 D: 自己的服务器

1. 购买 VPS (如腾讯云、阿里云)
2. 安装 Node.js、Nginx、PM2
3. 克隆代码并配置:
   ```bash
   git clone https://github.com/YOUR_USERNAME/parallel-universe.git
   cd parallel-universe
   npm install
   npm run build
   pm2 start npm --name frontend -- run dev:full
   ```

### 7. 添加环境变量(生产环境)

创建 `.env.production` 文件:

```env
# 数据库
DATABASE_URL=postgresql://user:password@host:port/database

# JWT 密钥
JWT_SECRET=your-super-secret-random-string-change-this

# 服务器端口
PORT=3001

# CORS 允许的源
CORS_ORIGIN=https://your-frontend-domain.com
```

## 部署检查清单

部署后,请检查以下内容:

- [ ] 首页可正常访问
- [ ] 用户注册/登录功能正常
- [ ] 创建故事功能正常
- [ ] 阅读/评论功能正常
- [ ] 分支/番外功能正常
- [ ] 书单功能正常
- [ ] 移动端适配正常
- [ ] 页面加载速度正常(< 3s)
- [ ] API 响应正常
- [ ] 数据库连接稳定

## 常见问题

### Q: 推送时提示认证失败?
A: 检查是否有 GitHub 访问权限,或使用 SSH:
```bash
git remote set-url origin git@github.com:YOUR_USERNAME/parallel-universe.git
```

### Q: 如何更新代码?
A:
```bash
git add .
git commit -m "描述你的更改"
git push
```

### Q: 数据库文件被忽略怎么办?
A: 这是正常的!生产环境应使用 PostgreSQL。本地开发继续使用 SQLite。

### Q: 如何回滚到之前的版本?
A:
```bash
git log  # 查看提交历史
git checkout <commit-hash>  # 切换到指定提交
```

## 后续优化建议

1. **添加 CI/CD**:
   - 使用 GitHub Actions 自动测试
   - 自动部署到 Vercel/Render

2. **添加文档**:
   - API 文档(Swagger/OpenAPI)
   - 部署文档
   - 贡献指南(CONTRIBUTING.md)

3. **性能优化**:
   - 添加 CDN 加速静态资源
   - 图片懒加载
   - 代码分割

4. **安全加固**:
   - 添加 HTTPS(Let's Encrypt)
   - 配置 CSP(Content Security Policy)
   - 添加速率限制

5. **监控告警**:
   - 错误跟踪(Sentry)
   - 性能监控
   - 日志聚合

## 需要帮助?

- GitHub 文档: https://docs.github.com
- Vercel 文档: https://vercel.com/docs
- Render 文档: https://render.com/docs
