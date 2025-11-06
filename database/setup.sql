-- Monaco Editor 项目数据库设置脚本
-- 请使用以下命令运行此脚本：
-- mysql -u root -p < setup.sql

-- 创建数据库
CREATE DATABASE IF NOT EXISTS monaco_editor_db
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

-- 创建专用用户（可选，更安全）
CREATE USER IF NOT EXISTS 'monaco_user'@'localhost' IDENTIFIED BY 'monaco_password_2024';
GRANT ALL PRIVILEGES ON monaco_editor_db.* TO 'monaco_user'@'localhost';
FLUSH PRIVILEGES;

-- 使用新创建的数据库
USE monaco_editor_db;

-- 创建用户表
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

-- 创建代码片段表
CREATE TABLE IF NOT EXISTS code_snippets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    title VARCHAR(200) NOT NULL,
    language VARCHAR(50) NOT NULL,
    code_content LONGTEXT NOT NULL,
    description TEXT,
    tags JSON,
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 创建AI对话记录表
CREATE TABLE IF NOT EXISTS ai_conversations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    session_id VARCHAR(100) NOT NULL,
    message_type ENUM('user', 'ai') NOT NULL,
    content LONGTEXT NOT NULL,
    metadata JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_session_id (session_id),
    INDEX idx_user_id (user_id)
);

-- 创建项目表
CREATE TABLE IF NOT EXISTS projects (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    settings JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 创建项目文件表
CREATE TABLE IF NOT EXISTS project_files (
    id INT AUTO_INCREMENT PRIMARY KEY,
    project_id INT,
    filename VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    content LONGTEXT,
    file_type VARCHAR(50),
    size_bytes INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    UNIQUE KEY unique_project_file (project_id, file_path)
);

-- 创建系统配置表
CREATE TABLE IF NOT EXISTS system_config (
    id INT AUTO_INCREMENT PRIMARY KEY,
    config_key VARCHAR(100) NOT NULL UNIQUE,
    config_value LONGTEXT,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 插入默认配置
INSERT INTO system_config (config_key, config_value, description) VALUES
('app_name', 'Monaco Editor AI', '应用程序名称'),
('app_version', '1.0.0', '应用程序版本'),
('max_file_size', '10485760', '最大文件大小（字节）'),
('supported_languages', '["javascript", "typescript", "python", "java", "cpp", "csharp", "go", "rust", "php", "ruby", "swift", "kotlin"]', '支持的语言列表'),
('ai_enabled', 'true', '是否启用AI功能'),
('ai_model', 'gpt-3.5-turbo', '默认AI模型'),
('ai_max_tokens', '1000', 'AI最大token数'),
('ai_temperature', '0.7', 'AI温度参数')
ON DUPLICATE KEY UPDATE
config_value = VALUES(config_value),
updated_at = CURRENT_TIMESTAMP;

-- 创建索引以提高查询性能
CREATE INDEX idx_code_snippets_user_id ON code_snippets(user_id);
CREATE INDEX idx_code_snippets_language ON code_snippets(language);
CREATE INDEX idx_code_snippets_public ON code_snippets(is_public);
CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_project_files_project_id ON project_files(project_id);
CREATE INDEX idx_ai_conversations_created_at ON ai_conversations(created_at);

-- 显示创建的表
SHOW TABLES;

-- 显示数据库信息
SELECT 'Monaco Editor 数据库创建完成！' as message;
SELECT DATABASE() as current_database;
SELECT COUNT(*) as table_count FROM information_schema.tables WHERE table_schema = 'monaco_editor_db';

