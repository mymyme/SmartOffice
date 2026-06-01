# SmartOffice

> The ultimate document, speed is everything.

[中文](README_CN.md)

A visual document editing platform built on [Monaco Editor](https://github.com/microsoft/monaco-editor) (the editor that powers VS Code). It integrates AI-powered content generation, real-time code editing, document rendering, diagram visualization, user management, and version control into a unified workspace.

## Features

- **Visual Document Editor** -- WYSIWYG editing with real-time preview
- **Monaco Editor Integration** -- Full code editing with syntax highlighting for 20+ languages
- **AI Assistant** -- AI-powered content generation and editing via OpenAI-compatible APIs
- **Rich Content Rendering** -- Markdown, Mermaid diagrams, Draw.io, and ECharts charts
- **User System** -- Registration, login, profile management, and role-based access control
- **Admin Dashboard** -- User management, system monitoring, and configuration
- **Image Management** -- Upload, resize, and embed images in documents
- **Code Versioning** -- Track and manage document/code revisions with history
- **Word Export** -- Export documents to DOCX format

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Editor Core** | Monaco Editor 0.55+ |
| **Backend** | Node.js, Express.js |
| **Database** | MySQL 8.0 |
| **Authentication** | JWT (Access + Refresh tokens) |
| **File Upload** | Multer + Sharp (image processing) |
| **AI Integration** | OpenAI API-compatible proxy (supports Azure, DeepSeek, Ollama, etc.) |
| **Frontend** | Vanilla JS + Modular CSS |
| **Containerization** | Docker Compose (MySQL) |

## Architecture

```text
┌──────────────────────────────────────────────────────────┐
│                     Browser (Port 3005)                  │
│  ┌─────────────────────┐ ┌──────────┐ ┌──────────────┐  │
│  │   Monaco Editor     │ │ AI Chat  │ │ Admin / User │  │
│  │  (VS Code Engine)   │ │          │ │    Portal    │  │
│  └──────────┬──────────┘ └────┬─────┘ └──────┬───────┘  │
└─────────────┼─────────────────┼──────────────┼──────────┘
              │                 │              │
              ▼                 ▼              ▼
┌──────────────────────────────────────────────────────────┐
│                 Frontend Server (:3005)                  │
│            Static files + Upload proxy                  │
└────────────────────────┬─────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────┐
│                  Backend API (:3006)                      │
│  ┌─────────┐ ┌────────┐ ┌──────────┐ ┌───────────┐     │
│  │  Auth   │ │  User  │ │  Admin   │ │  Images   │     │
│  └─────────┘ └────────┘ └──────────┘ └───────────┘     │
│  ┌─────────────┐ ┌──────────────────┐                   │
│  │Conversations│ │ Code Versions    │                   │
│  └─────────────┘ └──────────────────┘                   │
└────────────────────────┬─────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────┐
│                   MySQL 8.0 (:3307)                      │
│    users │ sessions │ ai_conversations │ code_versions   │
└──────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│                  AI Proxy (:3008)                        │
│      Translates OpenAI-format requests to any            │
│      compatible backend (OpenAI / Azure / DeepSeek)      │
└──────────────────────────────────────────────────────────┘
```

## Quick Start

### Prerequisites

- Node.js >= 18
- npm
- Docker & Docker Compose
- MySQL client (for importing `database/setup.sql`)

### 1. Clone

```bash
git clone <your-repo-url> smartoffice
cd smartoffice
```

### 2. Install Dependencies

```bash
cd backend && npm install
cd ../frontend && npm install
cd ..
```

### 3. Required Configuration

The following configurations **must** be set before starting. There are no hardcoded defaults.

#### 3.1 Backend Environment Variables

```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env` — **every value must be configured**:

```env
# ---- Required ----
PORT=3006                                    # Backend port
DB_HOST=localhost                            # Database host
DB_PORT=3307                                 # Database port
DB_USER=your_db_user                         # Must match MYSQL_USER in docker-compose
DB_PASSWORD=your_db_password                 # Must match MYSQL_PASSWORD in docker-compose
DB_NAME=monaco_editor_db                     # Database name
JWT_SECRET=generate-a-random-string          # e.g. openssl rand -hex 32
CORS_ORIGIN=http://localhost:3005,http://localhost:3006

# ---- Optional ----
DB_DATA_DIR=/path/to/your/db/data            # Database storage path
JWT_EXPIRES_IN=24h                           # Access token TTL
JWT_REFRESH_EXPIRES_IN=7d                    # Refresh token TTL
UPLOAD_DIR=../uploads                        # Upload directory
MAX_FILE_SIZE=2097152                        # Max upload size (bytes)
AVATAR_DIR=../uploads/avatars                # Avatar directory
RATE_LIMIT_WINDOW_MS=60000                   # Rate limit window (ms)
RATE_LIMIT_MAX_REQUESTS=100                  # Max requests per window
LOGIN_MAX_ATTEMPTS=5                         # Max login attempts
LOGIN_LOCK_TIME_MINUTES=30                   # Account lockout duration (min)
LOG_LEVEL=info                               # Log level
```

`database/config.js` contains no fallback values — all database parameters are read strictly from `backend/.env`.

#### 3.2 MySQL Docker Configuration

```bash
cp docker-compose.mysql.example.yml docker-compose.mysql.yml
```

Edit `docker-compose.mysql.yml` and replace these placeholders:

| Placeholder | Description |
|-------------|-------------|
| `your_root_password` | MySQL root password |
| `your_db_user` | Application database user (must match `DB_USER` in `.env`) |
| `your_db_password` | Application database password (must match `DB_PASSWORD` in `.env`) |
| `./mysql_data` | Data persistence path — change to your actual path |

#### 3.3 AI Model Configuration

Edit `frontend/demos/visual-editor/assets/js/config/constants.js`:

```js
// Choose mode: 'dify' or 'openai' (recommended: openai)
window.AI_API_TYPE = 'openai';
window.OPENAI_API_KEY = 'your-api-key';
window.OPENAI_MODEL = 'gpt-4o';  // your model name
```

Or set at runtime in HTML:
```html
<script>
  window.AI_API_TYPE = 'openai';
  window.OPENAI_API_KEY = 'your-api-key';
  window.OPENAI_MODEL = 'gpt-4o';
</script>
```

### 4. Start Database

```bash
docker compose -f docker-compose.mysql.yml up -d
```

### 5. Initialize Database

```bash
mysql -u root -p -h 127.0.0.1 -P 3307 < database/setup.sql
cd backend && npm run init-db
```

### 6. Start Services

**Option A: Separate terminals**

```bash
# Terminal 1 - Backend
cd backend && npm start

# Terminal 2 - Frontend
cd frontend/services && node server.js
```

**Option B: Background via script**

```bash
bash start-services.sh
```

### Access Points

| Service | URL |
|---------|-----|
| Frontend Home | `http://localhost:3005` |
| Login Page | `http://localhost:3005/demos/visual-editor/login.html` |
| Admin Dashboard | `http://localhost:3005/demos/visual-editor/admin.html` |
| User Profile | `http://localhost:3005/demos/visual-editor/profile.html` |
| Backend Health | `http://localhost:3006/health` |
| AI Proxy | `http://localhost:3008/api/chat` |

### Default Admin

| Field | Value |
|-------|-------|
| Username | `admin` |
| Password | `Ad123456` |
| Email | `admin@monaco-editor.local` |

> Change the password immediately after first login.

---

## AI Model Configuration

SmartOffice supports two AI integration modes. Choose the one that fits your setup.

### Mode Overview

| Mode | `AI_API_TYPE` | How It Works | Best For |
|------|---------------|--------------|----------|
| **Dify** | `dify` | Direct calls to a Dify-compatible API endpoint | Existing Dify deployments |
| **OpenAI** | `openai` | Routes through `ai-proxy.js` (:3008) to any OpenAI-compatible API | OpenAI, Azure, DeepSeek, Ollama, vLLM, etc. |

> For most users we recommend **OpenAI mode** -- it supports the widest range of providers.

### Configuration File

All AI settings are in:

```
frontend/demos/visual-editor/assets/js/config/constants.js
```

Key variables:

```js
// Switch between 'dify' and 'openai'
const AI_API_TYPE = window.AI_API_TYPE || 'dify';

// --- Dify Mode ---
const DIFY_API_URL = window.DIFY_API_URL || 'http://localhost:5000/v1';
const DIFY_API_KEY = window.DIFY_API_KEY || '';

// --- OpenAI Mode (routed through ai-proxy.js) ---
const OPENAI_API_URL = window.OPENAI_API_URL || 'http://localhost:3008/api/chat';
const OPENAI_API_KEY = window.OPENAI_API_KEY || '';
const OPENAI_MODEL = window.OPENAI_MODEL || 'gpt-4o';
```

You can override any value at runtime by setting `window.*` globals before the app loads, e.g. in your HTML:

```html
<script>
  window.AI_API_TYPE = 'openai';
  window.OPENAI_API_KEY = 'sk-your-key-here';
  window.OPENAI_MODEL = 'gpt-4o';
</script>
```

### Option A: OpenAI Mode (Recommended)

This mode uses the built-in `ai-proxy.js` (port 3008) as a bridge to any OpenAI-compatible API.

#### Step 1: Start the AI Proxy

```bash
cd frontend/services
node ai-proxy.js
```

The proxy starts on `http://localhost:3008`.

#### Step 2: Configure Provider Credentials

Edit `constants.js` or set globals:

```js
window.AI_API_TYPE = 'openai';
window.OPENAI_API_KEY = 'sk-your-api-key-here';
window.OPENAI_MODEL = 'gpt-4o';
```

#### Step 3: Verify

Open `http://localhost:3005`, open the AI chat panel, and send a test message. You should receive a response from your configured model.

### Option B: Dify Mode

If you have an existing Dify deployment:

```js
window.AI_API_TYPE = 'dify';
window.DIFY_API_URL = 'https://your-dify-instance.example.com/v1';
window.DIFY_API_KEY = 'app-your-dify-app-key';
```

The app calls `${DIFY_API_URL}/chat-messages` directly with Bearer token authentication. No proxy needed.

### Troubleshooting

| Symptom | Check |
|---------|-------|
| "Failed to fetch" in chat | Is `ai-proxy.js` running on port 3008? Check `node frontend/services/ai-proxy.js` |
| 401 Unauthorized | Verify your API key is correct and has not expired |
| 404 Not Found | Check the model name (e.g., `gpt-4o`, not `gpt4`) |
| CORS error | The proxy adds CORS headers; ensure requests go through port 3008 |
| Connection refused to localhost:11434 (Ollama) | Start Ollama: `ollama serve` |
| Slow responses | Large documents may take longer; check your model's rate limits |

### Architecture of the AI Proxy

The proxy (`ai-proxy.js`) serves as a protocol translator:

1. Browser sends an OpenAI-format request to `http://localhost:3008/api/chat`
2. Proxy reads `apiUrl`, `apiType`, `apiKey`, `model` from the request body
3. Proxy forwards to the real provider, translating headers as needed:
   - OpenAI/DeepSeek: `Authorization: Bearer <key>`
   - Azure: `api-key: <key>`
4. Response streams back to the browser through the proxy

This design allows switching AI providers without modifying frontend code.

---

## API Endpoints

| Prefix | Description |
|--------|-------------|
| `/api/auth/*` | Login, register, logout, token refresh |
| `/api/user/*` | Profile, avatar management |
| `/api/admin/*` | Admin dashboard, user management |
| `/api/images/*` | Image upload, list, delete |
| `/api/conversations/*` | AI conversation history |
| `/api/code-versions/*` | Code version tracking |

## Project Structure

```text
smartoffice/
├── backend/
│   ├── config/          # Database & JWT configuration
│   ├── controllers/     # Route handlers
│   ├── middleware/       # Auth, admin, validation middleware
│   ├── models/          # User & Session models
│   ├── routes/          # Express route definitions
│   ├── utils/           # Utility functions
│   └── server.js        # Backend entry point (:3006)
├── frontend/
│   ├── demos/visual-editor/  # Main application
│   │   ├── assets/
│   │   │   ├── css/     # Modular stylesheets
│   │   │   ├── js/
│   │   │   │   ├── config/constants.js  # AI & API configuration
│   │   │   │   └── modules/   # JS modules (auth, editor, chat, etc.)
│   │   │   └── libs/    # Mermaid, Draw.io viewer, etc.
│   │   ├── index.html   # Editor homepage
│   │   ├── admin.html   # Admin dashboard
│   │   ├── login.html   # Login page
│   │   └── profile.html # User profile
│   └── services/
│       ├── server.js    # Frontend static server (:3005)
│       ├── ai-proxy.js  # AI API proxy (:3008)
│       └── website-server.js
├── database/
│   ├── setup.sql        # Database schema + seed data
│   └── migrations/      # Schema migration scripts
├── start-services.sh    # Start frontend + backend
├── stop-services.sh     # Stop all services
├── start-backend.sh     # Start backend only
└── docker-compose.mysql.yml  # MySQL container (local only, gitignored)
```

## Security

- All secrets managed via environment variables (`.env` files are gitignored)
- JWT-based authentication with access/refresh token rotation
- Password hashing with bcryptjs
- Rate limiting on authentication endpoints
- Account lockout after repeated failed login attempts
- CORS whitelist configuration
- Helmet.js security headers
- Input validation via express-validator

## License

MIT
