#!/bin/bash

# Monaco Editor 前端启动脚本
echo "🚀 启动 Monaco Editor 前端服务器..."
echo "📁 项目目录: $(pwd)"
echo ""

# 检查 Node.js 是否安装
if ! command -v node &> /dev/null; then
    echo "❌ 错误: 未找到 Node.js，请先安装 Node.js"
    exit 1
fi

# 检查 npm 是否安装
if ! command -v npm &> /dev/null; then
    echo "❌ 错误: 未找到 npm，请先安装 npm"
    exit 1
fi

echo "✅ Node.js 版本: $(node --version)"
echo "✅ npm 版本: $(npm --version)"
echo ""

# 切换到项目根目录
cd "$(dirname "$0")/../.."

# 启动AI代理服务器
echo "🤖 启动 AI 代理服务器..."
cd services
node ai-proxy.js &
AI_PROXY_PID=$!
cd ..

# 等待代理服务器启动
sleep 2

# 检查端口是否被占用
if lsof -Pi :3005 -sTCP:LISTEN -t >/dev/null ; then
    echo "⚠️  警告: 端口 3005 已被占用"
    echo "🔄 尝试使用端口 3008..."
    PORT=3008 node server.js
else
    echo "✅ 端口 3005 可用"
    echo "🌐 启动 HTTP 服务器..."
    echo "📄 基础演示: http://localhost:3005/"
    echo "🤖 AI 演示: http://localhost:3005/ai"
    echo "🔗 AI 代理: http://localhost:3008/api/chat"
    echo ""
    PORT=3005 node server.js
fi

# 清理函数
cleanup() {
    echo ""
    echo "🛑 正在关闭所有服务..."
    if [ ! -z "$AI_PROXY_PID" ]; then
        kill $AI_PROXY_PID 2>/dev/null
        echo "✅ AI 代理服务器已关闭"
    fi
    exit 0
}

# 捕获中断信号
trap cleanup SIGINT SIGTERM
