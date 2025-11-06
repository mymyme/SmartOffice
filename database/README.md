# Monaco Editor 数据库配置

## 📋 概述

本项目使用 MySQL 数据库存储用户数据、代码片段、AI对话记录等信息。数据库运行在 **3307 端口**，避免与现有数据库冲突。

## 🚀 快速安装

### 1. 安装依赖

```bash
cd /media/storage/project/aicode
npm install mysql2
```

### 2. 创建数据库

**方法一：使用初始化脚本（推荐）**

```bash
# 确保 MySQL 服务运行在 3307 端口
node database/init.js
```

**方法二：手动执行 SQL**

```bash
# 连接到 MySQL (端口 3307)
mysql -h localhost -P 3307 -u root -p

# 执行 SQL 脚本
source database/setup.sql;
```

### 3. 验证安装

```bash
# 测试数据库连接
node -e "
const { testConnection } = require('./database/connection');
testConnection().then(success => process.exit(success ? 0 : 1));
"
```

## 🗄️ 数据库结构

### 数据库信息
- **数据库名**: `monaco_editor_db`
- **端口**: `3307`
- **字符集**: `utf8mb4`
- **排序规则**: `utf8mb4_unicode_ci`

### 数据表

| 表名 | 说明 | 主要字段 |
|------|------|----------|
| `users` | 用户表 | id, username, email, password_hash |
| `code_snippets` | 代码片段表 | id, user_id, title, language, code_content |
| `ai_conversations` | AI对话记录表 | id, user_id, session_id, message_type, content |
| `projects` | 项目表 | id, user_id, name, description, settings |
| `project_files` | 项目文件表 | id, project_id, filename, file_path, content |
| `system_config` | 系统配置表 | id, config_key, config_value, description |

## ⚙️ 配置说明

### 数据库连接配置

```javascript
// database/config.js
{
    host: 'localhost',
    port: 3307,  // 使用 3307 端口
    user: 'monaco_user',
    password: 'monaco_password_2024',
    database: 'monaco_editor_db'
}
```

### 环境变量

创建 `.env` 文件：

```env
DB_HOST=localhost
DB_PORT=3307
DB_USER=monaco_user
DB_PASSWORD=monaco_password_2024
DB_NAME=monaco_editor_db
```

## 🔧 使用示例

### 基本查询

```javascript
const { query } = require('./database/connection');

// 查询所有用户
const users = await query('SELECT * FROM users');

// 插入代码片段
await query(
    'INSERT INTO code_snippets (user_id, title, language, code_content) VALUES (?, ?, ?, ?)',
    [1, 'Hello World', 'javascript', 'console.log("Hello World");']
);
```

### 事务处理

```javascript
const { transaction } = require('./database/connection');

await transaction(async (connection) => {
    // 创建项目
    const [result] = await connection.execute(
        'INSERT INTO projects (user_id, name) VALUES (?, ?)',
        [userId, projectName]
    );

    // 创建项目文件
    await connection.execute(
        'INSERT INTO project_files (project_id, filename, content) VALUES (?, ?, ?)',
        [result.insertId, 'index.js', fileContent]
    );
});
```

## 🛠️ 维护操作

### 备份数据库

```bash
mysqldump -h localhost -P 3307 -u monaco_user -p monaco_editor_db > backup.sql
```

### 恢复数据库

```bash
mysql -h localhost -P 3307 -u monaco_user -p monaco_editor_db < backup.sql
```

### 查看数据库状态

```bash
mysql -h localhost -P 3307 -u monaco_user -p -e "SHOW DATABASES;"
mysql -h localhost -P 3307 -u monaco_user -p -e "USE monaco_editor_db; SHOW TABLES;"
```

## 🔒 安全建议

1. **修改默认密码**: 更改 `monaco_password_2024` 为强密码
2. **限制用户权限**: 只授予必要的数据库权限
3. **定期备份**: 设置自动备份策略
4. **监控连接**: 监控数据库连接和性能

## 📞 故障排除

### 连接被拒绝

```bash
# 检查 MySQL 服务状态
systemctl status mysql

# 检查端口是否被占用
netstat -tlnp | grep 3307

# 检查 MySQL 配置
mysql -h localhost -P 3307 -u root -p -e "SHOW VARIABLES LIKE 'port';"
```

### 权限问题

```sql
-- 创建用户并授权
CREATE USER 'monaco_user'@'localhost' IDENTIFIED BY 'monaco_password_2024';
GRANT ALL PRIVILEGES ON monaco_editor_db.* TO 'monaco_user'@'localhost';
FLUSH PRIVILEGES;
```

---

**注意**: 请确保 MySQL 服务运行在 3307 端口，避免与现有数据库冲突。

