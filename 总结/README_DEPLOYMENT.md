# Monaco Editor 部署指南

## 项目概述

本项目在 `/media/storage/project/aicode` 目录下部署了 Microsoft Monaco Editor，这是一个基于 VS Code 的浏览器代码编辑器。

## 文件结构

```
/media/storage/project/aicode/
├── demo.html              # 演示页面
├── server.js              # HTTP 服务器
├── start.sh               # 启动脚本
├── README_DEPLOYMENT.md   # 部署说明
└── [Monaco Editor 源码文件...]
```

## 快速开始

### 方法一：使用启动脚本（推荐）

```bash
cd /media/storage/project/aicode
./start.sh
```

### 方法二：直接启动服务器

```bash
cd /media/storage/project/aicode
node server.js
```

### 方法三：使用 npm 脚本

```bash
cd /media/storage/project/aicode
npm run simpleserver
```

## 访问地址

启动服务器后，可以通过以下地址访问：

- **主页**: http://localhost:3000
- **演示页面**: http://localhost:3000/demo.html

## 功能特性

### 演示页面功能

1. **多语言支持**
   - JavaScript, TypeScript, Python, Java, C#, C++
   - HTML, CSS, JSON, XML, SQL, YAML

2. **主题切换**
   - 浅色主题 (vs)
   - 深色主题 (vs-dark)
   - 高对比度主题 (hc-black)

3. **编辑器功能**
   - 语法高亮
   - 自动补全
   - 错误检查
   - 代码格式化
   - 小地图
   - 行号显示
   - 代码折叠

4. **交互控制**
   - 格式化代码
   - 获取/设置代码
   - 切换小地图
   - 切换行号

## 技术实现

### 前端技术
- **Monaco Editor**: 使用 CDN 版本 (v0.54.0)
- **HTML5**: 现代化页面结构
- **CSS3**: 响应式设计和美观界面
- **JavaScript**: 原生 JS 实现交互功能

### 后端技术
- **Node.js**: HTTP 服务器
- **原生模块**: fs, http, path, url

## 配置说明

### 服务器配置
- **端口**: 3000 (可在 server.js 中修改)
- **根目录**: 当前项目目录
- **默认页面**: demo.html
- **MIME 类型**: 支持常见文件类型

### 编辑器配置
- **字体**: Consolas, "Courier New", monospace
- **字体大小**: 14px
- **自动布局**: 启用
- **鼠标滚轮缩放**: 启用
- **空白字符显示**: 选中时显示

## 故障排除

### 常见问题

1. **端口被占用**
   ```bash
   # 查看端口占用
   lsof -i :3000
   
   # 杀死占用进程
   kill -9 <PID>
   ```

2. **Node.js 版本问题**
   ```bash
   # 检查 Node.js 版本
   node --version
   
   # 建议使用 Node.js 16+ 版本
   ```

3. **权限问题**
   ```bash
   # 给启动脚本添加执行权限
   chmod +x start.sh
   ```

### 日志信息

服务器启动时会显示以下信息：
- Node.js 和 npm 版本
- 服务目录路径
- 访问地址
- 停止服务器的方法

## 开发说明

### 修改演示页面
编辑 `demo.html` 文件，可以：
- 修改默认代码
- 添加新的编程语言
- 自定义主题
- 调整编辑器配置

### 修改服务器配置
编辑 `server.js` 文件，可以：
- 修改端口号
- 添加新的路由
- 修改 MIME 类型
- 添加中间件

### 添加新功能
1. 在 `demo.html` 中添加新的控制按钮
2. 在 JavaScript 中实现对应的功能函数
3. 使用 Monaco Editor API 实现编辑器功能

## 参考资料

- [Monaco Editor 官方文档](https://microsoft.github.io/monaco-editor/)
- [Monaco Editor GitHub](https://github.com/microsoft/monaco-editor)
- [Monaco Editor API 文档](https://microsoft.github.io/monaco-editor/api/index.html)

## 许可证

MIT License - 与 Monaco Editor 保持一致
