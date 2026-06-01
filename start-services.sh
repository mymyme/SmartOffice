#!/bin/bash

# SmartOffice 服务启动脚本
# 用于同时启动前端和后端服务

echo "🚀 正在启动 SmartOffice 服务..."
echo ""

# 检查Node.js是否安装
if ! command -v node &> /dev/null; then
    echo "❌ 错误: 未检测到 Node.js，请先安装 Node.js"
    exit 1
fi

echo "✅ Node.js 版本: $(node -v)"
echo "✅ NPM 版本: $(npm -v)"
echo ""

# 获取脚本所在目录的绝对路径
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"
mkdir -p logs

# 启动后端服务
echo "📡 启动后端 API 服务..."
cd backend
if [ ! -d "node_modules" ]; then
    echo "📦 首次运行，正在安装后端依赖..."
    npm install
fi

# 后台运行后端
node server.js > ../logs/backend.log 2>&1 &
BACKEND_PID=$!
echo "✅ 后端服务已启动 (PID: $BACKEND_PID)"
echo "   - API地址: http://localhost:3006"
echo "   - 日志文件: logs/backend.log"
echo ""

# 等待后端启动
sleep 2

# 启动前端服务
echo "🌐 启动前端服务..."
cd ../frontend
if [ ! -d "node_modules" ]; then
    echo "📦 首次运行，正在安装前端依赖..."
    npm install
fi

# 后台运行前端
node services/server.js > ../logs/frontend.log 2>&1 &
FRONTEND_PID=$!
echo "✅ 前端服务已启动 (PID: $FRONTEND_PID)"
echo "   - 访问地址: http://localhost:3005"
echo "   - 日志文件: logs/frontend.log"
echo ""

# 保存PID到文件
cd "$SCRIPT_DIR"
mkdir -p logs
echo $BACKEND_PID > logs/backend.pid
echo $FRONTEND_PID > logs/frontend.pid

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎉 所有服务启动完成！"
echo ""
echo "📍 访问地址:"
echo "   前端页面: http://localhost:3005"
echo "   后端API:  http://localhost:3006"
echo ""
echo "📝 查看日志:"
echo "   tail -f logs/frontend.log"
echo "   tail -f logs/backend.log"
echo ""
echo "🛑 停止服务:"
echo "   ./stop-services.sh"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "💡 提示: 服务在后台运行，关闭终端不会停止服务"
echo ""
