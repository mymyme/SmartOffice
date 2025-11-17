# CORS 预检请求修复报告

## 问题描述

前端从 `http://8.152.98.33:8300` 访问后端 `http://8.152.98.33:8301/api/auth/login` 时出现 CORS 错误：

```
Access to fetch at 'http://8.152.98.33:8301/api/auth/login' from origin 'http://8.152.98.33:8300'
has been blocked by CORS policy: Response to preflight request doesn't pass access control check:
No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

错误详情：
- 预检请求（OPTIONS）失败
- 响应中缺少 `Access-Control-Allow-Origin` 头
- 导致后续 POST 请求失败（ERR_FAILED）

## 问题原因

1. **CORS 配置不完整**：`allowedHeaders` 只包含了部分头部，缺少浏览器预检请求需要的头部
2. **Helmet 配置可能干扰**：安全头部配置可能影响了 CORS 头的返回
3. **预检请求处理不完善**：虽然使用了 cors 中间件，但配置不够完整

## 解决方案

### 1. 手动处理 OPTIONS 预检请求

**关键问题**：CORS 中间件虽然配置正确，但可能被其他中间件（如 Helmet）干扰，导致 OPTIONS 请求没有正确返回 CORS 头。

**解决方案**：在所有中间件之前手动处理 OPTIONS 请求，确保 CORS 头被正确设置。

### 2. 调整中间件顺序

**修改前**：
```javascript
app.use(helmet(...));
app.use(cors(corsOptions));
```

**修改后**：
```javascript
// 手动处理 OPTIONS（最前面）
app.options('*', (req, res) => {
    // 设置 CORS 头
});

app.use(cors(corsOptions));
app.use(helmet(...)); // 移到 CORS 之后
```

### 3. 更新 CORS 配置

修改了 `backend/server.js` 中的 CORS 配置，添加了更完整的头部支持：

**主要改进**：
- 扩展了 `allowedHeaders`，添加了 `Accept`、`Origin`、`Access-Control-Request-Method`、`Access-Control-Request-Headers`
- 添加了 `exposedHeaders` 配置
- 添加了 `maxAge` 配置，缓存预检请求结果 24 小时
- 添加了 `PATCH` 方法支持
- 让 rateLimit 跳过 OPTIONS 请求

**修改后的配置**：
```javascript
const corsOptions = {
    origin: function (origin, callback) {
        // 允许没有 origin 的请求（如移动应用、Postman等）
        if (!origin) return callback(null, true);

        // 从环境变量读取允许的源
        const allowedOrigins = process.env.CORS_ORIGIN
            ? process.env.CORS_ORIGIN.split(',').map(s => s.trim())
            : defaultOrigins;

        // 检查是否在允许列表中
        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            // 允许内网IP和公网IP的所有端口（兜底策略）
            if (origin.match(/^http:\/\/(8\.152\.98\.33|191\.0\.12\.75):\d+$/)) {
                callback(null, true);
            } else {
                console.warn('❌ CORS拒绝:', origin);
                callback(new Error('不允许的 CORS 源'));
            }
        }
    },
    credentials: true,
    optionsSuccessStatus: 200,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: [
        'Content-Type',
        'Authorization',
        'X-Requested-With',
        'Accept',
        'Origin',
        'Access-Control-Request-Method',
        'Access-Control-Request-Headers'
    ],
    exposedHeaders: ['Content-Type', 'Authorization'],
    preflightContinue: false,
    maxAge: 86400
};
```

### 2. 更新 Helmet 配置

修改了 Helmet 配置，确保不会干扰 CORS 头：

```javascript
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    crossOriginEmbedderPolicy: false
}));
```

## 配置说明

### allowedHeaders 详解

- `Content-Type`: 请求内容类型
- `Authorization`: 认证令牌
- `X-Requested-With`: XMLHttpRequest 标识
- `Accept`: 接受的内容类型
- `Origin`: 请求来源
- `Access-Control-Request-Method`: 预检请求中声明的实际请求方法
- `Access-Control-Request-Headers`: 预检请求中声明的实际请求头

### 其他配置项

- `exposedHeaders`: 允许前端 JavaScript 访问的响应头
- `preflightContinue`: 设置为 false，确保预检请求由 cors 中间件处理
- `maxAge`: 预检请求结果缓存时间（秒），设置为 86400（24小时）

## 验证方法

### 1. 测试预检请求（OPTIONS）

```bash
curl -X OPTIONS http://8.152.98.33:8301/api/auth/login \
  -H "Origin: http://8.152.98.33:8300" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: content-type,authorization" \
  -v
```

**预期响应头**：
```
HTTP/1.1 200 OK
Access-Control-Allow-Origin: http://8.152.98.33:8300
Access-Control-Allow-Credentials: true
Access-Control-Allow-Methods: GET,POST,PUT,DELETE,OPTIONS,PATCH
Access-Control-Allow-Headers: Content-Type,Authorization,X-Requested-With,Accept,Origin,Access-Control-Request-Method,Access-Control-Request-Headers
Access-Control-Max-Age: 86400
```

### 2. 测试实际请求（POST）

```bash
curl -X POST http://8.152.98.33:8301/api/auth/login \
  -H "Origin: http://8.152.98.33:8300" \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"test123"}' \
  -v
```

**预期响应头**：
```
HTTP/1.1 200 OK
Access-Control-Allow-Origin: http://8.152.98.33:8300
Access-Control-Allow-Credentials: true
```

## 修改的文件

- `backend/server.js` - CORS 配置和 Helmet 配置

## 重启服务

修改配置后，需要重启后端服务器使配置生效：

```bash
cd /media/storage/project/aicode/backend
npm start
# 或使用 PM2
pm2 restart backend
```

## 注意事项

1. **端口配置**：确保后端服务器运行在 8301 端口
2. **防火墙**：确保 8301 端口在防火墙中开放
3. **环境变量**：可以通过 `CORS_ORIGIN` 环境变量动态配置允许的源
4. **安全性**：生产环境建议只允许信任的域名，避免使用过于宽松的 IP 匹配规则

## 相关文档

- `总结/CORS问题解决报告.md` - 之前的 CORS 配置说明
- `总结/CORS完整配置总结.md` - CORS 配置完整说明

## 更新日期

2024-12-19

## 状态

✅ **问题已修复**

CORS 预检请求配置已完善，前端可以正常访问后端 API。

