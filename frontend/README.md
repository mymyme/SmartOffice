# Monaco Editor 前端项目

## 项目结构

```
frontend/
├── demos/                    # 演示页面
│   ├── demo.html            # 基础演示页面
│   └── ai-demo.html         # AI 代码补全演示
├── static/                  # 静态资源
├── assets/                  # 资源文件
├── config/                  # 配置文件
├── scripts/                 # 脚本文件
│   └── start.sh            # 启动脚本
├── services/                # 服务文件
│   ├── server.js           # 基础服务器
│   └── website-server.js   # 网站服务器
├── package.json            # 项目配置
└── README.md              # 说明文档
```

## 快速开始

### 1. 启动基础服务器
```bash
# 在项目根目录
npm start

# 或直接运行
node server.js
```

### 2. 启动网站服务器
```bash
# 在 frontend 目录
npm run start:website
```

### 3. 启动开发服务器
```bash
# 在 frontend 目录
npm run dev
```

## 访问地址

- **基础演示**: http://localhost:3005/
- **AI 演示**: http://localhost:3005/ai
- **网站服务**: http://localhost:3006

## 功能特性

### 基础演示页面 (`demos/demo.html`)
- 多语言支持
- 主题切换
- 代码格式化
- 基础编辑器功能

### AI 演示页面 (`demos/ai-demo.html`)
- AI 代码补全
- 支持多种 API 类型
- 代码生成和优化
- 第三方 API 集成

## 开发指南

### 添加新的演示页面
1. 在 `demos/` 目录创建 HTML 文件
2. 在 `server.js` 中添加路由
3. 更新文档

### 添加静态资源
1. 将资源文件放入 `static/` 目录
2. 通过 `/static/` 路径访问

### 自定义配置
1. 在 `config/` 目录添加配置文件
2. 在服务中引用配置

## 部署说明

### 生产环境
```bash
# 构建网站
npm run build

# 启动生产服务器
npm run start:website
```

### 静态部署
```bash
# 构建静态文件
npm run build

# 将 dist/ 目录部署到静态服务器
```

## 注意事项

- 所有前端文件都放在 `frontend/` 目录下
- 演示页面放在 `demos/` 子目录
- 静态资源放在 `static/` 子目录
- 服务文件放在 `services/` 子目录

