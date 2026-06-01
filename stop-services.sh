#!/bin/bash

# SmartOffice 服务停止脚本

echo "🛑 正在停止 SmartOffice 服务..."
echo ""

# 获取脚本所在目录
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# 读取PID并停止服务
if [ -f "logs/backend.pid" ]; then
    BACKEND_PID=$(cat logs/backend.pid)
    if ps -p $BACKEND_PID > /dev/null 2>&1; then
        echo "⏹️  停止后端服务 (PID: $BACKEND_PID)..."
        kill $BACKEND_PID
        echo "✅ 后端服务已停止"
    else
        echo "⚠️  后端服务未运行"
    fi
    rm logs/backend.pid
else
    echo "⚠️  未找到后端PID文件"
fi

echo ""

if [ -f "logs/frontend.pid" ]; then
    FRONTEND_PID=$(cat logs/frontend.pid)
    if ps -p $FRONTEND_PID > /dev/null 2>&1; then
        echo "⏹️  停止前端服务 (PID: $FRONTEND_PID)..."
        kill $FRONTEND_PID
        echo "✅ 前端服务已停止"
    else
        echo "⚠️  前端服务未运行"
    fi
    rm logs/frontend.pid
else
    echo "⚠️  未找到前端PID文件"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ 所有服务已停止"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

