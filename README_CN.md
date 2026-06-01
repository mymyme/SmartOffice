# SmartOffice

> 天下文档，唯快不破。

[English](README.md)

基于 [Monaco Editor](https://github.com/microsoft/monaco-editor)（VS Code 核心编辑器）二次开发的在线可视化文档编辑平台。集成了 AI 对话生成、代码编辑、文档渲染、图表绘制、用户管理和版本控制能力。

## 功能特性

- **可视化文档编辑** -- 所见即所得的编辑体验，实时预览
- **Monaco Editor 集成** -- 支持 20+ 种编程语言的代码编辑与语法高亮
- **AI 助手** -- 通过 OpenAI 兼容 API 接入大模型，进行内容生成与编辑
- **丰富的内容渲染** -- Markdown、Mermaid 图表、Draw.io、ECharts 可视化
- **用户系统** -- 注册、登录、个人中心、基于角色的权限控制
- **管理后台** -- 用户管理、系统监控与配置
- **图片管理** -- 上传、缩放、嵌入文档
- **代码版本管理** -- 追踪和管理文档/代码的历史版本
- **Word 导出** -- 将文档导出为 DOCX 格式

## 技术栈

| 层级 | 技术 |
|------|------|
| **编辑器核心** | Monaco Editor 0.55+ |
| **后端** | Node.js, Express.js |
| **数据库** | MySQL 8.0 |
| **认证** | JWT（Access + Refresh 令牌） |
| **文件上传** | Multer + Sharp（图片处理） |
| **AI 集成** | OpenAI API 兼容代理（支持 Azure、DeepSeek、Ollama 等） |
| **前端** | 原生 JS + 模块化 CSS |
| **容器化** | Docker Compose（MySQL） |

## 系统架构

```text
┌──────────────────────────────────────────────────────────┐
│                     浏览器 (端口 3005)                    │
│  ┌─────────────────────┐ ┌──────────┐ ┌──────────────┐  │
│  │   Monaco Editor     │ │ AI 对话  │ │ 管理/用户    │  │
│  │  (VS Code 编辑器)   │ │          │ │    后台      │  │
│  └──────────┬──────────┘ └────┬─────┘ └──────┬───────┘  │
└─────────────┼─────────────────┼──────────────┼──────────┘
              │                 │              │
              ▼                 ▼              ▼
┌──────────────────────────────────────────────────────────┐
│                 前端服务器 (:3005)                        │
│             静态文件 + 上传代理                          │
└────────────────────────┬─────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────┐
│                  后端 API (:3006)                         │
│  ┌─────────┐ ┌────────┐ ┌──────────┐ ┌───────────┐     │
│  │  认证   │ │  用户  │ │  管理员  │ │  图片     │     │
│  └─────────┘ └────────┘ └──────────┘ └───────────┘     │
│  ┌─────────────┐ ┌──────────────────┐                   │
│  │ AI 对话记录 │ │  代码版本管理    │                   │
│  └─────────────┘ └──────────────────┘                   │
└────────────────────────┬─────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────┐
│                    MySQL 8.0 (:3307)                     │
│     users │ sessions │ ai_conversations │ code_versions  │
└──────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│                   AI 代理 (:3008)                        │
│      将 OpenAI 格式请求转发到任意兼容后端                │
│      (OpenAI / Azure / DeepSeek / Ollama 等)             │
└──────────────────────────────────────────────────────────┘
```

## 快速开始

### 环境要求

- Node.js >= 18
- npm
- Docker 与 Docker Compose
- MySQL 客户端工具

### 1. 克隆项目

```bash
git clone <your-repo-url> smartoffice
cd smartoffice
```

### 2. 安装依赖

```bash
cd backend && npm install
cd ../frontend && npm install
cd ..
```

### 3. 必改配置

项目启动前，以下配置**必须修改**，没有任何默认兜底值。

#### 3.1 后端环境变量

```bash
cp backend/.env.example backend/.env
```

编辑 `backend/.env`，**每项都必须填写**：

```env
# ---- 必须修改 ----
PORT=3006                                    # 后端端口
DB_HOST=localhost                            # 数据库地址
DB_PORT=3307                                 # 数据库端口
DB_USER=你的数据库用户名                       # 对应 docker-compose 中的 MYSQL_USER
DB_PASSWORD=你的数据库密码                     # 对应 docker-compose 中的 MYSQL_PASSWORD
DB_NAME=monaco_editor_db                     # 数据库名称
JWT_SECRET=生成一个随机字符串作为JWT密钥          # 示例: openssl rand -hex 32
CORS_ORIGIN=http://localhost:3005,http://localhost:3006

# ---- 可选修改 ----
DB_DATA_DIR=/path/to/your/db/data            # 数据库存储目录
JWT_EXPIRES_IN=24h                           # Access Token 有效期
JWT_REFRESH_EXPIRES_IN=7d                    # Refresh Token 有效期
UPLOAD_DIR=../uploads                        # 上传目录
MAX_FILE_SIZE=2097152                        # 上传文件大小限制(字节)
AVATAR_DIR=../uploads/avatars                # 头像目录
RATE_LIMIT_WINDOW_MS=60000                   # 限流窗口(毫秒)
RATE_LIMIT_MAX_REQUESTS=100                  # 限流最大请求数
LOGIN_MAX_ATTEMPTS=5                         # 最大登录尝试次数
LOGIN_LOCK_TIME_MINUTES=30                   # 账户锁定时间(分钟)
LOG_LEVEL=info                               # 日志级别
```

`database/config.js` 不再包含任何兜底值，所有数据库连接参数均从 `backend/.env` 读取。

#### 3.2 MySQL Docker 配置

```bash
cp docker-compose.mysql.example.yml docker-compose.mysql.yml
```

编辑 `docker-compose.mysql.yml`，修改以下占位符：

| 占位符 | 说明 |
|--------|------|
| `your_root_password` | MySQL root 密码 |
| `your_db_user` | 应用数据库用户名（与 `.env` 中 `DB_USER` 一致） |
| `your_db_password` | 应用数据库密码（与 `.env` 中 `DB_PASSWORD` 一致） |
| `./mysql_data` | 数据持久化目录，可改为你的实际路径 |

#### 3.3 AI 模型配置

编辑 `frontend/demos/visual-editor/assets/js/config/constants.js`：

```js
// 选择模式: 'dify' 或 'openai' (推荐 openai)
window.AI_API_TYPE = 'openai';
window.OPENAI_API_KEY = '你的API密钥';
window.OPENAI_MODEL = 'gpt-4o';  // 你的模型名
```

或者运行时在 HTML 中设置：
```html
<script>
  window.AI_API_TYPE = 'openai';
  window.OPENAI_API_KEY = '你的API密钥';
  window.OPENAI_MODEL = 'gpt-4o';
</script>
```

### 4. 启动数据库

```bash
docker compose -f docker-compose.mysql.yml up -d
```

### 5. 初始化数据库

```bash
mysql -u root -p -h 127.0.0.1 -P 3307 < database/setup.sql
cd backend && npm run init-db
```

### 6. 启动服务

**方式一：分别启动**

```bash
# 终端 1 - 后端
cd backend && npm start

# 终端 2 - 前端
cd frontend/services && node server.js
```

**方式二：脚本后台启动**

```bash
bash start-services.sh
```

### 访问地址

| 服务 | 地址 |
|------|------|
| 前端首页 | `http://localhost:3005` |
| 登录页 | `http://localhost:3005/demos/visual-editor/login.html` |
| 管理后台 | `http://localhost:3005/demos/visual-editor/admin.html` |
| 个人中心 | `http://localhost:3005/demos/visual-editor/profile.html` |
| 后端健康检查 | `http://localhost:3006/health` |
| AI 代理 | `http://localhost:3008/api/chat` |

### 默认管理员

| 字段 | 值 |
|------|-----|
| 用户名 | `admin` |
| 密码 | `Ad123456` |
| 邮箱 | `admin@monaco-editor.local` |

> 首次登录后请立即修改密码。

---

## 大模型 API 配置

SmartOffice 支持两种 AI 集成模式，可根据你的实际情况选择。

### 两种模式对比

| 模式 | `AI_API_TYPE` | 工作原理 | 适用场景 |
|------|---------------|----------|----------|
| **Dify** | `dify` | 直接调用 Dify 兼容的 API 端点 | 已有 Dify 部署 |
| **OpenAI** | `openai` | 通过 `ai-proxy.js` (:3008) 转发到任意 OpenAI 兼容接口 | OpenAI、Azure、DeepSeek、Ollama、vLLM 等 |

> 推荐大多数用户使用 **OpenAI 模式** -- 支持的厂商范围最广。

### 配置文件位置

所有 AI 相关配置在：

```
frontend/demos/visual-editor/assets/js/config/constants.js
```

核心变量：

```js
// 切换模式：'dify' 或 'openai'
const AI_API_TYPE = window.AI_API_TYPE || 'dify';

// --- Dify 模式 ---
const DIFY_API_URL = window.DIFY_API_URL || 'http://localhost:5000/v1';
const DIFY_API_KEY = window.DIFY_API_KEY || '';

// --- OpenAI 模式（通过 ai-proxy.js 转发） ---
const OPENAI_API_URL = window.OPENAI_API_URL || 'http://localhost:3008/api/chat';
const OPENAI_API_KEY = window.OPENAI_API_KEY || '';
const OPENAI_MODEL = window.OPENAI_MODEL || 'gpt-4o';
```

你也可以在 HTML 中通过 `window.*` 全局变量在运行时覆盖这些值：

```html
<script>
  window.AI_API_TYPE = 'openai';
  window.OPENAI_API_KEY = 'sk-你的密钥';
  window.OPENAI_MODEL = 'gpt-4o';
</script>
```

### 方式 A：OpenAI 模式（推荐）

此模式使用内置的 `ai-proxy.js`（端口 3008）作为桥接层，将请求转发到任意兼容 OpenAI API 的服务。

#### 第一步：启动 AI 代理

```bash
cd frontend/services
node ai-proxy.js
```

代理启动在 `http://localhost:3008`。

#### 第二步：配置供应商密钥

编辑 `constants.js` 或设置全局变量：

```js
window.AI_API_TYPE = 'openai';
window.OPENAI_API_KEY = 'sk-你的密钥';
window.OPENAI_MODEL = 'gpt-4o';
```

#### 第三步：验证

打开 `http://localhost:3005`，进入 AI 对话面板，发送一条测试消息，应该能收到模型的回复。

### 方式 B：Dify 模式

如果你已有 Dify 部署：

```js
window.AI_API_TYPE = 'dify';
window.DIFY_API_URL = 'https://你的dify实例地址/v1';
window.DIFY_API_KEY = 'app-你的dify应用密钥';
```

应用会直接调用 `${DIFY_API_URL}/chat-messages`，使用 Bearer Token 认证，无需启动代理。

### 常见问题排查

| 现象 | 检查项 |
|------|--------|
| 对话提示"Failed to fetch" | `ai-proxy.js` 是否在 3008 端口运行？执行 `node frontend/services/ai-proxy.js` |
| 401 Unauthorized | 检查 API 密钥是否正确且未过期 |
| 404 Not Found | 检查模型名称是否正确（例如应为 `gpt-4o` 而非 `gpt4`） |
| CORS 跨域报错 | 代理会自动添加 CORS 头，确保请求经过端口 3008 |
| 连接 localhost:11434 被拒绝 | Ollama 未启动，执行 `ollama serve` |
| 响应速度慢 | 大文档可能需要更长时间；检查模型的速率限制 |
| 中文回答是乱码 | 检查代理是否正确传递了 UTF-8 编码的响应 |
| 代理报错"Missing required parameters" | 请求体中缺少 `apiUrl`、`apiKey` 或 `model` 字段 |

### AI 代理工作原理

代理 (`ai-proxy.js`) 充当协议转换层：

1. 浏览器发送 OpenAI 格式的请求到 `http://localhost:3008/api/chat`
2. 代理从请求体中读取 `apiUrl`（目标 API 地址）、`apiType`（认证方式）、`apiKey`（密钥）、`model`（模型名）
3. 代理将请求转发给实际的 AI 服务商，按需转换请求头：
   - OpenAI / DeepSeek / 通义千问 / Moonshot 等：`Authorization: Bearer <key>`
   - Azure：`api-key: <key>`
4. 响应通过代理流式返回浏览器

这种设计让你可以在不修改前端代码的情况下切换 AI 供应商。

---

## API 接口

| 前缀 | 说明 |
|------|------|
| `/api/auth/*` | 登录、注册、登出、刷新令牌 |
| `/api/user/*` | 用户信息、头像管理 |
| `/api/admin/*` | 管理后台、用户管理 |
| `/api/images/*` | 图片上传、列表、删除 |
| `/api/conversations/*` | AI 对话历史记录 |
| `/api/code-versions/*` | 代码版本追踪 |

## 项目结构

```text
smartoffice/
├── backend/
│   ├── config/          # 数据库与 JWT 配置
│   ├── controllers/     # 路由处理器
│   ├── middleware/       # 认证、管理员、验证中间件
│   ├── models/          # User 与 Session 数据模型
│   ├── routes/          # Express 路由定义
│   ├── utils/           # 工具函数
│   └── server.js        # 后端入口 (:3006)
├── frontend/
│   ├── demos/visual-editor/  # 主应用
│   │   ├── assets/
│   │   │   ├── css/     # 模块化样式表
│   │   │   ├── js/
│   │   │   │   ├── config/constants.js  # AI 与 API 配置文件
│   │   │   │   └── modules/   # JS 模块 (auth, editor, chat 等)
│   │   │   └── libs/    # Mermaid, Draw.io viewer 等
│   │   ├── index.html   # 编辑器首页
│   │   ├── admin.html   # 管理后台
│   │   ├── login.html   # 登录页
│   │   └── profile.html # 个人中心
│   └── services/
│       ├── server.js    # 前端静态服务器 (:3005)
│       ├── ai-proxy.js  # AI API 代理 (:3008)
│       └── website-server.js
├── database/
│   ├── setup.sql        # 数据库模式 + 种子数据
│   └── migrations/      # 模式迁移脚本
├── start-services.sh    # 一键启动前后端
├── stop-services.sh     # 停止所有服务
├── start-backend.sh     # 单独启动后端
└── docker-compose.mysql.yml  # MySQL 容器 (仅本地使用，已 gitignore)
```

## 安全措施

- 所有密钥通过环境变量管理（`.env` 文件已加入 gitignore）
- 基于 JWT 的认证机制，支持 Access/Refresh 令牌轮换
- 密码使用 bcryptjs 哈希存储
- 认证接口限流保护
- 多次登录失败后账户锁定
- CORS 白名单配置
- Helmet.js 安全响应头
- express-validator 输入校验

## 许可证

MIT
