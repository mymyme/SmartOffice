# FRP 配置和重启指南

## 配置更新

### 已修改的配置文件
`/home/bn/project/frp/frpc.toml`

### 新增配置
```toml
# Monaco Editor 前端服务 (local 3005 -> remote 8300)
[monaco-frontend-8300]
type = "tcp"
local_ip = "127.0.0.1"
local_port = 3005
remote_port = 8300

# Monaco Editor 后端API (local 3006 -> remote 8301)
[monaco-backend-8301]
type = "tcp"
local_ip = "127.0.0.1"
local_port = 3006
remote_port = 8301
```

## 端口映射关系

| 服务 | 本地端口 | FRP远程端口 | 公网访问地址 |
|------|---------|------------|-------------|
| 前端服务器 | 3005 | 8300 | `http://8.152.98.33:8300` |
| 后端API | 3006 | 8301 | `http://8.152.98.33:8301` |

## 前端API地址自动检测逻辑

所有前端HTML文件已更新为：

```javascript
// 自动检测API地址
const isRemoteAccess = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
let apiPort;
if (isRemoteAccess) {
    // 通过FRP访问：8300端口(前端) -> 8301端口(后端API)
    apiPort = window.location.port === '8300' ? '8301' : '3006';
} else {
    // 本地访问：3005端口(前端) -> 3006端口(后端API)
    apiPort = '3006';
}
const API_BASE_URL = isRemoteAccess
    ? `http://${window.location.hostname}:${apiPort}/api`
    : 'http://localhost:3006/api';
```

### 逻辑说明

| 访问地址 | 检测结果 | API地址 |
|---------|---------|---------|
| `http://localhost:3005/admin.html` | 本地访问 | `http://localhost:3006/api` |
| `http://8.152.98.33:8300/admin.html` | FRP远程访问 | `http://8.152.98.33:8301/api` |
| `http://8.152.98.33:3005/admin.html` | 直接IP访问 | `http://8.152.98.33:3006/api` |

## 重启 FRP 客户端

### 方法1：使用 systemctl（如果配置了服务）
```bash
sudo systemctl restart frpc
```

### 方法2：手动重启进程
```bash
# 查找FRP进程
ps aux | grep frpc

# 停止旧进程（替换PID为实际进程号）
sudo kill 3113670

# 启动新进程
sudo /home/bn/project/frp/frpc -c /home/bn/project/frp/frpc.toml &
```

### 方法3：重新加载配置（推荐）
```bash
# 向FRP进程发送重载信号
sudo kill -USR1 3113670
```

## 验证 FRP 状态

### 1. 检查 FRP 进程
```bash
ps aux | grep frpc | grep -v grep
```

应该看到：
```
root     3113670  ... /home/bn/project/frp/frpc -c /home/bn/project/frp/frpc.toml
```

### 2. 检查端口监听
```bash
netstat -tuln | grep -E "8300|8301"
```

应该看到：
```
tcp6       0      0 :::8300                 :::*                    LISTEN
tcp6       0      0 :::8301                 :::*                    LISTEN
```

### 3. 测试公网访问
```bash
# 测试前端
curl -I http://8.152.98.33:8300/

# 测试后端
curl http://8.152.98.33:8301/
```

## 后端 CORS 配置更新

需要确保后端允许8300端口的跨域访问。

检查 `backend/server.js` 中的CORS配置：

```javascript
const corsOptions = {
    origin: function (origin, callback) {
        if (!origin) return callback(null, true);

        const defaultOrigins = [
            'http://localhost:3005',
            'http://localhost:3006',
            'http://8.152.98.33:8300',  // FRP前端端口
            'http://8.152.98.33:8301'   // FRP后端端口
        ];

        const allowedOrigins = process.env.CORS_ORIGIN
            ? process.env.CORS_ORIGIN.split(',').map(s => s.trim())
            : defaultOrigins;

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

后端已配置允许 `8.152.98.33` 的所有端口，所以8300和8301端口都会被允许。

## 防火墙配置

如果服务器启用了防火墙，需要确保以下端口开放：

```bash
# FRP服务端口（如果需要）
sudo ufw allow 7000/tcp

# Monaco Editor 前端（本地端口，FRP会监听）
sudo ufw allow 3005/tcp

# Monaco Editor 后端（本地端口，FRP会监听）
sudo ufw allow 3006/tcp

# 检查防火墙状态
sudo ufw status
```

注意：8300和8301是FRP隧道端口，在本地服务器上不需要直接开放，FRP客户端会自动处理。

## 完整的访问流程

### 公网访问流程
```
用户浏览器
    ↓ 访问 http://8.152.98.33:8300/admin.html
FRP服务器 (8.152.98.33:8300)
    ↓ 转发到
FRP客户端 (本地)
    ↓ 转发到
前端服务器 (localhost:3005)
    ↓ 返回HTML页面

用户浏览器（JavaScript）
    ↓ 请求 http://8.152.98.33:8301/api/admin/users
FRP服务器 (8.152.98.33:8301)
    ↓ 转发到
FRP客户端 (本地)
    ↓ 转发到
后端服务器 (localhost:3006)
    ↓ 返回JSON数据
```

### 本地访问流程
```
用户浏览器
    ↓ 访问 http://localhost:3005/admin.html
前端服务器 (localhost:3005)
    ↓ 返回HTML页面

用户浏览器（JavaScript）
    ↓ 请求 http://localhost:3006/api/admin/users
后端服务器 (localhost:3006)
    ↓ 返回JSON数据
```

## 已更新的文件

### FRP配置
- ✅ `/home/bn/project/frp/frpc.toml`

### 前端HTML文件
- ✅ `/media/storage/project/aicode/frontend/demos/admin.html`
- ✅ `/media/storage/project/aicode/frontend/demos/visual-editor.html`
- ✅ `/media/storage/project/aicode/frontend/demos/profile.html`
- ✅ `/media/storage/project/aicode/frontend/demos/login.html`

### 后端配置
- ✅ `/media/storage/project/aicode/backend/server.js`（已监听0.0.0.0）

## 测试步骤

### 步骤1：重启FRP客户端
```bash
sudo kill -USR1 3113670
# 或
sudo systemctl restart frpc
```

### 步骤2：验证端口监听
```bash
netstat -tuln | grep -E "8300|8301"
```

应该看到两个端口都在监听。

### 步骤3：访问公网地址
打开浏览器访问：
```
http://8.152.98.33:8300/admin.html
```

### 步骤4：查看浏览器控制台
按 F12 打开控制台，应该看到：
```
API地址: http://8.152.98.33:8301/api (访问方式: 远程 )
```

### 步骤5：验证功能
- 登录功能
- 用户列表加载
- 新增/编辑/删除用户
- 统计信息显示

## 故障排查

### 问题1：8301端口未监听
**症状**：`netstat` 未显示8301端口

**解决方法**：
1. 检查FRP配置文件是否正确
2. 重启FRP客户端
3. 查看FRP日志：`tail -f /var/log/frpc.log`

### 问题2：前端显示"加载中"
**症状**：管理后台一直显示加载中

**解决方法**：
1. 打开浏览器控制台查看API地址
2. 确认显示 `http://8.152.98.33:8301/api`
3. 查看Network标签中的请求状态
4. 如果是CORS错误，检查后端CORS配置

### 问题3：API请求超时
**症状**：请求发出但无响应

**解决方法**：
1. 确认后端服务器正在运行：`lsof -i :3006`
2. 确认后端监听0.0.0.0：`ss -tlnp | grep 3006`
3. 测试本地API：`curl http://localhost:3006/`
4. 检查FRP连接状态

## 下一步操作

1. ⚠️ **需要手动操作**：重启FRP客户端以应用新配置
   ```bash
   sudo systemctl restart frpc
   ```

2. ✅ **已完成**：前端HTML文件已更新API地址检测逻辑

3. ✅ **已完成**：后端服务器已监听0.0.0.0

4. ✅ **已完成**：前端服务器已重启

5. ⏭️ **待验证**：访问 `http://8.152.98.33:8300/admin.html` 测试功能

## 更新时间

2025-11-12 10:45

