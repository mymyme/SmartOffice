#!/bin/bash

# SmartOffice Backend 启动脚本

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🚀 SmartOffice Backend 启动脚本"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# 获取脚本所在目录
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
BACKEND_DIR="$SCRIPT_DIR/backend"

# 检查backend目录是否存在
if [ ! -d "$BACKEND_DIR" ]; then
    echo "❌ 错误: backend 目录不存在"
    exit 1
fi

cd "$BACKEND_DIR"

# 检查node_modules是否存在
if [ ! -d "node_modules" ]; then
    echo "📦 正在安装依赖..."
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ 依赖安装失败"
        exit 1
    fi
    echo "✅ 依赖安装完成"
    echo ""
fi

# 检查.env文件是否存在
if [ ! -f ".env" ]; then
    echo "⚠️  警告: .env 文件不存在，使用默认配置"
fi

# 启动服务器
echo "🔄 正在启动后端服务器..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# 检查是否安装了nodemon
if command -v nodemon &> /dev/null; then
    npm run dev
else
    npm start
fi

