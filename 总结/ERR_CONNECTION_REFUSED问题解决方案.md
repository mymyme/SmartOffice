# ERR_CONNECTION_REFUSED 问题解决方案

## 问题描述

访问 `visual-editor.html` 时出现以下错误：
```
POST http://localhost:3006/api/auth/login net::ERR_CONNECTION_REFUSED
登录错误: TypeError: Failed to fetch
```

## 根本原因

1. **后端服务器未启动** - 端口 3006 没有服务监听
2. **bcrypt 模块问题** - 已修复（使用 bcryptjs）
3. **数据库连接失败** - MySQL 配置问题

## 解决方案

### ✅ 步骤1：修复 bcrypt 模块（已完成）

已将 `bcrypt` 替换为 `bcryptjs`：
- 修改了 `backend/utils/hash.js`
- 更新了 `backend/package.json`

### ⚠️ 步骤2：配置数据库连接

#### 选项A：使用现有 MySQL（端口 3306）

如果 MySQL 已经在 3306 端口运行，修改 `backend/.env`：

```env
DB_PORT=3306
```

#### 选项B：配置 MySQL 运行在 3307 端口

1. **编辑 MySQL 配置文件**：
   ```bash
   sudo nano /etc/mysql/mysql.conf.d/mysqld.cnf
   # 或
   sudo nano /etc/my.cnf
   ```

2. **添加端口配置**：
   ```ini
   [mysqld]
   port = 3307
   ```

3. **重启 MySQL**：
   ```bash
   sudo systemctl restart mysql
   # 或
   sudo service mysql restart
   ```

#### 选项C：初始化数据库（如果数据库未创建）

1. **使用 root 用户连接 MySQL**：
   ```bash
   mysql -u root -p
   ```

2. **执行初始化脚本**：
   ```bash
   cd /media/storage/project/aicode/database
   mysql -u root -p < setup.sql
   ```

3. **创建管理员账户**：
   ```bash
   cd /media/storage/project/aicode/database
   node init.js
   ```

### ✅ 步骤3：启动后端服务器

```bash
cd /media/storage/project/aicode/backend
npm start
```

**预期输出**：
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚀 Monaco Editor Backend API 已启动！
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   环境: development
   端口: 3006
   地址: http://localhost:3006
   健康检查: http://localhost:3006/health
   API文档: http://localhost:3006/
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### ✅ 步骤4：验证后端服务器

```bash
# 测试健康检查接口
curl http://localhost:3006/health

# 应该返回：
# {
#   "success": true,
#   "message": "Monaco Editor Backend API is running",
#   "version": "2.0.0"
# }
```

### ✅ 步骤5：启动前端服务器

```bash
cd /media/storage/project/aicode/frontend/services
node server.js
```

### ✅ 步骤6：测试登录功能

1. 访问 http://localhost:3005/
2. 点击登录按钮
3. 使用默认管理员账户：
   - 用户名：`admin`
   - 密码：`Ad123456`

## 快速启动脚本

创建 `start-backend-fixed.sh`：

```bash
#!/bin/bash

cd /media/storage/project/aicode/backend

# 检查依赖
if [ ! -d "node_modules" ]; then
    echo "安装依赖..."
    npm install
fi

# 启动服务器
echo "启动后端服务器..."
npm start
```

使用：
```bash
chmod +x start-backend-fixed.sh
./start-backend-fixed.sh
```

## 常见问题

### Q1: 数据库连接失败
**A**: 检查：
1. MySQL 是否运行：`systemctl status mysql`
2. 端口是否正确：`netstat -tlnp | grep mysql`
3. 用户权限是否正确：`mysql -u monaco_user -p`

### Q2: 端口 3006 被占用
**A**: 修改 `backend/.env` 中的 `PORT` 值，或停止占用端口的进程：
```bash
lsof -i :3006
kill -9 <PID>
```

### Q3: bcrypt 错误
**A**: 已修复，使用 `bcryptjs`。如果仍有问题：
```bash
cd backend
rm -rf node_modules/bcrypt
npm install bcryptjs
```

## 验证清单

- [ ] MySQL 服务运行中
- [ ] 数据库 `monaco_editor_db` 已创建
- [ ] 用户 `monaco_user` 已创建并有权限
- [ ] `backend/.env` 配置正确
- [ ] 后端服务器成功启动（端口 3006）
- [ ] 健康检查接口返回成功
- [ ] 前端服务器运行中（端口 3005）
- [ ] 登录功能正常工作

## 相关文件

- `backend/.env` - 环境变量配置
- `backend/utils/hash.js` - 密码加密（已修复）
- `backend/package.json` - 依赖配置（已更新）
- `database/config.js` - 数据库配置
- `database/setup.sql` - 数据库初始化脚本

## 更新日期

2024-11-12

