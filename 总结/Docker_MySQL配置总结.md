# Docker MySQL 配置总结

## 配置概述

已成功配置 Docker MySQL 容器，用于 Monaco Editor 项目数据库服务。

## 配置详情

### 端口配置
- **外部端口**: 3307
- **容器内部端口**: 3306
- **状态**: 端口 3307 可用，已成功配置

### 数据存储
- **数据目录**: `/media/storage/monaco_editor_db`
- **挂载方式**: Docker volume 挂载
- **权限**: 755

### 数据库信息
- **数据库名**: `monaco_editor_db`
- **字符集**: utf8mb4
- **排序规则**: utf8mb4_unicode_ci

### 用户配置
- **Root 用户**:
  - 用户名: `root`
  - 密码: `root_password_2024`
- **应用用户**:
  - 用户名: `monaco_user`
  - 密码: `monaco_password_2024`
  - 权限: 对 `monaco_editor_db` 数据库拥有所有权限

## Docker 配置

### 容器信息
- **容器名**: `monaco-editor-mysql`
- **镜像**: `mysql:8.0`
- **重启策略**: `unless-stopped`

### 配置文件
- **文件路径**: `/media/storage/project/aicode/docker-compose.mysql.yml`

### 启动命令
```bash
cd /media/storage/project/aicode
docker-compose -f docker-compose.mysql.yml up -d
```

### 停止命令
```bash
docker-compose -f docker-compose.mysql.yml down
```

### 查看日志
```bash
docker logs monaco-editor-mysql
```

### 查看状态
```bash
docker ps | grep monaco-editor-mysql
```

## 数据库初始化

### 表结构
已创建以下数据表：
- `users` - 用户表
- `sessions` - 会话表
- `user_logs` - 用户操作日志表
- `code_snippets` - 代码片段表
- `ai_conversations` - AI对话记录表
- `projects` - 项目表
- `project_files` - 项目文件表
- `system_config` - 系统配置表

### 管理员账户
- **用户名**: `admin`
- **密码**: `Ad123456`
- **邮箱**: `admin@monaco-editor.local`
- **角色**: `admin`

⚠️ **重要**: 首次登录后请立即修改默认密码！

## 连接测试

### 命令行连接
```bash
mysql -h 127.0.0.1 -P 3307 -u monaco_user -p'monaco_password_2024' monaco_editor_db
```

### 应用连接
后端服务器已成功连接数据库，配置如下：
- **主机**: `localhost`
- **端口**: `3307`
- **用户**: `monaco_user`
- **数据库**: `monaco_editor_db`

## 项目配置更新

### 已更新的文件
1. `database/config.js` - 数据目录路径已更新为 `/media/storage/monaco_editor_db`
2. `backend/.env` - 数据库端口配置为 3307（如果存在）

### 环境变量
```env
DB_HOST=localhost
DB_PORT=3307
DB_USER=monaco_user
DB_PASSWORD=monaco_password_2024
DB_NAME=monaco_editor_db
DB_DATA_DIR=/media/storage/monaco_editor_db
```

## 验证步骤

### 1. 检查容器状态
```bash
docker ps | grep monaco-editor-mysql
```

### 2. 测试数据库连接
```bash
mysql -h 127.0.0.1 -P 3307 -u monaco_user -p'monaco_password_2024' -e "SELECT 1;"
```

### 3. 检查数据目录
```bash
ls -lh /media/storage/monaco_editor_db
```

### 4. 测试后端连接
```bash
curl http://localhost:3006/health
```

## 常见问题

### Q1: 容器无法启动
**A**: 检查：
1. 端口是否被占用：`lsof -i :3307`
2. 数据目录权限：`ls -ld /media/storage/monaco_editor_db`
3. Docker 服务是否运行：`systemctl status docker`

### Q2: 无法连接数据库
**A**: 检查：
1. 容器是否运行：`docker ps | grep monaco-editor-mysql`
2. 端口映射是否正确：`docker port monaco-editor-mysql`
3. 用户权限是否正确

### Q3: 数据丢失
**A**: 数据存储在 `/media/storage/monaco_editor_db`，只要该目录存在，数据不会丢失。

## 备份和恢复

### 备份数据库
```bash
docker exec monaco-editor-mysql mysqldump -u root -proot_password_2024 monaco_editor_db > backup.sql
```

### 恢复数据库
```bash
docker exec -i monaco-editor-mysql mysql -u root -proot_password_2024 monaco_editor_db < backup.sql
```

## 维护命令

### 重启容器
```bash
docker-compose -f docker-compose.mysql.yml restart
```

### 查看资源使用
```bash
docker stats monaco-editor-mysql
```

### 进入容器
```bash
docker exec -it monaco-editor-mysql bash
```

## 更新日期

2024-11-12

