#!/bin/bash

echo "🚀 Monaco Editor 二次开发环境启动脚本"
echo "=================================="

# 检查 Node.js 环境
if ! command -v node &> /dev/null; then
    echo "❌ 错误: 未找到 Node.js，请先安装 Node.js 18+"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo "❌ 错误: 未找到 npm，请先安装 npm"
    exit 1
fi

echo "✅ Node.js 版本: $(node --version)"
echo "✅ npm 版本: $(npm --version)"
echo ""

# 进入项目目录
cd /media/storage/project/aicode

# 检查项目结构
if [ ! -d "website" ]; then
    echo "❌ 错误: 未找到 website 目录"
    exit 1
fi

if [ ! -d "二次开发示例" ]; then
    echo "❌ 错误: 未找到二次开发示例目录"
    exit 1
fi

echo "📁 项目目录: $(pwd)"
echo ""

# 选择启动模式
echo "请选择启动模式:"
echo "1. 开发模式 (webpack-dev-server)"
echo "2. 生产模式 (构建后启动)"
echo "3. 示例模式 (运行示例文件)"
echo "4. 自定义模式 (手动配置)"
echo ""

read -p "请输入选择 (1-4): " choice

case $choice in
    1)
        echo "🔧 启动开发模式..."
        cd website
        if [ ! -d "node_modules" ]; then
            echo "📦 安装依赖..."
            npm install --legacy-peer-deps
        fi
        echo "🌐 启动开发服务器..."
        npm run dev
        ;;
    2)
        echo "🏗️ 构建生产版本..."
        cd website
        if [ ! -d "node_modules" ]; then
            echo "📦 安装依赖..."
            npm install --legacy-peer-deps
        fi
        echo "🔨 构建项目..."
        npx webpack --config webpack-simple.config.ts --mode production
        echo "🌐 启动生产服务器..."
        cd ..
        node website-server.js
        ;;
    3)
        echo "📚 启动示例模式..."
        echo "🌐 启动示例服务器..."
        python3 -m http.server 8080 --directory 二次开发示例
        ;;
    4)
        echo "⚙️ 自定义模式..."
        echo "请手动配置您的开发环境"
        echo "项目目录: $(pwd)"
        echo "网站目录: $(pwd)/website"
        echo "示例目录: $(pwd)/二次开发示例"
        ;;
    *)
        echo "❌ 无效选择，退出"
        exit 1
        ;;
esac
