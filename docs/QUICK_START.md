# 快速开始 GitHub 部署

本指南帮助你快速将代码推送到 GitHub。

## 方法一: 使用部署脚本 (推荐)

1. 双击运行 `deploy-github.bat`
2. 按照提示输入:
   - GitHub 仓库地址 (或直接回车使用默认)
   - GitHub 用户名
   - 提交说明 (或直接回车使用默认)

脚本会自动:
- ✅ 检查 Git 状态
- ✅ 添加所有更改
- ✅ 创建提交
- ✅ 推送到 GitHub

## 方法二: 手动命令行

### 1. 创建 GitHub 仓库

1. 访问 https://github.com/new
2. 填写信息:
   - Repository name: `parallel-universe`
   - Description: `平行宇宙故事平台`
   - 选择 Public 或 Private
3. 点击 `Create repository`

### 2. 推送代码

打开命令行,执行:

```bash
# 添加远程仓库
git remote add origin https://github.com/你的用户名/parallel-universe.git

# 切换到 main 分支
git branch -M main

# 推送代码
git push -u origin main
```

### 3. 验证推送

1. 访问你的 GitHub 仓库页面
2. 检查文件是否都上传成功
3. 查看 README.md 是否正确显示

## 常见问题

### Q: 提示 remote already exists?
A: 执行:
```bash
git remote set-url origin https://github.com/你的用户名/parallel-universe.git
```

### Q: 提示 authentication failed?
A: 可能原因:
1. 密码错误 → 使用 Personal Access Token
2. URL 格式错误 → 检查是否包含 `https://`
3. 权限不足 → 检查仓库是否为私有

**解决方法**: 使用 SSH 方式:
```bash
git remote set-url origin git@github.com:你的用户名/parallel-universe.git
```

### Q: 如何获取 GitHub Token?

1. 访问 https://github.com/settings/tokens
2. 点击 `Generate new token (classic)`
3. 选择权限: `repo` (完整仓库访问)
4. 点击 `Generate token`
5. 复制 token (只显示一次!)
6. 推送时输入: `https://TOKEN@github.com/用户名/repo.git`

### Q: 推送后需要做什么?

1. **配置 GitHub Pages** (可选):
   - Settings → Pages
   - Source: Deploy from a branch
   - Branch: main / (root)

2. **启用 Issues** (可选):
   - Settings → General
   - Features → Issues
   - Set up issues

3. **添加协作者** (可选):
   - Settings → Collaborators
   - 邀请团队成员

## 下一步

推送成功后,你可以:

1. **查看完整部署指南**: [docs/GITHUB_DEPLOYMENT.md](docs/GITHUB_DEPLOYMENT.md)
2. **配置 CI/CD**: 设置 GitHub Actions 自动测试
3. **部署到 Vercel**: 一键部署前端
4. **配置域名**: 绑定自定义域名

## 需要帮助?

- GitHub 官方文档: https://docs.github.com
- Git 快捷键参考: https://github.com/git
- 联系项目维护者: 查看代码贡献者
