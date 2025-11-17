#!/bin/bash

echo "🚀 启动 Monaco Editor 完整服务..."
echo "📁 项目目录: $(pwd)"
echo ""

# 检查 Node.js 是否安装
if ! command -v node &> /dev/null; then
    echo "❌ 错误: 未找到 Node.js，请先安装 Node.js"
    exit 1
fi

echo "✅ Node.js 版本: $(node --version)"
echo ""

# 启动AI代理服务器
echo "🤖 启动 AI 代理服务器..."
cd frontend/services
node ai-proxy.js &
AI_PROXY_PID=$!
cd ../..

# 等待代理服务器启动
echo "⏳ 等待代理服务器启动..."
sleep 3

# 检查代理服务器是否启动成功
if ! curl -s http://localhost:3008/api/chat > /dev/null; then
    echo "❌ 代理服务器启动失败"
    kill $AI_PROXY_PID 2>/dev/null
    exit 1
fi

echo "✅ AI 代理服务器已启动 (PID: $AI_PROXY_PID)"

# 启动主服务器
echo "🌐 启动主服务器..."
cd frontend/services
node server.js &
MAIN_SERVER_PID=$!
cd ../..

# 等待主服务器启动
sleep 2

echo ""
echo "🎉 所有服务已启动！"
echo "📄 基础演示: http://localhost:3005/"
echo "🤖 AI 演示: http://localhost:3005/ai"
echo "🔗 AI 代理: http://localhost:3008/api/chat"
echo "🧪 连接测试: http://localhost:3005/frontend/demos/test-connection.html"
echo ""
echo "⏹️  按 Ctrl+C 停止所有服务"

# 清理函数
cleanup() {
    echo ""
    echo "🛑 正在关闭所有服务..."
    if [ ! -z "$AI_PROXY_PID" ]; then
        kill $AI_PROXY_PID 2>/dev/null
        echo "✅ AI 代理服务器已关闭"
    fi
    if [ ! -z "$MAIN_SERVER_PID" ]; then
        kill $MAIN_SERVER_PID 2>/dev/null
        echo "✅ 主服务器已关闭"
    fi
    exit 0
}

# 捕获中断信号
trap cleanup SIGINT SIGTERM

# 等待
wait

