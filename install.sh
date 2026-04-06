#!/bin/bash

echo "🚀 开始安装 Treebook (World-Line Guide)..."

# 1. 检查 Node.js 环境
if ! command -v node &> /dev/null; then
    echo "❌ 错误: 未检测到 Node.js，请先安装 Node.js (推荐 v18+)。"
    exit 1
fi

# 2. 安装全局 PM2
if ! command -v pm2 &> /dev/null; then
    echo "📦 正在安装 PM2..."
    npm install -g pm2
fi

# 3. 安装依赖
echo "📦 正在安装项目依赖..."
npm install

# 4. 配置环境变量
if [ ! -f "api/.env" ]; then
    echo "⚙️  正在生成默认 api/.env 文件..."
    # 默认使用 SQLite，你可以根据需要修改
    echo 'DATABASE_URL="file:./dev.db"' > api/.env
    echo 'JWT_SECRET="treebook-secret-key-change-me"' >> api/.env
    echo 'PORT=3001' >> api/.env
    echo "✅ 已生成默认配置，你可以稍后编辑 api/.env 进行修改。"
fi

# 5. 确保目录存在
mkdir -p uploads

# 6. 初始化数据库
echo "🗄️  正在初始化数据库..."
npx prisma db push

# 6. 编译前端
echo "🏗️  正在编译前端资源..."
npm run build

# 7. 启动服务
echo "🔥 正在使用 PM2 启动服务..."
pm2 delete aura-api 2>/dev/null || true
pm2 start "npm run api:prod" --name "aura-api"

echo "🎉 安装完成！"
echo "🌐 前端预览: http://$(curl -s ifconfig.me):5173 (如果你使用 npm run dev)"
echo "📡 后端接口: http://$(curl -s ifconfig.me):3001/api"
echo "📝 请访问 /setup 路径（如果已开发）进行管理员初始化。"
