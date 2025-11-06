#!/bin/bash

# Monaco Editor 项目启动脚本
echo "🚀 启动 Monaco Editor 项目..."
echo "📁 项目目录: $(pwd)"
echo ""

# 检查 Node.js 是否安装
if ! command -v node &> /dev/null; then
    echo "❌ 错误: 未找到 Node.js，请先安装 Node.js"
    exit 1
fi

echo "✅ Node.js 版本: $(node --version)"
echo ""

# 显示启动选项
echo "请选择启动方式:"
echo "1) 启动基础服务器 (端口 3005)"
echo "2) 启动网站服务器 (端口 3006)"
echo "3) 启动开发服务器 (端口 3007)"
echo "4) 启动所有服务"
echo ""

read -p "请输入选项 (1-4): " choice

case $choice in
    1)
        echo "🌐 启动基础服务器..."
        echo "📄 基础演示: http://localhost:3005/"
        echo "🤖 AI 演示: http://localhost:3005/ai"
        echo ""
        node server.js
        ;;
    2)
        echo "🌐 启动网站服务器..."
        echo "📄 网站: http://localhost:3006"
        echo ""
        node frontend/services/website-server.js
        ;;
    3)
        echo "🌐 启动开发服务器..."
        echo "📄 开发环境: http://localhost:3007"
        echo ""
        cd website && npm run dev
        ;;
    4)
        echo "🌐 启动所有服务..."
        echo "📄 基础演示: http://localhost:3005/"
        echo "🤖 AI 演示: http://localhost:3005/ai"
        echo "📄 网站: http://localhost:3006"
        echo "📄 开发环境: http://localhost:3007"
        echo ""

        # 启动基础服务器
        node server.js &
        SERVER_PID=$!

        # 启动网站服务器
        node frontend/services/website-server.js &
        WEBSITE_PID=$!

        # 启动开发服务器
        cd website && npm run dev &
        DEV_PID=$!

        echo "✅ 所有服务已启动"
        echo "按 Ctrl+C 停止所有服务"

        # 等待用户中断
        trap "kill $SERVER_PID $WEBSITE_PID $DEV_PID; exit" INT
        wait
        ;;
    *)
        echo "❌ 无效选项，请重新运行脚本"
        exit 1
        ;;
esac


