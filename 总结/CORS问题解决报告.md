# CORS 问题解决报告

## 问题描述

前端从 `http://8.152.98.33:8300` 访问后端 `http://localhost:3006` 时出现 CORS 错误：

```
Access to fetch at 'http://localhost:3006/api/auth/login' from origin 'http://8.152.98.33:8300'
has been blocked by CORS policy: Response to preflight request doesn't pass access control check:
No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

## 问题原因

后端的 CORS 配置只允许了以下源：
- `http://localhost:3005`
- `http://localhost:3006`

没有包含 `http://8.152.98.33:8300`，导致跨域请求被阻止。

## 解决方案

### 1. 更新 CORS 配置

修改了 `backend/server.js` 中的 CORS 配置：

**修改前**：
```javascript
const corsOptions = {
    origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : ['http://localhost:3005', 'http://localhost:3006'],
    credentials: true,
    optionsSuccessStatus: 200
};
```

**修改后**：
```javascript
const defaultOrigins = [
    'http://localhost:3005',
    'http://localhost:3006',
    'http://8.152.98.33:8300'
];

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
            // 允许 8.152.98.33 的所有端口
            if (origin.match(/^http:\/\/8\.152\.98\.33:\d+$/)) {
                callback(null, true);
            } else {
                callback(new Error('不允许的 CORS 源'));
            }
        }
    },
    credentials: true,
    optionsSuccessStatus: 200,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};
```

### 2. 更新环境变量

更新了 `backend/.env` 文件：
```env
CORS_ORIGIN=http://localhost:3005,http://localhost:3006,http://8.152.98.33:8300
```

### 3. 重启后端服务器

重启后端服务器使配置生效。

## 验证结果

### OPTIONS 预检请求测试
```bash
curl -X OPTIONS http://localhost:3006/api/auth/login \
  -H "Origin: http://8.152.98.33:8300" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: content-type" -v
```

**响应头**：
```
HTTP/1.1 200 OK
Access-Control-Allow-Origin: http://8.152.98.33:8300
Access-Control-Allow-Credentials: true
Access-Control-Allow-Methods: GET,POST,PUT,DELETE,OPTIONS
Access-Control-Allow-Headers: Content-Type,Authorization,X-Requested-With
```

### POST 请求测试
```bash
curl -X POST http://localhost:3006/api/auth/login \
  -H "Origin: http://8.152.98.33:8300" \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"Ad123456"}' -v
```

**响应头**：
```
HTTP/1.1 200 OK
Access-Control-Allow-Origin: http://8.152.98.33:8300
Access-Control-Allow-Credentials: true
```

## 配置特性

### 1. 灵活的源配置
- 支持通过环境变量 `CORS_ORIGIN` 配置允许的源
- 默认包含常用源和 `8.152.98.33:8300`

### 2. 动态端口支持
- 允许 `8.152.98.33` 的所有端口（通过正则表达式匹配）
- 格式：`http://8.152.98.33:端口号`

### 3. 完整的 CORS 支持
- 支持预检请求（OPTIONS）
- 支持凭证（credentials）
- 明确指定允许的方法和请求头

## 允许的源列表

当前配置允许以下源：

1. `http://localhost:3005` - 本地前端开发服务器
2. `http://localhost:3006` - 本地后端服务器
3. `http://8.152.98.33:8300` - 远程前端服务器
4. `http://8.152.98.33:*` - 该 IP 的所有端口（动态匹配）

## 添加新的允许源

### 方法1：修改代码（永久）
编辑 `backend/server.js`，在 `defaultOrigins` 数组中添加新源：
```javascript
const defaultOrigins = [
    'http://localhost:3005',
    'http://localhost:3006',
    'http://8.152.98.33:8300',
    'http://新域名:端口'  // 添加新源
];
```

### 方法2：使用环境变量（推荐）
编辑 `backend/.env` 文件：
```env
CORS_ORIGIN=http://localhost:3005,http://localhost:3006,http://8.152.98.33:8300,http://新域名:端口
```

然后重启后端服务器。

## 安全建议

1. **生产环境**：只允许信任的域名，避免使用通配符
2. **IP 地址**：如果 IP 地址会变化，考虑使用域名
3. **HTTPS**：生产环境应使用 HTTPS，并配置相应的 CORS 源

## 相关文件

- `backend/server.js` - CORS 配置代码
- `backend/.env` - 环境变量配置

## 更新日期

2024-11-12

## 状态

✅ **问题已解决**

CORS 配置已更新，前端可以正常访问后端 API。

