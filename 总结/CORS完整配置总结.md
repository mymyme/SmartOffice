# CORS 完整配置总结

## 问题历史

### 问题1：公网FRP访问被拒绝
**错误**：从 `http://8.152.98.33:8300` 访问 `http://8.152.98.33:8301` 被CORS阻止

**原因**：CORS白名单未包含8300端口

**修复**：添加8300和8301到白名单

---

### 问题2：内网IP访问被拒绝
**错误**：从 `http://191.0.12.75:3005` 访问 `http://191.0.12.75:3006` 被CORS阻止

**原因**：CORS白名单未包含内网IP `191.0.12.75`

**修复**：添加内网IP到正则兜底策略

## 最终CORS配置

### 配置文件
`/media/storage/project/aicode/backend/server.js`

### 完整配置代码

```javascript
// CORS 配置
const defaultOrigins = [
    'http://localhost:3005',           // 本地前端开发
    'http://localhost:3006',           // 本地后端开发
    'http://8.152.98.33:8300',         // FRP公网前端
    'http://8.152.98.33:8301'          // FRP公网后端
];

const corsOptions = {
    origin: function (origin, callback) {
        // 1. 允许没有 origin 的请求（Postman、curl等工具）
        if (!origin) return callback(null, true);

        // 2. 从环境变量读取或使用默认白名单
        const allowedOrigins = process.env.CORS_ORIGIN
            ? process.env.CORS_ORIGIN.split(',').map(s => s.trim())
            : defaultOrigins;

        // 3. 检查是否在显式白名单中
        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            // 4. 正则兜底：允许公网IP和内网IP的所有端口
            if (origin.match(/^http:\/\/(8\.152\.98\.33|191\.0\.12\.75):\d+$/)) {
                callback(null, true);
            } else {
                console.warn('❌ CORS拒绝:', origin);
                callback(new Error('不允许的 CORS 源'));
            }
        }
    },
    credentials: true,                 // 允许携带Cookie
    optionsSuccessStatus: 200,         // 兼容旧版浏览器
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

app.use(cors(corsOptions));
```

## CORS 策略层级

### 第一层：无 Origin 豁免
```javascript
if (!origin) return callback(null, true);
```
**适用场景**：
- Postman、curl等API测试工具
- 移动应用原生请求
- 服务器端到服务器端的请求

### 第二层：显式白名单
```javascript
const defaultOrigins = [
    'http://localhost:3005',
    'http://localhost:3006',
    'http://8.152.98.33:8300',
    'http://8.152.98.33:8301'
];
```
**适用场景**：
- 本地开发环境
- FRP公网访问（指定端口）

### 第三层：正则兜底
```javascript
origin.match(/^http:\/\/(8\.152\.98\.33|191\.0\.12\.75):\d+$/)
```
**适用场景**：
- 公网IP的其他端口
- 内网IP的所有端口
- 动态端口场景

### 第四层：拒绝
```javascript
console.warn('❌ CORS拒绝:', origin);
callback(new Error('不允许的 CORS 源'));
```
**适用场景**：
- 其他未授权的域名和IP

## 支持的访问场景

| 访问方式 | Origin | 匹配策略 | 结果 |
|---------|--------|---------|------|
| 本地开发 | `http://localhost:3005` | 白名单 | ✅ 允许 |
| FRP公网 | `http://8.152.98.33:8300` | 白名单 | ✅ 允许 |
| FRP公网 | `http://8.152.98.33:8301` | 白名单 | ✅ 允许 |
| 内网访问 | `http://191.0.12.75:3005` | 正则兜底 | ✅ 允许 |
| 内网访问 | `http://191.0.12.75:3006` | 正则兜底 | ✅ 允许 |
| 公网其他端口 | `http://8.152.98.33:8888` | 正则兜底 | ✅ 允许 |
| API工具 | `null` / `undefined` | 无origin豁免 | ✅ 允许 |
| 其他域名 | `http://example.com` | 无匹配 | ❌ 拒绝 |

## 正则表达式说明

### 当前正则
```javascript
/^http:\/\/(8\.152\.98\.33|191\.0\.12\.75):\d+$/
```

### 匹配规则
- `^http:\/\/` - 必须以 `http://` 开头
- `(8\.152\.98\.33|191\.0\.12\.75)` - 匹配公网IP或内网IP
- `:\d+$` - 必须有端口号，且以端口号结尾

### 匹配示例
```
✅ http://8.152.98.33:8300
✅ http://8.152.98.33:8301
✅ http://8.152.98.33:3005
✅ http://191.0.12.75:3005
✅ http://191.0.12.75:3006
✅ http://191.0.12.75:8080
❌ http://8.152.98.33 (无端口)
❌ https://8.152.98.33:8300 (https)
❌ http://192.168.1.1:3005 (其他IP)
```

## 环境变量配置

### 通过 .env 文件
```bash
# backend/.env
CORS_ORIGIN=http://localhost:3005,http://8.152.98.33:8300,http://custom-domain.com
```

### 通过命令行
```bash
CORS_ORIGIN="http://localhost:3005,http://8.152.98.33:8300" npm start
```

### 通过环境变量
```bash
export CORS_ORIGIN="http://localhost:3005,http://8.152.98.33:8300"
npm start
```

## 调试 CORS 问题

### 1. 查看后端日志
```bash
tail -f /tmp/backend-server.log | grep CORS
```

被拒绝的请求会显示：
```
❌ CORS拒绝: http://unknown-domain.com:3000
```

### 2. 浏览器开发者工具
- 打开 F12
- 切换到 Network 标签
- 查找失败的请求
- 查看 Headers 中的 Origin 和响应头

### 3. 手动测试 CORS
```bash
# 测试 OPTIONS 预检请求
curl -X OPTIONS http://localhost:3006/api/admin/stats \
  -H "Origin: http://191.0.12.75:3005" \
  -H "Access-Control-Request-Method: GET" \
  -H "Access-Control-Request-Headers: Authorization,Content-Type" \
  -v
```

**期望响应头**：
```
Access-Control-Allow-Origin: http://191.0.12.75:3005
Access-Control-Allow-Methods: GET,POST,PUT,DELETE,OPTIONS
Access-Control-Allow-Headers: Content-Type,Authorization,X-Requested-With
Access-Control-Allow-Credentials: true
```

### 4. 检查实际 Origin
在浏览器控制台执行：
```javascript
console.log('当前 Origin:', window.location.origin);
console.log('当前 Hostname:', window.location.hostname);
console.log('当前 Port:', window.location.port);
```

## 所有访问场景

### 场景1：本地开发
```
前端: http://localhost:3005
后端: http://localhost:3006
Origin: http://localhost:3005
匹配: 白名单
```

### 场景2：FRP公网访问
```
前端: http://8.152.98.33:8300
后端: http://8.152.98.33:8301
Origin: http://8.152.98.33:8300
匹配: 白名单
```

### 场景3：内网IP访问
```
前端: http://191.0.12.75:3005
后端: http://191.0.12.75:3006
Origin: http://191.0.12.75:3005
匹配: 正则兜底
```

### 场景4：直接IP+原端口访问
```
前端: http://8.152.98.33:3005
后端: http://8.152.98.33:3006
Origin: http://8.152.98.33:3005
匹配: 正则兜底
```

## 生产环境建议

### 1. 使用反向代理
**推荐使用 Nginx**，统一处理CORS：

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    # 添加CORS头
    add_header Access-Control-Allow-Origin $http_origin always;
    add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always;
    add_header Access-Control-Allow-Headers "Content-Type, Authorization" always;
    add_header Access-Control-Allow-Credentials true always;

    # 处理预检请求
    if ($request_method = 'OPTIONS') {
        return 204;
    }

    # 前端
    location / {
        proxy_pass http://127.0.0.1:3005;
    }

    # 后端API
    location /api/ {
        proxy_pass http://127.0.0.1:3006;
    }
}
```

### 2. 配置 HTTPS
```bash
# 使用 Let's Encrypt
sudo certbot --nginx -d yourdomain.com

# 自动续期
sudo crontab -e
0 0 * * * certbot renew --quiet
```

### 3. 严格限制域名
生产环境应只允许自己的域名：

```javascript
const defaultOrigins = [
    'https://yourdomain.com',
    'https://www.yourdomain.com'
];
```

### 4. 移除调试日志
```javascript
// 生产环境移除
// console.warn('❌ CORS拒绝:', origin);
```

## 常见错误及解决

### 错误1：CORS 预检失败
**症状**：OPTIONS 请求返回 403 或 500

**解决**：
```javascript
// 确保包含 OPTIONS 方法
methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
```

### 错误2：携带凭证失败
**症状**：Cookie 或 Authorization 头丢失

**解决**：
```javascript
// 后端配置
credentials: true

// 前端请求
fetch(url, {
    credentials: 'include'  // 必须设置
})
```

### 错误3：自定义请求头被拒绝
**症状**：`X-Custom-Header` 等自定义头被阻止

**解决**：
```javascript
allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'X-Custom-Header'  // 添加自定义头
]
```

## 验证清单

- ✅ 后端已重启
- ✅ CORS配置包含所有需要的origin
- ✅ 正则表达式正确匹配内网IP
- ✅ 浏览器已清除缓存
- ✅ Network标签无CORS错误
- ✅ 所有API请求返回200

## 更新时间

2025-11-12 11:15

## 状态

✅ **CORS配置完成，支持本地、公网、内网所有访问场景**

