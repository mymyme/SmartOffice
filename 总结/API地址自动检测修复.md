# API地址自动检测修复

## 问题描述

当通过远程IP地址（如 `http://8.152.98.33:3005`）访问前端页面时，页面仍然硬编码请求 `http://localhost:3006/api`，导致 `ERR_CONNECTION_REFUSED` 错误。

## 根本原因

所有前端HTML文件中的 `API_BASE_URL` 都硬编码为 `localhost`：
```javascript
const API_BASE_URL = 'http://localhost:3006/api';
```

这在远程访问时会失败，因为：
- 前端通过 `http://8.152.98.33:3005` 访问
- 但API请求发送到 `http://localhost:3006`（浏览器本地）
- 用户本地机器上没有运行后端服务器

## 修复方案 ✅

### 方案：自动检测访问方式

根据浏览器访问的hostname自动选择API地址：

```javascript
// 自动检测API地址：如果通过IP访问，则使用相同IP的3006端口
const isRemoteAccess = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
const API_BASE_URL = isRemoteAccess
    ? `http://${window.location.hostname}:3006/api`
    : 'http://localhost:3006/api';
console.log('API地址:', API_BASE_URL);
```

### 逻辑说明

| 访问地址 | hostname | isRemoteAccess | API_BASE_URL |
|---------|----------|----------------|--------------|
| `http://localhost:3005/admin.html` | `localhost` | `false` | `http://localhost:3006/api` |
| `http://127.0.0.1:3005/admin.html` | `127.0.0.1` | `false` | `http://localhost:3006/api` |
| `http://8.152.98.33:3005/admin.html` | `8.152.98.33` | `true` | `http://8.152.98.33:3006/api` |
| `http://192.168.1.100:3005/admin.html` | `192.168.1.100` | `true` | `http://192.168.1.100:3006/api` |

## 已修改文件

✅ 以下所有前端HTML文件已更新：

1. `/media/storage/project/aicode/frontend/demos/admin.html`
2. `/media/storage/project/aicode/frontend/demos/visual-editor.html`
3. `/media/storage/project/aicode/frontend/demos/profile.html`
4. `/media/storage/project/aicode/frontend/demos/login.html`

所有文件都在 `<script>` 部分添加了自动检测代码。

## 验证方法

### 1. 本地访问测试
访问 `http://localhost:3005/admin.html`，打开控制台应该看到：
```
API地址: http://localhost:3006/api
```

### 2. 远程访问测试
访问 `http://8.152.98.33:3005/admin.html`，打开控制台应该看到：
```
API地址: http://8.152.98.33:3006/api
```

### 3. 功能测试
- 登录功能正常
- 管理后台可以加载用户列表
- 个人中心可以加载用户信息
- 所有API请求都指向正确的地址

## 部署状态

- ✅ 前端服务器已重启（端口 3005）
- ✅ 后端服务器正常运行（端口 3006）
- ✅ MySQL 数据库正常（端口 3307）

## 使用说明

现在你可以通过以下任何方式访问应用：

1. **本地访问**（开发环境）
   ```
   http://localhost:3005/
   http://127.0.0.1:3005/
   ```

2. **局域网访问**
   ```
   http://192.168.x.x:3005/
   ```

3. **公网访问**
   ```
   http://8.152.98.33:3005/
   http://your-server-ip:3005/
   ```

所有访问方式都会自动请求正确的后端API地址。

## 注意事项

### CORS配置
后端已配置允许 `8.152.98.33` 的所有端口访问：

```javascript
// backend/server.js
if (origin.match(/^http:\/\/8\.152\.98\.33:\d+$/)) {
    callback(null, true);
}
```

### 防火墙设置
确保服务器防火墙允许以下端口：
- 3005（前端）
- 3006（后端）
- 3307（MySQL）

### 生产环境建议
在生产环境中，建议：
1. 使用环境变量配置API地址
2. 使用HTTPS加密通信
3. 使用域名而非IP地址
4. 配置反向代理（如Nginx）统一端口

## 相关配置

### 后端CORS配置
`/media/storage/project/aicode/backend/server.js`:
```javascript
const corsOptions = {
    origin: function (origin, callback) {
        if (!origin) return callback(null, true);

        const allowedOrigins = process.env.CORS_ORIGIN
            ? process.env.CORS_ORIGIN.split(',').map(s => s.trim())
            : ['http://localhost:3005', 'http://localhost:3006', 'http://8.152.98.33:8300'];

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

## 修复时间

2025-11-12 10:25

## 问题总结

这是一个**跨域访问配置**问题：
- 前端通过远程IP访问时，API地址需要动态匹配
- 硬编码 `localhost` 无法支持远程访问场景
- 通过检测 `window.location.hostname` 自动适配访问方式
- 确保前后端在同一服务器上时，端口号保持一致（前端3005，后端3006）

