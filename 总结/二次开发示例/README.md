# Monaco Editor 二次开发示例

这是一个基于 Monaco Editor 的二次开发示例项目，展示了如何快速开始开发。

## 快速开始

### 1. 环境准备
```bash
# 确保在项目根目录
cd /media/storage/project/aicode

# 安装依赖
cd website
npm install --legacy-peer-deps
```

### 2. 开发模式
```bash
# 启动开发服务器
npm run dev

# 访问 http://localhost:3007
```

### 3. 生产构建
```bash
# 构建生产版本
npx webpack --config webpack-simple.config.ts --mode production

# 启动生产服务器
cd ..
node website-server.js

# 访问 http://localhost:3006
```

## 示例功能

### 1. 基础编辑器
- 多语言支持
- 主题切换
- 代码高亮
- 自动补全

### 2. 高级功能
- 代码格式化
- 错误检查
- 代码折叠
- 搜索替换

### 3. 自定义扩展
- 自定义语言
- 自定义主题
- 自定义快捷键
- 自定义补全

## 开发指南

详细开发指南请参考：`/media/storage/project/总结/Monaco_Editor_二次开发指南.md`

## 项目结构

```
二次开发示例/
├── README.md              # 本文件
├── 基础示例/              # 基础功能示例
├── 高级示例/              # 高级功能示例
└── 自定义扩展/            # 自定义功能示例
```
