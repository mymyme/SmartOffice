# Monaco Editor 项目

基于 Microsoft Monaco Editor 的代码编辑器项目，提供完整的代码编辑、AI 代码补全等功能。

## 🚀 快速开始

### 启动项目
```bash
# 使用启动脚本（推荐）
./start.sh

# 或直接启动基础服务器
node server.js
```

### 访问地址
- **基础演示**: http://localhost:3005/
- **AI 演示**: http://localhost:3005/ai
- **网站服务**: http://localhost:3006
- **开发环境**: http://localhost:3007

## 📁 项目结构

```
aicode/
├── frontend/                    # 前端项目
│   ├── demos/                  # 演示页面
│   │   ├── demo.html          # 基础演示页面
│   │   └── ai-demo.html       # AI 代码补全演示
│   ├── static/                 # 静态资源
│   ├── services/               # 服务文件
│   │   ├── server.js          # 基础服务器
│   │   └── website-server.js  # 网站服务器
│   ├── scripts/                # 脚本文件
│   │   └── start.sh           # 启动脚本
│   └── package.json           # 前端项目配置
├── website/                    # 网站项目（Monaco Editor 官方）
├── src/                        # Monaco Editor 核心源码
├── 总结/                       # 文档和示例
│   ├── 二次开发示例/           # 开发示例
│   ├── 服务接口总结.md         # API 文档
│   ├── AI集成总结.md          # AI 功能文档
│   └── 第三方API配置示例.md   # 第三方 API 文档
├── server.js                   # 根目录服务器（重定向）
├── start.sh                    # 项目启动脚本
└── 项目结构说明.md            # 项目结构说明
```

## 🎯 主要功能

### 基础编辑器功能
- ✅ 多语言语法高亮
- ✅ 代码补全和参数提示
- ✅ 查找替换（支持正则表达式）
- ✅ 括号匹配和自动缩进
- ✅ 代码折叠和小地图
- ✅ 多种主题支持

### AI 增强功能
- 🤖 AI 代码补全
- 🤖 智能代码生成
- 🤖 代码解释和优化
- 🤖 支持多种 AI 模型
- 🤖 第三方 API 集成

## 🛠️ 开发指南

### 添加新的演示页面
1. 在 `frontend/demos/` 创建 HTML 文件
2. 在 `server.js` 中添加路由
3. 更新文档

### 集成 AI 功能
1. 参考 `总结/AI集成总结.md`
2. 查看 `总结/二次开发示例/自定义扩展/AI代码补全插件.ts`
3. 配置第三方 API

## 📚 文档

- [项目结构说明](项目结构说明.md)
- [服务接口总结](总结/服务接口总结.md)
- [AI 集成指南](总结/AI集成总结.md)
- [二次开发示例](总结/二次开发示例/)
- [第三方 API 配置](总结/第三方API配置示例.md)

## 🔧 技术栈

- **Monaco Editor**: v0.54.0
- **Node.js**: 18+
- **AI 集成**: OpenAI API / 第三方 API
- **前端**: HTML5, CSS3, JavaScript
- **构建工具**: Webpack, TypeScript

## 📋 端口分配

| 服务 | 端口 | 说明 |
|------|------|------|
| 基础服务器 | 3005 | 演示页面服务 |
| 网站服务器 | 3006 | Monaco Editor 官方网站 |
| 开发服务器 | 3007 | Webpack 开发服务器 |

## 🚀 启动方式

### 1. 使用启动脚本（推荐）
```bash
./start.sh
```
选择启动方式：
- 启动基础服务器
- 启动网站服务器
- 启动开发服务器
- 启动所有服务

### 2. 直接启动服务
```bash
# 基础服务器
node server.js

# 网站服务器
node frontend/services/website-server.js

# 开发服务器
cd website && npm run dev
```

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

[MIT](LICENSE.txt)

