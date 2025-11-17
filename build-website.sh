#!/bin/bash

echo "🚀 构建 Monaco Editor 网站..."

# 检查 Node.js 版本
echo "📋 检查环境..."
node --version
npm --version

# 进入网站目录
cd /media/storage/project/aicode/website

echo "📦 安装依赖..."
npm install --legacy-peer-deps

echo "🔧 创建必要的目录..."
mkdir -p typedoc/dist

echo "📝 创建简化的 typedoc 配置..."
cat > typedoc/tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "es5",
    "lib": ["dom", "dom.iterable", "es6"],
    "allowJs": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx"
  },
  "include": [
    "src/**/*"
  ],
  "exclude": [
    "node_modules",
    "dist"
  ]
}
EOF

echo "🏗️ 构建网站..."
npm run build-webpack

echo "✅ 构建完成！"
echo "📁 构建文件位于: /media/storage/project/aicode/website/dist"
echo "🌐 可以通过 HTTP 服务器访问构建后的文件"

